/* app.js — 프랑스 혁명 타임라인 (화면·상태·제출). 학생 화면 문구의 콘텐츠는 data.js */

const CONFIG = {
  SHEET_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbyXSjCfWY_HiZFqW_OBR-FQDoIfF1z_STqyKWUI31MacHeY3u7hbirFSFDvW-5yuUHaJQ/exec',
  GAME_NAME: '프랑스혁명_타임라인', // 임시값 — 포털 차시 id가 정해지면 교체(핸드오프 10-1)
  STORE_KEY: 'frrev26:state',
  PADLET_URL: '' // 수업 패들렛 주소. 비워 두면 버튼이 숨는다. 포털에서 ?padlet=주소 로 넘겨도 된다(padlet.com만 허용)
};

const UI = {
  stepNames: ['시작 질문', '역할', '장면 1', '장면 2', '장면 3', '장면 4', '장면 5', '장면 6', '돌아보기', '일기 쓰기'],
  introTitle: '프랑스 혁명 타임라인',
  idTitle: '누구의 기록인지 알려 줘요',
  sidLabel: '학번 (5자리)',
  nameLabel: '이름',
  needSid: '학번 5자리를 숫자로 적어 주세요',
  needName: '이름을 적어 주세요',
  introAnswerLabel: '내 생각 쓰기 (비어 있어도 시작할 수 있어요)',
  introCommoner: '평민 대표 입장',
  introNoble: '성직자·귀족 대표 입장',
  roleTitle: '역할을 골라요',
  roleDesc: '셋 다 제3 신분(평민)이에요. 고른 역할의 눈으로 장면을 따라가요.',
  needRole: '역할을 골라 주세요',
  clauseCount: '조항을 1개나 2개 골라 주세요',
  clauseMax: '2개까지만 고를 수 있어요',
  clauseTitle: '인권 선언 조항',
  stepClause: '장면 3-1',
  stepChoice: '장면 3-2',
  start: '시작하기', next: '다음', prev: '이전', toFinale: '돌아보기로', toWrite: '일기 쓰기로',
  recapTitle: '내가 따라온 혁명',
  firstThought: '처음 생각',
  rereadScene: '그 장면 다시 읽기',
  chosen: '내 선택',
  reasonWord: '이유',
  clauseRecap: '고른 조항',
  legend: '선택 표시',
  timelineTitle: '혁명의 흐름',
  copy: '내 글 복사하기', copied: '복사했어요', copyFail: '복사하지 못했어요. 글을 직접 선택해서 복사해 주세요',
  padletOpen: '패들렛 열기', padletNoUrl: '복사했어요. 포털의 "내 패들렛 열기"로 가서 붙여넣어 주세요.', padletCopied: '복사했어요. 패들렛에 붙여넣어 주세요',
  outTitle: '패들렛에 올리기', outLead: '복사한 글을 패들렛에 붙여넣어 올려요.',
  writeTitle: '일기 쓰기', writeLead: '장면을 고르고, 그날 내 역할이 되어 일기를 한 편 써요.',
  needAllDiary: '장면을 고르고 일기를 쓰면 복사하고 기록할 수 있어요',
  submit: '기록하기', submitAgain: '다시 기록하기', submitting: '기록하는 중', submitted: '기록했어요',
  submitFail: '기록하지 못했어요. 다시 시도해 주세요', submitPreview: '미리보기에서는 저장하지 않아요',
  restart: '처음부터 다시하기',
  restartTitle: '처음부터 다시 할까요?', restartBody: '쓴 내용이 모두 지워져요.', cancel: '취소', erase: '지우기',
  roleLabel: '내 역할'
};

const SCENE_STEPS = ['s1', 's2', 's3a', 's3b', 's4', 's5', 's6'];
const STEPS = ['intro', 'role'].concat(SCENE_STEPS, ['recap', 'write']);
const params = new URLSearchParams(location.search);
const PREVIEW = params.get('preview') === '1';

let state = freshState('', '');
let startedGuard = false;

