// localStorage sarmalayıcı. Android'de WebView domStorage açık olmalıdır.
const Store={
 get(k,d){try{const v=localStorage.getItem('saber:'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem('saber:'+k,JSON.stringify(v))}catch(e){}},
 del(k){try{localStorage.removeItem('saber:'+k)}catch(e){}}
};
