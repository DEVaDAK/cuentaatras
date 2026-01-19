const MAX_WINDOW = 72 * 3600; // 72 horas
const els = {
  d: days,
  h: hours,
  m: minutes,
  s: seconds,
  subtitle,
  hint,
  overlay,
  bigNumber
};

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
els.subtitle.textContent = `Objetivo: ${target.toLocaleString("es-AR")}`;

function mix(a,b,p){
  return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*p)).join(",")})`;
}

let launched=false, last=null;

function update(){
  const now = new Date();
  let s = Math.floor((target-now)/1000);

  if(s<=0){
    els.d.textContent=0;
    els.h.textContent="00";
    els.m.textContent="00";
    els.s.textContent="00";
    els.hint.innerHTML="🚀 <strong>¡Lanzado!</strong>";
    if(!launched){ launched=true; startConfetti(); }
    return;
  }

  const p = Math.min(1, Math.max(0, 1 - s/MAX_WINDOW));
  const e = Math.pow(p,2.3);

  document.body.style.setProperty("--glow",`rgba(214,152,36,${0.15+e*0.6})`);
  document.body.style.setProperty("--bg1",mix([7,19,29],[60,38,6],e));
  document.body.style.setProperty("--bg2",mix([14,26,36],[90,60,12],e));
  document.body.style.setProperty("--accent1",mix([214,152,36],[255,215,130],e));
  document.body.style.setProperty("--accent2",mix([255,204,102],[255,240,200],e));

  if(s<300) document.body.style.filter="saturate(1.3) contrast(1.15)";
  else document.body.style.filter="";

  els.d.textContent=Math.floor(s/86400);
  els.h.textContent=pad(Math.floor(s%86400/3600));
  els.m.textContent=pad(Math.floor(s%3600/60));
  els.s.textContent=pad(s%60);

  if(s<=10){
    els.overlay.classList.add("show");
    if(s!==last){ els.bigNumber.textContent=s; last=s; }
  }else els.overlay.classList.remove("show");
}

setInterval(update,200);
update();

/* confetti ultra simple */
const c=document.getElementById("confetti"),x=c.getContext("2d");
function startConfetti(){
  c.width=innerWidth; c.height=innerHeight;
  let p=[...Array(250)].map(()=>({
    x:Math.random()*c.width,
    y:Math.random()*-c.height,
    v:2+Math.random()*4
  }));
  let t=performance.now()+12000;
  (function loop(){
    x.clearRect(0,0,c.width,c.height);
    p.forEach(o=>{
      o.y+=o.v;
      x.fillStyle="#ffcc66";
      x.fillRect(o.x,o.y,4,8);
    });
    if(performance.now()<t) requestAnimationFrame(loop);
  })();
}

copyBtn.onclick=()=>navigator.clipboard.writeText(location.href);