/* ───────── 저장소 (막혀도 앱은 동작) ───────── */
function storeGet() { try { const r = localStorage.getItem(CONFIG.STORE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function storeSet() { try { localStorage.setItem(CONFIG.STORE_KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ } }
function storeDel() { try { localStorage.removeItem(CONFIG.STORE_KEY); } catch (e) { /* 무시 */ } }

function freshState(sid, name) {
  return { sid: sid, name: name, introA: '', introB: '', role: '', step: 'intro', answers: {}, clauses: [], clauseReason: '',
    diary: { scenes: [], text: '' }, order: {}, submitted: false };
}

/* ───────── DOM 도우미 ───────── */
function h(tag, props, kids) {
  const el = document.createElement(tag);
  Object.keys(props || {}).forEach(function (k) {
    const v = props[k];
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  });
  [].concat(kids || []).forEach(function (c) {
    if (c === null || c === undefined || c === false) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}
function svg(path, size) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 16 16'); s.setAttribute('width', size || 16); s.setAttribute('height', size || 16);
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2');
  s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path); s.appendChild(p);
  return s;
}
const ICON = { check: 'M3 8.5l3.2 3.2L13 4.8', chev: 'M6 3.5l4.5 4.5L6 12.5', info: 'M8 7v4.5M8 4.6v.1' };

let toastTimer = 0;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
}

function oneLine(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function sceneById(id) { return SCENES.filter(function (s) { return s.id === id; })[0]; }
function roleObj() { return ROLES.filter(function (r) { return r.id === state.role; })[0] || null; }
function optText(scene, id) { const o = scene.options.filter(function (x) { return x.id === id; })[0]; return o ? o.text : ''; }
/* 선택지 순서: 장면마다 한 번 섞어 저장한다(이전·다음, 새로고침에도 그대로). 화면 글자(A·B·C)는 자리 순서로 붙이고, 저장은 원래 id로 한다 */
const LETTERS = ['A', 'B', 'C', 'D'];
function optionOrder(scene) {
  if (!state.order) state.order = {};
  let ord = state.order[scene.id];
  const ids = scene.options.map(function (o) { return o.id; });
  if (!ord || ord.length !== ids.length || ids.some(function (id) { return ord.indexOf(id) < 0; })) {
    const done = state.answers[scene.id] && state.answers[scene.id].opt;
    ord = ids.slice();
    if (!done) for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = ord[i]; ord[i] = ord[j]; ord[j] = t; }
    state.order[scene.id] = ord; storeSet();
  }
  return ord;
}
function dispLetter(scene, id) { return LETTERS[optionOrder(scene).indexOf(id)] || id; }
function ans(id) { return state.answers[id] || (state.answers[id] = { opt: '', reason: '' }); }

/* ───────── 공통 컴포넌트 ───────── */
function errorEl(id) { return h('p', { class: 'field-error', id: id, role: 'alert', hidden: true }); }
function showError(el, msg, focusEl) {
  el.textContent = msg; el.hidden = false;
  if (focusEl) { focusEl.setAttribute('aria-invalid', 'true'); focusEl.focus(); }
}
function clearError(el, field) { el.hidden = true; if (field) field.removeAttribute('aria-invalid'); }

let uid = 0;
/* 선택지 하나: 입력창이 칸 전체를 덮어서 어디를 눌러도 선택된다(낱말 풀이 버튼만 위로 올림) */
function choiceEl(kind, name, value, label, sub, checked, onChange) {
  const id = 'c' + (++uid);
  const input = h('input', { type: kind, name: name, value: value, id: id, 'aria-labelledby': id + 't', checked: checked });
  input.addEventListener('change', function () { onChange(input); });
  const text = h('span', { class: 'name', id: id + 't' }, label);
  const body = h('span', { class: 'body' }, [text, sub ? h('span', { class: 'sub', text: sub }) : null]);
  return h('div', { class: 'choice' + (kind === 'checkbox' ? ' is-check' : '') }, [input, h('span', { class: 'mark' }, svg(ICON.check)), body]);
}
/* 역할 초상(장식): 파일이 없으면 조용히 숨는다. 이름은 옆 글자에 이미 있으므로 alt는 비운다 */
function portraitEl(role, cls) {
  if (!role || !role.portrait) return null;
  const img = h('img', { class: cls, src: role.portrait, alt: '', loading: 'lazy', width: 80, height: 80 });
  img.addEventListener('error', function () { img.hidden = true; });
  return img;
}
function choiceLabel(idText, text) {
  return h('span', {}, [h('span', { class: 'id', text: idText }), text]);
}

function hintBox(text) {
  return h('details', {}, [
    h('summary', {}, [svg(ICON.chev), COMMON_TEXT.hintToggle]),
    h('div', { class: 'details-body' }, h('p', { text: text }))
  ]);
}

function textareaField(value, onInput, labelText, rows) {
  const ta = h('textarea', { class: 'textarea', rows: rows || 3, 'aria-label': labelText, placeholder: '' });
  ta.value = value || '';
  ta.addEventListener('input', function () { onInput(ta.value); });
  return ta;
}

/* ───────── 상단 단계 막대 ───────── */
function barIndex(step) {
  if (step === 'intro') return 0;
  if (step === 'role') return 1;
  if (step === 'recap') return 8;
  if (step === 'write') return 9;
  if (step === 's3a' || step === 's3b') return 4;
  return 1 + Number(step.slice(1));
}
function renderBar() {
  const idx = barIndex(state.step);
  const bar = document.getElementById('stepBar');
  bar.textContent = '';
  UI.stepNames.forEach(function (n, i) {
    bar.appendChild(h('li', { text: n, 'data-state': i < idx ? 'done' : '', 'aria-current': i === idx ? 'step' : null }));
  });
  document.getElementById('progressFill').style.width = Math.round(idx / (UI.stepNames.length - 1) * 100) + '%';
  const isScene = idx >= 2 && idx <= 7;
  document.getElementById('progressText').textContent = isScene ? '장면 ' + (idx - 1) + '/6' : '';
  const cur = bar.querySelector('[aria-current]');
  if (cur && cur.scrollIntoView) { try { bar.scrollLeft = Math.max(0, cur.offsetLeft - 16); } catch (e) { /* 무시 */ } }
}

/* ───────── 이동 ───────── */
function go(step, keepScroll) {
  state.step = step; storeSet();
  render();
  if (!keepScroll) window.scrollTo(0, 0);
  const head = document.querySelector('#screen h1, #screen h2');
  if (head) { head.setAttribute('tabindex', '-1'); head.focus({ preventScroll: true }); }
}
function stepNeighbor(delta) { return STEPS[STEPS.indexOf(state.step) + delta]; }

function navRow(opts) {
  const kids = [];
  if (opts.prev) kids.push(h('button', { type: 'button', class: 'btn', onclick: opts.prev }, [UI.prev]));
  kids.push(h('button', { type: 'button', class: 'btn btn-primary', onclick: opts.next }, [opts.nextLabel, svg(ICON.chev)]));
  return h('div', { class: 'nav-row' }, kids);
}
function prevHandler() { return function () { go(stepNeighbor(-1)); }; }
function afterScene() { go(stepNeighbor(1)); }

/* ───────── 화면: 시작 ───────── */
function renderIntro(root) {
  const sidInput = h('input', { class: 'input', id: 'sid', inputmode: 'numeric', maxlength: 5, autocomplete: 'off', 'aria-describedby': 'sidErr' });
  sidInput.value = state.sid;
  const nameInput = h('input', { class: 'input', id: 'sname', autocomplete: 'off', 'aria-describedby': 'nameErr' });
  nameInput.value = state.name;
  const sidErr = errorEl('sidErr'), nameErr = errorEl('nameErr');
  sidInput.addEventListener('input', function () { state.sid = sidInput.value.replace(/\D/g, '').slice(0, 5); sidInput.value = state.sid; clearError(sidErr, sidInput); storeSet(); });
  nameInput.addEventListener('input', function () { state.name = nameInput.value; clearError(nameErr, nameInput); storeSet(); });

  const taA = textareaField(state.introA, function (v) { state.introA = v; storeSet(); }, UI.introCommoner);
  taA.id = 'introA';
  const taB = textareaField(state.introB, function (v) { state.introB = v; storeSet(); }, UI.introNoble);
  taB.id = 'introB';

  root.appendChild(h('section', { class: 'card' }, [
    h('h1', { text: UI.introTitle }),
    h('div', { class: 'callout' }, [svg(ICON.info, 20), h('p', { text: INTRO.notice })]),
    h('p', { text: INTRO.facts })
  ]));
  root.appendChild(h('section', { class: 'card' }, [
    h('h2', { text: UI.firstThought }),
    h('p', { text: INTRO.question }),
    h('p', { class: 'muted', text: UI.introAnswerLabel }),
    h('div', { class: 'field' }, [h('label', { class: 'field-label', for: 'introA', text: UI.introCommoner }), taA]),
    h('div', { class: 'field' }, [h('label', { class: 'field-label', for: 'introB', text: UI.introNoble }), taB])
  ]));
  root.appendChild(h('section', { class: 'card' }, [
    h('h2', { text: UI.idTitle }),
    h('div', { class: 'id-grid' }, [
      h('div', { class: 'field' }, [h('label', { class: 'field-label', for: 'sid', text: UI.sidLabel }), sidInput, sidErr]),
      h('div', { class: 'field' }, [h('label', { class: 'field-label', for: 'sname', text: UI.nameLabel }), nameInput, nameErr])
    ])
  ]));
  root.appendChild(navRow({
    nextLabel: UI.start,
    next: function () {
      if (!/^\d{5}$/.test(state.sid)) { showError(sidErr, UI.needSid, sidInput); return; }
      if (!state.name.trim()) { showError(nameErr, UI.needName, nameInput); return; }
      startGuard();
      go('role');
    }
  }));
}

/* ───────── 화면: 역할 ───────── */
function renderRole(root) {
  const err = errorEl('roleErr');
  const fs = h('fieldset', { class: 'choices' }, [h('legend', { class: 'sr-only', text: UI.roleTitle })]);
  ROLES.forEach(function (r) {
    const ce = choiceEl('radio', 'role', r.id, h('span', { class: 'id', text: r.name }), r.desc, state.role === r.id, function () {
      state.role = r.id; storeSet(); clearError(err);
    });
    const pt = portraitEl(r, 'portrait');
    if (pt) ce.insertBefore(pt, ce.querySelector('.body'));
    fs.appendChild(ce);
  });
  root.appendChild(h('section', { class: 'card' }, [h('h1', { text: UI.roleTitle }), h('p', { class: 'muted', text: UI.roleDesc }), fs, err]));
  root.appendChild(navRow({
    prev: prevHandler(), nextLabel: UI.next,
    next: function () { if (!state.role) { showError(err, UI.needRole, fs.querySelector('input')); return; } go('s1'); }
  }));
}

/* ───────── 화면: 장면 ───────── */
function sceneCard(scene, titleTag) {
  const role = roleObj();
  const kids = [
    h('div', { class: 'card-title' }, [h('span', { class: 'date-chip', text: scene.date }), h(titleTag || 'h2', { text: scene.title })])
  ];
  if (scene.image && scene.image.src) {
    const img = h('img', { src: scene.image.src, alt: scene.image.alt, loading: 'lazy' });
    const fig = h('figure', { class: 'scene-figure' }, img);
    img.addEventListener('error', function () { fig.hidden = true; });
    kids.push(fig);
  }
  kids.push(h('p', { text: scene.common }));
  kids.push(h('div', { class: 'situation' }, [
    h('p', { class: 'role-tag', text: UI.roleLabel + ' · ' + (role ? role.name : '') }),
    h('p', { text: scene.situation[state.role] || '' })
  ]));
  return h('section', { class: 'card' }, kids);
}

function renderScene(root, scene, isSub) {
  const a = ans(scene.id);
  const choiceErr = errorEl('choiceErr'), reasonErr = errorEl('reasonErr');
  const fs = h('fieldset', { class: 'choices' }, [h('legend', { text: COMMON_TEXT.question })]);
  optionOrder(scene).forEach(function (oid, pos) {
    const o = scene.options.filter(function (x) { return x.id === oid; })[0];
    fs.appendChild(choiceEl('radio', 'opt', o.id, choiceLabel(LETTERS[pos] + '.', o.text), '', a.opt === o.id, function () {
      a.opt = o.id; storeSet(); clearError(choiceErr);
    }));
  });
  const ta = textareaField(a.reason, function (v) { a.reason = v; storeSet(); clearError(reasonErr, ta); },
    scene.reasonRequired ? COMMON_TEXT.reasonRequired : COMMON_TEXT.reasonOptional);
  ta.setAttribute('aria-describedby', 'reasonErr');

  root.appendChild(sceneCard(scene));
  const q = [fs, choiceErr];
  if (scene.reasonRequired) {
    q.push(h('div', { class: 'field' }, [h('p', { class: 'field-label', text: COMMON_TEXT.reasonRequired }), ta, reasonErr]));
  } else {
    q.push(h('details', { open: a.reason ? true : null }, [
      h('summary', {}, [svg(ICON.chev), COMMON_TEXT.reasonOptional]),
      h('div', { class: 'details-body' }, [ta])
    ]));
  }
  if (scene.extraThink) q.push(h('p', { class: 'muted', text: scene.extraThink }));
  q.push(hintBox(scene.hint));
  root.appendChild(h('section', { class: 'card' }, q));

  const nextLabel = scene.id === 6 ? UI.toFinale : UI.next;
  root.appendChild(navRow({
    prev: prevHandler(), nextLabel: nextLabel,
    next: function () {
      if (!a.opt) { showError(choiceErr, COMMON_TEXT.needChoice, fs.querySelector('input')); return; }
      if (scene.reasonRequired && !a.reason.trim()) { showError(reasonErr, COMMON_TEXT.needReason, ta); return; }
      afterScene();
    }
  }));
}

/* 장면 3-1: 조항 2개 + 이유 */
function renderClauses(root) {
  const scene = sceneById(3);
  const err = errorEl('clauseErr'), reasonErr = errorEl('reasonErr');
  const fs = h('fieldset', { class: 'choices' }, [h('legend', { text: scene.clausePrompt }), h('p', { class: 'muted', text: scene.clauseNote })]);
  CLAUSES.forEach(function (c) {
    fs.appendChild(choiceEl('checkbox', 'clause', c.id, choiceLabel(c.id, ' ' + c.text), '', state.clauses.indexOf(c.id) >= 0, function (input) {
      if (input.checked) {
        if (state.clauses.length >= 2) { input.checked = false; toast(UI.clauseMax); return; }
        state.clauses.push(c.id);
      } else {
        state.clauses = state.clauses.filter(function (x) { return x !== c.id; });
      }
      storeSet(); clearError(err);
    }));
  });
  const ta = textareaField(state.clauseReason, function (v) { state.clauseReason = v; storeSet(); clearError(reasonErr, ta); }, scene.clauseReasonLabel);
  ta.setAttribute('aria-describedby', 'reasonErr');

  root.appendChild(sceneCard(scene));
  root.appendChild(h('section', { class: 'card' }, [
    fs, err,
    h('div', { class: 'field' }, [h('p', { class: 'field-label', text: scene.clauseReasonLabel }), ta, reasonErr]),
    hintBox(scene.clauseHint)
  ]));
  root.appendChild(navRow({
    prev: prevHandler(), nextLabel: UI.next,
    next: function () {
      if (state.clauses.length < 1) { showError(err, UI.clauseCount, fs.querySelector('input')); return; }
      if (!state.clauseReason.trim()) { showError(reasonErr, COMMON_TEXT.needReason, ta); return; }
      go('s3b');
    }
  }));
}

/* ───────── 화면: 마무리 ───────── */
function typeLine() {
  const tr = typeResult();
  const counts = Object.keys(TAG_LABEL).map(function (k) { return TAG_LABEL[k] + ' ' + tr.counts[k]; }).join(' · ');
  return '[내 유형] ' + TYPES[tr.key].name + ' (' + counts + ')';
}
function diarySceneIds() { return (state.diary.scenes || []).map(Number).sort(function (x, y) { return x - y; }); }
function diaryDone() { return diarySceneIds().length >= 1 && !!String(state.diary.text || '').trim(); }
function diaryEntries() {
  const ids = diarySceneIds();
  if (!ids.length) return [];
  const dates = ids.map(function (id) { return sceneById(id).date; });
  return ['[일기] 장면 ' + ids.join(', ') + ' (' + dates.join(', ') + ') / ' + oneLine(state.diary.text)];
}
function diaryLine() { return diaryEntries().join('\n') + '\n' + typeLine(); }
function buildCopyText() {
  const role = roleObj();
  const lines = [];
  lines.push('[역할] ' + (role ? role.name : ''));
  const ia = oneLine(state.introA), ib = oneLine(state.introB);
  if (ia || ib) lines.push('[처음 생각] ' + [ia ? UI.introCommoner.replace(' 입장', '') + ': ' + ia : '', ib ? UI.introNoble.replace(' 입장', '') + ': ' + ib : ''].filter(Boolean).join(' / '));
  SCENES.forEach(function (s) {
    const a = state.answers[s.id];
    if (!a || !a.opt) return;
    let line = '[장면 ' + s.id + '] 선택: ' + dispLetter(s, a.opt) + '. ' + optText(s, a.opt);
    if (oneLine(a.reason)) line += ' / 이유: ' + oneLine(a.reason);
    lines.push(line);
  });
  const cl = CLAUSES.filter(function (c) { return state.clauses.indexOf(c.id) >= 0; }).map(function (c) { return c.id; });
  lines.push('[고른 조항] ' + cl.join(', ') + ' / 이유: ' + oneLine(state.clauseReason));
  lines.push(typeLine());
  diaryEntries().forEach(function (l) { lines.push(l); });
  return lines.join('\n');
}
function copyText(text, okMsg, onOk) {
  const fallback = function () {
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;left:-9999px;top:0' });
    ta.value = text; document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? (okMsg || UI.copied) : UI.copyFail);
    if (ok && onOk) onOk();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast(okMsg || UI.copied); if (onOk) onOk(); }, fallback);
  } else fallback();
}

