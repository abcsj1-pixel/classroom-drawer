import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, collection, doc, query, orderBy, documentId, limit, startAfter, getDocsFromServer, runTransaction, serverTimestamp, deleteDoc } from 'firebase/firestore';

export async function createBackend() {
  const response=await fetch(new URL('./firebase-config.json',import.meta.url),{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw new Error('Firebase 설정을 준비 중이에요. 아직 로그인하거나 일기를 저장할 수 없어요.');
  const config=await response.json();
  if(!['apiKey','authDomain','projectId','appId'].every(k=>typeof config[k]==='string'&&config[k]))throw new Error('Firebase 설정을 확인해 주세요.');
  const app=initializeApp(config);
  const auth=initializeAuth(app,{persistence:browserSessionPersistence,popupRedirectResolver:browserPopupRedirectResolver});
  const db=initializeFirestore(app,{localCache:memoryLocalCache()});
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  function requireOwner(uid){if(!uid || auth.currentUser?.uid!==uid)throw new Error('로그인이 바뀌었어요. 다시 로그인해 주세요.');}
  function entryRef(uid,id){requireOwner(uid);return doc(db,'users',uid,'entries',id);}
  return {
    observe: callback=>onAuthStateChanged(auth,callback),
    login: ()=>signInWithPopup(auth,provider),
    logout: ()=>signOut(auth),
    async list(uid,cursor=null){
      requireOwner(uid);
      const clauses=[orderBy('date','desc'),orderBy(documentId(),'desc'),limit(200)];
      if(cursor)clauses.push(startAfter(cursor));
      const result=await getDocsFromServer(query(collection(db,'users',uid,'entries'),...clauses));
      requireOwner(uid);
      return {entries:result.docs.map(d=>({id:d.id,...d.data()})),cursor:result.docs.at(-1)||null,hasMore:result.size===200};
    },
    async save(uid,id,draft){
      const ref=entryRef(uid,id);
      await runTransaction(db,async tx=>{
        requireOwner(uid);const existing=await tx.get(ref);
        if(existing.exists())tx.update(ref,{...draft,updatedAt:serverTimestamp()});
        else tx.set(ref,{...draft,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      });
      requireOwner(uid);return {id,...draft};
    },
    async remove(uid,id){await deleteDoc(entryRef(uid,id));requireOwner(uid);}
  };
}
