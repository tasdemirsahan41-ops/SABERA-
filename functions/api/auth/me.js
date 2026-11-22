import {json,needUser,quota} from '../../_lib/util.js';
export async function onRequestGet(c){const[u,e]=await needUser(c);if(e)return e;return json({email:u.email,role:u.role,default_model:u.default_model,quota:await quota(c.env,u)})}
