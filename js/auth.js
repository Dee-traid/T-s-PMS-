/* ============================================================================
   T'S PMS — Auth Pages Shared JavaScript
   Loaded on: login.html, register.html, forgot-password.html,
              verify-code.html, reset-password.html
 
   HOW THIS IS ORGANIZED
   JS decides WHEN something happens (on submit, on input, on hover).
   CSS (in auth.css) decides HOW it looks (the transition/keyframe itself).
   That split keeps animations smooth (CSS handles the actual frame-by-frame
   work) while JS just toggles classes or sets a few inline styles for values
   CSS can't know on its own (mouse position, countdown seconds, etc).
 
   READ THIS FIRST — SECURITY NOTE
   Nothing in this file is "authentication". A user can open devtools and
   skip every check here. This file only makes the FORM feel good and
   catches obvious mistakes before a request is even sent. The real check —
   is this password correct, does this token belong to this user — has to
   happen in PHP, server-side, every time, no matter what this file did.
   ============================================================================ */
 
(function () {
  'use strict';
 
  /* --------------------------------------------------------------------
     0. SMALL HELPERS
     -------------------------------------------------------------------- */
  const qs = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
 
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
 
  /* ======================================================================
     ANIMATIONS 1–5 — Ambient page feel (entrance, blobs, tilt, magnet, spotlight)
     ====================================================================== */
 
  /* 1. Staggered entrance — each direct child of the form (and the logo/
     heading above it) fades + rises in, one after another. We do this by
     giving each element a CSS custom property --i (its order) that the
     transition-delay in auth.css reads. */
  function initEntranceAnimation() {
    const card = qs('.auth-card');
    if (!card) return;
 
    const staggerTargets = qsa('.auth-logo, .auth-card h1, .auth-subtext, .auth-form > *, .auth-divider, .auth-social, .auth-footer-text', card);
    staggerTargets.forEach((el, i) => {
      el.style.setProperty('--i', i);
      el.classList.add('stagger-in');
    });
 
    // Triggering on the next frame (rather than immediately) ensures the
    // browser has painted the initial "hidden" state first, so the
    // transition actually has something to animate FROM.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => card.classList.add('is-revealed'));
    });
  }
 
  /* 2. Floating background blobs — CSS keyframes handle the constant drift;
     here we just add a little extra parallax offset tied to the mouse so
     they feel reactive rather than purely decorative. */
  function initBlobParallax() {
    const blobs = qsa('.blob');
    if (!blobs.length) return;
 
    window.addEventListener('mousemove', (e) => {
      const xRatio = e.clientX / window.innerWidth - 0.5;
      const yRatio = e.clientY / window.innerHeight - 0.5;
 
      blobs.forEach((blob, i) => {
        const strength = 14 + i * 6; // each blob drifts a different amount
        blob.style.setProperty('--parallax-x', `${xRatio * strength}px`);
        blob.style.setProperty('--parallax-y', `${yRatio * strength}px`);
      });
    });
  }
 
  /* 3. Card tilt — the card subtly rotates in 3D toward the cursor. */
  function initCardTilt() {
    const wrapper = qs('.auth-wrapper');
    const card = qs('.auth-card');
    if (!wrapper || !card) return;
 
    const MAX_TILT = 4; // degrees — kept small on purpose, this should read as "alive", not a gimmick
 
    wrapper.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;  // 0 -> 1 across the card
      const py = (e.clientY - rect.top) / rect.height;
 
      const rotateY = (px - 0.5) * MAX_TILT * 2;
      const rotateX = (0.5 - py) * MAX_TILT * 2;
 
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
 
    wrapper.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }
 
  /* 4. Magnetic primary button — the main submit button nudges slightly
     toward the cursor when it's nearby, then springs back. */
  function initMagneticButton() {
    const btn = qs('.auth-form .btn-primary');
    if (!btn) return;
 
    const RADIUS = 60; // px — how close the cursor needs to be to "attract"
 
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const distance = Math.min(Math.hypot(x, y), RADIUS);
      const pull = distance / RADIUS; // 0 near edge, 1 at dead center... inverted below
 
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.4}px)`;
    });
 
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  }
 
  /* 5. Cursor spotlight — a soft radial glow that follows the pointer
     behind the card, only visible while the mouse is moving inside the page. */
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
 
  /* 6. Password visibility icon morph — the eye icon scales/rotates out,
     swaps to eye-slash (or back), then scales/rotates back in. */
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
 
  /* 7. Focus animation on inputs is handled entirely in CSS via
     :focus-within (icon lifts + changes color) — no JS needed, but noting
     it here so the numbered list in the chat matches what's actually live. */
 
  /* 8 & 9. Field validation with shake-on-error and checkmark-on-success.
     Returns true/false so form handlers can decide whether to submit. */
  function validateField(input, validatorFn, errorMessage) {
    const group = input.closest('.form-group');
    if (!group) return validatorFn(input.value);
 
    const isValid = validatorFn(input.value);
 
    group.classList.remove('is-invalid', 'is-valid');
    // Force a reflow so re-adding the class re-triggers the shake animation
    // even if the field was already marked invalid once before.
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
     ANIMATIONS 11–12 — Password strength + live match indicator (register/reset)
     ====================================================================== */
  function scorePassword(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(score, 4); // cap at 4 so the bar has 5 clean states (0–4)
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
     ANIMATION 17 — Confetti burst (lightweight, DOM-based, no canvas)
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
 
      // Clean up after the animation finishes so we don't leave hundreds
      // of dead nodes in the DOM if someone triggers this a few times.
      piece.addEventListener('animationend', () => piece.remove());
    }
  }
 
  /* ======================================================================
     ANIMATIONS 15–16 — OTP input auto-advance + countdown ring (verify-code)
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
 
    const circumference = 2 * Math.PI * 9; // matches the r="9" circle in the HTML
    ringFgEl.style.strokeDasharray = `${circumference}`;
 
    let remaining = totalSeconds;
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
    const timer = setInterval(tick, 1000);
 
    resendLinkEl.addEventListener('click', (e) => {
      if (resendLinkEl.classList.contains('disabled')) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      remaining = totalSeconds;
      resendLinkEl.classList.add('disabled');
      showToast('A new code has been sent.', 'success');
      tick();
      setInterval(tick, 1000);
    });
  }
 
  /* ======================================================================
     ANIMATION 18 — Social button hover handled purely in CSS (auth.css)
     ====================================================================== */
 
  /* ======================================================================
     ANIMATION 19 — Page transition fade between auth pages
     ====================================================================== */
  function initPageTransitions() {
    document.body.classList.add('auth-page-loaded');
 
    qsa('a[href$=".html"]').forEach((link) => {
      // Only intercept links that stay within these auth pages, so
      // "Back to home" etc still navigates instantly if you want it to —
      // remove this guard if you'd like the fade everywhere.
      const authPages = ['login.html', 'register.html', 'forgot-password.html', 'verify-code.html', 'reset-password.html', 'index.html'];
      const href = link.getAttribute('href');
      if (!authPages.some((page) => href.includes(page))) return;
 
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('page-fade-out');
        setTimeout(() => {
          window.location.href = href;
        }, 220);
      });
    });
  }
 
  /* ======================================================================
     Ripple effect (button click) — scoped to the auth card so we don't
     change button behavior anywhere else on the site.
     ====================================================================== */
  function initRipple() {
    qsa('.auth-card .btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
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
    });
  }
 
  /* ======================================================================
     Validators (plain functions, not "security" — just shape-checking)
     ====================================================================== */
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isNotEmpty = (value) => value.trim().length > 0;
  const isValidPassword = (value) => value.length >= 8;
 
  /* ======================================================================
     PAGE WIRING — each form's specific behavior
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
 
      // Simulated network delay — swap this whole block for a real
      // fetch('/api/auth/login.php', { method: 'POST', body: ... }) once
      // the PHP + JWT backend exists.
      setTimeout(() => {
        setButtonLoading(submitBtn, false);
        showToast('Signed in successfully.', 'success');
        // window.location.href = 'dashboard.html'; // enable once that page exists
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
          window.location.href = 'login.html';
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
        inputs.forEach((input) => {
          if (!input.value) {
            input.closest('.otp-input-wrap')?.classList.add('is-invalid');
          }
        });
        showToast('Enter the full 6-digit code.', 'error');
        return;
      }
 
      const submitBtn = qs('button[type="submit"]', form);
      setButtonLoading(submitBtn, true);
 
      setTimeout(() => {
        setButtonLoading(submitBtn, false);
        window.location.href = 'reset-password.html';
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
     BOOTSTRAP — runs once the DOM is ready. Every init function guards
     itself (returns early if its elements aren't on this page), so it's
     safe to call all of them on every auth page.
     ====================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initEntranceAnimation();
    initBlobParallax();
    initCardTilt();
    initMagneticButton();
    initCursorSpotlight();
    initRipple();
    initPageTransitions();
 
    wireLoginForm();
    wireRegisterForm();
    wireForgotForm();
    wireVerifyForm();
    wireResetForm();
  });
})();
 