/**
 * Collects student data from the Newton motion game into this Google Sheet.
 *
 * Setup (details in README.md, "Collecting student data"):
 *   1. In the Google Sheet: Extensions → Apps Script, paste this whole file, Save.
 *   2. Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone → Deploy.
 *   3. Copy the web-app URL into LOG_URL near the top of the <script> in index.html.
 * Then use the "Newton" menu in the sheet → "สร้างสรุป" to rebuild the Summary tab,
 * "จัดรูปแบบชีต" to tidy how the data tabs look, and "ใช้เวลาประเทศไทย" if the times are not in Thai time.
 */

// One tab per event type. Column names match the fields the game sends.
const TABS = {
  session:  { name: 'Sessions', key: 'sessionId',
              cols: ['sessionId', 'updatedAt', 'startedAt', 'name', 'room', 'entry', 'runs', 'lastStep', 'furthest',
                     'reachedEnd', 'activeMin', 'device', 'deviceId'] },
  section:  { name: 'Sections',
              cols: ['eid', 'ts', 'name', 'room', 'sessionId', 'section', 'part', 'enteredAt', 'activeSec', 'idleSec',
                     'completed', 'partial', 'lines', 'slowLines'] },
  attempt:  { name: 'Attempts',
              cols: ['eid', 'ts', 'name', 'room', 'sessionId', 'section', 'attemptNo', 'F', 'm', 'mu', 'v', 'outcome',
                     'errM', 'thinkSec', 'sliderMoves', 'typedExact', 'change', 'hintsBefore'] },
  quiz:     { name: 'Quiz',
              cols: ['eid', 'ts', 'name', 'room', 'sessionId', 'section', 'quizId', 'firstTryCorrect', 'tries', 'picks',
                     'wrongTags', 'secToFirstPick', 'secTotal'] },
  choice:   { name: 'Choices',
              cols: ['eid', 'ts', 'name', 'room', 'sessionId', 'section', 'question', 'pick', 'afterAttempts'] },
  feedback: { name: 'Feedback',
              cols: ['eid', 'ts', 'name', 'room', 'sessionId', 'difficulty', 'enjoyment', 'hardest', 'question', 'skipped', 'comment'] }
};
const DATE_COLS = ['ts', 'updatedAt', 'startedAt', 'enteredAt'];
const MAX_EVENTS = 300;   // per request

// Story order and Thai names (same as PART_NAME in index.html).
const PARTS = ['ch1', 'lesson', 'fric', 'fricLesson', 'sandbox', 'bonus', 'projLesson', 'end'];
const PART_NAME = { ch1: 'ด่านที่ 1 : กฎข้อที่ 1 ของนิวตัน', lesson: 'บทเรียน : แรงลัพธ์และความเฉื่อย',
  fric: 'ด่านที่ 1 (รอบที่ 2) : แรงเสียดทาน', fricLesson: 'บทเรียน : แรงเสียดทาน',
  sandbox: 'ด่านที่ 1 (ท้าทาย) : มวลและสัมประสิทธิ์ความเสียดทาน', bonus: 'ด่านพิเศษ : การเคลื่อนที่แบบโพรเจกไทล์',
  projLesson: 'บทเรียน : การเคลื่อนที่แบบโพรเจกไทล์', end: 'สรุป' };
// Part names sent before the October 2026 rename, so older Feedback rows show the current name in the Summary.
const OLD_PART = { 'ด่านที่ 1': 'ch1', 'พาร์ทสอน': 'lesson', 'ด่านแรงเสียดทาน': 'fric', 'พาร์ทสอน : แรงเสียดทาน': 'fricLesson',
  'ปรับมวลและ μ เอง': 'sandbox', 'ด่านแถม (โพรเจกไทล์)': 'bonus', 'พาร์ทสอน (แถม)': 'projLesson' };
const LEVELS = ['ch1', 'fric', 'sandbox', 'bonus'];
const NO_PASS = ['ch1'];   // on the ice the box never stops, so this level cannot be passed: only the pushes are counted
const QUIZZES = 4;

