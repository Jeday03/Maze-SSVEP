(function(){
  const WS_URL = "ws://localhost:8767";
  const MIN_CONF = 0.35;
  let ws = null;

  function connect(){
    try{
      ws = new WebSocket(WS_URL);
      ws.onopen    = ()=>console.log("[BCI] conectado:", WS_URL);
      ws.onclose   = ()=>console.log("[BCI] desconectado");
      ws.onerror   = (e)=>console.warn("[BCI] erro", e);
      ws.onmessage = (e)=>{
        try{
          const msg = JSON.parse(e.data);
          if(!msg || !msg.intent) return;
          if(typeof window.handleBCICommand === "function" && (msg.conf ?? 0) >= MIN_CONF){
            window.handleBCICommand(msg.intent);
          }
        }catch(err){ console.warn("[BCI] JSON inválido", err); }
      };
    }catch(e){ console.error("[BCI] falha ao conectar", e); }
  }

  connect();
})();
