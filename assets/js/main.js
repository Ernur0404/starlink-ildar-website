/* ==========================================================================
   Starlink KZ — скрипты лендинга
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  КОНТАКТЫ — единственное место, где их нужно править                */
  /*  Меняете здесь → меняется на обеих страницах (index.html и ru.html) */
  /* ------------------------------------------------------------------ */
  var CONTACTS = {
    whatsapp: '77058896815',              // ← реальный номер клиента (только цифры)
    phone:    '+7 705 889 6815',          // ← как показывать на сайте
    company:  'ЖК «___»',                 // ЗАГЛУШКА: название компании / ТОО
    email:    'info@example.kz',          // ЗАГЛУШКА: почта

    instagram: 'https://www.instagram.com/starlink_eldar',
    tiktok:    'https://www.tiktok.com/@eldarenergy',

    /* Если значение разное по языкам — пишем пару {kk, ru}.
       Если одинаковое (как телефон или почта) — просто строкой. */
    address: {                            // ЗАГЛУШКА: адрес
      kk: '___ қаласы, ___ көшесі',
      ru: 'г. ___, ул. ___'
    }
  };

  /* Тексты сообщений в WhatsApp по языку страницы */
  var MSG = {
    kk: {
      lead:     'Сәлеметсіз бе! Starlink бойынша өтінім қалдырамын.',
      name:     'Аты',
      phone:    'Телефон',
      city:     'Қала',
      general:  'Сәлеметсіз бе! Starlink туралы кеңес алғым келеді.',
      standard: 'Сәлеметсіз бе! Starlink Standard туралы кеңес алғым келеді.',
      mini:     'Сәлеметсіз бе! Starlink Mini туралы кеңес алғым келеді.',
      errName:  'Атыңызды жазыңыз',
      errPhone: 'Телефон нөмірін толық жазыңыз',
      errCity:  'Қалаңызды жазыңыз'
    },
    ru: {
      lead:     'Здравствуйте! Оставляю заявку на Starlink.',
      name:     'Имя',
      phone:    'Телефон',
      city:     'Город',
      general:  'Здравствуйте! Хочу получить консультацию по Starlink.',
      standard: 'Здравствуйте! Хочу получить консультацию по Starlink Standard.',
      mini:     'Здравствуйте! Хочу получить консультацию по Starlink Mini.',
      errName:  'Укажите ваше имя',
      errPhone: 'Введите номер полностью',
      errCity:  'Укажите ваш город'
    }
  };

  var LANG = document.documentElement.lang === 'ru' ? 'ru' : 'kk';
  var T = MSG[LANG];

  /** Собирает ссылку wa.me с готовым текстом. */
  function waLink(text) {
    return 'https://wa.me/' + CONTACTS.whatsapp + '?text=' + encodeURIComponent(text);
  }

  /* --- 1. Подстановка контактов ------------------------------------- */
  document.querySelectorAll('[data-contact]').forEach(function (el) {
    var value = CONTACTS[el.dataset.contact];
    /* значение может быть общим для обоих языков или парой {kk, ru} */
    if (value && typeof value === 'object') value = value[LANG];
    if (value) el.textContent = value;
  });

  document.querySelectorAll('[data-tel]').forEach(function (el) {
    el.href = 'tel:+' + CONTACTS.whatsapp;
  });

  document.querySelectorAll('[data-mail]').forEach(function (el) {
    el.href = 'mailto:' + CONTACTS.email;
    el.textContent = CONTACTS.email;
  });

  /* Соцсети: data-social="instagram" | "tiktok" */
  document.querySelectorAll('[data-social]').forEach(function (el) {
    var url = CONTACTS[el.dataset.social];
    if (!url) return;
    el.href = url;
    el.target = '_blank';
    el.rel = 'noopener';
  });

  /* Кнопки WhatsApp: data-wa="general | standard | mini" */
  document.querySelectorAll('[data-wa]').forEach(function (el) {
    el.href = waLink(T[el.dataset.wa] || T.general);
    el.target = '_blank';
    el.rel = 'noopener';
  });

  /* --- 2. Шапка: фон при скролле ------------------------------------ */
  var hdr = document.querySelector('.hdr');
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.burger');

  function onScroll() {
    hdr.classList.toggle('is-stuck', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- 3. Мобильное меню -------------------------------------------- */
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    /* закрыть по клику на пункт */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- 4. Телефон: код страны + маска -------------------------------- */
  var tel = document.querySelector('#f-phone');
  var country = document.querySelector('#f-country');

  /** Код выбранной страны, без плюса. */
  function dialCode() {
    return country ? country.selectedOptions[0].dataset.dial : '7';
  }

  /**
   * Форматирует введённый номер БЕЗ кода страны — код показывает выпадающий список.
   * Для +7 (Казахстан, Россия) — привычная маска (XXX) XXX-XX-XX на 10 цифр.
   * У остальных стран форматы слишком разные, поэтому просто группируем цифры
   * по три: читается нормально и не мешает вводить номер любой длины.
   */
  function formatPhone(digits) {
    if (dialCode() !== '7') {
      return digits.slice(0, 14).replace(/(\d{3})(?=\d)/g, '$1 ').trim();
    }

    /* Если вставили номер целиком (87001234567 или 77001234567) — убираем
       лишнюю первую цифру, код страны уже выбран в списке */
    if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);

    var out = '';
    if (digits.length) out += '(' + digits.slice(0, 3);
    if (digits.length >= 4) out += ') ' + digits.slice(3, 6);
    if (digits.length >= 7) out += '-' + digits.slice(6, 8);
    if (digits.length >= 9) out += '-' + digits.slice(8, 10);
    return out;
  }

  /** Номер введён полностью? Для +7 это ровно 10 цифр, для прочих — 6…14. */
  function phoneFilled() {
    var n = tel ? tel.value.replace(/\D/g, '').length : 0;
    return dialCode() === '7' ? n === 10 : (n >= 6 && n <= 14);
  }

  /** Номер целиком, с кодом страны — в таком виде уходит в WhatsApp. */
  function fullPhone() {
    return '+' + dialCode() + ' ' + tel.value.trim();
  }

  if (tel) {
    tel.addEventListener('input', function () {
      tel.value = formatPhone(tel.value.replace(/\D/g, ''));
      clearError(tel);
    });
  }

  var flagUse = document.querySelector('.phone__flag use');
  var dialOut = document.querySelector('.phone__dial');

  /** Подтягивает флаг, код и подсказку под выбранную страну. */
  function syncCountry() {
    if (!country) return;
    var opt = country.selectedOptions[0];
    if (flagUse) flagUse.setAttribute('href', '#' + opt.dataset.flag);
    if (dialOut) dialOut.textContent = '+' + opt.dataset.dial;
    if (tel) tel.placeholder = opt.dataset.dial === '7' ? '(000) 000-00-00' : '000 000 000';
  }

  if (country) {
    country.addEventListener('change', function () {
      syncCountry();
      /* уже введённые цифры переформатируем под новый формат */
      tel.value = formatPhone(tel.value.replace(/\D/g, ''));
      clearError(tel);
    });
    syncCountry();
  }

  /* --- 5. Форма → WhatsApp ------------------------------------------ */
  /* Ищем через .field, а не через соседний элемент: поле телефона теперь
     завёрнуто в .phone вместе со списком стран */
  function setError(input, message) {
    input.setAttribute('aria-invalid', 'true');
    var field = input.closest('.field');
    if (!field) return;
    field.classList.add('has-error');
    var box = field.querySelector('.err');
    if (box) box.textContent = message;
  }

  function clearError(input) {
    input.removeAttribute('aria-invalid');
    var field = input.closest('.field');
    if (field) field.classList.remove('has-error');
  }

  var form = document.querySelector('#lead-form');

  if (form) {
    form.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('input', function () { clearError(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.querySelector('#f-name');
      var city = form.querySelector('#f-city');
      var phone = form.querySelector('#f-phone');
      var ok = true;

      if (!name.value.trim()) { setError(name, T.errName); ok = false; }
      if (!phoneFilled()) { setError(phone, T.errPhone); ok = false; }
      if (!city.value.trim()) { setError(city, T.errCity); ok = false; }

      if (!ok) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }

      var text = T.lead + '\n\n' +
        T.name + ': ' + name.value.trim() + '\n' +
        T.phone + ': ' + fullPhone() + '\n' +
        T.city + ': ' + city.value.trim();

      window.open(waLink(text), '_blank', 'noopener');
      form.reset();
      /* reset возвращает список стран к первой — приводим флаг и код в тот же вид */
      syncCountry();
    });
  }

  /* --- 6. Появление блоков при скролле ------------------------------ */
  var revealables = document.querySelectorAll('.rv');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* --- 7. Год в футере ---------------------------------------------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
