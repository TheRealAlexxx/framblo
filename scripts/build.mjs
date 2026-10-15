import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = name => fs.readFile(path.join(root, name), 'utf8');
const [base, home, css, enhancement] = await Promise.all([
  read('src/editor.base.html'), read('ui/home.html'), read('ui/framblo.css'), read('ui/enhance.js')
]);
function replaceOnce(source, needle, replacement) {
  const at = source.indexOf(needle);
  if (at < 0 || source.indexOf(needle, at + needle.length) !== -1) throw Error(`Expected exactly one build anchor: ${needle.slice(0,90)}`);
  return source.slice(0, at) + replacement + source.slice(at + needle.length);
}
let html = base;
const dashboardStart = html.indexOf('<section id="dashboard"');
const editorStart = html.indexOf('<div id="app">', dashboardStart);
if (dashboardStart < 0 || editorStart <= dashboardStart) throw Error('Dashboard boundaries changed; refusing to overwrite the editor.');
html = html.slice(0, dashboardStart) + home + html.slice(editorStart);
// The export engine contains HTML templates; select the outer head, not their strings.
const headEnd = html.indexOf('</head>');
if (headEnd < 0 || headEnd > html.indexOf('<body')) throw Error('Outer head boundary not found.');
html = html.slice(0, headEnd) + '<style id="framblo-interface">\n' + css + '\n</style>\n' + html.slice(headEnd);
const projectsStart = html.indexOf('async function renderDashboard(){');
const projectsEnd = html.indexOf('\nfunction changeRoute()', projectsStart);
if (projectsStart < 0 || projectsEnd < projectsStart) throw Error('Project renderer boundary not found.');
html = html.slice(0, projectsStart) + `async function renderDashboard(){
  if(window.FrambloUI) return window.FrambloUI.renderProjects();
  window.addEventListener('framblo:ui-ready',()=>window.FrambloUI.renderProjects(),{once:true});
}
` + html.slice(projectsEnd);
const copy = [
  ['<strong>Make something brilliant.</strong>Start with a section.<br>Make it entirely your own.', '<strong>Add a section</strong>Click to insert it, or drag it onto the page.'],
  ['Everything here is yours to use.<br>No premium blocks. No locked features.', 'Sections adapt to your site theme.'],
  ['A little room to grow.<br>Each page exports as real HTML.', 'Manage the pages in your website. Each one exports as HTML.'],
  ['Good things deserve a good home.<br>Upload images to keep exports self-contained.', 'Upload images to include them in your website export.'],
  ['<strong>A different point of view.</strong>One change. Your whole site.', '<strong>Site-wide styles</strong>Colours, typography and spacing for every page.'],
  ['Your work. No strings attached.', 'Saved locally in this browser'],
  ['Double-click text to edit. Make it yours.', 'Double-click text to edit'],
  ["modal('Give your project a name.','Something that feels like you.'", "modal('Rename project','This name appears in your workspace.'"],
  ["toast('Project imported as a new copy.');", "location.hash='#/editor';toast('Project imported as a new copy.');"]
];
for (const [before, after] of copy) html = replaceOnce(html, before, after);
const bodyEnd = html.lastIndexOf('</body></html>');
if (bodyEnd < 0 || html.slice(bodyEnd + 14).trim()) throw Error('Outer body boundary not found.');
html = html.slice(0, bodyEnd) + '<script id="framblo-interface-script">\n' + enhancement + '\n</script>\n' + html.slice(bodyEnd);
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
if (scripts.length < 2) throw Error('Missing application scripts.');
for (let i = 0; i < scripts.length; i++) new vm.Script(scripts[i][1], { filename: `inline-${i}.js` });
for (const required of ['id="canvas"','id="dashboard-projects"','id="project-import"','/api/github/start','const DB=\'opencanvas-v1\'']) {
  if (!html.includes(required)) throw Error('Required compatibility marker missing: ' + required);
}
await fs.mkdir(path.join(root, 'dist'), { recursive: true });
await fs.writeFile(path.join(root, 'dist/index.html'), html);
console.log(`Built Framblo interface: ${Buffer.byteLength(html)} bytes; ${scripts.length} JavaScript blocks parsed.`);
