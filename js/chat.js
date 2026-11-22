const Chat=(()=>{
 const $=id=>document.getElementById(id);
 let chats=Store.get('chats',[]),cur=null,busy=false;
 const save=()=>Store.set('chats',chats);
 const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const inl=s=>s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
 function md(t){
  const B=[];
  t=t.replace(/```(\w*)\n?([\s\S]*?)(```|$)/g,(m,l,c)=>{B.push('<div class="code"><div class="ch"><span>'+esc(l||'kod')+'</span><button data-c>Kopyala</button></div><pre><code>'+esc(c.replace(/\n$/,''))+'</code></pre></div>');return '\u0001'+(B.length-1)+'\u0001'});
  let out='',list=null,m;
  const close=()=>{if(list){out+='</'+list+'>';list=null}};
  for(const raw of esc(t).split('\n')){
   if(m=raw.match(/^\u0001(\d+)\u0001$/)){close();out+=B[m[1]]}
   else if(m=raw.match(/^(#{1,3})\s+(.*)/)){close();const n=m[1].length+2;out+='<h'+n+'>'+inl(m[2])+'</h'+n+'>'}
   else if(m=raw.match(/^\s*([-*]|\d+\.)\s+(.*)/)){const tg=/\d/.test(m[1])?'ol':'ul';if(list!==tg){close();out+='<'+tg+'>';list=tg}out+='<li>'+inl(m[2])+'</li>'}
   else if(!raw.trim())close();
   else{close();out+='<p>'+inl(raw)+'</p>'}
  }
  close();return out;
 }
 function copy(text,btn){
  const o=btn.textContent,done=()=>{btn.textContent='Kopyalandı ✓';setTimeout(()=>btn.textContent=o,1200)};
  const fb=()=>{const t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();try{document.execCommand('copy')?done():btn.textContent='Kopyalanamadı'}catch(e){btn.textContent='Kopyalanamadı'}t.remove()};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(done,fb);else fb();
 }
 function bubble(m){
  const d=document.createElement('div');d.className='msg '+m.r;
  const b=document.createElement('div');b.className='bub';
  if(m.r==='ai')b.innerHTML=md(m.t);else b.textContent=m.t;
  d.appendChild(b);
  if(m.r!=='err'){const c=document.createElement('button');c.className='cp';c.textContent='Kopyala';c.onclick=()=>copy(m.t,c);d.appendChild(c)}
  return d;
 }
 const scroll=()=>{const b=$('msgs');b.scrollTop=b.scrollHeight};
 function renderAll(){
  [...$('msgs').querySelectorAll('.msg')].forEach(n=>n.remove());
  $('empty').hidden=!!(cur&&cur.msgs.length);
  if(cur)cur.msgs.forEach(m=>$('msgs').appendChild(bubble(m)));scroll();
 }
 function renderHistory(){
  const h=$('history');h.innerHTML='';
  if(!chats.length){h.innerHTML='<p class="note">Henüz sohbet yok.</p>';return}
  chats.forEach(c=>{
   const r=document.createElement('div');r.className='hi'+(cur===c?' on':'');
   const b=document.createElement('button');b.textContent=c.title;
   b.onclick=()=>{if(busy)return;cur=c;renderAll();renderHistory();Saber.show('chat');Saber.drawer(false)};
   const x=document.createElement('button');x.textContent='✕';x.setAttribute('aria-label','Sohbeti sil');
   x.onclick=()=>{if(busy)return;chats=chats.filter(k=>k!==c);if(cur===c)cur=null;save();renderAll();renderHistory()};
   r.append(b,x);h.appendChild(r);
  });
 }
 async function send(){
  const inp=$('input'),t=inp.value.trim();if(!t||busy)return;
  if(!cur){cur={id:Date.now().toString(36),title:t.slice(0,32),msgs:[]};chats.unshift(cur)}
  const chat=cur;inp.value='';inp.style.height='auto';
  chat.msgs.push({r:'user',t});
  const hist=chat.msgs.filter(m=>m.r!=='err').map(m=>({role:m.r==='ai'?'assistant':'user',content:m.t}));
  renderAll();
  const m={r:'ai',t:''},d=bubble(m),b=d.firstChild,cp=d.querySelector('.cp');
  b.innerHTML='<span class="dots"><i></i><i></i><i></i></span>';cp.hidden=true;
  $('msgs').appendChild(d);scroll();busy=true;$('send').disabled=true;renderHistory();
  try{
   await AI.chat(hist,tok=>{m.t+=tok;b.innerHTML=md(m.t);scroll()});
   if(!m.t.trim())throw new Error('Model boş yanıt döndürdü.');
   chat.msgs.push(m);cp.hidden=false;
  }catch(e){d.remove();chat.msgs.push({r:'err',t:e.message});$('msgs').appendChild(bubble({r:'err',t:e.message}));scroll()}
  busy=false;$('send').disabled=false;save();
 }
 async function status(){const s=await AI.status(),e=$('engLine');e.textContent=s.msg;e.className='chip '+(s.ok?'ok':'bad')}
 function newChat(){if(busy)return;cur=null;renderAll();renderHistory()}
 function init(){
  const inp=$('input');
  $('send').onclick=send;
  inp.oninput=()=>{inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,140)+'px'};
  inp.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&matchMedia('(pointer:fine)').matches){e.preventDefault();send()}};
  $('msgs').onclick=e=>{const b=e.target.closest('[data-c]');if(b)copy(b.closest('.code').querySelector('code').textContent,b)};
  renderAll();renderHistory();status();
 }
 return{init,newChat,status};
})();
