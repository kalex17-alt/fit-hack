/* ==========================================================
   Marshmallow Fitness Quest
   Sections:
     1. Game data (exercises, foods)
     2. Character (customization + SVG drawing)
     3. Game state
     4. Screens (home, one-week planner)
     5. Simulation (the plan repeats for 8 weeks) & report
     6. Final score screen (platformer course lives in platformer.js)
   ========================================================== */


/* ==========================================================
   1. GAME DATA
   ========================================================== */

const WEEKS_SIMULATED = 8;  // the one planned week is repeated this many times
const MAX_FOODS = 3;        // foods allowed per day
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Exercise lists (one random exercise from each is offered every day)
const EXERCISES = {
  cardio: [
    "Running", "Jogging", "Jumping rope", "Cycling", "Swimming",
    "Jumping jacks", "Dancing", "Stair climbing", "Elliptical machine", "Brisk walking"
  ],
  strength: [
    "Push-ups", "Squats", "Lunges", "Bicep curls", "Bench press",
    "Deadlifts", "Shoulder press", "Pull-ups", "Tricep dips", "Planks"
  ],
  endurance: [
    "Walking lunges", "Wall sits", "Plank holds", "Cycling", "Long-distance running",
    "Swimming laps", "Rowing", "Hiking", "Jump rope", "Bodyweight squats"
  ]
};

// Display info for each exercise category (icons are pictures in the images folder)
const CATEGORY = {
  cardio:    { icon: "images/cardio.png",    name: "Cardio",    description: "Strengthens your heart & lungs" },
  strength:  { icon: "images/strength.png",  name: "Strength",  description: "Builds strong muscles" },
  endurance: { icon: "images/endurance.jpg", name: "Endurance", description: "Helps you keep going longer" }
};

// Foods: [emoji, name, quality from 0 to 1]
// Quality lowers the weekly food score (e.g. butter is high in fat).
const FOOD = {
  fruit: [
    ["🍎", "Apple", 1], ["🍌", "Banana", 1], ["🍊", "Orange", 1],
    ["🍓", "Strawberry", 1], ["🍇", "Grapes", 1]
  ],
  vegetables: [
    ["🥦", "Broccoli", 1], ["🥕", "Carrots", 1], ["🥬", "Spinach", 1],
    ["🥒", "Cucumber", 1], ["🫑", "Bell Peppers", 1]
  ],
  grain: [
    ["🍚", "Rice", 0.9], ["🥣", "Oatmeal", 1], ["🍞", "Bread", 0.85],
    ["🍝", "Pasta", 0.85], ["🌾", "Quinoa", 1]
  ],
  protein: [
    ["🍗", "Chicken", 1], ["🥚", "Eggs", 1], ["🐟", "Fish", 1],
    ["🫘", "Beans", 1], ["🟨", "Tofu", 1]
  ],
  dairy: [
    ["🥛", "Milk", 1], ["🧀", "Cheese", 0.8], ["🍦", "Yogurt", 1],
    ["🧈", "Butter", 0.4], ["🥣", "Cottage Cheese", 0.95]
  ]
};

const FOOD_GROUPS = Object.keys(FOOD);

// Plain names (no emoji) used in tips
const FOOD_GROUP_NAME = {
  fruit: "Fruit",
  vegetables: "Vegetables",
  grain: "Grains",
  protein: "Protein",
  dairy: "Dairy"
};

const FOOD_GROUP_LABEL = {
  fruit: "Fruit 🍎",
  vegetables: "Vegetables 🥦",
  grain: "Grains 🌾",
  protein: "Protein 🍗",
  dairy: "Dairy 🥛"
};

// Small helpers
const $ = selector => document.querySelector(selector);
const pickRandom = list => list[Math.floor(Math.random() * list.length)];

