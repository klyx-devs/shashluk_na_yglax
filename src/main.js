// Шашлык на углях — interactions
document.documentElement.classList.add("js");

/* ---------- always open from the top ---------- */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
function forceTop() {
  if (location.hash) return;
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  html.style.scrollBehavior = prev;
}
forceTop();
window.addEventListener("pageshow", forceTop);
window.addEventListener("load", forceTop);
setTimeout(forceTop, 60);
setTimeout(forceTop, 350);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- header state ---------- */
const header = document.getElementById("site-header");
const onScrollHeader = () => header.classList.toggle("scrolled", window.scrollY > 24);
window.addEventListener("scroll", onScrollHeader, { passive: true });
onScrollHeader();

/* ---------- mobile drawer ---------- */
const drawer = document.getElementById("drawer");
const burger = document.getElementById("burger");
const drawerClose = document.getElementById("drawer-close");

function setDrawer(open) {
  drawer.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";
  if (open) drawerClose.focus();
}
burger.addEventListener("click", () => setDrawer(true));
drawerClose.addEventListener("click", () => setDrawer(false));
drawer.addEventListener("click", (e) => { if (e.target === drawer) setDrawer(false); });
drawer.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => setDrawer(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("open")) setDrawer(false);
});

/* ---------- ticker: duplicate content for seamless loop ---------- */
const track = document.getElementById("ticker-track");
track.innerHTML += track.innerHTML;

/* ---------- reveal on scroll ---------- */
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}

/* ---------- menu category filter ---------- */
const tabs = document.querySelectorAll(".tab");
const dishes = document.querySelectorAll(".dish");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    const cat = tab.dataset.cat;
    dishes.forEach((d) => {
      const show = cat === "all" || d.dataset.cat === cat;
      d.classList.toggle("hidden", !show);
      if (show) { d.classList.remove("in"); requestAnimationFrame(() => d.classList.add("in")); }
    });
  });
});

/* ---------- parallax (hero + split media + fire bg) ---------- */
const heroImg = document.getElementById("hero-img");
const parallaxEls = document.querySelectorAll("[data-parallax] img, [data-parallax-bg]");
let ticking = false;
function parallax() {
  const vh = window.innerHeight;
  const y = window.scrollY;
  if (heroImg && y < vh * 1.2) heroImg.style.transform = `translateY(${y * 0.28}px)`;
  parallaxEls.forEach((img) => {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5
    img.style.transform = `translateY(${p * -34}px)`;
  });
  ticking = false;
}
if (!reduceMotion) {
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  parallax();
}

/* ---------- ember particles in hero ---------- */
const canvas = document.getElementById("embers");
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext("2d");
  let W, H, parts = [], raf = null;

  function resize() {
    W = canvas.width = canvas.offsetWidth * devicePixelRatio;
    H = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  resize();
  window.addEventListener("resize", resize);

  const COUNT = Math.min(70, Math.floor(window.innerWidth / 16));
  function spawn(init) {
    return {
      x: Math.random() * W,
      y: init ? Math.random() * H : H + 10,
      r: (Math.random() * 2.2 + 0.6) * devicePixelRatio,
      vy: (Math.random() * 0.9 + 0.35) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.5 * devicePixelRatio,
      drift: Math.random() * Math.PI * 2,
      life: Math.random() * 0.5 + 0.5,
      hue: Math.random() < 0.7 ? 24 : 45,
    };
  }
  for (let i = 0; i < COUNT; i++) parts.push(spawn(true));

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (const p of parts) {
      p.y -= p.vy; p.x += p.vx + Math.sin(p.drift += 0.02) * 0.35 * devicePixelRatio;
      p.life -= 0.0018;
      if (p.y < -12 || p.life <= 0) Object.assign(p, spawn(false));
      const a = Math.max(0, Math.min(1, p.life)) * 0.85;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.hue}, 100%, 62%, ${a})`);
      g.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  // run only while hero is on screen
  const hero = document.getElementById("hero");
  const heroIO = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
    else if (raf) { cancelAnimationFrame(raf); raf = null; }
  });
  heroIO.observe(hero);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
    else if (!document.hidden && !raf) raf = requestAnimationFrame(frame);
  });
}