// How the tabs look. Every column is one of these kinds: width in px, alignment, wrapping, number format.
const INK = '#15181C', TEAL = '#3D7B74', PALE = '#F4F6F8', MUTED = '#8A93A0';
const GOOD = '#1E7B46', WARN = '#B26A00', BAD = '#C0392B';
const DATE_FMT = 'd mmm yyyy  hh:mm';
const KIND = {
  id:    { w: 110, align: 'left',   fmt: '@', color: MUTED },    // hidden: only the script needs these
  date:  { w: 140, align: 'left',   fmt: DATE_FMT },
  name:  { w: 150, align: 'left',   fmt: '@' },
  room:  { w: 80,  align: 'center', fmt: '@' },
  code:  { w: 110, align: 'left',   fmt: '@' },
  mark:  { w: 90,  align: 'center', fmt: '@' },
  tries: { w: 130, align: 'center', fmt: '@' },
  num:   { w: 90,  align: 'center' },
  mins:  { w: 130, align: 'center', fmt: '0.0' },
  label: { w: 240, align: 'left',   fmt: '@', wrap: true },
  text:  { w: 320, align: 'left',   fmt: '@', wrap: true },
  long:  { w: 360, align: 'left',   fmt: '@' }
};
const COL_KIND = { eid: 'id', sessionId: 'id', deviceId: 'id', ts: 'date', updatedAt: 'date', startedAt: 'date', enteredAt: 'date',
  name: 'name', room: 'room', entry: 'code', lastStep: 'code', furthest: 'code', section: 'code', quizId: 'code', device: 'code',
  picks: 'code', outcome: 'mark', change: 'mark', part: 'label', hardest: 'label', pick: 'label',
  wrongTags: 'text', question: 'text', comment: 'text', slowLines: 'long' };
const COL_WIDTH = { quizId: 170, device: 135, picks: 120, entry: 125 };
const kind_ = c => KIND[COL_KIND[c] || 'num'];
const fmts_ = cols => cols.map(c => kind_(c).fmt || 'General');
// Colour of TRUE and of FALSE in the yes/no columns; background and text of each outcome.
const BOOL_STYLE = { reachedEnd: [GOOD, MUTED], completed: [GOOD, MUTED], firstTryCorrect: [GOOD, BAD], typedExact: [TEAL, MUTED],
  partial: [WARN, MUTED], skipped: [WARN, MUTED] };
const OUTCOME_STYLE = { success: ['#E3F4EA', GOOD], short: ['#FFF1DC', WARN], long: ['#FFF1DC', WARN], gone: ['#FFF1DC', WARN],
  nomove: ['#FBE7E7', BAD], 'wrong-way': ['#FBE7E7', BAD], retried: ['#EEF0F3', MUTED] };
const TAB_ORDER = ['Summary', 'Sessions', 'Sections', 'Attempts', 'Quiz', 'Choices', 'Feedback', 'Setup'];

function doGet() {
  return json_({ ok: true, msg: 'Newton game collector is running' });
}

