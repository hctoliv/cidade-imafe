(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2, '0');
  const WHATS = '5511987027318';

  /* ---------- campi (dados do Instagram de cada campus, do site e do app da igreja) ---------- */
  const SENIORES = ['Pastores Seniores', 'Bispo Adson Belo e Pastora Alba Belo'];
  const SEMANA = [
    { d: 0, h: 10, m: 0, label: 'Culto com a família' },
    { d: 3, h: 20, m: 0, label: 'Culto de quarta' },
    { d: 5, h: 20, m: 0, label: 'Culto de sexta' }
  ];
  const CAMPI = {
    sede: {
      name: 'Cidade IMAFE · Sede', tag: 'Sede', short: 'Sede',
      addr: 'Av. Ten. José Jerônimo de Mesquita, 155 · Vila Maria Alta, São Paulo · SP · 02146-000',
      map: 'https://maps.app.goo.gl/HeHHfwdP5vaQMdwY8',
      ig: 'cidadeimafeoficial', img: 'img/campus-sede.jpg',
      pastors: [SENIORES, ['No louvor', 'IMAFE Music']],
      note: 'Cultos transmitidos ao vivo no YouTube. Ceia do Senhor no 1º domingo do mês, às 10h e 18h. Cidade Kids, Sala de Acolhimento e Fé, estacionamento e Espaço Gourmet.',
      ceia: 1,
      slots: [
        { d: 0, h: 10, m: 0, label: 'Culto com a família' },
        { d: 0, h: 18, m: 0, label: 'Culto com a família' },
        { d: 2, h: 20, m: 0, label: 'Terça da Parashá · séries e estudos bíblicos' },
        { d: 4, h: 20, m: 0, label: 'Culto de Oração · Femme · Homens · Casais' },
        { d: 6, h: 18, m: 30, label: 'JPA e GERAI · jovens e adolescentes (quinzenal)', skip: true }
      ]
    },
    zl: {
      name: 'Campus Zona Leste', tag: 'Zona Leste', short: 'Zona Leste',
      addr: 'Rua Silveira Pires, 504 · São Miguel Paulista, São Paulo · SP',
      map: 'https://www.google.com/maps/search/?api=1&query=Rua+Silveira+Pires%2C+504+S%C3%A3o+Miguel+Paulista+S%C3%A3o+Paulo',
      ig: 'cidadeimafe.campuszonaleste', img: 'img/campus-zl.jpg',
      pastors: [SENIORES, ['Pastores Locais', 'Pr. Wanderson Álvaro e Ana Beatriz Assis']],
      note: 'Ceia no 2º domingo do mês, às 10h. Estacionamento, Espaço Gourmet e Cidade Kids.',
      ceia: 2, slots: SEMANA
    },
    zs: {
      name: 'Campus Zona Sul', tag: 'Zona Sul', short: 'Zona Sul',
      addr: 'Rua Antônio da Cruz Messias, 149 · Jardim São Luís, São Paulo · SP',
      map: 'https://www.google.com/maps/search/?api=1&query=Rua+Ant%C3%B4nio+da+Cruz+Messias%2C+149+Jardim+S%C3%A3o+Lu%C3%ADs+S%C3%A3o+Paulo',
      ig: 'cidadeimafe.campuszonasul', img: 'img/campus-zs.jpg',
      pastors: [SENIORES],
      note: 'Uma igreja que prioriza a exposição bíblica. Te esperamos!',
      slots: SEMANA
    },
    mairipora: {
      name: 'Campus Mairiporã', tag: 'Mairiporã', short: 'Mairiporã',
      addr: 'Avenida Vereador Carlos Nunes, 71A · Centro, Mairiporã · SP',
      map: 'https://www.google.com/maps/search/?api=1&query=Avenida+Vereador+Carlos+Nunes%2C+71A+Centro+Mairipor%C3%A3',
      ig: 'cidadeimafe.campusmairipora', img: 'img/campus-mairipora.jpg',
      pastors: [SENIORES, ['Pastores Locais', 'Pr. Anderson Castro e Aline Belo']],
      note: 'Uma igreja que prioriza a Palavra!',
      slots: SEMANA
    }
  };
  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const DAYS_S = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DUR = 2 * 3600e3;
  const hm = s => s.m ? `${s.h}h${pad(s.m)}` : `${s.h}h`;

  // relógio de São Paulo (UTC-3): getUTC* devolve a hora local
  const spNow = () => new Date(Date.now() - 3 * 3600e3);
  const nthSunday = dt => dt.getUTCDay() === 0 ? Math.ceil(dt.getUTCDate() / 7) : 0;

  function upcoming(key, count = 4) {
    const c = CAMPI[key], now = spNow(), out = [];
    for (let off = 0; off < 22 && out.length < count; off++) {
      const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + off));
      c.slots.filter(s => s.d === base.getUTCDay() && !s.skip).forEach(s => {
        const t = new Date(base.getTime() + (s.h * 60 + s.m) * 60e3);
        if (t.getTime() + DUR > now.getTime() && out.length < count) {
          let label = s.label;
          if (c.ceia && nthSunday(t) === c.ceia) label = 'Culto de Ceia';
          out.push({ t, s, label, live: t <= now });
        }
      });
    }
    return out;
  }

  let campus = 'sede';
  try { const c = localStorage.getItem('imafe-campus'); if (CAMPI[c]) campus = c; } catch (e) {}

  function setCampus(k, save = true) {
    campus = k;
    if (save) try { localStorage.setItem('imafe-campus', k); } catch (e) {}
    renderCampus();
  }

  function renderCampus() {
    const c = CAMPI[campus];
    $$('.pin').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.campus === campus)));
    $$('[data-link]').forEach(l => l.classList.toggle('on', campus === 'sede' || l.dataset.link === campus));
    $$('.campus-tabs [data-campus]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.campus === campus)));
    $('[data-c-name]').textContent = c.name;
    $('[data-c-tag]').textContent = c.tag;
    $('[data-c-addr]').textContent = c.addr;
    const nx = upcoming(campus, 1)[0];
    const order = [0, 1, 2, 3, 4, 5, 6];
    $('[data-c-slots]').innerHTML = order.flatMap(d => c.slots.filter(s => s.d === d)).map(s => {
      const isNext = nx && nx.s === s;
      return `<li${isNext ? ' class="is-next"' : ''}><b>${DAYS_S[s.d]} ${hm(s)}</b><span>${s.label}</span></li>`;
    }).join('');
    $('[data-c-pastors]').innerHTML = c.pastors.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('[data-c-note]').textContent = c.note;
    $('[data-c-map]').href = c.map;
    const ig = $('[data-c-ig]'); ig.href = `https://www.instagram.com/${c.ig}/`; ig.textContent = '@' + c.ig;
    const img = $('[data-c-img]');
    if (!img.getAttribute('src').endsWith(c.img)) {
      img.style.opacity = 0;
      setTimeout(() => { img.onload = () => { img.style.opacity = 1; }; img.src = c.img; img.alt = `Culto no ${c.name}`; }, 220);
    }
    const r = $(`[data-plan-campus] input[value="${campus}"]`); if (r) r.checked = true;
    renderPlanCultos(); tickNext();
  }
  $$('[data-campus]').forEach(b => b.addEventListener('click', () => setCampus(b.dataset.campus)));

  /* ---------- próximo culto ---------- */
  const nextLabel = $('[data-next-label]'), nextK = $('[data-next-k]'), nextCount = $('[data-next-count]'), nextBox = $('.next');
  function tickNext() {
    const n = upcoming(campus, 1)[0]; if (!n) return;
    const now = spNow();
    nextK.textContent = `Próximo culto · ${CAMPI[campus].short}`;
    if (n.live) {
      nextBox.classList.add('is-live');
      nextK.textContent = `Agora · ${CAMPI[campus].short}`;
      nextLabel.textContent = n.label;
      nextCount.innerHTML = '<span>Acontecendo agora</span>';
      return;
    }
    nextBox.classList.remove('is-live');
    const dd = Math.round((Date.UTC(n.t.getUTCFullYear(), n.t.getUTCMonth(), n.t.getUTCDate()) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 864e5);
    nextLabel.textContent = `${dd === 0 ? 'Hoje' : dd === 1 ? 'Amanhã' : DAYS[n.t.getUTCDay()]} · ${hm(n.s)} · ${n.label}`;
    let s = Math.max(0, Math.floor((n.t - now) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    nextCount.innerHTML = `${d ? `<span><b>${d}</b>d</span>` : ''}<span><b>${pad(h)}</b>h</span><span><b>${pad(m)}</b>m</span><span><b>${pad(s)}</b>s</span>`;
  }

  /* ---------- Palavra Profética ---------- */
  const cd = $('[data-countdown]');
  function tickCountdown() {
    let s = Math.max(0, Math.floor((new Date(cd.dataset.countdown) - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    $('[data-d]', cd).textContent = pad(d); $('[data-h]', cd).textContent = pad(h);
    $('[data-m]', cd).textContent = pad(m); $('[data-s]', cd).textContent = pad(s);
  }
  setInterval(() => { tickNext(); tickCountdown(); }, 1000);
  tickCountdown();

  $('[data-ics]').addEventListener('click', e => {
    e.preventDefault();
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cidade IMAFE//PT', 'BEGIN:VEVENT', 'UID:palavra-profetica-2027@cidadeimafe',
      'DTSTAMP:20261018T120000Z', 'DTSTART:20261206T200000Z', 'DTEND:20261207T010000Z', 'SUMMARY:Palavra Profética 2027 · Cidade IMAFE',
      'LOCATION:Ginásio da Portuguesa\\, Rua Comendador Nestor Pereira\\, 33\\, Canindé\\, São Paulo', 'DESCRIPTION:Entrada franca. Das 17h às 22h.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    a.download = 'palavra-profetica-2027.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  // próximas Ceias
  $$('[data-ceia]').forEach(el => {
    const nth = +el.dataset.ceia, now = spNow();
    for (let k = 0; k < 3; k++) {
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + k, 1));
      const day = 1 + ((7 - first.getUTCDay()) % 7) + (nth - 1) * 7;
      const t = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), day, 22));
      if (t > now) { el.textContent = `Próxima: domingo, ${pad(t.getUTCDate())}/${pad(t.getUTCMonth() + 1)}`; break; }
    }
  });

  /* ---------- intro ---------- */
  const intro = $('#intro');
  let seen = false;
  try { seen = sessionStorage.getItem('imafe-intro') === '1'; } catch (e) {}
  if (/[?&]intro/.test(location.search)) seen = false;
  const ready = () => document.body.classList.add('is-ready');
  if (!seen && !reduce) {
    root.classList.add('intro-on');
    const end = () => {
      if (intro.classList.contains('is-out')) return;
      intro.classList.add('is-out'); ready();
      try { sessionStorage.setItem('imafe-intro', '1'); } catch (e) {}
      setTimeout(() => root.classList.remove('intro-on'), 900);
    };
    setTimeout(end, 2400);
    intro.addEventListener('click', end);
    addEventListener('keydown', end, { once: true });
  } else requestAnimationFrame(ready);

  /* ---------- vídeos: carregam perto da tela e pausam fora dela ---------- */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (v.dataset.src) { v.src = v.dataset.src; v.removeAttribute('data-src'); }
      const p = v.play(); if (p) p.catch(() => {});
    } else if (!v.paused) v.pause();
  }), { rootMargin: '120px' });
  $$('video').forEach(v => vio.observe(v));

  // ticker sem emenda
  const tk = $('[data-ticker]'); tk.innerHTML += tk.innerHTML;

  /* ---------- louvor ao vivo (áudio do reel da IMAFE Music) ---------- */
  const audio = $('[data-audio]'), soundBtn = $('[data-sound]');
  let fadeT;
  function fade(to, done) {
    clearInterval(fadeT);
    fadeT = setInterval(() => {
      const v = audio.volume + (to > audio.volume ? .05 : -.05);
      audio.volume = clamp(v);
      if (Math.abs(audio.volume - to) < .06) { audio.volume = to; clearInterval(fadeT); done && done(); }
    }, 40);
  }
  function toggleSound() {
    const on = soundBtn.getAttribute('aria-pressed') !== 'true';
    soundBtn.setAttribute('aria-pressed', String(on));
    if (on) { audio.volume = 0; audio.play().then(() => fade(.9)).catch(() => soundBtn.setAttribute('aria-pressed', 'false')); }
    else fade(0, () => audio.pause());
  }
  soundBtn.addEventListener('click', toggleSound);
  $('[data-sound-inline]').addEventListener('click', toggleSound);

  /* ---------- header + menu ---------- */
  const hd = $('#hd'), burger = $('.hd-burger'), menu = $('#menu');
  const closeMenu = () => { burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; document.body.style.overflow = ''; };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open)); menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#menu a').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- rede de pesca ---------- */
  const net = $('[data-net]');
  (() => {
    let d = '';
    for (let i = -2; i < 26; i++) {           // fios que descem em curva, como rede pendurada
      const x = i * 52;
      d += `<path d="M${x} -20 C ${x + 40} 260, ${x - 30} 520, ${x + 60} 820"/>`;
    }
    for (let j = 0; j < 16; j++) {            // fios horizontais com barriga
      const y = j * 54;
      d += `<path d="M-20 ${y} Q 300 ${y + 40} 600 ${y + 6} T 1220 ${y + 14}"/>`;
    }
    net.innerHTML = d;
    $$('path', net).forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.dataset.len = L; });
  })();
  const netPaths = $$('path', net);

  /* ---------- palavras ---------- */
  function splitWords(el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    return $$('.w', el);
  }
  const manWords = splitWords($('[data-words]'));
  const lightEls = $$('[data-light]').map(el => ({ el, words: splitWords(el) }));
  const quote = $('.palavra-quote');
  const light = (words, p) => { const k = Math.round(p * words.length); words.forEach((w, i) => w.classList.toggle('on', i < k)); };

  /* ---------- contadores, reveals, lineup, ceia ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    if (el.dataset.count) {
      const to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now();
      const step = t => { const p = clamp((t - t0) / 1500); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    } else el.classList.add(el.matches('[data-draw]') ? 'on' : 'in');
  }), { threshold: .3 });
  $$('[data-count]').forEach(c => io.observe(c));
  const draw = $('[data-draw]');
  $$('path', draw).forEach(p => p.style.setProperty('--len', p.getTotalLength()));
  io.observe(draw);
  $$('.sec-head, .campi-grid, .mcard, .mlist, .ytc, .ev, .oracao-txt, .ceia-dates, .visite-txt, .plan, .ft-cols > div').forEach(el => { el.classList.add('rv'); io.observe(el); });
  const lineup = $('[data-lineup]');
  new IntersectionObserver(es => es.forEach(e => lineup.classList.toggle('is-open', e.isIntersecting)), { threshold: .45 }).observe(lineup);

  /* ---------- YouTube ---------- */
  const ytm = $('[data-ytm]'), ytf = $('iframe', ytm);
  $$('[data-yt-id]').forEach(b => b.addEventListener('click', () => {
    if (audio && !audio.paused) toggleSound();
    ytf.src = `https://www.youtube-nocookie.com/embed/${b.dataset.ytId}?autoplay=1&rel=0`;
    ytm.hidden = false; document.body.style.overflow = 'hidden';
  }));
  const closeYt = () => { ytm.hidden = true; ytf.src = 'about:blank'; document.body.style.overflow = ''; };
  ytm.addEventListener('click', e => { if (e.target === ytm || e.target.closest('.ytm-x')) closeYt(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !ytm.hidden) closeYt(); });

  /* ---------- scroll: um único rAF ---------- */
  const palavra = $('.palavra'), photos = $$('.pp-ph'), pSticky = $('.palavra-sticky');
  const louvor = $('.louvor'), track = $('[data-track]'), bar = $('[data-gal-bar]'), galCount = $('[data-gal-count]');
  const pars = $$('[data-par]'), pesc = $('.pescador');
  const navLinks = $$('.hd-nav a'), secs = navLinks.map(a => $(a.getAttribute('href')));
  const sound = $('.sound'), ft = $('.ft');
  let lastY = scrollY, vh = innerHeight, trackW = 0, ticking = false;

  function measure() {
    vh = innerHeight; trackW = track.scrollWidth;
    louvor.style.height = (Math.max(0, trackW - innerWidth) + vh) + 'px';
  }

  function onScroll() {
    ticking = false;
    const y = scrollY;
    hd.classList.toggle('is-solid', y > 40);
    hd.classList.toggle('is-hidden', y > lastY && y > vh * .8 && menu.hidden);
    lastY = y;

    // rede + história
    const pr0 = pesc.getBoundingClientRect();
    const np = clamp((vh - pr0.top) / (pr0.height + vh * .2));
    netPaths.forEach((p, i) => { p.style.strokeDashoffset = p.dataset.len * (1 - clamp(np * 1.6 - (i % 9) * .03)); });
    const mr = manWords[0].parentElement.getBoundingClientRect();
    light(manWords, clamp((vh * .85 - mr.top) / (mr.height + vh * .35)));

    // palavra
    const pr = palavra.getBoundingClientRect();
    if (getComputedStyle(pSticky).position === 'sticky') {
      const p = clamp(-pr.top / (pr.height - vh));
      light(lightEls[0].words, clamp(p / .38));
      light(lightEls[1].words, clamp((p - .36) / .34));
      quote.classList.toggle('on', p > .74);
      const idx = Math.min(photos.length - 1, Math.floor(p * photos.length));
      photos.forEach((ph, i) => ph.classList.toggle('is-on', i === idx));
    } else {
      lightEls.forEach(({ el, words }) => { const r = el.getBoundingClientRect(); light(words, clamp((vh * .9 - r.top) / (r.height + vh * .3))); });
      quote.classList.toggle('on', quote.getBoundingClientRect().top < vh * .85);
    }

    // louvor horizontal
    const lr = louvor.getBoundingClientRect(), span = lr.height - vh;
    if (span > 0) {
      const p = clamp(-lr.top / span);
      track.style.transform = `translate3d(${-p * Math.max(0, trackW - innerWidth)}px,0,0)`;
      bar.style.transform = `scaleX(${p})`;
      galCount.textContent = pad(1 + Math.round(p * 15));
    }

    // parallax
    pars.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      el.style.transform = `translate3d(0,${(r.top + r.height / 2 - vh / 2) * +el.dataset.par}px,0)`;
    });

    // nav ativa
    let on = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * .4) on = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-on', i === on));

    // botão de som some no rodapé
    sound.style.transform = ft.getBoundingClientRect().top < vh ? 'translateY(200%)' : '';
    sound.classList.toggle('in-hero', y < vh * .7);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); onScroll(); });
  $$('.track img').forEach(i => i.addEventListener('load', measure, { once: true }));

  /* ---------- pedido de oração ---------- */
  const prayer = $('#prayer'), embers = $('[data-embers]'), pHint = $('[data-prayer-hint]');
  prayer.addEventListener('submit', async e => {
    e.preventDefault();
    const mot = $$('input[name="motivo"]:checked', prayer).map(i => i.value);
    const txt = prayer.elements.pedido.value.trim();
    const msg = `Pedido de oração${mot.length ? ' por ' + mot.join(', ') : ''}.${txt ? '\n' + txt : ''}`;
    let ok = false;
    try { await navigator.clipboard.writeText(msg); ok = true; } catch (er) {}
    pHint.textContent = ok ? 'Pedido copiado. Cole no Mural de orações que abriu.' : 'Abra o Mural de orações e escreva seu pedido.';
    pHint.classList.toggle('ok', ok);
    if (!reduce) for (let i = 0; i < 18; i++) {
      const s = document.createElement('i');
      s.style.left = (35 + Math.random() * 30) + '%';
      s.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      s.style.animationDelay = (Math.random() * .8) + 's';
      embers.appendChild(s); setTimeout(() => s.remove(), 4200);
    }
    window.open('https://imafe.inpeaceapp.com/prayer', '_blank', 'noopener');
  });

  /* ---------- planeje sua visita ---------- */
  const plan = $('#plan'), cultosBox = $('[data-plan-cultos]'), preview = $('[data-plan-preview]');
  const qtd = plan.elements.qtd;
  function renderPlanCultos() {
    const key = plan.elements.campus.value;
    cultosBox.innerHTML = upcoming(key, 4).filter(o => !o.live).map((o, i) => {
      const lbl = `${DAYS_S[o.t.getUTCDay()]} ${pad(o.t.getUTCDate())}/${pad(o.t.getUTCMonth() + 1)} · ${hm(o.s)}`;
      return `<label><input type="radio" name="culto" value="${lbl}|${o.label}"${i === 0 ? ' checked' : ''}><span>${lbl}</span></label>`;
    }).join('');
    buildMsg();
  }
  function buildMsg() {
    const f = plan.elements, c = CAMPI[f.campus.value];
    const [when, label] = ((f.culto && f.culto.value) || '|').split('|');
    const n = +qtd.value, nome = f.nome.value.trim();
    const lines = [
      `Olá! Vim pelo site da Cidade IMAFE${nome ? ', meu nome é ' + nome : ''}.`,
      `Quero visitar o ${c.name}.`,
      `Culto: ${label} · ${when}`,
      `Vamos em ${n} ${n === 1 ? 'pessoa' : 'pessoas'}${f.kids.checked ? ', com crianças (Cidade Kids)' : ''}.`
    ];
    if (f.first.checked) lines.push('Vai ser minha primeira vez na IMAFE.');
    preview.textContent = lines.join('\n');
    return lines.join('\n');
  }
  plan.addEventListener('change', e => {
    if (e.target.name === 'campus') setCampus(e.target.value);
    else buildMsg();
  });
  plan.addEventListener('input', buildMsg);
  $$('[data-step]', plan).forEach(b => b.addEventListener('click', () => { qtd.value = clamp(+qtd.value + +b.dataset.step, 1, 20); buildMsg(); }));
  plan.addEventListener('submit', e => {
    e.preventDefault();
    window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(buildMsg())}`, '_blank', 'noopener');
  });

  /* ---------- start ---------- */
  renderCampus();
  measure(); onScroll();
})();
