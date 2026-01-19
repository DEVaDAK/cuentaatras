const MAX_WINDOW = 72 * 3600; // 72 horas
const card = document.querySelector(".card");

function pad(n){ return String(n).padStart(2,"0"); }

function getNextThursday18(){
  const now = new Date();
  const t = new Date(now);
  const day = now.getDay();
  let diff = (4 - day + 7) % 7;
  t.setHours(18,0,0,0);
  if(day === 4 && now > t) diff = 7;
  t.setDate(now.getDate() + diff);
  return t;
}

const target = getNextThursday18();
subtitle.textContent = `Objetivo: ${target.toLocaleString("es-AR")}`;

function mix(a,b,p){
  return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*p)).join(",")})`;
}

let launched=false;
let lastFinal=null;

function update(){
  const now = new Date();
  let s = Math.floor((target-now)/1000);

  if(s <= 0){
    days.textContent = 0;
    hours.textContent = "00";
    minutes.textContent = "00";
    seconds.textContent = "00";
    hint.innerHTML = "🚀 <strong>¡Lanzado!</strong>";
    document.body.classList.remove("pulse","pulse-strong");
    card.classList.remove("vibe","vibe-strong");
    if(!launched){
      launched = true;
      startConfetti();
    }
    return;
  }

  /* ===== PROGRESO PORCENTUAL ===== */
  const p = Math.min(1, Math.max(0, 1 - s / MAX_WINDOW));
  const e = Math.pow(p, 2.3);

  document.body.style.setProperty("--glow", `rgba(214,152,36,${0.15 + e*0.6})`);
  document.body.style.setProperty("--bg1", mix([7,19,29],[60,38,6],e));
  document.body.style.setProperty("--bg2", mix([14,26,36],[90,60,12],e));
  document.body.style.setProperty("--accent1", mix([214,152,36],[255,215,130],e));
  document.body.style.setProperty("--accent2", mix([255,204,102],[255,240,200],e));

  /* ===== LATIDO ===== */
  document.body.classList.remove("pulse","pulse-strong");
  if(s <= 3600 && s > 300) document.body.classList.add("pulse");
  if(s <= 300) document.body.classList.add("pulse-strong");

  /* ===== VIBRACIÓN ===== */
  card.classList.remove("vibe","vibe-strong");
  if(s <= 600 && s > 60) card.classList.add("vibe");
  if(s <= 60) card.classList.add("vibe-strong");

  /* ===== OVERDRIVE FINAL ===== */
  if(s <= 300){
    document.body.style.filter = "saturate(1.3) contrast(1.15)";
  } else {
    document.body.style.filter = "";
  }

  /* ===== CONTADOR ===== */
  days.textContent = Math.floor(s / 86400);
  hours.textContent = pad(Math.floor((s % 86400) / 3600));
  minutes.textContent = pad(Math.floor((s % 3600) / 60));
  seconds.textContent = pad(s % 60);

  /* ===== OVERLAY T-10 ===== */
  if(s <= 10){
    overlay.classList.add("show");
    if(s !== lastFinal){
      bigNumber.textContent = s;
      lastFinal = s;
    }
  } else {
    overlay.classList.remove("show");
  }

  if(s <= 3600) hint.innerHTML = "<span class='liveDot'></span>Última hora";
  else hint.innerHTML = "<span class='liveDot'></span>Actualizando en vivo";
}

setInterval(update, 200);
update();

/* ===== CONFETTI ===== */
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

function startConfetti(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  let parts = Array.from({length:260},()=>({
    x: Math.random()*canvas.width,
    y: Math.random()*-canvas.height,
    v: 2 + Math.random()*4
  }));
  let end = performance.now() + 12000;

  (function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(p=>{
      p.y += p.v;
      ctx.fillStyle = "#ffcc66";
      ctx.fillRect(p.x,p.y,4,8);
    });
    if(performance.now() < end) requestAnimationFrame(loop);
  })();
}
