import {json,fail,body,needUser,now,getSetting} from '../../_lib/util.js';
import {MODELS,enabledModels} from '../../_lib/models.js';
export async function onRequestGet(c){
 const[u,e]=await needUser(c,true);if(e)return e;
 const db=c.env.DB,t=now()-86400,n=async(q,...a)=>(await db.prepare(q).bind(...a).first()).n;
 const on=(await enabledModels(c.env)).map(m=>m.id);
 return json({
  status:{users:await n('SELECT COUNT(*) n FROM users'),keys:await n('SELECT COUNT(*) n FROM api_keys WHERE revoked_at IS NULL AND expires_at>?',now()),requests:await n('SELECT COUNT(*) n FROM usage WHERE ts>?',t),errors:await n('SELECT COUNT(*) n FROM errors WHERE ts>?',t),ai:!!c.env.AI},
  settings:{default_daily_limit:+await getSetting(c.env,'default_daily_limit','100')},
  models:MODELS.map(m=>({id:m.id,name:m.name,on:on.includes(m.id)})),
  errors:(await db.prepare('SELECT ts,route,msg FROM errors ORDER BY id DESC LIMIT 20').all()).results});
}
export async function onRequestPut(c){
 const[u,e]=await needUser(c,true);if(e)return e;
 const b=await body(c.request),db=c.env.DB,st=[];
 const set=(k,v)=>db.prepare('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k,v);
 if('default_daily_limit' in b){const n=b.default_daily_limit;if(!Number.isInteger(n)||n<1||n>100000)return fail(400,'Limit 1-100000 arasında olmalı.');st.push(set('default_daily_limit',String(n)))}
 if('enabled_models' in b){const a=b.enabled_models;if(!Array.isArray(a)||!a.length||a.some(i=>!MODELS.some(m=>m.id===i)))return fail(400,'Geçersiz model listesi (en az bir model seçili olmalı).');st.push(set('enabled_models',JSON.stringify(a)))}
 if(!st.length)return fail(400,'Değişiklik yok.');
 await db.batch(st);return json({ok:true});
}
