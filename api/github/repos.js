import {authorized,accessibleRepos,json,err} from '../../lib/github.js';
export default async function handler(req,res){if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});try{const s=await authorized(req,res);return json(res,200,{repositories:await accessibleRepos(s)})}catch(e){return err(res,e)}}
