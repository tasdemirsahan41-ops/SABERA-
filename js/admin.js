(()=>{
 const $=id=>document.getElementById(id),say=(m,ok)=>{$('sMsg').textContent=m;$('sMsg').className='note '+(ok?'ok':'bad')};
 async function load(){
  const s=await API.call('/api/admin/settings'),u=await API.call('/api/admin/users');
  $('sys').innerHTML=Object.entries({'Kullanıcı':s.status.users,'Etkin anahtar':s.status.keys,'24 sa. istek':s.status.requests,'24 sa. hata':s.status.errors,'Workers AI':s.status.ai?'Bağlı':'Bağlı değil'}).map(([a,b])=>`<div class="stat"><span class="note">${a}</span><b>${esc(b)}</b></div>`).join('');
  $('dl').value=s.settings.default_daily_limit;
  $('am').innerHTML=s.models.map(m=>`<label><input type="checkbox" value="${esc(m.id)}" ${m.on?'checked':''}>${esc(m.name)}</label>`).join('');
  $('ut').innerHTML='<tr><th>E-posta</th><th>Rol</th><th>Limit</th><th>Bugün</th><th>Anahtar</th><th>Durum</th><th></th></tr>'+u.users.map(x=>`<tr><td>${esc(x.email)}</td><td>${esc(x.role)}</td><td>${x.daily_limit}</td><td>${x.today}</td><td>${x.keys}</td><td>${x.disabled?'Askıda':'Etkin'}</td><td><button class="btn" data-a="lim" data-id="${x.id}">Limit</button> <button class="btn" data-a="dis" data-id="${x.id}" data-v="${x.disabled?0:1}">${x.disabled?'Etkinleştir':'Askıya al'}</button> <button class="btn danger" data-a="rev" data-id="${x.id}">Anahtarları iptal et</button></td></tr>`).join('');
  $('errs').innerHTML=s.errors.map(e=>`<p class="note">${fd(e.ts)} · ${esc(e.route)} · ${esc(e.msg)}</p>`).join('')||'<p class="note">Kayıtlı hata yok.</p>';
 }
 $('ut').onclick=async e=>{
  const a=e.target.dataset.a;if(!a)return;const b={id:+e.target.dataset.id};
  if(a==='lim'){const v=prompt('Günlük istek limiti:');if(v===null)return;b.daily_limit=+v}
  else if(a==='dis')b.disabled=+e.target.dataset.v;
  else{if(!confirm('Kullanıcının tüm anahtarları iptal edilsin mi?'))return;b.revoke_keys=true}
  try{await API.call('/api/admin/users','PATCH',b);load()}catch(x){say(x.message)}
 };
 $('saveSet').onclick=async()=>{try{await API.call('/api/admin/settings','PUT',{default_daily_limit:+$('dl').value,enabled_models:[...document.querySelectorAll('#am input:checked')].map(i=>i.value)});say('Kaydedildi.',1);load()}catch(x){say(x.message)}};
 load().catch(()=>{location.href='index.html'}); // 401 → api.js girişe yollar; 403 → sohbete döner (asıl denetim sunucuda)
})();
