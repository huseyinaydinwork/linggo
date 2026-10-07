// Kelimeler: Seviyem · Tüm liste (sıklık) · Günlük hayat (temalar) · Öğrendiklerim
import { FREQ, THEMES, UNITS, WORDS, CORE, POS_TR, lookup, getWord } from '../data/words.js';
import { state, stageOf, isLearned, dueIds, masteryCounts, card, retention, profile, setProfile, DAY } from '../store.js';
import { icon, esc, sheet, toast, sfx } from '../ui.js';
import { speak } from '../speech.js';
import { navigate } from '../app.js';
import { APP, isPremium, levelInfo } from '../content.js';
import { paywall, lockIcon, proBadge } from '../premium.js';
import { todaysWords, roundsInfo, newRound } from '../plan.js';
import { maybeTour } from '../tours.js';
import { ipaFor, ipaChip, wireIpa } from '../ipa.js';

let lastTab = null, learnedFilter = 'all', learnedSort = 'recent';
const STAGE_TR = { new: 'Yeni', learning: 'Öğreniliyor', young: 'Pekişiyor', mature: 'Kalıcı' };
const learnedIn = ws => ws.filter(w => isLearned(w.id)).length;

export function wordsView(el, { tab } = {}) {
  const S = state();
  const lv = levelInfo();
  const cur = tab || lastTab || 'level';
  const learned = Object.keys(S.cards).filter(isLearned).length;
  const due = dueIds().length;
  const m = masteryCounts();
  const words = todaysWords();
  const rounds = roundsInfo();
  const learnedToday = words.filter(w => card(w.id)).length;
  const newLabel = !words.length ? (isPremium() ? 'Bugünlük yeni kelime kalmadı' : 'Ücretsiz kelimeler bitti · Premium')
    : rounds.done ? (rounds.canMore ? `${icon.refresh}Yeni set kelime al` : rounds.limitHit ? `${icon.lock}Yeni set · Premium` : `${icon.refresh}Bugünün kelimelerini tekrar et`)
    : `${icon.play}${words.length - learnedToday} yeni kelime öğren`;

  el.innerHTML = `
    <header class="topbar"><h1 class="h1">Kelimeler</h1><a class="icon-btn" href="#/profile/settings" aria-label="Ayarlar">${icon.settings}</a></header>
    <div class="stats3">
      <button class="stat squish" data-tab-go="learned"><b>${learned}</b><span>öğrenildi</span></button>
      <button class="stat squish" data-go="/session/review"><b>${due}</b><span>tekrar bekliyor</span></button>
      <button class="stat squish" data-tab-go="learned" data-f="mature"><b>${m.mature}</b><span>kalıcı hafızada</span></button>
    </div>
    <button class="btn btn-lime btn-block mt squish" data-newwords>${newLabel}</button>
    <button class="btn ${due ? 'btn-primary' : 'btn-soft'} btn-block mt-s squish" data-go="/session/review">${icon.refresh}${due ? `${due} kelimeyi tekrar et` : 'Zayıf kelimeleri güçlendir'}</button>
    <label class="search mt">${icon.search}<input id="q" type="search" placeholder="Kelime ara (İngilizce veya Türkçe)" autocomplete="off"></label>
    <div id="results"></div>
    <div id="lists">
      <div class="seg mt" role="tablist">
        <button data-tab="level">${lv?.emoji || '🎯'} Seviyem</button>
        <button data-tab="learned">✅ Öğrendiklerim</button>
        <button data-tab="freq">Tüm liste</button>
        <button data-tab="life">Günlük hayat</button>
      </div>
      <div id="tabbody" class="mt"></div>
    </div>`;

  const body = el.querySelector('#tabbody');
  const unitCard = (u, curUnit) => {
    if (u.locked) return `<button class="unit locked squish" data-pw="${u.levels?.includes(APP.level) ? 'unit' : 'level'}" style="text-align:left">
      <div class="row between"><span class="n">${u.n}</span>${lockIcon()}</div>
      <div class="small muted">${u.from}–${u.to}. kelimeler</div>
      <div><div class="bar"><i style="width:0"></i></div><div class="tiny faint" style="margin-top:5px">${u.count} kelime · ${u.levels?.length ? u.levels.map(l => l.toUpperCase()).join('/') : 'Premium'}</div></div></button>`;
    const l = learnedIn(u.words), done = l === u.words.length;
    return `<a class="unit squish ${done ? 'done' : ''} ${u === curUnit ? 'cur' : ''}" href="#/list/freq/${u.id}">
      <div class="row between"><span class="n">${u.n}</span>${done ? icon.check.replace('<svg', '<svg width="22" height="22"') : u === curUnit ? '<span class="tag lime">Şimdi</span>' : u.levels?.length ? `<span class="tag">${u.levels.map(x => x.toUpperCase()).join('/')}</span>` : ''}</div>
      <div class="small ${done ? '' : 'muted'}">${u.from}–${u.to}. kelimeler</div>
      <div><div class="bar"><i style="width:${l / u.words.length * 100}%"></i></div><div class="tiny ${done ? '' : 'faint'}" style="margin-top:5px">${l}/${u.words.length}</div></div></a>`;
  };
  const themeCard = th => {
    if (th.locked) return `<button class="theme locked squish" style="background:${th.color};text-align:left" data-pw="${th.levels?.includes(APP.level) ? 'theme' : 'level'}">
      <p class="eyebrow" style="color:rgba(20,20,20,.55)">${th.count} kelime</p><b class="h3" style="max-width:75%">${esc(th.title)}</b>
      <div style="margin-top:auto">${proBadge(true)}</div><span class="big-emoji" style="filter:grayscale(.4);opacity:.6">${th.emoji}</span></button>`;
    const l = learnedIn(th.words);
    return `<a class="theme squish" style="background:${th.color}" href="#/list/life/${th.id}">
      <p class="eyebrow" style="color:rgba(20,20,20,.55)">${th.words.length} kelime</p><b class="h3" style="max-width:75%">${esc(th.title)}</b>
      <div class="bar"><i style="width:${l / th.words.length * 100}%"></i></div><span class="tiny" style="color:rgba(20,20,20,.6)">${l}/${th.words.length}</span>
      <span class="big-emoji">${th.emoji}</span></a>`;
  };

  function drawTab(t) {
    lastTab = t;
    history.replaceState(null, '', '#/words' + (t === 'level' ? '' : '/' + t));
    el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    const curUnit = UNITS.find(u => !u.locked && u.levels?.includes(APP.level) && learnedIn(u.words) < u.words.length) || UNITS.find(u => !u.locked && learnedIn(u.words) < u.words.length);
    if (t === 'level') {
      const mine = UNITS.filter(u => u.levels?.includes(APP.level));
      const myThemes = THEMES.filter(x => x.levels?.includes(APP.level));
      const lvWords = mine.flatMap(u => u.words);
      body.innerHTML = `
        <div class="card lime level-card">
          <div class="row gap"><span style="font-size:40px">${lv?.emoji || '🎯'}</span><div class="grow"><p class="eyebrow">Seviyen · ${esc(lv?.cefr || '')}</p><b class="h2">${esc(lv?.title || '')}</b></div><a class="btn btn-xs btn-soft" href="#/profile">Değiştir</a></div>
          <p class="small" style="margin-top:8px;opacity:.75">${esc(lv?.desc || '')}</p>
          <div class="bar mt-s" style="background:rgba(0,0,0,.12)"><i style="width:${lvWords.length ? learnedIn(lvWords) / lvWords.length * 100 : 0}%;background:#141414"></i></div>
          <p class="tiny mt-s" style="opacity:.7">Bu seviyenin açık kelimelerinden ${learnedIn(lvWords)}/${lvWords.length} öğrenildi</p>
        </div>
        <div class="section-head section"><h3 class="h3">Seviyenin üniteleri</h3><span class="small faint">${mine.length} ünite</span></div>
        <div class="units">${mine.map(u => unitCard(u, curUnit)).join('')}</div>
        ${myThemes.length ? `<div class="section-head section"><h3 class="h3">Seviyenin temaları</h3></div><div class="themes">${myThemes.map(themeCard).join('')}</div>` : ''}
        <p class="small muted center mt-l">Diğer seviyeler “Tüm liste” sekmesinde.</p>`;
    } else if (t === 'freq') {
      const core = UNITS.filter(u => !u.bonus), bonus = UNITS.filter(u => u.bonus);
      body.innerHTML = `
        <p class="muted small mb">Kelimeler kullanım sıklığına göre sıralı. İlk 1000 kelime, günlük konuşma ve metinlerin büyük bölümünü oluşturur. Etiketler, ünitenin hangi seviyeye ait olduğunu gösterir.</p>
        <div class="units">${core.map(u => unitCard(u, curUnit)).join('')}</div>
        ${bonus.length ? `<div class="section-head section"><h3 class="h3">Bonus · ${CORE + 1}+</h3><span class="small faint">${bonus.reduce((s, u) => s + u.count, 0)} kelime</span></div><div class="units">${bonus.map(u => unitCard(u, curUnit)).join('')}</div>` : ''}`;
    } else if (t === 'life') {
      body.innerHTML = `<p class="muted small mb">Günlük hayatta herkesin bildiği somut kelimeler — emoji ve örnek cümlelerle (çift kodlama: görsel + sözel).</p>
        <div class="themes">${THEMES.map(themeCard).join('')}</div>`;
    } else drawLearned();
    body.querySelectorAll('[data-pw]').forEach(b => b.onclick = () => paywall(b.dataset.pw));
  }

  // ---------- learned words
  function drawLearned() {
    const ids = Object.keys(S.cards);
    const now = Date.now();
    let rows = ids.map(id => ({ w: getWord(id) || { id, en: id, tr: '' }, c: S.cards[id], st: stageOf(id), ret: retention(id) }));
    const counts = { all: rows.length, learning: 0, young: 0, mature: 0, due: 0 };
    rows.forEach(r => { counts[r.st]++; if (r.c.d <= now) counts.due++; });
    if (learnedFilter === 'due') rows = rows.filter(r => r.c.d <= now);
    else if (learnedFilter !== 'all') rows = rows.filter(r => r.st === learnedFilter);
    const sorters = { recent: (a, b) => (b.c.s || 0) - (a.c.s || 0), az: (a, b) => a.w.en.localeCompare(b.w.en), weak: (a, b) => a.ret - b.ret, strong: (a, b) => b.c.i - a.c.i };
    rows.sort(sorters[learnedSort]);
    const chip = (k, l) => `<button class="chip squish ${learnedFilter === k ? 'on' : ''}" data-lf="${k}">${l} <b>${counts[k]}</b></button>`;
    const nextTxt = c => { const d = Math.ceil((c.d - now) / DAY); return d <= 0 ? '<b class="bad-inline">Şimdi</b>' : d === 1 ? 'yarın' : `${d} gün sonra`; };
    body.innerHTML = rows.length || learnedFilter !== 'all' ? `
      <div class="row wrap gap-xs">${chip('all', 'Tümü')}${chip('learning', '🟡 Öğreniliyor')}${chip('young', '🔵 Pekişiyor')}${chip('mature', '🟢 Kalıcı')}${chip('due', '⏰ Bekleyen')}</div>
      <div class="row between mt-s"><span class="small faint">${rows.length} kelime</span>
        <select class="set-select" data-sort aria-label="Sırala"><option value="recent">En yeni</option><option value="weak">En zayıf</option><option value="strong">En güçlü</option><option value="az">A → Z</option></select></div>
      ${rows.length ? `<div class="row gap-s mt-s"><button class="btn btn-sm btn-primary grow squish" data-practice>${icon.play} Bu listeyle pratik (${Math.min(20, rows.length)})</button></div>` : ''}
      <div class="wlist mt">${rows.slice(0, 300).map(({ w, c, st, ret }) => `<div class="witem" data-id="${esc(w.id)}" data-list="${w.list || 'freq'}" role="button" tabindex="0">
        <span class="stage-dot ${st}" title="${STAGE_TR[st]}"></span>
        <div class="grow"><div class="en">${esc(w.en)} ${ipaFor(w) ? `<span class="ipa faint" style="font-size:13px;font-weight:400">/${esc(ipaFor(w))}/</span>` : ''}</div><div class="tr">${esc(w.tr)}</div>
          <div class="mem"><i style="width:${Math.round(ret * 100)}%;background:${ret > .8 ? 'var(--ok)' : ret > .5 ? 'var(--sun)' : 'var(--coral)'}"></i></div></div>
        <div class="right small faint" style="text-align:right;white-space:nowrap">%${Math.round(ret * 100)}<br>${nextTxt(c)}</div>
        <button class="spk" data-say="${esc(w.en)}" aria-label="${esc(w.en)} dinle">${icon.speaker}</button></div>`).join('')}</div>`
      : `<div class="empty">${''}<p class="h3">Henüz kelime öğrenmedin</p><p class="muted small">İlk pratiğini yaptığında öğrendiğin her kelime burada, hafıza gücüyle birlikte görünecek.</p><button class="btn btn-primary squish" data-go2="/session/daily">${icon.play} İlk pratiğe başla</button></div>`;
    const sort = body.querySelector('[data-sort]'); if (sort) { sort.value = learnedSort; sort.onchange = () => { learnedSort = sort.value; drawLearned(); }; }
    body.querySelectorAll('[data-lf]').forEach(b => b.onclick = () => { learnedFilter = b.dataset.lf; drawLearned(); });
    body.querySelector('[data-practice]')?.addEventListener('click', () => navigate('/session/words/' + encodeURIComponent(rows.slice(0, 20).map(r => r.w.id).join(','))));
    body.querySelector('[data-go2]')?.addEventListener('click', e => navigate(e.currentTarget.dataset.go2));
    wireItems(body);
  }

  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => drawTab(b.dataset.tab));
  el.querySelectorAll('[data-tab-go]').forEach(b => b.onclick = () => { if (b.dataset.f) learnedFilter = b.dataset.f; drawTab(b.dataset.tabGo); });
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => navigate(b.dataset.go));
  el.querySelector('[data-newwords]')?.addEventListener('click', () => {
    if (!words.length) { if (!isPremium()) paywall('more'); return; }
    if (rounds.done) {
      if (rounds.canMore) { if (newRound()) { sfx.pop(); toast('Yeni set hazır! 🌱'); navigate('/session/daily'); } }
      else if (rounds.limitHit) paywall('rounds');
      else navigate('/session/words/' + words.map(w => encodeURIComponent(w.id)).join(','));
      return;
    }
    navigate('/session/daily');
  });
  drawTab(cur);
  maybeTour('words');

  // search
  const q = el.querySelector('#q'), res = el.querySelector('#results'), lists = el.querySelector('#lists');
  const all = [...WORDS.values()];
  q.oninput = () => {
    const s = q.value.trim().toLowerCase();
    if (!s) { res.innerHTML = ''; lists.classList.remove('hide'); return; }
    lists.classList.add('hide');
    const hits = all.filter(w => w.en.toLowerCase().startsWith(s) || w.tr.toLowerCase().includes(s)).slice(0, 40);
    res.innerHTML = hits.length ? `<div class="wlist mt">${hits.map(itemHTML).join('')}</div>` : `<p class="muted center mt">Sonuç yok.</p>`;
    wireItems(res);
  };
}

