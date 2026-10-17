import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const [html,base,css,enhancement] = await Promise.all(['dist/index.html','src/editor.base.html','ui/framblo.css','ui/enhance.js'].map(file=>fs.readFile(file,'utf8')));

test('new home replaces decorative mockup rather than hiding it',()=>{
  assert.ok(html.includes('Give your idea'));
  assert.ok(html.includes('id="f-featured-frame"'));
  assert.ok(!html.includes('A website that\'s<br><em>entirely yours.'));
  assert.equal((html.match(/id="dashboard"/g)||[]).length,1);
});
test('existing editor identifiers survive exactly once',()=>{
  for(const id of ['app','canvas','modal','modal-content','inspector','inspector-content','side-content','project-import','image-import','dashboard-projects','work-area']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
  }
});
test('saved project database and schema are unchanged',()=>{
  assert.ok(html.includes("const DB='opencanvas-v1'"));
  const part=s=>s.slice(s.indexOf('/* IndexedDB autosaving.'),s.indexOf('/* Framblo editor.'));
  assert.equal(part(html),part(base));
});
test('rendering and export engine have not changed',()=>{
  const part=s=>s.slice(s.indexOf('/* Framblo core model.'),s.indexOf('/* IndexedDB autosaving.'));
  assert.equal(part(html),part(base));
});
test('GitHub publishing remains token-free and unchanged',()=>{
  assert.ok(html.includes('/api/github/start'));
  assert.ok(html.includes("case 'github-disconnect'"));
  assert.ok(html.includes("if(form.id==='github-form'){await publishConnected(form);return;}"));
});
test('all inline JavaScript parses',()=>{
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) new vm.Script(match[1]);
});
test('preview snapshots use the actual template engine with restricted frames',()=>{
  assert.ok(enhancement.includes('window.OC.documentHTML(project, project.pages[0])'));
  assert.ok(enhancement.includes("frame.setAttribute('sandbox', '')"));
  assert.ok(enhancement.includes("frame.tabIndex = -1"));
});
test('new UI has keyboard focus, mobile breakpoints and reduced-motion support',()=>{
  assert.ok(html.includes('class="f-skip"'));
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(css.includes('@media(max-width:480px)'));
  assert.ok(html.includes('aria-pressed="true"'));
});
test('no account, font CDN or new runtime dependency is introduced',()=>{
  assert.ok(!enhancement.includes('fetch('));
  assert.ok(!css.includes('@import'));
  assert.ok(!html.includes('fonts.googleapis.com'));
});

test('social, search and sharing metadata ship with the build',async()=>{
  for(const needle of ['property="og:title"','property="og:image" content="https://framblo.vercel.app/og.png"','name="twitter:card" content="summary_large_image"','rel="canonical" href="https://framblo.vercel.app/"']){
    assert.ok(html.includes(needle),needle);
  }
  const robots=await fs.readFile('dist/robots.txt','utf8');
  assert.ok(robots.includes('Sitemap: https://framblo.vercel.app/sitemap.xml'));
  const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
  assert.ok(sitemap.includes('<loc>https://framblo.vercel.app/</loc>'));
  const og=await fs.readFile('dist/og.png');
  assert.equal(og.subarray(1,4).toString(),'PNG');
  const favicon=await fs.readFile('dist/favicon.ico');
  assert.deepEqual([...favicon.subarray(0,4)],[0,0,1,0]);
});