function doPost(e) {
  let events;
  try {
    events = JSON.parse(e.postData.contents).events;
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }
  if (!Array.isArray(events)) return json_({ ok: false, error: 'no events' });

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groups = {};
    events.slice(0, MAX_EVENTS).forEach(ev => {
      if (ev && TABS[ev.type] && ev.eid) (groups[ev.type] = groups[ev.type] || []).push(ev);
    });
    let saved = 0;
    Object.keys(groups).forEach(type => {
      const T = TABS[type], sh = sheet_(ss, T);
      saved += T.key ? upsert_(sh, T, groups[type]) : appendNew_(sh, T, groups[type]);
    });
    return json_({ ok: true, saved });
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(ss, T) {
  let sh = ss.getSheetByName(T.name);
  if (!sh) sh = ss.insertSheet(T.name);
  const fresh = sh.getLastRow() === 0;
  if (fresh) sh.appendRow(T.cols);
  // a column added later (always at the end): give the existing tab its heading
  else if (sh.getLastColumn() < T.cols.length) sh.getRange(1, 1, 1, T.cols.length).setValues([T.cols]);
  else return sh;
  try { styleTab_(sh, T.cols); } catch (err) { /* the look must never stop data from being saved */ }
  return sh;
}

// Rows are written with the column formats set first, so a class like "6/7" or a name like "007" stays the text
// the student typed instead of turning into a date or a number.
function write_(sh, row, cols, rows) {
  const last = row + rows.length - 1, max = sh.getMaxRows();
  if (last > max) sh.insertRowsAfter(max, last - max + 50);
  const f = fmts_(cols);
  sh.getRange(row, 1, rows.length, cols.length).setNumberFormats(rows.map(() => f)).setValues(rows);
}

// Strings from students (names, free text) must never be read as formulas.
function cell_(col, v) {
  if (v === null || v === undefined) return '';
  if (DATE_COLS.indexOf(col) >= 0 && typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d;
  }
  if (typeof v === 'string') {
    v = v.slice(0, 500);
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  return String(v).slice(0, 500);
}

// Events that may be resent (offline queue, page close): drop any eid already in the tab.
function appendNew_(sh, T, evs) {
  const n = sh.getLastRow() - 1;
  const seen = new Set(n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : []);
  const rows = [];
  evs.forEach(ev => {
    if (seen.has(ev.eid)) return;
    seen.add(ev.eid);
    rows.push(T.cols.map(c => cell_(c, ev[c])));
  });
  if (rows.length) write_(sh, sh.getLastRow() + 1, T.cols, rows);
  return rows.length;
}

// One row per session, kept up to date; an older update arriving late never overwrites a newer one.
function upsert_(sh, T, evs) {
  const n = sh.getLastRow() - 1;
  const keys = n > 0 ? sh.getRange(2, 1, n, 2).getValues() : [];
  const at = {};
  keys.forEach((r, i) => { at[String(r[0])] = { row: i + 2, t: r[1] instanceof Date ? r[1].getTime() : 0 }; });
  let count = 0;
  evs.slice().sort((a, b) => String(a.ts).localeCompare(String(b.ts))).forEach(ev => {
    const id = String(ev[T.key]), t = new Date(ev.ts).getTime() || 0;
    const row = T.cols.map(c => cell_(c, c === 'updatedAt' ? ev.ts : ev[c]));
    const hit = at[id];
    if (hit) {
      if (hit.t >= t) return;
      write_(sh, hit.row, T.cols, [row]);
      hit.t = t;
    } else {
      const r1 = sh.getLastRow() + 1;
      write_(sh, r1, T.cols, [row]);
      at[id] = { row: r1, t };
    }
    count++;
  });
  return count;
}

/* ---------------- Summary tab ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Newton')
    .addItem('สร้างสรุป (Build summary)', 'buildSummary')
    .addItem('จัดรูปแบบชีต (Format sheets)', 'formatSheets')
    .addItem('ใช้เวลาประเทศไทย (Thai time)', 'useThaiTime')
    .addToUi();
}

function rows_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getDataRange().getValues(), h = v.shift();
  return v.map(r => { const o = {}; h.forEach((k, i) => { o[k] = r[i]; }); return o; });
}
const byTime_ = (a, b) => new Date(a.ts || a.updatedAt) - new Date(b.ts || b.updatedAt);
const round1_ = x => Math.round(x * 10) / 10;

function buildSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sessions = rows_(ss, 'Sessions'), sections = rows_(ss, 'Sections'), attempts = rows_(ss, 'Attempts').sort(byTime_),
        quizzes = rows_(ss, 'Quiz').sort(byTime_), feedback = rows_(ss, 'Feedback').sort(byTime_);

  // A student = name + class (the same student may play on several devices).
  const people = {};
  const P = r => {
    const name = String(r.name || '').trim(), room = String(r.room || '').trim(), k = room + '|' + name;
    return people[k] = people[k] || { name, room, sessions: new Set(), last: null, finished: false, furthest: -1,
      sec: {}, quiz: {}, tags: new Set(), lv: {}, moves: 0, typed: 0, nAtt: 0, fb: null };
  };
  sessions.forEach(r => {
    const p = P(r);
    p.sessions.add(r.sessionId);
    if (r.reachedEnd === true) p.finished = true;
    p.furthest = Math.max(p.furthest, PARTS.indexOf(String(r.furthest)));
    if (r.updatedAt instanceof Date && (!p.last || r.updatedAt > p.last)) p.last = r.updatedAt;
  });
  sections.forEach(r => {
    const p = P(r);
    p.sec[r.section] = (p.sec[r.section] || 0) + Number(r.activeSec || 0);
    p.furthest = Math.max(p.furthest, PARTS.indexOf(r.section));
  });
  attempts.forEach(r => {
    const p = P(r), L = p.lv[r.section] = p.lv[r.section] || { n: 0, won: 0 };
    L.n++;
    if (r.outcome === 'success' && !L.won) L.won = L.n;          // tries up to the first success
    p.nAtt++; p.moves += Number(r.sliderMoves || 0); if (r.typedExact === true) p.typed++;
  });
  quizzes.forEach(r => {
    const p = P(r);
    if (!(r.quizId in p.quiz)) p.quiz[r.quizId] = r.firstTryCorrect === true;   // first time they answered it
    String(r.wrongTags || '').split(',').map(s => s.trim()).filter(Boolean).forEach(t => p.tags.add(t));
  });
  feedback.forEach(r => { if (r.skipped !== true) P(r).fb = r; });

  // The columns, in groups that each get their own heading colour: who, time, quizzes, tries, feedback.
  const col = (h, kind, w) => ({ h, kind, w });
  const groups = [
    { color: INK, cols: [col('ชั้น', 'room'), col('ชื่อ', 'name'), col('จำนวนครั้งที่เข้าเล่น', 'num'), col('เล่นล่าสุด', 'date'),
        col('ไปถึง', 'label'), col('จบเกม', 'mark')] },
    { color: TEAL, cols: [col('เวลารวม (นาที)', 'mins')].concat(PARTS.map(k => col('นาที: ' + PART_NAME[k], 'mins')))
        .concat([col('ใช้เวลามากที่สุด', 'label')]) },
    { color: '#6C3483', cols: [col('ควิซถูกตั้งแต่ครั้งแรก', 'mark', 110), col('ความเข้าใจผิดที่เจอ', 'text')] },
    { color: '#1F4E9C', cols: LEVELS.map(k => col('ครั้งที่ลอง: ' + PART_NAME[k], 'tries'))
        .concat([col('ขยับค่า/ครั้ง', 'num'), col('% พิมพ์ตัวเลขเอง', 'num'), col('วิธีหาคำตอบ (คร่าวๆ)', 'code', 180)]) },
    { color: '#8A4D00', cols: [col('ความยาก (1–5)', 'num'), col('ความสนุก (1–5)', 'num'), col('ส่วนที่ยากที่สุด', 'label'),
        col('ยังสงสัย', 'text'), col('คิดยังไงกับเกมนี้', 'text')] }
  ];
  const cols = [].concat.apply([], groups.map(g => g.cols)), head = cols.map(c => c.h);

  const list = Object.keys(people).map(k => people[k]).filter(p => p.name || p.room)
    .sort((a, b) => a.room.localeCompare(b.room) || a.name.localeCompare(b.name));
  const out = list.map(p => {
    const mins = PARTS.map(k => p.sec[k] ? round1_(p.sec[k] / 60) : '');
    const total = round1_(PARTS.reduce((s, k) => s + (p.sec[k] || 0), 0) / 60);
    const top = PARTS.filter(k => p.sec[k]).sort((a, b) => p.sec[b] - p.sec[a])[0];
    const qs = Object.keys(p.quiz);
    const avgMoves = p.nAtt ? round1_(p.moves / p.nAtt) : '';
    const typedPct = p.nAtt ? Math.round(100 * p.typed / p.nAtt) : '';
    const style = !p.nAtt ? '' : typedPct >= 50 ? 'พิมพ์ค่า (น่าจะคำนวณ)' : avgMoves >= 3 ? 'ลองผิดลองถูก' : 'ผสม';
    return [p.room, p.name, p.sessions.size, p.last || '', p.furthest >= 0 ? PART_NAME[PARTS[p.furthest]] : '',
      p.finished ? '✓' : '', total]
      .concat(mins)
      .concat([top ? PART_NAME[top] : '', qs.length ? qs.filter(q => p.quiz[q]).length + '/' + QUIZZES : '',
        Array.from(p.tags).join(', ')])
      .concat(LEVELS.map(k => {
        const L = p.lv[k];
        return !L ? '' : NO_PASS.indexOf(k) >= 0 ? String(L.n) : L.won ? String(L.won) : L.n + ' (ยังไม่ผ่าน)';
      }))
      .concat([avgMoves, typedPct, style, p.fb ? p.fb.difficulty : '', p.fb ? p.fb.enjoyment : '',
        p.fb ? (OLD_PART[p.fb.hardest] ? PART_NAME[OLD_PART[p.fb.hardest]] : p.fb.hardest) : '', p.fb ? p.fb.question : '',
        p.fb ? p.fb.comment || '' : '']);
  });

  // Class average of the minutes columns, to compare each student against.
  const firstMin = 6, nMin = 1 + PARTS.length;
  if (out.length) {
    const avg = head.map((_, i) => '');
    avg[1] = 'เฉลี่ยทั้งหมด';
    for (let c = firstMin; c < firstMin + nMin; c++) {
      const vals = out.map(r => r[c]).filter(v => v !== '');
      avg[c] = vals.length ? round1_(vals.reduce((s, v) => s + v, 0) / vals.length) : '';
    }
    out.push(avg);
  }

  let sh = ss.getSheetByName('Summary');
  if (!sh) sh = ss.insertSheet('Summary', 0);
  sh.clear();
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  if (out.length) {
    const f = cols.map(c => KIND[c.kind].fmt || 'General');      // set first, so "3/4" stays a score and not a date
    sh.getRange(2, 1, out.length, head.length).setNumberFormats(out.map(() => f)).setValues(out);
  }
  styleSummary_(sh, groups, cols, out.length, firstMin);
}

function styleSummary_(sh, groups, cols, nRows, firstMin) {      // nRows: the students plus the average row
  const n = cols.length, WRAP = SpreadsheetApp.WrapStrategy;
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  sh.setTabColor(TEAL);
  sh.getBandings().forEach(b => b.remove());
  // One heading colour per group. Painted after the banding, which would otherwise cover it.
  const paint = () => { let c = 1; groups.forEach(g => { sh.getRange(1, c, 1, g.cols.length).setBackground(g.color); c += g.cols.length; }); };
  sh.getRange(1, 1, 1, n).setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle').setWrapStrategy(WRAP.WRAP);
  cols.forEach((x, i) => sh.setColumnWidth(i + 1, x.w || KIND[x.kind].w));
  try { sh.autoResizeRows(1, 1); } catch (err) { sh.setRowHeight(1, 80); }
  if (!nRows) { paint(); sh.setConditionalFormatRules([]); return; }

  sh.getRange(1, 1, nRows + 1, n).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, true)
    .setHeaderRowColor(INK).setFirstRowColor('#FFFFFF').setSecondRowColor(PALE).setFooterRowColor('#E3E8EE');
  paint();
  cols.forEach((x, i) => {
    const k = KIND[x.kind];
    sh.getRange(2, i + 1, nRows, 1).setHorizontalAlignment(k.align).setVerticalAlignment('top')
      .setWrapStrategy(k.wrap ? WRAP.WRAP : WRAP.CLIP);
  });
  sh.getRange(nRows + 1, 1, 1, n).setFontWeight('bold');                       // the average row
  const students = nRows - 1 || 1, at = h => cols.map(x => x.h).indexOf(h) + 1, rule = () => SpreadsheetApp.newConditionalFormatRule();
  sh.getRange(2, at('จบเกม'), nRows, 1).setFontColor(GOOD).setFontWeight('bold');
  // Heat map on minutes per part: where each student spends the most time stands out.
  const rules = [rule().setGradientMinpoint('#FFFFFF').setGradientMaxpoint('#F4A259')
      .setRanges([sh.getRange(2, firstMin + 2, students, PARTS.length)]).build(),
    scale_([sh.getRange(2, at('ความยาก (1–5)'), students, 1)], '#F4A259'),
    scale_([sh.getRange(2, at('ความสนุก (1–5)'), students, 1)], '#7CC49A')];
  cols.forEach((x, i) => {
    if (x.kind === 'tries') rules.push(rule().whenTextContains('ยังไม่ผ่าน').setFontColor(BAD)
      .setRanges([sh.getRange(2, i + 1, students, 1)]).build());
  });
  sh.setConditionalFormatRules(rules);
}

/* ---------------- Look of the data tabs ---------------- */

// Menu: Newton → จัดรูปแบบชีต. Changes only how the tabs look, plus one repair: names and classes that Sheets had
// read as dates or numbers are put back as the text the student typed.
function formatSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(type => {
    const T = TABS[type], sh = ss.getSheetByName(T.name);
    if (!sh || sh.getLastRow() === 0) return;
    repairText_(sh, T.cols);
    styleTab_(sh, T.cols);
  });
  styleSetup_(ss.getSheetByName('Setup'));
  orderTabs_(ss);
}

function styleTab_(sh, cols) {
  const n = cols.length, max = sh.getMaxRows(), body = max - 1, WRAP = SpreadsheetApp.WrapStrategy;
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, n).setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle').setWrapStrategy(WRAP.WRAP);
  sh.setRowHeight(1, 34);
  cols.forEach((c, i) => {
    const k = kind_(c);
    sh.setColumnWidth(i + 1, Math.max(COL_WIDTH[c] || k.w, 34 + Math.ceil(c.length * 8.5)));   // room for the heading and its filter button
    if (COL_KIND[c] === 'id') sh.hideColumns(i + 1);
    if (body < 1) return;
    const r = sh.getRange(2, i + 1, body, 1);
    r.setHorizontalAlignment(k.align).setVerticalAlignment('top').setWrapStrategy(k.wrap ? WRAP.WRAP : WRAP.CLIP);
    if (k.fmt) r.setNumberFormat(k.fmt);
    if (k.color) r.setFontColor(k.color);
  });
  const keep = cols.indexOf('room') + 1;                 // date, name and class stay in view while scrolling sideways
  if (keep > 0) sh.setFrozenColumns(keep);
  sh.getBandings().forEach(b => b.remove());
  sh.getRange(1, 1, max, n).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(INK).setFirstRowColor('#FFFFFF').setSecondRowColor(PALE);
  if (!sh.getFilter()) sh.getRange(1, 1, max, n).createFilter();
  if (body > 0) rules_(sh, cols, body);
}

