import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, entryPath, filterEntries, SessionScope } from '../dist/diary/model.mjs';

test('entry input rejects impossible dates, invalid moods, empty body and oversized fields',()=>{
  const good={date:'2026-10-28',title:'제목',body:'오늘의 이야기',mood:'calm'};
  assert.deepEqual(validateEntry(good),good);
  for(const patch of [{date:'2026-02-30'},{date:'2026-13-01'},{mood:'admin'},{body:'  '},{title:'x'.repeat(201)},{body:'x'.repeat(100001)},{body:2}]) assert.throws(()=>validateEntry({...good,...patch}));
  assert.throws(()=>validateEntry({...good,owner:'other'}));
});
test('entry paths are scoped to a single explicit UID and reject path traversal',()=>{
  assert.equal(entryPath('user-a','entry-1'),'users/user-a/entries/entry-1');
  for(const [u,id] of [['','x'],['user-a','../b'],['user-a/entries/b','x'],['user-a','']]) assert.throws(()=>entryPath(u,id));
});
test('date, month and free text filters operate only on explicitly supplied private entries',()=>{
  const entries=[{id:'a',date:'2026-10-28',title:'<script>',body:'소중한 하루'},{id:'b',date:'2026-09-01',title:'가을',body:'기록'}];
  assert.deepEqual(filterEntries(entries,{q:'소중한'}).map(e=>e.id),['a']);
  assert.deepEqual(filterEntries(entries,{month:'2026-09'}).map(e=>e.id),['b']);
  assert.equal(filterEntries(entries,{date:'2026-09-02'}).length,0);
});
test('pending requests are rejected after logout and after switching to another account',()=>{
  const scope=new SessionScope();scope.setUser('user-a');const old=scope.capture();
  assert.equal(scope.isCurrent(old),true);scope.setUser(null);assert.equal(scope.isCurrent(old),false);
  scope.setUser('user-b');assert.equal(scope.isCurrent(old),false);
  scope.setUser('user-a');assert.equal(scope.isCurrent(old),false);
});

test('late completion of an old operation cannot alter the new account screen',async()=>{
  const scope=new SessionScope();scope.setUser('user-a');const old=scope.capture();
  let screen='user-b blank screen';scope.setUser(null);scope.setUser('user-b');
  const applied=scope.apply(old,()=>{screen='old private response';});
  assert.equal(applied,false);assert.equal(screen,'user-b blank screen');
  assert.equal(scope.apply(scope.capture(),()=>{screen='current user response';}),true);
  assert.equal(screen,'current user response');
});
