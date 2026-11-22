import {json,fail,body,needUser,makeKey,now} from '../../_lib/util.js';
export async function onRequestPost(c){
 const[u,e]=await needUser(c);if(e)return e;
 const id=+(await body(c.request))?.id;
 const r=await c.env.DB.prepare('UPDATE api_keys SET revoked_at=? WHERE id=? AND user_id=? AND revoked_at IS NULL').bind(now(),id,u.id).run();
 if(!r.meta.changes)return fail(404,'Etkin anahtar bulunamadı.');
 return json(await makeKey(c.env,u.id),201);
}
