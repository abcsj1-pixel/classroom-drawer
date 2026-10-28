import test from 'node:test';
import assert from 'node:assert/strict';
import { Timer, safeUrl, selectApps } from '../dist/core.mjs';

test('timer uses elapsed wall time even when a tab is suspended', () => {
  const t = new Timer(600); t.start(1000);
  assert.equal(t.remaining(62000), 539);
  assert.equal(t.remaining(700000), 0);
  assert.equal(t.remaining(900000), 0);
});
test('pause and resume preserve the remaining time; reset restores duration', () => {
  const t = new Timer(300); t.start(1000); t.pause(61000);
  assert.equal(t.remaining(999000), 240);
  t.start(1000000); assert.equal(t.remaining(1030000), 210);
  t.reset(); assert.equal(t.remaining(2000000), 300); assert.equal(t.running, false);
});
test('invalid durations are rejected and changing duration stops a timer', () => {
  const t = new Timer(60); t.start(0); t.setDuration(90);
  assert.equal(t.running, false); assert.equal(t.remaining(10000), 90);
  for (const n of [0, -1, Infinity, NaN, 10801, 1.1]) assert.throws(() => t.setDuration(n));
});
test('links reject executable schemes, credentials, private network and nonlocal HTTP', () => {
  for(const u of ['javascript:alert(1)','data:text/html,bad','https://user:pass@example.org','http://example.org','https://192.168.1.1','file:///tmp/a']) assert.equal(safeUrl(u), null);
  assert.equal(safeUrl('https://example.org/app'), 'https://example.org/app');
  assert.equal(safeUrl('http://127.0.0.1:8765'), 'http://127.0.0.1:8765/');
});
test('student filter never includes local diary; search and favorites intersect', () => {
  const apps=[{id:'a', title:'하루 일기',description:'기록',category:'personal'}, {id:'b',title:'마음말',description:'소통',category:'learning'}];
  assert.deepEqual(selectApps(apps,{category:'student'}).map(a=>a.id),['b']);
  assert.deepEqual(selectApps(apps,{query:'소통',favoritesOnly:true,favorites:['b']}).map(a=>a.id),['b']);
  assert.equal(selectApps(apps,{query:'없음'}).length,0);
});

test('secret-bearing URLs cannot be saved or restored from browser storage', () => {
  for(const url of ['https://example.org/?token=abc','https://example.org/?api_key=abc','https://example.org/#access_token=abc','https://example.org/?email=private@example.org','https://example.org/?student_name=private','https://example.org/?redirect=https://example.net/?secret=abc']) assert.equal(safeUrl(url),null);
  assert.equal(safeUrl('https://example.org/?lesson=3#page2'),'https://example.org/?lesson=3#page2');
});
