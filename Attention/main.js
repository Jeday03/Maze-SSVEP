const scriptGlobals = {}; // Objeto para armazenar referências às funções e variáveis globais dos scripts

let ws = null;

function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

async function initBCI(){
  try{
    const cfg = await (await fetch('/cfg.json')).json();
    console.log('[CFG]', cfg);

    if (!cfg.bci) {
      console.warn('BCI DESATIVADO — ignorando WebSocket');
      return; // ← não carrega nada
    }

    if (cfg.bci) {
    await loadScript('./bci_client.js'); // ele usa ws://localhost:8767
    }


  }catch(e){
    console.error('Erro /cfg.json', e);
  }
}
initBCI();



function loadNewScript(scriptPath) { // Função para carregar um novo script
    var script = document.createElement('script');
    script.src = scriptPath;
    document.body.appendChild(script);
}

function loadNextScript(scriptsToLoad, currentIndex) { // Função para carregar vários scripts em sequência
    if (currentIndex < scriptsToLoad.length) {
        var script = document.createElement('script');
        script.src = scriptsToLoad[currentIndex];
        script.onload = function() {
            currentIndex++;
            loadNextScript(scriptsToLoad, currentIndex); // Carrega o próximo script quando este estiver carregado
        };
        document.body.appendChild(script);
    }
}

function removeScriptBySrc(src) { // Função para remover um script do DOM pelo seu src
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var scriptSrc = scripts[i].src.split('/').pop();      // Obtém apenas o nome do arquivo do src do script atual
        if (scriptSrc === src) { // Limpa as referências às funções e variáveis globais do script antes de remover o script
            const globals = scriptGlobals[src] || {} 
            for (const key in globals) {
                if (globals.hasOwnProperty(key)) {window[key] = null;}
            }
            scripts[i].parentNode.removeChild(scripts[i]);
            break;
        }
    }
}

function clearScriptGlobals() { // Função para limpar todas as referências às funções e variáveis globais dos scripts
    for (const src in scriptGlobals) {
        if (scriptGlobals.hasOwnProperty(src)) {
            for (const key in scriptGlobals[src]) {
                if (scriptGlobals[src].hasOwnProperty(key)) {
                    window[key] = null;
                }
            }
        }
    }
}

function addScriptGlobals(src, globals) { // Função para adicionar um script ao objeto scriptGlobals
    scriptGlobals[src] = globals;
}


function handleDocumentClick(event) { // Event Listener para manipular cliques no documento
    // Funções globais usadas pelos scripts
    minhaFuncaoGlobal();
}

//Carregamento de paginas + Codigos
document.getElementById('treinamento').addEventListener('click', function() { 
    document.getElementById('telaInicial').style.display = 'none';
    document.getElementById('telaTraining').style.display = 'block';
    loadNewScript('training.js');
});

document.getElementById('trainingButton1').addEventListener('click', function() {
    document.getElementById('telaInicial').style.display = 'flex';
    document.getElementById('telaTraining').style.display = 'none';
    removeScriptBySrc('training.js');
    for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]); //Retirando o temporizador de Training, de forma a parar seu codigo
    }
});

document.getElementById('ranking').addEventListener('click', function() { 
    document.getElementById('telaInicial').style.display = 'none';
    document.getElementById('telaRanking').style.display = 'block';
    loadNewScript('ranking.js');
});

document.getElementById('voltarRanking').addEventListener('click', function() {
    document.getElementById('telaInicial').style.display = 'flex';
    document.getElementById('telaRanking').style.display = 'none';
    removeScriptBySrc('ranking.js');
});



// Event Listener para iniciar o jogo principal
document.getElementById('startButton').addEventListener('click', function() {
    document.getElementById('telaInicial').style.display = 'none';
    document.getElementById('canvas-container').style.display = 'block';
    // Limpa todos os ouvintes de eventos do documento
    document.removeEventListener('click', handleDocumentClick);

    // Define funções globais usadas pelos scripts para uma versão vazia
    minhaFuncaoGlobal = function() {};
    var scriptsToLoad = ['maze_class.js', 'maze.js']; // Lista de scripts a serem carregados
    var currentIndex = 0;
    loadNextScript(scriptsToLoad, currentIndex);
});

// Event Listener para voltar ao menu principal durante o jogo
document.getElementById('menuGaming').addEventListener('click', function() {
    removeScriptBySrc('maze.js');
    removeScriptBySrc('maze_class.js');
    clearScriptGlobals();
    document.getElementById('telaInicial').style.display = 'flex';
    document.getElementById('canvas-container').style.display = 'none';
});

document.getElementById('voltarInicio').addEventListener('click', function() {
    removeScriptBySrc('maze.js');
    removeScriptBySrc('maze_class.js');
    clearScriptGlobals();
    document.getElementById('telaInicial').style.display = 'flex';
    document.getElementById('canvas-container').style.display = 'none';
});

// Event Listener para confirmar um input

document.getElementById('confirmButton').addEventListener('click', function() {
  var enteredID = document.getElementById('inputID').value;
  let user = { ID: enteredID };

  if (window.ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(user));
  }

  const welcomeMessage = document.querySelector('#telaInicial p');
  if (welcomeMessage) {
    welcomeMessage.innerText = "Bem-vindo ao Maze Game, " + enteredID + "! Clique em Jogar para começar.";
  } else {
      console.error('The welcome message element was not found.');
  }
});

function showActiveScripts() {
    var activeScripts = [];
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src) {
            activeScripts.push(scripts[i].src);
        }
    }
    console.log("Scripts JavaScript ativos:");
    console.log(activeScripts);
}

addEventListener("keydown", function(e){
    if (e.code == "KeyB") showActiveScripts();
});  

const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.999;
canvas.height = window.innerHeight * 0.9;

//Parte de comunicação com o servidor Python
//const ws = new WebSocket('ws://localhost:8766');
