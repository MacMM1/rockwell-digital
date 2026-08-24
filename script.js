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

  // Tetris win modal (only present on index.html, where tetris.js runs)
  const winModal = document.getElementById('winModal');
  if (winModal) {
    document.addEventListener('rd:tetris-win', () => {
      winModal.showModal();
    });

    winModal.addEventListener('click', (e) => {
      if (e.target === winModal) winModal.close();
    });

    const redeemBtn = document.getElementById('winModalRedeem');
    const codeEl = document.getElementById('winModalCode');
    if (redeemBtn) {
      redeemBtn.addEventListener('click', () => {
        winModal.close();
        const promoField = document.getElementById('cf-promo');
        const nameField = document.getElementById('cf-name');
        if (promoField && codeEl) promoField.value = codeEl.textContent.trim();
        document.getElementById('contact')?.scrollIntoView();
        if (nameField) {
          window.setTimeout(() => nameField.focus(), reduceMotion ? 50 : 450);
        }
      });
    }
  }
})();
