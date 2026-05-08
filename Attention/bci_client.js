(function(){
  const WS_URL = "ws://localhost:8767";
  const MIN_CONF = 0.48;
  const REQUIRED_VOTES = 2;

  let ws = null;
  let lastIntent = null;
  let voteCount = 0;
  let lastCommandTime = 0;
  const COMMAND_COOLDOWN_MS = 600;

  const THRESHOLDS = {
  up: 0.48,
  down: 0.47,
  right: 0.50,
  left: 0.52
};

  function connect(){
    try{
      ws = new WebSocket(WS_URL);

      ws.onopen = () => console.log("[BCI] conectado:", WS_URL);
      ws.onclose = () => console.log("[BCI] desconectado");
      ws.onerror = (e) => console.warn("[BCI] erro", e);

      ws.onmessage = (e) => {
        try{
          const msg = JSON.parse(e.data);
          if(!msg || !msg.intent) return;

          const intent = msg.intent;
          const conf = msg.conf ?? 0;

          if(conf < (THRESHOLDS[intent] ?? MIN_CONF)) return;

          if(intent === lastIntent){
            voteCount++;
          } else {
            lastIntent = intent;
            voteCount = 1;
          }

          const now = Date.now();

          if(
            voteCount >= REQUIRED_VOTES &&
            now - lastCommandTime > COMMAND_COOLDOWN_MS &&
            typeof window.handleBCICommand === "function"
          ){
            console.log("[BCI] comando aceito:", intent, "conf:", conf, "votos:", voteCount);
            window.handleBCICommand(intent);
            lastCommandTime = now;
            voteCount = 0;
            lastIntent = null;
          }

        }catch(err){
          console.warn("[BCI] JSON inválido", err);
        }
      };

    }catch(e){
      console.error("[BCI] falha ao conectar", e);
    }
  }

  connect();
})();