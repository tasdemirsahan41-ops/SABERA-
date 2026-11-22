(()=>{
 const $=id=>document.getElementById(id);
 try{document.body.dataset.theme=localStorage.getItem('saber:theme')||'dark'}catch(e){}
 window.Saber={show(){},drawer:o=>document.body.classList.toggle('drawer',o)};
 $('menuBtn').onclick=()=>Saber.drawer(true);
 $('scrim').onclick=()=>Saber.drawer(false);
 $('gear').onclick=()=>location.href='dashboard.html#account';
 $('newChat').onclick=()=>{Chat.newChat();Saber.drawer(false)};
 $('openAbout').onclick=()=>{$('modal').hidden=false;Saber.drawer(false)};
 $('closeAbout').onclick=()=>$('modal').hidden=true;
 $('logout').onclick=API.logout;
 Chat.init();
 API.me().then(m=>{if(m.role==='admin')$('adminLink').hidden=false}).catch(()=>{});
 setTimeout(()=>$('splash').classList.add('done'),1500);
})();
