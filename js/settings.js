const Settings=(()=>{
 const $=id=>document.getElementById(id);
 function theme(t){document.body.dataset.theme=t;try{localStorage.setItem('saber:theme',t)}catch(e){}document.querySelectorAll('.th').forEach(b=>b.classList.toggle('on',b.dataset.th===t))}
 async function load(){const m=await API.me();$('acc').textContent=m.email+' · rol: '+m.role+' · günlük limit: '+m.quota.limit;if(m.role==='admin')$('adminLink').hidden=false}
 function init(){
  theme(localStorage.getItem('saber:theme')||'dark');
  document.querySelectorAll('.th').forEach(b=>b.onclick=()=>theme(b.dataset.th));
  $('out').onclick=API.logout;
 }
 return{load,init};
})();
