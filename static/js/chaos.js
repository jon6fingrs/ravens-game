/* OPERATION: PURPLE SUNDAY — chaos engine.
 * Way too much code for one football game. That's the point. */
(() => {
  "use strict";

  const G = window.GAME;
  const KICKOFF = new Date(G.kickoff).getTime();
  const GAME_LENGTH = 3.25 * 3600e3;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem("ps:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("ps:" + k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  /* ================= PARTICLE ENGINE ================= */
  const canvas = $("#fx");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  const parts = [];
  const rings = [];
  const MAX_PARTS = 1400;
  const EMOJI = ["🏈", "💜", "✨", "🐦‍⬛", "🦀", "🌈", "⭐", "8️⃣", "🎉", "💛"];
  const COLORS = ["#ff004c", "#ff8a00", "#ffe600", "#2bff88", "#00c8ff", "#8a5cff", "#ff2bd6", "#ffd85c", "#ffffff", "#9b7bff"];
  const CHAOS_NAMES = ["Zen Raven", "Light Drizzle", "MODERATE CAW", "UNHINGED", "☢️ BIRDLAND MELTDOWN ☢️"];
  const CHAOS_MULT = [0.25, 0.6, 1, 1.8, 3.2];
  let chaos = store.get("chaos", 2);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener("resize", resize);
  resize();

  function spawn(x, y, opts = {}) {
    if (parts.length > MAX_PARTS) return;
    const kind = opts.kind || pick(["star", "star", "star", "confetti", "confetti", "emoji", "dot"]);
    const a = opts.angle ?? rand(0, Math.PI * 2);
    const sp = Array.isArray(opts.speed) ? rand(...opts.speed) : opts.speed ?? rand(2, 11);
    parts.push({
      kind, x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift ?? 2),
      g: opts.gravity ?? 0.18,
      life: 0, max: opts.life ?? rand(50, 110),
      size: opts.size ?? (kind === "emoji" ? rand(18, 38) : rand(4, 11)),
      rot: rand(0, Math.PI * 2), vr: rand(-0.3, 0.3),
      color: pick(COLORS),
      emoji: opts.emoji || pick(EMOJI),
      drag: opts.drag ?? 0.985,
    });
  }

  function burst(x, y, n = 40, opts = {}) {
    const count = Math.round(n * CHAOS_MULT[chaos] * (reduceMotion ? 0.3 : 1));
    for (let i = 0; i < count; i++) spawn(x, y, opts);
  }

  function rainbowRing(x, y, maxR) {
    rings.push({ x, y, r: 4, max: maxR ?? Math.max(W, H) * 0.6, life: 1 });
  }

  function drawStar(p) {
    const s = p.size;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? s * 0.28 : s;
      const a = (i / 8) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    // rainbow shockwaves
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += (r.max - r.r) * 0.06 + 2;
      r.life = 1 - r.r / r.max;
      if (r.life <= 0.02) { rings.splice(i, 1); continue; }
      ctx.lineWidth = 7;
      ctx.globalAlpha = Math.max(r.life, 0);
      for (let k = 0; k < 7; k++) {
        ctx.strokeStyle = COLORS[k];
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(r.r - k * 8, 1), Math.PI, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++;
      if (p.life > p.max || p.y > H + 60) { parts.splice(i, 1); continue; }
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const t = p.life / p.max;
      ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === "star") {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 12;
        const tw = 0.6 + 0.4 * Math.sin(p.life * 0.5);
        ctx.scale(tw, tw);
        drawStar(p);
      } else if (p.kind === "confetti") {
        ctx.fillStyle = p.color;
        ctx.scale(1, Math.sin(p.life * 0.25));
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.kind === "emoji") {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // ambient glitter rain
    if (!reduceMotion && Math.random() < 0.12 * CHAOS_MULT[chaos]) {
      spawn(rand(0, W), -10, { kind: pick(["star", "dot", "confetti"]), angle: Math.PI / 2, speed: [0.5, 2], lift: 0, gravity: 0.02, life: rand(200, 400), drag: 1 });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // cursor / finger glitter trail
  let lastTrail = 0;
  addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (reduceMotion || now - lastTrail < 30) return;
    lastTrail = now;
    spawn(e.clientX, e.clientY, { kind: pick(["star", "dot"]), speed: [0.3, 1.5], lift: 0.3, gravity: 0.04, life: rand(25, 50), size: rand(3, 7) });
  }, { passive: true });

  // sparkles on every tap, anywhere
  addEventListener("pointerdown", (e) => {
    if (e.target.closest("#crew, .leaflet-container, input")) return;
    burst(e.clientX, e.clientY, 18, { speed: [1, 6] });
    bumpHype(1);
  });

  /* ================= SOUND (WebAudio, no files) ================= */
  let actx = null;
  let muted = store.get("muted", false);
  const audio = () => {
    if (muted) return null;
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (actx.state === "suspended") actx.resume();
    return actx;
  };

  function tone(freq, start, dur, type = "sine", vol = 0.15, ac = audio()) {
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ac.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
    o.connect(g).connect(ac.destination);
    o.start(ac.currentTime + start); o.stop(ac.currentTime + start + dur + 0.05);
  }

  function chime() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => tone(f * (1 + Math.random() * 0.01), i * 0.05, 0.5, "triangle", 0.08));
  }

  function sevenNationArmy() {
    const ac = audio();
    if (!ac) return;
    // E E G E D C B  — the stadium chant riff
    const E = 82.41, G_ = 98.0, D = 73.42, C = 65.41, B = 61.74;
    const beat = 0.5;
    const riff = [[E, 1.5], [E, 0.5], [G_, 0.75], [E, 0.75], [D, 0.5], [C, 2], [B, 2]];
    let t = 0;
    for (let rep = 0; rep < 2; rep++) {
      for (const [f, len] of riff) {
        const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
        o.type = "sawtooth"; o2.type = "square";
        o.frequency.value = f * 2; o2.frequency.value = f;
        lp.type = "lowpass"; lp.frequency.value = 900;
        const s = ac.currentTime + t, d = len * beat;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.22, s + 0.02);
        g.gain.setValueAtTime(0.22, s + d * 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, s + d * 0.98);
        o.connect(lp); o2.connect(lp); lp.connect(g).connect(ac.destination);
        o.start(s); o2.start(s); o.stop(s + d); o2.stop(s + d);
        t += d;
      }
    }
    const words = ["WOOOO", "OH", "OH-OH", "OH", "OH", "OHHHH", "🎸💜"];
    let i = 0;
    const iv = setInterval(() => {
      hype(words[i % words.length]);
      burst(rand(W * 0.2, W * 0.8), rand(H * 0.2, H * 0.6), 25);
      if (++i >= words.length * 2) clearInterval(iv);
    }, (t * 1000) / (words.length * 2));
  }

  /* ================= HYPE WORDS ================= */
  const HYPE = ["CAW CAW!", "LET'S GOOO!", "BIRDLAND!", "💜💜💜", "TOUCHDOWN!", "NEVERMORE!", "PURPLE RAIN!", "WHO DEY? NOT TODAY", "FLY HIGH!", "#8 #8 #8", "SPARKLE OVERLOAD", "UNREASONABLE!", "RAVENS FLOCK!"];
  const pop = $("#hypepop");
  function hype(word) {
    pop.innerHTML = "";
    const s = document.createElement("span");
    s.textContent = word || pick(HYPE);
    pop.appendChild(s);
  }

  /* ================= THE CREW PHOTO ================= */
  const crew = $("#crew");
  let sparkles = store.get("sparkles", 0);
  const countEl = $("#sparkleCount");
  countEl.textContent = sparkles.toLocaleString();
  crew.addEventListener("pointerdown", (e) => {
    const x = e.clientX, y = e.clientY;
    burst(x, y, 90, { speed: [4, 14] });
    burst(x, y, 20, { kind: "emoji", speed: [3, 10], lift: 5 });
    rainbowRing(x, y);
    // fountain from the bottom corners
    for (let i = 0; i < 25 * CHAOS_MULT[chaos]; i++) {
      spawn(0, H, { angle: rand(-1.3, -0.7), speed: [10, 20], lift: 0 });
      spawn(W, H, { angle: rand(-2.4, -1.8), speed: [10, 20], lift: 0 });
    }
    crew.classList.remove("shake"); void crew.offsetWidth; crew.classList.add("shake");
    hype();
    chime();
    if (navigator.vibrate) navigator.vibrate(30);
    sparkles++;
    store.set("sparkles", sparkles);
    countEl.textContent = sparkles.toLocaleString();
    bumpHype(6);
  });

  /* ================= COUNTDOWN ================= */
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const fmt = (n, d = 0) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const UNITS = [
    ["Lamar 40-yard dashes (4.34s each)", (s) => s / 4.34],
    ["Seven Nation Army chants", (s) => s / 7],
    ["readings of Poe's “The Raven” aloud (~8 min)", (s) => s / 480],
    ["crab cakes, eaten at a dignified pace", (s) => s / 240],
    ["heartbeats (at a calm, pre-game 72 bpm)", (s) => s * 1.2],
    ["football spirals (at 600 RPM)", (s) => s * 10],
    ["full NFL games (~3h 15m)", (s) => s / (3.25 * 3600)],
    ["times the kids ask “is it Sunday yet?”", (s) => s / 1800],
    ["sneezes of Edgar Allan Poe's ghost", (s) => s / 3333],
  ];
  const unitsEl = $("#units");
  unitsEl.innerHTML = UNITS.map((u, i) => `<li><b id="u${i}">—</b>${u[0]}</li>`).join("");
  const unitEls = UNITS.map((_, i) => $("#u" + i));

  const tlItems = $$("#tl li");
  const statusEl = $("#cdStatus");
  const balFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", second: "2-digit", weekday: "long" });
  let celebrated = false;
  let lastSlow = 0;

  function tick() {
    const now = Date.now();
    let diff = KICKOFF - now;
    const live = diff <= 0 && -diff < GAME_LENGTH;
    const over = -diff >= GAME_LENGTH;
    const d = Math.max(diff, 0);
    $("#cdD").textContent = pad(Math.floor(d / 864e5));
    $("#cdH").textContent = pad(Math.floor(d / 36e5) % 24);
    $("#cdM").textContent = pad(Math.floor(d / 6e4) % 60);
    $("#cdS").textContent = pad(Math.floor(d / 1e3) % 60);
    $("#cdC").textContent = pad(Math.floor(d / 10) % 100);

    if (now - lastSlow > 250) {
      lastSlow = now;
      const secs = d / 1000;
      UNITS.forEach((u, i) => { const v = u[1](secs); unitEls[i].textContent = fmt(v, v < 100 ? 2 : 0); });

      const hrs = d / 36e5;
      statusEl.textContent = over ? "🏁 THE GAME HAS HAPPENED. WE WERE THERE. LEGENDS. 🏁"
        : live ? "🚨🏈 GAME IS LIVE! STOP LOOKING AT YOUR PHONE AND SCREAM! 🏈🚨"
        : hrs < 1 ? "⚡ LESS THAN AN HOUR. FIND YOUR SEATS. ⚡"
        : hrs < 4 ? "🔥 It's GAMEDAY. Lots are open. Smell that? Victory (and grills). 🔥"
        : hrs < 24 ? "😤 Less than a day. Lay out the jerseys. Charge the phones."
        : hrs < 72 ? "🧘 Days away. Hydrate. Stretch your waving arm."
        : "🗓️ It's coming. It's definitely coming.";

      // anticipation meter: progress from previous Sunday kickoff to this one
      const start = KICKOFF - 7 * 864e5;
      const pct = Math.min(100, Math.max(0, ((now - start) / (KICKOFF - start)) * 100));
      $("#weekMeter").style.width = pct + "%";
      $("#weekMeterPct").textContent = pct.toFixed(4);

      // timeline progress
      const mins = (now - KICKOFF) / 6e4;
      let nowIdx = -1;
      tlItems.forEach((li, i) => { if (mins >= +li.dataset.t) nowIdx = i; });
      tlItems.forEach((li, i) => {
        li.classList.toggle("done", i < nowIdx);
        li.classList.toggle("now", i === nowIdx && !over);
      });

      $("#balTime").textContent = balFmt.format(now);

      if (live && !celebrated) {
        celebrated = true;
        for (let i = 0; i < 6; i++) setTimeout(() => { burst(rand(0, W), rand(0, H / 2), 80); rainbowRing(rand(0, W), rand(0, H)); }, i * 300);
        hype("KICKOFF!!!");
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ================= CHAOS CONTROLS ================= */
  const slider = $("#chaosLevel");
  const chaosLabel = $("#chaosLabel");
  slider.value = chaos;
  chaosLabel.textContent = CHAOS_NAMES[chaos];
  slider.addEventListener("input", () => {
    chaos = +slider.value;
    chaosLabel.textContent = CHAOS_NAMES[chaos];
    store.set("chaos", chaos);
    const r = slider.getBoundingClientRect();
    burst(r.left + (r.width * chaos) / 4, r.top, 30);
  });

  const fly = $("#flyzone");
  function ravenStorm(n = 14) {
    const count = Math.round(n * CHAOS_MULT[chaos]);
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "flyer";
      el.textContent = Math.random() < 0.12 ? "🏈" : "🐦‍⬛";
      el.style.top = rand(5, 85) + "vh";
      el.style.fontSize = rand(1.8, 5) + "rem";
      el.style.animationDuration = rand(2.5, 6) + "s";
      el.style.animationDelay = rand(0, 1.5) + "s";
      fly.appendChild(el);
      el.addEventListener("animationend", () => el.remove());
    }
    hype("THE FLOCK ARRIVES");
  }

  function crabRave() {
    const count = Math.round(12 * CHAOS_MULT[chaos]);
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "crabby";
      el.textContent = "🦀";
      el.style.left = rand(0, 95) + "vw";
      el.style.animationDuration = rand(2, 4) + "s";
      el.style.animationDelay = rand(0, 0.8) + "s";
      fly.appendChild(el);
      el.addEventListener("animationend", () => el.remove());
    }
    const ac = audio();
    if (ac) [0, 0.25, 0.5, 0.75, 1, 1.25].forEach((t, i) => tone([392, 466, 523, 587, 523, 466][i], t, 0.2, "square", 0.06, ac));
    hype("🦀 CRAB IS GONE 🦀");
  }

  const actions = {
    sna: sevenNationArmy,
    storm: () => ravenStorm(),
    disco: () => document.body.classList.toggle("disco"),
    rainbow: () => {
      for (let i = 0; i < 5; i++) setTimeout(() => rainbowRing(rand(0, W), rand(H * 0.3, H)), i * 180);
      burst(W / 2, H / 2, 70, { kind: "emoji", emoji: "🌈", speed: [4, 12] });
      hype("🌈 TASTE THE RAINBOW 🌈");
    },
    crab: crabRave,
    comic: () => document.body.classList.toggle("comic"),
    flip: () => { document.body.classList.toggle("flipped"); hype("🙃 BENGALS: FLIPPED"); },
    mute: () => {
      muted = !muted;
      store.set("muted", muted);
      $("#muteBtn").textContent = muted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
    },
  };
  $("#muteBtn").textContent = muted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
  $$("[data-action]").forEach((b) => b.addEventListener("click", () => { actions[b.dataset.action](); bumpHype(3); }));

  /* ---- hype meter ---- */
  const HYPE_LEVELS = [[0, "Mild Caw"], [15, "Warming Up"], [35, "Towel Waver"], [60, "Face-Painted"], [85, "Lost Voice"], [100, "TOTAL BIRDLAND"]];
  let hypeVal = store.get("hype", 0);
  function bumpHype(n) {
    hypeVal = Math.min(100, hypeVal + n * 0.5);
    store.set("hype", hypeVal);
    renderHype();
  }
  function renderHype() {
    $("#hypeFill").style.width = hypeVal + "%";
    let label = HYPE_LEVELS[0][1];
    for (const [min, name] of HYPE_LEVELS) if (hypeVal >= min) label = name;
    $("#hypeLabel").textContent = label;
  }
  renderHype();

  /* ---- secret: Konami code or tap the title 8 times ---- */
  function birdland() {
    document.body.classList.add("birdland", "disco");
    ravenStorm(30);
    for (let i = 0; i < 10; i++) setTimeout(() => { burst(rand(0, W), rand(0, H), 60); rainbowRing(rand(0, W), rand(0, H)); }, i * 200);
    sevenNationArmy();
    setTimeout(() => document.body.classList.remove("birdland"), 9000);
  }
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kIdx = 0;
  addEventListener("keydown", (e) => {
    kIdx = e.key === KONAMI[kIdx] ? kIdx + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (kIdx === KONAMI.length) { kIdx = 0; birdland(); }
  });
  let titleTaps = 0, titleTimer;
  $(".hero__title").addEventListener("click", () => {
    titleTaps++;
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => (titleTaps = 0), 2500);
    if (titleTaps === 8) { titleTaps = 0; birdland(); }
  });

  /* ================= WEATHER ================= */
  const WMO = {
    0: ["☀️", "Clear"], 1: ["🌤️", "Mostly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Overcast"],
    45: ["🌫️", "Fog"], 48: ["🌫️", "Rime fog"], 51: ["🌦️", "Light drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌧️", "Heavy drizzle"],
    61: ["🌧️", "Light rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"], 66: ["🌨️", "Freezing rain"], 67: ["🌨️", "Freezing rain"],
    71: ["🌨️", "Light snow"], 73: ["🌨️", "Snow"], 75: ["❄️", "Heavy snow"], 80: ["🌦️", "Showers"], 81: ["🌧️", "Showers"],
    82: ["⛈️", "Violent showers"], 95: ["⛈️", "Thunderstorm"], 96: ["⛈️", "Thunderstorm + hail"], 99: ["⛈️", "Thunderstorm + hail"],
  };
  async function weather() {
    const box = $("#wx");
    const day = G.kickoff.slice(0, 10);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${G.lat}&longitude=${G.lon}` +
      `&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&start_date=${day}&end_date=${day}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const j = await res.json();
      const h = j.hourly;
      const rows = [];
      for (let i = 0; i < h.time.length; i++) {
        const hr = +h.time[i].slice(11, 13);
        if (hr < 10 || hr > 17) continue;
        rows.push({ hr, t: h.temperature_2m[i], f: h.apparent_temperature[i], p: h.precipitation_probability[i], c: h.weather_code[i], w: h.wind_speed_10m[i] });
      }
      if (!rows.length || rows.every((r) => r.t == null)) throw new Error("no data yet");
      box.innerHTML = rows.map((r) => {
        const [icon, label] = WMO[r.c] || ["❓", "Mystery weather"];
        const lbl = r.hr === 12 ? "12 PM" : r.hr > 12 ? `${r.hr - 12} PM` : `${r.hr} AM`;
        return `<div class="wx__hr${r.hr === 13 ? " kick" : ""}" title="${label}">
          <div class="t">${r.hr === 13 ? "🏈 KICKOFF" : lbl}</div><div class="i">${icon}</div>
          <div class="d">${Math.round(r.t)}°</div>
          <div class="x">feels ${Math.round(r.f)}°<br>💧${r.p ?? "–"}% · 💨${Math.round(r.w)}</div></div>`;
      }).join("");
      const k = rows.find((r) => r.hr === 13) || rows[0];
      const maxRain = Math.max(...rows.map((r) => r.p || 0));
      const lines = [];
      if (k.f < 45) lines.push("🥶 Chilly! Layers + hand warmers.");
      else if (k.f < 58) lines.push("🧥 Hoodie weather. Jersey over the hoodie, obviously.");
      else if (k.f < 75) lines.push("😎 Perfect football weather.");
      else lines.push("🥵 Toasty. Sunscreen + water.");
      if (maxRain >= 50) lines.push("☔ Bring ponchos (umbrellas aren't allowed in most seats).");
      else if (maxRain >= 25) lines.push("🌂 Some rain risk — pack a poncho just in case.");
      if (k.w >= 15) lines.push("💨 Windy — hold onto those towels.");
      $("#wxVerdict").textContent = lines.join(" ");
    } catch (err) {
      box.innerHTML = `<p>The weather ravens are still flying (forecast unavailable right now). Try <a href="https://forecast.weather.gov/MapClick.php?lat=${G.lat}&lon=${G.lon}" target="_blank" rel="noopener">weather.gov for the stadium</a>.</p>`;
    }
  }
  weather();

  /* ================= MAP ================= */
  function map() {
    if (!window.L) { $("#leaflet").innerHTML = "<p style='padding:1rem'>Map failed to load — use the buttons below!</p>"; return; }
    const m = L.map("leaflet", { scrollWheelZoom: false }).setView([G.lat, G.lon], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    const icon = (e, big) => L.divIcon({ className: "", html: `<div class="pin${big ? " pin--big" : ""}">${e}</div>`, iconSize: big ? [48, 48] : [30, 30], iconAnchor: big ? [24, 24] : [15, 15] });
    const spots = [
      [G.lat, G.lon, "🏟️", "<b>M&amp;T Bank Stadium</b><br>THE DESTINATION. 1101 Russell St.", true],
      [39.2716, -76.6236, "🚊", "<b>Hamburg Street</b> Light Rail stop — closest to the stadium"],
      [39.2853, -76.6203, "🚊", "<b>Camden Yards</b> Light Rail stop"],
      [39.2849, -76.6191, "🚆", "<b>Camden Station</b> — MARC Camden Line"],
      [39.2832, -76.6230, "🍺", "<b>Pickles Pub</b> — legendary pregame spot"],
      [39.2840, -76.6217, "⚾", "<b>Oriole Park at Camden Yards</b> — the stadium's neighbor"],
      [39.2797, -76.6113, "🍔", "<b>Federal Hill</b> — food &amp; drinks, walkable"],
      [39.2860, -76.6086, "⛵", "<b>Inner Harbor</b> — post-game stroll"],
    ];
    spots.forEach(([la, lo, e, html, big]) => L.marker([la, lo], { icon: icon(e, big), zIndexOffset: big ? 1000 : 0 }).addTo(m).bindPopup(html));
    // a very serious "path of victory"
    L.polyline([[39.2849, -76.6191], [39.2825, -76.6205], [39.2800, -76.6215], [G.lat, G.lon]], { color: "#9b7bff", weight: 6, dashArray: "2 12", lineCap: "round" }).addTo(m)
      .bindPopup("The Path of Victory™ (Camden Station → stadium, ~10 min walk)");
    // invalidate once visible (layout settles after fonts load)
    setTimeout(() => m.invalidateSize(), 500);
  }
  map();

  /* ================= PACKING LIST ================= */
  const packed = store.get("packed", {});
  const packItems = $$("#pack li");
  function renderPack() {
    let n = 0;
    packItems.forEach((li) => { const on = !!packed[li.dataset.k]; li.classList.toggle("on", on); if (on) n++; });
    $("#packPct").textContent = Math.round((n / packItems.length) * 100) + "%";
    return n === packItems.length;
  }
  packItems.forEach((li) => li.addEventListener("click", (e) => {
    packed[li.dataset.k] = !packed[li.dataset.k];
    store.set("packed", packed);
    burst(e.clientX, e.clientY, packed[li.dataset.k] ? 25 : 5);
    if (renderPack() && packed[li.dataset.k]) { hype("FULLY PACKED!"); rainbowRing(W / 2, H / 2); }
  }));
  renderPack();

  /* ================= PREDICTOR ================= */
  const MVPS = ["Lamar Jackson", "Derrick Henry", "Zay Flowers", "Kyle Hamilton", "Roquan Smith", "Poe (the mascot)", "Rise & Conquer (the real ravens)",
    "the guy in row 12 with the towel", "the Marching Ravens' tuba section", "everyone in this photo", "the kid in the black jersey", "Edgar Allan Poe's ghost"];
  const spinBtn = $("#spin");
  let spinning = false;
  spinBtn.addEventListener("click", () => {
    if (spinning) return;
    spinning = true;
    const r = Math.floor(rand(20, 46)), b = Math.floor(rand(3, Math.min(r - 3, 24)));
    const mvp = pick(MVPS);
    const elR = $("#slotR"), elB = $("#slotB"), elM = $("#slotMvp");
    const ac = audio();
    let i = 0;
    const iv = setInterval(() => {
      elR.textContent = Math.floor(rand(0, 60)); elB.textContent = Math.floor(rand(0, 60)); elM.textContent = pick(MVPS);
      if (ac) tone(300 + Math.random() * 600, 0, 0.05, "square", 0.03, ac);
      if (++i > 24) {
        clearInterval(iv);
        elR.textContent = r; elB.textContent = b; elM.textContent = mvp;
        const s = spinBtn.getBoundingClientRect();
        burst(s.left + s.width / 2, s.top, 70);
        hype(`RAVENS ${r}–${b}`);
        chime();
        spinning = false;
      }
    }, 70);
  });

  /* ================= LORE FLIP CARDS ================= */
  $$(".flip").forEach((f) => f.addEventListener("click", () => f.classList.toggle("on")));

  /* ================= CALENDAR + SHARE ================= */
  const icsDate = (t) => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = icsDate(KICKOFF), end = icsDate(KICKOFF + GAME_LENGTH);
  const gcal = new URL("https://calendar.google.com/calendar/render");
  gcal.searchParams.set("action", "TEMPLATE");
  gcal.searchParams.set("text", "🏈 " + G.title);
  gcal.searchParams.set("dates", `${start}/${end}`);
  gcal.searchParams.set("location", "M&T Bank Stadium, " + G.address);
  gcal.searchParams.set("details", "Clear bags only. Stadium is cashless. CAW CAW. " + G.url);
  $("#gcalBtn").href = gcal.toString();

  $("#icsBtn").addEventListener("click", () => {
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Operation Purple Sunday//EN", "BEGIN:VEVENT",
      `UID:purple-sunday-${start}@ravens-game`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:🏈 ${G.title}`, `LOCATION:M&T Bank Stadium\\, ${G.address.replace(/,/g, "\\,")}`,
      `DESCRIPTION:Clear bags only. Stadium is cashless. CAW CAW. ${G.url}`,
      "BEGIN:VALARM", "TRIGGER:-PT4H", "ACTION:DISPLAY", "DESCRIPTION:Gameday! Leave soon.", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "ravens-bengals.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  $("#shareBtn").addEventListener("click", async () => {
    const msg = $("#shareMsg");
    const data = { title: "OPERATION: PURPLE SUNDAY", text: "The crew's Ravens game command center 💜🐦‍⬛ (tap the photo)", url: G.url };
    try {
      if (navigator.share) { await navigator.share(data); msg.textContent = "Shared. The flock grows."; }
      else { await navigator.clipboard.writeText(G.url); msg.textContent = "Link copied! Paste it everywhere."; }
    } catch { msg.textContent = G.url; }
  });

  // welcome volley
  if (!reduceMotion) setTimeout(() => { burst(W / 2, H * 0.25, 60, { speed: [3, 12] }); rainbowRing(W / 2, H * 0.4, W); }, 400);
})();
