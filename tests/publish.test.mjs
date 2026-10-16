import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
process.env.GITHUB_CLIENT_ID='id';process.env.GITHUB_CLIENT_SECRET='secret';process.env.FRAMBLO_SESSION_SECRET='x'.repeat(40);
const {encodeCookie}=await import('../lib/github.js');
const {default:handler}=await import('../api/github/publish.js');
const REPO='alex/site';
const baseFiles=()=>[{name:'index.html',data:'<html></html>',encoding:'utf-8'},{name:'styles.css',data:'a{}',encoding:'utf-8'},{name:'script.js',data:'',encoding:'utf-8'},{name:'framblo.project.json',data:'{}',encoding:'utf-8'}];
function request({session={token:'t',csrf:'c',expiresAt:Date.now()+3_600_000},csrf='c',body}={}){
  const headers={host:'framblo.test',origin:'https://framblo.test','x-framblo-csrf':csrf};
  if(session)headers.cookie='framblo_gh='+encodeCookie(session);
  return {method:'POST',headers,body:body??{repository:REPO,files:baseFiles()}};
}
function response(){const r={headers:{},setHeader(k,v){this.headers[k]=v;},getHeader(k){return this.headers[k];},writeHead(c){this.statusCode=c;},end(b){this.body=b;},status(c){this.statusCode=c;return this;},json(b){this.body=JSON.stringify(b);return this;}};return r;}
const parsed=r=>JSON.parse(r.body||'{}');
function mockGitHub({empty=false,denied=false}={}){
  const calls=[];let initialised=!empty;
  globalThis.fetch=async(url,opts={})=>{
    const u=new URL(url),method=opts.method||'GET';calls.push(method+' '+u.pathname);
    const reply=(status,data)=>({ok:status<300,status,json:async()=>data});
    if(u.pathname==='/user/installations')return reply(200,{installations:denied?[]:[{id:1}]});
    if(u.pathname==='/user/installations/1/repositories')return reply(200,{repositories:[{full_name:REPO,default_branch:'main',permissions:{push:true}}]});
    if(u.pathname==='/repos/alex/site')return reply(200,{default_branch:'main',archived:false});
    if(u.pathname==='/repos/alex/site/git/ref/heads/main')return initialised?reply(200,{object:{sha:'base'}}):reply(409,{message:'Git Repository is empty.'});
    if(u.pathname==='/repos/alex/site/contents/README.md'&&method==='PUT'){initialised=true;return reply(201,{});}
    if(!initialised)return reply(409,{message:'Git Repository is empty.'});
    if(u.pathname.endsWith('/git/trees'))return reply(201,{sha:'tree'});
    if(u.pathname.endsWith('/git/commits'))return reply(201,{sha:'commit',parents:JSON.parse(opts.body).parents});
    if(u.pathname.endsWith('/git/refs'))return reply(201,{});
    if(u.pathname.endsWith('/pages'))return reply(404,{message:'Not Found'});
    return reply(404,{message:'Not Found'});
  };
  return calls;
}
test('publishes to an existing repository',async()=>{const calls=mockGitHub();const res=response();await handler(request(),res);assert.equal(res.statusCode,200);assert.ok(parsed(res).branch.startsWith('framblo-'));assert.ok(!calls.some(c=>c.includes('contents/README.md')));});
test('publishes to a brand-new empty repository with an initial commit',async()=>{const calls=mockGitHub({empty:true});const res=response();await handler(request(),res);assert.equal(res.statusCode,200,res.body);assert.ok(calls.includes('PUT /repos/alex/site/contents/README.md'));assert.ok(calls.indexOf('PUT /repos/alex/site/contents/README.md')<calls.indexOf('POST /repos/alex/site/git/trees'));});
test('non-empty ref errors are not swallowed',async()=>{mockGitHub();const original=globalThis.fetch;globalThis.fetch=async(url,o)=>new URL(url).pathname.includes('/git/ref/')?{ok:false,status:403,json:async()=>({message:'Forbidden'})}:original(url,o);const res=response();await handler(request(),res);assert.equal(res.statusCode,403);});
test('rejects requests with no session (expired or never connected)',async()=>{mockGitHub();const res=response();await handler(request({session:null}),res);assert.equal(res.statusCode,401);});
test('rejects an expired session that cannot refresh',async()=>{mockGitHub();const res=response();await handler(request({session:{token:'t',csrf:'c',expiresAt:Date.now()-1000}}),res);assert.equal(res.statusCode,401);});
test('rejects a bad CSRF token',async()=>{mockGitHub();const res=response();await handler(request({csrf:'wrong'}),res);assert.equal(res.statusCode,403);});
test('rejects a foreign origin',async()=>{mockGitHub();const req=request();req.headers.origin='https://evil.test';const res=response();await handler(req,res);assert.equal(res.statusCode,403);});
test('rejects a repository the GitHub App is not installed on',async()=>{mockGitHub({denied:true});const res=response();await handler(request(),res);assert.equal(res.statusCode,403);assert.match(parsed(res).error,/not authorized/);});
test('rejects publishes over the 3 MB server cap',async()=>{mockGitHub();const files=baseFiles();files[1].data='a'.repeat(3_000_001);const res=response();await handler(request({body:{repository:REPO,files}}),res);assert.equal(res.statusCode,413);});
test('editor preflights the publish size before uploading',async()=>{
  const html=await fs.readFile('src/editor.base.html','utf8');
  assert.ok(html.includes('const PUBLISH_LIMIT=3_000_000'));
  const fn=html.match(/function publishBytes\(files\)\{[^\n]*\}/)[0];
  const ctx={TextEncoder};vm.runInNewContext(fn+';this.publishBytes=publishBytes',ctx);
  assert.equal(ctx.publishBytes([{data:'abc'},{data:'é'}]),5);
  const at=html.indexOf('async function publishConnected');
  assert.ok(html.indexOf('publishBytes(files)',at)<html.indexOf("fetch('/api/github/publish'",at));
  assert.ok(html.slice(at).includes('data-action="download-zip"'));
});
test('autosave refuses to overwrite a project changed by another tab',async()=>{
  const html=await fs.readFile('src/editor.base.html','utf8');
  assert.ok(html.includes("e.code='CONFLICT'"));
  assert.ok(html.includes('OC.storage.save(snapshot,savedStamp)'));
  assert.ok(html.includes("if(e&&e.code==='CONFLICT')return markConflict()"));
  assert.ok(html.includes('else checkConflict()'));
});
