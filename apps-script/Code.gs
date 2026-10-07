/**
 * Collects student data from the Newton motion game into this Google Sheet.
 *
 * Setup (details in README.md, "Collecting student data"):
 *   1. In the Google Sheet: Extensions → Apps Script, paste this whole file, Save.
 *   2. Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone → Deploy.
 *   3. Copy the web-app URL into LOG_URL near the top of the <script> in index.html.
 * Then use the "Newton" menu in the sheet → "สร้างสรุป" to rebuild the Summary tab.
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
              cols: ['eid', 'ts', 'name', 'room', 'sessionId', 'difficulty', 'enjoyment', 'hardest', 'question', 'skipped'] }
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
const QUIZZES = 4;

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
  if (sh.getLastRow() === 0) {
    sh.appendRow(T.cols);
    sh.getRange(1, 1, 1, T.cols.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
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
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, T.cols.length).setValues(rows);
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
      sh.getRange(hit.row, 1, 1, row.length).setValues([row]);
      hit.t = t;
    } else {
      sh.appendRow(row);
      at[id] = { row: sh.getLastRow(), t };
    }
    count++;
  });
  return count;
}

/* ---------------- Summary tab ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Newton')
    .addItem('สร้างสรุป (Build summary)', 'buildSummary')
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

  const head = ['ชั้น', 'ชื่อ', 'จำนวนครั้งที่เข้าเล่น', 'เล่นล่าสุด', 'ไปถึง', 'จบเกม', 'เวลารวม (นาที)']
    .concat(PARTS.map(k => 'นาที: ' + PART_NAME[k]))
    .concat(['ใช้เวลามากที่สุด', 'ควิซถูกตั้งแต่ครั้งแรก', 'ความเข้าใจผิดที่เจอ'])
    .concat(LEVELS.map(k => 'ครั้งที่ลอง: ' + PART_NAME[k]))
    .concat(['ขยับค่า/ครั้ง', '% พิมพ์ตัวเลขเอง', 'วิธีหาคำตอบ (คร่าวๆ)', 'ความยาก (1–5)', 'ความสนุก (1–5)', 'ส่วนที่ยากที่สุด', 'ยังสงสัย']);

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
      .concat(LEVELS.map(k => { const L = p.lv[k]; return !L ? '' : L.won ? String(L.won) : L.n + ' (ยังไม่ผ่าน)'; }))
      .concat([avgMoves, typedPct, style, p.fb ? p.fb.difficulty : '', p.fb ? p.fb.enjoyment : '',
        p.fb ? (OLD_PART[p.fb.hardest] ? PART_NAME[OLD_PART[p.fb.hardest]] : p.fb.hardest) : '', p.fb ? p.fb.question : '']);
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
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setWrap(true);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  if (out.length) {
    sh.getRange(2, 1, out.length, head.length).setValues(out);
    sh.getRange(out.length + 1, 1, 1, head.length).setFontWeight('bold');
    // Heat map on minutes per part: where each student spends the most time stands out.
    const range = sh.getRange(2, firstMin + 2, out.length - 1 || 1, PARTS.length);
    sh.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
      .setGradientMinpoint('#FFFFFF').setGradientMaxpoint('#F4A259').setRanges([range]).build()]);
  }
}
