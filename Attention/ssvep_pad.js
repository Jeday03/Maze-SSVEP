const HOLD_MS = 200; 


(function(){
  const mount = document.getElementById('ssvep-hud');
  if(!mount) return;

  mount.innerHTML = `
    <div class="ssvpad-wrap">
      <div class="ssvpad-toolbar">
        <span class="ssvpad-badge" id="ssv-status">parado</span>
        <span class="ssvpad-badge">Espaço: iniciar</span>
        <span class="ssvpad-badge">F: tela cheia</span>
      </div>
      <p class="ssvpad-hint">Frequências: ↑ 12 Hz · ← 10 Hz · → 15 Hz · ↓ 8 Hz</p>
      <div class="ssvpad-pad" role="application" aria-label="Teclado SSVEP">
        <div class="ssvpad-ph" aria-hidden="true"></div>
        <button class="ssvpad-key" data-dir="up"    id="ssv-up"    aria-label="Cima">↑</button>
        <div class="ssvpad-ph" aria-hidden="true"></div>

        <button class="ssvpad-key" data-dir="left"  id="ssv-left"  aria-label="Esquerda">←</button>
        <div class="ssvpad-ph" aria-hidden="true"></div>
        <button class="ssvpad-key" data-dir="right" id="ssv-right" aria-label="Direita">→</button>

        <div class="ssvpad-ph" aria-hidden="true"></div>
        <button class="ssvpad-key" data-dir="down"  id="ssv-down"  aria-label="Baixo">↓</button>
        <div class="ssvpad-ph" aria-hidden="true"></div>
      </div>
    </div>
  `;

  // ---- Config de flicker ---- //
  const FREQS_HZ = { up:12.0, left:10.0, right:15.0, down:8.0 };
  const PHASE =   { up:0.0,  left:Math.PI/2, right:Math.PI, down:3*Math.PI/2 };
  const dutyCycle = 0.5;

  const els = {
    status: document.getElementById('ssv-status'),
    up:  document.getElementById('ssv-up'),
    left:document.getElementById('ssv-left'),
    right:document.getElementById('ssv-right'),
    down:document.getElementById('ssv-down'),
  };

  let running=false, startT=0, raf=null;

  function setKey(el, on){
    if(on){ el.classList.add('ssv-on');  el.classList.remove('ssv-off'); }
    else { el.classList.add('ssv-off'); el.classList.remove('ssv-on');  }
  }

  function tick(ts){
    if(!startT) startT=ts;
    const t=(ts-startT)/1000;
    for(const dir of ['up','left','right','down']){
      const f=FREQS_HZ[dir], phase=PHASE[dir]||0;
      const s=Math.sin(2*Math.PI*f*t+phase);
      const on=(dutyCycle===0.5) ? (s>=0) : (s>=Math.cos(Math.PI*dutyCycle));
      setKey(els[dir], on);
    }
    raf=requestAnimationFrame(tick);
  }

  function start(){
    if(running) return;
    running=true; startT=0; els.status.textContent='rodando';
    for(const d of ['up','left','right','down']) setKey(els[d], false);
    raf=requestAnimationFrame(tick);
  }
  function stop(){
    running=false; els.status.textContent='parado';
    if(raf) cancelAnimationFrame(raf);
    for(const d of ['up','left','right','down']) setKey(els[d], false);
  }

  // Dispara o KeyboardEvent com WASD já existente.
function pressVirtual(dir, holdMs = HOLD_MS){
  const map = {
    up:    { key: 'w', code: 'KeyW' },
    left:  { key: 'a', code: 'KeyA' },
    down:  { key: 's', code: 'KeyS' },
    right: { key: 'd', code: 'KeyD' },
  };
  const m = map[dir]; if(!m) return;

  window.dispatchEvent(new KeyboardEvent('keydown', { key:m.key, code:m.code, bubbles:true }));
  setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent('keyup',   { key:m.key, code:m.code, bubbles:true }));
  }, holdMs);
}



  function flash(el){ el.classList.add('ssv-active'); setTimeout(()=>el.classList.remove('ssv-active'),120); }
  for(const dir of ['up','left','right','down']){
    els[dir].addEventListener('click', ev=>{
      ev.preventDefault();
      flash(els[dir]);
      pressVirtual(dir);
    });
  }


  window.addEventListener('keydown', e=>{
    if(e.code==='Space'){ e.preventDefault(); running?stop():start(); return; }
    if(e.key && e.key.toLowerCase()==='f'){
      if(!document.fullscreenElement){ document.documentElement.requestFullscreen().catch(()=>{}); }
      else { document.exitFullscreen().catch(()=>{}); }
    }
  });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden && running) stop(); });


  window.handleBCICommand = function(dir){
    if(!['up','down','left','right'].includes(dir)) return;
    flash(els[dir]);
    pressVirtual(dir);
  };


  stop();
})();
