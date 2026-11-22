import {json,needUser,quota} from '../_lib/util.js';
export async function onRequestGet(c){
 const[u,e]=await needUser(c);if(e)return e;
 const db=c.env.DB,id=u.id;
 const [tot,keys,hist,models]=await Promise.all([
  db.prepare('SELECT COUNT(*) n,COALESCE(SUM(tin+tout),0) t,MAX(ts) l FROM usage WHERE user_id=? AND ok=1').bind(id).first(),
  db.prepare('SELECT id,prefix,created_at,expires_at,revoked_at,last_used_at,use_count FROM api_keys WHERE user_id=? ORDER BY id DESC').bind(id).all(),
  db.prepare('SELECT ts,model,tin,tout,ok FROM usage WHERE user_id=? ORDER BY id DESC LIMIT 30').bind(id).all(),
  db.prepare('SELECT model,COUNT(*) n FROM usage WHERE user_id=? AND ok=1 GROUP BY model').bind(id).all()]);
 return json({total:tot.n,tokens:tot.t,last_used:tot.l,quota:await quota(c.env,u),keys:keys.results,history:hist.results,models:models.results});
}
