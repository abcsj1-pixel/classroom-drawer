import {validateEntry,entryPath,filterEntries,SessionScope} from './model.mjs';
'use strict';
const $ = id => document.getElementById(id);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const parseDay = value => new Date(value + 'T12:00:00');
const moods = [ ['happy','기쁨','M8 14q4 5 8 0'], ['calm','평온','M8 15q4 2 8 0'], ['ordinary','보통','M8 15h8'], ['sad','슬픔','M8 17q4-5 8 0'], ['tired','피곤','M8 15h8M7 9h3M14 9h3'] ];
const moodIcon = mood => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true');
  const circle = document.createElementNS(svg.namespaceURI,'circle'); circle.setAttribute('cx','12');circle.setAttribute('cy','12');circle.setAttribute('r','9');
  const path = document.createElementNS(svg.namespaceURI,'path'); path.setAttribute('d','M8 9h.01M16 9h.01' + (moods.find(m=>m[0]===mood)?.[2] || 'M8 15h8'));
  svg.append(circle,path);return svg;
};
const scope=new SessionScope();let backend=null,loadedEntries=[],pageCursor=null,hasMore=false,pendingId=null;
let entries = [], currentId = null, mood = '', baseline = '', busy = false, selectedDate = '', query = '';
let calendarMonth = today().slice(0,7), listSequence = 0, monthSequence = 0, monthDates = new Set(), toastTimer;
const data = () => ({date:$('entry-date').value,title:$('entry-title').value,body:$('entry-body').value,mood});
const dirty = () => JSON.stringify(data()) !== baseline;
function notify(text) { $('toast').textContent=text; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,3000); }
function showError(text) { $('form-error').textContent=text; $('form-error').hidden=!text; }
function canLeave() { return !busy && (!dirty() || window.confirm('아직 저장하지 않은 내용이 있어요. 변경 내용을 버리고 이동할까요?')); }
async function api(path='', options={}) {
  const snapshot=scope.capture();
  if(options.method==='DELETE'){
    const id=path.slice(1);entryPath(snapshot.uid,id);await backend.remove(snapshot.uid,id);ensureCurrent(snapshot);loadedEntries=loadedEntries.filter(e=>e.id!==id);return {};
  }
  if(options.method==='POST'||options.method==='PUT'){
    const draft=validateEntry(JSON.parse(options.body));
    const id=path.slice(1)||(pendingId??=crypto.randomUUID());entryPath(snapshot.uid,id);
    const entry=await backend.save(snapshot.uid,id,draft);ensureCurrent(snapshot);
    loadedEntries=[entry,...loadedEntries.filter(e=>e.id!==id)];return entry;
  }
  return {entries:filterEntries(loadedEntries,Object.fromEntries(new URLSearchParams(path.replace(/^\?/,''))))};
}
function ensureCurrent(snapshot){if(!scope.isCurrent(snapshot))throw new Error('로그인 상태가 변경됐어요.');}

