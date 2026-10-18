(() => {
const C = window.SITE_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SID = Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ---------- backend ---------- */
async function rpc(fn, body) {
  const r = await fetch(`${C.supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('Request failed ' + r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
const track = (kind, extra = {}) => rpc('growth_track', { p_kind: kind, p_industry: extra.industry || null, p_plan: extra.plan || null, p_sid: SID }).catch(() => {});

/* ---------- data ---------- */
const PLANS = {
  crew: { name: 'Crew plan', price: 333, reps: 10 },
  office: { name: 'Office plan', price: 755, reps: 30 }
};
const IND = [
  { id: 'fiber', val: 150, one: 'sale', place: 'street', label: 'Fiber and telecom', tag: 'Door to door', img: './assets/door.webp', alt: 'Door to door sales rep walking up a driveway at sunset', word: 'door',
    title: 'Door to door fiber, internet and wireless',
    lede: 'Built first for fiber door to door teams, where every rep is fighting the same three objections on every street.',
    st: [['D', 'Decision maker reached', 'Reached'], ['P', 'Pitch given', 'Pitched'], ['C', 'Close asked', 'Asked'], ['S', 'Sale', 'Sold']],
    unit: 'sales', cb: '6:00 PM, 1418 Elm', where: 'on their street today', ask: 'ask for the switch', before: 'the pitch', steps: 'Reached a decision maker, pitched, asked for the switch, or sold.', next: 'door',
    obj: 'We already have internet.',
    air: 'Acknowledge it, then isolate: "If the speed and the price were both better, is there anything else that would keep you from switching today?"',
    list: ['Speed test logging at the door', 'Callback reminders with a walking distance warning', 'Standards per campaign and offer'] },
  { id: 'retail', val: 100, one: 'sign up', place: 'table', label: 'Retail events and roadshows', tag: 'Retail events', img: './assets/retail.webp', alt: 'Sales rep greeting a shopper at a promotional table in a warehouse store', word: 'table',
    title: 'Warehouse clubs, kiosks and in store roadshows',
    lede: 'For booth and event teams in big box and warehouse stores, the kind of campaigns run by face to face marketing offices.',
    st: [['T', 'Table stop', 'Stopped'], ['P', 'Pitch given', 'Pitched'], ['C', 'Close asked', 'Asked'], ['S', 'Sign up', 'Signed']],
    unit: 'sign ups', cb: 'Sat 11 AM, return shopper', where: 'at the table today', ask: 'ask for the sign up', before: 'the pitch', steps: 'Stopped a shopper at the table, pitched, asked for the sign up, or signed them up.', next: 'shopper',
    obj: 'I am just shopping today.',
    air: 'Use 15 and 5 to open, then Turn and Return: "Totally fair. Before you go, are you paying more than $80 a month right now?"',
    list: ['15 and 5 engagement and Turn and Return', 'S.E.E. factors and Talk to Everyone drills', 'Shift and location reports for each event'] },
  { id: 'solar', val: 250, one: 'appointment', place: 'street', label: 'Solar', tag: 'Solar', img: './assets/door.webp', alt: 'Field rep approaching a home', word: 'roof',
    title: 'Residential solar setters and closers',
    lede: 'Track the setter funnel at the door and the closer funnel at the kitchen table, on one board.',
    st: [['H', 'Homeowner reached', 'Reached'], ['B', 'Bill reviewed', 'Bill seen'], ['A', 'Appointment asked', 'Asked'], ['S', 'Appointment set', 'Set']],
    unit: 'appointments', cb: 'Thu 7 PM, kitchen table sit', where: 'in the neighborhood today', ask: 'ask for the appointment', before: 'you see their bill', steps: 'Reached the homeowner, reviewed their bill, asked for the appointment, or set it.', next: 'door',
    obj: 'We are not interested in solar.',
    air: 'Acknowledge, then isolate the real worry: "Most people say that until they see the bill comparison. Is it the cost, or the roof?"',
    list: ['Setter and closer stages on one board', 'Appointment callbacks', 'Bill objection drills'] },
  { id: 'pest', val: 200, one: 'service sale', place: 'street', label: 'Pest control', tag: 'Pest control', img: './assets/door.webp', alt: 'Field rep approaching a home', word: 'yard',
    title: 'Summer pest and lawn sales teams',
    lede: 'Long days, fast doors and a lot of new reps. The board keeps rookies improving every single week.',
    st: [['H', 'Homeowner reached', 'Reached'], ['P', 'Service pitch', 'Pitched'], ['C', 'Close asked', 'Asked'], ['S', 'Service sold', 'Sold']],
    unit: 'services', cb: '5:30 PM, 22 Oak, spouse home', where: 'treating homes on their street', ask: 'ask to start service today', before: 'the pitch', steps: 'Reached the homeowner, pitched the service, asked to start, or sold it.', next: 'door',
    obj: 'We already have a guy.',
    air: 'Feel, Felt, Found: "I get it. A lot of neighbors felt the same, and what they found was a gap in what the other guy covers."',
    list: ['Rookie development tracking', 'Neighbor referral notes', 'Daily goals and income pace'] },
  { id: 'roof', val: 300, one: 'inspection', place: 'street', label: 'Roofing', tag: 'Roofing', img: './assets/door.webp', alt: 'Field rep approaching a home', word: 'house',
    title: 'Storm and retail roofing canvassers',
    lede: 'Turn canvass days into inspections, and inspections into signed jobs, with every step on the record.',
    st: [['H', 'Homeowner reached', 'Reached'], ['D', 'Damage pointed out', 'Damage'], ['I', 'Inspection asked', 'Asked'], ['S', 'Inspection set', 'Set']],
    unit: 'inspections', cb: '4:00 PM, 9 Birch, ladder check', where: 'after the storm in their area', ask: 'ask to get on the roof', before: 'you point out the damage', steps: 'Reached the homeowner, pointed out damage, asked for the inspection, or set it.', next: 'door',
    obj: 'My roof is fine.',
    air: 'Acknowledge, then isolate: "Most roofs look fine from the ground. Would a free photo check of yours be worth ten minutes?"',
    list: ['Inspection callbacks', 'Storm area notes', 'Canvass to close reporting'] },
  { id: 'security', val: 250, one: 'install', place: 'street', label: 'Home security', tag: 'Home security', img: './assets/door.webp', alt: 'Field rep approaching a home', word: 'street',
    title: 'Home security and smart home teams',
    lede: 'Coaching built for a trust sale, where the first ten seconds decide everything.',
    st: [['H', 'Homeowner reached', 'Reached'], ['P', 'Safety pitch', 'Pitched'], ['C', 'Close asked', 'Asked'], ['I', 'Install booked', 'Booked']],
    unit: 'installs', cb: '6:30 PM, 310 Pine, both owners', where: 'helping neighbors on their street', ask: 'ask for the install date', before: 'the pitch', steps: 'Reached the homeowner, gave the safety pitch, asked for the close, or booked the install.', next: 'door',
    obj: 'We have a dog. We are fine.',
    air: 'Acknowledge, then respond: "Dogs are great at noise. The system is for the times nobody is home, including the dog."',
    list: ['Trust focused opening drills', 'Install appointment callbacks', 'Standards per offer'] }
];

/* ---------- reveal ---------- */
const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('.rv').forEach(el => io.observe(el));

/* ---------- header ---------- */
const hdr = $('#hdr'); let lastY = 0;
const mob = $('#mobileCta');
addEventListener('scroll', () => {
  const y = scrollY;
  hdr.classList.toggle('solid', y > 40);
  hdr.classList.toggle('hide', y > 500 && y > lastY + 4);
  if (y < lastY - 4) hdr.classList.remove('hide');
  const near = ['#pricing', '#questions'].some(s => { const r = $(s).getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  mob.classList.toggle('show', y > innerHeight * .9 && !near && !document.getElementById('buy').classList.contains('open'));
  lastY = y;
  const b = $('#bandImg'); if (b && !reduce) { const r = b.parentElement.getBoundingClientRect(); b.style.transform = `translateY(${(r.top / innerHeight) * -40}px)`; }
}, { passive: true });

/* ---------- hero word swap ---------- */
const words = ['door', 'table', 'roof', 'yard', 'booth', 'street'];
let wi = 0;
const URL_IND = IND.find(x => x.id === new URLSearchParams(location.search).get('ind'));
if (!reduce && !URL_IND) setInterval(() => { wi = (wi + 1) % words.length; $('#swap').innerHTML = `<span>${words[wi]}</span>`; }, 2200);

/* ---------- phone engine ---------- */
let CUR = IND[0];
function coachFor(v) {
  const [d, p, c, s] = v, x = CUR;
  if (d < 3) return 'Get to five conversations, then the app reads your pattern. Keep tapping the furthest step you reach.';
  if (p / d < 0.5) return `Pace. You are reaching people but losing them before ${x.before}. Slow your first ten seconds and lead with why you are ${x.where}.`;
  if (c / Math.max(p, 1) < 0.5) return `Attitude. Your pitch is landing but you are not asking. After every pitch, ${x.ask} once, then stop talking.`;
  if (s / Math.max(c, 1) < 0.3) return `Pitch. You are asking, but they are saying no. When you hear "${x.obj.replace(/\.$/, '')}," use A.I.R. before you ask again.`;
  return `Strong shift. Your funnel is healthy at every step. Same pace on the next ${x.next} and log every callback.`;
}
function buildPhone(ctrEl, funEl, stages, onTap) {
  ctrEl.innerHTML = stages.map((s, i) => `<button type="button" class="ctr${i === 3 ? ' s' : ''}" data-i="${i}" aria-label="${s[1]}"><div class="k">${s[0]}</div><div class="n">0</div><div class="l">${s[2]}</div></button>`).join('');
  funEl.innerHTML = stages.map(s => `<div class="frow"><span>${s[2]}</span><div class="fbar"><i></i></div><em>0</em></div>`).join('');
  if (onTap) $$('.ctr', ctrEl).forEach(b => b.addEventListener('click', () => onTap(+b.dataset.i, b)));
}
function paint(ctrEl, funEl, v, flash) {
  $$('.ctr', ctrEl).forEach((b, i) => { $('.n', b).textContent = v[i]; if (flash === i) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); } });
  const max = Math.max(v[0], 1);
  $$('.frow', funEl).forEach((r, i) => { $('i', r).style.width = (v[i] / max * 100) + '%'; $('em', r).textContent = v[i]; });
}
// tapping the furthest step counts all earlier steps too
const bump = (v, i) => { for (let k = 0; k <= i; k++) v[k]++; };

/* hero phone, autoplay */
const DS = IND[0].st;
const hc = $('#heroCtr'), hf = $('#heroFunnel');
buildPhone(hc, hf, DS);
let hv = [0, 0, 0, 0];
const script = [0, 0, 1, 0, 2, 0, 0, 1, 3, 0, 1, 0, 0, 2, 0, 1, 0, 0, 3, 1];
let si = 0;
function heroStep() {
  if (si >= script.length) { hv = [0, 0, 0, 0]; si = 0; $('#heroCoach').classList.remove('on'); paint(hc, hf, hv); $('#heroGoal').textContent = 7; $('#heroGoalBar').style.width = (7 / 12 * 100) + '%'; return setTimeout(heroStep, 900); }
  const i = script[si++]; bump(hv, i); paint(hc, hf, hv, i);
  $('#heroGoal').textContent = 7 + hv[3]; $('#heroGoalBar').style.width = ((7 + hv[3]) / 12 * 100) + '%';
  if (hv[0] >= 5) { $('#heroCoachText').textContent = coachFor(hv); $('#heroCoach').classList.add('on'); }
  setTimeout(heroStep, si === script.length ? 3800 : 750);
}
$('#heroGoal').textContent = 7; $('#heroGoalBar').style.width = (7 / 12 * 100) + '%';
if (reduce) { hv = [14, 9, 6, 2]; paint(hc, hf, hv); $('#heroCoachText').textContent = coachFor(hv); $('#heroCoach').classList.add('on'); }
else setTimeout(heroStep, 1200);

/* compare funnel (static, animated on view) */
const cf = $('#compareFunnel');
cf.innerHTML = ['Reached', 'Pitched', 'Asked', 'Sold'].map(l => `<div class="frow"><span>${l}</span><div class="fbar"><i></i></div><em>0</em></div>`).join('');
cf.style.border = '0'; cf.style.padding = '0';
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { const v = [23, 9, 4, 1]; $$('.frow', cf).forEach((r, i) => setTimeout(() => { $('i', r).style.width = (v[i] / 23 * 100) + '%'; $('em', r).textContent = v[i]; }, i * 180)); o.disconnect(); } }), { threshold: .4 }).observe(cf);

/* tally marks */
function tallySVG(n) {
  let out = '';
  for (let g = 0; g < Math.ceil(n / 5); g++) {
    const k = Math.min(5, n - g * 5); let p = '';
    for (let j = 0; j < Math.min(k, 4); j++) p += `<path d="M${6 + j * 9} 3 L${5 + j * 9} 25" style="animation-delay:${(g * 5 + j) * 60}ms"/>`;
    if (k === 5) p += `<path d="M1 20 L38 8" style="animation-delay:${(g * 5 + 4) * 60}ms"/>`;
    out += `<svg viewBox="0 0 40 28" aria-hidden="true">${p}</svg>`;
  }
  return out;
}
$$('.tal').forEach(t => { t.innerHTML = tallySVG(+t.dataset.n); t.setAttribute('aria-label', t.dataset.n); });

/* interactive demo */
const dc = $('#demoCtr'), dfun = $('#demoFunnel');
let dv = [0, 0, 0, 0];
const demoUpdate = (flash) => { paint(dc, dfun, dv, flash); const on = dv[0] >= 3; $('#demoCoach').classList.toggle('on', on); $('#demoCoachText').textContent = coachFor(dv); };
buildPhone(dc, dfun, DS, (i) => { bump(dv, i); $$('[data-pat]').forEach(x => x.setAttribute('aria-pressed', 'false')); demoUpdate(i); });
const PATS = { open: [22, 7, 5, 2], pitch: [18, 12, 9, 1], close: [16, 12, 4, 2], good: [20, 15, 11, 5] };
$$('[data-pat]').forEach(b => b.addEventListener('click', () => {
  $$('[data-pat]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const target = PATS[b.dataset.pat], start = [...dv], t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / 600); dv = start.map((s, i) => Math.round(s + (target[i] - s) * k)); demoUpdate(); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step); track('demo_view');
}));
$('#demoReset').addEventListener('click', () => { dv = [0, 0, 0, 0]; $$('[data-pat]').forEach(x => x.setAttribute('aria-pressed', 'false')); demoUpdate(); });
demoUpdate();

/* industries */
const tabs = $('#indTabs');
tabs.innerHTML = IND.map((x, i) => `<button class="tab" role="tab" type="button" aria-selected="${i === 0}" data-id="${x.id}">${x.label}</button>`).join('');
const opts = IND.map(x => `<option value="${x.id}">${x.label}</option>`).join('') + '<option value="other">Other field sales</option>';
$('#qInd').innerHTML = opts; $('#bInd').innerHTML = opts;
function showInd(id, first) {
  const x = IND.find(i => i.id === id), body = $('#indBody'), img = $('#indImg');
  $$('.tab', tabs).forEach(t => t.setAttribute('aria-selected', String(t.dataset.id === id)));
  const fill = () => {
    $('#indTitle').textContent = x.title; $('#indLede').textContent = x.lede; $('#indTag').textContent = x.tag;
    $('#indStages').innerHTML = x.st.map(s => `<div class="stage"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');
    $('#indObj').textContent = x.obj; $('#indAir').textContent = x.air;
    $('#indList').innerHTML = x.list.map(l => `<li>${l}</li>`).join('');
    body.classList.remove('swapping');
  };
  if (first) return fill();
  body.classList.add('swapping');
  if (img.getAttribute('src') !== x.img) { img.classList.add('fade'); setTimeout(() => { img.src = x.img; img.alt = x.alt; img.classList.remove('fade'); }, 280); }
  setTimeout(fill, 260);
  track('industry', { industry: id });
}
$$('.tab', tabs).forEach(t => t.addEventListener('click', () => showInd(t.dataset.id)));
tabs.addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  const all = $$('.tab', tabs), cur = all.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const nx = all[(cur + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; nx.focus(); showInd(nx.dataset.id);
});
showInd('fiber', true);

/* one industry choice flows through the whole page */
const demoSel = $('#demoInd');
demoSel.innerHTML = IND.map(x => `<option value="${x.id}">${x.label}</option>`).join('');
function setIndustry(id, from) {
  const x = IND.find(i => i.id === id); if (!x) return; CUR = x; queueMicrotask(paintWhy);
  buildPhone(hc, hf, x.st); paint(hc, hf, hv);
  buildPhone(dc, dfun, x.st, (i) => { bump(dv, i); $$('[data-pat]').forEach(b => b.setAttribute('aria-pressed', 'false')); demoUpdate(i); });
  demoUpdate();
  if ($('#heroCoach').classList.contains('on')) $('#heroCoachText').textContent = coachFor(hv);
  $('#heroUnit').textContent = x.unit; $('#heroCb').textContent = x.cb;
  $('#step1').textContent = x.steps;
  demoSel.value = id;
  if (from !== 'tab') showInd(id, from === 'url');
  $('#qInd').value = id; $('#bInd').value = id;
}
demoSel.addEventListener('change', () => { setIndustry(demoSel.value, 'demo'); track('industry', { industry: demoSel.value }); });
$$('.tab', tabs).forEach(t => t.addEventListener('click', () => setIndustry(t.dataset.id, 'tab')));
tabs.addEventListener('keydown', e => { if (['ArrowRight', 'ArrowLeft'].includes(e.key)) setTimeout(() => setIndustry($('.tab[aria-selected="true"]', tabs).dataset.id, 'tab'), 0); });
if (URL_IND) {
  $('#swap').innerHTML = `<span>${URL_IND.word}</span>`;
  if (URL_IND.img !== './assets/door.webp') $('#heroBg').src = URL_IND.img;
  setIndustry(URL_IND.id, 'url');
}

/* manager report */
const REPS = {
  today: [['Marcus', [14, 9, 6, 2], 'ok'], ['Jada', [11, 4, 2, 0], 'watch'], ['Tyler', [16, 12, 9, 3], 'ok'], ['Ana', [9, 7, 2, 0], 'watch']],
  week: [['Marcus', [62, 41, 30, 9], 'ok'], ['Jada', [55, 22, 15, 3], 'watch'], ['Tyler', [70, 52, 40, 12], 'ok'], ['Ana', [48, 36, 14, 3], 'watch']],
  month: [['Marcus', [240, 160, 118, 34], 'ok'], ['Jada', [220, 120, 80, 17], 'ok'], ['Tyler', [268, 199, 150, 44], 'ok'], ['Ana', [201, 150, 70, 14], 'watch']]
};
const FLAG = { ok: 'On pace', watch: 'Needs you' };
function showPeriod(p) {
  const rows = REPS[p], tot = [0, 0, 0, 0]; rows.forEach(r => r[1].forEach((n, i) => tot[i] += n));
  $$('.kpi b').forEach((b, i) => countTo(b, tot[i]));
  const max = Math.max(...rows.map(r => r[1][0]));
  $('#repRows').innerHTML = rows.map(r => `<div class="rrow"><b>${r[0]}</b><div class="rbar">${r[1].map((n, i) => `<i data-w="${((n - (r[1][i + 1] || 0)) / max * 100).toFixed(1)}"></i>`).join('')}</div><span class="flag ${r[2]}">${FLAG[r[2]]}</span></div>`).join('');
  requestAnimationFrame(() => setTimeout(() => $$('#repRows .rbar i').forEach(i => i.style.width = i.dataset.w + '%'), 30));
  $$('#periods button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === p)));
}
function countTo(el, n) {
  const s = +el.textContent || 0, t0 = performance.now();
  const f = t => { const k = Math.min(1, (t - t0) / 700); el.textContent = Math.round(s + (n - s) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); };
  reduce ? el.textContent = n : requestAnimationFrame(f);
}
$$('#periods button').forEach(b => b.addEventListener('click', () => showPeriod(b.dataset.p)));
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { showPeriod('today'); o.disconnect(); } }), { threshold: .3 }).observe($('.report'));

