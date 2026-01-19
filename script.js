function pad2(n){ return String(n).padStart(2, "0"); }

function parseTarget() {
  const p = new URLSearchParams(location.search);

  // Title opcional: ?title=Gran%20Lanzamiento
  const title = p.get("title") || "Lanzamiento";

  // Fecha fija opcional: ?to=2026-01-29T18:00
  const to = p.get("to");
  if (to) {
    // Interpretación local (celu/pc)
    const target = new Date(to);
    return { target, title, mode: "fixed" };
  }

  // Default: próximo jueves 18:00
  const target = getNextThursdayAt18();
  return { target, title, mode: "thursday" };
}

function getNextThursdayAt18() {
  const now = new Date();
  const target = new Date(now);

  const day = now.getDay(); // 0 dom ... 4 jue
  let daysUntil = (4 - day + 7) % 7;

  // si hoy es jueves, decidir si es hoy 18:00 o el próximo
  target.setHours(18, 0, 0, 0);

  if (day === 4) {
    if (now < target) {
      // hoy a las 18
      daysUntil = 0;
    } else {
      // ya pasó: próximo jueves
      daysUntil = 7;
    }
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
};

let last = { d:null, h:null, m:null, s:null };

function setDigit(el, value) {
  if (el.textContent !== value) {
    el.textContent = value;
    el.classList.remove("tick");
    // reflow para reiniciar anim
    void el.offsetWidth;
    el.classList.add("tick");
  }
}

function update() {
  const { target, title, mode } = parseTarget();
  const now = new Date();

  els.title.textContent = title;
  els.subtitle.textContent = `Objetivo: ${formatTarget(target)}`;

  let diffMs = target - now;

  if (diffMs <= 0) {
    setDigit(els.d, "00");
    setDigit(els.h, "00");
    setDigit(els.m, "00");
    setDigit(els.s, "00");
    els.hint.innerHTML = "🚀 <strong>¡Lanzado!</strong> (o faltan segundos por ajustar la hora)";
    return;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setDigit(els.d, String(days));
  setDigit(els.h, pad2(hours));
  setDigit(els.m, pad2(minutes));
  setDigit(els.s, pad2(seconds));
}

update();
setInterval(update, 250); // se ve “vivo” y no pesa

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
