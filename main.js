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
    window.addEventListener('load', function(){
      try{ updateConnectors(); }catch(e){}
      // schedule a few additional recalculations to handle delayed image/layout changes
      setTimeout(()=>{ try{ updateConnectors(); }catch(e){} }, 60);
      setTimeout(()=>{ try{ updateConnectors(); }catch(e){} }, 250);
      requestAnimationFrame(()=> requestAnimationFrame(()=> { try{ updateConnectors(); }catch(e){} }));
    });
    window.addEventListener('DOMContentLoaded', function(){ try{ updateConnectors(); }catch(e){} });
    window.addEventListener('resize', function(){ window.requestAnimationFrame(updateConnectors); });
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
        if(schedule) setTimeout(updateConnectors, 60);
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
          btn.textContent = 'Show full skills';
          btn.setAttribute('aria-expanded','false');
          requestAnimationFrame(() => { window.scrollTo(0, prevY); });
        } else {
          full.classList.remove('is-hidden');
          btn.textContent = 'Show less';
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
    function updateTogglePosition(){ if(!toggle || !headerEl) return; const h = headerEl.offsetHeight || 0; toggle.style.top = (h + 8) + 'px'; }
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
          btn.textContent = 'Show older experience';
          btn.setAttribute('aria-expanded','false');
          requestAnimationFrame(() => { window.scrollTo(0, prevY); if(window.updateTimelineConnectors) window.updateTimelineConnectors(); });
        } else {
          older.classList.remove('is-hidden');
          btn.textContent = 'Show less';
          btn.setAttribute('aria-expanded','true');
          requestAnimationFrame(() => { window.scrollTo(0, prevY); if(window.updateTimelineConnectors){ setTimeout(window.updateTimelineConnectors,50); } });
        }
      });
    }
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
      btn.textContent = 'Show full skills';
      btn.setAttribute('aria-expanded','false');
      requestAnimationFrame(() => { window.scrollTo(0, prevY); });
    } else {
      full.classList.remove('is-hidden');
      btn.textContent = 'Show less';
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
      if(expanded){ full.classList.add('is-hidden'); btn.textContent = 'Show full skills'; btn.setAttribute('aria-expanded','false'); }
      else { full.classList.remove('is-hidden'); btn.textContent = 'Show less'; btn.setAttribute('aria-expanded','true'); }
      requestAnimationFrame(() => { window.scrollTo(0, prevY); });
    };
    // remove previous duplicate listeners by cloning node (safe cleanup)
      const clean = btn.cloneNode(true);
      btn.parentNode.replaceChild(clean, btn);
      clean.addEventListener('click', handler);
    });

  })();
