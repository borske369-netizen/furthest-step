(() => {
const C = window.SITE_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SID = Math.random().toString(36).slice(2) + Date.now().toString(36);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const TEXT_NUM = C.textNumber || '+17048855457';
// one validated integer parser: plain digits only, so 1e2, 10.5 and blanks are rejected
const parseIntStrict = (raw, min, max) => { const t = String(raw ?? '').trim(); if (!/^\d+$/.test(t)) return NaN; const n = Number(t); return n >= min && n <= max ? n : NaN; };
const parseReps = raw => parseIntStrict(raw, 1, 500);
let boardReady = false, enteredReps = NaN;
const smsHref = body => `sms:${TEXT_NUM}${body ? '?&body=' + encodeURIComponent(body) : ''}`;

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
let boardTracked = false;
const trackBoard = () => { if (!boardTracked) { boardTracked = true; track('demo_view'); } };

/* ---------- data ---------- */
const PLANS = {
  crew: { name: 'Crew plan', short: 'Crew', price: 299, intro: 199, reps: 10 },
  office: { name: 'Office plan', short: 'Office', price: 699, intro: 499, reps: 30 }
};
const planFor = reps => (reps <= 10 ? 'crew' : 'office');
// The app records the same four steps everywhere. Only the meaning of each step changes by trade.
const ST = [['D', 'Decision maker reached', 'Reached'], ['P', 'Presentation', 'Pitched'], ['C', 'Close asked', 'Asked'], ['S', 'Sale', 'Sold']];
const IND = [
  { id: 'fiber', label: 'Fiber and telecom', tag: 'Door to door', img: './assets/door.webp', alt: 'Door to door sales rep walking up a driveway at sunset',
    title: 'Door to door fiber, internet and wireless',
    lede: 'Built first for fiber door to door teams, where every rep hears the same few objections on every street.',
    d: ['Talked with the account holder at the door', 'Presented the offer and the speeds', 'Asked for the switch', 'Signed up'],
    unit: 'sales', cb: '6:00 PM, 1418 Elm', where: 'on their street today', ask: 'ask for the switch', before: 'the presentation', steps: 'Reached the account holder, presented, asked for the switch, or sold.', next: 'door',
    obj: 'We already have internet.',
    air: 'A.I.R. Acknowledge: "That makes sense, almost everyone on this street does." Immediately return: "That is why I am here today. Fiber just went in on this street, so let me show you what it means for your bill."',
    list: ['Speed test logging at the door', 'Callback alerts with a walking leave by warning', 'Team standards with attention flags'] },
  { id: 'retail', label: 'Retail events and roadshows', tag: 'Retail events', img: './assets/retail.webp', alt: 'Sales rep greeting a shopper at a promotional table in a warehouse store',
    title: 'Warehouse clubs, kiosks and in store roadshows',
    lede: 'For booth and event teams in big box and warehouse stores, where every shopper walks past in seconds.',
    d: ['Stopped a shopper who makes the call at home', 'Presentation at the table', 'Asked for the sign up', 'Signed up'],
    unit: 'sign ups', cb: 'Sat 11 AM, return shopper', where: 'at the table today', ask: 'ask for the sign up', before: 'the presentation', steps: 'Stopped a shopper who decides, presented, asked for the sign up, or signed them up.', next: 'shopper',
    obj: 'I am just shopping today.',
    air: 'A.I.R. Agree: "Totally fair, you came in for groceries." Immediately return: "That is exactly why we set up here. Quick question while you walk: are you paying more than $80 a month right now?"',
    list: ['15 and 5 and Turn and Return coaching', 'Followup reminders for shoppers who ask for a call', 'Shift reports you can text, print or export'] },
  { id: 'solar', label: 'Solar', tag: 'Solar', img: './assets/door.webp', alt: 'Field rep approaching a home',
    title: 'Residential solar setters and closers',
    lede: 'Track the setter conversation at the door, with every step on the same board.',
    d: ['Reached the homeowner', 'Bill review and savings walk through', 'Asked for the appointment', 'Appointment set'],
    unit: 'appointments', cb: 'Thu 7 PM, kitchen table sit', where: 'in the neighborhood today', ask: 'ask for the appointment', before: 'you see their bill', steps: 'Reached the homeowner, walked through the bill, asked for the appointment, or set it.', next: 'door',
    obj: 'We are not interested in solar.',
    air: 'A.I.R. Acknowledge: "I hear you, most neighbors said the same thing at first." Immediately return: "I am only here about the power bill. Can I show you what the homes on this street are paying?"',
    list: ['Door to appointment funnel for setters', 'Appointment callbacks with alerts', 'Bill objection answers on the training board'] },
  { id: 'pest', label: 'Pest control', tag: 'Pest control', img: './assets/door.webp', alt: 'Field rep approaching a home',
    title: 'Summer pest and lawn sales teams',
    lede: 'Long days, fast doors and a lot of new reps. The board shows which rookie needs you while there is still time.',
    d: ['Reached the homeowner', 'Walked the yard and presented the service', 'Asked to start service today', 'Service sold'],
    unit: 'services', cb: '5:30 PM, 22 Oak, spouse home', where: 'treating homes on their street', ask: 'ask to start service today', before: 'the presentation', steps: 'Reached the homeowner, presented the service, asked to start, or sold it.', next: 'door',
    obj: 'We already have a guy.',
    air: 'A.I.R. Agree: "Good, that means you take care of your home." Immediately return: "We are treating three houses on this street this week, so I am checking what your guy covers and what he leaves out."',
    list: ['Rookie standards with attention flags', 'Spouse home callbacks with alerts', 'Daily goals and income pace'] },
  { id: 'roof', label: 'Roofing', tag: 'Roofing', img: './assets/door.webp', alt: 'Field rep approaching a home',
    title: 'Storm and retail roofing canvassers',
    lede: 'Turn canvass days into inspections, with every step on the record.',
    d: ['Reached the homeowner', 'Pointed out the damage', 'Asked for the inspection', 'Inspection set'],
    unit: 'inspections', cb: '4:00 PM, 9 Birch, ladder check', where: 'checking roofs after the storm', ask: 'ask to get on the roof', before: 'you point out the damage', steps: 'Reached the homeowner, pointed out damage, asked for the inspection, or set it.', next: 'door',
    obj: 'My roof is fine.',
    air: 'A.I.R. Acknowledge: "It may well be, most roofs look fine from the ground." Immediately return: "That is why we are checking every house the storm hit. A free photo check takes ten minutes."',
    list: ['Inspection callbacks with leave by warnings', 'Storm talk tracks on the training board', 'Door to inspection reports by rep'] },
  { id: 'security', label: 'Home security', tag: 'Home security', img: './assets/door.webp', alt: 'Field rep approaching a home',
    title: 'Home security and smart home teams',
    lede: 'Coaching built for a trust sale, where the first ten seconds decide everything.',
    d: ['Reached the homeowner', 'Safety presentation', 'Asked for the install date', 'Install booked'],
    unit: 'installs', cb: '6:30 PM, 310 Pine, both owners', where: 'helping neighbors on their street', ask: 'ask for the install date', before: 'the presentation', steps: 'Reached the homeowner, gave the safety presentation, asked for the install date, or booked it.', next: 'door',
    obj: 'We have a dog. We are fine.',
    air: 'A.I.R. Agree: "Dogs are great at noise." Immediately return: "I am here for the hours nobody is home, including the dog. Can I show you what the neighbors set up?"',
    list: ['Trust focused opening answers on the board', 'Install date followups', 'Team standards with attention flags'] },
  { id: 'auto', label: 'Car sales', tag: 'Car sales', img: './assets/huddle.webp', alt: 'Sales team meeting before the floor opens',
    title: 'Dealership floor and lot sales',
    lede: 'Every buyer on the lot is a conversation. See which salesperson loses them at the walk, the drive or the write up.',
    d: ['Met the buyer on the lot', 'Product walk and demo drive', 'Asked to write it up', 'Sold'],
    unit: 'cars sold', cb: 'Sat 10 AM, be back with spouse', where: 'helping them find the right car today', ask: 'ask to write it up', before: 'the demo drive', steps: 'Met the buyer, did the walk and demo drive, asked to write it up, or sold the car.', next: 'buyer',
    obj: 'I am just looking today.',
    air: 'A.I.R. Agree: "Totally fine, most people start that way." Immediately return: "That is what today is for. Let me pull the one you came to look at so you can drive it."',
    list: ['Be back followups by call or text', 'Buyer to sold funnel per salesperson', 'Daily goals and income pace'] }
];
const URL_IND = IND.find(x => x.id === new URLSearchParams(location.search).get('ind'));

/* ---------- reveal ---------- */
const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('.rv').forEach(el => io.observe(el));

/* ---------- header, mobile menu, sticky bar ---------- */
const hdr = $('#hdr'), menuBtn = $('#menuBtn'); let lastY = 0;
const mob = $('#mobileCta');
function setMenu(open) {
  hdr.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn.addEventListener('click', () => setMenu(!hdr.classList.contains('menu-open')));
$$('#nav a, #nav button').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && hdr.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
addEventListener('resize', () => { if (innerWidth > 900) setMenu(false); });
function syncMob() { mob.classList.toggle('show', !document.querySelector('.modal.open')); }
function paintMob() { const off = enteredReps > 10; $('#mobPrice').innerHTML = off ? 'Office from <b>$499</b> a month' : 'Crew from <b>$199</b> a month'; }
const noteReps = raw => { const n = parseReps(raw); if (Number.isFinite(n)) { enteredReps = n; paintMob(); } };
addEventListener('scroll', () => {
  const y = scrollY;
  hdr.classList.toggle('solid', y > 40);
  if (!hdr.classList.contains('menu-open')) {
    hdr.classList.toggle('hide', y > 500 && y > lastY + 4);
    if (y < lastY - 4) hdr.classList.remove('hide');
  }
  lastY = y;
}, { passive: true });
syncMob();

/* ---------- phone engine ---------- */
let CUR = IND[0];
function coachFor(v) {
  const [d, p, c, s] = v, x = CUR;
  if (d < 3) return 'Get to five conversations, then the app reads your pattern. Keep tapping the furthest step you reach.';
  if (p / d < 0.5) return `Pace. You are reaching people but losing them before ${x.before}. Slow your first ten seconds and lead with why you are ${x.where}.`;
  if (c / Math.max(p, 1) < 0.5) return `Attitude. Your presentation is landing but you are not asking. After every presentation, ${x.ask} once, then stop talking.`;
  if (s / Math.max(c, 1) < 0.3) return `Pitch. You are asking, but they are saying no. When you hear "${x.obj.replace(/\.$/, '')}," use A.I.R. before you ask again.`;
  return `Strong shift. Your funnel is healthy at every step. Same pace on the next ${x.next} and log every callback.`;
}
function buildPhone(ctrEl, funEl, onTap) {
  ctrEl.innerHTML = ST.map((s, i) => `<button type="button" class="ctr${i === 3 ? ' s' : ''}" data-i="${i}" aria-label="${s[1]}"><div class="k">${s[0]}</div><div class="n">0</div><div class="l">${s[2]}</div></button>`).join('');
  funEl.innerHTML = ST.map(s => `<div class="frow"><span>${s[2]}</span><div class="fbar"><i></i></div><em>0</em></div>`).join('');
  if (onTap) $$('.ctr', ctrEl).forEach(b => b.addEventListener('click', () => onTap(+b.dataset.i, b)));
  else $$('.ctr', ctrEl).forEach(b => { b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); });
}
function paint(ctrEl, funEl, v, flash) {
  $$('.ctr', ctrEl).forEach((b, i) => { $('.n', b).textContent = v[i]; if (flash === i) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); } });
  const max = Math.max(v[0], 1);
  $$('.frow', funEl).forEach((r, i) => { $('i', r).style.width = (v[i] / max * 100) + '%'; $('em', r).textContent = v[i]; });
}
// tapping the furthest step counts all earlier steps too
const bump = (v, i) => { for (let k = 0; k <= i; k++) v[k]++; };

