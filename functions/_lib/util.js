// Ortak yardımcılar: yanıt, hash, oturum, anahtar, hız sınırı, kota.
export const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...h}});
export const fail=(s,m)=>json({error:m},s);
export const now=()=>Math.floor(Date.now()/1000);
export const dayStart=()=>now()-now()%86400;
export const ip=r=>r.headers.get('CF-Connecting-IP')||'0';
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export const rand=n=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
export const sha=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
export async function pbkdf2(pw,salt){const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:100000},k,256))}
export function safeEq(a,b){if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}
export async function body(req){if(!(req.headers.get('content-type')||'').includes('application/json'))return null;try{return await req.json()}catch{return null}}
export async function getSetting(env,k,d){const r=await env.DB.prepare('SELECT v FROM settings WHERE k=?').bind(k).first();return r?r.v:d}
export async function limit(env,key,max,win){const w=now()-now()%win;if(Math.random()<0.02)await env.DB.prepare('DELETE FROM rate WHERE w<?').bind(now()-86400).run();const r=await env.DB.prepare('INSERT INTO rate(k,w,c) VALUES(?,?,1) ON CONFLICT(k,w) DO UPDATE SET c=c+1 RETURNING c').bind(key,w).first();return r.c<=max}
export async function logErr(env,route,msg){try{await env.DB.prepare('INSERT INTO errors(ts,route,msg) VALUES(?,?,?)').bind(now(),route,String(msg).slice(0,300)).run()}catch{}}
// Oturum: rastgele jeton çerezde, veritabanında yalnızca hash'i.
const CK='saber_session',TTL=7*86400;
export const endCookie=`${CK}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
const ck=r=>(r.headers.get('Cookie')||'').split(/;\s*/).find(c=>c.startsWith(CK+'='))?.slice(CK.length+1);
export async function startSession(env,uid){const t=rand(32);await env.DB.prepare('INSERT INTO sessions(h,uid,exp) VALUES(?,?,?)').bind(await sha(t),uid,now()+TTL).run();return `${CK}=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL}`}
export async function sessionUser(env,r){const t=ck(r);return t?env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.uid WHERE s.h=? AND s.exp>? AND u.disabled=0').bind(await sha(t),now()).first():null}
export async function endSession(env,r){const t=ck(r);if(t)await env.DB.prepare('DELETE FROM sessions WHERE h=?').bind(await sha(t)).run()}
export const csrfOk=r=>{if(r.method==='GET'||r.method==='HEAD')return true;const o=r.headers.get('Origin');return !o||o===new URL(r.url).origin};
export async function needUser({env,request},admin=false){
 if(!csrfOk(request))return[null,fail(403,'Geçersiz istek kaynağı.')];
 const u=await sessionUser(env,request);
 if(!u)return[null,fail(401,'Oturum gerekli.')];
 if(admin&&u.role!=='admin')return[null,fail(403,'Yönetici yetkisi gerekli.')];
 return[u,null];
}
// API Key: sk-saber-<rastgele>. Veritabanında yalnızca SHA-256 hash'i saklanır.
const KEY_TTL=90*86400;
export async function makeKey(env,uid){const raw='sk-saber-'+rand(32),t=now();await env.DB.prepare('INSERT INTO api_keys(user_id,prefix,key_hash,created_at,expires_at) VALUES(?,?,?,?,?)').bind(uid,raw.slice(0,15),await sha(raw),t,t+KEY_TTL).run();return{key:raw,prefix:raw.slice(0,15),expires_at:t+KEY_TTL}}
export async function keyUser(env,r){const m=(r.headers.get('Authorization')||'').match(/^Bearer\s+(sk-saber-[\w-]{20,})$/);if(!m)return null;return env.DB.prepare('SELECT k.id kid,u.* FROM api_keys k JOIN users u ON u.id=k.user_id WHERE k.key_hash=? AND k.revoked_at IS NULL AND k.expires_at>? AND u.disabled=0').bind(await sha(m[1]),now()).first()}
export async function quota(env,u){const r=await env.DB.prepare('SELECT COUNT(*) c FROM usage WHERE user_id=? AND ts>=? AND ok=1').bind(u.id,dayStart()).first();return{used:r.c,limit:u.daily_limit,left:Math.max(0,u.daily_limit-r.c)}}