// Small picture for Cardio / Strength / Endurance. size = CSS class that controls how big it is.
function iconHtml(category, sizeClass = "mini-icon") {
  const info = CATEGORY[category];
  return `<img class="${sizeClass}" src="${info.icon}" alt="${info.name}">`;
}

// Look up a food's quality (0-1) by group and name
function foodQuality(group, name) {
  return FOOD[group].find(food => food[1] === name)[2];
}


/* ==========================================================
   2. CHARACTER
   ========================================================== */

const SKIN_COLORS = ["#fff6ea", "#f7d9b5", "#e2ad78", "#b97a4b", "#7a4a2c", "#ffc9df", "#bfe6ff"];
const HAIR_COLORS = ["#3b2a1a", "#c9772b", "#f2c94c", "#ff6fb5", "#5ec8ff", "#222222"];
const HAIR_STYLES = ["None", "Short", "Long", "Curly", "Spiky", "Ponytail", "Bun"];
const CLOTHES     = ["None", "Blue tee", "Red dress", "Green hoodie", "Sport jersey"];
const HATS        = ["None", "Cap", "Party hat", "Crown", "Beanie", "Wizard hat"];

// The player's current look (each value is an index into the lists above)
let character = { skin: 0, hairColor: 0, hair: 1, cloth: 1, hat: 0 };

