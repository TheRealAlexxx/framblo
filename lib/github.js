import crypto from 'node:crypto';

const SESSION_COOKIE='framblo_gh';
const STATE_COOKIE='framblo_gh_state';
const MAX_AGE=7*24*60*60;

export function ready(){return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.FRAMBLO_SESSION_SECRET?.length>=32);}
function key(){if(!ready())throw Object.assign(new Error('GitHub publishing is not configured yet.'),{status:503});return crypto.createHash('sha256').update(process.env.FRAMBLO_SESSION_SECRET).digest();}
export const random=()=>crypto.randomBytes(32).toString('base64url');
export const checksum=s=>crypto.createHash('sha256').update(s).digest('base64url');
export function encodeCookie(payload){const nonce=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),nonce);const plain=Buffer.from(JSON.stringify(payload));return Buffer.concat([nonce,cipher.update(plain),cipher.final(),cipher.getAuthTag()]).toString('base64url');}
export function decodeCookie(raw){if(!raw)return null;try{const buf=Buffer.from(raw,'base64url');if(buf.length<29)return null;const d=crypto.createDecipheriv('aes-256-gcm',key(),buf.subarray(0,12));d.setAuthTag(buf.subarray(buf.length-16));return JSON.parse(Buffer.concat([d.update(buf.subarray(12,-16)),d.final()]).toString());}catch{return null;}}
export function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(v=>{const i=v.indexOf('=');return i<0?[]:[v.slice(0,i).trim(),v.slice(i+1).trim()]}).filter(x=>x.length===2));}
export function getCookie(req,name){return decodeCookie(cookies(req)[name]);}
export function setCookie(res,name,value,ttl=MAX_AGE){const proto=name+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age='+ttl;res.setHeader('Set-Cookie',[...(res.getHeader('Set-Cookie')||[]),proto]);}
export function clearCookie(res,name){setCookie(res,name,'',0);}
export function json(res,code,obj){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(code).json(obj);}
export function err(res,e){const status=[400,401,403,404,405,409,413,429,503].includes(e?.status)?e.status:500;return json(res,status,{error:status===500?'Something went wrong. Please try again.':e.message});}
export function requireMethod(req,method){if(req.method!==method)throw Object.assign(new Error('Method not allowed'),{status:405});}
export function postGuard(req){const origin=req.headers.origin;const proto=req.headers['x-forwarded-proto']==='http'?'http':'https';const host=req.headers.host;if(!origin||origin!==proto+'://'+host)throw Object.assign(new Error('Invalid request origin.'),{status:403});}
export async function gh(path,token,{method='GET',body}={}){
 const response=await fetch('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2026-03-10',...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 const data=await response.json().catch(()=>({}));if(!response.ok){const status=response.status===422?409:response.status;const detail=typeof data.message==='string'?data.message.slice(0,300):'GitHub rejected the request.';throw Object.assign(new Error('GitHub: '+detail),{status});}return data;
}
export async function refreshSession(req,res){const session=getCookie(req,SESSION_COOKIE);if(!session)return null;if(session.expiresAt>Date.now()+90_000)return session;if(!session.refresh||!session.refreshExpiresAt||session.refreshExpiresAt<Date.now())return null;
 const resp=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:session.refresh}),signal:AbortSignal.timeout(15000)});const t=await resp.json();if(!t.access_token)return null;
 session.token=t.access_token;session.expiresAt=t.expires_in?Date.now()+t.expires_in*1000:Date.now()+MAX_AGE*1000;session.refresh=t.refresh_token||session.refresh;session.refreshExpiresAt=t.refresh_token_expires_in?Date.now()+t.refresh_token_expires_in*1000:session.refreshExpiresAt;setCookie(res,SESSION_COOKIE,encodeCookie(session));return session;
}
export async function authorized(req,res){if(!ready())throw Object.assign(new Error('GitHub login has not been set up by Framblo yet.'),{status:503});const session=await refreshSession(req,res);if(!session)throw Object.assign(new Error('Connect your GitHub account to publish.'),{status:401});return session;}
export async function accessibleRepos(session){const result=[];for(let page=1;page<=3;page++){const inst=await gh('/user/installations?per_page=100&page='+page,session.token);for(const item of inst.installations||[]){for(let sub=1;sub<=3;sub++){const items=await gh('/user/installations/'+item.id+'/repositories?per_page=100&page='+sub,session.token);for(const repo of items.repositories||[]){if(repo.permissions?.push===false||repo.archived)continue;result.push({full_name:repo.full_name,private:repo.private,default_branch:repo.default_branch});}if((items.repositories||[]).length<100)break;}}if((inst.installations||[]).length<100)break;}return [...new Map(result.map(r=>[r.full_name,r])).values()];}
export const cookieNames={SESSION_COOKIE,STATE_COOKIE};
