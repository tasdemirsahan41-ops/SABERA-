const Models=(()=>{
 const $=id=>document.getElementById(id),say=(m,ok)=>{$('mMsg').textContent=m;$('mMsg').className='note '+(ok?'ok':'bad')};
 async function load(){
  const d=await API.call('/api/models'),def=d.default||(d.models[0]||{}).id;
  $('modelList').innerHTML=d.models.map(m=>`<div class="item"><label class="grow"><input type="radio" name="dm" value="${esc(m.id)}" ${def===m.id?'checked':''}><b>${esc(m.name)}</b><div class="note">${esc(m.desc)}</div></label><button class="btn" data-test="${esc(m.id)}">Test et</button></div>`).join('')||'<p class="note bad">Etkin model yok. Yöneticiyle iletişime geçin.</p>';
 }
 function init(){
  $('modelList').onchange=async e=>{try{await API.call('/api/models','PUT',{default:e.target.value});say('Varsayılan model kaydedildi.',1)}catch(x){say(x.message)}};
  $('modelList').onclick=async e=>{const id=e.target.dataset.test;if(!id)return;e.target.disabled=true;say('Test ediliyor…',1);
   try{const d=await API.call('/api/models','POST',{test:id});d.ok?say('Model yanıt veriyor.',1):say('Model hatası: '+d.error)}catch(x){say(x.message)}e.target.disabled=false};
 }
 return{load,init};
})();
