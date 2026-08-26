(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll-triggered reveals
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Founding-client offer box: falling blocks spell "Founding-client offer" (same idea as
  // the Tetris board's pixel wordmark), then the rest of the sentence fades in below.
  const OFFER_FONT = {
    F: [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]],
    O: [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
    U: [[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
    N: [[1,0,0,1],[1,1,0,1],[1,1,0,1],[1,0,1,1],[1,0,1,1],[1,0,0,1],[1,0,0,1]],
    D: [[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,0]],
    I: [[1],[1],[1],[1],[1],[1],[1]],
    G: [[0,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,1,1],[1,0,0,1],[1,0,0,1],[0,1,1,1]],
    '-': [[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
    C: [[0,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,1,1,1]],
    L: [[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,1,1,1]],
    E: [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,0,0,0],[1,1,1,1]],
    T: [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    R: [[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,1,1,0],[1,0,1,0],[1,0,0,1],[1,0,0,1]],
    ' ': [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
  };
  const OFFER_TEXT = 'FOUNDING-CLIENT OFFER';
  const OFFER_GLYPH_ROWS = 7;
  const OFFER_LETTER_GAP = 1;

  function buildOfferLayout(text) {
    const fills = [];
    let x = 0;
    for (const ch of text) {
      const glyph = OFFER_FONT[ch];
      if (!glyph) continue;
      const w = glyph[0].length;
      glyph.forEach((row, r) => {
        row.forEach((v, c) => {
          if (v) fills.push({ col: x + c, row: r });
        });
      });
      x += w + OFFER_LETTER_GAP;
    }
    return { fills, cols: x - OFFER_LETTER_GAP };
  }

  if (!reduceMotion) {
    const offerLayout = buildOfferLayout(OFFER_TEXT);
    document.querySelectorAll('.why-footnote-box').forEach((box) => {
      const container = document.createElement('div');
      container.className = 'offer-heading-cubes';
      container.setAttribute('aria-hidden', 'true');
      container.style.gridTemplateColumns = `repeat(${offerLayout.cols}, 1fr)`;
      container.style.gridTemplateRows = `repeat(${OFFER_GLYPH_ROWS}, 1fr)`;
      container.style.aspectRatio = `${offerLayout.cols} / ${OFFER_GLYPH_ROWS}`;
      const onCells = new Set(offerLayout.fills.map(({ col, row }) => `${col},${row}`));
      for (let row = 0; row < OFFER_GLYPH_ROWS; row++) {
        for (let col = 0; col < offerLayout.cols; col++) {
          const cell = document.createElement('span');
          cell.className = 'offer-heading-cell';
          cell.style.gridColumn = String(col + 1);
          cell.style.gridRow = String(row + 1);
          if (onCells.has(`${col},${row}`)) {
            cell.classList.add('offer-heading-cube');
            const fromY = -(70 + row * 12 + Math.random() * 40);
            const delay = row * 65 + Math.round(Math.random() * 50);
            cell.style.setProperty('--cube-from', `translateY(${fromY}px)`);
            cell.style.setProperty('--cube-delay', `${delay}ms`);
          }
          container.appendChild(cell);
        }
      }
      box.insertBefore(container, box.firstChild);
    });
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    const closeNav = () => {
      navToggle.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('is-open');
    };
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      mainNav.classList.toggle('is-open', !open);
    });
    mainNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
  }

  // Dark mode toggle
  const THEME_KEY = 'rd-theme';
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = themeToggle ? themeToggle.querySelector('.theme-toggle-label') : null;

  const applyThemeUI = (theme) => {
    if (!themeToggle) return;
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    if (themeLabel) themeLabel.textContent = isDark ? 'Light' : 'Dark';
  };
  applyThemeUI(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (next === 'dark') root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyThemeUI(next);
    });
  }

  // Scroll progress "snake"
  const scrollFill = document.getElementById('scrollFill');
  const updateScrollProgress = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (scrollFill) scrollFill.style.width = pct + '%';
  };
  document.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // Ambient falling blocks in the hero
  const rainWrap = document.getElementById('heroRain');
  if (rainWrap && !reduceMotion) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div');
      b.className = 'rain-block';
      b.style.left = Math.random() * 100 + '%';
      b.style.width = b.style.height = (8 + Math.random() * 10) + 'px';
      b.style.animationDuration = (5 + Math.random() * 6) + 's';
      b.style.animationDelay = (Math.random() * 6) + 's';
      rainWrap.appendChild(b);
    }
  }

  // Free-offer lead magnets: pre-fill the message + promo code when arriving via ?audit=1 or ?gbp=1
  const messageField = document.getElementById('cf-message');
  const promoField = document.getElementById('cf-promo');
  const leadParam = new URLSearchParams(window.location.search);
  const prefillMessage = (text) => {
    messageField.value = text;
    document.getElementById('contact')?.scrollIntoView();
    window.setTimeout(() => {
      messageField.focus();
      const end = messageField.value.length;
      messageField.setSelectionRange(end, end);
    }, reduceMotion ? 50 : 450);
  };
  if (messageField && leadParam.get('audit') === '1') {
    if (promoField) promoField.value = 'ROCKAUDIT';
    prefillMessage("I'd like a free audit of my current website. Here's the URL: ");
  } else if (messageField && leadParam.get('gbp') === '1') {
    if (promoField) promoField.value = 'ROCKSEO';
    prefillMessage("I'd like the free Google Business Profile & Local SEO setup for my business. Here are my business details: ");
  }

  // Contact form -> mailto (static site, no backend)
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const promo = form.promo ? form.promo.value.trim() : '';
      const subject = encodeURIComponent(`New enquiry from ${name}`);
      const bodyText = `${message}\n\n— ${name} (${email})` + (promo ? `\nPromo code: ${promo}` : '');
      const body = encodeURIComponent(bodyText);
      window.location.href = `mailto:hello@rockwelldigital.co.uk?subject=${subject}&body=${body}`;
    });
  }

  // Tetris win modal (only present on contact.html, where tetris.js runs)
  const winModal = document.getElementById('winModal');
  if (winModal) {
    document.addEventListener('rd:tetris-win', () => {
      winModal.showModal();
    });

    winModal.addEventListener('click', (e) => {
      if (e.target === winModal) winModal.close();
    });

    const nameField = document.getElementById('cf-name');
    winModal.querySelectorAll('.win-modal-choice').forEach((choiceBtn) => {
      choiceBtn.addEventListener('click', () => {
        winModal.close();
        const code = choiceBtn.dataset.code;
        if (promoField && code) promoField.value = code;
        if (messageField && !messageField.value) {
          messageField.value = choiceBtn.dataset.message || '';
        }
        document.getElementById('contact')?.scrollIntoView();
        if (nameField) {
          window.setTimeout(() => nameField.focus(), reduceMotion ? 50 : 450);
        }
      });
    });
  }
})();