// Returns an SVG string of the marshmallow blob wearing the chosen look
function drawBlob(look) {
  const skin = SKIN_COLORS[look.skin];
  const hairColor = HAIR_COLORS[look.hairColor];
  const hair = HAIR_STYLES[look.hair];
  const clothes = CLOTHES[look.cloth];
  const hat = HATS[look.hat];

  let hairBack = "";   // hair drawn behind the body
  let hairFront = "";  // hair drawn on top of the head
  let outfit = "";
  let hatSvg = "";

  // --- Hair behind the body ---
  if (hair === "Long") {
    hairBack = `<rect x="17" y="32" width="66" height="52" rx="24" fill="${hairColor}"/>`;
  }
  if (hair === "Ponytail") {
    hairBack = `<ellipse cx="84" cy="50" rx="8" ry="16" fill="${hairColor}"/>`;
  }

  // --- Hair on top of the head ---
  const hairCap = `<path d="M24 46 Q26 22 50 24 Q74 22 76 46 Q62 34 50 36 Q38 34 24 46Z" fill="${hairColor}"/>`;
  if (["Short", "Long", "Ponytail"].includes(hair)) {
    hairFront = hairCap;
  }
  if (hair === "Bun") {
    hairFront = hairCap + `<circle cx="50" cy="17" r="9" fill="${hairColor}"/>`;
  }
  if (hair === "Curly") {
    hairFront = [28, 38, 50, 62, 72]
      .map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 27 : 31}" r="9" fill="${hairColor}"/>`)
      .join("");
  }
  if (hair === "Spiky") {
    hairFront = `<polygon points="24,42 26,18 38,32 46,12 54,32 64,14 70,32 78,20 76,42 50,34" fill="${hairColor}"/>`;
  }

  // --- Clothes (clipped so they stay inside the body shape) ---
  const clipShape = `<clipPath id="bodyClip"><rect x="22" y="28" width="56" height="62" rx="26"/></clipPath>`;
  const wear = (color, extra = "") =>
    `<g clip-path="url(#bodyClip)"><rect x="20" y="62" width="60" height="32" fill="${color}"/>${extra}</g>`;

  if (clothes === "Blue tee") {
    outfit = wear("#4aa3ff");
  }
  if (clothes === "Red dress") {
    outfit = wear("#ff4d6d", `<rect x="20" y="62" width="60" height="4" fill="#fff"/>`);
  }
  if (clothes === "Green hoodie") {
    outfit = wear("#3ddc97",
      `<rect x="38" y="76" width="24" height="10" rx="4" fill="#2bb87c"/>` +
      `<line x1="44" y1="62" x2="44" y2="72" stroke="#fff" stroke-width="2"/>` +
      `<line x1="56" y1="62" x2="56" y2="72" stroke="#fff" stroke-width="2"/>`);
  }
  if (clothes === "Sport jersey") {
    outfit = wear("#ffd23f",
      `<text x="50" y="82" text-anchor="middle" font-size="16" font-weight="bold" fill="#3b2a5a">7</text>`);
  }

  // --- Hats ---
  if (hat === "Cap") {
    hatSvg = `<path d="M24 38 Q50 12 76 38Z" fill="#e63946"/><rect x="58" y="34" width="30" height="6" rx="3" fill="#e63946"/>`;
  }
  if (hat === "Party hat") {
    hatSvg = `<polygon points="36,34 50,2 64,34" fill="#ff6fb5"/><circle cx="50" cy="3" r="5" fill="#ffd23f"/>` +
             `<line x1="40" y1="24" x2="58" y2="24" stroke="#fff" stroke-width="3"/>`;
  }
  if (hat === "Crown") {
    hatSvg = `<polygon points="30,34 32,14 42,24 50,10 58,24 68,14 70,34" fill="#ffd23f" stroke="#c99700" stroke-width="2"/>`;
  }
  if (hat === "Beanie") {
    hatSvg = `<path d="M25 38 Q50 4 75 38Z" fill="#5ec8ff"/><rect x="24" y="34" width="52" height="7" rx="3" fill="#2e86de"/>` +
             `<circle cx="50" cy="8" r="5" fill="#fff"/>`;
  }
  if (hat === "Wizard hat") {
    hatSvg = `<polygon points="32,34 54,-2 68,34" fill="#9b6dff"/><rect x="22" y="32" width="56" height="6" rx="3" fill="#7b4de0"/>` +
             `<polygon points="50,16 52,22 58,22 53,26 55,32 50,28 45,32 47,26 42,22 48,22" fill="#ffd23f"/>`;
  }

  // --- Put it all together: back hair, body, clothes, hair, face, hat ---
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>${clipShape}</defs>
    ${hairBack}
    <rect x="22" y="28" width="56" height="62" rx="26" fill="${skin}" stroke="#3b2a5a" stroke-width="3"/>
    <ellipse cx="36" cy="40" rx="6" ry="3" fill="#fff" opacity=".6"/>
    ${outfit}
    <rect x="22" y="28" width="56" height="62" rx="26" fill="none" stroke="#3b2a5a" stroke-width="3"/>
    ${hairFront}
    <circle cx="40" cy="52" r="4" fill="#3b2a5a"/>
    <circle cx="60" cy="52" r="4" fill="#3b2a5a"/>
    <circle cx="41.5" cy="50.5" r="1.3" fill="#fff"/>
    <circle cx="61.5" cy="50.5" r="1.3" fill="#fff"/>
    <ellipse cx="32" cy="60" rx="5" ry="3" fill="#ff8fb3" opacity=".6"/>
    <ellipse cx="68" cy="60" rx="5" ry="3" fill="#ff8fb3" opacity=".6"/>
    <path d="M43 61 Q50 69 57 61" stroke="#3b2a5a" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${hatSvg}
  </svg>`;
}


/* ==========================================================
   3. GAME STATE
   ========================================================== */

// game = {
//   energy:        0-100
//   stats:         { cardio, strength, endurance } each 0-100
//   plan:          7 planned days: { opts: [3 exercises], ex: chosen exercise, foods: [{g, n}] }
//   cur:           index (0-6) of the day being planned
//   weeklyHistory: stats after each simulated week (for the progress table)
//   avgEffectiveness: average workout effectiveness over the 8 weeks
// }
let game;

// Offers one Cardio, one Strength and one Endurance exercise (shuffled order)
function rollExerciseOptions() {
  return Object.keys(EXERCISES)
    .map(category => ({ cat: category, name: pickRandom(EXERCISES[category]) }))
    .sort(() => Math.random() - 0.5);
}

function newGame() {
  game = {
    energy: 100,
    stats: { cardio: 10, strength: 10, endurance: 10 },
    plan: DAYS.map(() => ({ opts: rollExerciseOptions(), ex: null, foods: [] })),
    cur: 0,
    weeklyHistory: [],
    avgEffectiveness: 1
  };
}

// A day is ready when it has an activity and at least one food
const isDayPlanned = day => day.ex && day.foods.length >= 1;

// Scores are shown as whole numbers (rounded DOWN, so 88.9 shows as 88)
const shown = value => Math.floor(value);


/* ==========================================================
   4. SCREENS: HOME + ONE-WEEK PLANNER
   ========================================================== */

// Character creator buttons
function optionChips(key, labels) {
  const buttons = labels.map((label, i) =>
    `<button class="chip ${character[key] === i ? "on" : ""}" onclick="setLook('${key}',${i})">${label}</button>`
  ).join("");
  return `<div class="chips">${buttons}</div>`;
}

function colorSwatches(key, colors) {
  const buttons = colors.map((color, i) =>
    `<button class="chip sw ${character[key] === i ? "on" : ""}" style="background:${color}" aria-label="color ${i + 1}" onclick="setLook('${key}',${i})"></button>`
  ).join("");
  return `<div class="chips">${buttons}</div>`;
}

function setLook(key, value) {
  character[key] = value;
  showHome();
}

function showHome() {
  $("#app").innerHTML = `
    <div class="start">
      <h1>Marshmallow<br>Fitness Quest!</h1>
      <p class="center" style="font-size:20px;margin:0;color:#fff;font-weight:bold;text-shadow:0 2px 0 var(--ink)">
        Plan ONE week of workouts &amp; meals. Then see what happens when you repeat it for 8 weeks!
      </p>
      <div class="panel creator">
        <div style="width:170px">${drawBlob(character)}</div>
        <div class="opts">
          <div class="opt"><b>Skin</b>${colorSwatches("skin", SKIN_COLORS)}</div>
          <div class="opt"><b>Hair</b>${optionChips("hair", HAIR_STYLES)}</div>
          <div class="opt"><b>Hair color</b>${colorSwatches("hairColor", HAIR_COLORS)}</div>
          <div class="opt"><b>Clothes</b>${optionChips("cloth", CLOTHES)}</div>
          <div class="opt"><b>Hat</b>${optionChips("hat", HATS)}</div>
        </div>
      </div>
      <button class="btn big" onclick="startGame()">Start!</button>
    </div>`;
}

function startGame() {
  newGame();
  showPlanner();
}

// Top of the game screens: day (left), week (middle), character (right), then stat bars
function headerHtml(dayLabel, weekLabel) {
  const energy = game.energy;
  const energyColor = energy > 50 ? "#3ddc97" : energy > 25 ? "#ffd23f" : "#ff4d6d";

  const statBox = (key, label, color) => `
    <div class="stat">${label} ${shown(game.stats[key])}
      <div class="bar"><i style="width:${game.stats[key]}%;background:${color}"></i></div>
    </div>`;

  return `
    <header>
      <div class="tag">${dayLabel}</div>
      <div class="tag week">${weekLabel}</div>
      <div class="me">${drawBlob(character)}</div>
    </header>
    <div class="stats">
      ${statBox("cardio", iconHtml("cardio") + " Cardio", "#ff6fb5")}
      ${statBox("strength", iconHtml("strength") + " Strength", "#ff9f43")}
      ${statBox("endurance", iconHtml("endurance") + " Endurance", "#3ddc97")}
      <div class="stat">Energy ${Math.round(energy)}
        <div class="bar"><i style="width:${energy}%;background:${energyColor}"></i></div>
      </div>
    </div>`;
}

// The planner: day tabs, exercise cards and food choices for the selected day
function showPlanner() {
  const scrollY = window.scrollY;               // keep scroll position when re-drawing
  const day = game.plan[game.cur];
  const daysLeft = game.plan.filter(d => !isDayPlanned(d)).length;

  // Day tabs (Mon-Sun)
  const tabs = game.plan.map((d, i) => {
    const icon = d.ex ? (d.ex.cat === "rest" ? "Rest" : iconHtml(d.ex.cat, "tab-icon")) : "-";
    return `<button class="dtab ${i === game.cur ? "on" : ""} ${isDayPlanned(d) ? "ok" : ""}" onclick="goToDay(${i})">
      <b>${DAYS[i]}</b><br>${icon}<br>${d.foods.length}/${MAX_FOODS} foods</button>`;
  }).join("");

  // Exercise cards (3 random + rest)
  const exerciseCards = day.opts.map((option, i) => {
    const selected = day.ex && day.ex.cat === option.cat && day.ex.name === option.name;
    return `<button class="card ${option.cat} ${selected ? "sel" : ""}" onclick="chooseExercise(${i})">
      <div class="e">${iconHtml(option.cat, "card-icon")}</div>
      <div class="n">${option.name}</div>
      <div class="c"><b>${CATEGORY[option.cat].name}</b><br>${CATEGORY[option.cat].description}</div>
    </button>`;
  }).join("");

  const restSelected = day.ex && day.ex.cat === "rest";
  const restCard = `<button class="card rest ${restSelected ? "sel" : ""}" onclick="chooseExercise(-1)">
      <div class="n">Rest day</div><div class="c">Recharge your energy</div>
    </button>`;

  // Food groups with buttons
  const foodGroups = FOOD_GROUPS.map(group => {
    const foodButtons = FOOD[group].map(food => {
      const picked = day.foods.some(f => f.g === group && f.n === food[1]);
      return `<button class="food ${picked ? "on" : ""}" onclick="toggleFood('${group}','${food[1]}')">${food[0]} ${food[1]}</button>`;
    }).join("");
    return `<div class="group ${group}"><h3>${FOOD_GROUP_LABEL[group]}</h3>${foodButtons}</div>`;
  }).join("");

  const nextDayButton = game.cur < 6
    ? `<button class="btn alt" onclick="goToDay(${game.cur + 1})">Next day</button>`
    : "";
  const finishLabel = daysLeft
    ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left to plan`
    : `Repeat this week ${WEEKS_SIMULATED}×`;

  $("#app").innerHTML = headerHtml(`Day ${game.cur + 1}`, `Week 1 plan (×${WEEKS_SIMULATED})`) + `
    <div class="dtabs">${tabs}</div>

    <div class="panel">
      <h2>${DAYS[game.cur]}: pick an activity</h2>
      <div class="grid">${exerciseCards}${restCard}</div>
    </div>

    <div class="panel" style="margin-top:14px">
      <h2>${DAYS[game.cur]}: pick up to ${MAX_FOODS} foods
        <span class="tag" style="font-size:18px;padding:2px 10px">${day.foods.length}/${MAX_FOODS}</span>
      </h2>
      <p class="center" style="margin:0 0 10px">Foods from different groups give you more energy. Tip: mix it up!</p>
      ${foodGroups}
    </div>

    <div class="row">
      ${nextDayButton}
      <button class="btn big" ${daysLeft ? "disabled" : ""} onclick="runSimulation()">${finishLabel}</button>
    </div>`;

  window.scrollTo(0, scrollY);
}