async function submitRecord(btn) {
  if (PREVIEW) { toast(UI.submitPreview); return; }
  const role = roleObj(), tr = typeResult();
  const cl = state.clauses.slice().sort(function (a, b) { return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10); });
  const body = {
    studentId: state.sid, studentName: state.name, gameName: CONFIG.GAME_NAME,
    choiceSummary: (role ? role.name : '') + ' / 조항 ' + cl.join(', ') + ' / ' + TYPES[tr.key].name,
    diffSummary: '',
    reflection: diaryLine(),
    // 주의: 백엔드 칭호 판정이 choicesJson.role 을 읽으므로 역할 키 이름은 persona 로 쓴다
    choicesJson: JSON.stringify({ persona: state.role, intro: { commoner: state.introA, noble: state.introB }, scenes: state.answers, clauses: cl, clauseReason: state.clauseReason, type: tr, diary: state.diary })
  };
  Object.assign(body, window.FocusGuard ? FocusGuard.payload() : {});
  btn.disabled = true; btn.textContent = UI.submitting;
  try {
    const res = await fetch(CONFIG.SHEET_WEBAPP_URL, { method: 'POST', body: JSON.stringify(body) });
    const out = await res.json().catch(function () { return null; });
    if (!out || out.result === 'error') throw new Error((out && out.message) || UI.submitFail);
    state.submitted = true; storeSet();
    toast(UI.submitted);
  } catch (e) {
    toast(e && e.message ? e.message : UI.submitFail);
  }
  btn.disabled = false;
  btn.textContent = state.submitted ? UI.submitAgain : UI.submit;
}

