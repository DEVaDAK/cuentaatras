function pad2(n){ return String(n).padStart(2, "0"); }

function parseTarget() {
  const p = new URLSearchParams(location.search);

  // ?title=Gran%20Lanzamiento
  const title = p.get("title") || "Lanzamiento";

  // ?to=2026-01-29T18:00  (hora local)
  const to = p.get("to");
  if (to) return { target: new Date(to), title, mode: "fixed" };

  // default: próximo jueves 18:00
  return { target: getNextThursdayAt18(), title, mode: "thursday" };
}

function getNextThursdayAt18() {
  const now = new Date();
  const target = new Date(now);

  const day = now.getDay(); // 0 dom ... 4 jue
  let daysUntil = (4 - day + 7) % 7;

  target.setHours(18, 0, 0, 0);

  if (day === 4) {
    if (now < target) daysUntil = 0;
    else daysUntil = 7;
  } else if (daysUntil === 0) {
    daysUntil = 7;
  }

  target.setDate(now.getDate() + daysUntil);
  target.setHours(18, 0, 0, 0);
  return target;
}

function formatTarget(target) {
  return target.toLocaleString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const els = {
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  hint: document.getElementById("hint"),
  d: document.getElementById("days"),
  h: document.getElementById("hours"),
  m: document.getElementById("minutes"),
  s: document.getElementById("seconds"),
  shareBtn: document.getElementById("shareBtn"),
  copyBtn: document.getElementById("copyBtn"),
  fsBtn: document.getElementById("fsBtn"),
  overlay: document.getElementById("overlay"),
  bigNumber: document.getElementById("bigNumber"),
  overlayText: document.getElementById("overlayText"),
};

function setDigit(el, value) {
  if (el.textContent !== value) {
    el.textContent = value;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }
}

function setPhase(secondsLeft){
  const body = document.body;
  body.classList.remove("phase-blue","phase-violet","phase-orange");

  // >24h: azul
  if (secondsLeft > 24 * 3600) body.classList.add("phase-blue");
  // <=24h y >1h: violeta
  else if (secondsLeft > 3600) body.classList.add("phase-violet");
  // <=1h: naranja/rojo
  else body.classList.add("phase-orange");
}

/* ---------- T-10 Overlay ---------- */
let overlayShown = false;
let lastFinalSecond = null;

function maybeShowFinalCountdown(secondsLeft){
  if (secondsLeft <= 10 && secondsLeft > 0) {
    if (!overlayShown) {
      els.overlay.classList.add("show");
      overlayShown = true;
    }
    const s = Math.ceil(secondsLeft);
    if (s !== lastFinalSecond) {
      els.bigNumber.textContent = String(s);
      els.bigNumber.style.animation = "none";
      void els.bigNumber.offsetWidth;
      els.bigNumber.style.animation = "";
      lastFinalSecond = s;
    }
    els.overlayText.textContent = "Prepárate 🚀";
  } else {
    if (overlayShown && secondsLeft > 10) {
      els.overlay.classList.remove("show");
      overlayShown = false;
      lastFinalSecond = null;
    }
  }
}

/* ---------- Confetti (suave premium) ---------- */
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

function resizeConfetti(){
  confettiCanvas.width = window.innerWidth * devicePixelRatio;
  confettiCanvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener("resize", resizeConfetti, { passive:true });
resizeConfetti();

let confettiRunning = false;
let particles = [];
let confettiStart = 0;

function launchConfetti(){
  if (confettiRunning) return;
  confettiRunning = true;
  confettiStart = performance.now();
  particles = [];

  const count = Math.min(220, Math.floor(window.innerWidth * 0.35));
  for (let i=0;i<count;i++){
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random()*window.innerHeight*0.2,
      vx: (Math.random() - 0.5) * 2.2,
      vy: 2.2 + Math.random() * 3.2,
      r: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      a: 1,
    });
  }
  requestAnimationFrame(tickConfetti);
}

function tickConfetti(t){
  const elapsed = t - confettiStart;
  const duration = 5200; // ~5s

  ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

  // fade out
  const fade = Math.max(0, 1 - elapsed / duration);

  for (const p of particles){
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.vy += 0.02; // gravedad suave

    // wrap lateral
    if (p.x < -20) p.x = window.innerWidth + 20;
    if (p.x > window.innerWidth + 20) p.x = -20;

    const alpha = p.a * fade;
    if (alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = alpha;

    // colores ligados a la fase (usa CSS vars)
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + 20, p.y + 20);
    grad.addColorStop(0, getComputedStyle(document.body).getPropertyValue("--accent1").trim() || "#5bbcff");
    grad.addColorStop(1, getComputedStyle(document.body).getPropertyValue("--accent2").trim() || "#2f7bff");

    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = grad;
    ctx.fillRect(-p.r, -p.r/2, p.r*2.2, p.r);
    ctx.restore();
  }

  if (elapsed < duration) requestAnimationFrame(tickConfetti);
  else {
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    confettiRunning = false;
    particles = [];
  }
}

/* ---------- Fullscreen ---------- */
function updateFsButton(){
  if (!els.fsBtn) return;
  els.fsBtn.textContent = document.fullscreenElement ? "Salir" : "Pantalla completa";
}

if (els.fsBtn){
  els.fsBtn.onclick = async () => {
    try{
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
      updateFsButton();
    }catch(_){}
  };
  document.addEventListener("fullscreenchange", updateFsButton);
  updateFsButton();
}

/* ---------- Main loop ---------- */
let launched = false;

function update() {
  const { target, title } = parseTarget();
  const now = new Date();

  els.title.textContent = title;
  els.subtitle.textContent = `Objetivo: ${formatTarget(target)}`;

  let diffMs = target - now;

  if (diffMs <= 0) {
    setDigit(els.d, "0");
    setDigit(els.h, "00");
    setDigit(els.m, "00");
    setDigit(els.s, "00");

    els.hint.innerHTML = "🚀 <strong>¡Lanzado!</strong>";
    els.overlay.classList.remove("show");

    if (!launched) {
      launched = true;
      launchConfetti();
    }
    return;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // fases de color + overlay final
  setPhase(totalSeconds);
  maybeShowFinalCountdown(totalSeconds);

  setDigit(els.d, String(days));
  setDigit(els.h, pad2(hours));
  setDigit(els.m, pad2(minutes));
  setDigit(els.s, pad2(seconds));

  // hint cambia según fase
  if (totalSeconds <= 3600) els.hint.innerHTML = "<span class='liveDot'></span>Última hora";
  else if (totalSeconds <= 24*3600) els.hint.innerHTML = "<span class='liveDot'></span>Últimas 24 horas";
  else els.hint.innerHTML = "<span class='liveDot'></span>Actualizando en vivo";
}

update();
setInterval(update, 200); // suave, se siente premium

// Compartir / copiar
if (els.shareBtn) {
  els.shareBtn.onclick = async () => {
    const { target, title } = parseTarget();
    const shareData = {
      title,
      text: `${title} — objetivo: ${formatTarget(target)}`,
      url: location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(location.href);
        alert("Link copiado ✅");
      }
    } catch (_) {}
  };
}

if (els.copyBtn) {
  els.copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      alert("Link copiado ✅");
    } catch (_) {
      alert("No pude copiar. Copialo manualmente desde la barra del navegador.");
    }
  };
}
