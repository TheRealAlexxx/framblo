import {clearCookie,cookieNames,postGuard,err,json} from '../../lib/github.js';
export default async function handler(req,res){if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});try{postGuard(req);clearCookie(res,cookieNames.SESSION_COOKIE);return json(res,200,{ok:true})}catch(e){return err(res,e)}}
