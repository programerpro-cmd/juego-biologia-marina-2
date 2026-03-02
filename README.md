# Abyssal Mentor (Biología Marina)

Mini juego web educativo inspirado en exploración submarina, con un pez payaso ayudante (Nemo).

## Cómo conectarlo con tu proyecto

La lógica está preparada como función reusable:

- Export principal: `initMarineGame(root, options)` en `game.js`.
- Recibe un contenedor DOM (`root`) y renderiza todo dentro de él.
- Retorna un objeto con `destroy()` para desmontar el juego.

### 1) HTML/JS vanilla

```html
<div id="marine-game"></div>
<script type="module">
  import { initMarineGame } from "./game.js";
  const root = document.getElementById("marine-game");
  const game = initMarineGame(root);
  // game.destroy() para desmontar
</script>
```

### 2) React (Vite/Next con cliente)

```jsx
import { useEffect, useRef } from "react";
import { initMarineGame } from "./game.js";
import "./styles.css";

export default function MarineGame() {
  const ref = useRef(null);

  useEffect(() => {
    const game = initMarineGame(ref.current, {
      speed: 0.55,
      oxygenDrain: 0.03,
    });
    return () => game.destroy();
  }, []);

  return <div id="marine-game" ref={ref} />;
}
```

### 3) Personalización rápida

Puedes pasar `options`:

- `speed`: velocidad de movimiento del buzo.
- `oxygenDrain`: consumo de oxígeno por frame.
- `data`: reemplaza especies/preguntas.

Ejemplo:

```js
initMarineGame(root, {
  speed: 0.7,
  oxygenDrain: 0.02,
  data: {
    coral: {
      icon: "🪸",
      name: "Coral",
      fact: "Dato personalizado",
      question: "Pregunta personalizada",
      options: ["A", "B", "C"],
      correct: 0,
      position: { x: 20, y: 25 },
    },
  },
});
```

## Ejecutar local

```bash
python3 -m http.server 4173
```

Abre `http://localhost:4173`.