function goToDay(index) {
  game.cur = index;
  window.scrollTo(0, 0);
  showPlanner();
}

// index -1 means "rest"
function chooseExercise(index) {
  const day = game.plan[game.cur];
  day.ex = index < 0 ? { cat: "rest", name: "Rest" } : day.opts[index];
  showPlanner();
}

// Click a food to add it (up to MAX_FOODS) or click again to remove it
function toggleFood(group, name) {
  const day = game.plan[game.cur];
  const existing = day.foods.findIndex(f => f.g === group && f.n === name);
  if (existing >= 0) {
    day.foods.splice(existing, 1);
  } else if (day.foods.length < MAX_FOODS) {
    day.foods.push({ g: group, n: name });
  }
  showPlanner();
}


/* ==========================================================
   5. SIMULATION & REPORT
   The single planned week is repeated WEEKS_SIMULATED times.
   ========================================================== */

// Tuning numbers
const BASE_GAIN = 6;                // stat points from one perfect workout
const WORKOUT_ENERGY_COST = 25;
const REST_ENERGY_BONUS = 30;
const NO_REST_PENALTY = 4;          // lost by EVERY category each week with no rest day
const MISSED_CATEGORY_PENALTY = 1.5; // lost by a category with no workout that week

// Food score for the week plan (0.5 poor ... 1.0 great). Same every week because the plan is the same.
function calculateFoodScore(plan) {
  const allFoods = plan.flatMap(d => d.foods);
  const groupsEaten = new Set(allFoods.map(f => f.g)).size;                // 1-5
  const avgQuality = allFoods.reduce((sum, f) => sum + foodQuality(f.g, f.n), 0) / allFoods.length;
  const fillRatio = allFoods.length / (7 * MAX_FOODS);                     // did you use all food slots?
  return {
    groupsEaten,
    score: (0.5 + 0.1 * groupsEaten * avgQuality) * (0.75 + 0.25 * fillRatio)
  };
}