const a1_ = n => { let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
const scale_ = (ranges, color) => SpreadsheetApp.newConditionalFormatRule()
  .setGradientMinpointWithValue('#FFFFFF', SpreadsheetApp.InterpolationType.NUMBER, '1')
  .setGradientMaxpointWithValue(color, SpreadsheetApp.InterpolationType.NUMBER, '5').setRanges(ranges).build();

// Colour cues: yes/no columns, how each try ended, and the 1–5 answers.
function rules_(sh, cols, nRows) {
  const R = [], rule = () => SpreadsheetApp.newConditionalFormatRule();
  cols.forEach((c, i) => {
    const rng = [sh.getRange(2, i + 1, nRows, 1)], cell = a1_(i + 1) + '2';
    if (BOOL_STYLE[c]) {
      R.push(rule().whenFormulaSatisfied('=' + cell + '=TRUE').setFontColor(BOOL_STYLE[c][0]).setBold(true).setRanges(rng).build());
      R.push(rule().whenFormulaSatisfied('=AND(ISLOGICAL(' + cell + '),NOT(' + cell + '))').setFontColor(BOOL_STYLE[c][1])
        .setRanges(rng).build());
    }
    if (c === 'outcome') Object.keys(OUTCOME_STYLE).forEach(v => R.push(rule().whenTextEqualTo(v)
      .setBackground(OUTCOME_STYLE[v][0]).setFontColor(OUTCOME_STYLE[v][1]).setRanges(rng).build()));
    if (c === 'difficulty') R.push(scale_(rng, '#F4A259'));
    if (c === 'enjoyment') R.push(scale_(rng, '#7CC49A'));
  });
  sh.setConditionalFormatRules(R);
}

// Rows saved before the columns were plain text: a class typed as "6/7" became 7 June and "007" became 7.
// What the cell shows is still what was typed, so that is written back as text. Returns how many cells changed.
function repairText_(sh, cols) {
  const n = sh.getLastRow() - 1;
  let fixed = 0;
  if (n < 1) return fixed;
  ['name', 'room'].forEach(c => {
    const i = cols.indexOf(c);
    if (i < 0) return;
    const rng = sh.getRange(2, i + 1, n, 1), vals = rng.getValues(), shown = rng.getDisplayValues();
    rng.setNumberFormat('@');
    vals.forEach((v, r) => {
      if (!(v[0] instanceof Date) && typeof v[0] !== 'number') return;
      sh.getRange(r + 2, i + 1).setValue(shown[r][0]);
      fixed++;
    });
  });
  return fixed;
}

// The instructions tab: one readable column, headings in bold.
function styleSetup_(sh) {
  if (!sh || sh.getLastRow() < 1) return;
  const rng = sh.getRange(1, 1, sh.getLastRow(), 1), v = rng.getValues();
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 980);
  rng.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setVerticalAlignment('top').setFontColor(INK).setFontWeight('normal').setFontSize(11);
  v.forEach((r, i) => { if (/:\s*$/.test(String(r[0]))) sh.getRange(i + 1, 1).setFontWeight('bold'); });
  sh.getRange(1, 1).setFontSize(16).setFontWeight('bold').setFontColor(TEAL);
}

