/* ==========================================================================
   CRIATIVAMENTE — script.js
   JavaScript puro, sem dependências. Carregado em todas as páginas.
   Cada bloco checa se o elemento existe antes de agir, então este mesmo
   arquivo funciona em index/sobre/projetos/blog/contato sem alterações.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ------------------------------------------------------------------
     1. HEADER — muda de aparência ao rolar a página
     ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  if (header) {
    var updateHeaderState = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
  }

  /* ------------------------------------------------------------------
     2. MENU MOBILE — abre/fecha e trava o scroll do body quando aberto
     ------------------------------------------------------------------ */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    var closeMenu = function () {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    var openMenu = function () {
      navToggle.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    navToggle.addEventListener('click', function () {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    /* Fecha o menu ao clicar em qualquer link (navegação para outra página) */
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    /* Fecha com a tecla Esc — acessibilidade de teclado */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    /* Se a janela crescer para desktop com o menu aberto, reseta o estado */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  /* ------------------------------------------------------------------
     3. NAV ATIVO — marca o link da página atual (aria-current)
     ------------------------------------------------------------------ */
  var currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .footer-col a').forEach(function (link) {
    var linkFile = link.getAttribute('href');
    if (linkFile === currentFile || (currentFile === '' && linkFile === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ------------------------------------------------------------------
     4. REVEAL AO ROLAR — anima .reveal quando entra na tela
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ------------------------------------------------------------------
     5. ANO DINÂMICO NO RODAPÉ
     ------------------------------------------------------------------ */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     6. FORMULÁRIOS — validação + envio via fetch, compatível com Netlify
        Forms (mesmo form-name usado no atributo data-netlify do HTML).
        Uma função genérica cuida de qualquer formulário da página; o que
        acontece depois do envio (mensagem de sucesso ou liberar um
        download) é definido por quem chama.
     ------------------------------------------------------------------ */
  var validateField = function (field) {
    var wrapper = field.closest('.form-field');
    var value = field.value.trim();
    var isValid = true;

    if (field.hasAttribute('required') && value === '') {
      isValid = false;
    }
    if (field.type === 'email' && value !== '') {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) isValid = false;
    }

    wrapper.classList.toggle('has-error', !isValid);
    return isValid;
  };

  var wireForm = function (form, onSuccess, onError) {
    var statusEl = form.querySelector('.form-status');

    var showStatus = function (type, message) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form-status is-visible ' + (type === 'success' ? 'is-success' : 'is-error');
    };

    form.querySelectorAll('input, textarea').forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = form.querySelectorAll('input:not([type="hidden"]), textarea');
      var allValid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        showStatus('error', 'Confira os campos destacados antes de enviar.');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      var formData = new FormData(form);
      var encoded = new URLSearchParams();
      formData.forEach(function (value, key) { encoded.append(key, value); });

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encoded.toString()
      })
        .then(function () {
          showStatus('success', '');
          if (statusEl) statusEl.className = 'form-status';
          if (onSuccess) onSuccess(form);
          form.reset();
        })
        .catch(function () {
          if (onError) onError();
          else showStatus('error', 'Não foi possível enviar agora. Tente novamente em alguns instantes.');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  };

  /* Formulário de contato (contato.html) */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    wireForm(contactForm, function (form) {
      var statusEl = form.querySelector('.form-status');
      statusEl.textContent = 'Mensagem enviada! Responderemos o quanto antes em ' + (form.dataset.replyEmail || 'suporte@criativamente.ia.br') + '.';
      statusEl.className = 'form-status is-visible is-success';
    });
  }

});
