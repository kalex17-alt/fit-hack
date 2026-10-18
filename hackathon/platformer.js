/* ==========================================================
   Platformer course (the bonus level after the 8 weeks)

   The level follows the hand-drawn sketch: a set of floating
   platforms from START to FINISH. Fall off and you go back to
   the last platform you stood on.

   Your stats are turned into "levels" in steps of 10
   (rounded DOWN), so a Strength of 88 counts as 80/100:
     Cardio    -> running speed
     Strength  -> jump height
     Endurance -> time allowed to finish the course

   The course can be finished when every stat is 85+ (a level of 80).
   Sections:
     1. Settings & the level layout
     2. Turning stats into abilities
     3. Physics (player movement)
     4. Intro screen
     5. Game loop, drawing and input
   ========================================================== */


/* ==========================================================
   1. SETTINGS & LEVEL LAYOUT
   ========================================================== */

const VIEW_W = 800;            // canvas size (it scales to fit the screen)
const VIEW_H = 450;
const GRAVITY = 1400;          // pixels per second squared
const PLAYER_W = 36;
const PLAYER_H = 40;
const PLATFORM_THICKNESS = 14;

// Platforms from the sketch. x = left edge, y = top edge, w = width.
// All platforms are "jump-through": you can jump up through them from below
// and land on top, which keeps the stacked platforms (Plat B / Plat C) easy to use.
//
//   Route: START -> A -> B -> C -> D -> E -> G -> H -> FINISH
//   (F is an extra stepping stone between B and C. A strong jump, 100 Strength,
//    can even go straight from A up to D.)
const PLATFORMS = [
  { name: "start",  x: 0,    y: 382, w: 200 },
  { name: "A",      x: 351,  y: 381, w: 198 },
  { name: "B",      x: 596,  y: 358, w: 198 },
  { name: "C",      x: 596,  y: 290, w: 198 },   // stacked above B
  { name: "D",      x: 351,  y: 246, w: 198 },
  { name: "E",      x: 666,  y: 213, w: 198 },
  { name: "F",      x: 841,  y: 333, w: 198 },
  { name: "G",      x: 981,  y: 180, w: 198 },
  { name: "H",      x: 1305, y: 195, w: 198 },
  { name: "finish", x: 1620, y: 259, w: 198 }
];

const COURSE = {
  width: 1900,
  platforms: PLATFORMS,
  // Touch the flag to win (it sits on the right end of the finish platform)
  goal: { x: 1760, y: 259 - 70, w: 30, h: 70 }
};

const platformByName = name => PLATFORMS.find(p => p.name === name);


/* ==========================================================
   2. TURNING STATS INTO ABILITIES
   ========================================================== */

// Only whole tens count: 88 -> 80, 79 -> 70, 100 -> 100
const toLevel = stat => Math.min(100, Math.floor(stat / 10) * 10);

// Time limit: a small base plus a little per Endurance level. Kept fairly tight:
// at level 80 it is about 2x the time a quick run needs (22 seconds).
const TIME_BASE = 10;
const TIME_PER_LEVEL = 0.15;

function getAbilities() {
  const cardio = toLevel(game.stats.cardio);
  const strength = toLevel(game.stats.strength);
  const endurance = toLevel(game.stats.endurance);
  return {
    cardioLevel: cardio,
    strengthLevel: strength,
    enduranceLevel: endurance,
    speed: 120 + 160 * (cardio / 100),                          // pixels per second  (80 -> 248)
    jumpSpeed: 380 + 260 * (strength / 100),                    // jump launch speed  (80 -> 588, about 123px high)
    timeLimit: Math.round(TIME_BASE + TIME_PER_LEVEL * endurance) // seconds
  };
}


/* ==========================================================
   3. PHYSICS
   ========================================================== */

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// A new player standing in the middle of a platform
function newPlayerOn(platform) {
  return {
    x: platform.x + platform.w / 2 - PLAYER_W / 2,
    y: platform.y - PLAYER_H,
    w: PLAYER_W, h: PLAYER_H,
    vx: 0, vy: 0,
    onGround: false, coyote: 0, facing: 1,
    platform: platform            // the platform we last stood on (used for respawning)
  };
}