/* ───────── 화면: 돌아보기 ───────── */
function typeResult() {
  const counts = { act: 0, mid: 0, wait: 0, no: 0 };
  SCENES.forEach(function (s) {
    const a = state.answers[s.id];
    const o = a ? s.options.filter(function (x) { return x.id === a.opt; })[0] : null;
    if (o && o.tag) counts[o.tag] += 1;
  });
  const order = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; });
  return { key: counts[order[0]] === counts[order[1]] ? 'mixed' : order[0], counts: counts };
}

const TAG_ICON = {
  act:  'M3 8h9M8.5 4l4 4-4 4',
  mid:  'M3 5.5h10M3 10.5h10',
  wait: 'M8 3.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM8 5.8V8l1.6 1.2',
  no:   'M4 4l8 8M12 4l-8 8'
};
function tagChip(tag) {
  return h('span', { class: 'tag-chip', 'data-tag': tag }, [svg(TAG_ICON[tag]), TAG_LABEL[tag]]);
}
function sceneTag(scene) {
  const a = state.answers[scene.id];
  const o = a ? scene.options.filter(function (x) { return x.id === a.opt; })[0] : null;
  return o && o.tag ? o.tag : '';
}

/* 연표: 날짜 · 세로줄 · 내 선택 카드. 선택 성격(tag)은 아이콘+글자+모양으로 함께 표시한다 */
function timelineEl() {
  const list = h('ol', { class: 'timeline' });
  SCENES.forEach(function (s) {
    const a = state.answers[s.id] || { opt: '', reason: '' };
    const tag = sceneTag(s);
    const p = s.date.split('.');
    const body = [
      h('div', { class: 'tl-head' }, [h('h3', { text: '장면 ' + s.id + ' · ' + s.title }), tag ? tagChip(tag) : null]),
      h('p', { class: 'q', text: UI.chosen }),
      h('p', { class: 'a', text: a.opt ? dispLetter(s, a.opt) + '. ' + optText(s, a.opt) : '' })
    ];
    if (oneLine(a.reason)) body.push(h('p', { class: 'q', text: UI.reasonWord }), h('p', { class: 'a', text: a.reason }));
    if (s.id === 3) {
      const cl = CLAUSES.filter(function (c) { return state.clauses.indexOf(c.id) >= 0; });
      body.push(h('p', { class: 'q', text: UI.clauseRecap }), h('p', { class: 'a', text: cl.map(function (c) { return c.id + ' ' + c.text; }).join('\n') }));
      body.push(h('p', { class: 'q', text: UI.reasonWord }), h('p', { class: 'a', text: state.clauseReason }));
    }
    list.appendChild(h('li', { class: 'tl-item', 'data-tag': tag }, [
      h('div', { class: 'tl-date' }, [h('span', { class: 'tl-year', text: p[0] }), h('span', { class: 'tl-month', text: p[1] + '월' })]),
      h('div', { class: 'tl-rail' }, h('span', { class: 'tl-node' }, tag ? svg(TAG_ICON[tag]) : null)),
      h('div', { class: 'tl-card' }, body)
    ]));
  });
  return list;
}

