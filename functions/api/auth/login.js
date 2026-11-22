import {json,fail,body,limit,ip,csrfOk,pbkdf2,safeEq,startSession,endSession,endCookie} from '../../_lib/util.js';
export async function onRequestPost({request,env}){
 if(!csrfOk(request))return fail(403,'Geçersiz istek kaynağı.');
 if(!await limit(env,'login:'+ip(request),10,300))return fail(429,'Çok fazla giriş denemesi. 5 dakika sonra tekrar deneyin.');
 const b=await body(request),email=String(b?.email||'').trim().toLowerCase(),pw=String(b?.password||'');
 if(!email||!pw||pw.length>128)return fail(400,'E-posta ve parola gerekli.');
 const u=await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
 const h=await pbkdf2(pw,u?u.pass_salt:'0000000000000000000000'); // kullanıcı yokken de aynı işlem süresi
 if(!u||u.disabled||!safeEq(h,u.pass_hash))return fail(401,'E-posta veya parola hatalı.');
 return json({ok:true},200,{'Set-Cookie':await startSession(env,u.id)});
}
// DELETE = çıkış
export async function onRequestDelete({request,env}){
 if(!csrfOk(request))return fail(403,'Geçersiz istek kaynağı.');
 await endSession(env,request);
 return json({ok:true},200,{'Set-Cookie':endCookie});
}