/* hero phone, autoplay */
const hc = $('#heroCtr'), hf = $('#heroFunnel');
buildPhone(hc, hf);
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

/* interactive demo */
const dc = $('#demoCtr'), dfun = $('#demoFunnel');
let dv = [0, 0, 0, 0], patRaf = 0;
const stopPat = () => { if (patRaf) cancelAnimationFrame(patRaf); patRaf = 0; };
const demoUpdate = (flash) => { paint(dc, dfun, dv, flash); const on = dv[0] >= 3; $('#demoCoach').classList.toggle('on', on); $('#demoCoachText').textContent = coachFor(dv); };
buildPhone(dc, dfun, (i) => { stopPat(); bump(dv, i); $$('[data-pat]').forEach(x => x.setAttribute('aria-pressed', 'false')); demoUpdate(i); });
const PATS = { open: [22, 7, 5, 2], pitch: [18, 12, 9, 1], close: [16, 12, 4, 2], good: [20, 15, 11, 5] };
$$('[data-pat]').forEach(b => b.addEventListener('click', () => {
  $$('[data-pat]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  stopPat();
  const target = PATS[b.dataset.pat], start = [...dv], t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / 600); dv = start.map((s, i) => Math.round(s + (target[i] - s) * k)); demoUpdate(); patRaf = k < 1 ? requestAnimationFrame(step) : 0; };
  patRaf = requestAnimationFrame(step); track('demo_view');
}));
$('#demoReset').addEventListener('click', () => { stopPat(); dv = [0, 0, 0, 0]; $$('[data-pat]').forEach(x => x.setAttribute('aria-pressed', 'false')); demoUpdate(); });
demoUpdate();

