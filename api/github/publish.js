import {authorized,accessibleRepos,postGuard,gh,err,json} from '../../lib/github.js';
import crypto from 'node:crypto';
const allowed=/^(?:index|[a-z0-9-]{1,55})\.html$|^styles\.css$|^script\.js$|^\.nojekyll$|^framblo\.project\.json$|^README\.md$|^assets\/[a-zA-Z0-9_-]{1,80}\.(?:png|jpg|webp)$/;
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
 postGuard(req);const session=await authorized(req,res);if(req.headers['x-framblo-csrf']!==session.csrf)throw Object.assign(new Error('Invalid publishing session.'),{status:403});
 const {repository,files}=req.body||{};if(typeof repository!=='string'||!/^[\w-]{1,39}\/[\w.-]{1,100}$/.test(repository))throw Object.assign(new Error('Choose a GitHub repository.'),{status:400});
 if(!Array.isArray(files)||files.length<4||files.length>125)throw Object.assign(new Error('Invalid website files.'),{status:400});
 let total=0;const paths=new Set();for(const f of files){if(typeof f.name!=='string'||!allowed.test(f.name)||paths.has(f.name)||!['utf-8','base64'].includes(f.encoding)||typeof f.data!=='string')throw Object.assign(new Error('Invalid or duplicate website file.'),{status:400});paths.add(f.name);total+=Buffer.byteLength(f.data);if(total>3_000_000)throw Object.assign(new Error('Website is too large for GitHub publish. Download the ZIP and upload it manually.'),{status:413});}
 if(!paths.has('index.html')||!paths.has('styles.css')||!paths.has('script.js')||!paths.has('framblo.project.json'))throw Object.assign(new Error('Website is missing required files.'),{status:400});
 const allowedRepos=await accessibleRepos(session);if(!allowedRepos.some(r=>r.full_name.toLowerCase()===repository.toLowerCase()))throw Object.assign(new Error('This repository is not authorized for Framblo. Install the GitHub App for it first.'),{status:403});
 const path='/repos/'+repository.split('/').map(encodeURIComponent).join('/'),info=await gh(path,session.token);if(info.archived)throw Object.assign(new Error('This repository is archived.'),{status:409});
 let ref;try{ref=await gh(path+'/git/ref/heads/'+encodeURIComponent(info.default_branch),session.token);}catch(e){if(!(e.status===409&&/empty/i.test(e.message)))throw e;
  /* Brand-new empty repo: the Git Data API refuses everything until a first commit exists, so create one with the Contents API. */
  await gh(path+'/contents/README.md',session.token,{method:'PUT',body:{message:'Initial commit',content:Buffer.from('# '+repository.split('/')[1]+'\n').toString('base64')}});
  ref=await gh(path+'/git/ref/heads/'+encodeURIComponent(info.default_branch),session.token);}
 const entries=[];
 for(const f of files){let sha;if(f.encoding==='base64'){const blob=await gh(path+'/git/blobs',session.token,{method:'POST',body:{content:f.data,encoding:'base64'}});sha=blob.sha;}
 if(sha)entries.push({path:f.name,mode:'100644',type:'blob',sha});else entries.push({path:f.name,mode:'100644',type:'blob',content:f.data});}
 const tree=await gh(path+'/git/trees',session.token,{method:'POST',body:{tree:entries}});const commit=await gh(path+'/git/commits',session.token,{method:'POST',body:{message:'Publish website with Framblo',tree:tree.sha,parents:[ref.object.sha]}});
 const branch='framblo-'+new Date().toISOString().replace(/\D/g,'').slice(0,14)+'-'+crypto.randomBytes(3).toString('hex');await gh(path+'/git/refs',session.token,{method:'POST',body:{ref:'refs/heads/'+branch,sha:commit.sha}});
 let pagesUrl=null,notice='Your website is published to a new GitHub branch. Enable GitHub Pages to host it.';
 try{
  const existing=await gh(path+'/pages',session.token);if(existing.source?.branch?.startsWith('framblo-')){const updated=await gh(path+'/pages',session.token,{method:'PUT',body:{source:{branch,path:'/'}}});pagesUrl=updated.html_url||existing.html_url;notice='GitHub Pages is updating to your new website snapshot.';}else{pagesUrl=existing.html_url||null;notice='This repository already has GitHub Pages configured. We left its current site untouched; choose the new branch in Settings → Pages to switch.';}
 }catch(e){if(e.status===404){try{const created=await gh(path+'/pages',session.token,{method:'POST',body:{source:{branch,path:'/'},build_type:'legacy'}});pagesUrl=created.html_url||null;notice='GitHub Pages was enabled. Your website may take a few minutes to appear.';}catch{notice='Files published! Enable GitHub Pages in repository Settings → Pages to get a live website URL.';}}else notice='Files published. Check repository Settings → Pages to configure hosting.';}
 return json(res,200,{branch,url:'https://github.com/'+repository+'/tree/'+branch,pages:'https://github.com/'+repository+'/settings/pages',pagesUrl,notice});
 }catch(e){return err(res,e);}
}
