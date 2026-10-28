import { Timer, safeUrl, selectApps } from './core.mjs';
import { apps as builtinApps } from './apps.mjs';
const $ = s => document.querySelector(s);
const paths={drawer:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 12h16M9 7.5h6M9 16.5h6"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',timer:'<circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 2v3M18 6l2-2M12 9v5l3 2"/>',message:'<path d="M21 11a8 8 0 0 1-8 8H6l-4 3 1.8-6A8 8 0 1 1 21 11Z"/><path d="M7 10h9M7 14h6"/>',spark:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM20 2v4M18 4h4"/>',book:'<path d="M5 3h13a1 1 0 0 1 1 1v17H6a3 3 0 0 1-3-3V6a3 3 0 0 1 2-3ZM3 17h16M8 7h7M8 11h5"/>',star:'<path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1 6.2L12 17.3l-5.6 2.9 1-6.2-4.5-4.4 6.3-.9L12 3Z"/>',music:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',external:'<path d="M14 3h7v7m0-7L11 13M10 4H4v16h16v-6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',sprout:'<path d="M12 22V12M12 15C4 15 2 11 3 5c6 0 9 4 9 10ZM12 10c0-6 4-8 9-8 0 6-3 10-9 10"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',play:'<path d="m8 4 12 8-12 8V4Z"/>',pause:'<path d="M8 4v16M16 4v16"/>',reset:'<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/>',volume:'<path d="M11 4 6 8H3v8h3l5 4V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>'};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key, fallback){try{const v=JSON.parse(localStorage.getItem(key));return v ?? fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 유지돼요.');return false;}}
let custom=read('drawer-apps',[]);if(!Array.isArray(custom))custom=[];
custom=custom.filter(a=>a && typeof a.id==='string' && typeof a.title==='string' && safeUrl(a.url) && ['classroom','learning','play','personal'].includes(a.category)).map(a=>({...a,icon:'grid',color:'green',tags:['내가 추가한 앱'],custom:true,description:String(a.description||'')}));
let favorites=read('drawer-favorites',['timer']);if(!Array.isArray(favorites))favorites=['timer'];
let category='all',favoritesOnly=false;
const categoryNames={all:'모든 웹앱',classroom:'교실 도구',learning:'학습과 소통',play:'놀이와 활동',personal:'개인 공간'};
let toastTimeout;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').hidden=true,3500);}
function info(title, paragraphs){$('#info-title').textContent=title;$('#info-content').replaceChildren(...paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));$('#info-dialog').showModal();}
function render(){
  const all=[...builtinApps,...custom];
  const selected=selectApps(all,{category,query:$('#search').value,favoritesOnly,favorites});
  $('#total-count').textContent=all.length;$('#result-count').textContent=selected.length;
  $('#collection-title').firstChild.textContent=(favoritesOnly?'즐겨찾기':categoryNames[category])+' ';
  document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',!favoritesOnly&&category===b.dataset.category);b.setAttribute('aria-pressed',String(!favoritesOnly&&category===b.dataset.category));});
  document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',category===b.dataset.filter);b.setAttribute('aria-pressed',String(category===b.dataset.filter));});
  $('#favorites-nav').classList.toggle('active',favoritesOnly);$('#favorites-nav').setAttribute('aria-pressed',String(favoritesOnly));
  $('#empty').hidden=selected.length>0;
  $('#apps').innerHTML=selected.map(a=>`<article class="app-card ${a.featured?'featured':''}"><div class="card-top"><div class="app-icon ${a.color}">${icon(a.icon)}</div><button class="icon-button ${favorites.includes(a.id)?'favorited':''}" data-favorite="${esc(a.id)}" aria-label="${esc(a.title)} 즐겨찾기" aria-pressed="${favorites.includes(a.id)}">${icon('star')}</button></div><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><div class="tags">${a.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><div class="card-bottom"><small>${a.local?'내 컴퓨터에서 열려요':a.id==='timer'?'바로 사용할 수 있어요':'새 탭에서 열려요'}</small>${a.custom?`<button class="icon-button" data-remove="${esc(a.id)}" aria-label="${esc(a.title)} 링크 삭제">${icon('trash')}</button>`:''}${a.local?`<button class="open-app" data-diary>일기장 열기 ${icon('external')}</button>`:`<a href="${esc(a.url)}" ${a.id==='timer'?'':'target="_blank" rel="noopener noreferrer"'}>${a.id==='timer'?'타이머 열기':'웹앱 열기'} ${icon(a.id==='timer'?'arrow':'external')}</a>`}</div></article>`).join('')+`<button class="add-card" id="add-card"><span class="add-circle">${icon('plus')}</span><strong>다음 웹앱의 자리를 비워 두었어요</strong><p>새로 만든 웹앱이 있나요?<br>서랍에 하나 더 추가해 보세요.</p></button>`;
}
document.addEventListener('click',e=>{
  const fav=e.target.closest('[data-favorite]');if(fav){const id=fav.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save('drawer-favorites',favorites);render();return;}
  const filter=e.target.closest('[data-filter],[data-category]');if(filter){category=filter.dataset.filter||filter.dataset.category;favoritesOnly=false;render();return;}
  if(e.target.closest('#add-app,#add-card')){$('#form-error').textContent='';$('#app-dialog').showModal();return;}
  if(e.target.closest('[data-close]')){e.target.closest('dialog').close();return;}
  const remove=e.target.closest('[data-remove]');if(remove){custom=custom.filter(a=>a.id!==remove.dataset.remove);save('drawer-apps',custom);render();toast('서랍에서 링크를 지웠어요. 원래 앱은 삭제되지 않아요.');return;}
  if(e.target.closest('[data-diary]')){
    info('일기장은 내 컴퓨터에서 열어요',['‘하루의 조각’의 내용과 데이터베이스는 이 허브에 복사하거나 전송하지 않아요.','허브 폴더의 ‘교실 서랍 시작.command’를 더블클릭하면 기존 일기장과 허브가 함께 실행돼요. 이미 일기장이 실행 중이라면 아래 버튼으로 여세요.','다른 기기에서는 그 기기의 로컬 주소가 열립니다. 일기가 있는 원래 컴퓨터에서 사용하세요.']);
    const a=document.createElement('a');a.href='http://127.0.0.1:8765';a.target='_blank';a.rel='noopener noreferrer';a.className='button';a.textContent='실행 중인 일기장 열기 ↗';$('#info-content').append(a);
  }
});
$('#favorites-nav').onclick=()=>{favoritesOnly=true;category='all';render();};
$('#search').oninput=render;
$('#app-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.currentTarget);const url=safeUrl(data.get('url'));const title=String(data.get('title')).trim();if(!url||!title){$('#form-error').textContent='이름과 올바른 HTTPS 주소를 입력해 주세요. 로컬 앱은 localhost 또는 127.0.0.1 주소를 사용할 수 있어요.';return;}custom.push({id:crypto.randomUUID(),title,description:String(data.get('description')).trim()||'내가 추가한 웹앱',url,category:data.get('category'),icon:'grid',color:'green',tags:['내가 추가한 앱'],custom:true});save('drawer-apps',custom);$('#app-dialog').close();e.currentTarget.reset();render();toast('새로운 웹앱을 서랍에 넣었어요.');};
$('#privacy').onclick=()=>info('이 허브의 저장 방식',['허브는 일기 내용이나 학생 이름·학번을 읽거나 수집하지 않아요. 외부 앱은 링크로만 연결하며, 해당 앱에서 입력하는 내용은 각 앱의 방식으로 처리돼요.','즐겨찾기와 직접 추가한 앱 이름·주소만 이 브라우저의 저장 공간에 보관해요. 서버 동기화는 없으며 브라우저 데이터를 지우면 함께 지워져요. 비밀키나 개인정보가 포함된 주소는 추가하지 마세요.','기본 연결: 마음말, 알라르간도, 레피숭이의 경경화 체크. 기존 공개 앱의 설명을 바탕으로 연결했으며 각 앱의 전체 데이터 처리와 외부 통신을 감사한 것은 아니에요. 이름 입력이 있는 친구마을과 학생 기록 앱은 기본 모음에서 제외했어요.']);
$('#today').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());
const timer=new Timer(600);let finished=false,audio=null,wakeLock=null;
function initAudio(){if(!$('#sound').checked)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{/* visual finish state remains available */}}
function chime(){if(!$('#sound').checked||!audio)return;try{[523.25,659.25,783.99].forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,audio.currentTime+i*.3);g.gain.linearRampToValueAtTime(.16,audio.currentTime+i*.3+.02);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.3+.8);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+i*.3);o.stop(audio.currentTime+i*.3+.85);});}catch{toast('쉬는 시간이 끝났어요.');}}
async function acquireWakeLock(){try{if(timer.running && !document.hidden && navigator.wakeLock && !wakeLock)wakeLock=await navigator.wakeLock.request('screen');}catch{}}
function releaseWakeLock(){wakeLock?.release().catch(()=>{});wakeLock=null;}
function paintTimer(){
  const left=timer.remaining();
  if(timer.running && left===0){timer.pause();finished=true;chime();releaseWakeLock();}
  const minutes=Math.floor(left/60),seconds=left%60;
  $('#time-display').textContent=`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  $('#time-display').setAttribute('aria-label',`남은 시간 ${minutes}분 ${seconds}초`);
  $('#ring').style.strokeDashoffset=String(1156.106*(1-left/timer.duration));
  $('#timer-view').classList.toggle('ending',left>0 && left<=60);$('#timer-view').classList.toggle('finished',finished);
  const heading=finished?'쉬는 시간이 끝났어요':left<=60&&timer.running?'곧 함께 시작해요':'지금은 쉬는 시간이에요';
  const message=finished?'자리로 돌아와서, 다음 시간을 준비해요.':left<=60&&timer.running?'하던 일을 마무리하고, 천천히 자리로 돌아와요.':'물을 마시고, 몸을 쭉 펴고, 잠깐 쉬어 가요.';
  $('#timer-heading').textContent=heading;$('#timer-message').textContent=message;
  const state=finished?'모두 잘 쉬었나요?':timer.running?'여유롭게 쉬어 가요':left===timer.duration?'준비되면 시작해요':'잠시 멈췄어요';
  if($('#timer-state').textContent!==state)$('#timer-state').textContent=state;
  $('#toggle-label').textContent=timer.running?'잠시 멈춤':finished?'다시 시작':left===timer.duration?'시작하기':'이어가기';
  $('#toggle-timer [data-icon]').innerHTML=icon(timer.running?'pause':'play');
  if(!$('#timer-view').hidden)document.title=finished?'쉬는 시간 끝 · 교실 서랍':`${$('#time-display').textContent} · 쉬는시간 타이머`;
}
function setDuration(seconds){timer.setDuration(seconds);finished=false;releaseWakeLock();$('#minutes').value=seconds/60;document.querySelectorAll('[data-minutes]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.minutes)*60===seconds);b.setAttribute('aria-pressed',String(Number(b.dataset.minutes)*60===seconds));});paintTimer();}
function toggleTimer(){initAudio();if(timer.running){timer.pause();releaseWakeLock();}else{timer.start();finished=false;acquireWakeLock();}paintTimer();}
$('#toggle-timer').onclick=toggleTimer;
$('#reset-timer').onclick=()=>{timer.reset();finished=false;releaseWakeLock();paintTimer();};
document.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>setDuration(Number(b.dataset.minutes)*60));
$('#custom-time').onsubmit=e=>{e.preventDefault();const n=Number($('#minutes').value);if(Number.isInteger(n)&&n>=1&&n<=180)setDuration(n*60);else toast('1분부터 180분까지 정수로 입력해 주세요.');};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('#timer-view').requestFullscreen)await $('#timer-view').requestFullscreen();else toast('이 브라우저는 전체화면을 지원하지 않아요. 브라우저의 화면 확대를 사용해 주세요.');}catch{toast('전체화면을 열 수 없어요. 브라우저의 전체화면 기능을 사용해 주세요.');}};
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').innerHTML=icon('expand')+(document.fullscreenElement?'화면 줄이기':'전체화면');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)wakeLock=null;else{paintTimer();acquireWakeLock();}});
function route(){const isTimer=location.hash==='#timer';$('#hub').hidden=isTimer;$('#timer-view').hidden=!isTimer;if(isTimer){paintTimer();window.scrollTo(0,0);}else document.title='교실 서랍 · 나의 웹앱 허브';}
window.addEventListener('hashchange',route);
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button,a')||document.querySelector('dialog[open]'))return;if(!$('#timer-view').hidden){if(e.code==='Space'){e.preventDefault();toggleTimer();}if(e.key.toLowerCase()==='r')$('#reset-timer').click();}else if(e.key==='/'){e.preventDefault();$('#search').focus();}});
setInterval(paintTimer,200);render();route();paintTimer();