function updateState() {
  $('char-count').textContent=`${$('entry-body').value.length.toLocaleString('ko-KR')}자`;
  $('save-state').textContent=busy ? '저장 중이에요…' : dirty() ? '저장하지 않은 변경 사항' : currentId ? '저장된 일기' : '아직 저장하지 않았어요';
  $('weekday-label').textContent=$('entry-date').value ? parseDay($('entry-date').value).toLocaleDateString('ko-KR',{weekday:'long'}) : '';
  document.querySelectorAll('.mood-option').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mood===mood)));
}
function fillEditor(entry=null, day=today()) {
  currentId=entry?.id ?? null; pendingId=null; mood=entry?.mood || '';
  $('entry-date').value=entry?.date || day; $('entry-title').value=entry?.title || ''; $('entry-body').value=entry?.body || '';
  $('editor-mode').textContent=entry ? '기억을 펼치는 시간' : '새로운 페이지';
  $('delete-entry').hidden=!entry;
  $('save-hint').textContent=entry ? '오늘의 마음을 다시 담아도 좋아요.' : '나의 하루를 차곡차곡.';
  baseline=JSON.stringify(data()); showError(''); updateState(); renderList();
}
function renderCalendar() {
  const [year,month]=calendarMonth.split('-').map(Number);
  $('month-label').textContent=`${year}년 ${month}월`;
  const first=new Date(`${calendarMonth}-01T12:00:00`).getDay();
  const days=new Date(year,month,0).getDate(); const fragment=document.createDocumentFragment();
  for(let i=0;i<first;i++) fragment.append(document.createElement('span'));
  for(let day=1;day<=days;day++) {
    const value=`${calendarMonth}-${String(day).padStart(2,'0')}`;
    const button=document.createElement('button');button.type='button';button.textContent=day;
    button.classList.toggle('today',value===today());button.classList.toggle('selected',value===selectedDate);button.classList.toggle('has-entry',monthDates.has(value));
    button.setAttribute('aria-label',`${year}년 ${month}월 ${day}일${monthDates.has(value)?', 일기 있음':''}`);
    button.setAttribute('aria-pressed',String(value===selectedDate));
    if(value===today()) button.setAttribute('aria-current','date');
    button.addEventListener('click',()=>{if(!canLeave())return;selectedDate=value;renderCalendar();fillEditor(null,value);loadList();});
    fragment.append(button);
  }
  $('calendar').replaceChildren(fragment);
}
async function loadCalendar() {
  const sequence=++monthSequence;
  try { const result=await api('?month='+calendarMonth);if(sequence!==monthSequence)return;monthDates=new Set(result.entries.map(entry=>entry.date));renderCalendar(); }
  catch { if(sequence===monthSequence){monthDates=new Set();renderCalendar();} }
}
function renderList() {
  const fragment=document.createDocumentFragment();
  for(const entry of entries) {
    const button=document.createElement('button');button.type='button';button.className='entry-item';button.classList.toggle('active',entry.id===currentId);
    button.setAttribute('aria-pressed',String(entry.id===currentId));
    const meta=document.createElement('div');meta.className='item-meta';
    const dateLabel=document.createElement('span');dateLabel.textContent=parseDay(entry.date).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'});meta.append(dateLabel);
    if(entry.mood) {const label=document.createElement('span');label.className='item-mood';label.append(moodIcon(entry.mood));const name=document.createElement('span');name.textContent=moods.find(m=>m[0]===entry.mood)?.[1] || '';label.append(name);meta.append(label);}
    const title=document.createElement('h4');title.textContent=entry.title || `${entry.date}의 기록`;
    const preview=document.createElement('p');preview.textContent=entry.body.replace(/\s+/g,' ');
    button.append(meta,title,preview);
    button.addEventListener('click',()=>{if(!canLeave())return;fillEditor(entry);$('entry-title').focus({preventScroll:true});});fragment.append(button);
  }
  $('entry-list').replaceChildren(fragment);$('entry-count').textContent=entries.length;
}
async function loadList() {
  const sequence=++listSequence;const params=new URLSearchParams();if(query)params.set('q',query);if(selectedDate)params.set('date',selectedDate);
  $('list-status').textContent='기록을 불러오는 중…';
  $('clear-filter').hidden=!selectedDate && !query;
  $('list-label').firstChild.textContent=selectedDate ? `${Number(selectedDate.slice(5,7))}월 ${Number(selectedDate.slice(8))}일 ` : query ? '검색한 일기 ' : '모든 일기 ';
  try {
    const result=await api('?'+params);if(sequence!==listSequence)return;entries=result.entries;renderList();
    $('list-status').textContent=entries.length ? '' : query ? '검색 결과가 없어요. 다른 단어로 찾아보세요.' : selectedDate ? '이날의 기록이 아직 없어요. 첫 이야기를 남겨 보세요.' : '아직 기록이 없어요. 오늘의 첫 이야기를 남겨 보세요.';
  } catch(error) {if(sequence!==listSequence)return;entries=[];renderList();$('list-status').textContent='기록을 불러오지 못했어요. 로그인과 인터넷 연결을 확인한 뒤 새로 불러오기를 눌러 주세요.';$('clear-filter').hidden=false;}
}
function setBusy(value) {
  busy=value;
  document.querySelectorAll('#entry-form input,#entry-form textarea,#entry-form button').forEach(el=>el.disabled=value);
  $('new-entry').disabled=value;$('save-entry').querySelector('span').textContent=value?'저장 중…':'일기 저장하기';updateState();
}
function newEntry() {
  if(!scope.uid||!canLeave())return;selectedDate='';query='';$('search').value='';calendarMonth=today().slice(0,7);fillEditor();loadList();loadCalendar();$('entry-title').focus();
}
$('entry-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!scope.uid)return;showError('');
  if(!$('entry-body').value.trim()){showError('오늘의 이야기를 한 줄 남겨 주세요.');$('entry-body').focus();return;}
  const operation=scope.capture();const draft=data();const id=currentId;setBusy(true);
  try {
    const entry=await api(id?'/'+id:'',{method:id?'PUT':'POST',body:JSON.stringify(draft)});
    ensureCurrent(operation);selectedDate='';query='';$('search').value='';calendarMonth=entry.date.slice(0,7);fillEditor(entry);await Promise.all([loadList(),loadCalendar()]);scope.apply(operation,()=>notify('오늘의 조각을 소중히 저장했어요.'));
  } catch(error) { scope.apply(operation,()=>showError(error.message || '저장하지 못했어요. 입력 내용은 그대로 있어요. 연결 후 다시 저장해 주세요.')); }
  finally {scope.apply(operation,()=>setBusy(false));}
});
$('delete-entry').addEventListener('click',async()=>{
  if(busy || !currentId || !window.confirm('이 일기를 삭제할까요? 삭제한 기록은 되돌릴 수 없어요.'))return;
  const operation=scope.capture();setBusy(true);showError('');
  try {await api('/'+currentId,{method:'DELETE'});ensureCurrent(operation);fillEditor(null,selectedDate||today());await Promise.all([loadList(),loadCalendar()]);scope.apply(operation,()=>notify('일기를 삭제했어요.'));}
  catch(error){scope.apply(operation,()=>showError(error.message || '삭제하지 못했어요. 다시 시도해 주세요.'));}
  finally{scope.apply(operation,()=>setBusy(false));}
});
$('new-entry').addEventListener('click',newEntry);
$('brand').addEventListener('click',event=>{if(!canLeave())event.preventDefault();});
$('go-today').addEventListener('click',()=>{if(!canLeave())return;calendarMonth=today().slice(0,7);selectedDate=today();fillEditor(null,selectedDate);loadList();loadCalendar();});
for(const [id,delta] of [['prev-month',-1],['next-month',1]]) $(id).addEventListener('click',()=>{
  const [year,month]=calendarMonth.split('-').map(Number);const next=new Date(year,month-1+delta,1);
  if(next.getFullYear()<100 || next.getFullYear()>9999)return;
  calendarMonth=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`;monthDates=new Set();renderCalendar();loadCalendar();
});
$('clear-filter').addEventListener('click',()=>{selectedDate='';query='';$('search').value='';renderCalendar();loadList();});
let searchTimer;$('search').addEventListener('input',()=>{query=$('search').value.trim();clearTimeout(searchTimer);searchTimer=setTimeout(loadList,180);});
['entry-title','entry-body','entry-date'].forEach(id=>$(id).addEventListener('input',updateState));
for(const [key,label] of moods) {
  const button=document.createElement('button');button.type='button';button.className='mood-option';button.dataset.mood=key;button.setAttribute('aria-pressed','false');
  button.append(moodIcon(key),document.createTextNode(label));button.addEventListener('click',()=>{mood=mood===key?'':key;updateState();});$('mood-options').append(button);
}
window.addEventListener('beforeunload',event=>{if(dirty()||busy){event.preventDefault();event.returnValue='';}});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key==='s'){event.preventDefault();if(!busy)$('entry-form').requestSubmit();}});
$('today-label').textContent=parseDay(today()).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
fillEditor();renderCalendar();
async function loadPage(reset=false){
  const snapshot=scope.capture();const button=$('load-more');button.disabled=true;$('refresh-entries').disabled=true;
  try{const page=await backend.list(snapshot.uid,reset?null:pageCursor);ensureCurrent(snapshot);loadedEntries=reset?page.entries:[...loadedEntries,...page.entries.filter(e=>!loadedEntries.some(old=>old.id===e.id))];pageCursor=page.cursor;hasMore=page.hasMore;button.hidden=!hasMore;await Promise.all([loadList(),loadCalendar()]);}
  catch(error){if(scope.isCurrent(snapshot)){$('list-status').textContent='기록을 불러오지 못했어요. 로그인과 인터넷 연결을 확인하고 다시 시도해 주세요.';}}
  finally{if(scope.isCurrent(snapshot)){button.disabled=false;$('refresh-entries').disabled=false;}}
}
$('load-more').onclick=()=>loadPage();
$('refresh-entries').onclick=()=>loadPage(true);
$('privacy-info').onclick=()=>$('privacy-dialog').showModal();
$('close-privacy').onclick=()=>$('privacy-dialog').close();
$('export-entries').onclick=()=>{if(!scope.uid)return;const blob=new Blob([JSON.stringify(loadedEntries.map(({id,date,title,body,mood})=>({id,date,title,body,mood})),null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='day-pieces-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('login').onclick=async()=>{if(!backend)return;$('login').disabled=true;$('auth-status').textContent='Google 로그인 창에서 계속해 주세요.';try{await backend.login();}catch(error){$('auth-status').textContent=error.code==='auth/popup-blocked'?'로그인 팝업이 차단됐어요. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.':error.code==='auth/unauthorized-domain'?'현재 주소가 Google 로그인 허용 도메인에 등록되지 않았어요. 운영자에게 알려 주세요.':'로그인을 완료하지 못했어요. 다시 시도해 주세요.';}finally{$('login').disabled=false;}};
function clearPrivate(){listSequence++;monthSequence++;clearTimeout(searchTimer);loadedEntries=[];entries=[];monthDates=new Set();pageCursor=null;hasMore=false;selectedDate='';query='';pendingId=null;busy=false;$('search').value='';fillEditor();setBusy(false);renderCalendar();$('list-status').textContent='';$('private-shell').hidden=true;$('export-entries').hidden=true;$('logout').hidden=true;$('user-label').textContent='';}
$('logout').onclick=async()=>{if(dirty()&&!window.confirm('저장하지 않은 내용은 사라져요. 진행 중인 요청은 서버에서 완료될 수 있어요. 로그아웃할까요?'))return;scope.setUser(null);clearPrivate();$('welcome').hidden=false;$('auth-status').textContent='로그아웃 중이에요…';try{await backend.logout();location.reload();}catch{$('auth-status').textContent='로그아웃을 완료하지 못했어요. 브라우저를 닫은 뒤 다시 시도해 주세요.';}};
try{
  const module=await import('./firebase-client.mjs');backend=await module.createBackend();
  let previousUid=null;
  backend.observe(user=>{
    const changed=previousUid&&previousUid!==user?.uid;
    clearPrivate();scope.setUser(user?.uid||null);
    if(changed){baseline=JSON.stringify(data());location.reload();return;}
    previousUid=user?.uid||null;
    $('welcome').hidden=!!user;$('private-shell').hidden=!user;$('logout').hidden=!user;$('export-entries').hidden=!user;$('user-label').textContent=user?.email||'';$('login').disabled=false;
    $('auth-status').textContent=user?'':'계정별로 나만의 기록을 보관해요.';
    if(user)loadPage(true);
  });
}catch(error){$('auth-status').textContent='클라우드 연결 설정을 준비 중이에요. 아직 로그인하거나 일기를 저장할 수 없어요. 기존 로컬 일기는 그대로 보관돼 있어요.';$('login').disabled=true;}