/* industries */
const tabs = $('#indTabs');
tabs.innerHTML = IND.map((x, i) => `<button class="tab" role="tab" type="button" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-id="${x.id}">${x.label}</button>`).join('');
function showInd(id, first) {
  const x = IND.find(i => i.id === id), body = $('#indBody'), img = $('#indImg');
  $$('.tab', tabs).forEach(t => { const on = t.dataset.id === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && !first) t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
  const fill = () => {
    $('#indTitle').textContent = x.title; $('#indLede').textContent = x.lede; $('#indTag').textContent = x.tag;
    $('#indStages').innerHTML = ST.map((s, i) => `<div class="stage"><b>${s[0]}</b><small>${s[1]}</small><span>${esc(x.d[i])}</span></div>`).join('');
    $('#indObj').textContent = x.obj; $('#indAir').textContent = x.air;
    $('#indList').innerHTML = x.list.map(l => `<li>${l}</li>`).join('');
    body.classList.remove('swapping');
  };
  if (first) { img.src = x.img; img.alt = x.alt || img.alt; return fill(); }
  body.classList.add('swapping');
  if (img.getAttribute('src') !== x.img) { img.classList.add('fade'); setTimeout(() => { img.src = x.img; img.alt = x.alt; img.classList.remove('fade'); }, 280); }
  setTimeout(fill, 260);
  track('industry', { industry: id });
}
tabs.addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  e.preventDefault();
  const all = $$('.tab', tabs), cur = all.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const nx = all[(cur + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; nx.focus(); setIndustry(nx.dataset.id, 'tab'); showInd(nx.dataset.id);
});
showInd('fiber', true);

/* one industry choice flows through the whole page */
const demoSel = $('#demoInd');
demoSel.innerHTML = IND.map(x => `<option value="${x.id}">${x.label}</option>`).join('');
function setIndustry(id, from) {
  const x = IND.find(i => i.id === id); if (!x) return; CUR = x;
  demoUpdate();
  if ($('#heroCoach').classList.contains('on')) $('#heroCoachText').textContent = coachFor(hv);
  $('#heroUnit').textContent = x.unit; $('#heroCb').textContent = x.cb;
  $('#step1').textContent = x.steps;
  $$('[data-nextword]').forEach(el => { el.textContent = x.next === 'door' ? 'door' : 'conversation'; });
  demoSel.value = id;
  if (from !== 'tab') showInd(id, from === 'url');
  $('#bInd').value = id;
  if (boardReady && picked !== null) renderDetail(picked);
}
demoSel.addEventListener('change', () => { setIndustry(demoSel.value, 'demo'); track('industry', { industry: demoSel.value }); });
$$('.tab', tabs).forEach(t => t.addEventListener('click', () => { setIndustry(t.dataset.id, 'tab'); showInd(t.dataset.id); }));
if (URL_IND) {
  if (URL_IND.img !== './assets/door.webp') $('#heroBg').src = URL_IND.img;
  setIndustry(URL_IND.id, 'url');
}

/* ---------- owner board ---------- */
const TEAM = ['Marcus', 'Jada', 'Tyler', 'Ana', 'Devon', 'Priya'];
const BOARD = {
  today: [[14, 9, 6, 2], [12, 5, 3, 1], [16, 12, 9, 3], [10, 7, 2, 1], [11, 8, 6, 1], [13, 6, 4, 1]],
  week: [[62, 41, 30, 9], [55, 26, 17, 3], [70, 52, 40, 12], [48, 35, 14, 3], [51, 36, 27, 5], [58, 34, 24, 6]],
  last: [[60, 38, 27, 8], [50, 20, 12, 2], [66, 47, 35, 10], [46, 33, 15, 2], [49, 30, 21, 4], [55, 28, 18, 4]]
};
const REF = [0.6, 0.7, 0.3]; // example targets: D to P, P to C, C to S
const STEP_NAMES = ['Decision maker to presentation', 'Presentation to close asked', 'Close asked to sale'];
let period = 'today', picked = 1, scrubReady = false;
const metricSel = $('#stdMetric'), stdIn = $('#stdVal');
const ratio = (a, b) => (b > 0 ? a / b : 0);
const repMetric = v => (metricSel.value === 'p' ? ratio(v[1], v[0]) : ratio(v[3], v[2])) * 10;
function leakOf(v) {
  const r = [ratio(v[1], v[0]), ratio(v[2], v[1]), ratio(v[3], v[2])];
  const sc = r.map((x, i) => x / REF[i]); const k = sc.indexOf(Math.min(...sc));
  return { k, r, ok: sc[k] >= 1 };
}
function fixFor(k, name) {
  const x = CUR;
  return [
    { leak: v => `Losing people before the presentation. ${v[1]} presentations from ${v[0]} decision makers.`, fix: `Pace. Slow the first ten seconds and lead with why you are ${x.where}.`, text: `Hey ${name}, your board says people are leaving before the presentation. Next ${x.next}, slow your first ten seconds and lead with why you are ${x.where}. Text me after five more.` },
    { leak: v => `Presenting, but not asking. Asked for the close ${v[2]} times in ${v[1]} presentations.`, fix: `Attitude. After every presentation, ${x.ask} once, then stop talking.`, text: `Hey ${name}, your presentations are landing. Next ${x.next}, ${x.ask} once after every one, then stop talking. Let me know how the next five go.` },
    { leak: v => `Asking, but hearing no. ${v[3]} sales from ${v[2]} closes asked.`, fix: `Pitch. When you hear "${x.obj.replace(/\.$/, '')}," use A.I.R. before you ask again.`, text: `Hey ${name}, you are asking for the close every time. Keep it up. When they say "${x.obj.replace(/\.$/, '')}," acknowledge it, then bring it right back to why you are there before you ask again.` }
  ][k];
}
function stdLabel() { return metricSel.value === 'p' ? `${stdIn.value} of 10` : `${stdIn.value} of 10`; }
function renderBoard() {
  const rows = BOARD[period], std = +stdIn.value;
  $('#stdOut').textContent = stdLabel();
  const max = Math.max(...rows.map(v => v[0]));
  let flagged = [];
  $('#obRows').innerHTML = rows.map((v, i) => {
    const m = repMetric(v), need = m < std; if (need) flagged.push(TEAM[i]);
    const segs = v.map((n, j) => `<i style="width:${((n - (v[j + 1] || 0)) / max * 100).toFixed(1)}%"></i>`).join('');
    return `<div role="listitem"><button type="button" class="obr${picked === i ? ' sel' : ''}" data-r="${i}" aria-pressed="${picked === i}"><span class="obr-name"><b>${TEAM[i]}</b><small>${m.toFixed(1)} of 10</small></span><span class="nums">${v.map(n => `<i>${n}</i>`).join('')}</span><span class="rbar">${segs}</span><span class="flag ${need ? 'watch' : 'ok'}">${need ? 'Needs you' : 'On pace'}</span></button></div>`;
  }).join('');
  $$('#periods button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === period)));
  const what = metricSel.value === 'p' ? 'presentation' : 'closing';
  $('#obSum').textContent = flagged.length ? `${flagged.length} of 6 under your ${what} standard: ${flagged.join(', ')}.` : `Everyone is at or above your ${what} standard.`;
  if (picked !== null) renderDetail(picked);
  if (scrubReady) renderScrub();
}
function renderDetail(i) {
  const v = BOARD[period][i], name = TEAM[i], L = leakOf(v), max = Math.max(v[0], 1);
  const pl = { today: 'today', week: 'this week', last: 'last week' }[period];
  // The flag, the leak and the text all follow the standard the owner picked.
  const isP = metricSel.value === 'p', std = +stdIn.value, m = repMetric(v), need = m < std;
  const what = isP ? 'presentation' : 'closing', sk = isP ? 0 : 2, mine = `${m.toFixed(1)} of 10 against your standard of ${std} of 10`;
  let leak, fix, text;
  if (need) {
    const f = fixFor(sk, name);
    leak = isP ? `Under your presentation standard. ${v[1]} presentations from ${v[0]} decision makers, ${mine}.` : `Under your closing standard. ${v[3]} sales from ${v[2]} closes asked, ${mine}.`;
    fix = f.fix; text = f.text;
  } else {
    leak = `At or above your ${what} standard: ${mine}.`;
    if (L.ok) { fix = `Strong shift. Same pace on the next ${CUR.next} and log every callback.`; }
    else { fix = `Your standard is met. Next thing to try: ${fixFor(L.k, name).fix}`; }
    text = `Hey ${name}, you are at or above my ${what} standard ${pl}. Keep the same pace and log every callback.`;
  }
  $('#obDetail').innerHTML = `
    <div class="obd-head"><b>${name}</b><span class="ex-tag">Example rep, ${pl}</span></div>
    <div class="obd-fun">${ST.map((s, j) => `<div class="frow"><span>${s[2]}</span><div class="fbar"><i style="width:${v[j] / max * 100}%"></i></div><em>${v[j]}</em></div>`).join('')}</div>
    <div class="obd-block"><small>${need ? 'The leak' : 'Against your standard'}</small><p>${esc(leak)}</p></div>
    <div class="obd-block dark"><small>The one fix the app gives ${name}</small><p>${esc(fix)}</p></div>
    <div class="obd-block"><small>Text this rep</small><p class="obd-text" id="obdText">${esc(text)}</p>
      <button type="button" class="btn btn-ink obd-copy" id="obdCopy">Copy this text</button></div>`;
  $('#obdCopy').addEventListener('click', async () => {
    const t = $('#obdText').textContent, b = $('#obdCopy');
    try { await navigator.clipboard.writeText(t); }
    catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch {} ta.remove(); }
    b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy this text'; }, 1600);
  });
}
$('#obRows').addEventListener('click', e => {
  const b = e.target.closest('.obr'); if (!b) return;
  const hadFocus = document.activeElement === b;
  picked = +b.dataset.r; renderBoard(); trackBoard();
  if (hadFocus) $(`#obRows .obr[data-r="${picked}"]`)?.focus({ preventScroll: true });
  if (innerWidth < 980) $('#obDetail').scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
});
$$('#periods button').forEach(b => b.addEventListener('click', () => { period = b.dataset.p; renderBoard(); trackBoard(); }));
metricSel.addEventListener('change', () => {
  if (metricSel.value === 'p') { stdIn.min = 2; stdIn.max = 9; stdIn.value = 6; } else { stdIn.min = 1; stdIn.max = 6; stdIn.value = 3; }
  renderBoard(); trackBoard();
});
stdIn.addEventListener('input', () => { renderBoard(); trackBoard(); });

/* shift scrubber */
const MOMENTS = [
  [0, '9:00 AM: Shift starts. Six reps open one link. The board is empty, and nothing is judged yet.'],
  [90, '10:30 AM: the first conversations are on the board. Nobody had to text in numbers.'],
  [160, () => { const n = BOARD.today.filter(v => repMetric(v) < +stdIn.value).length, w = ['no reps', 'one rep', 'two reps', 'three reps', 'four reps', 'five reps', 'all six reps'][n]; return `11:40 AM: ${w} under your ${metricSel.value === 'p' ? 'presentation' : 'closing'} standard. You would see this now, not at roll call.`; }],
  [255, '1:15 PM: Ana has presented 7 times and asked for the close twice. Her phone already told her: ask once after every presentation, then stop talking.'],
  [390, '3:30 PM: Tyler is on pace for his weekly goal. Nothing for you to do there.'],
  [540, '6:00 PM: callback at 1418 Elm. Alert already sent.'],
  [600, '7:00 PM: shift over. The report is already built. Text it or export it.']
];
const CREW = BOARD.today.reduce((a, v) => a.map((n, i) => n + v[i]), [0, 0, 0, 0]);
const fmtTime = m => { const h = 9 + Math.floor(m / 60), mm = m % 60, h12 = ((h + 11) % 12) + 1; return `${h12}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
function renderScrub() {
  const m = +$('#scrub').value * 10, frac = m / 600;
  const mo = MOMENTS.filter(x => x[0] <= m).pop();
  $('#scrubTime').textContent = fmtTime(m);
  $('#scrubMsg').textContent = (t => t.charAt(0).toUpperCase() + t.slice(1))((typeof mo[1] === 'function' ? mo[1]() : mo[1]).replace(/^\d{1,2}:\d{2} [AP]M: /, ''));
  $('#scrub').setAttribute('aria-valuetext', fmtTime(m));
  const live = CREW.map(n => Math.round(n * Math.min(1, frac * 1.05)));
  $('#scrubTot').innerHTML = `<span>Crew so far</span>` + ST.map((s, i) => `<b><i>${s[0]}</i>${live[i]}</b>`).join('');
}
$('#scrub').addEventListener('input', () => { renderScrub(); trackBoard(); });
scrubReady = true; boardReady = true; renderBoard();

/* ---------- leak calculator ---------- */
const cIds = ['cD', 'cP', 'cC', 'cS'];
const num = id => { const v = $('#' + id).value.trim(); return v === '' ? NaN : Number(v); };
const MAX_COUNT = 100000, MAX_VAL = 1000000;
$$('.stepper button').forEach(b => b.addEventListener('click', () => {
  const inp = b.parentElement.querySelector('input'); const v = Math.min(MAX_COUNT, Math.max(0, Math.round(Number(inp.value) || 0) + +b.dataset.step));
  inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true }));
}));
const calcCta = $('#calcCta');
function calcUnavailable(msg) {
  $('#cLeak').innerHTML = `<b>Not available yet</b><span>${esc(msg)}</span>`;
  $('#cRates').innerHTML = '';
  $('#cGain').textContent = 'Fix the number above and the example math comes back.';
  $('#cBe').textContent = '';
  calcCta.textContent = 'Start 14 days free';
  delete calcCta.dataset.plan;
  $('#calcOut').classList.add('unavail');
}
function calc() {
  const err = $('#calcErr');
  const v = cIds.map(id => parseIntStrict($('#' + id).value, 0, MAX_COUNT));
  const val = num('cVal'), reps = parseIntStrict($('#cReps').value, 1, 500), lift = num('cLift');
  const tRaw = ['tP', 'tC', 'tS'].map(id => parseIntStrict($('#' + id).value, 1, 100)), t = tRaw.map(x => x / 100);
  const names = ['decision makers reached', 'presentations', 'closes asked', 'sales'];
  let msg = '', bad = [];
  const badStep = v.findIndex(x => !Number.isFinite(x));
  if (badStep >= 0) { msg = `Use a whole number from 0 to ${MAX_COUNT.toLocaleString('en-US')} for each step.`; bad = [cIds[badStep]]; }
  else if (v[0] === 0) { msg = 'Add at least one decision maker reached to see the math.'; bad = ['cD']; }
  else for (let i = 1; i < 4; i++) if (v[i] > v[i - 1]) { msg = `Your ${names[i]} (${v[i]}) are more than your ${names[i - 1]} (${v[i - 1]}). Each step counts people who also reached the step before it, so it cannot be higher. Check that number.`; bad = [cIds[i]]; break; }
  if (!msg && (!Number.isFinite(val) || val < 0 || val > MAX_VAL)) { msg = `Add what one sale is worth to the office, from $0 to ${money(MAX_VAL)}.`; bad = ['cVal']; }
  if (!msg && !Number.isFinite(reps)) { msg = 'Add how many reps are on the team, as a whole number from 1 to 500.'; bad = ['cReps']; }
  if (!msg && (!Number.isFinite(lift) || lift < 0 || lift > 50)) { msg = 'Use a lift between 0 and 50 points.'; bad = ['cLift']; }
  if (!msg) { const bt = tRaw.findIndex(x => !Number.isFinite(x)); if (bt >= 0) { msg = 'Example targets need to be whole numbers from 1 to 100 percent.'; bad = [['tP', 'tC', 'tS'][bt]]; } }
  [...cIds, 'cVal', 'cReps', 'cLift', 'tP', 'tC', 'tS'].forEach(id => $('#' + id).setAttribute('aria-invalid', String(bad.includes(id))));
  if (Number.isFinite(reps)) noteReps(reps);
  err.textContent = msg;
  if (msg) return calcUnavailable(msg);
  const r = [ratio(v[1], v[0]), ratio(v[2], v[1]), ratio(v[3], v[2])];
  const sc = r.map((x, i) => x / t[i]), k = sc.indexOf(Math.min(...sc));
  const pct = x => Math.round(x * 100) + '%';
  // a lift can never push a step past 100 percent
  const room = Math.max(0, Math.floor((1 - r[k]) * 1000) / 10), used = Math.min(lift, room), capped = used < lift;
  const L = used / 100;
  const weekly = k === 0 ? v[0] * L * r[1] * r[2] : k === 1 ? v[1] * L * r[2] : v[2] * L;
  const monthly = weekly * 52 / 12, worth = monthly * val;
  if (![weekly, monthly, worth].every(Number.isFinite)) return calcUnavailable('These numbers are too large for the example math. Try smaller numbers.');
  $('#calcOut').classList.remove('unavail');
  $('#cLeak').innerHTML = `<b>${STEP_NAMES[k]}</b><span>${pct(r[k])} against an example target of ${pct(t[k])}${sc[k] >= 1 ? '. Every step meets the example targets, so this is just your lowest one.' : '.'}</span>`;
  $('#cRates').innerHTML = r.map((x, i) => `<div class="${i === k ? 'hit' : ''}"><small>${['D to P', 'P to C', 'C to S'][i]}</small><b>${pct(x)}</b><span>target ${pct(t[i])}</span></div>`).join('');
  const m1 = monthly < 10 ? monthly.toFixed(1) : Math.round(monthly).toLocaleString('en-US');
  const fmtPts = x => { const n = Math.floor(x * 10) / 10; return Number.isInteger(n) ? String(n) : n.toFixed(1); };
  const ptsWord = n => (n === '1' ? 'point' : 'points');
  if (room === 0) $('#cGain').innerHTML = `Example math: ${STEP_NAMES[k].toLowerCase()} is already at ${pct(r[k])}, so there is no room for a lift there. The 14 days are free, so you can check this against your own board.`;
  else if (lift === 0) $('#cGain').innerHTML = `Example math: with no lift the math adds 0 sales a month. That is a fair place to start. The 14 days are free, so you can check this against your own board.`;
  else { const u = fmtPts(used); $('#cGain').innerHTML = `Example math: ${u} more ${ptsWord(u)} at ${STEP_NAMES[k].toLowerCase()}, with every other step held the same, is about <b>${m1} more sales a month</b> across the team, worth about <b>${money(worth)}</b> to the office.${capped ? ` The lift is capped at ${u} ${ptsWord(u)} because that step cannot go past 100%.` : ''}`; }
  const pk = planFor(reps), P = PLANS[pk];
  if (val > 0) {
    const n = Math.ceil(P.intro / val), n2 = Math.ceil(P.price / val);
    $('#cBe').textContent = `Example only. At these numbers, ${P.short} at ${money(P.intro)} needs ${n} extra ${n === 1 ? 'sale' : 'sales'} a month across the whole team, not per rep. After month 3 the same math uses ${money(P.price)}, which is ${n2} extra ${n2 === 1 ? 'sale' : 'sales'} a month.`;
  } else $('#cBe').textContent = 'Example only. Add what one sale is worth to see how many extra sales would cover the plan.';
  if (reps > 30) $('#cBe').textContent += ' More than 30 reps needs a custom Office setup. Text David.';
  calcCta.textContent = `Start 14 days free with ${P.short}`;
  calcCta.dataset.plan = pk;
}
$('#calcForm').addEventListener('input', calc);
calc();

/* ---------- contact ways ---------- */
const fmtPhone = n => { const d = String(n).replace(/\D/g, '').slice(-10); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}` : n; };
const ways = [];
if (C.textNumber) ways.push(`<a class="way" href="sms:${C.textNumber}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span><b>Text David</b><small>${fmtPhone(C.textNumber)}, fastest answer</small></span></a>`, `<a class="way" href="tel:${C.textNumber}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg><span><b>Call David</b><small>${fmtPhone(C.textNumber)}</small></span></a>`);
if (C.email) ways.push(`<a class="way" href="mailto:${C.email}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg><span><b>Email</b><small>${C.email}</small></span></a>`);
if (C.bookingUrl) ways.push(`<a class="way" href="${C.bookingUrl}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><span><b>Book a 15 minute call</b><small>Pick a time that works</small></span></a>`);
$('#ways').innerHTML = ways.join('');
$$('#ways a, [data-sms]').forEach(a => a.addEventListener('click', () => track('question')));
$$('[data-sms]').forEach(a => { a.href = smsHref(''); });

/* ---------- question form ---------- */
const val = (f, n) => (f.elements[n]?.value || '').trim();
$('#qForm').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, m = $('#qMsg');
  const q = val(f, 'message'), c = val(f, 'contact'), isEmail = c.includes('@');
  if (q.length < 3) { m.className = 'msg err'; m.textContent = 'Please type your question.'; return; }
  if (isEmail ? !/^\S+@\S+\.\S+$/.test(c) : c.replace(/\D/g, '').length < 10) { m.className = 'msg err'; m.textContent = 'Add an email or a mobile number so David can answer you.'; return; }
  m.className = 'msg'; m.textContent = 'Sending...';
  try {
    const r = await rpc('growth_submit_lead', { p_name: 'Website question', p_company: '', p_email: isEmail ? c : '', p_phone: isEmail ? '' : c, p_industry: CUR.id, p_team_size: '', p_message: q, p_source: 'question' });
    if (!r?.ok) throw 0;
    f.reset(); m.className = 'msg ok'; m.textContent = 'Got it. David will answer you soon, usually the same day.'; track('question');
  } catch { m.className = 'msg err'; m.textContent = 'That did not send. Please try again in a minute, or text David.'; }
});