/* 거미줄(레이더) 그래프: 네 가지 선택 성격을 장면 수(최대 6)로 그린다. 마주 보는 축은 앞장서기↔지켜보기, 조율하기↔반대하기 */
const RADAR_AXES = [
  { tag: 'act',  dx: -1, dy: -1 },
  { tag: 'mid',  dx: 1,  dy: -1 },
  { tag: 'wait', dx: 1,  dy: 1 },
  { tag: 'no',   dx: -1, dy: 1 }
];
function radarEl(counts) {
  const NS = 'http://www.w3.org/2000/svg', C = 50, R = 36, MAX = SCENES.length, K = Math.SQRT1_2;
  const pt = function (ax, v) { const r = R * v / MAX; return [C + ax.dx * K * r, C + ax.dy * K * r]; };
  const poly = function (v) { return RADAR_AXES.map(function (ax) { return pt(ax, v).join(','); }).join(' '); };
  const mk = function (tag, attrs) { const e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; };
  const sv = mk('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true', class: 'radar-svg' });
  [2, 4, 6].forEach(function (v) { sv.appendChild(mk('polygon', { points: poly(v), class: 'radar-ring' })); });
  RADAR_AXES.forEach(function (ax) { const e = pt(ax, MAX); sv.appendChild(mk('line', { x1: C, y1: C, x2: e[0], y2: e[1], class: 'radar-axis' })); });
  sv.appendChild(mk('polygon', { points: RADAR_AXES.map(function (ax) { return pt(ax, counts[ax.tag]).join(','); }).join(' '), class: 'radar-area' }));
  RADAR_AXES.forEach(function (ax) { const q = pt(ax, counts[ax.tag]); sv.appendChild(mk('circle', { cx: q[0], cy: q[1], r: 1.6, class: 'radar-dot' })); });

  const label = RADAR_AXES.map(function (ax) { return TAG_LABEL[ax.tag] + ' ' + counts[ax.tag] + '번'; }).join(', ');
  const wrap = h('div', { class: 'radar', role: 'img', 'aria-label': TYPE_TEXT.title + ' 그래프. ' + label }, sv);
  RADAR_AXES.forEach(function (ax) {
    const e = pt(ax, MAX);
    wrap.appendChild(h('span', { class: 'radar-label' + (ax.dy < 0 ? ' up' : ' down'), 'aria-hidden': 'true',
      style: 'left:' + e[0] + '%;top:' + e[1] + '%' }, [h('b', { text: TAG_LABEL[ax.tag] }), h('span', { text: counts[ax.tag] + '번' })]));
  });
  return wrap;
}

