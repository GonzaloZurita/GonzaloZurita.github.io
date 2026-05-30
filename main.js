// Full script restored from backup to ensure exact timeline behavior and UI parity
// Debug: confirm this file is loading and capture uncaught errors
try{
  console.log('main.js loaded');
  window.addEventListener('error', function(e){
    console.error('Uncaught error detected:', e && (e.error || e.message) , e); 
  });
  window.addEventListener('DOMContentLoaded', function(){ console.log('DOMContentLoaded (main.js)'); });
}catch(e){ console.error('Error initializing debug helpers in main.js', e); }

(function(){
  // Smooth scroll with offset for sticky header
  const header = document.querySelector('.sticky-header');
  function i18nGet(key, fallback){
    try{
      if(window && window.__i18n){
        const parts = key.split('.');
        let v = window.__i18n;
        for(const p of parts){ if(v && typeof v === 'object' && p in v) v = v[p]; else { v = undefined; break; } }
        if(v !== undefined && v !== null) return v;
      }
    }catch(e){}
    return fallback || '';
  }
  // Timeline connector renderer: create pixel-perfect horizontal connectors
  (function(){
    function updateConnectors(){
      const timeline = document.querySelector('.timeline');
      if(!timeline) return;
      // remove existing connectors and badges
      timeline.querySelectorAll('.tl-connector, .tl-badge').forEach(n=>n.remove());
      const vars = getComputedStyle(timeline);
      const lineLeft = parseFloat(vars.getPropertyValue('--tl-line-left')) || 48;
      const contentLeft = parseFloat(vars.getPropertyValue('--tl-content-left')) || 120;
      const items = Array.from(timeline.querySelectorAll('.experience-item'));
      const visibleCenters = [];
      const badgeCenters = [];
      const markerTopVar = parseFloat(vars.getPropertyValue('--tl-marker-top')) || 40;
      // estimate badge half-height (font-size * 0.88 rem + vertical padding 6)
      const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const badgeHalf = Math.round((rootFs * 0.88 + 12) / 2);
      const timelineRect = timeline.getBoundingClientRect();
      items.forEach(item=>{
        // skip hidden items
        if(!(item.offsetParent !== null && item.offsetHeight>0)) return;
        const itemRect = item.getBoundingClientRect();
        // center relative to timeline
        const center = Math.round(itemRect.top - timelineRect.top + (itemRect.height/2));
        visibleCenters.push(center);
        // badge center relative to timeline (markerTopVar pixels from item top)
        const badgeCenter = Math.round(itemRect.top - timelineRect.top + markerTopVar);
        badgeCenters.push(badgeCenter);
        const left = Math.round(lineLeft);
        // compute item's left offset relative to timeline
        const itemLeft = Math.round(itemRect.left - timelineRect.left);
        // width from vertical line to the item's left edge (leave small minimum so it's visible)
        const width = Math.max(8, itemLeft - left);
        // create horizontal connector
        const div = document.createElement('div');
        div.className = 'tl-connector';
        div.style.top = (center) + 'px';
        div.style.left = left + 'px';
        div.style.width = width + 'px';
        timeline.appendChild(div);
        // create badge aligned to the vertical line (align to connector center)
        const badge = document.createElement('div');
        badge.className = 'tl-badge';
        badge.textContent = item.getAttribute('data-date') || '';
        // position badge center at the badge marker (aligned to the vertical timeline) and align left to the vertical line
        badge.style.top = badgeCenter + 'px';
        badge.style.left = left + 'px';
        timeline.appendChild(badge);
      });
      // set vertical line to span from top of first badge to bottom of last badge
      if(badgeCenters.length){
        const firstBadgeCenter = badgeCenters[0];
        const lastBadgeCenter = badgeCenters[badgeCenters.length-1];
        const lineTop = Math.max(0, Math.round(firstBadgeCenter - badgeHalf - 6));
        let lineBottom;
        // if older experiences block is hidden, extend the line to the bottom of the timeline container
        const olderBlockEl = document.getElementById('olderExperiences');
        const olderHidden = olderBlockEl && getComputedStyle(olderBlockEl).display === 'none';
        // also consider the last connector center (visibleCenters) so the vertical line reaches the horizontal connector
        const lastConnectorCenter = (visibleCenters.length ? visibleCenters[visibleCenters.length-1] : null);
        if(olderHidden){
          const containerHeight = timeline.clientHeight || timeline.getBoundingClientRect().height;
          lineBottom = Math.round(containerHeight - 12); // leave small padding at bottom
        } else {
          // prefer extending to whichever is lower: badge bottom or connector center (+ small buffer)
          const connectorBottom = lastConnectorCenter !== null ? Math.round(lastConnectorCenter + 8) : 0;
          lineBottom = Math.round(Math.max(lastBadgeCenter + badgeHalf + 6, connectorBottom));
        }
        const height = Math.max(2, lineBottom - lineTop);
        timeline.style.setProperty('--tl-line-top', lineTop + 'px');
        timeline.style.setProperty('--tl-line-height', height + 'px');
      }
      // mark initialized for debugging/visibility checks
      try{ timeline.setAttribute('data-tl-initialized','true'); }catch(e){}
      // Defensive debug: if no connectors were created (e.g., blocked by CSS or timing), insert a visible temporary debug marker so user can tell script ran.
      const createdConnectors = timeline.querySelectorAll('.tl-connector').length;
      if(!createdConnectors){
        try{
          console.warn('Timeline connectors not created — inserting debug markers');
          const dbg = document.createElement('div');
          dbg.style.position = 'absolute'; dbg.style.left = (Math.round(lineLeft || 48)) + 'px'; dbg.style.top = '8px'; dbg.style.width = '8px'; dbg.style.height = '8px'; dbg.style.background = 'red'; dbg.style.borderRadius = '2px'; dbg.style.zIndex = 9999;
          dbg.className = 'tl-debug-marker';
          timeline.appendChild(dbg);
          const dbgBadge = document.createElement('div');
          dbgBadge.textContent = 'DBG'; dbgBadge.style.position='absolute'; dbgBadge.style.left = (Math.round(lineLeft || 48)) + 'px'; dbgBadge.style.top = '24px'; dbgBadge.style.background='rgba(255,0,0,0.9)'; dbgBadge.style.color='#fff'; dbgBadge.style.padding='4px 6px'; dbgBadge.style.borderRadius='4px'; dbgBadge.style.fontSize='12px'; dbgBadge.style.zIndex = 9999; timeline.appendChild(dbgBadge);
        }catch(e){ console.error(e); }
      }
    }
    // expose for external calls (e.g., when content toggles open)
    window.updateTimelineConnectors = updateConnectors;
    // Helper: programmatically add a new experience card with the correct structure
    // Usage: window.addExperience({ date:'Aug 2026 — Present', role:'QA Engineer', company_meta:'Acme Co · Aug 2026 - Present', note:'Short note', bullets:['Did X','Did Y'], logoSrc:'assets/logos/acme.png', logoAlt:'Acme logo', logoClass:'color' , containerId: null })
    window.addExperience = function(opts){
      try{
        const options = Object.assign({}, opts || {});
        const container = (options.containerId && document.getElementById(options.containerId)) || document.querySelector('.timeline');
        if(!container) { console.warn('addExperience: no timeline container found'); return null; }
        const item = document.createElement('div');
        item.className = 'experience-item';
        if(options.date) item.setAttribute('data-date', options.date);
        else { item.setAttribute('data-date',''); console.warn('addExperience: missing date in options'); }
        const logoCls = options.logoClass ? ('company-logo ' + options.logoClass) : 'company-logo';
        const logoSrc = options.logoSrc ? options.logoSrc : '';
        const logoAlt = options.logoAlt ? options.logoAlt : '';
        const role = options.role ? options.role : '';
        const meta = options.company_meta ? options.company_meta : '';
        const note = options.note ? options.note : '';
        const bullets = Array.isArray(options.bullets) ? options.bullets : [];
        item.innerHTML = ''+
          '<div class="experience-header">'+
            '<img class="'+logoCls+'" src="'+logoSrc+'" alt="'+logoAlt+'" />'+
            '<div>'+
              '<h4>'+role+'</h4>'+
              '<span class="experience-meta">'+meta+'</span>'+
            '</div>'+
          '</div>'+
          '<p class="muted-note">'+note+'</p>'+
          '<ul>'+(bullets.map(b=> '<li>'+b+'</li>').join(''))+'</ul>';
        // Insert into visible timeline area: before the show-more button or olderExperiences container if present
        const insertBeforeNode = container.querySelector('.show-more-wrap') || container.querySelector('#olderExperiences') || container.firstChild;
        if(insertBeforeNode) container.insertBefore(item, insertBeforeNode);
        else container.appendChild(item);
        // ensure images inside new item trigger connector updates
        item.querySelectorAll('img').forEach(img => { if(!img.complete) img.addEventListener('load', () => { setTimeout(updateConnectors,40); }); });
        // schedule an update of the timeline connectors
        setTimeout(()=>{ try{ rebalanceTimeline(3); updateConnectors(); }catch(e){} }, 60);
        return item;
      }catch(e){ console.error('addExperience failed', e); return null; }
    };
    window.addEventListener('load', function(){
      try{ updateConnectors(); }catch(e){}
      // schedule a few additional recalculations to handle delayed image/layout changes
      setTimeout(()=>{ try{ updateConnectors(); }catch(e){} }, 60);
      setTimeout(()=>{ try{ updateConnectors(); }catch(e){} }, 250);
      requestAnimationFrame(()=> requestAnimationFrame(()=> { try{ updateConnectors(); }catch(e){} }));
    });
    window.addEventListener('DOMContentLoaded', function(){ try{ updateConnectors(); }catch(e){} });
    window.addEventListener('resize', function(){ window.requestAnimationFrame(updateConnectors); });
    // Ensure timeline keeps only a limited number of items visible and moves older ones into #olderExperiences
    function rebalanceTimeline(limit){
      try{
        limit = Number(limit) || 3;
        const timeline = document.querySelector('.timeline');
        if(!timeline) return;
        let older = document.getElementById('olderExperiences');
        if(!older){
          older = document.createElement('div');
          older.id = 'olderExperiences';
          older.className = 'is-hidden';
          timeline.appendChild(older);
        }
        // direct experience-item children of timeline (exclude items inside #olderExperiences)
        const directItems = Array.from(timeline.children).filter(n=> n.classList && n.classList.contains('experience-item'));
        // If there are more than `limit`, move the extras (from index limit onward) into older
        if(directItems.length > limit){
          const extras = directItems.slice(limit);
          extras.forEach(el => older.appendChild(el));
        } else if(directItems.length < limit){
          // move items back from older into timeline to fill up to limit, preserving order
          const olderItems = Array.from(older.querySelectorAll('.experience-item'));
          if(olderItems.length){
            const need = Math.min(limit - directItems.length, olderItems.length);
            const toMove = olderItems.splice(0, need);
            // insert before the older container so they appear in the visible list
            toMove.forEach(item => timeline.insertBefore(item, older));
          }
        }
      }catch(e){ console.error('rebalanceTimeline error', e); }
    }
    // Watch for older experiences becoming visible and for images loading inside timeline
    const olderBlock = document.getElementById('olderExperiences');
    if(olderBlock){
      const mo = new MutationObserver(() => { setTimeout(updateConnectors, 60); });
      mo.observe(olderBlock, { attributes: true, childList: true, subtree: true });
      // ensure images inside older block trigger update when they finish loading
      olderBlock.querySelectorAll('img').forEach(img=>{
        if(!img.complete) img.addEventListener('load', () => { setTimeout(updateConnectors, 40); });
      });
    }
    // Also observe the main timeline container for dynamic additions/removals
    const timelineEl = document.querySelector('.timeline');
    if(timelineEl){
      const moTimeline = new MutationObserver((mutationsList)=>{
        let schedule = false;
        for(const mut of mutationsList){
          if(mut.type === 'childList'){
            mut.addedNodes.forEach(node => {
              if(node && node.nodeType === 1){
                // if node is an <img>
                if(node.tagName === 'IMG'){
                  if(!node.complete) node.addEventListener('load', () => { setTimeout(updateConnectors, 40); });
                  schedule = true;
                } else {
                  // attach listeners to any imgs inside the added subtree
                  const imgs = node.querySelectorAll && node.querySelectorAll('img');
                  if(imgs && imgs.length){
                    imgs.forEach(img=>{ if(!img.complete) img.addEventListener('load', () => { setTimeout(updateConnectors, 40); }); });
                    schedule = true;
                  } else {
                    // non-image node added — layout likely changed
                    schedule = true;
                  }
                }
              }
            });
            if(mut.removedNodes && mut.removedNodes.length) schedule = true;
          } else if(mut.type === 'attributes'){
            // re-run when an img src changes
            if(mut.target && mut.target.tagName === 'IMG' && mut.attributeName === 'src'){
              const img = mut.target;
              if(!img.complete) img.addEventListener('load', () => { setTimeout(updateConnectors, 40); });
              schedule = true;
            }
          }
        }
        if(schedule){
          try{ rebalanceTimeline(3); }catch(e){}
          setTimeout(updateConnectors, 60);
        }
      });
      moTimeline.observe(timelineEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
      // images inside timeline should trigger connector recalculation when they load
      timelineEl.querySelectorAll('img').forEach(img=>{
        if(!img.complete) img.addEventListener('load', () => { setTimeout(updateConnectors, 40); });
      });
    }
  })();

  // Overlay controls removed — using white calendar base instead to avoid cross-origin overlay issues.
  const headerHeight = header ? header.offsetHeight : 0;
  document.querySelectorAll('.sticky-header a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
  // Top skills toggle
  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('showMoreBtn');
    const full = document.getElementById('fullSkills');
    if(btn && full){
      btn.addEventListener('click', function(){
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const prevY = window.pageYOffset || document.documentElement.scrollTop || 0;
        if(expanded){
          full.classList.add('is-hidden');
          btn.textContent = i18nGet('buttons.show_more_skills','Show full skills');
          btn.setAttribute('aria-expanded','false');
          requestAnimationFrame(() => { window.scrollTo(0, prevY); });
        } else {
          full.classList.remove('is-hidden');
          btn.textContent = i18nGet('buttons.show_less','Show less');
          btn.setAttribute('aria-expanded','true');
          requestAnimationFrame(() => { window.scrollTo(0, prevY); });
        }
      });
    }
  });
  // Header nav compact mode: show one title and navigate with arrows on small screens
  document.addEventListener('DOMContentLoaded', function(){
    const headerEl = document.querySelector('.sticky-header');
    const prev = document.getElementById('headerNavPrev');
    const next = document.getElementById('headerNavNext');
    if(!headerEl || !prev || !next) return;
    const navLinks = Array.from(headerEl.querySelectorAll('a'));
    if(!navLinks.length) return;
    let active = 0;
    function setActive(i){
      active = ((i % navLinks.length) + navLinks.length) % navLinks.length;
      navLinks.forEach((a, idx) => a.classList.toggle('active', idx === active));
    }
    prev.addEventListener('click', function(e){ e.preventDefault(); setActive(active - 1); });
    next.addEventListener('click', function(e){ e.preventDefault(); setActive(active + 1); });
    function enterCompact(){ prev.style.display = 'flex'; next.style.display = 'flex'; setActive(active); }
    function leaveCompact(){ prev.style.display = 'none'; next.style.display = 'none'; navLinks.forEach(a=>a.classList.remove('active')); }
      // Focus schedule iframe after clicking the sticky schedule link
      const scheduleLink = document.getElementById('scheduleStickyLink');
      if(scheduleLink){
        scheduleLink.addEventListener('click', function(e){
          setTimeout(()=>{
            const iframe = document.querySelector('#schedule iframe');
            if(iframe) try{ iframe.focus(); }catch(err){}
          }, 600);
        });
      }
    const toggle = document.getElementById('toggleModeBtn');
    const langToggle = document.getElementById('langToggleBtn');
    function updateTogglePosition(){ if(!toggle || !headerEl) return; const h = headerEl.offsetHeight || 0; if(langToggle) langToggle.style.top = (h + 8) + 'px'; // place language toggle just below header
      // place theme toggle lower to avoid overlap with language control
      toggle.style.top = (h + 56) + 'px'; }
    function checkMode(){ if(window.innerWidth <= 900) enterCompact(); else leaveCompact(); updateTogglePosition(); }
    checkMode();
    window.addEventListener('resize', checkMode);
  });
  // Older experiences toggle (hidden by default)
  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('showOlderBtn');
    const older = document.getElementById('olderExperiences');
    if(btn && older){
      btn.addEventListener('click', function(){
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const prevY = window.pageYOffset || document.documentElement.scrollTop || 0;
        if(expanded){
          older.classList.add('is-hidden');
          btn.textContent = i18nGet('buttons.show_older_experience','Show older experience');
          btn.setAttribute('aria-expanded','false');
          requestAnimationFrame(() => { window.scrollTo(0, prevY); if(window.updateTimelineConnectors) window.updateTimelineConnectors(); });
        } else {
          older.classList.remove('is-hidden');
          btn.textContent = i18nGet('buttons.show_less','Show less');
          btn.setAttribute('aria-expanded','true');
          requestAnimationFrame(() => { window.scrollTo(0, prevY); if(window.updateTimelineConnectors){ setTimeout(window.updateTimelineConnectors,50); } });
        }
      });
    }
  });

  // Add Item / Snippet Editor UI handlers (Experience + multi-section editor)
  document.addEventListener('DOMContentLoaded', function(){
    // Experience modal (legacy single-item flow)
    const addBtn = document.getElementById('addExperienceBtn');
    const expModal = document.getElementById('addExperienceModal');
    const expForm = document.getElementById('addExperienceForm');
    const expCancel = document.getElementById('addExperienceCancel');
    let revealTimer = null;
    function openExpModal(){ if(!expModal) return; expModal.classList.remove('is-hidden'); expModal.setAttribute('aria-hidden','false'); const first = expModal.querySelector('input,textarea'); if(first) first.focus(); }
    function closeExpModal(){ if(!expModal) return; expModal.classList.add('is-hidden'); expModal.setAttribute('aria-hidden','true'); }
    if(addBtn && expModal){ addBtn.addEventListener('click', function(e){ e.preventDefault(); openExpModal(); }); }
    if(expCancel){ expCancel.addEventListener('click', function(e){ e.preventDefault(); closeExpModal(); }); }

    // Snippet modal controls (common to all sections)
    const snippetModal = document.getElementById('snippetModal');
    const snippetArea = document.getElementById('snippetArea');
    const copySnippetBtn = document.getElementById('copySnippetBtn');
    const closeSnippetBtn = document.getElementById('closeSnippetBtn');
    const addAnotherBtn = document.getElementById('addAnotherBtn');
    if(copySnippetBtn){ copySnippetBtn.addEventListener('click', function(){ if(!snippetArea) return; const txt = snippetArea.value; if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(()=>{ copySnippetBtn.textContent = 'Copied'; setTimeout(()=> copySnippetBtn.textContent='Copy to clipboard',1200); }).catch(()=>{}); } else { snippetArea.select(); document.execCommand('copy'); copySnippetBtn.textContent = 'Copied'; setTimeout(()=> copySnippetBtn.textContent='Copy to clipboard',1200); } }); }
    if(closeSnippetBtn){ closeSnippetBtn.addEventListener('click', function(){ if(snippetModal) snippetModal.classList.add('is-hidden'); if(snippetModal) snippetModal.setAttribute('aria-hidden','true'); }); }
    if(addAnotherBtn){ addAnotherBtn.addEventListener('click', function(){ if(snippetModal) snippetModal.classList.add('is-hidden'); if(snippetModal) snippetModal.setAttribute('aria-hidden','true'); openAddMenu(); }); }

    // Add Item Menu (multi-section editor)
    const addMenu = document.getElementById('addItemMenu');
    const addList = document.getElementById('addItemList');
    const formContainer = document.getElementById('addItemFormContainer');
    const addCancel = document.getElementById('addItemCancel');

    // Focus trap state for the Add Item Menu
    let addMenuPrevFocus = null;
    let addMenuKeydownHandler = null;

    function getFocusableWithin(container){
      if(!container) return [];
      const selectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
      return Array.from(container.querySelectorAll(selectors)).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
    }

    function openAddMenu(){
      if(!addMenu) return;
      addMenuPrevFocus = document.activeElement;
      addMenu.classList.remove('is-hidden');
      addMenu.setAttribute('aria-hidden','false');
      // focus first interactive element
      const first = addMenu.querySelector('button.add-item-option');
      if(first) first.focus();

      // attach keydown handler to trap Tab within the modal and handle Escape
      addMenuKeydownHandler = function(e){
        if(e.key === 'Escape'){ e.preventDefault(); closeAddMenu(); return; }
        if(e.key !== 'Tab') return;
        const focusable = getFocusableWithin(addMenu);
        if(focusable.length === 0) { e.preventDefault(); return; }
        const idx = focusable.indexOf(document.activeElement);
        if(e.shiftKey){
          // Shift+Tab: if at first, move to last
          if(idx === 0 || document.activeElement === addMenu){
            e.preventDefault(); focusable[focusable.length - 1].focus();
          }
        } else {
          // Tab: if at last, move to first
          if(idx === focusable.length - 1){
            e.preventDefault(); focusable[0].focus();
          }
        }
      };
      addMenu.addEventListener('keydown', addMenuKeydownHandler);
    }

    function closeAddMenu(){
      if(!addMenu) return;
      addMenu.classList.add('is-hidden');
      addMenu.setAttribute('aria-hidden','true');
      // remove keydown handler
      if(addMenuKeydownHandler){ addMenu.removeEventListener('keydown', addMenuKeydownHandler); addMenuKeydownHandler = null; }
      // restore previous focus
      try{ if(addMenuPrevFocus && typeof addMenuPrevFocus.focus === 'function') addMenuPrevFocus.focus(); }catch(e){}
      addMenuPrevFocus = null;
    }
    if(addCancel){ addCancel.addEventListener('click', function(e){ e.preventDefault(); closeAddMenu(); }); }

    // Utility: escape for HTML attributes/content
    const esc = (s)=> (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    // Section -> searchable key mapping so users can find paste locations
    function getSectionKey(section){
      const map = {
        'experience': '#experience',
        'technical-skills': '#technical-skills',
        'professional-development': '#professional-development',
        'interests': '#interests',
        'recommendations': '#recommendations',
        'education': '#education'
      };
      return map[section] || ('#snippet-' + (section || 'item'));
    }

    // Friendly, section-specific instructions (HTML) for non-technical users
    function getSectionInstructions(section, key){
      const commonSteps = ''+
        '<ol>'+
        '<li>Open <strong>index.html</strong> in your editor (e.g. VS Code, Notepad).</li>'+
        '<li>Use search (Ctrl+F) and find the marker: <code><!-- SNIPPET-KEY: ' + key + ' --></code>.</li>'+
        '<li>Paste the snippet immediately after that marker so it appears in the correct section.</li>'+
        '<li>Save the file and refresh your browser to see the new item.</li>'+
        '</ol>';
      const map = {
        'experience': ''+
          '<p><strong>Where to paste</strong>: inside the <code>&lt;div class="timeline"&gt;</code> container. Paste it before the <code>&lt;div class="show-more-wrap"&gt;</code> or before <code>&lt;div id="olderExperiences"&gt;</code> so it appears among visible entries.</p>' + commonSteps,
        'technical-skills': ''+
          '<p><strong>Where to paste</strong>: inside the <code>&lt;div id="topSkillsRow"&gt;</code> or the top-skills area. The snippet will add a small badge-like element.</p>' + commonSteps,
        'professional-development': ''+
          '<p><strong>Where to paste</strong>: inside the <code>&lt;div class="expertise"&gt;</code> list. Each item will appear as a learning/topic card.</p>' + commonSteps,
        'interests': ''+
          '<p><strong>Where to paste</strong>: inside the <code>&lt;div class="interests"&gt;</code> area. The snippet will add a short inline tag.</p>' + commonSteps,
        'recommendations': ''+
          '<p><strong>Where to paste</strong>: inside the <code>&lt;div class="rec-track"&gt;</code> carousel. If the carousel uses images, you may want to add a small image afterward, but the text will show without it.</p>' + commonSteps,
        'education': ''+
          '<p><strong>Where to paste</strong>: inside the <code>&lt;div class="edu-grid"&gt;</code>. The snippet will add a new education card.</p>' + commonSteps
      };
      return map[section] || ('<p>Paste the snippet near the marker <code><!-- SNIPPET-KEY: ' + key + ' --></code> in <strong>index.html</strong>.</p>' + commonSteps);
    }

    // Render the generated snippet and instructions inside the Add Item modal right pane
    function renderSnippetPreview(snippetStr, section){
      if(!formContainer) return;
      formContainer.innerHTML = '';
      const wrap = document.createElement('div'); wrap.className = 'snippet-preview';
      const key = getSectionKey(section);
      // instructions block (friendly, for non-technical users)
      const inst = document.createElement('div'); inst.className = 'snippet-instructions';
      inst.innerHTML = getSectionInstructions(section, key);
      // quick note
      const note = document.createElement('p'); note.className = 'muted-note';
      note.textContent = 'The snippet is shown below. Use the Copy button to copy it, then follow the simple steps above to paste it into index.html.';
      // key row for quick copy
      const keyRow = document.createElement('div'); keyRow.className = 'snippet-key-row';
      const keyLabel = document.createElement('span'); keyLabel.className = 'snippet-key-label'; keyLabel.textContent = 'Search key: ';
      const keyVal = document.createElement('code'); keyVal.className = 'snippet-key'; keyVal.textContent = key;
      const keyCopy = document.createElement('button'); keyCopy.type = 'button'; keyCopy.className = 'btn btn--ghost'; keyCopy.textContent = 'Copy key';
      keyRow.appendChild(keyLabel); keyRow.appendChild(keyVal); keyRow.appendChild(keyCopy);

      const ta = document.createElement('textarea'); ta.className = 'snippet-output'; ta.rows = 12; ta.value = snippetStr;
      ta.style.width = '100%'; ta.style.fontFamily = 'monospace'; ta.style.fontSize = '13px';
      const actions = document.createElement('div'); actions.className = 'modal-actions';
      const back = document.createElement('button'); back.type = 'button'; back.className = 'btn btn--ghost'; back.textContent = 'Back to edit';
      const addAnother = document.createElement('button'); addAnother.type = 'button'; addAnother.className = 'btn btn--ghost'; addAnother.textContent = 'Add another';
      const copyBtn = document.createElement('button'); copyBtn.type = 'button'; copyBtn.className = 'btn btn--primary'; copyBtn.textContent = 'Copy to clipboard';
      actions.appendChild(back); actions.appendChild(addAnother); actions.appendChild(copyBtn);

      wrap.appendChild(inst); wrap.appendChild(note); wrap.appendChild(keyRow); wrap.appendChild(ta); wrap.appendChild(actions);
      formContainer.appendChild(wrap);

      back.addEventListener('click', function(e){ e.preventDefault(); renderFormFor(section); });
      addAnother.addEventListener('click', function(e){ e.preventDefault(); renderFormFor(section); /* fresh form for another item */ });
      copyBtn.addEventListener('click', function(e){ e.preventDefault(); try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(ta.value).then(()=>{ copyBtn.textContent = 'Copied'; setTimeout(()=> copyBtn.textContent = 'Copy to clipboard',1200); }).catch(()=>{}); } else { ta.select(); document.execCommand('copy'); copyBtn.textContent = 'Copied'; setTimeout(()=> copyBtn.textContent = 'Copy to clipboard',1200); } }catch(err){ console.error('Copy failed', err); } });
      keyCopy.addEventListener('click', function(e){ e.preventDefault(); try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(key).then(()=>{ keyCopy.textContent = 'Copied'; setTimeout(()=> keyCopy.textContent = 'Copy key',1200); }).catch(()=>{}); } else { const tmp = document.createElement('textarea'); tmp.value = key; document.body.appendChild(tmp); tmp.select(); document.execCommand('copy'); tmp.remove(); keyCopy.textContent = 'Copied'; setTimeout(()=> keyCopy.textContent = 'Copy key',1200); } }catch(err){ console.error('Copy key failed', err); } });

      // attempt an automatic background copy like before (copy only the snippet content)
      try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(snippetStr).catch(()=>{}); } }catch(e){}
    }

    // Renderer: build simple forms for each supported section
    function renderFormFor(section){
      if(!formContainer) return;
      formContainer.innerHTML = '';
      const form = document.createElement('form');
      form.className = 'add-item-form';
      form.dataset.section = section;
      // helper to append labeled input
      const L = (html) => { const d = document.createElement('div'); d.innerHTML = html; form.appendChild(d); };
      if(section === 'experience'){
        L('<label>Date (shown on timeline)<br><input name="date" placeholder="Jun 2026 — Present" required></label>');
        L('<label>Role<br><input name="role" placeholder="QA Engineer"></label>');
        L('<label>Company meta<br><input name="company_meta" placeholder="Company · Jun 2026 - Present"></label>');
        L('<label>Note<br><input name="note" placeholder="Short note"></label>');
        L('<label>Bullets (one per line)<br><textarea name="bullets" rows="4" placeholder="Led automation\nImproved CI"></textarea></label>');
        L('<label>Logo src (optional)<br><input name="logoSrc" placeholder="assets/logos/example.png"></label>');
      } else if(section === 'technical-skills'){
        L('<label>Skill name<br><input name="skill" placeholder="Python / Playwright" required></label>');
        // build a dropdown of existing categories present on the page and a text input to create a new one
        const existingCats = Array.from(document.querySelectorAll('.expertise-category .expertise-category-title')).map(n=> (n.textContent||'').trim()).filter(Boolean);
        const opts = ['<option value="">— select existing —</option>'].concat(existingCats.map(c=> '<option value="'+esc(c)+'">'+esc(c)+'</option>')).join('');
        L('<label>Choose existing category<br><select name="categorySelect">'+opts+'</select></label>');
        L('<label>Or create new category<br><input name="categoryText" placeholder="Language / Framework / Tool"></label>');
        L('<label>Optional details (comma separated)<br><input name="details" placeholder="API Testing, CI/CD"></label>');
      } else if(section === 'professional-development'){
        L('<label>Title<br><input name="title" placeholder="Advanced Python for Test Automation" required></label>');
        L('<label>Short note<br><input name="note" placeholder="Course / ongoing learning"></label>');
      } else if(section === 'interests'){
        L('<label>Interest<br><input name="interest" placeholder="AI-assisted Testing" required></label>');
      } else if(section === 'recommendations'){
        L('<label>Name<br><input name="name" placeholder="Recommender name" required></label>');
        L('<label>Title / meta<br><input name="meta" placeholder="Principal QA Engineer, Company"></label>');
        L('<label>Quote (one paragraph)<br><textarea name="quote" rows="4" placeholder="Short recommendation text"></textarea></label>');
      } else if(section === 'education'){
        L('<label>Degree / Certificate<br><input name="degree" placeholder="Software and Information Systems Engineering"></label>');
        L('<label>Institution<br><input name="institution" placeholder="Universidad XYZ"></label>');
        L('<label>Note<br><input name="note" placeholder="Completed 4th year; degree not completed."></label>');
      } else {
        L('<label>Content<br><textarea name="content" rows="4"></textarea></label>');
      }
      // actions
      const actions = document.createElement('div'); actions.className = 'modal-actions';
      const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'btn btn--primary'; submit.textContent = 'Generate';
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn btn--ghost'; cancel.textContent = 'Cancel';
      cancel.addEventListener('click', function(e){ e.preventDefault(); closeAddMenu(); });
      actions.appendChild(cancel); actions.appendChild(submit); form.appendChild(actions);
      formContainer.appendChild(form);

      // submit handler to generate snippet for each section
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const fd = new FormData(form);
        let snippetStr = '';
        try{
          if(section === 'experience'){
            const date = (fd.get('date')||'').trim();
            const role = (fd.get('role')||'').trim();
            const company_meta = (fd.get('company_meta')||'').trim();
            const note = (fd.get('note')||'').trim();
            const bulletsRaw = (fd.get('bullets')||'').trim();
            const bullets = bulletsRaw ? bulletsRaw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean) : [];
            const logoSrc = (fd.get('logoSrc')||'').trim();
            const parts = [];
            parts.push('<div class="experience-item" data-date="'+esc(date)+'">');
            parts.push('  <div class="experience-header">');
            if(logoSrc) parts.push('    <img class="company-logo" src="'+esc(logoSrc)+'" alt="">');
            parts.push('    <div>');
            parts.push('      <h4>'+esc(role)+'</h4>');
            parts.push('      <span class="experience-meta">'+esc(company_meta)+'</span>');
            parts.push('    </div>');
            parts.push('  </div>');
            if(note) parts.push('  <p class="muted-note">'+esc(note)+'</p>');
            if(bullets && bullets.length){ parts.push('  <ul>'); bullets.forEach(b=> parts.push('    <li>'+esc(b)+'</li>')); parts.push('  </ul>'); }
            parts.push('</div>');
            snippetStr = parts.join('\n');
          } else if(section === 'technical-skills'){
            const skill = (fd.get('skill')||'').trim();
            const selected = (fd.get('categorySelect')||'').trim();
            const categoryText = (fd.get('categoryText')||'').trim();
            const category = selected || categoryText; // prefer dropdown when selected
            const details = (fd.get('details')||'').trim();
            const parts = [];
            // render a badge and, when a category is present, include it as a data attribute
            const attr = category ? ' data-category="'+esc(category)+'"' : '';
            parts.push('<div class="skill-badge"'+attr+'>'+esc(skill)+'</div>');
            if(details) parts.push('<!-- '+esc(details)+' -->');
            snippetStr = parts.join('\n');
          } else if(section === 'professional-development'){
            const title = (fd.get('title')||'').trim();
            const note = (fd.get('note')||'').trim();
            const parts = [];
            parts.push('<div class="expertise-item">'+esc(title)+'</div>');
            if(note) parts.push('<!-- '+esc(note)+' -->');
            snippetStr = parts.join('\n');
          } else if(section === 'interests'){
            const interest = (fd.get('interest')||'').trim();
            snippetStr = '<span>'+esc(interest)+'</span>';
          } else if(section === 'recommendations'){
            const name = (fd.get('name')||'').trim();
            const meta = (fd.get('meta')||'').trim();
            const quote = (fd.get('quote')||'').trim();
            const parts = [];
            parts.push('<div class="rec-card">');
            parts.push('  <div class="rec-name">'+esc(name)+'</div>');
            if(meta) parts.push('  <div class="rec-meta">'+esc(meta)+'</div>');
            if(quote) parts.push('  <blockquote class="rec-message">'+esc(quote)+'</blockquote>');
            parts.push('</div>');
            snippetStr = parts.join('\n');
          } else if(section === 'education'){
            const degree = (fd.get('degree')||'').trim();
            const institution = (fd.get('institution')||'').trim();
            const note = (fd.get('note')||'').trim();
            const parts = [];
            parts.push('<div class="edu-card">');
            parts.push('  <div class="accent"></div>');
            parts.push('  <h4>'+esc(degree)+'</h4>');
            if(institution) parts.push('  <span class="experience-meta">'+esc(institution)+'</span>');
            if(note) parts.push('  <p class="edu-note">'+esc(note)+'</p>');
            parts.push('</div>');
            snippetStr = parts.join('\n');
          } else {
            snippetStr = esc(fd.get('content')||'');
          }
        }catch(err){ console.error('Failed to build snippet for', section, err); }
        // render preview + instructions inside the same Add Item modal (replace form)
        renderSnippetPreview(snippetStr, section);
      });
    }

    // wire up left-nav options
    if(addList){
      addList.querySelectorAll('.add-item-option').forEach(btn => {
        btn.addEventListener('click', function(e){
          e.preventDefault();
          const section = this.getAttribute('data-section');
          // highlight selection
          addList.querySelectorAll('.add-item-option').forEach(b => b.classList.toggle('active', b === this));
          renderFormFor(section);
        });
      });
      // auto-render first option on open
      const first = addList.querySelector('.add-item-option');
      if(first) first.click();
    }

    // close add menu on Escape
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ closeAddMenu(); closeExpModal(); if(snippetModal) snippetModal.classList.add('is-hidden'); } });

    // Keyboard shortcut: Ctrl+Shift+E reveals the Add button and opens the Add Item menu
    document.addEventListener('keydown', function(e){
      const tgt = e.target || {}; const tag = (tgt.tagName || '').toLowerCase();
      if(tag === 'input' || tag === 'textarea' || tgt.isContentEditable) return;
      if(e.ctrlKey && e.shiftKey && (e.key && e.key.toLowerCase() === 'e')){
        e.preventDefault();
        document.documentElement.classList.add('show-add-btn');
        openAddMenu();
        clearTimeout(revealTimer);
        revealTimer = setTimeout(()=>{ document.documentElement.classList.remove('show-add-btn'); }, 12000);
      }
    });
  });
  // Light / Dark mode toggle — default to dark mode (ignore local config)
  (function(){
    const btnMode = document.getElementById('toggleModeBtn');
    const bodyEl = document.body;
    function applyMode(isLight){
      if(isLight){
        bodyEl.classList.add('light-mode');
        btnMode.textContent = '🌞';
        btnMode.setAttribute('aria-label','Switch to dark mode');
      } else {
        bodyEl.classList.remove('light-mode');
        btnMode.textContent = '🌙';
        btnMode.setAttribute('aria-label','Switch to light mode');
      }
      // Do not persist theme in localStorage — site defaults to dark on every load
    }
    // initialize: always start in dark mode regardless of user or system prefs
    applyMode(false);
    if(btnMode){
      btnMode.addEventListener('click', function(){
        applyMode(!document.body.classList.contains('light-mode'));
      });
    }
  })();

  // Language toggle: minimal i18n loader and persistence
  (function(){
    const LANG_KEY = 'siteLang';
    function applyLangClass(lang){ document.documentElement.classList.remove('lang-en','lang-es'); document.documentElement.classList.add('lang-' + lang); }
    function setLangButtonLabel(lang){
      const b = document.getElementById('langToggleBtn'); if(!b) return;
      const active = (lang === 'es') ? 'es' : 'en';
      b.innerHTML = ''+
        '<span class="lang-side '+(active==='en'?'active':'')+'" data-side="en">EN</span>'+
        '<span class="lang-divider">|</span>'+
        '<span class="lang-side '+(active==='es'?'active':'')+'" data-side="es">ES</span>';
    }
    window.setLanguage = function(lang){ if(!lang) return; // try to fetch translations, but still apply label/class even if fetch fails
      fetch('i18n/' + lang + '.json').then(r=> r.json()).then(data => {
        window.__i18n = data;
        document.querySelectorAll('[data-i18n]').forEach(el=>{
          const key = el.getAttribute('data-i18n');
          if(!key) return;
          const attr = el.getAttribute('data-i18n-attr');
          const parts = key.split('.');
          let v = data;
          for(const p of parts){ if(v && typeof v === 'object' && p in v) v = v[p]; else { v = undefined; break; } }
          if(v === undefined || v === null) return;
          if(attr) el.setAttribute(attr, v);
          else el.textContent = v;
        });
        applyLangClass(lang);
        setLangButtonLabel(lang);
        try{ localStorage.setItem(LANG_KEY, lang); }catch(e){}
      }).catch(err=>{
        console.warn('Failed to load i18n', err); applyLangClass(lang); setLangButtonLabel(lang); try{ localStorage.setItem(LANG_KEY, lang); }catch(e){}
      });
    };
    document.addEventListener('DOMContentLoaded', function(){
      const saved = (localStorage.getItem(LANG_KEY) || 'en');
      // initialize button label and class immediately
      setLangButtonLabel(saved); applyLangClass(saved);
      // attempt to load and apply translations
      if(window.setLanguage) window.setLanguage(saved);
      const btn = document.getElementById('langToggleBtn');
      if(btn){
        // clicking anywhere toggles; clicking a side also toggles to that exact language
        btn.addEventListener('click', function(e){
          const targetSide = e.target && e.target.getAttribute && e.target.getAttribute('data-side');
          const cur = document.documentElement.classList.contains('lang-es') ? 'es' : 'en';
          const next = targetSide ? (targetSide === 'es' ? 'es' : 'en') : (cur === 'en' ? 'es' : 'en');
          if(next !== cur) window.setLanguage(next);
        });
      }
    });
  })();
  // Download PDF button: prepare compact view and trigger print
  (function(){
    const downloadBtn = document.getElementById('downloadPdfBtn');
    const full = document.getElementById('fullSkills');
    if(!downloadBtn) return;
    downloadBtn.addEventListener('click', function(){
      let prevHidden = null;
      if(full){ prevHidden = full.classList.contains('is-hidden'); full.classList.add('is-hidden'); }
      // enable dark print variant (CSS rules under @media print target this class)
      document.documentElement.classList.add('print-dark-mode');
      document.body.classList.add('print-dark-mode');
      // ensure light-mode off for print clarity
      document.body.classList.remove('light-mode');
      // Ensure dark print styles are applied before printing.
      // Force a layout reflow then wait for two animation frames to allow the UA to apply print styles.
      const triggerPrint = () => {
        try { document.documentElement.getBoundingClientRect(); } catch(e){}
        requestAnimationFrame(()=> requestAnimationFrame(()=> { window.print(); }));
      };
      // Primary: use RAF-based trigger
      triggerPrint();
      // Fallback: ensure print is called after a short timeout if RAF doesn't fire
      const fallbackTimer = setTimeout(() => { try{ window.print(); } catch(e){} }, 1000);
      // restore after print using onafterprint when supported
      const restore = () => {
        if(full) full.classList.toggle('is-hidden', !!prevHidden);
        document.documentElement.classList.remove('print-dark-mode');
        document.body.classList.remove('print-dark-mode');
        try{ clearTimeout(fallbackTimer); }catch(e){}
        window.removeEventListener('afterprint', restore);
      };
      window.addEventListener('afterprint', restore);
      // fallback restore in 3s
      setTimeout(restore, 3000);
    });

  })();
  // Recommendations carousel script (initialize after DOM ready)
  document.addEventListener('DOMContentLoaded', function(){
    const container = document.getElementById('recommendationsList');
    if(!container) return;
    const track = container.querySelector('.rec-track');
    const cards = track ? Array.from(track.children) : [];
    const dots = container.querySelectorAll('.rec-dot');
    const prevBtn = container.querySelector('.rec-nav.prev');
    const nextBtn = container.querySelector('.rec-nav.next');
    if(!cards.length) return;

    let current = 0;
    const interval = 20000; // 20 seconds between cards
    let timer = null;
    let isDragging = false;
    let startX = 0;
    let deltaX = 0;

    function setPosition(index, animate = true){
      const w = container.clientWidth || track.clientWidth || 0;
      const x = -Math.round(index * w);
      if(!animate) track.style.transition = 'none';
      else track.style.transition = '';
      track.style.transform = `translateX(${x}px)`;
      // toggle active class for semantics
      cards.forEach((c,i)=> c.classList.toggle('active', i===index));
      dots.forEach((d,i)=> d.classList.toggle('active', i===index));
      current = index;
    }

    function show(index){
      const clamped = ((index % cards.length) + cards.length) % cards.length;
      setPosition(clamped, true);
    }

    function scheduleNext(){
      if(timer){ clearTimeout(timer); timer = null; }
      timer = setTimeout(() => { show(current + 1); scheduleNext(); }, interval);
    }
    function start(){ if(!timer) scheduleNext(); }
    function stop(){ if(timer){ clearTimeout(timer); timer = null; } }
    function reset(){ stop(); scheduleNext(); }

    // dots
    if(dots && dots.length){
      dots.forEach(d => d.addEventListener('click', function(){ const idx = Number(this.getAttribute('data-dot')); if(!Number.isNaN(idx)) { show(idx); reset(); } }));
    }

    // arrows
    if(prevBtn) prevBtn.addEventListener('click', (e)=>{ e.preventDefault(); show(current - 1); reset(); });
    if(nextBtn) nextBtn.addEventListener('click', (e)=>{ e.preventDefault(); show(current + 1); reset(); });

    // pointer drag / touch support
    track.style.touchAction = 'pan-y';
    track.addEventListener('pointerdown', (e)=>{
      isDragging = true;
      startX = e.clientX;
      deltaX = 0;
      track.setPointerCapture(e.pointerId);
      track.style.transition = 'none';
      stop();
    });
    track.addEventListener('pointermove', (e)=>{
      if(!isDragging) return;
      deltaX = e.clientX - startX;
      const w = container.clientWidth || track.clientWidth || 0;
      const base = -current * w;
      track.style.transform = `translateX(${base + deltaX}px)`;
    });
    function endDrag(){
      if(!isDragging) return;
      isDragging = false;
      const threshold = Math.min(120, container.clientWidth * 0.18);
      if(deltaX < -threshold) show(current + 1);
      else if(deltaX > threshold) show(current - 1);
      else show(current);
      start();
    }
    track.addEventListener('pointerup', (e)=>{ track.releasePointerCapture && track.releasePointerCapture(e.pointerId); endDrag(); });
    track.addEventListener('pointercancel', endDrag);
    // pause autoplay when hovering
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', start);

    // resize handler to keep alignment
    window.addEventListener('resize', ()=> setPosition(current, false));

    // init
    setPosition(0, false);
    start();
  });
  // Fallback delegation for the Show full skills button in case earlier listeners didn't bind
  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('#showMoreBtn');
    if(!btn) return;
    const full = document.getElementById('fullSkills');
    if(!full) return;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const prevY = window.pageYOffset || document.documentElement.scrollTop || 0;
    if(expanded){
      full.classList.add('is-hidden');
      btn.textContent = i18nGet('buttons.show_more_skills','Show full skills');
      btn.setAttribute('aria-expanded','false');
      requestAnimationFrame(() => { window.scrollTo(0, prevY); });
    } else {
      full.classList.remove('is-hidden');
      btn.textContent = i18nGet('buttons.show_less','Show less');
      btn.setAttribute('aria-expanded','true');
      requestAnimationFrame(() => { window.scrollTo(0, prevY); });
    }
  });
  // Also attach a resilient direct handler once DOM is ready to ensure toggling works
  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('showMoreBtn');
    const full = document.getElementById('fullSkills');
    if(!btn || !full) return;
    // ensure button has type attribute
    btn.type = btn.type || 'button';
    const handler = function(ev){
      ev.preventDefault();
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const prevY = window.pageYOffset || document.documentElement.scrollTop || 0;
      if(expanded){ full.classList.add('is-hidden'); btn.textContent = i18nGet('buttons.show_more_skills','Show full skills'); btn.setAttribute('aria-expanded','false'); }
      else { full.classList.remove('is-hidden'); btn.textContent = i18nGet('buttons.show_less','Show less'); btn.setAttribute('aria-expanded','true'); }
      requestAnimationFrame(() => { window.scrollTo(0, prevY); });
    };
    // remove previous duplicate listeners by cloning node (safe cleanup)
      const clean = btn.cloneNode(true);
      btn.parentNode.replaceChild(clean, btn);
      clean.addEventListener('click', handler);
    });

  })();
