(() => {
  const existing = document.querySelector('.daoline-en-sitebar');
  if (existing) return;

  const legacyHeader = document.querySelector(
    'body > nav.nav, body > header.topbar, body > nav.site-nav, body > nav:not(.article-toc)'
  );
  if (legacyHeader) legacyHeader.setAttribute('hidden', '');

  const style = document.createElement('style');
  style.textContent = `
    .daoline-en-sitebar{position:sticky;top:0;z-index:100;background:rgba(7,8,12,.96);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.1);box-shadow:0 10px 35px rgba(0,0,0,.28);direction:ltr}
    .daoline-en-sitebar *{box-sizing:border-box}
    .daoline-en-sitebar__inner{width:min(1180px,calc(100% - 32px));min-height:76px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:22px}
    .daoline-en-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:#fff;flex:0 0 auto}
    .daoline-en-brand img{width:43px;height:43px;object-fit:contain;border-radius:11px}
    .daoline-en-brand__name{display:block;font:800 1.07rem/1.1 system-ui,sans-serif;letter-spacing:.01em;color:#fff}
    .daoline-en-brand__name em{font-style:normal;color:#e331c8}
    .daoline-en-brand__tag{display:block;margin-top:4px;color:#9eacc0;font:500 .72rem/1.2 system-ui,sans-serif}
    .daoline-en-links{display:flex;align-items:center;justify-content:flex-end;gap:7px;margin-left:auto}
    .daoline-en-links a{color:#dce5f0!important;text-decoration:none!important;font:700 .84rem/1 system-ui,sans-serif;padding:10px 12px;border-radius:12px;border:1px solid transparent;white-space:nowrap;transition:.2s ease}
    .daoline-en-links a:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff!important}
    .daoline-en-links .primary{background:linear-gradient(135deg,#c013a6,#8b1cb3);border-color:rgba(255,255,255,.12);color:#fff!important}
    .daoline-en-library-strip{background:linear-gradient(90deg,rgba(192,19,166,.94),rgba(124,58,237,.92));color:#fff;direction:ltr}
    .daoline-en-library-strip__inner{width:min(1180px,calc(100% - 32px));min-height:34px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;font:700 .78rem/1.3 system-ui,sans-serif}
    .daoline-en-library-strip a{color:#fff!important;text-decoration:none!important;font-weight:900;white-space:nowrap}
    @media(max-width:760px){
      .daoline-en-sitebar__inner{width:min(100% - 22px,1180px);min-height:68px;gap:10px}
      .daoline-en-brand img{width:38px;height:38px}.daoline-en-brand__tag{display:none}
      .daoline-en-links a{padding:9px 8px;font-size:.76rem}.daoline-en-links .optional{display:none}
      .daoline-en-library-strip__inner{width:min(100% - 22px,1180px);padding:7px 0;font-size:.7rem}
    }
    @media(max-width:440px){.daoline-en-brand__name{font-size:.9rem}.daoline-en-links .home-link{display:none}}
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.className = 'daoline-en-header-wrap';
  wrapper.innerHTML = `
    <header class="daoline-en-sitebar">
      <div class="daoline-en-sitebar__inner">
        <a class="daoline-en-brand" href="/" aria-label="Daoline Digital home">
          <img src="/logo-daoline.png" alt="Daoline Digital logo" width="43" height="43">
          <span><span class="daoline-en-brand__name">Daoline <em>Digital</em></span><span class="daoline-en-brand__tag">Social Media Strategy & Growth</span></span>
        </a>
        <nav class="daoline-en-links" aria-label="English article navigation">
          <a class="home-link" href="/">Home</a>
          <a href="/en/">English Library</a>
          <a class="optional" href="/#services">Services</a>
          <a class="optional" href="/portfolio/">Portfolio</a>
          <a class="primary" href="/#contact">Contact</a>
        </nav>
      </div>
    </header>
    <div class="daoline-en-library-strip"><div class="daoline-en-library-strip__inner"><span>Practical marketing playbooks for small businesses and B2B experts</span><a href="/en/">Browse all English guides →</a></div></div>
  `;
  document.body.prepend(wrapper);
})();
