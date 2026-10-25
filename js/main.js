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
    { src: "img/hero.jpg", name: "Floresta outonal" },
    { src: "img/presets/medium-5.jpg", name: "Cavernas exuberantes" },
    { src: "img/presets/medium-2.jpg", name: "Badlands" },
    { src: "img/presets/medium-1.jpg", name: "Deserto" },
    { src: "img/presets/medium-3.jpg", name: "Jardim palido" },
    { src: "img/presets/medium-6.jpg", name: "Rio nas badlands" }
  ];
  const BG_INTERVAL = 7000;

  const gsap = window.gsap;
  const hasGsap = typeof gsap !== "undefined";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = hasGsap && !reduceMotion;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";
  if (hasScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

  /* ---------- hero: fundos sob demanda com crossfade de 600 ms ---------- */
  function setupHero() {
    const host = $(".hero__bg");
    const heroImg = $(".hero__img", host);
    const nameEl = $(".bg-picker__name");
    const dotsEl = $(".bg-picker__dots");
    const toggle = $(".pixel-toggle");
    const transitionImg = document.createElement("img");
    transitionImg.className = "hero__img hero__img--transition";
    transitionImg.alt = "";
    transitionImg.setAttribute("aria-hidden", "true");
    transitionImg.loading = "lazy";
    transitionImg.decoding = "async";
    host.appendChild(transitionImg);
    const st = { index: 0, paused: !animate, timer: 0, busy: false, visible: true };

    BACKGROUNDS.forEach((bg, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bg-dot";
      b.setAttribute("aria-label", `Fundo: ${bg.name}`);
      b.title = bg.name;
      b.setAttribute("aria-current", i === 0 ? "true" : "false");
      b.addEventListener("click", () => { show(i); restart(); });
      dotsEl.appendChild(b);
    });
    const label = () => {
      nameEl.textContent = BACKGROUNDS[st.index].name;
      $$(".bg-dot", dotsEl).forEach((d, i) => d.setAttribute("aria-current", i === st.index ? "true" : "false"));
    };
    label();
    toggle.setAttribute("aria-pressed", st.paused ? "true" : "false");
    toggle.setAttribute("aria-label", st.paused ? "Retomar a troca de fundo" : "Pausar a troca de fundo");

    async function show(i) {
      if (st.busy || i === st.index) return;
      const next = BACKGROUNDS[i];
      st.busy = true;
      try {
        const toImg = await loadImage(next.src);
        transitionImg.style.opacity = "0";
        transitionImg.src = toImg.src;
        if (transitionImg.decode) await transitionImg.decode();
        transitionImg.getBoundingClientRect();
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            transitionImg.style.opacity = "1";
            setTimeout(resolve, reduceMotion ? 0 : 600);
          });
        });
        heroImg.src = next.src;
        transitionImg.style.transition = "none";
        transitionImg.style.opacity = "0";
        transitionImg.getBoundingClientRect();
        transitionImg.style.removeProperty("transition");
        st.index = i;
        label();
      } catch (error) {
        console.error(`Nao foi possivel carregar o fundo "${next.name}".`, error);
      } finally {
        st.busy = false;
      }
    }
    function tick() { if (!st.paused && st.visible && !document.hidden) show((st.index + 1) % BACKGROUNDS.length); }
    function restart() { clearInterval(st.timer); st.timer = setInterval(tick, BG_INTERVAL); }

    toggle.addEventListener("click", () => {
      st.paused = !st.paused;
      toggle.setAttribute("aria-pressed", st.paused ? "true" : "false");
      toggle.setAttribute("aria-label", st.paused ? "Retomar a troca de fundo" : "Pausar a troca de fundo");
      if (!st.paused) restart();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => { st.visible = entries[0].isIntersecting; }, { threshold: 0.2 }).observe(hero);
    }
    restart();

    if (!animate || hero.offsetWidth < 50) return;
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(".hero__logo", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "steps(8)" }, 0.5)
      .from([".hero__lead", ".hero__actions", ".hero__chips", ".hero__bar"], { y: 24, opacity: 0, duration: 0.6, stagger: 0.12 }, 0.95);

    if (hasScrollTrigger) {
      gsap.to([".hero__title", ".hero__lead", ".hero__chips"], {
        yPercent: -14, opacity: 0.15, ease: "none",
        scrollTrigger: { trigger: hero, start: "35% top", end: "bottom top", scrub: true }
      });
    }
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
      },
      {
        name: "Iris",
        href: "downloads/Shiroi%20Visuals%20Snapshot%2026.3.7%20-%20Iris%20Release.zip",
        filename: "Shiroi Visuals Snapshot 26.3.7 - Iris Release.zip",
        logo: "img/icons/iris-svg-logo.svg"
      },
      {
        name: "Vitrail",
        href: "downloads/Shiroi%20Visuals%20Snapshot%2026.3.7%20-%20Vitrail%20Compatibility%20Release.zip",
        filename: "Shiroi Visuals Snapshot 26.3.7 - Vitrail Compatibility Release.zip"
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
        gsap.to(btn, { x: 0, y: 0, duration: 0.85, ease: "elastic.out(1, 0.38)", overwrite: "auto" });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.85, ease: "elastic.out(1, 0.38)", overwrite: "auto" });
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

    function paint() {
      const list = shots();
      navButtons.forEach((b) => { b.disabled = list.length < 2; });
      const shot = list[st.index];
      stageImg.src = shot.src;
      stageImg.alt = `${shot.biome} no preset ${PRESETS[st.preset].name}`;
      biome.textContent = shot.biome;
      count.textContent = `${st.index + 1} de ${list.length}`;
      $$(".thumb", thumbs).forEach((t, i) => t.setAttribute("aria-current", i === st.index ? "true" : "false"));
      const active = $$(".thumb", thumbs)[st.index];
      if (active) thumbs.scrollTo({ left: active.offsetLeft - thumbs.clientWidth / 2 + active.offsetWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
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
        await swap.run(fromImg, toImg, 0.95, commit);
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
    });
    stage.addEventListener("pointercancel", () => { startX = null; });

    buildThumbs();
    paint();
  }

  /* ---------- animações de scroll ---------- */
  function setupScroll() {
    if (!hasScrollTrigger || reduceMotion) return;

    gsap.from(".carousel__frame", {
      y: 40, opacity: 0, duration: 0.8, ease: "steps(6)",
      scrollTrigger: { trigger: ".presets", start: "top 70%", once: true }
    });
    gsap.from(".preset-tab", {
      opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.08,
      scrollTrigger: { trigger: ".preset-switch", start: "top 85%", once: true }
    });
    gsap.from(".step", {
      y: 28, opacity: 0, duration: 0.6, ease: "steps(5)", stagger: 0.12,
      scrollTrigger: { trigger: ".steps", start: "top 82%", once: true }
    });
    gsap.from(".footer__grid > *", {
      y: 24, opacity: 0, duration: 0.5, ease: "steps(4)", stagger: 0.08,
      scrollTrigger: { trigger: ".site-footer", start: "top 92%", once: true }
    });
  }

  /* ---------- preloader de pixeis grandes + wipe ---------- */
  async function runPreloader() {
    const pre = document.getElementById("preloader");
    if (!pre) return;
    const grid = pre.querySelector(".preloader__grid");
    const fill = pre.querySelector(".preloader__fill");
    const pctEl = pre.querySelector(".preloader__pct");
    const track = pre.querySelector(".preloader__track");
    const center = pre.querySelector(".preloader__center");

    const isMobile = window.innerWidth < 700;
    const PIXEL = isMobile ? 36 : 56;

    function buildGrid(container, pixel) {
      const cols = Math.ceil(window.innerWidth / pixel);
      const rows = Math.ceil(window.innerHeight / pixel);
      const cappedCols = Math.min(cols, 36);
      const cappedRows = Math.min(rows, 20);
      // se for muito grande (4K), aumenta o pixel para não criar 2000 divs
      let c = cols, r = rows;
      if (c * r > 720) {
        const scale = Math.sqrt((c * r) / 720);
        const bigger = Math.ceil(pixel * scale);
        c = Math.ceil(window.innerWidth / bigger);
        r = Math.ceil(window.innerHeight / bigger);
      } else {
        c = cappedCols; r = cappedRows;
        // recalcula para cobrir tela mesmo capando, usa fr então ok — mas mantém proporção
        c = cols; r = rows;
        if (c * r > 720) {
          c = Math.ceil(cols * 0.85);
          r = Math.ceil(rows * 0.85);
        }
      }
      container.style.gridTemplateColumns = `repeat(${c}, 1fr)`;
      container.style.gridTemplateRows = `repeat(${r}, 1fr)`;
      container.innerHTML = "";
      const cells = [];
      for (let i = 0; i < c * r; i++) {
        const s = document.createElement("span");
        const rnd = Math.random();
        if (rnd < 0.11) s.classList.add("is-grass");
        else if (rnd < 0.18) s.classList.add("is-stone");
        else if (rnd < 0.22) s.classList.add("is-dirt");
        else if (rnd < 0.25) s.classList.add("is-sky");
        container.appendChild(s);
        cells.push(s);
      }
      return { cols: c, rows: r, cells };
    }

    const { cols, rows, cells } = buildGrid(grid, PIXEL);

    // Reduced motion: sai rápido sem blocos
    if (reduceMotion || !hasGsap) {
      if (fill) fill.style.width = "100%";
      if (pctEl) pctEl.textContent = "100%";
      if (track) track.setAttribute("aria-valuenow", "100");
      await new Promise((res) => setTimeout(res, 260));
      pre.style.transition = "opacity 0.26s ease";
      pre.style.opacity = "0";
      await new Promise((res) => setTimeout(res, 300));
      pre.remove();
      document.body.classList.remove("is-preloading");
      return;
    }

    // entrada dos blocos grandes
    gsap.set(cells, { scale: 0, opacity: 1, transformOrigin: "center center" });
    gsap.to(cells, {
      scale: 1,
      duration: 0.46,
      ease: "power2.out",
      stagger: { amount: 0.34, from: "center", grid: [rows, cols] },
      overwrite: true
    });
    gsap.set(center, { scale: 0.96, opacity: 0, y: 8 });
    gsap.to(center, { scale: 1, opacity: 1, y: 0, duration: 0.48, ease: "power3.out", delay: 0.18 });

    // progresso simulado + espera load real (rápido)
    let p = 0;
    const start = performance.now();
    const MIN_MS = 820;
    const MAX_MS = 1550;
    let loadDone = document.readyState === "complete";
    if (!loadDone) {
      window.addEventListener("load", () => { loadDone = true; }, { once: true });
      setTimeout(() => { loadDone = true; }, MAX_MS);
    } else {
      setTimeout(() => { loadDone = true; }, 120);
    }
    // pre-carrega hero para não dar flash
    const heroPre = document.querySelector(".hero__img");
    if (heroPre) loadImage(heroPre.currentSrc || heroPre.src).catch(() => {});

    await new Promise((resolve) => {
      let rafId = 0;
      const tick = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / MIN_MS);
        const eased = 1 - Math.pow(1 - t, 2.4);
        let target = Math.floor(eased * 88);
        if (loadDone && elapsed > MIN_MS) target = 100;
        else if (elapsed > MAX_MS - 120) target = 100;
        if (target > p) {
          p = Math.min(100, Math.floor(p + Math.max(1, (target - p) * 0.42)));
          if (Math.random() < 0.06 && p < 99) p = Math.min(99, p + 1);
          if (fill) fill.style.width = p + "%";
          if (pctEl) pctEl.textContent = p + "%";
          if (track) track.setAttribute("aria-valuenow", String(p));
          // pisca alguns blocos para dar vida
          if (p % 9 === 0 || p > 96) {
            for (let k = 0; k < 3; k++) {
              const idx = Math.floor(Math.random() * cells.length);
              const c = cells[idx];
              c.classList.remove("is-grass", "is-stone", "is-dirt", "is-sky");
              const rr = Math.random();
              if (p > 68 && rr < 0.45) c.classList.add("is-grass");
              else if (rr < 0.28) c.classList.add("is-stone");
              else if (rr < 0.36) c.classList.add("is-dirt");
            }
          }
        }
        if (p >= 100) resolve();
        else rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    });

    await new Promise((r) => setTimeout(r, 140));
    pre.classList.add("is-dismissing");
    pre.setAttribute("aria-busy", "false");

    // centro some
    await gsap.to(center, { scale: 0.94, y: -6, opacity: 0, duration: 0.26, ease: "power2.in" });

    // dissolução dos pixeis grandes — a transição principal
    await gsap.to(cells, {
      scale: 0,
      opacity: 0,
      duration: 0.54,
      ease: "power2.in",
      stagger: { amount: 0.58, from: "random", grid: [rows, cols] }
    });
    // fade final do overlay
    await gsap.to(pre, { opacity: 0, duration: 0.20, ease: "power1.out" });
    pre.remove();
    document.body.classList.remove("is-preloading");

    // --- segunda transição: pixel wipe grande varrendo a tela ---
    // cobre 1 frame e dissolve em blocos grandes (64px) de baixo para cima
    const wipe = document.createElement("div");
    wipe.className = "pixel-wipe";
    wipe.setAttribute("aria-hidden", "true");
    const WPIXEL = isMobile ? 40 : 64;
    const wCols = Math.ceil(window.innerWidth / WPIXEL);
    const wRows = Math.ceil(window.innerHeight / WPIXEL);
    wipe.style.gridTemplateColumns = `repeat(${wCols}, 1fr)`;
    wipe.style.gridTemplateRows = `repeat(${wRows}, 1fr)`;
    const wCells = [];
    for (let i = 0; i < wCols * wRows; i++) {
      const s = document.createElement("span");
      const v = Math.random();
      if (v < 0.07) s.style.background = "#3c8527";
      else if (v < 0.13) s.style.background = "#4f5157";
      else if (v < 0.17) s.style.background = "#6b4a2b";
      else s.style.background = "#1a1c1e";
      wipe.appendChild(s);
      wCells.push(s);
    }
    document.body.appendChild(wipe);
    gsap.set(wCells, { scale: 1, opacity: 1, transformOrigin: "center center" });
    // pequena pausa para o wipe ser percebido
    await new Promise((r) => setTimeout(r, 70));
    await gsap.to(wCells, {
      scale: 0,
      opacity: 0,
      duration: 0.62,
      ease: "power2.inOut",
      stagger: { amount: 0.52, from: "end", grid: [wRows, wCols] }
    });
    await gsap.to(wipe, { opacity: 0, duration: 0.16, ease: "power1.out", onComplete: () => wipe.remove() });
  }

  async function init() {
    await runPreloader();
    setupDownloadMenus();
    setupButtons();
    setupMagnetic();
    setupPresets();
    setupScroll();
    setupHero();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