function runSimulation() {
  const plan = game.plan;
  const food = calculateFoodScore(plan);

  // How many of each activity are in the weekly plan
  const sessions = { cardio: 0, strength: 0, endurance: 0, rest: 0 };
  plan.forEach(day => sessions[day.ex.cat]++);

  let effectivenessTotal = 0;
  let workoutCount = 0;
  game.weeklyHistory = [];

  // ---- Repeat the same week 8 times ----
  for (let week = 1; week <= WEEKS_SIMULATED; week++) {
    plan.forEach(day => {
      if (day.ex.cat === "rest") {
        game.energy = Math.min(100, game.energy + REST_ENERGY_BONUS);
      } else {
        // Lower energy = less effective workout: 100 energy -> 100%, 50 -> 70%, 0 -> 40%
        const effectiveness = 0.4 + 0.6 * (game.energy / 100);
        const gain = BASE_GAIN * food.score * effectiveness;
        game.stats[day.ex.cat] = Math.min(100, game.stats[day.ex.cat] + gain);
        game.energy -= WORKOUT_ENERGY_COST;
        effectivenessTotal += effectiveness;
        workoutCount++;
      }
      // Daily energy recovery: 10 base + up to 8 more from a good food score
      game.energy = Math.max(0, Math.min(100, game.energy + 10 + Math.round(8 * food.score)));
    });

    // End-of-week penalties
    ["cardio", "strength", "endurance"].forEach(category => {
      if (sessions[category] === 0) {
        game.stats[category] = Math.max(0, game.stats[category] - MISSED_CATEGORY_PENALTY);
      }
      if (sessions.rest === 0) {
        game.stats[category] = Math.max(0, game.stats[category] - NO_REST_PENALTY);
      }
    });

    game.weeklyHistory.push({
      week,
      cardio: game.stats.cardio,
      strength: game.stats.strength,
      endurance: game.stats.endurance,
      energy: game.energy
    });
  }

  game.avgEffectiveness = workoutCount ? effectivenessTotal / workoutCount : 1;
  showSimulationReport(food, sessions);
}

