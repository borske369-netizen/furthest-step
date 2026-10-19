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
  starter: { name: 'Starter plan', short: 'Starter', price: 199, year: 1990, reps: 5 },
  crew: { name: 'Crew plan', short: 'Crew', price: 349, year: 3490, reps: 10 },
  team: { name: 'Team plan', short: 'Team', price: 599, year: 5990, reps: 20 },
  office: { name: 'Office plan', short: 'Office', price: 849, year: 8490, reps: 30 }
};
const PLAN_ORDER = ['starter', 'crew', 'team', 'office'];
const planFor = reps => PLAN_ORDER.find(k => reps <= PLANS[k].reps) || 'office';
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
function paintMob() { const k = planFor(enteredReps), P = PLANS[k]; $('#mobPrice').innerHTML = Number.isFinite(enteredReps) ? `${P.short} <b>${money(P.price)}</b> a month` : 'From <b>$199</b> a month'; }
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

/* ---------- industry for leads ---------- */
const CUR = IND[0];

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
let curPlan = 'crew', requestedPlan = null, lastFocus = null, bill = 'm';
const linkKey = p => (bill === 'y' ? p + '_y' : p);
const hasLink = p => !!((C.checkout || {})[linkKey(p)]);
function paintBill() {
  $$('[data-bill]').forEach(b => { const on = b.dataset.bill === bill; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  $$('[data-pm]').forEach(el => { el.textContent = bill === 'y' ? el.dataset.py : el.dataset.pm; });
  if ($('#buyPlan')) paintPlan();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-bill]'); if (b) { bill = b.dataset.bill; paintBill(); } });
// the plan must fit the rep count; a bigger plan the visitor picked is kept
const planForReps = reps => {
  if (!Number.isFinite(reps)) return requestedPlan || 'crew';
  const need = planFor(reps);
  return requestedPlan && PLAN_ORDER.indexOf(requestedPlan) >= PLAN_ORDER.indexOf(need) ? requestedPlan : need;
};
function paintPlan() {
  const P = PLANS[curPlan], reps = parseReps($('#buyForm [name=team_size]')?.value);
  $('#buyPlan').textContent = `${P.name}, up to ${P.reps} reps`;
  $('#buyPrice').textContent = bill === 'y' ? `${money(P.year)} a year after 14 days free` : `${money(P.price)} a month after 14 days free`;
  $('#buyBtn').textContent = hasLink(curPlan) ? 'Continue to checkout' : 'Start my 14 days free';
  let note = '';
  if (reps > 30) note = 'More than 30 reps? Send this and David will set up a plan for your office.';
  else if (requestedPlan && curPlan !== requestedPlan) note = `${PLANS[requestedPlan].short} covers up to ${PLANS[requestedPlan].reps} reps, so ${reps} reps uses ${P.short}.`;
  else if (!requestedPlan) note = 'Plan picked from your rep count: up to 5 is Starter, 10 is Crew, 20 is Team, 30 is Office.';
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
    requestedPlan = plan || null;
  if (requestedPlan && parseReps(repsIn.value) > PLANS[requestedPlan].reps) repsIn.value = PLANS[requestedPlan].reps;
  curPlan = planForReps(parseReps(repsIn.value));
  paintBill();
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
    const r = await rpc('growth_submit_lead', { p_name: name, p_company: company, p_email: email, p_phone: phone, p_industry: val(f, 'industry') || CUR.id, p_team_size: String(reps), p_message: 'Started trial: ' + PLANS[curPlan].name + (bill === 'y' ? ', yearly' : ', monthly'), p_source: 'checkout_' + linkKey(curPlan) });
    if (!r?.ok) throw 0;
    const link = (C.checkout || {})[linkKey(curPlan)];
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

/* ---------- demo video, inline ---------- */
const dv = $('#demoVid');
if (dv) {
  const pick = () => (matchMedia('(max-width: 700px)').matches && C.demoVideoVertical) ? C.demoVideoVertical : C.demoVideo;
  dv.src = pick() + '?v=28';
  if (!matchMedia('(max-width: 700px)').matches && C.demoPoster) dv.poster = C.demoPoster + '?v=28';
  else if (C.demoPosterVertical) dv.poster = C.demoPosterVertical + '?v=28';
  let played = false;
  dv.addEventListener('play', () => { if (!played) { played = true; track('demo_view'); } });
  $$('[data-watch]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    $('#demo').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => { dv.play().catch(() => {}); }, reduce ? 0 : 650);
  }));
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