function openPadlet() {
  let url = CONFIG.PADLET_URL;
  const q = params.get('padlet');
  if (q) { try { const u = new URL(q); if (u.protocol === 'https:' && /(^|\.)padlet\.com$/.test(u.hostname)) url = u.href; } catch (e) { /* 무시 */ } }
  return url;
}

function renderRecap(root) {
  const role = roleObj();
  root.appendChild(h('section', { class: 'card' }, [
    h('h1', { text: UI.recapTitle }),
    h('p', { class: 'role-tag', text: UI.roleLabel + ' · ' + (role ? role.name : '') }),
    (oneLine(state.introA) || oneLine(state.introB)) ? h('div', { class: 'recap' }, [h('p', { class: 'q', text: UI.firstThought }),
      oneLine(state.introA) ? h('p', { class: 'q', text: UI.introCommoner }) : null, oneLine(state.introA) ? h('p', { class: 'a', text: state.introA }) : null,
      oneLine(state.introB) ? h('p', { class: 'q', text: UI.introNoble }) : null, oneLine(state.introB) ? h('p', { class: 'a', text: state.introB }) : null]) : null,
    h('div', { class: 'legend' }, [h('p', { class: 'q', text: UI.legend })].concat(Object.keys(TAG_LABEL).map(tagChip)))
  ]));

  root.appendChild(timelineEl());

  const tr = typeResult(), T = TYPES[tr.key];
  const countLine = Object.keys(TAG_LABEL).map(function (k) { return TAG_LABEL[k] + ' ' + tr.counts[k]; }).join(' · ');
  root.appendChild(h('section', { class: 'card' }, [
    h('h2', { text: TYPE_TEXT.title }),
    radarEl(tr.counts),
    h('p', { class: 'type-name', text: T.name }),
    h('p', { text: T.desc }),
    h('p', { class: 'muted', text: countLine }),
    h('p', { class: 'muted', text: TYPE_TEXT.note })
  ]));

  root.appendChild(navRow({ prev: prevHandler(), nextLabel: UI.toWrite, next: function () { go('write'); } }));
}