function showSimulationReport(food, sessions) {
  // ---- Tips about the weekly plan ----
  const tips = [];

  ["cardio", "strength", "endurance"].forEach(category => {
    if (sessions[category] === 0) {
      tips.push(`${iconHtml(category)} No ${CATEGORY[category].name} in your plan, so it dropped a little every week.`);
    }
  });

  if (sessions.rest === 0) {
    tips.push(`<b>No rest day in your plan!</b> Cardio, Strength and Endurance each lost ${NO_REST_PENALTY} points every week.`);
  } else if (sessions.rest > 3) {
    tips.push("Lots of rest days in your plan. Rest is great, but you need to move too.");
  } else {
    tips.push(`${sessions.rest} rest day${sessions.rest > 1 ? "s" : ""} a week is a healthy balance.`);
  }

  if (game.avgEffectiveness < 0.7) {
    tips.push(`You were tired a lot: workouts were only ${Math.round(game.avgEffectiveness * 100)}% effective on average. Add a rest day or eat more food groups for energy.`);
  }

  if (food.groupsEaten < 5) {
    const missing = FOOD_GROUPS.filter(g => !game.plan.some(d => d.foods.some(f => f.g === g)));
    tips.push(`You skipped ${missing.map(g => FOOD_GROUP_NAME[g]).join(", ")} all week. Try all 5 groups!`);
  } else {
    tips.push("You ate all 5 food groups. Awesome!");
  }

  // ---- Rows: the weekly plan, then progress for each of the 8 weeks ----
  const planRows = game.plan.map((day, i) => {
    const isRest = day.ex.cat === "rest";
    const icon = isRest ? "" : iconHtml(day.ex.cat);
    const label = isRest ? "Rest" : CATEGORY[day.ex.cat].name;
    return `<div class="rrow ${day.ex.cat}">
      <b>${DAYS[i]}</b><span>${icon} ${day.ex.name}</span>
      <span>${day.foods.map(f => f.n).join(", ")}</span><span>${label}</span>
    </div>`;
  }).join("");

  const progressRows = game.weeklyHistory.map(w => `
    <div class="prow">
      <b>Week ${w.week}</b>
      <span>${shown(w.cardio)}</span><span>${shown(w.strength)}</span>
      <span>${shown(w.endurance)}</span><span>${Math.round(w.energy)}</span>
    </div>`).join("");

  $("#app").innerHTML = headerHtml(`Day ${WEEKS_SIMULATED * 7}`, `After ${WEEKS_SIMULATED} weeks`) + `
    <div class="panel">
      <h2>Your week, repeated ${WEEKS_SIMULATED} times</h2>
      <p class="center" style="font-size:20px;margin:0 0 10px">
        Weekly food score: <b>${Math.round(food.score * 100)}%</b> (${food.groupsEaten}/5 food groups)
      </p>
      ${planRows}

      <h2 style="margin-top:18px">Progress each week</h2>
      <div class="prow head">
        <b></b>
        <span>${iconHtml("cardio", "tab-icon")}</span>
        <span>${iconHtml("strength", "tab-icon")}</span>
        <span>${iconHtml("endurance", "tab-icon")}</span>
        <span>Energy</span>
      </div>
      ${progressRows}

      <ul class="advice">${tips.map(t => `<li>${t}</li>`).join("")}</ul>
      <div class="center">
        <button class="btn big" onclick="showFinalScreen()">See my score!</button>
      </div>
    </div>`;
  window.scrollTo(0, 0);
}


