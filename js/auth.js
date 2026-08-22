/* ============================================================================
   T'S PMS — Auth SPA JavaScript
   Powers auth.html, which contains ALL auth states (login, register,
   forgot-password, verify-code, reset-password) as sibling <section
   class="auth-view"> elements inside one .auth-card. This file's ROUTER
   decides which one is visible; everything else (validation, the 20
   animations) works exactly as it did across the old separate pages,
   because every form/input keeps the same unique id it always had.

   HOW NAVIGATION WORKS NOW
   - Links/buttons with [data-view-link="register"] etc. switch views
     in-page (fade out current, fade in next) and update the URL hash
     (#login, #register, ...) via history.pushState — no reload.
   - The "Back to home" link is a REAL cross-page link (../index.html) and
     is left alone by the router — it still does a real navigation, just
     with a quick fade-out first for continuity.
   - On load, the router reads location.hash to decide the starting view,
     so a link like auth.html#register opens directly on the register view.

   SECURITY NOTE (same as before)
   Nothing here is real authentication. It's UX: validation, loading
   states, success animations. The actual check — is this password
   correct, does this token belong to this user — happens in PHP,
   server-side, once that layer exists.
   ============================================================================ */

(function () {
  'use strict';

  /* --------------------------------------------------------------------
     0. SMALL HELPERS
     -------------------------------------------------------------------- */
  const qs = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  const viewTitles = {
    login: "Log In — T'S PMS",
    register: "Sign Up — T'S PMS",
    forgot: 'Forgot Password — T\'S PMS',
    verify: 'Verify Code — T\'S PMS',
    reset: 'Reset Password — T\'S PMS',
  };

  /* ======================================================================
     VIEW ROUTER
     One .auth-card, five .auth-view sections inside it (data-view="login"
     etc). Only one has class "active" (display:block) at a time; the
     others are display:none via CSS. Switching is a quick fade-out of the
     current view, then fade-in of the next — see auth.css for the states
     (.view-entering / .active / .view-leaving).
     ====================================================================== */
  function getViews() {
    return qsa('.auth-view');
  }

  function currentView() {
    return getViews().find((v) => v.classList.contains('active'));
  }

  function activateView(view) {
    view.classList.add('view-entering');
    void view.offsetWidth; // force reflow so the browser registers the "entering" state before we animate away from it
    requestAnimationFrame(() => {
      view.classList.remove('view-entering');
      view.classList.add('active');
      staggerReveal(view);

      // Small UX touch: jump straight to the first empty field when a
      // view opens, so the user can start typing immediately.
      const firstInput = qs('input:not([type="checkbox"])', view);
      if (firstInput && document.activeElement !== firstInput) {
        firstInput.focus({ preventScroll: true });
      }
    });
  }

  function switchView(name, { pushHistory = false } = {}) {
    const views = getViews();
    const next = views.find((v) => v.dataset.view === name);
    if (!next) return;

    const current = currentView();
    document.title = viewTitles[name] || document.title;

    if (pushHistory) {
      history.pushState({ view: name }, '', `#${name}`);
    }

    if (!current || current === next) {
      activateView(next);
      return;
    }

    current.classList.remove('active');
    current.classList.add('view-leaving');

    setTimeout(() => {
      current.classList.remove('view-leaving');
      activateView(next);
    }, 200);
  }

  function viewFromHash() {
    const hash = window.location.hash.replace('#', '');
    const views = getViews();
    return views.some((v) => v.dataset.view === hash) ? hash : 'login';
  }

  function initAuthRouter() {
    const views = getViews();
    if (!views.length) return; // guard: not on auth.html

    // Initial view, no history push (this IS the current history entry)
    switchView(viewFromHash());

    // Any element with data-view-link switches views instead of navigating
    qsa('[data-view-link]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(el.getAttribute('data-view-link'), { pushHistory: true });
      });
    });

    // Browser back/forward buttons
    window.addEventListener('popstate', () => switchView(viewFromHash()));
    // Manual hash edits / bookmarked links with a hash
    window.addEventListener('hashchange', () => switchView(viewFromHash()));
  }

  /* ======================================================================
     ANIMATIONS 1–5 — Ambient page feel (entrance, blobs, tilt, magnet, spotlight)
     ====================================================================== */

  /* 1. Staggered reveal — runs every time a view becomes active, not just
     on first load, so switching views always feels intentional. */
  function staggerReveal(container) {
    const targets = qsa(
      '.auth-logo, h1, .auth-subtext, .auth-form > *, .otp-row, .countdown-row, .auth-divider, .auth-social, .auth-footer-text, .auth-success > *',
      container
    );
    targets.forEach((el, i) => {
      el.classList.remove('stagger-in-done');
      el.style.setProperty('--i', i);
      el.classList.add('stagger-in');
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targets.forEach((el) => el.classList.add('stagger-in-done'));
      });
    });
  }

  /* 2. Floating background blobs + mouse parallax */
  function initBlobParallax() {
    const blobs = qsa('.blob');
    if (!blobs.length) return;

    window.addEventListener('mousemove', (e) => {
      const xRatio = e.clientX / window.innerWidth - 0.5;
      const yRatio = e.clientY / window.innerHeight - 0.5;

      blobs.forEach((blob, i) => {
        const strength = 14 + i * 6;
        blob.style.setProperty('--parallax-x', `${xRatio * strength}px`);
        blob.style.setProperty('--parallax-y', `${yRatio * strength}px`);
      });
    });
  }

  /* 3. Card tilt toward cursor */
  function initCardTilt() {
    const wrapper = qs('.auth-wrapper');
    const card = qs('.auth-card');
    if (!wrapper || !card) return;

    const MAX_TILT = 4;

    wrapper.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const rotateY = (px - 0.5) * MAX_TILT * 2;
      const rotateX = (0.5 - py) * MAX_TILT * 2;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    wrapper.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  /* 4. Magnetic primary button — nudges toward the cursor when nearby */
  function initMagneticButton() {
    // Re-attached per active view since each view has its own primary button;
    // using event delegation on the card means we don't need to re-bind on switch.
    const card = qs('.auth-card');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      const btn = e.target.closest('.auth-form .btn-primary');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.4}px)`;
    });

    card.addEventListener('mouseleave', (e) => {
      qsa('.auth-form .btn-primary', card).forEach((btn) => {
        btn.style.transform = 'translate(0, 0)';
      });
    }, true);
  }

  /* 5. Cursor spotlight */
  function initCursorSpotlight() {
    const spotlight = qs('.cursor-spotlight');
    if (!spotlight) return;

    window.addEventListener('mousemove', (e) => {
      spotlight.style.opacity = '1';
      spotlight.style.left = `${e.clientX}px`;
      spotlight.style.top = `${e.clientY}px`;
    });

    window.addEventListener('mouseleave', () => {
      spotlight.style.opacity = '0';
    });
  }

  /* ======================================================================
     ANIMATIONS 6–9 — Input & field feedback
     ====================================================================== */
  function initPasswordToggle(toggleBtn, input) {
    if (!toggleBtn || !input) return;

    toggleBtn.addEventListener('click', () => {
      const icon = qs('i', toggleBtn);
      icon.classList.add('morphing');

      setTimeout(() => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('uil-eye', !isPassword);
        icon.classList.toggle('uil-eye-slash', isPassword);
        toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        icon.classList.remove('morphing');
      }, 150);
    });
  }

  function validateField(input, validatorFn, errorMessage) {
    const group = input.closest('.form-group');
    if (!group) return validatorFn(input.value);

    const isValid = validatorFn(input.value);

    group.classList.remove('is-invalid', 'is-valid');
    void group.offsetWidth;

    if (isValid) {
      group.classList.add('is-valid');
    } else {
      group.classList.add('is-invalid');
      showFieldError(group, errorMessage);
    }

    return isValid;
  }

  function showFieldError(group, message) {
    let errorEl = qs('.field-error', group);
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'field-error';
      group.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  function clearFieldError(input) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.remove('is-invalid');
    const errorEl = qs('.field-error', group);
    if (errorEl) errorEl.remove();
  }

  /* ======================================================================
     ANIMATION 10 — Button loading state
     ====================================================================== */
  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    btn.classList.toggle('is-loading', isLoading);
    btn.disabled = isLoading;
  }

  /* ======================================================================
     ANIMATIONS 11–12 — Password strength + live match indicator
     ====================================================================== */
  function scorePassword(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(score, 4);
  }

  function initPasswordStrength(passwordInput, barEl, labelEl) {
    if (!passwordInput || !barEl || !labelEl) return;

    const levels = [
      { width: '0%', color: 'transparent', label: '' },
      { width: '25%', color: '#E0575A', label: 'Weak' },
      { width: '50%', color: '#E8A33D', label: 'Fair' },
      { width: '75%', color: '#3B6FE0', label: 'Good' },
      { width: '100%', color: '#3FA66B', label: 'Strong' },
    ];

    passwordInput.addEventListener('input', () => {
      const value = passwordInput.value;
      const score = value.length === 0 ? 0 : scorePassword(value) + 1;
      const level = levels[score] || levels[0];

      barEl.style.width = level.width;
      barEl.style.backgroundColor = level.color;
      labelEl.textContent = level.label;
    });
  }

  function initPasswordMatch(passwordInput, confirmInput, iconEl) {
    if (!passwordInput || !confirmInput || !iconEl) return;

    const check = () => {
      if (confirmInput.value.length === 0) {
        iconEl.classList.remove('show', 'match', 'no-match');
        return;
      }
      const matches = passwordInput.value === confirmInput.value;
      iconEl.classList.add('show');
      iconEl.classList.toggle('match', matches);
      iconEl.classList.toggle('no-match', !matches);
      iconEl.classList.remove('uil-check', 'uil-times');
      iconEl.classList.add(matches ? 'uil-check' : 'uil-times');
    };

    confirmInput.addEventListener('input', check);
    passwordInput.addEventListener('input', check);
  }

  /* ======================================================================
     ANIMATION 13 — Checkbox pulse
     ====================================================================== */
  function initCheckboxPulse(checkbox) {
    if (!checkbox) return;
    const label = checkbox.closest('.checkbox-label');
    checkbox.addEventListener('change', () => {
      if (!label) return;
      label.classList.remove('pulse');
      void label.offsetWidth;
      label.classList.add('pulse');
    });
  }

  /* ======================================================================
     ANIMATION 14 — Toast notifications
     ====================================================================== */
  function getToastContainer() {
    let container = qs('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = 'success') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="uil ${type === 'success' ? 'uil-check-circle' : 'uil-exclamation-triangle'}"></i><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* ======================================================================
     ANIMATION 9 (continued) — Success panel swap (checkmark draw)
     ====================================================================== */
  function showSuccessPanel(formWrapId, successId) {
    const formWrap = document.getElementById(formWrapId);
    const successPanel = document.getElementById(successId);
    if (!formWrap || !successPanel) return;

    formWrap.classList.add('fade-out-up');

    setTimeout(() => {
      formWrap.hidden = true;
      successPanel.hidden = false;
      requestAnimationFrame(() => {
        successPanel.classList.add('is-revealed');
        const check = qs('.success-check', successPanel);
        if (check) check.classList.add('draw');
      });
    }, 250);
  }

  /* ======================================================================
     ANIMATION 17 — Confetti burst
     ====================================================================== */
  function triggerConfetti() {
    const colors = ['#E8B94B', '#3B6FE0', '#F0C868', '#14181F'];
    const pieceCount = 36;

    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove());
    }
  }

  /* ======================================================================
     ANIMATIONS 15–16 — OTP input auto-advance + countdown ring
     ====================================================================== */
  function initOtpInputs() {
    const inputs = qsa('.otp-input');
    if (!inputs.length) return;

    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);

        if (input.value) {
          input.classList.remove('pop');
          void input.offsetWidth;
          input.classList.add('pop');

          const next = inputs[index + 1];
          if (next) next.focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const digits = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').split('');
        digits.forEach((digit, i) => {
          if (inputs[index + i]) inputs[index + i].value = digit;
        });
        const lastFilled = inputs[Math.min(index + digits.length, inputs.length - 1)];
        if (lastFilled) lastFilled.focus();
      });
    });
  }

  function initCountdown(ringFgEl, secondsEl, resendLinkEl, totalSeconds = 30) {
    if (!ringFgEl || !secondsEl || !resendLinkEl) return;

    const circumference = 2 * Math.PI * 9;
    ringFgEl.style.strokeDasharray = `${circumference}`;

    let remaining = totalSeconds;
    let timer;
    resendLinkEl.classList.add('disabled');

    function tick() {
      const progress = remaining / totalSeconds;
      ringFgEl.style.strokeDashoffset = `${circumference * (1 - progress)}`;
      secondsEl.textContent = `${remaining}s`;

      if (remaining <= 0) {
        clearInterval(timer);
        secondsEl.textContent = '';
        resendLinkEl.classList.remove('disabled');
        return;
      }
      remaining--;
    }

    tick();
    timer = setInterval(tick, 1000);

    resendLinkEl.addEventListener('click', (e) => {
      e.preventDefault();
      if (resendLinkEl.classList.contains('disabled')) return;

      remaining = totalSeconds;
      resendLinkEl.classList.add('disabled');
      showToast('A new code has been sent.', 'success');
      tick();
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    });
  }

  /* ======================================================================
     Ripple effect (button click)
     ====================================================================== */
  function initRipple() {
    const card = qs('.auth-card');
    if (!card) return;

    card.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn || !card.contains(btn)) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  /* ======================================================================
     ANIMATION 19 — Fade before a REAL cross-page navigation
     (only the "Back to home" link qualifies now — everything else in the
     SPA uses the router above instead of a full page load)
     ====================================================================== */
  function initExitTransition() {
    qsa('a[href$=".html"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        e.preventDefault();
        document.body.classList.add('page-fade-out');
        setTimeout(() => {
          window.location.href = href;
        }, 220);
      });
    });
  }

  /* ======================================================================
     Validators
     ====================================================================== */
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isNotEmpty = (value) => value.trim().length > 0;
  const isValidPassword = (value) => value.length >= 8;

  /* ======================================================================
     PAGE WIRING — each form's specific behavior.
     Note the "success" paths below call switchView(...) instead of
     redirecting to another file — that's the one meaningful change from
     the multi-page version.
     ====================================================================== */
  function wireLoginForm() {
    const form = qs('#login-form');
    if (!form) return;

    initPasswordToggle(qs('#toggle-login-password'), qs('#login-password'));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = qs('#login-email');
      const password = qs('#login-password');

      const emailOk = validateField(email, isValidEmail, 'Enter a valid email address.');
      const passwordOk = validateField(password, isNotEmpty, 'Enter your password.');
      if (!emailOk || !passwordOk) return;

      const submitBtn = qs('button[type="submit"]', form);
      setButtonLoading(submitBtn, true);

      // Swap for a real fetch('/api/auth/login.php', ...) once the PHP + JWT backend exists.
      setTimeout(() => {
        setButtonLoading(submitBtn, false);
        showToast('Signed in successfully.', 'success');
        // window.location.href = '../dashboard.html'; // enable once that page exists
      }, 1200);
    });

    [qs('#login-email'), qs('#login-password')].forEach((input) => {
      input && input.addEventListener('input', () => clearFieldError(input));
    });
  }

  function wireRegisterForm() {
    const form = qs('#register-form');
    if (!form) return;

    initPasswordToggle(qs('#toggle-register-password'), qs('#register-password'));
    initPasswordStrength(qs('#register-password'), qs('#password-strength-bar'), qs('#password-strength-label'));
    initPasswordMatch(qs('#register-password'), qs('#register-confirm-password'), qs('#confirm-match-icon'));
    initCheckboxPulse(qs('#register-form input[name="agree_terms"]'));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = qs('#register-name');
      const email = qs('#register-email');
      const password = qs('#register-password');
      const confirm = qs('#register-confirm-password');
      const terms = qs('input[name="agree_terms"]', form);

      const nameOk = validateField(name, isNotEmpty, 'Enter your full name.');
      const emailOk = validateField(email, isValidEmail, 'Enter a valid email address.');
      const passwordOk = validateField(password, isValidPassword, 'Password must be at least 8 characters.');
      const confirmOk = validateField(confirm, (v) => v === password.value && v.length > 0, 'Passwords do not match.');

      if (!terms.checked) {
        showToast('Please accept the Terms of Service to continue.', 'error');
        return;
      }
      if (!nameOk || !emailOk || !passwordOk || !confirmOk) return;

      const submitBtn = qs('button[type="submit"]', form);
      setButtonLoading(submitBtn, true);

      setTimeout(() => {
        setButtonLoading(submitBtn, false);
        showSuccessPanel('register-form-wrap', 'register-success');
        triggerConfetti();
        setTimeout(() => {
          switchView('login', { pushHistory: true });
        }, 2200);
      }, 1200);
    });

    qsa('input', form).forEach((input) => input.addEventListener('input', () => clearFieldError(input)));
  }

  function wireForgotForm() {
    const form = qs('#forgot-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = qs('#forgot-email');
      const emailOk = validateField(email, isValidEmail, 'Enter a valid email address.');
      if (!emailOk) return;

      const submitBtn = qs('button[type="submit"]', form);
      setButtonLoading(submitBtn, true);

      setTimeout(() => {
        setButtonLoading(submitBtn, false);
        showSuccessPanel('forgot-form-wrap', 'forgot-success');
      }, 1200);
    });

    qs('#forgot-email') && qs('#forgot-email').addEventListener('input', () => clearFieldError(qs('#forgot-email')));
  }

  function wireVerifyForm() {
    const form = qs('#verify-form');
    if (!form) return;

    initOtpInputs();
    initCountdown(qs('#countdown-ring-fg'), qs('#countdown-seconds'), qs('#resend-link'), 30);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = qsa('.otp-input');
      const code = inputs.map((i) => i.value).join('');

      if (code.length !== inputs.length) {
        showToast('Enter the full 6-digit code.', 'error');
        return;
      }

      const submitBtn = qs('button[type="submit"]', form);
      setButtonLoading(submitBtn, true);

      setTimeout(() => {
        setButtonLoading(submitBtn, false);
        switchView('reset', { pushHistory: true });
      }, 1000);
    });
  }

  function wireResetForm() {
    const form = qs('#reset-form');
    if (!form) return;

    initPasswordToggle(qs('#toggle-reset-password'), qs('#reset-password'));
    initPasswordToggle(qs('#toggle-reset-confirm'), qs('#reset-confirm-password'));
    initPasswordStrength(qs('#reset-password'), qs('#reset-strength-bar'), qs('#reset-strength-label'));
    initPasswordMatch(qs('#reset-password'), qs('#reset-confirm-password'), qs('#reset-match-icon'));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = qs('#reset-password');
      const confirm = qs('#reset-confirm-password');

      const passwordOk = validateField(password, isValidPassword, 'Password must be at least 8 characters.');
      const confirmOk = validateField(confirm, (v) => v === password.value && v.length > 0, 'Passwords do not match.');
      if (!passwordOk || !confirmOk) return;

      const submitBtn = qs('button[type="submit"]', form);
      setButtonLoading(submitBtn, true);

      setTimeout(() => {
        setButtonLoading(submitBtn, false);
        showSuccessPanel('reset-form-wrap', 'reset-success');
        triggerConfetti();
      }, 1200);
    });

    qsa('input', form).forEach((input) => input.addEventListener('input', () => clearFieldError(input)));
  }

  /* ======================================================================
     BOOTSTRAP
     ====================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initBlobParallax();
    initCardTilt();
    initMagneticButton();
    initCursorSpotlight();
    initRipple();
    initExitTransition();

    wireLoginForm();
    wireRegisterForm();
    wireForgotForm();
    wireVerifyForm();
    wireResetForm();

  
    initAuthRouter();
  });
})();