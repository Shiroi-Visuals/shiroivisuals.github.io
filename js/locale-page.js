(() => {
  "use strict";

  const locale = document.currentScript?.dataset.locale;
  const TEXT = {
    en: {
      pageTitle: "Shiroi Visuals | Shader for Minecraft Java",
      pageDescription: "Shiroi Visuals is a shader for Minecraft Java inspired by Vibrant Visuals, with dynamic lighting, pixelated water, lavender nights, and dark caves.",
      "Pular para o conteúdo": "Skip to content",
      "Pular para o conteudo": "Skip to content",
      "Shiroi Visuals, início": "Shiroi Visuals, home",
      "Shiroi Visuals, inicio": "Shiroi Visuals, home",
      "Seções": "Sections",
      "Secoes": "Sections",
      "Fundo:": "Background:",
      "Instalar": "Install",
      "Baixar": "Download",
      "Baixar no Modrinth": "Download on Modrinth",
      "Versão 10.3, arquivo .zip de 332 KB": "Version 10.3, 332 KB .zip file",
      "Shader para Minecraft Java inspirado no Vibrant Visuals: luz que muda com a hora, água com ondas em pixel, noites lavanda e cavernas escuras de verdade.": "A Minecraft Java shader inspired by Vibrant Visuals, with changing light, pixel-wave water, lavender nights, and truly dark caves.",
      "Uma experiencia completa para o Java Edition, deixando seu mundo mais bonito sem deixar de parecer... Ah... Vanilla?": "A complete Java Edition experience, making your world look better while still feeling... well... Vanilla?",
      "Uma experiencia completa para o Java Edition, deixando seu mundo mais bonito sem deixar de parecer... Ah.. Vanilla?": "A complete Java Edition experience, making your world look better while still feeling... well... Vanilla?",
      "Ver presets": "View presets",
      "Inspirado no Vibrant Visuals, para o Java": "Inspired by Vibrant Visuals, for Java",
      "Fundo da página": "Page background",
      "Fundo da pagina": "Page background",
      "Pausar a troca de fundo": "Pause background rotation",
      "Retomar a troca de fundo": "Resume background rotation",
      "Rolar para os presets": "Scroll to presets",
      "Escolha o preset e veja no jogo": "Choose a preset and see it in game",
      "Do Ultra Baixo, para gráficos integrados, até o Médio, o padrão do pack.": "From Ultra Low for integrated graphics to Medium, the pack's default.",
      "Preset": "Preset",
      "Ultra Baixo": "Ultra Low",
      "Gráficos integrados": "Integrated graphics",
      "Baixo": "Low",
      "Placas de entrada": "Entry-level graphics cards",
      "Médio": "Medium",
      "Medio": "Medium",
      "Equilíbrio padrão": "Balanced default",
      "carrossel": "carousel",
      "Capturas do preset. Use as setas do teclado para trocar.": "Preset screenshots. Use the arrow keys to switch.",
      "Captura anterior": "Previous screenshot",
      "Próxima captura": "Next screenshot",
      "Proxima captura": "Next screenshot",
      "Escolher captura": "Choose screenshot",
      "Como instalar": "How to install",
      "Instale o": "Install",
      "para o Minecraft Java 26.3.": "for Minecraft Java 26.3.",
      "Coloque o arquivo .zip na pasta": "Place the .zip file in the",
      ", sem extrair.": "folder without extracting it.",
      "No jogo, abra Opções, Vídeo, Shader Packs e escolha Shiroi Visuals V10.3.": "In game, open Options, Video, Shader Packs, then select Shiroi Visuals V10.3.",
      "No jogo, abra Opcoes, Video, Shader Packs e escolha Shiroi Visuals V10.3.": "In game, open Options, Video, Shader Packs, then select Shiroi Visuals V10.3.",
      "Escolha o preset no menu do shader. O padrão é o Médio.": "Choose a preset in the shader menu. The default is Medium.",
      "Escolha o preset no menu do shader. O padrao e o Medio.": "Choose a preset in the shader menu. The default is Medium.",
      "Baixar Shiroi Visuals": "Download Shiroi Visuals",
      "Shader para Minecraft Java inspirado no Vibrant Visuals, do Ultra Baixo ao Médio.": "A Minecraft Java shader inspired by Vibrant Visuals, from Ultra Low to Medium.",
      "Shader para Minecraft Java inspirado no Vibrant Visuals.": "A Minecraft Java shader inspired by Vibrant Visuals.",
      "Navegar": "Navigate",
      "Requisitos": "Requirements",
      "Do gráfico integrado à placa forte": "From integrated graphics to powerful GPUs",
      "Versão 10.3": "Version 10.3",
      "23 de outubro de 2026": "October 23, 2026",
      "Shiroi Visuals é um projeto independente, não afiliado à Mojang nem à Microsoft. Minecraft e Vibrant Visuals são marcas da Mojang Studios.": "Shiroi Visuals is an independent project and is not affiliated with Mojang or Microsoft. Minecraft and Vibrant Visuals are trademarks of Mojang Studios.",
      "Shiroi Visuals e um projeto independente, nao afiliado a Mojang nem a Microsoft. Minecraft e Vibrant Visuals sao marcas da Mojang Studios.": "Shiroi Visuals is an independent project and is not affiliated with Mojang or Microsoft. Minecraft and Vibrant Visuals are trademarks of Mojang Studios.",
      "Topo": "Top",
      "Floresta outonal": "Autumn forest",
      "Cavernas exuberantes": "Lush caves",
      "Badlands": "Badlands",
      "Savana": "Savanna",
      "Jardim pálido": "Pale garden",
      "Jardim palido": "Pale garden",
      "Rio nas badlands": "Badlands river",
      "Selva": "Jungle",
      "Noite de lua": "Moonlit night",
      "Pôr do sol na savana": "Savanna sunset",
      "Por do sol na savana": "Savanna sunset",
      "Vila à beira do lago": "Lakeside village",
      "Vila a beira do lago": "Lakeside village",
      "Lago na selva": "Jungle lake",
      "Caverna com lava": "Lava cave",
      "The End": "The End",
      "Nether": "Nether",
      "Floresta nevada": "Snowy forest",
      "Selva de bambu": "Bamboo jungle",
      "Rio entre montanhas": "Mountain river",
      "Floresta de bétulas": "Birch forest",
      "Floresta de betulas": "Birch forest"
    },
    es: {
      pageTitle: "Shiroi Visuals | Shader para Minecraft Java",
      pageDescription: "Shiroi Visuals es un shader para Minecraft Java inspirado en Vibrant Visuals, con iluminacion dinamica, agua pixelada, noches lavanda y cuevas oscuras.",
      "Pular para o conteúdo": "Saltar al contenido",
      "Pular para o conteudo": "Saltar al contenido",
      "Shiroi Visuals, início": "Shiroi Visuals, inicio",
      "Shiroi Visuals, inicio": "Shiroi Visuals, inicio",
      "Seções": "Secciones",
      "Secoes": "Secciones",
      "Fundo:": "Fondo:",
      "Instalar": "Instalar",
      "Baixar": "Descargar",
      "Baixar no Modrinth": "Descargar en Modrinth",
      "Versão 10.3, arquivo .zip de 332 KB": "Version 10.3, archivo .zip de 332 KB",
      "Shader para Minecraft Java inspirado no Vibrant Visuals: luz que muda com a hora, água com ondas em pixel, noites lavanda e cavernas escuras de verdade.": "Un shader para Minecraft Java inspirado en Vibrant Visuals, con iluminacion cambiante, agua pixelada, noches lavanda y cuevas realmente oscuras.",
      "Uma experiencia completa para o Java Edition, deixando seu mundo mais bonito sem deixar de parecer... Ah... Vanilla?": "Una experiencia completa para Java Edition, con un mundo mas bonito que aun se siente... bueno... Vanilla?",
      "Uma experiencia completa para o Java Edition, deixando seu mundo mais bonito sem deixar de parecer... Ah.. Vanilla?": "Una experiencia completa para Java Edition, con un mundo mas bonito que aun se siente... bueno... Vanilla?",
      "Ver presets": "Ver presets",
      "Inspirado no Vibrant Visuals, para o Java": "Inspirado en Vibrant Visuals, para Java",
      "Fundo da página": "Fondo de la pagina",
      "Fundo da pagina": "Fondo de la pagina",
      "Pausar a troca de fundo": "Pausar el cambio de fondo",
      "Retomar a troca de fundo": "Reanudar el cambio de fondo",
      "Rolar para os presets": "Desplazarse a los presets",
      "Escolha o preset e veja no jogo": "Elige un preset y miralo en el juego",
      "Do Ultra Baixo, para gráficos integrados, até o Médio, o padrão do pack.": "Desde Ultra bajo para graficos integrados hasta Medio, el preset predeterminado.",
      "Preset": "Preset",
      "Ultra Baixo": "Ultra bajo",
      "Gráficos integrados": "Graficos integrados",
      "Baixo": "Bajo",
      "Placas de entrada": "Tarjetas graficas de gama de entrada",
      "Médio": "Medio",
      "Medio": "Medio",
      "Equilíbrio padrão": "Equilibrio predeterminado",
      "carrossel": "carrusel",
      "Capturas do preset. Use as setas do teclado para trocar.": "Capturas del preset. Usa las flechas del teclado para cambiar.",
      "Captura anterior": "Captura anterior",
      "Próxima captura": "Captura siguiente",
      "Proxima captura": "Captura siguiente",
      "Escolher captura": "Elegir captura",
      "Como instalar": "Como instalar",
      "Instale o": "Instala",
      "para o Minecraft Java 26.3.": "para Minecraft Java 26.3.",
      "Coloque o arquivo .zip na pasta": "Coloca el archivo .zip en la carpeta",
      ", sem extrair.": "sin extraerlo.",
      "No jogo, abra Opções, Vídeo, Shader Packs e escolha Shiroi Visuals V10.3.": "En el juego, abre Opciones, Video, Shader Packs y selecciona Shiroi Visuals V10.3.",
      "No jogo, abra Opcoes, Video, Shader Packs e escolha Shiroi Visuals V10.3.": "En el juego, abre Opciones, Video, Shader Packs y selecciona Shiroi Visuals V10.3.",
      "Escolha o preset no menu do shader. O padrão é o Médio.": "Elige el preset en el menu del shader. El predeterminado es Medio.",
      "Escolha o preset no menu do shader. O padrao e o Medio.": "Elige el preset en el menu del shader. El predeterminado es Medio.",
      "Baixar Shiroi Visuals": "Descargar Shiroi Visuals",
      "Shader para Minecraft Java inspirado no Vibrant Visuals, do Ultra Baixo ao Médio.": "Shader para Minecraft Java inspirado en Vibrant Visuals, desde Ultra bajo hasta Medio.",
      "Shader para Minecraft Java inspirado no Vibrant Visuals.": "Shader para Minecraft Java inspirado en Vibrant Visuals.",
      "Navegar": "Navegar",
      "Requisitos": "Requisitos",
      "Do gráfico integrado à placa forte": "Desde graficos integrados hasta tarjetas graficas potentes",
      "Versão 10.3": "Version 10.3",
      "23 de outubro de 2026": "23 de octubre de 2026",
      "Shiroi Visuals é um projeto independente, não afiliado à Mojang nem à Microsoft. Minecraft e Vibrant Visuals são marcas da Mojang Studios.": "Shiroi Visuals es un proyecto independiente, no afiliado a Mojang ni a Microsoft. Minecraft y Vibrant Visuals son marcas de Mojang Studios.",
      "Shiroi Visuals e um projeto independente, nao afiliado a Mojang nem a Microsoft. Minecraft e Vibrant Visuals sao marcas da Mojang Studios.": "Shiroi Visuals es un proyecto independiente, no afiliado a Mojang ni a Microsoft. Minecraft y Vibrant Visuals son marcas de Mojang Studios.",
      "Topo": "Arriba",
      "Floresta outonal": "Bosque otoñal",
      "Cavernas exuberantes": "Cuevas frondosas",
      "Badlands": "Badlands",
      "Savana": "Sabana",
      "Jardim pálido": "Jardin palido",
      "Rio nas badlands": "Rio en las badlands",
      "Selva": "Selva",
      "Noite de lua": "Noche de luna",
      "Pôr do sol na savana": "Atardecer en la sabana",
      "Por do sol na savana": "Atardecer en la sabana",
      "Vila à beira do lago": "Aldea junto al lago",
      "Vila a beira do lago": "Aldea junto al lago",
      "Lago na selva": "Lago en la selva",
      "Caverna com lava": "Cueva con lava",
      "The End": "The End",
      "Nether": "Nether",
      "Floresta nevada": "Bosque nevado",
      "Selva de bambu": "Selva de bambu",
      "Rio entre montanhas": "Rio entre montanas",
      "Floresta de bétulas": "Bosque de abedules",
      "Floresta de betulas": "Bosque de abedules"
    }
  };
  const translations = TEXT[locale] || {};
  if (!locale) return;

  function translateText(text) {
    const trimmed = text.trim();
    if (!trimmed) return text;
    let translated = translations[trimmed] || trimmed;
    if (translated === trimmed) {
      const entries = Object.entries(translations).sort(([a], [b]) => b.length - a.length);
      for (const [source, target] of entries) {
        translated = translated.split(source).join(target);
      }
    }
    const start = text.indexOf(trimmed);
    return `${text.slice(0, start)}${translated}${text.slice(start + trimmed.length)}`;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = translateText(node.textContent || "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node;
    for (const attribute of ["aria-label", "aria-roledescription", "title"]) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translateText(value));
    }
    if (element.matches(".carousel__count")) {
      element.textContent = element.textContent.replace(/\bde\b/, locale === "en" ? "of" : "de");
    }
    if (element.matches(".carousel__img")) {
      element.alt = element.alt.replace(" no preset ", locale === "en" ? " - " : " en el preset ");
      element.alt = translateText(element.alt);
    }
    if (element.matches(".thumb")) {
      element.setAttribute("aria-label", element.getAttribute("aria-label").replace(/^Ver /, locale === "en" ? "View " : "Ver "));
      element.setAttribute("aria-label", translateText(element.getAttribute("aria-label")));
    }
    element.childNodes.forEach(translateNode);
  }

  function addLanguageLinks() {
    const header = document.querySelector(".site-header__inner");
    if (!header || header.querySelector(".route-languages, .lang-switch")) return;
    const links = document.createElement("nav");
    links.className = "route-languages";
    links.setAttribute("aria-label", locale === "en" ? "Languages" : "Idiomas");
    for (const [code, label] of [["pt", "PT"], ["en", "EN"], ["es", "ES"]]) {
      const link = document.createElement("a");
      link.href = `${code}/`;
      link.textContent = label;
      if (code === (locale === "pt-BR" ? "pt" : locale)) link.setAttribute("aria-current", "page");
      links.appendChild(link);
    }
    const nav = header.querySelector(".site-nav");
    if (nav) nav.after(links);
    else header.insertBefore(links, header.lastElementChild);
    const style = document.createElement("style");
    style.textContent = ".route-languages{display:flex;gap:.55rem;align-items:center;font-family:var(--pixel,monospace);font-size:1.1rem}.route-languages a{color:var(--text,#eee);text-decoration:none;padding:.25rem}.route-languages a[aria-current=page]{color:var(--grass-hi,#6fbf4d)}";
    document.head.appendChild(style);
  }

  function render() {
    if (translations.pageTitle) document.title = translations.pageTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description && translations.pageDescription) description.content = translations.pageDescription;
    document.querySelectorAll(".skip-link").forEach((el) => { el.textContent = translateText(el.textContent); });
    document.querySelectorAll(".site-header__brand").forEach((el) => {
      el.setAttribute("aria-label", translateText(el.getAttribute("aria-label") || ""));
    });
    document.querySelectorAll(".site-nav, .bg-picker, .preset-switch, .carousel__thumbs").forEach((el) => {
      el.setAttribute("aria-label", translateText(el.getAttribute("aria-label") || ""));
    });
    document.querySelectorAll(".site-nav a, .mcb__label, .mcb__meta, .hero__lead, .hero__facts li, .bg-picker__name, .presets__head h2, .presets__intro, .preset-tab .mcb__label, .preset-tab .mcb__meta, #install-title, .steps p, .footer__brand p, .footer__col h2, .footer__col li, .footer__version, .footer__bottom p").forEach((el) => {
      el.childNodes.forEach(translateNode);
    });
    document.querySelectorAll(".carousel").forEach((el) => {
      el.setAttribute("aria-roledescription", translateText(el.getAttribute("aria-roledescription") || ""));
    });
    document.querySelectorAll(".carousel__stage, .carousel__nav button, .carousel__thumbs").forEach((el) => {
      el.setAttribute("aria-label", translateText(el.getAttribute("aria-label") || ""));
    });
    document.querySelectorAll(".bg-dot").forEach((el) => {
      el.setAttribute("aria-label", translateText(el.getAttribute("aria-label") || ""));
      el.title = translateText(el.title);
    });
    document.querySelectorAll(".thumb, .carousel__img, .carousel__count").forEach(translateNode);
    document.querySelectorAll(".steps p").forEach((el) => el.childNodes.forEach(translateNode));
    addLanguageLinks();
  }

  render();
  new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach(translateNode);
      if (record.type === "attributes") translateNode(record.target);
      if (record.type === "characterData") translateNode(record.target);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "alt", "title"] });
})();
