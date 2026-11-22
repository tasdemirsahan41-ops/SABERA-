import {json,fail,needUser,makeKey,now} from '../../_lib/util.js';
export async function onRequestPost(c){
 const[u,e]=await needUser(c);if(e)return e;
 const n=await c.env.DB.prepare('SELECT COUNT(*) c FROM api_keys WHERE user_id=? AND revoked_at IS NULL AND expires_at>?').bind(u.id,now()).first();
 if(n.c>=5)return fail(409,'En fazla 5 etkin anahtar olabilir. Birini iptal edin.');
 return json(await makeKey(c.env,u.id),201); // tam anahtar yalnızca burada döner
}