// Moves the player one step. input = { left, right, jump }
function stepPlayer(p, input, dt, abilities) {
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  p.vx = direction * abilities.speed;
  if (direction) p.facing = direction;

  // Jump (allowed for a split second after walking off an edge)
  if (input.jump && p.coyote > 0) {
    p.vy = -abilities.jumpSpeed;
    p.coyote = 0;
  }
  p.vy = Math.min(p.vy + GRAVITY * dt, 1200);

  // Horizontal move (platforms are jump-through, so nothing blocks sideways)
  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(COURSE.width - p.w, p.x));

  // Vertical move: land on a platform only when falling onto its top
  const feetBefore = p.y + p.h;
  p.y += p.vy * dt;
  p.onGround = false;
  for (const s of PLATFORMS) {
    const overHorizontally = p.x + p.w > s.x && p.x < s.x + s.w;
    if (p.vy >= 0 && overHorizontally && feetBefore <= s.y + 0.5 && p.y + p.h >= s.y) {
      p.y = s.y - p.h;
      p.vy = 0;
      p.onGround = true;
      p.platform = s;
    }
  }

  p.coyote = p.onGround ? 0.1 : p.coyote - dt;
}


/* ==========================================================
   4. INTRO SCREEN
   ========================================================== */

let courseLoop = null;   // holds the running game so we can stop it

function showCourseIntro() {
  stopCourse();
  const a = getAbilities();
  const row = (category, name, raw, level, result) => `
    <div class="lvl-row">
      <b>${iconHtml(category)} ${name}</b>
      <span>Your score: ${shown(raw)}, counts as <b>${level}/100</b></span>
      <span>${result}</span>
    </div>`;

  $("#app").innerHTML = `
    <h1 style="font-size:clamp(30px,6vw,52px)">The Marshmallow Course</h1>
    <div class="panel" style="margin-top:16px">
      <div class="center"><div style="width:110px;margin:auto">${drawBlob(character)}</div></div>
      <h2>Your abilities</h2>
      <p class="center" style="margin-top:0">Only whole tens count, so a score of 88 counts as 80!</p>
      ${row("cardio", "Cardio", game.stats.cardio, a.cardioLevel, `Run speed: ${a.cardioLevel}/100`)}
      ${row("strength", "Strength", game.stats.strength, a.strengthLevel, `Jump height: ${a.strengthLevel}/100`)}
      ${row("endurance", "Endurance", game.stats.endurance, a.enduranceLevel, `Time to finish: ${a.timeLimit} seconds`)}
      <p class="center">Hop across the platforms from START to the FINISH flag before time runs out.
        If you fall, you go back to the last platform you stood on.<br>
        <b>Move:</b> Left / Right arrows or A D &nbsp; <b>Jump:</b> Space, Up arrow or W</p>
      <div class="row">
        <button class="btn big" onclick="startCourse()">Go!</button>
        <button class="btn alt" onclick="showFinalScreen()">Back to score</button>
      </div>
    </div>`;
  window.scrollTo(0, 0);
}


/* ==========================================================
   5. GAME LOOP, DRAWING AND INPUT
   ========================================================== */

function stopCourse() {
  if (!courseLoop) return;
  cancelAnimationFrame(courseLoop.frame);
  window.removeEventListener("keydown", courseLoop.onKeyDown);
  window.removeEventListener("keyup", courseLoop.onKeyUp);
  courseLoop = null;
}

