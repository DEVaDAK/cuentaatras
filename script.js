function getNextThursdayAt18() {
  const now = new Date();
  const target = new Date(now);

  const day = now.getDay(); // 0 domingo - 4 jueves
  const daysUntilThursday = (4 - day + 7) % 7 || 7;

  target.setDate(now.getDate() + daysUntilThursday);
  target.setHours(18, 0, 0, 0);

  // Si hoy es jueves y ya pasó las 18, ir al próximo
  if (day === 4 && now >= target) {
    target.setDate(target.getDate() + 7);
  }

  return target;
}

function render() {
  const now = new Date();
  const target = getNextThursdayAt18();

  const totalHours = Math.ceil((target - now) / (1000 * 60 * 60));
  const maxHours = 120; // límite visual (5 días)

  const hoursLeft = Math.max(0, totalHours);
  const hoursShown = Math.min(hoursLeft, maxHours);

  const percent = ((1 - hoursLeft / maxHours) * 100).toFixed(1);

  document.getElementById("percent").innerText = `${percent}%`;
  document.getElementById("remaining").innerText = `${hoursLeft} horas restantes`;
  document.getElementById("meta").innerText =
    `Objetivo: ${target.toLocaleString("es-AR", { weekday:"long", hour:"2-digit", minute:"2-digit" })}`;

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < hoursShown; i++) {
    const dot = document.createElement("div");
    dot.className = "dot";

    if (i < maxHours - hoursLeft) dot.classList.add("filled");
    if (i === maxHours - hoursLeft) dot.classList.add("current");

    grid.appendChild(dot);
  }
}

render();
setInterval(render, 60 * 1000); // actualizar cada minuto
