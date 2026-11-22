import {json,fail,body,needUser,now,dayStart} from '../../_lib/util.js';
export async function onRequestGet(c){
 const[u,e]=await needUser(c,true);if(e)return e;
 const r=await c.env.DB.prepare('SELECT u.id,u.email,u.role,u.daily_limit,u.disabled,u.created_at,(SELECT COUNT(*) FROM api_keys k WHERE k.user_id=u.id AND k.revoked_at IS NULL AND k.expires_at>?) keys,(SELECT COUNT(*) FROM usage x WHERE x.user_id=u.id AND x.ts>=? AND x.ok=1) today FROM users u ORDER BY u.id LIMIT 200').bind(now(),dayStart()).all();
 return json({users:r.results});
}
export async function onRequestPatch(c){
 const[u,e]=await needUser(c,true);if(e)return e;
 const b=await body(c.request),id=+b?.id;if(!id)return fail(400,'Geçersiz kullanıcı.');
 const db=c.env.DB,st=[];
 if('daily_limit' in b){const n=b.daily_limit;if(!Number.isInteger(n)||n<0||n>100000)return fail(400,'Limit 0-100000 arasında tam sayı olmalı.');st.push(db.prepare('UPDATE users SET daily_limit=? WHERE id=?').bind(n,id))}
 if('disabled' in b){if(id===u.id)return fail(400,'Kendi hesabınızı askıya alamazsınız.');const d=b.disabled?1:0;st.push(db.prepare('UPDATE users SET disabled=? WHERE id=?').bind(d,id));if(d)st.push(db.prepare('DELETE FROM sessions WHERE uid=?').bind(id))}
 if(b.revoke_keys)st.push(db.prepare('UPDATE api_keys SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').bind(now(),id));
 if(!st.length)return fail(400,'Değişiklik yok.');
 await db.batch(st);return json({ok:true});
}
