/* =========================================================
   Portoku.pro  -  script.js
   Ubah pengaturan di blok CONFIG ini saja.
   ========================================================= */
const CONFIG = {
  // Nomor WhatsApp format internasional tanpa + / 0 di depan (0895... -> 62895...)
  WA_NUMBER: "62895321868008",
  WA_DEFAULT_TEXT: "Halo Portoku.pro, saya mau tanya soal pembuatan website portofolio.",
  BUILD_URL: "pesan/",

  // Contoh web profil di carousel (ganti/tambah sesukamu)
  SLIDES: [
    { name: "Oliver Scott - Product Designer", img: "assets/contoh-oliver.jpg" },
    { name: "Migital - Digital Marketing",     img: "assets/contoh-migital.jpg" },
    { name: "Melissa Gaglione - Sales Coach",  img: "assets/contoh-melissa.jpg" }
  ],

  // Teks berjalan (ticker)
  BENEFITS: [
    "Portoku.pro", "Modern", "Profesional", "Portofolio",
    "Responsif di Semua Perangkat", "Siap Dilirik Recruiter",
    "Mudah Dikelola", "Harga Terjangkau"
  ]
};

const waLink = (text) =>
  `https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(text || CONFIG.WA_DEFAULT_TEXT)}`;

/* ---------- pasang link WA & Let's Build ---------- */
document.querySelectorAll("[data-wa]").forEach(el => {
  el.href = waLink(el.dataset.wa);
});
document.querySelectorAll("[data-build]").forEach(el => {
  el.href = CONFIG.BUILD_URL;
});
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("chatWa").href = waLink();

/* ---------- ticker ---------- */
(function ticker() {
  const track = document.getElementById("tickerTrack");
  const one = CONFIG.BENEFITS.map(t => `<span>${t}</span><i>✦</i>`).join("");
  const group = `<div class="ticker-item">${one}</div>`;
  // dua kelompok identik -> loop mulus (animasi geser -50%)
  track.innerHTML = group + group + group + group;
  track.style.animationDuration = Math.max(40, CONFIG.BENEFITS.length * 8) + "s";
  // geser -25% karena ada 4 kelompok
  track.style.setProperty("--shift", "-50%");
})();

/* ---------- hero carousel ---------- */
(function carousel() {
  const slides = CONFIG.SLIDES;
  const n = slides.length;
  const imgC = document.getElementById("imgC");
  const imgL = document.getElementById("imgL");
  const imgR = document.getElementById("imgR");
  const screen = document.getElementById("screen");
  const nameEl = document.getElementById("stageName");
  const dotsEl = document.getElementById("dots");
  const stage = document.getElementById("stage");
  let i = 0, timer = null;

  // dots
  slides.forEach((_, idx) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Contoh " + (idx + 1));
    b.addEventListener("click", () => { go(idx); restart(); });
    dotsEl.appendChild(b);
  });

  function setSrc(img, src) {
    img.classList.add("fade");
    setTimeout(() => {
      img.onload = () => { img.classList.remove("fade"); if (img === imgC) startScroll(); };
      img.onerror = () => { img.classList.remove("fade"); };
      img.src = src;
    }, 180);
  }

  // auto-scroll pelan di layar HP biar kelihatan seperti web sungguhan
  function startScroll() {
    const dist = imgC.offsetHeight - screen.clientHeight;
    imgC.style.animation = "none";
    imgC.style.transform = "translateY(0)";
    if (dist <= 10) return;
    void imgC.offsetWidth;
    imgC.style.setProperty("--d", `-${dist}px`);
    const dur = Math.max(10, dist / 28);
    imgC.style.animation = `shot ${dur}s ease-in-out 1s infinite alternate`;
  }

  function render() {
    setSrc(imgC, slides[i].img);
    setSrc(imgL, slides[(i - 1 + n) % n].img);
    setSrc(imgR, slides[(i + 1) % n].img);
    nameEl.textContent = slides[i].name;
    [...dotsEl.children].forEach((d, idx) => d.classList.toggle("on", idx === i));
  }

  function go(idx) { i = (idx + n) % n; render(); }
  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(i + 1), 7000);
  }

  document.getElementById("cardL").addEventListener("click", () => { go(i - 1); restart(); });
  document.getElementById("cardR").addEventListener("click", () => { go(i + 1); restart(); });
  document.getElementById("prev").addEventListener("click", () => { go(i - 1); restart(); });
  document.getElementById("next").addEventListener("click", () => { go(i + 1); restart(); });

  // swipe di HP
  let sx = 0;
  stage.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 45) { go(dx < 0 ? i + 1 : i - 1); restart(); }
  });

  // keyframes untuk auto-scroll
  const st = document.createElement("style");
  st.textContent = "@keyframes shot{from{transform:translateY(0)}to{transform:translateY(var(--d))}}";
  document.head.appendChild(st);

  window.addEventListener("resize", startScroll);
  render();
  restart();
})();

