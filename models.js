import {json,fail,body,needUser,limit} from '../_lib/util.js';
import {enabledModels,runModel} from '../_lib/models.js';
export async function onRequestGet(c){const[u,e]=await needUser(c);if(e)return e;return json({models:await enabledModels(c.env),default:u.default_model})}
// PUT {default:id} = varsayılan model seç
export async function onRequestPut(c){
 const[u,e]=await needUser(c);if(e)return e;
 const b=await body(c.request);
 if(!(await enabledModels(c.env)).some(m=>m.id===b?.default))return fail(400,'Model desteklenmiyor veya devre dışı.');
 await c.env.DB.prepare('UPDATE users SET default_model=? WHERE id=?').bind(b.default,u.id).run();
 return json({ok:true});
}
// POST {test:id} = model bağlantı testi
export async function onRequestPost(c){
 const[u,e]=await needUser(c);if(e)return e;
 if(!await limit(c.env,'mtest:'+u.id,5,60))return fail(429,'Dakikada en fazla 5 test.');
 const b=await body(c.request),m=(await enabledModels(c.env)).find(x=>x.id===b?.test);
 if(!m)return fail(400,'Model desteklenmiyor veya devre dışı.');
 try{await runModel(c.env,m,[{role:'user',content:'Merhaba'}],8,0);return json({ok:true})}
 catch(x){return json({ok:false,error:x.message})}
}