/* ───────── 화면: 일기 쓰기 ───────── */
function insertAtCursor(ta, text) {
  const v = ta.value;
  const pos = typeof ta.selectionStart === 'number' ? ta.selectionStart : v.length;
  const end = typeof ta.selectionEnd === 'number' ? ta.selectionEnd : pos;
  const before = v.slice(0, pos);
  const lead = before && !/\s$/.test(before) ? ' ' : '';
  ta.value = before + lead + text + v.slice(end);
  const caret = (before + lead + text).length;
  ta.focus();
  try { ta.setSelectionRange(caret, caret); } catch (e) { /* 무시 */ }
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}
function addStarter(i, ta) {
  const ids = diarySceneIds();
  if (!ids.length) { toast(DIARY.needScene); return; }
  const p = sceneById(ids[0]).date.split('.');
  insertAtCursor(ta, DIARY.starterTexts[i].replace('{date}', p[0] + '년 ' + p[1] + '월'));
}

/* 고른 장면마다 "그날 내 상황"을 보여 준다(그림은 넣지 않는다). 일기 칸은 하나라서 이 상자만 다시 그려도 글은 그대로 남는다 */
function renderCtx() {
  const box = document.getElementById('diaryCtx'); if (!box) return;
  box.textContent = '';
  const r = roleObj();
  diarySceneIds().forEach(function (id) {
    const sc = sceneById(id), a = state.answers[id], pt = portraitEl(r, 'portrait portrait-sm');
    const info = h('div', { class: 'diary-text' }, [
      h('p', { class: 'role-tag', text: '장면 ' + sc.id + ' · ' + sc.title + ' · ' + sc.date }),
      h('p', { text: DIARY.situationLabel + ' ' + (sc.situation[state.role] || '') }),
      (a && a.opt) ? h('p', { text: '그날 내 선택 ' + dispLetter(sc, a.opt) + '. ' + optText(sc, a.opt) }) : null,
      h('details', {}, [h('summary', {}, [svg(ICON.chev), UI.rereadScene]), h('div', { class: 'details-body' }, h('p', { text: sc.common }))])
    ]);
    box.appendChild(h('div', { class: 'situation diary-ctx' }, pt ? [pt, info] : [info]));
  });
  if (window.Glossary) Glossary.refresh();
}

function renderWrite(root) {
  const d = state.diary;
  const fs = h('fieldset', { class: 'choices' }, [h('legend', { text: DIARY.pickScene }), h('p', { class: 'muted', text: DIARY.pickNote })]);
  SCENES.forEach(function (s) {
    fs.appendChild(choiceEl('checkbox', 'ds', String(s.id), choiceLabel('장면 ' + s.id + '.', ' ' + s.title), s.date, d.scenes.indexOf(String(s.id)) >= 0, function (input) {
      const id = String(s.id);
      if (input.checked) {
        if (d.scenes.length >= 2) { input.checked = false; toast(DIARY.max); return; }
        d.scenes.push(id);
      } else {
        d.scenes = d.scenes.filter(function (x) { return x !== id; });
      }
      storeSet(); renderCtx(); refreshWrite();
    }));
  });

  const ta = textareaField(d.text, function (v) { d.text = v; storeSet(); refreshWrite(); }, DIARY.label, 10);
  // 복사에 성공한 뒤에야 패들렛 버튼이 나온다(복사 전엔 숨김). 주소가 없으면 포털에서 열도록 안내만 보인다.
  const url = openPadlet();
  const padBox = h('div', { class: 'pad-after', id: 'padAfter', hidden: true });
  const showPad = function () {
    padBox.textContent = '';
    if (url) padBox.appendChild(h('button', { type: 'button', class: 'btn btn-primary', id: 'padBtn', onclick: function () {
      window.open(url, '_blank', 'noopener,noreferrer');
    } }, [UI.padletOpen, svg('M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5L7.5 8.5')]));
    else padBox.appendChild(h('p', { class: 'muted', text: UI.padletNoUrl }));
    padBox.hidden = false;
  };
  const copyBtn = h('button', { type: 'button', class: 'btn btn-primary', id: 'copyBtn', onclick: function () { if (diaryDone()) copyText(buildCopyText(), UI.padletCopied, showPad); } }, UI.copy);
  const subBtn = h('button', { type: 'button', class: 'btn btn-outline', id: 'subBtn', onclick: function () { if (diaryDone()) submitRecord(subBtn); } }, state.submitted ? UI.submitAgain : UI.submit);

  root.appendChild(h('section', { class: 'card' }, [
    h('h1', { text: UI.writeTitle }), h('p', { class: 'muted', text: UI.writeLead }), fs
  ]));
  root.appendChild(h('div', { id: 'diaryCtx', class: 'diary-entries' }));
  root.appendChild(h('section', { class: 'card' }, [
    h('p', { class: 'muted', text: DIARY.notice }),
    h('p', { class: 'guide-title', text: DIARY.guideTitle }),
    h('ol', { class: 'guide' }, DIARY.guide.map(function (t) { return h('li', { text: t }); })),
    h('div', { class: 'field' }, [h('p', { class: 'field-label', text: DIARY.label }), ta]),
    h('details', {}, [
      h('summary', {}, [svg(ICON.chev), DIARY.starterToggle]),
      h('div', { class: 'details-body' }, [
        h('p', { class: 'muted', text: DIARY.starterNote }),
        h('div', { class: 'btn-row' }, DIARY.starterLabels.map(function (label, i) {
          return h('button', { type: 'button', class: 'btn btn-outline', onclick: function () { addStarter(i, ta); } }, label);
        }))
      ])
    ])
  ]));
  root.appendChild(h('section', { class: 'card' }, [
    h('p', { class: 'muted', id: 'diaryNote', text: UI.needAllDiary }),
    h('h2', { text: UI.outTitle }),
    h('p', { class: 'muted', text: UI.outLead }),
    h('div', { class: 'btn-row' }, [copyBtn, subBtn]),
    padBox
  ]));
  root.appendChild(h('div', { class: 'nav-row' }, [
    h('button', { type: 'button', class: 'btn', onclick: prevHandler() }, UI.prev),
    h('button', { type: 'button', class: 'btn btn-outline', onclick: confirmRestart }, UI.restart)
  ]));
  renderCtx(); refreshWrite();
}
function refreshWrite() {
  const ok = diaryDone();
  ['copyBtn', 'subBtn'].forEach(function (id) {
    const b = document.getElementById(id);
    if (b && !(id === 'subBtn' && b.textContent === UI.submitting)) b.disabled = !ok;
  });
  const n = document.getElementById('diaryNote'); if (n) n.hidden = ok;
}