/* ==========================================================
   6. FINAL SCORE SCREEN
   ========================================================== */

function showFinalScreen() {
  const stats = game.stats;
  const total = Math.round((shown(stats.cardio) + shown(stats.strength) + shown(stats.endurance)) / 3);
  const grade = total >= 90 ? "Superstar!"
              : total >= 75 ? "Great job!"
              : total >= 55 ? "Good start!"
              : "Keep growing!";

  // What the weekly plan contained
  const perWeek = { cardio: 0, strength: 0, endurance: 0, rest: 0 };
  game.plan.forEach(day => perWeek[day.ex.cat]++);

  const daysWithGroup = {};
  FOOD_GROUPS.forEach(g => {
    daysWithGroup[g] = game.plan.filter(day => day.foods.some(f => f.g === g)).length;
  });
  const avgDistinctGroups = game.plan.reduce((sum, day) => sum + new Set(day.foods.map(f => f.g)).size, 0) / 7;
  const butterDays = game.plan.filter(day => day.foods.some(f => f.n === "Butter")).length;

  // ---- Build coach's advice: things to fix first, then things you did well ----
  const issues = [];
  const praise = [];

  Object.keys(EXERCISES).forEach(category => {
    const n = perWeek[category];
    const label = CATEGORY[category];
    if (n < 2) {
      issues.push(`${iconHtml(category)} Only ${n} ${label.name} workout${n === 1 ? "" : "s"} a week. Try 2 a week.`);
    } else if (n > 3) {
      issues.push(`${iconHtml(category)} ${n} ${label.name} days a week is a lot! Mix in other types so your whole body grows.`);
    }
  });

  if (perWeek.rest < 1) {
    issues.push("You had no rest days. Aim for 1–2 rest days every week.");
  } else if (perWeek.rest > 3) {
    issues.push(`You rested ${perWeek.rest} days a week. Rest is important, but you need to move too!`);
  } else {
    praise.push(`${perWeek.rest} rest day${perWeek.rest > 1 ? "s" : ""} a week is a healthy balance.`);
  }

  FOOD_GROUPS.forEach(group => {
    if (daysWithGroup[group] < 3) {
      issues.push(`${FOOD_GROUP_NAME[group]} showed up on only ${daysWithGroup[group]} of 7 days. With 3 foods a day, try to rotate it in more.`);
    }
  });

  if (avgDistinctGroups >= 2.5) {
    praise.push("Awesome! Most days you ate 3 different food groups.");
  } else {
    issues.push(`On average you ate ${avgDistinctGroups.toFixed(1)} food groups a day. Try picking 3 different groups each day.`);
  }

  if (butterDays > 1) {
    issues.push(`You picked butter on ${butterDays} days. Choose milk, yogurt or cottage cheese more often.`);
  }

  // If there is nothing to fix, celebrate
  if (issues.length === 0) {
    praise.push("Your plan was very balanced. Keep it up!");
  }
  const advice = [...issues, ...praise];

  // ---- Draw the screen ----
  const scoreCard = (key, label, color) => `
    <div class="panel center">
      ${iconHtml(key, "score-icon")}
      <br><b>${label}</b>
      <div class="big-n" style="color:${color}">${shown(stats[key])}</div>
      <div class="bar"><i style="width:${stats[key]}%;background:${color}"></i></div>
    </div>`;

  $("#app").innerHTML = `
    <h1 style="font-size:clamp(30px,6vw,52px)">${WEEKS_SIMULATED} Weeks Complete!</h1>
    <div class="panel" style="margin-top:16px">
      <div class="center">
        <div style="width:130px;margin:auto">${drawBlob(character)}</div>
        <h2>${grade}</h2>
        <div>Overall score</div>
        <div class="big-n">${total} / 100</div>
      </div>

      <div class="score">
        ${scoreCard("cardio", "Cardio", "#ff6fb5")}
        ${scoreCard("strength", "Strength", "#ff9f43")}
        ${scoreCard("endurance", "Endurance", "#2bb87c")}
      </div>

      <h2>Coach's tips</h2>
      <ul class="advice">${advice.map(a => `<li>${a}</li>`).join("")}</ul>

      <div class="row">
        <button class="btn big" onclick="showCourseIntro()">Run the course!</button>
      </div>
      <div class="row">
        <button class="btn" onclick="startGame()">Play again</button>
        <button class="btn alt" onclick="showHome()">Home</button>
      </div>
    </div>`;
  window.scrollTo(0, 0);
}


/* ==========================================================
   START
   ========================================================== */
showHome();
