(() => {
  "use strict";

  // Capturas por preset, em img/presets/<preset>-<n>.jpg (1920 px) com a miniatura <preset>-<n>-sm.jpg (640 px).
  const capture = (preset, n, biome) => ({ src: `img/presets/${preset}-${n}.jpg`, thumb: `img/presets/${preset}-${n}-sm.jpg`, biome });
  const PRESETS = {
    "ultra-low": {
      name: "Ultra Baixo",
      shots: [
        capture("ultra-low", 1, "Selva"),
        capture("ultra-low", 2, "Noite de lua"),
        capture("ultra-low", 3, "Por do sol na savana"),
        capture("ultra-low", 4, "Vila a beira do lago"),
        capture("ultra-low", 5, "Lago na selva"),
        capture("ultra-low", 6, "Caverna com lava")
      ]
    },
    low: {
      name: "Baixo",
      shots: [
        capture("low", 1, "The End"),
        capture("low", 2, "Nether"),
        capture("low", 3, "Floresta nevada"),
        capture("low", 4, "Selva de bambu"),
        capture("low", 5, "Rio entre montanhas"),
        capture("low", 6, "Floresta de betulas")
      ]
    },
    medium: {
      name: "Medio",
      shots: [
        capture("medium", 1, "Deserto"),
        capture("medium", 2, "Badlands"),
        capture("medium", 3, "Jardim palido"),
        capture("medium", 4, "Floresta outonal"),
        capture("medium", 5, "Cavernas exuberantes"),
        capture("medium", 6, "Rio nas badlands")
      ]
    }
  };
  const DEFAULT_PRESET = "medium";

  // Fundos do topo da página, carregados sob demanda e trocados com crossfade.
  const BACKGROUNDS = [
    { src: "img/hero.jpg", thumb: "img/hero-thumb.jpg", name: "Floresta outonal" },
    { src: "img/presets/medium-5.jpg", thumb: "img/presets/medium-5-sm.jpg", name: "Cavernas exuberantes" },
    { src: "img/presets/medium-2.jpg", thumb: "img/presets/medium-2-sm.jpg", name: "Badlands" },
    { src: "img/presets/medium-1.jpg", thumb: "img/presets/medium-1-sm.jpg", name: "Deserto" },
    { src: "img/presets/medium-3.jpg", thumb: "img/presets/medium-3-sm.jpg", name: "Jardim palido" },
    { src: "img/presets/medium-6.jpg", thumb: "img/presets/medium-6-sm.jpg", name: "Rio nas badlands" }
  ];
  const BG_INTERVAL = 7000;

  const gsap = window.gsap;
  const hasGsap = typeof gsap !== "undefined";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = hasGsap && !reduceMotion;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- troca de texto no lugar (150 ms, 4 px) ---------- */
  const SWAP_MS = 150;
  const swapTimers = new WeakMap();
  function swapText(el, next, dir = 1) {
    clearTimeout(swapTimers.get(el));
    if (reduceMotion || !el.textContent) {
      el.classList.remove("is-exit", "is-enter-start");
      el.textContent = next;
      return;
    }
    el.style.setProperty("--swap-dir", dir < 0 ? "-1" : "1");
    el.classList.add("is-exit");
    swapTimers.set(el, setTimeout(() => {
      el.textContent = next;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      el.getBoundingClientRect();
      el.classList.remove("is-enter-start");
    }, SWAP_MS));
  }

  // Liga uma classe quando o elemento entra na tela, uma vez so.
  function onceInView(el, cb, rootMargin = "0px 0px -15% 0px") {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { cb(el); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cb(el);
    }, { rootMargin });
    io.observe(el);
  }

  /* ---------- imagens ---------- */
  const imageCache = new Map();
  function loadImage(src) {
    if (!imageCache.has(src)) {
      imageCache.set(src, new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
        img.onerror = reject;
        img.src = src;
      }));
    }
    return imageCache.get(src);
  }

  /* ---------- transição pixelizada com dither (Bayer 8 x 8) ---------- */
  const BAYER8 = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
  ];

  class DitherSwap {
    constructor(host, { fill = "#141517", maxBlock = 14, cell = 6 } = {}) {
      this.host = host;
      this.fill = fill;
      this.maxBlock = maxBlock;
      this.cell = cell;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "dither-canvas";
      this.canvas.setAttribute("aria-hidden", "true");
      host.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.small = document.createElement("canvas");
      this.sctx = this.small.getContext("2d");
      this.layer = document.createElement("canvas");
      this.lctx = this.layer.getContext("2d");
      this.mask = document.createElement("canvas");
      this.mctx = this.mask.getContext("2d");
      this.tween = null;
    }
    resize() {
      const r = this.host.getBoundingClientRect();
      this.W = Math.max(1, Math.round(r.width));
      this.H = Math.max(1, Math.round(r.height));
      for (const c of [this.canvas, this.layer]) {
        if (c.width !== this.W) c.width = this.W;
        if (c.height !== this.H) c.height = this.H;
      }
    }
    cover(ctx, src, w, h) {
      if (!src) { ctx.fillStyle = this.fill; ctx.fillRect(0, 0, w, h); return; }
      const s = Math.max(w / src.naturalWidth, h / src.naturalHeight);
      const dw = src.naturalWidth * s, dh = src.naturalHeight * s;
      ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    pixelated(ctx, src, block) {
      if (block <= 1) { ctx.imageSmoothingEnabled = true; this.cover(ctx, src, this.W, this.H); return; }
      const w = Math.max(1, Math.ceil(this.W / block)), h = Math.max(1, Math.ceil(this.H / block));
      if (this.small.width !== w) this.small.width = w;
      if (this.small.height !== h) this.small.height = h;
      this.sctx.imageSmoothingEnabled = true;
      this.cover(this.sctx, src, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.small, 0, 0, w, h, 0, 0, w * block, h * block);
    }
    buildMask(p) {
      const w = Math.ceil(this.W / this.cell), h = Math.ceil(this.H / this.cell);
      if (this.mask.width !== w) this.mask.width = w;
      if (this.mask.height !== h) this.mask.height = h;
      const data = this.mctx.createImageData(w, h);
      const d = data.data, t = p * 64;
      for (let y = 0; y < h; y++) {
        const row = (y & 7) * 8;
        for (let x = 0; x < w; x++) d[(y * w + x) * 4 + 3] = BAYER8[row + (x & 7)] < t ? 255 : 0;
      }
      this.mctx.putImageData(data, 0, 0);
    }
    render(from, to, p) {
      const block = Math.max(1, Math.round(1 + (this.maxBlock - 1) * Math.sin(Math.PI * p)));
      const ctx = this.ctx, l = this.lctx;
      ctx.globalCompositeOperation = "source-over";
      this.pixelated(ctx, from, block);
      l.globalCompositeOperation = "source-over";
      l.clearRect(0, 0, this.W, this.H);
      this.pixelated(l, to, block);
      this.buildMask(p);
      l.globalCompositeOperation = "destination-in";
      l.imageSmoothingEnabled = false;
      l.drawImage(this.mask, 0, 0, this.mask.width, this.mask.height, 0, 0, this.mask.width * this.cell, this.mask.height * this.cell);
      l.globalCompositeOperation = "source-over";
      ctx.drawImage(this.layer, 0, 0);
    }
    run(from, to, duration, onSwap) {
      if (this.tween) this.tween.progress(1);
      this.resize();
      this.render(from, to, 0);
      this.host.classList.add("is-dithering");
      const state = { p: 0 };
      return new Promise((resolve) => {
        this.tween = gsap.to(state, {
          p: 1,
          duration,
          ease: "power1.inOut",
          onUpdate: () => this.render(from, to, state.p),
          onComplete: () => {
            this.tween = null;
            onSwap && onSwap();
            this.host.classList.remove("is-dithering");
            resolve();
          }
        });
      });
    }
  }

  /* ---------- header ---------- */
  const header = $(".site-header");
  const hero = $(".hero");
  const updateHeader = () => header.classList.toggle("is-solid", window.scrollY > hero.offsetHeight - header.offsetHeight - 40);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  // Barra de XP: progresso da leitura em 18 segmentos, como no jogo.
  function setupXpBar() {
    const fill = $(".xp-bar__fill");
    if (!fill) return;
    const SEGMENTS = 18;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = `scaleX(${Math.round(p * SEGMENTS) / SEGMENTS})`;
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    update();
  }

  /* ---------- hero: hotbar de fundos, troca em dither, luz de tocha e particulas ---------- */
  function setupHero() {
    const host = $(".hero__zoom");
    const heroImg = $(".hero__img", host);
    const picker = $(".bg-picker");
    const nameEl = $(".bg-picker__name .swap-text");
    const dotsEl = $(".bg-picker__dots");
    const toggle = $(".pixel-toggle");
    const swap = animate ? new DitherSwap(host, { fill: "#1b1c1f", maxBlock: 16, cell: 8 }) : null;
    const st = { index: 0, paused: !animate, timer: 0, busy: false, visible: true };

    // Hotbar: um slot por fundo, com a moldura de selecao deslizando entre eles.
    const selector = document.createElement("span");
    selector.className = "hotbar__selector";
    selector.setAttribute("aria-hidden", "true");
    const timer = document.createElement("span");
    timer.className = "hotbar__timer";
    selector.appendChild(timer);

    const tip = document.createElement("span");
    tip.className = "pixel-tip";
    tip.setAttribute("aria-hidden", "true");
    picker.appendChild(tip);
    let tipTimer = 0;
    const showTip = (slot, name) => {
      clearTimeout(tipTimer);
      const move = () => {
        tip.textContent = name;
        const pr = picker.getBoundingClientRect(), sr = slot.getBoundingClientRect();
        tip.style.left = `${sr.left - pr.left + sr.width / 2}px`;
        tip.classList.add("is-open");
      };
      // 80 ms de intencao so na primeira abertura; entre slots o balao viaja direto.
      if (tip.classList.contains("is-open")) move();
      else tipTimer = setTimeout(move, 80);
    };
    const hideTip = () => { clearTimeout(tipTimer); tip.classList.remove("is-open"); };

    const slots = BACKGROUNDS.map((bg, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bg-dot";
      b.setAttribute("aria-label", `Fundo: ${bg.name}`);
      b.setAttribute("aria-current", i === 0 ? "true" : "false");
      const ti = document.createElement("img");
      ti.src = bg.thumb; ti.alt = ""; ti.width = 40; ti.height = 40; ti.decoding = "async";
      b.appendChild(ti);
      b.addEventListener("click", () => { show(i); restart(); });
      b.addEventListener("pointerenter", () => showTip(b, bg.name));
      b.addEventListener("focus", () => showTip(b, bg.name));
      b.addEventListener("pointerleave", hideTip);
      b.addEventListener("blur", hideTip);
      dotsEl.appendChild(b);
      return b;
    });
    dotsEl.appendChild(selector);

    const place = () => { selector.style.transform = `translateX(${slots[st.index].offsetLeft}px)`; };
    const label = () => {
      swapText(nameEl, BACKGROUNDS[st.index].name);
      slots.forEach((d, i) => d.setAttribute("aria-current", i === st.index ? "true" : "false"));
      place();
    };
    label();
    window.addEventListener("resize", place, { passive: true });

    const syncPaused = () => {
      toggle.setAttribute("aria-pressed", st.paused ? "true" : "false");
      toggle.setAttribute("aria-label", st.paused ? "Retomar a troca de fundo" : "Pausar a troca de fundo");
      hero.classList.toggle("is-paused", st.paused);
    };
    syncPaused();

    async function show(i) {
      if (st.busy || i === st.index) return;
      const next = BACKGROUNDS[i];
      st.busy = true;
      try {
        const [fromImg, toImg] = await Promise.all([loadImage(BACKGROUNDS[st.index].src), loadImage(next.src)]);
        st.index = i;
        label();
        if (swap) await swap.run(fromImg, toImg, 0.9, () => { heroImg.src = next.src; });
        else heroImg.src = next.src;
      } catch (error) {
        console.error(`Nao foi possivel carregar o fundo "${next.name}".`, error);
      } finally {
        st.busy = false;
      }
    }
    function tick() { if (!st.paused && st.visible && !document.hidden) show((st.index + 1) % BACKGROUNDS.length); }
    function restart() {
      clearInterval(st.timer);
      st.timer = setInterval(tick, BG_INTERVAL);
      // reinicia a contagem visual do slot ativo
      timer.style.animation = "none";
      timer.getBoundingClientRect();
      timer.style.removeProperty("animation");
    }

    toggle.addEventListener("click", () => {
      st.paused = !st.paused;
      syncPaused();
      if (!st.paused) restart();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        st.visible = entries[0].isIntersecting;
        hero.classList.toggle("is-offscreen", !st.visible);
      }, { threshold: 0.2 }).observe(hero);
    }
    restart();

    if (!animate || hero.offsetWidth < 50) return;
    setupHeroLight();
    setupHeroMotes();

    // Entrada unica: o logo sobe em degraus e o resto do bloco entra em seguida.
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".hero__logo", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "steps(8)" }, 0.15)
      .from([".hero__lead", ".hero__actions", ".hero__bar"], { y: 12, opacity: 0, duration: 0.5, stagger: 0.08, clearProps: "transform,opacity" }, 0.45)
      .add(() => hero.classList.add("is-entered"));
  }

  // Luz de tocha: um clarao quente segue o ponteiro sobre a imagem.
  function setupHeroLight() {
    if (!finePointer) return;
    const light = document.createElement("div");
    light.className = "hero__torch";
    light.setAttribute("aria-hidden", "true");
    $(".hero__scrim").after(light);
    let raf = 0, x = 0, y = 0;
    const apply = () => {
      raf = 0;
      // anda em passos de 4 px para o clarao se mover como pixel art
      light.style.setProperty("--mx", `${Math.round(x / 4) * 4}px`);
      light.style.setProperty("--my", `${Math.round(y / 4) * 4}px`);
    };
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      x = e.clientX - r.left; y = e.clientY - r.top;
      light.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    hero.addEventListener("pointerleave", () => light.classList.remove("is-on"));
  }

  // Particulas: pontos de luz quadrados subindo devagar, desenhados em meia resolucao.
  function setupHeroMotes() {
    const canvas = document.createElement("canvas");
    canvas.className = "hero__motes";
    canvas.setAttribute("aria-hidden", "true");
    $(".hero__scrim").after(canvas);
    const ctx = canvas.getContext("2d");
    const SCALE = 3;
    let W = 0, H = 0, motes = [], raf = 0, last = 0;
    const spawn = (anywhere) => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 2,
      size: Math.random() < 0.25 ? 2 : 1,
      vy: 3 + Math.random() * 6,
      sway: 4 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.6 + Math.random() * 1.2
    });
    const resize = () => {
      W = Math.max(1, Math.ceil(hero.offsetWidth / SCALE));
      H = Math.max(1, Math.ceil(hero.offsetHeight / SCALE));
      canvas.width = W; canvas.height = H;
      const count = Math.min(70, Math.round((W * H) / 2600));
      motes = Array.from({ length: count }, () => spawn(true));
    };
    const frame = (now) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y -= m.vy * dt;
        m.phase += dt * m.twinkle;
        if (m.y < -2) { motes[i] = spawn(false); continue; }
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.phase * 2));
        ctx.fillStyle = `rgba(255, 226, 160, ${a.toFixed(2)})`;
        ctx.fillRect(Math.round(m.x + Math.sin(m.phase) * m.sway), Math.round(m.y), m.size, m.size);
      }
      run();
    };
    const active = () => !hero.classList.contains("is-paused") && !hero.classList.contains("is-offscreen") && !document.hidden;
    function run() { if (!raf && active()) { raf = requestAnimationFrame(frame); } }
    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => { last = 0; run(); });
    new MutationObserver(() => { last = 0; run(); }).observe(hero, { attributes: true, attributeFilter: ["class"] });
    run();
  }

  // Quebra de bloco: fragmentos quadrados saltam do ponto do clique nos botoes verdes.
  function setupBlockBurst() {
    if (reduceMotion || !Element.prototype.animate) return;
    const COLORS = ["#6fbf4d", "#46a12e", "#3c8527", "#1f4f17", "#8b5a3c"];
    document.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest(".mcb--green, .preset-tab");
      if (!btn || !e.clientX) return;
      for (let i = 0; i < 9; i++) {
        const bit = document.createElement("span");
        bit.className = "block-bit";
        const size = 4 + Math.floor(Math.random() * 3) * 2;
        bit.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;background:${COLORS[i % COLORS.length]}`;
        document.body.appendChild(bit);
        const angle = (Math.PI * 2 * i) / 9 + Math.random() * 0.6;
        const reach = 26 + Math.random() * 30;
        const dx = Math.cos(angle) * reach, dy = Math.sin(angle) * reach - 18;
        bit.animate([
          { transform: "translate(-50%, -50%)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy}px))`, opacity: 1, offset: 0.5 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 34}px))`, opacity: 0 }
        ], { duration: 460, easing: "steps(9, end)" }).onfinish = () => bit.remove();
      }
    });
  }

  /* ---------- botões: estilo minecraft.com ---------- */
  // minecraft.com = botão bloco 3D, sharp (sem radius), fonte bold/black,
  // hover: lift -1px + sheen diagonal varrendo + brilho + ícone nudge.
  // Mantemos clip-path sharp, com a Silkscreen bold (pixelada) no label.
  function setupButtons() {
    if (!animate) {
      // ainda garante sheen para fallback sem JS animado (CSS puro já faz)
      $$(".mcb").forEach((el) => {
        const face = $(".mcb__face", el);
        if (!face || $(".mcb__sheen", face)) return;
        const s = document.createElement("span");
        s.className = "mcb__sheen";
        s.setAttribute("aria-hidden", "true");
        face.appendChild(s);
      });
      return;
    }
    document.documentElement.classList.add("js-anim");
    $$(".mcb").forEach((el) => {
      const face = $(".mcb__face", el);
      if (!face) return;
      if (!$(".mcb__sheen", face)) {
        const sheen = document.createElement("span");
        sheen.className = "mcb__sheen";
        sheen.setAttribute("aria-hidden", "true");
        face.appendChild(sheen);
      }
      // fill em degraus mantido mas agora só como detalhe sutil (CSS controla opacity)
      if (!$(".mcb__fill", face)) {
        const fill = document.createElement("span");
        fill.className = "mcb__fill";
        fill.setAttribute("aria-hidden", "true");
        face.insertBefore(fill, face.firstChild);
      }
      // remove onda antiga em chars — minecraft não tem wave, tem lift + sheen
      // nenhum JS extra de hover aqui: CSS já faz lift/sheen/icon nudge.
      // Apenas garante que :focus-visible não fique sem feedback
      el.addEventListener("focus", () => el.classList.add("is-focus"));
      el.addEventListener("blur", () => el.classList.remove("is-focus"));
    });
  }

  /* ---------- menu de downloads ---------- */
  function setupDownloadMenus() {
    const options = [
      {
        name: "Modrinth",
        href: "https://modrinth.com/shader/shiroi-visuals",
        logo: "img/icons/modrinth-logo.svg",
        external: true
      }
    ];
    const menus = $$("[data-download-menu]");
    const closeTimers = new WeakMap();

    menus.forEach((menu) => {
      const trigger = $("[data-download-trigger]", menu);
      const panel = $("[data-download-options]", menu);
      options.forEach((option) => {
        const link = document.createElement("a");
        link.className = "mcb mcb--stone download-menu__option";
        link.href = option.href;
        if (option.filename) link.download = option.filename;
        if (option.external) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        link.setAttribute("role", "menuitem");
        link.innerHTML = `<span class="mcb__face">${option.logo ? `<img class="download-menu__logo" src="${option.logo}" alt="">` : ""}<span class="mcb__label">${option.name}</span></span>`;
        link.addEventListener("click", () => close(menu));
        panel.appendChild(link);
      });

      trigger.setAttribute("aria-controls", `download-options-${menus.indexOf(menu) + 1}`);
      panel.id = trigger.getAttribute("aria-controls");
      panel.setAttribute("role", "menu");
      panel.addEventListener("animationend", (event) => {
        if (
          panel.classList.contains("is-closing")
          && event.target === panel.firstElementChild
          && event.animationName === "download-option-exit"
        ) {
          finishClose(menu);
        }
      });
      trigger.addEventListener("click", () => {
        const opening = panel.hidden || panel.classList.contains("is-closing");
        menus.forEach(close);
        if (opening) open(menu);
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" && (panel.hidden || panel.classList.contains("is-closing"))) {
          event.preventDefault();
          open(menu);
          $("[role='menuitem']", panel).focus();
        }
      });
      menu.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          close(menu);
          trigger.focus();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          if (event.target === trigger) return;
          const items = $$("[role='menuitem']", panel);
          const current = items.indexOf(document.activeElement);
          if (current === -1) return;
          event.preventDefault();
          const next = event.key === "ArrowDown"
            ? (current + 1) % items.length
            : (current - 1 + items.length) % items.length;
          items[next].focus();
        }
      });
    });

    function close(menu) {
      const panel = $("[data-download-options]", menu);
      const trigger = $("[data-download-trigger]", menu);
      if (panel.hidden || panel.classList.contains("is-closing")) return;
      trigger.setAttribute("aria-expanded", "false");
      panel.inert = true;
      panel.setAttribute("aria-hidden", "true");
      if (reduceMotion) {
        finishClose(menu);
        return;
      }
      panel.classList.add("is-closing");
      const firstOptionStyle = getComputedStyle(panel.firstElementChild);
      const animationEnd = (value) => {
        const time = parseFloat(value) || 0;
        return value.trim().endsWith("ms") ? time : time * 1000;
      };
      const fallbackDelay = animationEnd(firstOptionStyle.animationDelay)
        + animationEnd(firstOptionStyle.animationDuration)
        + 100;
      closeTimers.set(menu, window.setTimeout(() => finishClose(menu), fallbackDelay));
    }

    function open(menu) {
      const panel = $("[data-download-options]", menu);
      const trigger = $("[data-download-trigger]", menu);
      const timer = closeTimers.get(menu);
      if (timer) window.clearTimeout(timer);
      closeTimers.delete(menu);
      panel.classList.remove("is-closing");
      panel.inert = false;
      panel.removeAttribute("aria-hidden");
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }

    function finishClose(menu) {
      const panel = $("[data-download-options]", menu);
      const timer = closeTimers.get(menu);
      if (timer) window.clearTimeout(timer);
      closeTimers.delete(menu);
      panel.hidden = true;
      panel.inert = false;
      panel.classList.remove("is-closing");
      panel.removeAttribute("aria-hidden");
    }

    document.addEventListener("click", (event) => {
      menus.forEach((menu) => {
        if (!menu.contains(event.target)) close(menu);
      });
    });
  }

  /* ---------- botões magnéticos ---------- */
  // FIXES para evitar bugs:
  // - pointerleave do .magnetic disparava ao mover para o botão filho (gap X value mismatch
  //   x/y CSS hover vs GSAP x/y). Agora normaliza: ignora leave quando vem de/para dentro da zone,
  //   clampa intensidade, pausa durante clique, reduz jitter com lerp, e reseta completamente no blur/unmount.
  // - Sem finePointer (touch/coarse) nem tenta.
  // - quickTo com overwrite único + requestAnimationFrame coalesce.
  function setupMagnetic() {
    if (!animate || !finePointer) return;
    $$(".magnetic").forEach((zone) => {
      const btn = $(".mcb", zone);
      if (!btn) return;
      const inner = $(".mcb__text", btn) || $(".mcb__label", btn);
      let raf = 0;
      let targetX = 0, targetY = 0;
      let isPointerInside = false;
      let isPressed = false;

      const clampStrength = (v, max) => Math.max(-max, Math.min(max, v));
      const MAX_BTN = 14;
      const MAX_INNER = 5;

      const xTo = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3.out", overwrite: true });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3.out", overwrite: true });
      const ix = inner ? gsap.quickTo(inner, "x", { duration: 0.45, ease: "power3.out", overwrite: true }) : null;
      const iy = inner ? gsap.quickTo(inner, "y", { duration: 0.45, ease: "power3.out", overwrite: true }) : null;

      const apply = () => {
        raf = 0;
        if (!isPointerInside || isPressed) return;
        const bx = clampStrength(targetX * 0.18, MAX_BTN);
        const by = clampStrength(targetY * 0.24, MAX_BTN);
        xTo(bx); yTo(by);
        if (ix && iy) {
          ix(clampStrength(targetX * 0.06, MAX_INNER));
          iy(clampStrength(targetY * 0.08, MAX_INNER));
        }
      };

      const onMove = (e) => {
        if (isPressed) return;
        isPointerInside = true;
        const r = zone.getBoundingClientRect();
        targetX = e.clientX - (r.left + r.width / 2);
        targetY = e.clientY - (r.top + r.height / 2);
        if (!raf) raf = requestAnimationFrame(apply);
      };

      const reset = () => {
        isPointerInside = false;
        targetX = 0; targetY = 0;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        // reseta SEM conflitar com o CSS hover lift: lê o x/y atual do GSAP e anima de volta
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "back.out(2.2)", overwrite: "auto" });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.5, ease: "back.out(2.2)", overwrite: "auto" });
      };

      const onLeave = (e) => {
        // evita "flicker" quando pointer vai da zone para o botão (mesmo elemento pai)
        if (e.relatedTarget && zone.contains(e.relatedTarget)) return;
        reset();
      };

      zone.addEventListener("pointermove", onMove, { passive: true });
      zone.addEventListener("pointerleave", onLeave);
      zone.addEventListener("pointerenter", () => { isPointerInside = true; });

      // pausa magnético durante clique para não brigar com :active translateY
      btn.addEventListener("pointerdown", () => { isPressed = true; });
      window.addEventListener("pointerup", () => {
        if (!isPressed) return;
        isPressed = false;
        // se ainda dentro, retoma suavemente
        if (isPointerInside && !raf) raf = requestAnimationFrame(apply);
      });

      // evita ficar "preso" magnético ao trocar de aba / scroll
      document.addEventListener("visibilitychange", () => { if (document.hidden) reset(); });
      // cancela no blur do botão
      btn.addEventListener("blur", reset);
    });
  }

  /* ---------- presets e carrossel ---------- */
  function setupPresets() {
    const tabs = $$(".preset-tab");
    const carousel = $("#carousel");
    const stage = $(".carousel__stage", carousel);
    const stageImg = $(".carousel__img", carousel);
    const thumbs = $(".carousel__thumbs", carousel);
    const biome = $(".carousel__biome", carousel);
    const count = $(".carousel__count", carousel);
    const navButtons = $$(".carousel__nav .mcb", carousel);
    const swap = animate ? new DitherSwap(stage, { fill: "#141517", maxBlock: 12, cell: 5 }) : null;
    const st = { preset: DEFAULT_PRESET, index: 0, busy: false, pending: null };
    const shots = () => PRESETS[st.preset].shots;

    // Aba ativa: um bloco verde desliza ate a aba escolhida (250 ms).
    const switcher = $(".preset-switch");
    const pill = document.createElement("span");
    pill.className = "mcb preset-switch__pill";
    pill.setAttribute("aria-hidden", "true");
    pill.innerHTML = '<span class="mcb__face"><span class="mcb__label swap-text"></span></span>';
    const pillLabel = $(".mcb__label", pill);
    switcher.appendChild(pill);
    switcher.classList.add("has-pill");
    function placePill(instant) {
      const tab = tabs.find((t) => t.getAttribute("aria-selected") === "true");
      if (!tab) return;
      if (instant) pill.style.transition = "none";
      pill.style.width = `${tab.offsetWidth}px`;
      pill.style.height = `${tab.offsetHeight}px`;
      pill.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
      const text = $(".mcb__label", tab).textContent;
      if (instant) { if (pillLabel.textContent !== text) pillLabel.textContent = text; pill.getBoundingClientRect(); pill.style.removeProperty("transition"); }
      else if (pillLabel.textContent !== text) swapText(pillLabel, text);
    }
    if ("ResizeObserver" in window) new ResizeObserver(() => placePill(true)).observe(switcher);
    // a rota traduzida troca os rotulos depois da carga: o bloco acompanha
    new MutationObserver(() => placePill(true)).observe(switcher, { subtree: true, characterData: true, childList: true });

    // Ampliar: a captura abre em um dialogo (abre em 250 ms, fecha em 150 ms).
    let lightbox = null;
    function openLightbox() {
      if (!("HTMLDialogElement" in window)) return;
      if (!lightbox) {
        lightbox = document.createElement("dialog");
        lightbox.className = "lightbox";
        lightbox.innerHTML = '<div class="lightbox__frame"><img class="lightbox__img" alt=""></div>'
          + '<button class="mcb mcb--stone mcb--icon lightbox__close" type="button" aria-label="Fechar">'
          + '<span class="mcb__face"><svg class="mcb__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h2v2h2v2h4V4h2V2h2v2h-2v2h-2v4h2v2h2v2h-2v-2h-2v-2H6v2H4v2H2v-2h2v-2h2V6H4V4H2z"/></svg></span></button>';
        document.body.appendChild(lightbox);
        lightbox.addEventListener("click", (e) => { if (!e.target.closest(".lightbox__img")) closeLightbox(); });
        lightbox.addEventListener("cancel", (e) => { e.preventDefault(); closeLightbox(); });
        lightbox.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(st.index + 1); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); go(st.index - 1); }
        });
      }
      syncLightbox();
      lightbox.classList.remove("is-closing");
      lightbox.showModal();
      lightbox.getBoundingClientRect();
      lightbox.classList.add("is-open");
    }
    function closeLightbox() {
      if (!lightbox || !lightbox.open || lightbox.classList.contains("is-closing")) return;
      lightbox.classList.remove("is-open");
      lightbox.classList.add("is-closing");
      setTimeout(() => { lightbox.classList.remove("is-closing"); lightbox.close(); stage.focus({ preventScroll: true }); }, reduceMotion ? 0 : 150);
    }
    function syncLightbox() {
      if (!lightbox) return;
      const img = $(".lightbox__img", lightbox);
      img.src = stageImg.src;
      img.alt = stageImg.alt;
    }

    function paint() {
      const list = shots();
      navButtons.forEach((b) => { b.disabled = list.length < 2; });
      const shot = list[st.index];
      stageImg.src = shot.src;
      stageImg.alt = `${shot.biome} no preset ${PRESETS[st.preset].name}`;
      swapText(biome, shot.biome);
      const countText = `${st.index + 1} de ${list.length}`;
      if (count.dataset.index === undefined) count.textContent = countText;
      else swapText(count, countText, st.index >= Number(count.dataset.index) ? 1 : -1);
      count.dataset.index = String(st.index);
      syncLightbox();
      $$(".thumb", thumbs).forEach((t, i) => t.setAttribute("aria-current", i === st.index ? "true" : "false"));
    }

    function buildThumbs() {
      thumbs.innerHTML = "";
      shots().forEach((shot, i) => {
        const t = document.createElement("button");
        t.type = "button";
        t.className = "thumb";
        t.setAttribute("aria-label", `Ver ${shot.biome}`);
        const ti = document.createElement("img");
        ti.src = shot.thumb; ti.alt = ""; ti.width = 640; ti.height = 336; ti.loading = "lazy";
        t.appendChild(ti);
        t.addEventListener("click", () => request({ index: i }));
        thumbs.appendChild(t);
      });
    }

    async function apply(target) {
      const nextPreset = target.preset || st.preset;
      const list = PRESETS[nextPreset].shots;
      const nextIndex = ((target.index ?? 0) + list.length) % list.length;
      if (nextPreset === st.preset && nextIndex === st.index) return;
      const fromSrc = shots()[st.index].src;
      const toSrc = list[nextIndex].src;
      const commit = () => {
        const presetChanged = nextPreset !== st.preset;
        st.preset = nextPreset;
        st.index = nextIndex;
        if (presetChanged) buildThumbs();
        paint();
      };
      if (!swap) { commit(); return; }
      try {
        const [fromImg, toImg] = await Promise.all([loadImage(fromSrc), loadImage(toSrc)]);
        await swap.run(fromImg, toImg, 0.7, commit);
      } catch (e) { commit(); }
    }

    async function request(target) {
      if (st.busy) { st.pending = target; return; }
      st.busy = true;
      await apply(target);
      st.busy = false;
      if (st.pending) { const p = st.pending; st.pending = null; request(p); }
    }
    const go = (i) => request({ index: i });

    function selectPreset(id, focusTab) {
      if (!PRESETS[id]) return;
      tabs.forEach((t) => {
        const on = t.dataset.preset === id;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (on) {
          carousel.setAttribute("aria-labelledby", t.id);
          if (focusTab) t.focus();
        }
      });
      placePill(false);
      if (id !== st.preset) request({ preset: id, index: 0 });
    }

    tabs.forEach((t, i) => {
      t.addEventListener("click", () => selectPreset(t.dataset.preset, false));
      t.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        selectPreset(tabs[next].dataset.preset, true);
      });
    });
    navButtons.forEach((b) => b.addEventListener("click", () => go(st.index + Number(b.dataset.dir))));
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(st.index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(st.index - 1); }
    });
    let startX = null, startY = 0;
    stage.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; startX = e.clientX; startY = e.clientY; });
    stage.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(st.index + (dx < 0 ? 1 : -1));
      else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) openLightbox();
    });
    stage.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(); }
    });
    stage.addEventListener("pointercancel", () => { startX = null; });

    buildThumbs();
    paint();
    placePill(true);
  }

  /* ---------- animações de scroll ---------- */
  function setupScroll() {
    if (!animate) return;
    document.documentElement.classList.add("js-reveal");
    $$(".section-title").forEach((el) => onceInView(el, (t) => t.classList.add("is-in")));
    onceInView($(".carousel__frame"), (el) => el.classList.add("is-in"), "0px 0px -20% 0px");
    onceInView($(".steps"), (el) => el.classList.add("is-in"));
  }

  function init() {
    setupDownloadMenus();
    setupButtons();
    setupBlockBurst();
    setupXpBar();
    setupMagnetic();
    setupPresets();
    setupScroll();
    setupHero();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
