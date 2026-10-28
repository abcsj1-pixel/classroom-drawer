export function validateEntry(input) {
  if (!input || Object.keys(input).length !== 4 || !['date','title','body','mood'].every(k=>Object.hasOwn(input,k))) throw new Error('일기 형식이 올바르지 않아요.');
  const {date,title,body,mood}=input;
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'0100-01-01'||date>'9999-12-31') throw new Error('올바른 날짜를 선택해 주세요.');
  const parsed=new Date(date+'T12:00:00Z');
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date) throw new Error('실제로 있는 날짜를 선택해 주세요.');
  if(typeof title!=='string'||title.length>200) throw new Error('제목은 200자까지 적을 수 있어요.');
  if(typeof body!=='string'||!body.trim()||body.length>100000) throw new Error('본문은 1자부터 100,000자까지 적을 수 있어요.');
  if(!['','happy','calm','ordinary','sad','tired'].includes(mood)) throw new Error('기분을 다시 선택해 주세요.');
  return {date,title,body,mood};
}
export function entryPath(uid,id) {
  if(![uid,id].every(v=>typeof v==='string' && /^[A-Za-z0-9_-]{1,128}$/.test(v))) throw new Error('로그인 또는 기록 정보가 올바르지 않아요.');
  return `users/${uid}/entries/${id}`;
}
export function filterEntries(entries,{q='',date='',month=''}={}) {
  const text=q.trim().toLocaleLowerCase();
  return entries.filter(e=>(!date||e.date===date)&&(!month||e.date.startsWith(month+'-'))&&(!text||`${e.title} ${e.body}`.toLocaleLowerCase().includes(text))).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
}
export class SessionScope {
  constructor(){this.uid=null;this.version=0;}
  setUser(uid){this.uid=uid;this.version++;}
  capture(){if(!this.uid)throw new Error('먼저 Google 계정으로 로그인해 주세요.');return {uid:this.uid,version:this.version};}
  isCurrent(snapshot){return !!this.uid && this.uid===snapshot.uid && this.version===snapshot.version;}
  apply(snapshot,update){if(!this.isCurrent(snapshot))return false;update();return true;}
}