/* ───────── 모달: 처음부터 다시하기 ───────── */
function confirmRestart() {
  const root = document.getElementById('modalRoot');
  const opener = document.activeElement;
  const close = function () { root.textContent = ''; if (opener && opener.focus) opener.focus(); };
  const cancel = h('button', { type: 'button', class: 'btn', onclick: close }, UI.cancel);
  const erase = h('button', { type: 'button', class: 'btn btn-critical', onclick: function () {
    root.textContent = ''; storeDel();
    state = freshState(state.sid, state.name);
    storeSet(); go('intro');
  } }, UI.erase);
  const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mdTitle' }, [
    h('h2', { id: 'mdTitle', text: UI.restartTitle }), h('p', { text: UI.restartBody }),
    h('div', { class: 'btn-row' }, [cancel, erase])
  ]);
  const back = h('div', { class: 'modal-back' }, box);
  back.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = [cancel, erase], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); erase.focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); cancel.focus(); }
    }
  });
  root.appendChild(back); cancel.focus();
}

/* ───────── 렌더 ───────── */
function render() {
  const root = document.getElementById('screen');
  root.textContent = '';
  renderBar();
  const st = state.step;
  if (st === 'intro') renderIntro(root);
  else if (st === 'role') renderRole(root);
  else if (st === 's3a') renderClauses(root);
  else if (st === 's3b') renderScene(root, sceneById(3), true);
  else if (st === 'recap') renderRecap(root);
  else if (st === 'write') renderWrite(root);
  else renderScene(root, sceneById(Number(st.slice(1))), false);
  if (window.Glossary) Glossary.refresh();
}

function startGuard() {
  if (startedGuard || !window.FocusGuard || !state.sid) return;
  startedGuard = true;
  FocusGuard.start({ key: CONFIG.GAME_NAME + ':' + state.sid });
}

/* ───────── 부팅 (함수 선언이 모두 끝난 뒤 맨 마지막에 실행) ───────── */
function init() {
  const qSid = (params.get('sid') || '').replace(/\D/g, '').slice(0, 5);
  const qName = (params.get('name') || '').trim();
  const saved = storeGet();
  if (saved && saved.step === 'finale') saved.step = 'recap'; /* 예전에 저장된 진행분 */
  if (saved && saved.step && STEPS.indexOf(saved.step) >= 0 && (!qSid || qSid === saved.sid)) state = Object.assign(freshState('', ''), saved);
  if (saved && saved.intro && !state.introA && !state.introB) state.introA = saved.intro;
  const dy = state.diary;
  if (dy && dy.scene !== undefined) state.diary = { scenes: dy.scene ? [String(dy.scene)] : [], text: dy.text || '' };
  else if (dy && dy.texts) state.diary = { scenes: dy.scenes || [], text: Object.keys(dy.texts).sort().map(function (k) { return dy.texts[k]; }).filter(Boolean).join('\n\n') };
  if (!state.diary || !Array.isArray(state.diary.scenes)) state.diary = { scenes: [], text: '' };
  if (typeof state.diary.text !== 'string') state.diary.text = '';
  if (qSid && !state.sid) state.sid = qSid;
  if (qName && !state.name) state.name = qName;
  if (PREVIEW) {
    if (!state.sid) state.sid = '20599';
    if (!state.name) state.name = '미리보기 학생';
    document.getElementById('previewBanner').hidden = false;
  }
  if (state.step !== 'intro' && !/^\d{5}$/.test(state.sid)) state.step = 'intro';
  if (state.step !== 'intro') startGuard();
  Glossary.start({ terms: GLOSSARY, unique: true, skip: ['.topbar', '.recap .a', '.modal'] });
  render();
}
init();