/* ROI */
const money = n => '$' + Math.round(n).toLocaleString('en-US');
function roi() {
  const reps = +$('#rReps').value, lift = +$('#rLift').value, val = +$('#rVal').value;
  $('#oReps').textContent = reps; $('#oLift').textContent = lift; $('#oVal').textContent = money(val);
  const gain = reps * lift * val;
  const plan = reps <= 10 ? ['Crew', 333] : reps <= 30 ? ['Office', 755] : ['Network', null];
  $('#roiBig').textContent = money(gain);
  $('#roiPlan').textContent = plan[0];
  $('#roiCost').textContent = plan[1] ? money(plan[1]) : 'Custom';
  $('#roiX').textContent = plan[1] ? (gain / plan[1]).toFixed(1) + 'x' : 'Volume priced';
}
$$('#value input[type=range]').forEach(r => r.addEventListener('input', roi)); roi();

/* contact ways */
const ways = [];
const fmtPhone = n => { const d = String(n).replace(/\D/g, '').slice(-10); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : n; };
if (C.textNumber) ways.push(`<a class="way" href="sms:${C.textNumber}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span><b>Text us</b><small>${fmtPhone(C.textNumber)}, fastest answer</small></span></a>`, `<a class="way" href="tel:${C.textNumber}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg><span><b>Call</b><small>${fmtPhone(C.textNumber)}</small></span></a>`);
if (C.email) ways.push(`<a class="way" href="mailto:${C.email}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg><span><b>Email</b><small>${C.email}</small></span></a>`);
if (C.bookingUrl) ways.push(`<a class="way" href="${C.bookingUrl}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><span><b>Book a 15 minute call</b><small>Pick a time that works</small></span></a>`);
$('#ways').innerHTML = ways.join('');
$$('#ways a').forEach(a => a.addEventListener('click', () => track('question')));

