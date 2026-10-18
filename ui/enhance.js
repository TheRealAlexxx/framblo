/* Interface-only enhancements. No changes to project schemas, stored content or OAuth. */
(() => {
  'use strict';
  const templateCopy = {
    studio: ['Studio', 'A place for independent work.'],
    product: ['Product', 'Give your next release a home.'],
    portfolio: ['Portfolio', 'Let your work do the talking.'],
    cafe: ['Cafe', 'Fresh coffee, baked daily.'],
    event: ['Event', 'Give your night a home.']
  };
  const frames = new Set();
  const previews = new Map();
  const E = value => window.OC.escape(String(value ?? ''));
  let epoch = 0;
  let limit = 6;
  let demo = 'studio';

  function fitFrame(frame) {
    const host = frame.parentElement;
    if (!host || !frame.isConnected) { frames.delete(frame); return; }
    const width = host.clientWidth;
    if (width > 0) frame.style.transform = `scale(${width / 1120})`;
  }
  const resize = new ResizeObserver(entries => {
    for (const entry of entries) {
      const frame = entry.target.querySelector('iframe');
      if (frame) fitFrame(frame);
    }
  });
  function previewHTML(project) {
    // Sandboxed previews are snapshots, not nested working editors.
    // No scripts, form submissions, parent access or top-level navigation.
    let html = window.OC.documentHTML(project, project.pages[0]);
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
    return html.replace('<head>', '<head><meta name="referrer" content="no-referrer">');
  }
  function templateHTML(name) {
    if (!previews.has(name)) previews.set(name, previewHTML(window.OC.createProject(name)));
    return previews.get(name);
  }
  function mountPreview(host, html, label, existing) {
    const frame = existing || document.createElement('iframe');
    frame.title = label;
    frame.setAttribute('sandbox', '');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.tabIndex = -1;
    // These small srcdoc documents need no network request. Eager rendering
    // avoids empty thumbnails after route changes or when scrolling quickly.
    frame.loading = 'eager';
    frame.srcdoc = html;
    if (!existing) host.append(frame);
    frames.add(frame);
    resize.observe(host);
    fitFrame(frame);
    frame.addEventListener('load', () => fitFrame(frame), { once: true });
  }
  function selectDemo(name) {
    if (!Object.hasOwn(templateCopy, name)) return;
    demo = name;
    const [label, description] = templateCopy[name];
    document.querySelectorAll('[data-demo]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demo === name)));
    document.querySelector('#f-demo-name').textContent = label;
    document.querySelector('#f-demo-description').textContent = description;
    document.querySelector('#f-demo-use').dataset.dashNew = name;
    const host = document.querySelector('[data-featured-preview]');
    mountPreview(host, templateHTML(name), `${label} starter website preview`, document.querySelector('#f-featured-frame'));
  }
  function editedAt(stamp) {
    const date = new Date(stamp);
    if (!Number.isFinite(date.getTime())) return 'Saved project';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Edited today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Edited yesterday';
    return 'Edited ' + date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }
  async function renderProjects() {
    const version = ++epoch;
    const container = document.querySelector('#dashboard-projects');
    if (!container || !window.OC?.storage) return;
    try {
      const projects = (await window.OC.storage.list()).sort((a, b) => b.updatedAt - a.updatedAt);
      if (version !== epoch) return;
      container.querySelectorAll('.f-project-preview').forEach(host => resize.unobserve(host));
      const counter = document.querySelector('#f-project-count');
      counter.hidden = !projects.length;
      counter.textContent = String(projects.length);
      document.querySelector('#projects').dataset.projectCount = String(projects.length);
      container.innerHTML = projects.length ? projects.slice(0, limit).map(project => `<button class="f-project" data-dash-open="${E(project.id)}" aria-label="Open ${E(project.name)}"><span class="f-project-preview" data-project-preview="${E(project.id)}"></span><span class="f-project-meta"><span><strong>${E(project.name)}</strong><small>${project.pages.length} ${project.pages.length === 1 ? 'page' : 'pages'} · ${E(editedAt(project.updatedAt))}</small></span><span aria-hidden="true">↗</span></span></button>`).join('') + (projects.length > limit ? '<button type="button" class="f-text-link f-load-more" data-more-projects>Show all projects <span aria-hidden="true">↓</span></button>' : '') : '<div class="f-empty"><span class="f-empty-symbol" aria-hidden="true">+</span><div><strong>This space is yours.</strong><p>Create a website and it will appear here. No account needed.</p></div><button class="f-text-link" data-dash-new="blank">Start a project <span aria-hidden="true">↗</span></button></div>';
      const byId = new Map(projects.map(project => [project.id, project]));
      container.querySelectorAll('[data-project-preview]').forEach(host => {
        try { const project = byId.get(host.dataset.projectPreview); mountPreview(host, previewHTML(project), `${project.name} website preview`); }
        catch { const fallback = document.createElement('span'); fallback.className = 'f-project-fallback'; fallback.textContent = 'Your website'; host.append(fallback); }
      });
    } catch {
      if (version !== epoch) return;
      container.innerHTML = '<div class="f-empty"><div><strong>Browser storage is unavailable.</strong><p>You can still edit and download websites. Import a backup to continue existing work.</p></div><button class="f-text-link" data-action="import-project">Import backup <span aria-hidden="true">↥</span></button></div>';
    }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.demo) selectDemo(button.dataset.demo);
    if (button.hasAttribute('data-more-projects')) { limit = Number.MAX_SAFE_INTEGER; renderProjects(); }
  });
  addEventListener('hashchange', () => requestAnimationFrame(() => {
    for (const frame of frames) fitFrame(frame);
  }));
  window.FrambloUI = Object.freeze({ renderProjects, selectDemo, version: '1.1.0' });
  selectDemo(demo);
  document.querySelectorAll('[data-template-preview]').forEach(host => {
    const name = host.dataset.templatePreview;
    mountPreview(host, templateHTML(name), `${templateCopy[name][0]} template preview`);
  });
  window.dispatchEvent(new Event('framblo:ui-ready'));
  renderProjects();
})();
