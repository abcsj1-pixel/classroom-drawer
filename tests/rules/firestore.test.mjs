import { before, after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, collectionGroup, updateDoc, deleteDoc, serverTimestamp, Timestamp, query, limit, orderBy } from 'firebase/firestore';
let env;
const valid=()=>({date:'2026-10-28',title:'synthetic test',body:'synthetic body',mood:'calm',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
const ref=(db,id='test')=>doc(db,'users','synthetic-a','entries',id);
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-day-pieces',firestore:{host:'127.0.0.1',port:8088,rules:readFileSync('firestore.rules','utf8')}});});
after(async()=>{await env?.cleanup();});
test('anonymous users cannot read, list, create, update or delete',async()=>{
  const db=env.unauthenticatedContext().firestore();
  await assertFails(getDoc(ref(db)));await assertFails(getDocs(query(collection(db,'users','synthetic-a','entries'),limit(200))));
  await assertFails(setDoc(ref(db),valid()));await assertFails(updateDoc(ref(db),{title:'x'}));await assertFails(deleteDoc(ref(db)));
});
test('owner can create, query, update and delete their own entry',async()=>{
  const db=env.authenticatedContext('synthetic-a').firestore();await assertSucceeds(setDoc(ref(db,'own'),valid()));
  await assertSucceeds(getDoc(ref(db,'own')));await assertSucceeds(getDocs(query(collection(db,'users','synthetic-a','entries'),orderBy('date','desc'),limit(200))));
  await assertSucceeds(updateDoc(ref(db,'own'),{title:'changed',updatedAt:serverTimestamp()}));await assertSucceeds(deleteDoc(ref(db,'own')));
});
test('a second signed-in user cannot access another users entries',async()=>{
  const db=env.authenticatedContext('synthetic-b').firestore();
  await assertFails(getDoc(ref(db)));await assertFails(getDocs(query(collection(db,'users','synthetic-a','entries'),limit(200))));await assertFails(setDoc(ref(db),valid()));await assertFails(updateDoc(ref(db),{title:'x'}));await assertFails(deleteDoc(ref(db)));
});
test('create validates required fields, size, types, mood, date and arbitrary roles',async()=>{
  const db=env.authenticatedContext('synthetic-a').firestore();let i=0;
  for(const patch of [{title:'x'.repeat(201)},{body:'x'.repeat(100001)},{body:1},{body:'   '},{mood:'admin'},{date:'2026-02-30'},{createdAt:Timestamp.fromMillis(0)},{role:'admin'},{ownerUid:'synthetic-b'}])await assertFails(setDoc(ref(db,'invalid-'+i++),{...valid(),...patch}));
  const missing=valid();delete missing.body;await assertFails(setDoc(ref(db,'missing'),missing));
});
test('update cannot bypass validation, remove required fields or change creation time',async()=>{
  const db=env.authenticatedContext('synthetic-a').firestore();await assertSucceeds(setDoc(ref(db,'update'),valid()));
  for(const patch of [{body:'x'.repeat(100001)},{title:123},{mood:'admin'},{createdAt:Timestamp.fromMillis(0)},{role:'admin'},{updatedAt:Timestamp.fromMillis(0)}])await assertFails(updateDoc(ref(db,'update'),{...patch, ...(Object.hasOwn(patch,'updatedAt')?{}:{updatedAt:serverTimestamp()})}));
  await assertFails(setDoc(ref(db,'update'),{title:'only title',updatedAt:serverTimestamp()}));
});
test('profiles, recursive collection queries and unbounded lists are denied',async()=>{
  const db=env.authenticatedContext('synthetic-a').firestore();
  await assertFails(setDoc(doc(db,'users','synthetic-a'),{role:'admin'}));await assertFails(getDocs(collection(db,'users','synthetic-a','entries')));
  await assertFails(getDocs(query(collectionGroup(db,'entries'),limit(200))));
});
test('real calendar boundaries and multiline Korean text are supported',async()=>{
  const db=env.authenticatedContext('synthetic-a').firestore();
  await assertSucceeds(setDoc(ref(db,'leap'),{...valid(),date:'2024-02-29',body:'첫 줄\n\n마지막 줄'}));
  await assertFails(setDoc(ref(db,'nonleap'),{...valid(),date:'2025-02-29'}));
  await assertFails(setDoc(ref(db,'badmonth'),{...valid(),date:'2026-13-01'}));
});
