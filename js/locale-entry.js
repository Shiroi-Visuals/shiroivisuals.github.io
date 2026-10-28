(() => {
  "use strict";

  const localeByPath = { pt: "pt-BR", en: "en", es: "es" };
  const locale = localeByPath[window.location.pathname.split("/").filter(Boolean).pop()?.toLowerCase()];
  if (!locale) {
    document.body.textContent = "This language route is not supported.";
    return;
  }

  async function loadSite() {
    const response = await fetch("../index.html");
    if (!response.ok) {
      throw new Error(`Could not load the site page (${response.status}).`);
    }

    const html = await response.text();
    const withBase = html.replace(/<head>/i, '<head>\n  <base href="../">');
    if (withBase === html) {
      throw new Error("Could not find the document head.");
    }

    const withLocale = withBase.replace(/(<html\b[^>]*\blang=["'])[^"']+(["'])/i, `$1${locale}$2`);
    const page = withLocale.replace(
      /(<script\b[^>]*src=["']js\/main\.js["'][^>]*><\/script>)/i,
      `$1\n  <script src="js/locale-page.js" data-locale="${locale}" defer></script>`
    );
    if (page === withLocale) {
      throw new Error("Could not find the site's main script.");
    }

    document.open();
    document.write(page);
    document.close();
  }

  loadSite().catch((error) => {
    console.error("Could not load the language route.", error);
    document.body.textContent = "The page could not be loaded. Please try again.";
  });
})();
