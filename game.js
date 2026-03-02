const player = document.getElementById("player");
const helper = document.getElementById("helper");
const gameArea = document.getElementById("game-area");
const scoreEl = document.getElementById("score");
const oxygenEl = document.getElementById("oxygen");
const hintEl = document.getElementById("hint");
const organisms = [...document.querySelectorAll(".organism")];

const quizModal = document.getElementById("quiz-modal");
const quizForm = document.getElementById("quiz-form");
const quizTitle = document.getElementById("quiz-title");
const quizFact = document.getElementById("quiz-fact");
const quizOptions = document.getElementById("quiz-options");
const submitAnswer = document.getElementById("submit-answer");

const data = {
  coral: {
    name: "Coral",
    fact: "Los corales son animales coloniales y dependen de algas simbióticas llamadas zooxantelas.",
    question: "¿Qué amenaza principal acelera el blanqueamiento coralino?",
    options: ["Aumento de temperatura del mar", "Mareas más suaves", "Mayor salinidad por lluvias"],
    correct: 0,
  },
  turtle: {
    name: "Tortuga marina",
    fact: "Muchas tortugas marinas regresan a la playa donde nacieron para desovar.",
    question: "¿Cuál es una amenaza frecuente para tortugas marinas juveniles?",
    options: ["Exceso de arrecifes", "Plásticos flotantes", "Baja luminosidad nocturna"],
    correct: 1,
  },
  jellyfish: {
    name: "Medusa",
    fact: "Las medusas no tienen cerebro central, pero sí una red nerviosa para detectar estímulos.",
    question: "¿Qué célula usan para capturar presas?",
    options: ["Melanocitos", "Nematocistos", "Plaquetas"],
    correct: 1,
  },
  kelp: {
    name: "Bosque de kelp",
    fact: "Los bosques de kelp son uno de los ecosistemas más productivos y refugio de muchas especies.",
    question: "¿Qué necesita principalmente el kelp para crecer?",
    options: ["Agua cálida y estancada", "Luz y nutrientes fríos", "Arena seca"],
    correct: 1,
  },
};

const state = {
  x: 50,
  y: 50,
  score: 0,
  oxygen: 100,
  seen: new Set(),
  keys: new Set(),
  currentQuiz: null,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function setPos(el, x, y) {
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
}

function updateHUD() {
  scoreEl.textContent = `Conocimiento: ${state.score}`;
  oxygenEl.textContent = `Oxígeno: ${Math.round(state.oxygen)}%`;
}

function openQuiz(id) {
  const entry = data[id];
  state.currentQuiz = id;
  quizTitle.textContent = `Estudio: ${entry.name}`;
  quizFact.textContent = entry.fact;
  quizOptions.innerHTML = "";

  entry.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="radio" name="answer" value="${index}" ${index === 0 ? "checked" : ""}/> ${option}`;
    quizOptions.appendChild(label);
  });

  const q = document.createElement("p");
  q.textContent = entry.question;
  quizOptions.prepend(q);
  if (!quizModal.open) quizModal.showModal();
}

function handleAnswer(event) {
  event.preventDefault();
  if (!state.currentQuiz) return;

  const entry = data[state.currentQuiz];
  const form = new FormData(quizForm);
  const answer = Number(form.get("answer"));

  if (answer === entry.correct) {
    state.score += 15;
    hintEl.textContent = `Nemo: «¡Correcto! ${entry.fact}»`;
    state.seen.add(state.currentQuiz);
  } else {
    state.score = Math.max(0, state.score - 5);
    hintEl.textContent = "Nemo: «Casi... vuelve a observar y prueba otra vez.»";
  }

  state.currentQuiz = null;
  quizModal.close();
  updateHUD();
}

function nearestOrganism() {
  let best = null;
  let bestDist = 999;

  organisms.forEach((org) => {
    const ox = parseFloat(org.style.left);
    const oy = parseFloat(org.style.top);
    const dist = Math.hypot(state.x - ox, state.y - oy);
    org.classList.toggle("active", dist < 10);
    if (dist < bestDist) {
      bestDist = dist;
      best = org;
    }
  });

  if (bestDist < 10) return best.dataset.id;
  return null;
}

function tick() {
  const speed = 0.55;
  if (state.keys.has("ArrowUp") || state.keys.has("w")) state.y -= speed;
  if (state.keys.has("ArrowDown") || state.keys.has("s")) state.y += speed;
  if (state.keys.has("ArrowLeft") || state.keys.has("a")) state.x -= speed;
  if (state.keys.has("ArrowRight") || state.keys.has("d")) state.x += speed;

  state.x = clamp(state.x, 2, 96);
  state.y = clamp(state.y, 4, 94);
  setPos(player, state.x, state.y);

  // Nemo sigue al jugador suavemente
  const hx = parseFloat(helper.style.left || 54);
  const hy = parseFloat(helper.style.top || 54);
  setPos(helper, hx + (state.x - hx) * 0.06 + 2, hy + (state.y - hy) * 0.06 + 1.5);

  state.oxygen -= 0.03;
  if (state.oxygen <= 0) {
    state.oxygen = 100;
    state.score = Math.max(0, state.score - 20);
    hintEl.textContent = "Nemo: «¡Sube a respirar! Perdiste conocimiento por hipoxia.»";
  }

  const nearby = nearestOrganism();
  if (nearby && !quizModal.open) {
    hintEl.textContent = state.seen.has(nearby)
      ? "Nemo: «Ya lo estudiaste. ¡Busca otra especie!»"
      : "Nemo: «Presiona E para analizar este organismo.»";
  }

  updateHUD();
  requestAnimationFrame(tick);
}

document.addEventListener("keydown", (e) => {
  state.keys.add(e.key);
  if (e.key.toLowerCase() === "e" && !quizModal.open) {
    const nearby = nearestOrganism();
    if (nearby) openQuiz(nearby);
  }
});

document.addEventListener("keyup", (e) => state.keys.delete(e.key));
submitAnswer.addEventListener("click", handleAnswer);

organisms.forEach((org) => {
  org.addEventListener("click", () => openQuiz(org.dataset.id));
});

updateHUD();
requestAnimationFrame(tick);