function startCourse() {
  stopCourse();
  const abilities = getAbilities();

  $("#app").innerHTML = `
    <div class="panel">
      <div class="course-msg" id="course-msg">Move or jump to start the clock!</div>
      <div class="course-wrap"><canvas id="course" width="${VIEW_W}" height="${VIEW_H}"></canvas></div>
      <div class="touch">
        <button class="btn" id="t-left">Left</button>
        <button class="btn" id="t-jump">Jump</button>
        <button class="btn" id="t-right">Right</button>
      </div>
      <div class="row">
        <button class="btn alt" onclick="startCourse()">Restart</button>
        <button class="btn alt" onclick="showFinalScreen()">Back to score</button>
      </div>
    </div>`;

  const canvas = $("#course");
  const ctx = canvas.getContext("2d");
  const msg = $("#course-msg");

  // The player's drawing (the same marshmallow blob you created)
  const blobImage = new Image();
  blobImage.src = "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(drawBlob(character).replace("<svg ", '<svg width="100" height="100" '));

  // ---- Game state ----
  const input = { left: false, right: false, jump: false };
  let player = newPlayerOn(platformByName("start"));
  let timeLeft = abilities.timeLimit;
  let started = false;
  let status = "playing";            // "playing" | "won" | "lost"
  let lastTime = performance.now();

  // ---- Keyboard + touch input ----
  const keyMap = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
                   ArrowUp: "jump", w: "jump", W: "jump", " ": "jump" };
  const onKeyDown = e => {
    if (keyMap[e.key]) { input[keyMap[e.key]] = true; e.preventDefault(); }
  };
  const onKeyUp = e => {
    if (keyMap[e.key]) { input[keyMap[e.key]] = false; e.preventDefault(); }
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const holdButton = (id, key) => {
    const button = $(id);
    const down = e => { input[key] = true; e.preventDefault(); };
    const up = e => { input[key] = false; e.preventDefault(); };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointerleave", up);
    button.addEventListener("pointercancel", up);
  };
  holdButton("#t-left", "left");
  holdButton("#t-right", "right");
  holdButton("#t-jump", "jump");

  // ---- One frame of the game ----
  function update(dt) {
    if (status !== "playing") return;

    // The clock starts when you first move
    if (!started && (input.left || input.right || input.jump)) {
      started = true;
      msg.textContent = "Go go go!";
    }
    if (!started) return;

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endCourse("lost");
      return;
    }

    stepPlayer(player, input, dt, abilities);

    // Fell off: back to the middle of the last platform you stood on
    if (player.y > VIEW_H + 100) {
      player = newPlayerOn(player.platform);
    }
    // Reached the flag
    if (overlaps(player, COURSE.goal)) {
      endCourse("won");
    }
  }

  function endCourse(result) {
    status = result;
    input.left = input.right = input.jump = false;
    if (result === "won") {
      msg.textContent = `You made it with ${timeLeft.toFixed(1)} seconds left!`;
    } else {
      msg.textContent = "Time's up! More Endurance gives you more time. Try again!";
    }
  }

  // ---- Drawing helpers ----
  function drawCloud(x, y, scale) {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    [[0, 0, 28], [26, -8, 34], [56, 0, 28], [28, 8, 30]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.ellipse(x + dx * scale, y + dy * scale, r * scale, r * 0.7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlatform(s, camX) {
    const x = s.x - camX;
    ctx.fillStyle = "#a9703d";
    ctx.fillRect(x, s.y, s.w, PLATFORM_THICKNESS);
    ctx.fillStyle = "#3ddc97";
    ctx.fillRect(x, s.y, s.w, 6);
    ctx.strokeStyle = "#3b2a5a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, s.y, s.w, PLATFORM_THICKNESS);
  }

  function drawFlag(camX) {
    const g = COURSE.goal;
    const x = g.x - camX;
    ctx.fillStyle = "#3b2a5a";
    ctx.fillRect(x, g.y, 5, g.h);                       // pole
    const size = 12;                                    // checkered flag, 3 x 3 squares
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? "#3b2a5a" : "#ffffff";
        ctx.fillRect(x + 5 + col * size, g.y + row * size, size, size);
      }
    }
  }

  function drawLabel(text, x, y) {
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#3b2a5a";
    ctx.fillText(text, x, y);
    ctx.textAlign = "left";
  }

  function draw() {
    const camX = Math.max(0, Math.min(COURSE.width - VIEW_W, player.x - 300));

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, "#8be0ff");
    sky.addColorStop(1, "#d9f4ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Slow-moving clouds
    for (let i = 0; i < 6; i++) {
      drawCloud(i * 380 - camX * 0.4, 60 + (i % 3) * 45, 0.9);
    }

    // Platforms
    PLATFORMS.forEach(s => drawPlatform(s, camX));
    const start = platformByName("start"), finish = platformByName("finish");
    drawLabel("START", start.x + start.w / 2 - camX, start.y + 34);
    drawLabel("FINISH", finish.x + finish.w / 2 - camX - 20, finish.y + 34);
    drawFlag(camX);

    // Player (the blob image is 100x100 units; scaled to 64px)
    if (blobImage.complete) {
      ctx.save();
      const px = player.x - camX - 14;
      const py = player.y - 18;
      if (player.facing < 0) {
        ctx.translate(px + 64, py);
        ctx.scale(-1, 1);
        ctx.drawImage(blobImage, 0, 0, 64, 64);
      } else {
        ctx.drawImage(blobImage, px, py, 64, 64);
      }
      ctx.restore();
    }

    // HUD: time
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fillRect(10, 10, 150, 36);
    ctx.fillStyle = timeLeft < 8 ? "#e63946" : "#3b2a5a";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`Time: ${timeLeft.toFixed(1)}s`, 20, 36);
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    courseLoop.frame = requestAnimationFrame(frame);
  }

  courseLoop = { frame: 0, onKeyDown, onKeyUp };
  courseLoop.frame = requestAnimationFrame(frame);
  window.scrollTo(0, 0);
}
