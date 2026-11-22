// Tüm sayfaların ortak istemci katmanı. Oturum HttpOnly çerezde; JS hiçbir gizli bilgi tutmaz.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fd=t=>t?new Date(t*1000).toLocaleString('tr-TR'):'—';
const API={
 async call(path,method='GET',body){
  let r;
  try{r=await fetch(path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined})}
  catch(e){throw new Error('Sunucuya ulaşılamadı.')}
  const d=await r.json().catch(()=>({}));
  if(r.status===401&&!/login|register/.test(location.pathname)){location.href='login.html';throw new Error('Oturum gerekli.')}
  if(!r.ok)throw new Error(d.error||'Sunucu hatası ('+r.status+').');
  return d;
 },
 me:()=>API.call('/api/auth/me'),
 async logout(){try{localStorage.removeItem('saber:chats');await API.call('/api/auth/login','DELETE')}catch(e){}location.href='login.html'}
};
// chat.js'in kullandığı arayüz: her zaman gerçek sunucuya gider, sahte cevap yok.
const AI={
 async status(){try{const m=await API.me();return{ok:true,msg:m.email+' · bugün kalan istek: '+m.quota.left}}catch(e){return{ok:false,msg:e.message}}},
 async chat(msgs,onTok){const d=await API.call('/api/chat','POST',{messages:msgs.slice(-30)});onTok(d.content)}
};