// Summary first, then the data in the order a play-through produces it.
function orderTabs_(ss) {
  const shown = ss.getActiveSheet();
  let pos = 0;
  TAB_ORDER.forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(++pos);
    sh.setTabColor(name === 'Summary' ? TEAL : name === 'Setup' ? null : MUTED);
  });
  ss.setActiveSheet(shown);
}

/* ---------------- Time zone ---------------- */

// A sheet shows times in its own time zone (File → Settings), and a cell holds only the clock time, not the moment.
// A sheet created on another time zone therefore shows every time shifted. Menu: Newton → ใช้เวลาประเทศไทย switches
// the sheet to Thai time and rewrites the saved times, so each one still means the same moment.
// Running it again does nothing. Build the summary again afterwards.
const THAI_TZ = 'Asia/Bangkok';
const clock_ = (d, tz) => Utilities.formatDate(d, tz, 'd|yyyy|HH:mm');
const shownClock_ = s => { const m = String(s).match(/^(\d{1,2}) \S+ (\d{4})\s+(\d{2}):(\d{2})$/); return m ? m[1] + '|' + m[2] + '|' + m[3] + ':' + m[4] : String(s); };
// The number a cell holds for a moment shown in a time zone: days since 30 Dec 1899 on that zone's clock.
function serial_(d, tz) {
  const z = Utilities.formatDate(d, tz, 'Z'), off = (z[0] === '-' ? -1 : 1) * (Number(z.slice(1, 3)) * 60 + Number(z.slice(3, 5)));
  return (d.getTime() + off * 60000) / 86400000 + 25569;
}
function say_(ss, msg) {
  Logger.log(msg);
  try { ss.toast(msg, 'Newton', 10); } catch (err) { /* no window to show it in */ }
  return msg;
}

function useThaiTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), old = ss.getSpreadsheetTimeZone();
  if (old === THAI_TZ) return say_(ss, 'ชีตนี้ใช้เวลาประเทศไทยอยู่แล้ว ไม่มีอะไรต้องแก้');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);                     // no answers are saved while the times are being rewritten
  try {
    // 1. Read every saved time as a moment while the sheet is still on its old time zone, and make sure the
    //    moments agree with what the cells show. If they do not, stop before anything is changed.
    const jobs = [];
    Object.keys(TABS).forEach(type => {
      const T = TABS[type], sh = ss.getSheetByName(T.name), n = sh ? sh.getLastRow() - 1 : 0;
      if (n < 1) return;
      T.cols.forEach((c, i) => { if (DATE_COLS.indexOf(c) >= 0) jobs.push({ tab: T.name, col: c, rng: sh.getRange(2, i + 1, n, 1) }); });
    });
    jobs.forEach(j => j.rng.setNumberFormat(DATE_FMT));
    SpreadsheetApp.flush();
    let times = 0;
    jobs.forEach(j => {
      j.vals = j.rng.getValues();
      const shown = j.rng.getDisplayValues();
      j.vals.forEach((v, r) => {
        if (!(v[0] instanceof Date)) return;
        times++;
        if (clock_(v[0], old) !== shownClock_(shown[r][0])) throw new Error('หยุดก่อนแก้ไข: เวลาใน ' + j.tab + '!' + j.col +
          ' แถว ' + (r + 2) + ' อ่านได้ ' + clock_(v[0], old) + ' แต่ชีตแสดง ' + shown[r][0] + ' (ยังไม่มีอะไรถูกเปลี่ยน)');
      });
    });

    // 2. Switch the sheet, then write each moment back as the number for its Thai clock time.
    ss.setSpreadsheetTimeZone(THAI_TZ);
    SpreadsheetApp.flush();
    jobs.forEach(j => j.rng.setValues(j.vals.map(v => [v[0] instanceof Date ? serial_(v[0], THAI_TZ) : v[0]])));
    SpreadsheetApp.flush();

    // 3. Check what the cells show now.
    let wrong = 0;
    jobs.forEach(j => {
      const shown = j.rng.getDisplayValues();
      j.vals.forEach((v, r) => { if (v[0] instanceof Date && clock_(v[0], THAI_TZ) !== shownClock_(shown[r][0])) wrong++; });
    });
    if (wrong) throw new Error('เปลี่ยนเป็นเวลาไทยแล้ว แต่มี ' + wrong + ' ช่องที่เวลาไม่ตรง ใช้ File → Version history เพื่อย้อนกลับได้');
    return say_(ss, 'เปลี่ยนจาก ' + old + ' เป็นเวลาประเทศไทยแล้ว แก้เวลา ' + times + ' ช่อง กรุณากด "สร้างสรุป" อีกครั้ง');
  } finally {
    lock.releaseLock();
  }
}

