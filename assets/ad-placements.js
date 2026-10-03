(() => {
  "use strict";

  const ADSENSE_CLIENT = "ca-pub-9549277321717950";
  const CONTENT_BOTTOM_SLOT = "6847251931";
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isBlog = path === "/blog" || path.startsWith("/blog/");
  const isCourse = path === "/course" || path.startsWith("/course/");

  if (!isBlog && !isCourse) return;

  const ensureAdSenseScript = () => {
    const existing = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    if (existing) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  };

  const addStyles = () => {
    if (document.getElementById("daoline-ad-styles")) return;
    const style = document.createElement("style");
    style.id = "daoline-ad-styles";
    style.textContent = `
      .daoline-ad { width: min(100% - 32px, 1080px); margin: 36px auto; padding: 12px 0; text-align: center; overflow: hidden; }
      .daoline-ad__label { margin: 0 0 8px; color: #777; font: 11px/1.4 Arial, sans-serif; letter-spacing: .04em; }
      .daoline-ad .adsbygoogle { min-height: 90px; }
      @media (max-width: 640px) { .daoline-ad { width: calc(100% - 24px); margin: 28px auto; } }
    `;
    document.head.appendChild(style);
  };

  const createAd = (slot, position) => {
    const wrapper = document.createElement("aside");
    wrapper.className = `daoline-ad daoline-ad--${position}`;
    wrapper.dataset.daolineAd = position;
    wrapper.setAttribute("aria-label", "إعلان");

    const label = document.createElement("div");
    label.className = "daoline-ad__label";
    label.textContent = "إعلان";

    const ad = document.createElement("ins");
    ad.className = "adsbygoogle";
    ad.style.display = "block";
    ad.dataset.adClient = ADSENSE_CLIENT;
    ad.dataset.adSlot = slot;
    ad.dataset.adFormat = "auto";
    ad.dataset.fullWidthResponsive = "true";

    wrapper.append(label, ad);
    return wrapper;
  };

  const queueAd = () => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn("AdSense placement was not initialized", error);
    }
  };

  const insertBottomAd = () => {
    if (document.querySelector('[data-daoline-ad="bottom"]')) return;
    const placement = createAd(CONTENT_BOTTOM_SLOT, "bottom");
    const footer = document.querySelector("footer");
    if (footer) footer.insertAdjacentElement("beforebegin", placement);
    else document.body.appendChild(placement);
    queueAd();
  };

  const init = () => {
    ensureAdSenseScript();
    addStyles();
    insertBottomAd();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