function itemHTML(w) {
  const st = stageOf(w.id), ipa = ipaFor(w);
  return `<div class="witem" data-id="${esc(w.id)}" data-list="${w.list}" role="button" tabindex="0">
    ${w.emoji ? `<span class="em">${w.emoji}</span>` : `<span class="rk">${w.rank || ''}</span>`}
    <div class="grow"><div class="en">${esc(w.en)}${ipa ? ` <span class="ipa faint" style="font-size:13px;font-weight:400">/${esc(ipa)}/</span>` : ''}</div><div class="tr">${esc(w.tr)}</div></div>
    <span class="stage-dot ${st}" title="${STAGE_TR[st]}"></span>
    <button class="spk" data-say="${esc(w.en)}" aria-label="${esc(w.en)} dinle">${icon.speaker}</button></div>`;
}

function wireItems(root) {
  root.querySelectorAll('[data-say]').forEach(b => b.onclick = e => { e.stopPropagation(); speak(b.dataset.say); });
  root.querySelectorAll('.witem').forEach(it => {
    const open = () => wordSheet(lookup(it.dataset.id, it.dataset.list) || getWord(it.dataset.id));
    it.onclick = open; it.onkeydown = e => { if (e.key === 'Enter') open(); };
  });
}

export function wordSheet(w) {
  if (!w) return;
  const c = card(w.id), st = stageOf(w.id);
  const next = c ? new Date(c.d) : null;
  const ret = c ? Math.round(retention(w.id) * 100) : null;
  sheet(`<div class="sheet-body">
    <div class="row gap between"><div>
      ${w.emoji ? `<div style="font-size:48px;line-height:1">${w.emoji}</div>` : ''}
      <h2 class="display" style="font-size:44px">${esc(w.en)}</h2>
      <p class="serif" style="font-size:26px;color:var(--ink-2)">${esc(w.tr)}</p></div>
      <div class="stack gap-s"><button class="spk-big" data-say="${esc(w.en)}">${icon.speaker}</button><button class="spk-big slow" data-slow="${esc(w.en)}">${icon.snail}</button></div>
    </div>
    ${ipaFor(w) ? `<div class="ipa-pair">${w.us ? `<button data-acc="us"><small>🇺🇸 ABD</small><span class="ipa">/${esc(w.us)}/</span></button>` : ''}${w.uk ? `<button data-acc="uk"><small>🇬🇧 UK</small><span class="ipa">/${esc(w.uk)}/</span></button>` : ''}</div>
      <div>${ipaChip(w, 'wide')}</div>` : ''}
    <div class="row gap-xs wrap">${w.pos ? `<span class="tag">${POS_TR[w.pos] || w.pos}</span>` : ''}${w.rank ? `<span class="tag">Sıklık #${w.rank}</span>` : ''}<span class="tag"><span class="stage-dot ${st}" style="width:8px;height:8px;margin-right:5px"></span>${STAGE_TR[st]}</span></div>
    ${w.ex ? `<div class="card flat"><div class="row gap"><div class="grow"><p style="font-weight:650">${esc(w.ex)}</p><p class="muted small">${esc(w.exTr)}</p></div><button class="spk-sm" data-say="${esc(w.ex)}">${icon.speaker}</button></div></div>` : ''}
    ${c ? `<div class="stats3"><div class="stat"><b>${c.r}</b><span>başarılı tekrar</span></div><div class="stat"><b>%${ret}</b><span>tahmini hatırlama</span></div><div class="stat"><b style="font-size:17px">${next <= new Date() ? 'Şimdi' : next.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</b><span>sonraki tekrar</span></div></div>`
      : `<p class="muted small">Bu kelimeyi henüz öğrenmedin.</p>`}
    <button class="btn btn-primary btn-block squish" data-learn>${c ? 'Şimdi pratik yap' : 'Bu kelimeyi öğren'}</button>
  </div>`, {
    onMount: (sh, close) => {
      sh.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
      sh.querySelectorAll('[data-slow]').forEach(b => b.onclick = () => speak(b.dataset.slow, { rate: 0.6 }));
      sh.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => speak(w.en, { accent: b.dataset.acc }));
      wireIpa(sh, () => w);
      sh.querySelector('[data-learn]').onclick = () => { close(); navigate('/session/words/' + encodeURIComponent(w.id)); };
    }
  });
  speak(w.en);
}

export function listView(el, { list, id }) {
  const isFreq = list === 'freq';
  const src = isFreq ? UNITS.find(u => u.id === id) : THEMES.find(t => t.id === id);
  if (!src) { navigate('/words'); return; }
  if (src.locked) { navigate('/words'); setTimeout(() => paywall(src.levels?.includes(APP.level) ? (isFreq ? 'unit' : 'theme') : 'level'), 300); return; }
  const ws = src.words;
  const counts = { new: 0, learning: 0, young: 0, mature: 0 };
  ws.forEach(w => counts[stageOf(w.id)]++);
  const seen = ws.filter(w => card(w.id));
  const unseen = ws.length - seen.length;
  const title = isFreq ? `Ünite ${src.n}` : src.title;
  const pct = k => (counts[k] / ws.length * 100) + '%';
  const bg = isFreq ? 'var(--grad-lime)' : src.color;

  el.innerHTML = `
    <div class="back-row"><button class="icon-btn" data-back aria-label="Geri">${icon.back}</button><p class="eyebrow">${isFreq ? 'En çok kullanılan kelimeler' : 'Günlük hayat'}${src.levels?.length ? ' · ' + src.levels.map(l => l.toUpperCase()).join('/') : ''}</p></div>
    <section class="card tile-color" style="background:${bg}">
      ${isFreq ? '' : `<span style="position:absolute;right:10px;top:4px;font-size:72px;opacity:.9">${src.emoji}</span>`}
      <p class="eyebrow">${isFreq ? `${src.from}–${src.to}. kelimeler` : `${ws.length} kelime`}</p>
      <h1 class="display" style="font-size:46px;margin-top:6px">${esc(title)}</h1>
      <div class="stackbar mt" style="background:rgba(20,20,20,.1)" aria-label="Ustalık dağılımı">
        <i style="width:${pct('mature')};background:#141414"></i><i style="width:${pct('young')};background:rgba(20,20,20,.55)"></i><i style="width:${pct('learning')};background:rgba(20,20,20,.25)"></i>
      </div>
      <p class="small muted mt-s">${counts.mature} kalıcı · ${counts.young} pekişiyor · ${counts.learning} öğreniliyor · ${counts.new} yeni</p>
      <div class="row gap-s mt">
        ${unseen ? `<button class="btn btn-primary grow squish" data-learn>${icon.play}${Math.min(8, unseen)} yeni kelime öğren</button>` : ''}
        ${seen.length ? `<button class="btn ${unseen ? 'btn-soft' : 'btn-primary grow'} squish" data-review>${icon.refresh}${unseen ? '' : 'Tekrar et'}</button>` : ''}
      </div>
    </section>
    <div class="legend mt"><span><i class="stage-dot"></i>Yeni</span><span><i class="stage-dot learning"></i>Öğreniliyor</span><span><i class="stage-dot young"></i>Pekişiyor</span><span><i class="stage-dot mature"></i>Kalıcı</span></div>
    <div class="wlist mt">${ws.map(itemHTML).join('')}</div>`;

  el.querySelector('[data-back]').onclick = () => navigate('/words');
  el.querySelector('[data-learn]')?.addEventListener('click', () => navigate(`/session/${isFreq ? 'unit' : 'theme'}/${id}`));
  el.querySelector('[data-review]')?.addEventListener('click', () => {
    const pickIds = [...seen].sort((a, b) => retention(a.id) - retention(b.id)).slice(0, 15).map(w => w.id);
    navigate('/session/words/' + encodeURIComponent(pickIds.join(',')));
  });
  wireItems(el);
}
void setProfile; void toast; void isPremium; void FREQ;