/* forms */
const val = (f, n) => (f.elements[n]?.value || '').trim();
$('#qForm').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, m = $('#qMsg');
  if (val(f, 'name').length < 2) { m.className = 'msg err'; m.textContent = 'Please add your name.'; return; }
  if (!val(f, 'email') && !val(f, 'phone')) { m.className = 'msg err'; m.textContent = 'Add an email or phone so we can answer you.'; return; }
  m.className = 'msg'; m.textContent = 'Sending...';
  try {
    const r = await rpc('growth_submit_lead', { p_name: val(f, 'name'), p_company: val(f, 'company'), p_email: val(f, 'email'), p_phone: val(f, 'phone'), p_industry: val(f, 'industry'), p_team_size: val(f, 'team_size'), p_message: val(f, 'message'), p_source: 'question' });
    if (!r?.ok) throw 0;
    f.reset(); m.className = 'msg ok'; m.textContent = 'Got it. You will hear back soon, usually the same day.'; track('question');
  } catch { m.className = 'msg err'; m.textContent = 'That did not send. Please try again in a minute.'; }
});

const modal = $('#buy'); let curPlan = 'office', lastFocus = null;
function openBuy(plan) {
  curPlan = plan; lastFocus = document.activeElement;
  $('#buyPlan').textContent = PLANS[plan].name + ', up to ' + PLANS[plan].reps + ' reps';
  $('#buyPrice').textContent = money(PLANS[plan].price) + ' / month after trial';
  $('#buyMsg').textContent = ''; modal.classList.add('open'); document.body.style.overflow = 'hidden';
  setTimeout(() => modal.querySelector('input').focus(), 50);
  track('plan_click', { plan });
}
function closeBuy() { modal.classList.remove('open'); document.body.style.overflow = ''; lastFocus?.focus(); }
$$('[data-plan]').forEach(b => b.addEventListener('click', () => openBuy(b.dataset.plan)));
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeBuy(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeBuy(); });
$('#buyForm').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, m = $('#buyMsg');
  if (val(f, 'name').length < 2 || !val(f, 'company') || !/^\S+@\S+\.\S+$/.test(val(f, 'email'))) { m.className = 'msg err'; m.textContent = 'Please add your name, company and a valid email.'; return; }
  m.className = 'msg'; m.textContent = 'One moment...'; $('#buyBtn').disabled = true;
  try {
    await rpc('growth_submit_lead', { p_name: val(f, 'name'), p_company: val(f, 'company'), p_email: val(f, 'email'), p_phone: val(f, 'phone'), p_industry: val(f, 'industry'), p_team_size: val(f, 'team_size'), p_message: 'Started checkout: ' + PLANS[curPlan].name, p_source: 'checkout_' + curPlan });
    const link = (C.checkout || {})[curPlan];
    if (link) { location.href = link + (link.includes('?') ? '&' : '?') + 'prefilled_email=' + encodeURIComponent(val(f, 'email')); return; }
    $('#buyForm').innerHTML = `<div style="display:grid;gap:.8rem;text-align:left"><b style="font-family:var(--font-display);font-size:1.4rem">You are in.</b><p class="muted">Your spot on the ${PLANS[curPlan].name} is saved. Your team code and secure checkout link are on the way to ${val(f, 'email').replace(/</g, '')} within a few hours. Your 14 free days start when your team goes live.</p><button class="btn btn-ink" type="button" data-close>Back to the site</button></div>`;
  } catch { m.className = 'msg err'; m.textContent = 'That did not go through. Please try again.'; }
  $('#buyBtn') && ($('#buyBtn').disabled = false);
});

