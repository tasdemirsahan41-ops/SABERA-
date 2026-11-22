import {json,fail,body,limit,ip,sha,now} from '../../_lib/util.js';
// Oturum gerektirmez: Authorization: Bearer <key> veya {"key":"..."}.
export async function onRequestPost({request,env}){
 if(!await limit(env,'val:'+ip(request),30,60))return fail(429,'Çok fazla deneme.');
 const b=await body(request),raw=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/,'')||String(b?.key||'');
 if(!/^sk-saber-[\w-]{20,}$/.test(raw))return json({valid:false});
 const k=await env.DB.prepare('SELECT k.expires_at,k.use_count,k.revoked_at,u.daily_limit,u.disabled FROM api_keys k JOIN users u ON u.id=k.user_id WHERE k.key_hash=?').bind(await sha(raw)).first();
 const ok=!!k&&!k.revoked_at&&!k.disabled&&k.expires_at>now();
 return json(ok?{valid:true,expires_at:k.expires_at,use_count:k.use_count,daily_limit:k.daily_limit}:{valid:false});
}
