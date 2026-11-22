import {json,fail,body,limit,ip,csrfOk,rand,pbkdf2,now,getSetting,startSession} from '../../_lib/util.js';
export async function onRequestPost({request,env}){
 if(!csrfOk(request))return fail(403,'Geçersiz istek kaynağı.');
 if(!await limit(env,'reg:'+ip(request),5,3600))return fail(429,'Çok fazla kayıt denemesi. Daha sonra tekrar deneyin.');
 const b=await body(request),email=String(b?.email||'').trim().toLowerCase(),pw=String(b?.password||'');
 if(!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)||pw.length<8||pw.length>128)return fail(400,'Geçerli bir e-posta ve en az 8 karakterli parola gerekli.');
 const salt=rand(16),hash=await pbkdf2(pw,salt);
 const role=env.ADMIN_EMAIL&&email===env.ADMIN_EMAIL.toLowerCase()?'admin':'user';
 const lim=+await getSetting(env,'default_daily_limit','100');
 try{
  const r=await env.DB.prepare('INSERT INTO users(email,pass_salt,pass_hash,role,daily_limit,created_at) VALUES(?,?,?,?,?,?) RETURNING id').bind(email,salt,hash,role,lim,now()).first();
  return json({ok:true},201,{'Set-Cookie':await startSession(env,r.id)});
 }catch(e){return fail(409,'Bu e-posta zaten kayıtlı.')}
}
