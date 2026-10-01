(() => {
  const send = (name, params = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  };

  const pagePath = window.location.pathname;
  const once = new Set();

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    const label = (link.textContent || "").trim().slice(0, 100);

    if (link.closest(".cta") || href.includes("#contact")) {
      send("article_cta_click", { page_path: pagePath, link_url: link.href, link_text: label });
    }
    if (link.closest(".related-articles") || link.closest(".related")) {
      send("article_related_click", { page_path: pagePath, link_url: link.href, link_text: label });
    }
    if (/wa\.me|whatsapp/i.test(href)) {
      send("whatsapp_click", { page_path: pagePath, link_url: link.href });
    }
    if (/\/course\//.test(href)) {
      send("course_click", { page_path: pagePath, link_url: link.href, link_text: label });
    }
  });

  const trackDepth = () => {
    const root = document.documentElement;
    const available = root.scrollHeight - root.clientHeight;
    if (available <= 0) return;
    const percent = Math.round((root.scrollTop / available) * 100);
    [50, 90].forEach((depth) => {
      if (percent >= depth && !once.has(depth)) {
        once.add(depth);
        send("article_scroll", { page_path: pagePath, percent_scrolled: depth });
      }
    });
  };

  addEventListener("scroll", trackDepth, { passive: true });
  setTimeout(() => send("article_engaged_60s", { page_path: pagePath }), 60000);
})();
