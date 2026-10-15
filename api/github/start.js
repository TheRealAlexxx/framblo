import {ready,random,checksum,encodeCookie,setCookie,json,cookieNames} from '../../lib/github.js';
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 if(!ready())return json(res,503,{error:'GitHub connection has not been configured by the Framblo maintainer.'});
 const state=random(),verifier=random();setCookie(res,cookieNames.STATE_COOKIE,encodeCookie({state,verifier,created:Date.now()}),600);
 const url=new URL('https://github.com/login/oauth/authorize');url.searchParams.set('client_id',process.env.GITHUB_CLIENT_ID);url.searchParams.set('redirect_uri',(process.env.FRAMBLO_PUBLIC_URL||'https://framblo.vercel.app')+'/api/github/callback');url.searchParams.set('state',state);url.searchParams.set('code_challenge',checksum(verifier));url.searchParams.set('code_challenge_method','S256');res.setHeader('Cache-Control','no-store');res.redirect(302,url.toString());
}
