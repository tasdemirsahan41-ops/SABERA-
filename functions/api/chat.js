import {json,fail,body,limit,ip,logErr,keyUser,sessionUser,csrfOk,quota,now} from '../_lib/util.js';
import {enabledModels,runModel} from '../_lib/models.js';
// Hem "Authorization: Bearer sk-saber-…" (dış istemciler) hem oturum çerezi (web arayüzü) kabul edilir.
export async function onRequestPost({request,env}){
 if(!await limit(env,'ip:'+ip(request),60,60))return fail(429,'Çok fazla istek.');
 let u;
 if(/^Bearer /.test(request.headers.get('Authorization')||''))u=await keyUser(env,request);
 else{if(!csrfOk(request))return fail(403,'Geçersiz istek kaynağı.');u=await sessionUser(env,request)}
 if(!u)return fail(401,'Yetkisiz: geçerli bir API Key veya oturum gerekli.');
 if(!await limit(env,'chat:'+u.id,20,60))return fail(429,'Dakikada en fazla 20 istek.');
 const b=await body(request);
 if(!b||!Array.isArray(b.messages)||!b.messages.length||b.messages.length>40)return fail(400,'Geçersiz istek gövdesi.');
 const msgs=b.messages.map(m=>({role:m?.role,content:String(m?.content??'')}));
 if(msgs.some(m=>!['system','user','assistant'].includes(m.role)||!m.content||m.content.length>8000))return fail(400,'Mesaj biçimi veya uzunluğu geçersiz.');
 const list=await enabledModels(env),id=b.model||u.default_model||list[0]?.id,m=list.find(x=>x.id===id);
 if(!m)return fail(400,'Model desteklenmiyor veya devre dışı.');
 const q=await quota(env,u);
 if(!q.left)return fail(429,'Günlük istek limitine ulaşıldı.');
 const max=Math.min(Math.max(+b.max_tokens||512,16),2048),temp=Math.min(Math.max(+b.temperature||0.7,0),1.5);
 try{
  const r=await runModel(env,m,msgs,max,temp);
  await env.DB.batch([
   env.DB.prepare('INSERT INTO usage(user_id,key_id,model,tin,tout,ok,ts) VALUES(?,?,?,?,?,1,?)').bind(u.id,u.kid??null,id,r.tin,r.tout,now()),
   ...(u.kid?[env.DB.prepare('UPDATE api_keys SET use_count=use_count+1,last_used_at=? WHERE id=?').bind(now(),u.kid)]:[])]);
  return json({content:r.text,model:id,usage:{prompt_tokens:r.tin,completion_tokens:r.tout},remaining:q.left-1});
 }catch(e){
  await logErr(env,'chat',e.message);
  await env.DB.prepare('INSERT INTO usage(user_id,key_id,model,ok,ts) VALUES(?,?,?,0,?)').bind(u.id,u.kid??null,id,now()).run();
  return fail(502,'Model çağrısı başarısız: '+e.message);
 }
}
