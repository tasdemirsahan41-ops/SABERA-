(()=>{
 const $=id=>document.getElementById(id),T=['keys','models','usage','account'];
 const say=(id,m,ok)=>{const n=$(id);n.textContent=m;n.className='note '+(ok?'ok':'bad')};
 function tab(){
  let t=location.hash.slice(1);if(!T.includes(t))t='keys';
  document.querySelectorAll('.tab').forEach(s=>s.hidden=s.id!==t);
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  if(t==='models')Models.load().catch(e=>say('mMsg',e.message));
  if(t==='account')Settings.load().catch(()=>{});
 }
 async function load(){
  const d=await API.call('/api/usage'),t=Date.now()/1000,q=d.quota;
  const st=k=>k.revoked_at?'İptal edildi':k.expires_at<t?'Süresi doldu':'Etkin';
  $('keyList').innerHTML=d.keys.map(k=>{const s=st(k),on=s==='Etkin';return `<div class="item"><div><b>${esc(k.prefix)}…</b> <span class="chip ${on?'ok':'bad'}">${s}</span><div class="note">Bitiş: ${fd(k.expires_at)} · Kullanım: ${k.use_count} · Son: ${fd(k.last_used_at)}</div></div>${on?`<div class="row"><button class="btn" data-rot="${k.id}">Yenile</button><button class="btn danger" data-rev="${k.id}">İptal et</button></div>`:''}</div>`}).join('')||'<p class="note">Henüz anahtar yok.</p>';
  $('stats').innerHTML=[['Toplam istek',d.total],['Bugün',q.used],['Kalan',q.left+' / '+q.limit],['Etkin anahtar',d.keys.filter(k=>st(k)==='Etkin').length],['Son kullanım',fd(d.last_used)],['Toplam token',d.tokens]].map(([a,b])=>`<div class="stat"><span class="note">${a}</span><b>${esc(b)}</b></div>`).join('');
  $('usedModels').textContent=d.models.length?'Kullanılan modeller: '+d.models.map(m=>m.model+' ('+m.n+')').join(', '):'Henüz istek yok.';
  $('hist').innerHTML='<tr><th>Zaman</th><th>Model</th><th>Token</th><th>Durum</th></tr>'+d.history.map(h=>`<tr><td>${fd(h.ts)}</td><td>${esc(h.model||'—')}</td><td>${h.tin+h.tout}</td><td>${h.ok?'Başarılı':'Hata'}</td></tr>`).join('');
 }
 const fresh=k=>{$('fresh').hidden=false;$('freshKey').textContent=k.key};
 $('mk').onclick=async()=>{try{fresh(await API.call('/api/keys/create','POST'));say('kMsg','Anahtar oluşturuldu.',1);load()}catch(e){say('kMsg',e.message)}};
 $('keyList').onclick=async e=>{
  const r=e.target.dataset.rot,v=e.target.dataset.rev;if(!r&&!v)return;
  if(!confirm(r?'Bu anahtar iptal edilip yenisi üretilecek. Devam?':'Anahtar kalıcı olarak iptal edilecek. Devam?'))return;
  try{if(r)fresh(await API.call('/api/keys/rotate','POST',{id:+r}));else await API.call('/api/keys/revoke','POST',{id:+v});say('kMsg',r?'Anahtar yenilendi, eskisi iptal edildi.':'Anahtar iptal edildi.',1);load()}catch(x){say('kMsg',x.message)}
 };
 $('cpKey').onclick=()=>navigator.clipboard.writeText($('freshKey').textContent).then(()=>say('kMsg','Kopyalandı.',1),()=>say('kMsg','Kopyalanamadı; metni elle seçin.'));
 $('vBtn').onclick=async()=>{try{const d=await API.call('/api/keys/validate','POST',{key:$('vk').value.trim()});say('vMsg',d.valid?'Geçerli · bitiş '+fd(d.expires_at)+' · kullanım '+d.use_count:'Geçersiz, iptal edilmiş veya süresi dolmuş.',d.valid)}catch(e){say('vMsg',e.message)}};
 document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>location.hash=b.dataset.t);
 Settings.init();Models.init();addEventListener('hashchange',tab);tab();load().catch(e=>say('kMsg',e.message));
})();
