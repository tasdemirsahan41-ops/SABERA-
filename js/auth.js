(()=>{
 const f=document.getElementById('authForm');if(!f)return;
 const reg=f.dataset.mode==='register',$=id=>document.getElementById(id);
 f.onsubmit=async e=>{
  e.preventDefault();const m=$('msg'),b=f.querySelector('button');b.disabled=true;m.className='note';m.textContent='';
  try{await API.call('/api/auth/'+(reg?'register':'login'),'POST',{email:$('email').value,password:$('password').value});location.href='index.html'}
  catch(x){m.textContent=x.message;m.className='note bad'}
  b.disabled=false;
 };
})();
