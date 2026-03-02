const DEFAULT_DATA = {
  coral: {
    icon: "🪸",
    name: "Coral",
    fact: "Los corales son animales coloniales y dependen de algas simbióticas llamadas zooxantelas.",
    question: "¿Qué amenaza principal acelera el blanqueamiento coralino?",
    options: ["Aumento de temperatura del mar", "Mareas más suaves", "Mayor salinidad por lluvias"],
    correct: 0,
    position: { x: 12, y: 22 },
  },
  turtle: {
    icon: "🐢",
    name: "Tortuga marina",
    fact: "Muchas tortugas marinas regresan a la playa donde nacieron para desovar.",
    question: "¿Cuál es una amenaza frecuente para tortugas marinas juveniles?",
    options: ["Exceso de arrecifes", "Plásticos flotantes", "Baja luminosidad nocturna"],
    correct: 1,
    position: { x: 68, y: 30 },
  },
  jellyfish: {
    icon: "🪼",
    name: "Medusa",
    fact: "Las medusas no tienen cerebro central, pero sí una red nerviosa para detectar estímulos.",
    question: "¿Qué célula usan para capturar presas?",
    options: ["Melanocitos", "Nematocistos", "Plaquetas"],
    correct: 1,
    position: { x: 38, y: 62 },
  },
  kelp: {
    icon: "🌿",
    name: "Bosque de kelp",
    fact: "Los bosques de kelp son uno de los ecosistemas más productivos y refugio de muchas especies.",
    question: "¿Qué necesita principalmente el kelp para crecer?",
    options: ["Agua cálida y estancada", "Luz y nutrientes fríos", "Arena seca"],
    correct: 1,
    position: { x: 78, y: 70 },
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function initMarineGame(root, options = {}) {
  if (!root) {
    throw new Error("initMarineGame requiere un contenedor raíz válido.");
  }

  const data = options.data ?? DEFAULT_DATA;
  const speed = options.speed ?? 0.55;
  const oxygenDrain = options.oxygenDrain ?? 0.03;

  root.innerHTML = `
    <header class="hud">
      <h1>Abyssal Mentor</h1>
      <p>Explora el arrecife, aprende biología marina y sigue a <strong>Nemo</strong>, tu pez payaso ayudante.</p>
      <div class="stats">
        <span data-ui="score">Conocimiento: 0</span>
        <span data-ui="oxygen">Oxígeno: 100%</span>
      </div>
    </header>

    <main>
      <section class="game-area" data-ui="game-area" aria-label="Zona de juego submarina">
        <div class="player" data-ui="player" aria-label="Buzo">🤿</div>
        <div class="helper" data-ui="helper" aria-label="Pez payaso ayudante">🐠</div>
      </section>

      <aside class="panel">
        <h2>Misiones</h2>
        <ul>
          <li>Muévete con <kbd>WASD</kbd> o flechas.</li>
          <li>Acércate a un organismo para estudiarlo.</li>
          <li>Responde preguntas para ganar conocimiento.</li>
        </ul>
        <p data-ui="hint">Nemo: «¡Explora el coral para empezar!»</p>
      </aside>
    </main>

    <dialog data-ui="quiz-modal">
      <form method="dialog" data-ui="quiz-form">
        <h3 data-ui="quiz-title"></h3>
        <p data-ui="quiz-fact"></p>
        <fieldset data-ui="quiz-options"></fieldset>
        <menu>
          <button value="cancel">Cerrar</button>
          <button data-ui="submit-answer" value="default">Responder</button>
        </menu>
      </form>
    </dialog>
  `;

  const gameArea = root.querySelector('[data-ui="game-area"]');
  const player = root.querySelector('[data-ui="player"]');
  const helper = root.querySelector('[data-ui="helper"]');
  const scoreEl = root.querySelector('[data-ui="score"]');
  const oxygenEl = root.querySelector('[data-ui="oxygen"]');
  const hintEl = root.querySelector('[data-ui="hint"]');

  const quizModal = root.querySelector('[data-ui="quiz-modal"]');
  const quizForm = root.querySelector('[data-ui="quiz-form"]');
  const quizTitle = root.querySelector('[data-ui="quiz-title"]');
  const quizFact = root.querySelector('[data-ui="quiz-fact"]');
  const quizOptions = root.querySelector('[data-ui="quiz-options"]');
  const submitAnswer = root.querySelector('[data-ui="submit-answer"]');

  const organisms = Object.entries(data).map(([id, entry]) => {
    const div = document.createElement("div");
    div.className = "organism";
    div.dataset.id = id;
    div.style.left = `${entry.position.x}%`;
    div.style.top = `${entry.position.y}%`;
    div.textContent = entry.icon;
    gameArea.appendChild(div);
    return div;
  });

  const state = {
    x: 50,
    y: 50,
    score: 0,
    oxygen: 100,
    seen: new Set(),
    keys: new Set(),
    currentQuiz: null,
    raf: 0,
  };

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
    if (state.keys.has("ArrowUp") || state.keys.has("w")) state.y -= speed;
    if (state.keys.has("ArrowDown") || state.keys.has("s")) state.y += speed;
    if (state.keys.has("ArrowLeft") || state.keys.has("a")) state.x -= speed;
    if (state.keys.has("ArrowRight") || state.keys.has("d")) state.x += speed;

    state.x = clamp(state.x, 2, 96);
    state.y = clamp(state.y, 4, 94);
    setPos(player, state.x, state.y);

    const hx = parseFloat(helper.style.left || 54);
    const hy = parseFloat(helper.style.top || 54);
    setPos(helper, hx + (state.x - hx) * 0.06 + 2, hy + (state.y - hy) * 0.06 + 1.5);

    state.oxygen -= oxygenDrain;
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
    state.raf = requestAnimationFrame(tick);
  }

  function onKeyDown(e) {
    state.keys.add(e.key);
    if (e.key.toLowerCase() === "e" && !quizModal.open) {
      const nearby = nearestOrganism();
      if (nearby) openQuiz(nearby);
    }
  }

  function onKeyUp(e) {
    state.keys.delete(e.key);
  }

  organisms.forEach((org) => {
    org.addEventListener("click", () => openQuiz(org.dataset.id));
  });

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  submitAnswer.addEventListener("click", handleAnswer);

  updateHUD();
  state.raf = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(state.raf);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      submitAnswer.removeEventListener("click", handleAnswer);
      root.innerHTML = "";
    },
  };
}

if (typeof window !== "undefined") {
  window.initMarineGame = initMarineGame;
}
