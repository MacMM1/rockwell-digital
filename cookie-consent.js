(() => {
  // TODO: replace with the real GTM Container ID once you've created one
  // (Google Tag Manager > Admin > Container Settings > Container ID, looks like GTM-ABC1234)
  // GA4 (and, optionally, Microsoft Clarity) get configured as tags *inside* this container
  // in the GTM web UI — see website-services/analytics_setup.md for the full walkthrough.
  // This replaces loading gtag.js directly: once this container ID is real, GA4/Clarity/any
  // future tag can be added or changed purely in GTM, with no further code changes here.
  const GTM_CONTAINER_ID = 'GTM-XXXXXXX';
  const CONSENT_KEY = 'rd-consent';

  const getConsent = () => {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  };
  const setConsent = (value) => {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  };

  const loadGTM = () => {
    if (window.__rdGtmLoaded || GTM_CONTAINER_ID.includes('XXXXXXX')) return;
    window.__rdGtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
    document.head.appendChild(s);
  };

  const buildBanner = () => {
    const existing = document.getElementById('cookieBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookieBanner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="wrap cookie-banner-inner">
        <p>We use analytics tools to see how visitors use this site — nothing sold, no ad tracking. <a href="privacy.html">Read our privacy policy</a>.</p>
        <div class="cookie-banner-actions">
          <button type="button" class="btn btn-secondary" id="cookieDecline">Decline</button>
          <button type="button" class="btn btn-primary" id="cookieAccept">Accept</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookieAccept').addEventListener('click', () => {
      setConsent('accepted');
      loadGTM();
      banner.remove();
    });
    document.getElementById('cookieDecline').addEventListener('click', () => {
      setConsent('declined');
      banner.remove();
    });
  };

  const consent = getConsent();
  if (consent === 'accepted') {
    loadGTM();
  } else if (consent !== 'declined') {
    buildBanner();
  }

  // Footer "Cookie settings" button lets a visitor reopen this and change their choice any time
  document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('cookieSettingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', buildBanner);
  });
})();
