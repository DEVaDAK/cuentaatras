function pad2(n){ return String(n).padStart(2, "0"); }

function parseTarget() {
  const p = new URLSearchParams(location.search);
  const title = p.get("title") || "Lanzamiento";

  // ?to=2026-01-29T18:00 (hora local)
  const to = p.get("to");
  if (to) return { target: new Date(to), title };

  // default: próximo jueves 18:00
  return { target: getNextThursdayAt18(), title };
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

/* fases: siempre alrededor del dorado */
function setPhase(secondsLeft){
  const body = document.body;
  body.classList.remove("phase-blue","phase-violet","phase-orange");

  // >24h: gold clean
  if (secondsLeft > 24 * 3600) body.classList.add("phase-blue");
  // <=24h y >1h: gold + violeta (más hype)
  else if (secondsLeft > 3600) body.classList.add("phase-violet");
  // <=1h: gold intenso
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

/* ---------- Confetti (continuo ~12s) ---------- */
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

function resizeConfetti(){
  confettiCanvas.width = window.innerWidth * devicePixelRatio;
  confettiCanvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener("resize", resizeConfetti, { passive:true });
resizeConfetti();

let confettiActive = false;
let confettiEndAt = 0;
let particles = [];

function currentAccentColors(){
  const cs = getComputedStyle(document.body);
  return {
    a1: cs.getPropertyValue("--accent1").trim() || "#d69824",
    a2: cs.getPropertyValue("--accent2").trim() || "#ffcc66",
  };
}

function spawnParticles(n){
  const { a1, a2 } = currentAccentColors();
  for (let i=0;i<n;i++){
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random()*120,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2.6 + Math.random() * 3.6,
      r: 3 + Math.random() * 4.5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.22,
      a1, a2
    });
  }
}

function startConfetti(durationMs = 12000){
  confettiActive = true;
  confettiEndAt = performance.now() + durationMs;
  particles = [];
  spawnParticles(Math.min(220, Math.floor(window.innerWidth * 0.35)));
  requestAnimationFrame(tickConfetti);
}

function tickConfetti(t){
  if (!confettiActive) return;

  const remaining = confettiEndAt - t;
  const fade = Math.max(0, Math.min(1, remaining / 1200));

  ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

  if (t < confettiEndAt) {
    const rate = Math.max(6, Math.floor(window.innerWidth / 160));
    spawnParticles(rate);
  }

  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.vy += 0.02;

    if (p.x < -40) p.x = window.innerWidth + 40;
    if (p.x > window.innerWidth + 40) p.x = -40;

    const alpha = fade * 0.95;
    if (alpha <= 0 || p.y > window.innerHeight + 60) {
      particles.splice(i,1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const grad = ctx.createLinearGradient(p.x, p.y, p.x + 20, p.y + 20);
    grad.addColorStop(0, p.a1);
    grad.addColorStop(1, p.a2);

    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = grad;
    ctx.fillRect(-p.r, -p.r/2, p.r*2.3, p.r);
    ctx.restore();
  }

  if (t < confettiEndAt || particles.length > 0) requestAnimationFrame(tickConfetti);
  else {
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    confettiActive = false;
    particles = [];
  }
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

    els.overlay.classList.remove("show");
    document.body.classList.add("phase-orange");

    els.hint.innerHTML = "🚀 <strong>¡Lanzado!</strong> • ¡Felicitaciones!";
    if (!launched) {
      launched = true;
      startConfetti(12000); // 12s (premium)
    }
    return;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setPhase(totalSeconds);
  maybeShowFinalCountdown(totalSeconds);

  setDigit(els.d, String(days));
  setDigit(els.h, pad2(hours));
  setDigit(els.m, pad2(minutes));
  setDigit(els.s, pad2(seconds));

  if (totalSeconds <= 3600) els.hint.innerHTML = "<span class='liveDot'></span>Última hora";
  else if (totalSeconds <= 24*3600) els.hint.innerHTML = "<span class='liveDot'></span>Últimas 24 horas";
  else els.hint.innerHTML = "<span class='liveDot'></span>Actualizando en vivo";
}

update();
setInterval(update, 200);

/* Compartir / copiar */
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