/* ---------- trial modal ---------- */
const modal = $('#buy'), buyBody = $('#buyBody'), BUY_HTML = buyBody.innerHTML;
let curPlan = 'crew', requestedPlan = null, lastFocus = null;
const hasLink = p => !!((C.checkout || {})[p]);
// more than 10 reps always needs Office; otherwise go back to the plan the visitor asked for
const planForReps = reps => (Number.isFinite(reps) && reps > 10 ? 'office' : (requestedPlan || 'crew'));
function paintPlan() {
  const P = PLANS[curPlan], reps = parseReps($('#buyForm [name=team_size]')?.value);
  $('#buyPlan').textContent = `${P.name}, up to ${P.reps} reps`;
  $('#buyPrice').textContent = `${money(P.intro)} a month for 3 months, then ${money(P.price)}`;
  $('#buyBtn').textContent = hasLink(curPlan) ? 'Continue to checkout' : 'Start my 14 days free';
  let note = '';
  if (reps > 30) note = 'More than 30 reps? Send this and David will set up a plan for your office.';
  else if (requestedPlan === 'crew' && curPlan === 'office') note = 'Crew covers up to 10 reps, so more than 10 uses Office.';
  else if (!requestedPlan) note = 'Plan picked from your rep count: 10 or fewer is Crew, more is Office.';
  $('#planNote').textContent = note;
}
/* dialogs: trap focus and make the rest of the page inert */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),video[controls],[tabindex]:not([tabindex="-1"])';
let inerted = [];
function openDialog(m) {
  inerted = [...document.body.children].filter(el => el !== m && !el.inert && el.tagName !== 'SCRIPT');
  inerted.forEach(el => { el.inert = true; });
  m.classList.add('open'); document.body.style.overflow = 'hidden'; syncMob();
}
function releaseInert() { inerted.forEach(el => { el.inert = false; }); inerted = []; }
addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const m = $('.modal.open'); if (!m) return;
  const f = $$(FOCUSABLE, m).filter(el => el.offsetParent !== null || el === document.activeElement);
  if (!f.length) { e.preventDefault(); return; }
  const first = f[0], last = f[f.length - 1], a = document.activeElement;
  if (!m.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
});
function openBuy(plan) {
  lastFocus = document.activeElement;
  buyBody.innerHTML = BUY_HTML; $('#bInd').value = CUR.id;
  const repsIn = $('#buyForm [name=team_size]');
  const calcReps = parseReps($('#cReps').value); if (Number.isFinite(calcReps)) repsIn.value = calcReps;
  requestedPlan = plan || null;
  if (requestedPlan === 'crew' && parseReps(repsIn.value) > PLANS.crew.reps) repsIn.value = 10;
  curPlan = planForReps(parseReps(repsIn.value));
  paintPlan();
  openDialog(modal);
  setTimeout(() => modal.querySelector('input')?.focus(), 50);
  track('plan_click', { plan: curPlan });
}
function closeAny(m) { m.classList.remove('open'); releaseInert(); document.body.style.overflow = ''; if (m.id === 'vid') $('#vidSlot').innerHTML = ''; syncMob(); lastFocus?.focus?.(); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-start],[data-plan]');
  if (b && !b.closest('.modal')) { e.preventDefault(); openBuy(b.dataset.plan || null); }
});
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeAny(m); }));
addEventListener('keydown', e => { if (e.key === 'Escape') { const m = $('.modal.open'); if (m) closeAny(m); } });
modal.addEventListener('input', e => {
  if (e.target.name !== 'team_size') return;
  const reps = parseReps(e.target.value);
  if (Number.isFinite(reps)) { curPlan = planForReps(reps); noteReps(reps); }
  paintPlan();
});
modal.addEventListener('submit', async e => {
  if (e.target.id !== 'buyForm') return;
  e.preventDefault(); const f = e.target, m = $('#buyMsg');
  const name = val(f, 'name'), phone = val(f, 'phone'), company = val(f, 'company'), reps = parseReps(val(f, 'team_size')), email = val(f, 'email');
  const miss = [];
  if (name.length < 2) miss.push('your name');
  if (phone.replace(/\D/g, '').length < 10) miss.push('a mobile number');
  if (!company) miss.push('your company');
  if (!Number.isFinite(reps)) miss.push('a whole number of reps');
  if (miss.length) { m.className = 'msg err'; m.textContent = 'Please add ' + miss.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.'; return; }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) { m.className = 'msg err'; m.textContent = 'That email does not look right. Fix it or leave it blank.'; return; }
  m.className = 'msg'; m.textContent = 'One moment...'; $('#buyBtn').disabled = true;
  try {
    const r = await rpc('growth_submit_lead', { p_name: name, p_company: company, p_email: email, p_phone: phone, p_industry: val(f, 'industry') || CUR.id, p_team_size: String(reps), p_message: 'Started trial: ' + PLANS[curPlan].name, p_source: 'checkout_' + curPlan });
    if (!r?.ok) throw 0;
    const link = (C.checkout || {})[curPlan];
    if (link) { location.href = email ? link + (link.includes('?') ? '&' : '?') + 'prefilled_email=' + encodeURIComponent(email) : link; return; }
    const first = name.split(/\s+/)[0];
    const body = `This is ${name} at ${company}. ${reps} reps. I want to start the 14 day trial.`;
    buyBody.innerHTML = `<div class="done">
      <h3 id="buyTitle">Got it, ${esc(first)}.</h3>
      <p>David will text you within a few hours to set up your team. Want it faster? Text him now.</p>
      <a class="btn btn-primary btn-big" id="textNow" href="${esc(smsHref(body))}">Text David now</a>
      <p class="fine">Your 14 days start the day your team goes live. Nothing is charged during the trial.</p>
      <button class="btn btn-ghost" type="button" data-close>Back to the site</button></div>`;
    $('#textNow').addEventListener('click', () => track('question'));
    $('#textNow').focus();
  } catch { m.className = 'msg err'; m.textContent = 'That did not go through. Please try again, or text David at ' + fmtPhone(TEXT_NUM) + '.'; }
  const bb = $('#buyBtn'); if (bb) bb.disabled = false;
});

/* ---------- features expand ---------- */
const fxBtn = $('#fxBtn'), fxAll = $('#fxAll');
fxBtn.addEventListener('click', () => {
  const open = fxBtn.getAttribute('aria-expanded') !== 'true';
  fxBtn.setAttribute('aria-expanded', String(open)); fxAll.hidden = !open;
  fxBtn.textContent = open ? 'Hide the full list' : 'See every feature';
});

/* ---------- optional demo video ---------- */
if (C.demoVideo) {
  const vb = $('#videoBtn'); vb.hidden = false;
  vb.addEventListener('click', () => {
    lastFocus = vb;
    $('#vidSlot').innerHTML = `<video controls autoplay playsinline preload="metadata" ${C.demoPoster ? `poster="${esc(C.demoPoster)}"` : ''} src="${esc(C.demoVideo)}"></video>`;
    openDialog($('#vid'));
    setTimeout(() => $('#vid [data-close]')?.focus(), 50);
    track('demo_view');
  });
}

track('view');

/* ---------- owner dashboard ---------- */
let PASS = '';
const owner = $('#owner'), oBody = $('#oBody');
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
  const STG = { new: 'Found', emailed_1: 'Email 1 sent', emailed_2: 'Email 2 sent', text_due: 'Text them now', texted: 'Texted', emailed_final: 'Final email sent', replied: 'Replied', interested: 'Interested', trial: 'On trial', customer: 'Customer', not_interested: 'Not interested', unsubscribed: 'Unsubscribed', bounced: 'Bad email', cold: 'Cold, retry later', skip: 'Skipped' }, stg = v => esc(STG[v] || v);
  let pv = null; try { pv = await rpc('growth_prospects_view', { p_pass: PASS }); } catch { pv = null; }
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
  <div class="opanel" style="margin-bottom:1rem"><h3>Prospects</h3>${(pv?.by_status||[]).length ? '<p style="font-size:var(--text-sm);margin-bottom:.5rem">' + pv.by_status.map(x => stg(x.status) + ': ' + x.n).join(' &middot; ') + '</p>' : ''}${trs(pv?.list || [], [['Company', x => esc(x.company)], ['Contact', x => esc(x.contact_name) + '<br>' + esc(x.title || '')], ['Phone', x => x.phone ? `<a href="sms:${esc(x.phone)}">${esc(x.phone)}</a>` : ''], ['Industry', x => esc(x.industry)], ['Where', x => esc([x.city, x.state].filter(Boolean).join(', '))], ['Stage', x => stg(x.status)], ['Touches', x => x.touches], ['Last touch', x => x.last_touch_at ? dt(x.last_touch_at) : ''], ['Next step', x => x.next_action_at ? dt(x.next_action_at) : '']], 'No prospects yet. The lead team adds them here as it finds and contacts them.')}</div>
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
})();