// Run from the editor after changing this file: writes sample rows to two scratch tabs, checks them, removes the tabs.
function selfTest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), names = ['selftest_rows', 'selftest_sessions'];
  const drop = () => names.forEach(nm => { const s = ss.getSheetByName(nm); if (s) ss.deleteSheet(s); });
  const check = (label, got, want) => { if (got !== want) throw new Error(label + ': got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want)); };
  drop();
  try {
    const F = { name: names[0], cols: TABS.feedback.cols }, S = { name: names[1], key: 'sessionId', cols: TABS.session.cols };
    const ev = (eid, o) => Object.assign({ eid, ts: '2026-10-10T10:00:00.000Z', sessionId: 's-' + eid, name: 'ทดสอบ', room: 'ม.4/1' }, o);
    const fb = sheet_(ss, F);
    check('saved', appendNew_(fb, F, [ev('a', { room: '6/7', name: '007', difficulty: 3, enjoyment: 5, question: '=1+1', comment: '3/4', skipped: false }),
      ev('b', { skipped: true })]), 2);
    check('resend ignored', appendNew_(fb, F, [ev('a', {})]), 0);
    const v = fb.getDataRange().getValues(), at = c => F.cols.indexOf(c);
    check('rows', v.length, 3);
    check('class stays text', v[1][at('room')], '6/7');
    check('name stays text', v[1][at('name')], '007');
    check('comment stays text', v[1][at('comment')], '3/4');
    check('no formula', fb.getRange(2, at('question') + 1).getFormula(), '');
    check('number', v[1][at('difficulty')], 3);
    check('date', v[1][at('ts')] instanceof Date, true);
    check('same moment read back', v[1][at('ts')].getTime(), new Date('2026-10-10T10:00:00.000Z').getTime());
    check('time shown on the sheet\'s clock', shownClock_(fb.getRange(2, at('ts') + 1).getDisplayValue()),
      clock_(new Date('2026-10-10T10:00:00.000Z'), ss.getSpreadsheetTimeZone()));
    check('yes/no', v[2][at('skipped')], true);
    const se = sheet_(ss, S), one = o => Object.assign({ type: 'session', sessionId: 'S1', name: 'ทดสอบ', room: '1/2', runs: 1 }, o);
    check('new session', upsert_(se, S, [one({ ts: '2026-10-10T10:00:00.000Z', lastStep: 'ch1' })]), 1);
    check('update', upsert_(se, S, [one({ ts: '2026-10-10T10:05:00.000Z', lastStep: 'fric' })]), 1);
    check('late update ignored', upsert_(se, S, [one({ ts: '2026-10-10T10:01:00.000Z', lastStep: 'lesson' })]), 0);
    const w = se.getDataRange().getValues();
    check('one row per session', w.length, 2);
    check('newest kept', w[1][S.cols.indexOf('lastStep')], 'fric');
    check('session class stays text', w[1][S.cols.indexOf('room')], '1/2');
    styleTab_(fb, F.cols);
    styleTab_(se, S.cols);
    check('still 3 rows after styling', fb.getLastRow(), 3);
    Logger.log('selfTest: all checks passed');
    return 'ok';
  } finally {
    drop();
  }
}
