// Model kaydı + sağlayıcı arayüzü. Yeni sağlayıcı (ör. kendi yerel modelimiz) = PROVIDERS'a bir fonksiyon + MODELS'a bir satır.
// Model kimliklerini Cloudflare Workers AI kataloğundan doğrulayın; katalog zamanla değişir.
import {getSetting} from './util.js';
export const MODELS=[
 {id:'@cf/meta/llama-3.1-8b-instruct',name:'Llama 3.1 8B',desc:'Hızlı, genel amaçlı sohbet.',provider:'workers-ai'},
 {id:'@cf/meta/llama-3.2-3b-instruct',name:'Llama 3.2 3B',desc:'Çok hızlı, hafif görevler.',provider:'workers-ai'},
 {id:'@cf/qwen/qwen2.5-coder-32b-instruct',name:'Qwen2.5 Coder 32B',desc:'Kod yazma ve inceleme.',provider:'workers-ai'}
];
const PROVIDERS={
 async 'workers-ai'(env,id,messages,max,temp){
  if(!env.AI)throw new Error('Workers AI bağlantısı (AI binding) yapılandırılmamış.');
  const r=await env.AI.run(id,{messages,max_tokens:max,temperature:temp});
  const text=r?.response??r?.result?.response;
  if(typeof text!=='string')throw new Error('Model beklenmeyen bir yanıt döndürdü.');
  const u=r.usage||{};
  return{text,tin:u.prompt_tokens??Math.ceil(JSON.stringify(messages).length/4),tout:u.completion_tokens??Math.ceil(text.length/4)}; // usage yoksa tahmin
 }
};
export async function enabledModels(env){const v=await getSetting(env,'enabled_models',null);const on=v?JSON.parse(v):MODELS.map(m=>m.id);return MODELS.filter(m=>on.includes(m.id))}
export const runModel=(env,m,messages,max,temp)=>{const p=PROVIDERS[m.provider];if(!p)throw new Error('Desteklenmeyen sağlayıcı.');return p(env,m.id,messages,max,temp)};