/* ---------- reveal saat scroll ---------- */
(function reveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: .12 });
  els.forEach(e => io.observe(e));
})();

/* ---------- maskot melayang + popup chat ---------- */
(function mascot() {
  const m = document.getElementById("mascot");
  const chat = document.getElementById("chat");
  const body = document.getElementById("chatBody");
  const quick = document.getElementById("chatQuick");
  let open = false;

  // --- ikut scroll: terbang saat scroll, duduk saat diam, sedikit 'tertinggal' ---
  let lastY = window.scrollY, offset = 0, target = 0, idleT;
  window.addEventListener("scroll", () => {
    const dy = window.scrollY - lastY;
    lastY = window.scrollY;
    target = Math.max(-46, Math.min(46, -dy * 2.2));
    m.classList.add("flying");
    clearTimeout(idleT);
    idleT = setTimeout(() => { target = 0; m.classList.remove("flying"); }, 450);
  }, { passive: true });

  (function loop() {
    offset += (target - offset) * 0.12;
    target *= 0.9;
    m.style.transform = `translateY(${offset.toFixed(2)}px) rotate(${(offset * -0.12).toFixed(2)}deg)`;
    requestAnimationFrame(loop);
  })();

  // sapaan kecil muncul sesekali
  const showHint = () => {
    if (open) return;
    m.classList.add("hint");
    setTimeout(() => m.classList.remove("hint"), 3500);
  };
  setTimeout(showHint, 3500);
  setInterval(showHint, 25000);

  // --- popup ---
  const setOpen = (v) => {
    open = v;
    chat.hidden = !v;
    m.classList.toggle("open", v);
  };

  // klik pertama: buka popup. klik kedua (saat popup terbuka): pindah ke WhatsApp
  m.addEventListener("click", () => {
    if (!open) { setOpen(true); return; }
    window.open(waLink(), "_blank", "noopener");
  });
  document.getElementById("chatClose").addEventListener("click", () => setOpen(false));

  const say = (text, who) => {
    const d = document.createElement("div");
    d.className = "msg " + who;
    d.innerHTML = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  };

  const answers = {
    harga: {
      q: "Berapa harganya?",
      a: "Ada 3 paket: <b>Basic Rp200.000</b>, <b>Standar Rp400.000</b> (paling populer), dan <b>Custom mulai Rp1.000.000</b>. Detail lengkapnya ada di bagian Paket di atas."
    },
    cara: {
      q: "Gimana cara pesan?",
      a: "Gampang! Klik tombol <b>Let's Build</b>, isi formulir singkatnya, lalu tim kami menghubungimu lewat WhatsApp."
    },
    contoh: {
      q: "Lihat contoh",
      a: "Boleh banget! Geser carousel di bagian paling atas untuk lihat contoh web profil hasil Portoku.pro."
    }
  };

  quick.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const a = answers[b.dataset.q];
    say(a.q, "me");
    setTimeout(() => {
      say(a.a, "bot");
      if (b.dataset.q === "contoh") {
        document.getElementById("contoh").scrollIntoView({ behavior: "smooth" });
      }
    }, 450);
  });
})();