$$('[data-track]').forEach(a => a.addEventListener('click', () => { if (a.dataset.track === 'network_call') track('plan_click', { plan: 'network' }); }));
track('view');

/* ---------- owner dashboard ---------- */
let PASS = '';
const owner = $('#owner'), oBody = $('#oBody');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dt = s => new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
function route() {
  const on = location.hash === '#owner'; owner.classList.toggle('open', on); document.body.style.overflow = on ? 'hidden' : '';
  if (on) PASS ? loadOwner() : loginView();
}
function loginView() {
  oBody.innerHTML = `<form class="login" id="oLogin"><h3>Owner sign in</h3><p class="muted" style="font-size:var(--text-sm)">Private growth board for visitors, leads, outreach and revenue.</p><label class="sr-only" for="oPass">Passcode</label><input id="oPass" type="password" placeholder="Passcode" autocomplete="current-password"><button class="btn btn-ink" type="submit">Open board</button><p class="msg" id="oMsg" style="color:var(--color-warn);font-size:var(--text-sm)"></p></form>`;
  $('#oLogin').addEventListener('submit', async e => { e.preventDefault(); PASS = $('#oPass').value; const ok = await loadOwner(); if (!ok) { PASS = ''; $('#oMsg').textContent = 'That passcode did not work.'; } });
  setTimeout(() => $('#oPass')?.focus(), 50);
}
async function loadOwner() {
  let d; try { d = await rpc('growth_metrics', { p_pass: PASS }); } catch { d = null; }
  if (!d?.ok) { if (PASS && owner.classList.contains('open') && !$('#oLogin')) loginView(); return false; }
  const s = d.site, l = d.leads, o = d.outreach, r = d.revenue;
  const trs = (rows, cols, empty) => rows.length ? `<table class="otable"><thead><tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(x => `<tr>${cols.map(c => `<td>${c[1](x)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : `<p class="empty">${empty}</p>`;
  oBody.innerHTML = `
  <div class="ogrid">
    <div class="okpi"><small>Monthly revenue</small><b>${money(r.mrr_cents / 100)}</b></div>
    <div class="okpi"><small>Paying customers</small><b>${r.customers}</b></div>
    <div class="okpi"><small>Leads, last 7 days</small><b>${l.last_7d}</b></div>
    <div class="okpi"><small>Visitors, last 7 days</small><b>${s.visitors_7d}</b></div>
    <div class="okpi"><small>Plan clicks, 7 days</small><b>${s.plan_clicks_7d}</b></div>
    <div class="okpi"><small>Outreach sent, 7 days</small><b>${o.last_7d}</b></div>
    <div class="okpi"><small>Total collected</small><b>${money(r.total_cents / 100)}</b></div>
    <div class="okpi"><small>Visitors, 30 days</small><b>${s.visitors_30d}</b></div>
  </div>
  <div class="opanels">
    <div class="opanel"><h3>Visitors and plan clicks, last 14 days</h3><canvas id="oChart" height="120" aria-label="Daily visitors and plan clicks"></canvas></div>
    <div class="opanel"><h3>What visitors look at</h3>${trs(s.industries, [['Industry', x => esc(x.industry)], ['Views', x => x.n]], 'No industry views yet.')}${trs(s.plans, [['Plan', x => esc(x.plan)], ['Clicks', x => x.n]], 'No plan clicks yet.')}</div>
  </div>
  <div class="opanel" style="margin-bottom:1rem"><h3>Leads and checkouts</h3>${trs(l.recent, [['When', x => dt(x.created_at)], ['Name', x => esc(x.name)], ['Company', x => esc(x.company)], ['Contact', x => esc(x.email) + '<br>' + esc(x.phone)], ['Industry', x => esc(x.industry)], ['Size', x => esc(x.team_size)], ['Note', x => esc(x.message)], ['Status', x => esc(x.status)]], 'No leads yet. They show up here the moment someone asks a question or starts checkout.')}</div>
  <div class="opanels">
    <div class="opanel"><h3>Outreach log</h3>${trs(o.recent, [['When', x => dt(x.created_at)], ['Channel', x => esc(x.channel)], ['Who', x => esc(x.target)], ['Status', x => esc(x.status)], ['Note', x => esc(x.note)]], 'No outreach logged yet.')}
      <h3 style="margin-top:1rem">Which messages work</h3>${trs(o.by_variant, [['Message', x => esc(x.variant || 'unnamed')], ['Sent', x => x.sent], ['Replies or better', x => x.wins]], 'Appears once outreach is logged.')}</div>
    <div class="opanel"><h3>Log activity</h3>
      <form class="oform" id="oLog">
        <select name="kind" aria-label="Type"><option value="outreach">Outreach sent</option><option value="sale">Sale or payment</option></select>
        <div class="row"><input name="target" placeholder="Who (company or person)" aria-label="Who"><input name="channel" placeholder="Channel or plan" aria-label="Channel or plan"></div>
        <div class="row"><select name="status" aria-label="Status"><option>sent</option><option>replied</option><option>booked</option><option>won</option><option>lost</option></select><input name="amount" type="number" min="0" step="1" placeholder="Amount $ (sales)" aria-label="Amount"></div>
        <input name="note" placeholder="Note" aria-label="Note">
        <button class="btn btn-ink" type="submit">Save</button><p class="msg" id="oLogMsg" style="font-size:var(--text-sm)"></p>
      </form>
      <h3 style="margin-top:1rem">Recent revenue</h3>${trs(r.recent, [['When', x => dt(x.created_at)], ['Customer', x => esc(x.customer)], ['Plan', x => esc(x.plan)], ['Amount', x => money(x.amount_cents / 100)]], 'No revenue logged yet.')}
    </div>
  </div><div style="height:3rem"></div>`;
  drawChart(s.daily);
  $('#oLog').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, k = f.kind.value, msg = $('#oLogMsg');
    const data = k === 'sale' ? { customer: f.target.value, plan: f.channel.value, amount_cents: Math.round((+f.amount.value || 0) * 100), status: 'active', source: 'manual' } : { channel: f.channel.value || 'email', target: f.target.value, status: f.status.value, note: f.note.value };
    const res = await rpc('growth_log', { p_pass: PASS, p_kind: k, p_data: data }).catch(() => null);
    if (res?.ok) loadOwner(); else msg.textContent = 'Could not save.';
  });
  return true;
}
function drawChart(daily) {
  const go = () => {
    const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })); }
    const m = Object.fromEntries((daily || []).map(x => [x.d, x]));
    new Chart($('#oChart'), { type: 'bar', data: { labels: days.map(d => d.slice(5)), datasets: [{ label: 'Visitors', data: days.map(d => m[d]?.v || 0), backgroundColor: '#17150F', borderRadius: 4 }, { label: 'Plan clicks', data: days.map(d => m[d]?.c || 0), backgroundColor: '#F26A1B', borderRadius: 4 }] }, options: { plugins: { legend: { labels: { boxWidth: 10 } } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } } });
  };
  if (window.Chart) return go();
  const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'; sc.onload = go; document.head.appendChild(sc);
}
$('#oRefresh').addEventListener('click', () => PASS && loadOwner());
$('#oClose').addEventListener('click', e => { e.preventDefault(); history.pushState('', '', location.pathname); route(); });
addEventListener('hashchange', route); route();
/* why it pays, follows the chosen industry */
function paintWhy() {
  const x = CUR, cost = 333, reps = 10, need = Math.ceil(cost / x.val), gain = reps * x.val;
  const t = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  t('whyBreak', need); t('whyNeed', need); t('whyVal', money(x.val)); t('whyGain', money(gain));
  t('whyNot', `Not ${need} per rep. ${need} total, across everyone.`); t('whyX', (gain / cost).toFixed(1) + 'x'); t('whyPlace', x.place);
  t('whyInd', `Example: ${x.label.toLowerCase()} office, 10 reps`);
  t('whyUnit1', x.one); t('whyUnitH', need === 1 ? x.one : x.unit); t('whyUnit3', x.one); t('whyUnit2', need === 1 ? x.one : x.unit);
  $$('.whyNext').forEach(e => e.textContent = x.next);
  $$('.be').forEach(e => { const n = Math.ceil(+e.dataset.cost / x.val); e.textContent = `Pays for itself at about ${n} ${n === 1 ? x.one : x.unit} a month, team wide`; });
  const bc = $('#whyBarCost'), bg = $('#whyBarGain');
  if (bc && whySeen) { bc.style.width = (cost / gain * 100) + '%'; bg.style.width = (100 - cost / gain * 100) + '%'; }
}
let whySeen = false;
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { whySeen = true; paintWhy(); o.disconnect(); } }), { threshold: .3 }).observe($('.why-math'));
paintWhy();

})();
