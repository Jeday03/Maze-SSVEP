// Variaveis
// JOGO: [Maze_size, Cell_size, nº NPC_P, nº NPC_A, minutos, segundos]
const level = {
    //Baixo sem NPC (Atenção Sustentada)
    1: [8, 60, 0, 0, 0 ,45],
    2: [8, 60, 0, 0, 0 ,45],
    3: [8, 60, 0, 0, 0 ,45],
    //Baixo com NPC agressivo (Atenção sustentada, dividida, alternado)
    4: [8, 60, 0, 1, 0 ,55],
    5: [8, 60, 0, 2, 0 ,55],
    6: [8, 60, 0, 3, 0 ,55],
    //Médio com NPC agressivo (Atenção sustentada)
    7: [11, 60, 0, 2, 1 ,45],
    8: [11, 60, 0, 3, 1 ,45],
    9: [11, 60, 0, 4, 1 ,45],
    //Médio com NPC passivo e agressivo ()
    10: [11, 60, 1, 2, 1 ,45],
    11: [11, 60, 2, 3, 1 ,45],
    12: [11, 60, 3, 4, 1 ,45],
    //Grande com NPC passivo e agressivo
    13: [14, 60, 2, 3, 2, 30],
    14: [14, 60, 3, 4, 2, 30],
    15: [14, 60, 4, 5, 2, 30],
  };
let maze;
let canvasMaze = "gamingCanvas";
let canvasContainer = "canvas-container"

let player;
let obj;
let npcA = [];
let npcP = [];

let player_size; //
let obj_size; //
let npc_size; //

let player_color = 'blue'; //
let obj_color = 'purple'; //
let npcA_color = 'red'; //
let npcP_color = 'green'; //

let player_speed = 0.015; ///Maximo e Minimo
let npc_speed; //

let playervx = 0; //?
let playervy = 0; //?

let start = false
let transicao = false
let nivel = 0;
let colunas = 6;
let linhas = 6;
let tam = 0;

let minutos;
let segundos;
let control_speed = true;

let gameEvents = [];
let pontuacao = []
let pontuacao_total = 0

criandoNivel()
if(start == false){
    start = true
    alterarVelocidade();
    update(); // Inicia a atualização do jogador
}
if (window.ws instanceof WebSocket) {
  ws.addEventListener('open', () => sendGameEvents());
}


let pontuacaoAtualizada = Promise.resolve();

if (window.ws instanceof WebSocket) {
  pontuacaoAtualizada = new Promise((resolve) => {
    const handler = (event) => {
      console.log('Resposta do servidor:', event.data);
      pontuacao.push(parseInt(event.data, 10));
      pontuacao_total = pontuacao.reduce((acc, v) => acc + v, 0);
      document.getElementById('score').innerText = pontuacao_total;
      document.getElementById('finalScore').innerText = pontuacao_total;


      ws.removeEventListener('message', handler);
      resolve();
    };
    ws.addEventListener('message', handler);
  });
}

setInterval(function() { //Temporizador
    if (segundos === 0) {
        if (minutos === 0) {
            clearInterval();
            return;
        } else {
            minutos--;
            segundos = 59;
        }
    } else {segundos--;}
    atualizarTemporizador();
}, 1000);

// Funções Principais
function criandoNivel(){ //O gerador de niveis
    if(nivel !== 0) {
        console.log("Finalizando Nivel " + nivel + ", em: " + minutos + " minutos e " + segundos +" segundos");
        gameEvents.push(maze.grid);
        gameEvents.push(nivel);
        sendGameEvents(); // Send gameEvents data every time criandoNivel is called
        gameEvents = [];
    }
    
    nivel++
    if (nivel == 16) {
    mostrarTelaVitoria();
    console.log("GANHOU");
    return;
    }

    
    if (typeof maze === 'undefined'){maze = new Maze(level[nivel][0], level[nivel][0], level[nivel][1]);} 
    else {maze.reset(level[nivel][0], level[nivel][0], level[nivel][1]);}
    
    if (typeof obj === 'undefined'){obj = new Objetivo(maze, level[nivel][0]-1, level[nivel][0]-1, level[nivel][1]/4, obj_color);} 
    else {obj.reset(maze, level[nivel][0]-1, level[nivel][0]-1, level[nivel][1]/4, obj_color);}
    
    if (typeof player === 'undefined'){player = new Player(maze, 0, 0, level[nivel][1]/4, player_color, player_speed);} 
    else {player.reset(maze, 0, 0, level[nivel][1]/4, player_color, player_speed);}
    
    player.speed = player_speed;
    resetarTemporizador();
    generateNPC();
    setInterval(logGameEvents, 1000);
}

function mostrarTelaVitoria() {
  pontuacaoAtualizada.then(() => {
    document.querySelectorAll('.tela').forEach(tela => { tela.style.display = 'none'; });
    document.getElementById('telaVitoria').style.display = 'flex';
  });

  if (window.ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ranking: "Gerar Ranking" }));
  }
}


window.handleBCICommand = function(direction) {
    console.log(` BCI: Movendo para ${direction}`);
    
    // Para qualquer movimento anterior
    playervx = 0;
    playervy = 0;
    
    // Aplica nova direção
    switch(direction) {
        case "up":
            playervy = -3;
            break;
        case "down":
            playervy = 3;
            break;
        case "left":
            playervx = -3;
            break;
        case "right":
            playervx = 3;
            break;
    }
    
    console.log(` Velocidades: vx=${playervx}, vy=${playervy}`);
    
    // Para após 0.8 segundos
    setTimeout(() => {
        playervx = 0;
        playervy = 0;
        console.log(" Movimento parado");
    }, 800);
};

function update(){ //Função para atualizar constantemente a movimentação e desenho
    maze.draw();
    player.draw();
    obj.draw();
    atualizarVelocidade();
    checkCollisionObj(player, obj);
    player.move();
    for (let i = 0; i < npcA.length; i++) {
        npcA[i].draw();
        npcA[i].directMovement()
        checkCollisionNPCA(player, npcA[i]);
    }
    for (let i = 0; i < npcP.length; i++) {
        npcP[i].draw();
        npcP[i].directMovement()
        //checkCollisionNPCP(player, npcP[i]);
    }
    requestAnimationFrame(() => update());
}

function logGameEvents() { //Função para registrar as informações do labirinto
    let gameEvent = {
        time: { minutes: minutos, seconds: segundos },
        playerPosition: { x: player.x, y: player.y },
        npcaInfo: npcA.map(npc => ({ x: npc.x, y: npc.y, contato: npc.contato})),
        npcpInfo: npcP.map(npc => ({ x: npc.x, y: npc.y })),
    };
    //console.log(gameEvent);
    gameEvents.push(gameEvent);
}

function sendGameEvents() {
  if (!window.ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(gameEvents));
}


//Funções Auxiliares
function loadNewScript(scriptPath) { //Carregar outros scripts
  var script = document.createElement('script');
  script.src = scriptPath;
  document.body.appendChild(script);
}

function resetarTemporizador() { //Definir o tempo baseado no nivel
    minutos = level[nivel][4];
    segundos = level[nivel][5];
    atualizarTemporizador();
}

function atualizarTemporizador() { //Atualizar constantemente o temporizador
    document.getElementById('minutos').innerText = minutos < 10 ? '0' + minutos : minutos;
    document.getElementById('segundos').innerText = segundos < 10 ? '0' + segundos : segundos;
}

function atualizarVelocidade() { //Atualizar constantemente a velocidade
    document.getElementById('speedValue').innerText = player.speed.toFixed(3);
}

function checkCollisionObj(player, objetivo) { //Checa se o player chegou no objetivo
    const dx = objetivo.x - player.x;
    const dy = objetivo.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 0.5 && transicao == false) {
        logGameEvents(); 
        transicao = true
        criandoNivel();
        transicao = false;
    }
}

function checkCollisionNPCA(player, npca) { //Checa se o player encostou em um inimigo
    const dx = npca.x - player.x;
    const dy = npca.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 0.5 && !npca.contato) {
        npca.contato = true;
        console.log("Perdeu Tempo");
        segundos -= 10;
        if (segundos < 0) {
            minutos--;
            segundos += 60;
        }
        if (minutos < 0) {
            minutos = 0;
            segundos = 0;
            console("Perdeu"); //Criar GameOver Dps
        }
        atualizarTemporizador();
    }
}

function checkCollisionNPCP(player, npcp) { //Checa se o player encostou em um amigo
    let contato = false
    const dx = npcp.x - player.x;
    const dy = npcp.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 0.5 && !npcp.contato) {
        npcp.contato = true;
        console.log("Ganhou Tempo");
        segundos += 10;
        if (segundos >= 60) {
            minutos++;
            segundos -= 60;
        }
        atualizarTemporizador();
    }
}

function getRandomPosition(size) { //Posição aleatoria do Labirinto
    const x = Math.floor(Math.random() * size); // Coordenada X aleatória
    const y = Math.floor(Math.random() * size); // Coordenada Y aleatória
    return { x, y };
}

function pathInsidePath(original_path, path){ //Verifica se o caminho estra dentro do caminho original
    for (let i = 0; i < path.length; i++) {
        if (!celulaEstaContida(path[i], original_path)) {return false;}
    } return true;
}

function celulaEstaContida(cell, original_path) { //Verifica se uma celula esta contidad na lista
    for (let i = 0; i < original_path.length; i++) {
        if (cell.x === original_path[i].x && cell.y === original_path[i].y) {return true;}
    } return false;
}

function alterarVelocidade() { //Velocidade Aleatoria
    setInterval(function() {
        if(player.speed === 0.02){control_speed = false;}
        if(player.speed === 0.01){control_speed = true;}
        if (control_speed === true) {player.speed += 0.001;}
        else {player.speed -= 0.001;}        
        player.speed = Math.max(0.01, Math.min(player.speed, 0.02));
        atualizarVelocidade();
    }, 2000);
}

function generateNPC(){ //Baseado no nivel, cria o array com os npcs, suas posições e caminhos
    npcA = [];
    npcP = [];
    let caminho = maze.solveMaze(0, 0, level[nivel][0]-1, level[nivel][0]-1);
    for (let ativo = 0; ativo < level[nivel][3]; ativo++){
        let { x: x1, y: y1 } = getRandomPosition(level[nivel][0]);
        let { x: x2, y: y2 } = getRandomPosition(level[nivel][0]);
        let caminho_temp = maze.solveMaze(x1, y1, x2, y2);
        do{
            let temp1 = getRandomPosition(level[nivel][0]);
            let temp2 = getRandomPosition(level[nivel][0]);
            x1 = temp1.x;
            y1 = temp1.y;
            x2 = temp2.x;
            y2 = temp2.y;
            caminho_temp = maze.solveMaze(x1, y1, x2, y2);
        }while(pathInsidePath(caminho, caminho_temp))
        //Criar o caminho copiando o caminho chave, e verificando se todos as celulas do caminho do NPC pertence ao caminho chave. Se sim, refaz
        npcA[ativo] = new NPC_A(maze, x1, y1, level[nivel][1]/4, npcA_color, x2, y2);
    }
    for (let ativo = 0; ativo < level[nivel][2]; ativo++){
        const { x: x1, y: y1 } = getRandomPosition(level[nivel][0]);
        const { x: x2, y: y2 } = getRandomPosition(level[nivel][0]);
        //Criar o caminho copiando o caminho chave, e verificando se todos as celulas do caminho do NPC pertence ao caminho chave. Se sim, refaz
        npcP[ativo] = new NPC_P(maze, x1, y1, level[nivel][1]/4, npcP_color, x2, y2,);
    }
}

//Inputs do Jogador e Dev
addEventListener("keydown", function(e){
  if (e.code == "KeyD") playervx = 5;
  if (e.code == "KeyA") playervx = -5;
  if (e.code == "KeyS") playervy = 5;
  if (e.code == "KeyW") playervy = -5;
  if (e.code == "KeyX") tela();
  if (e.code == "ArrowUp") {
      player.speed = Math.min(player.speed + 0.01, 0.02); // Incrementa a velocidade com limite máximo de 1
      speedValueSpan.textContent = player.speed.toFixed(3); // Atualiza o valor da velocidade na tela
  }
  if (e.code == "ArrowDown") {
      player.speed = Math.max(player.speed - .01, 0.02); // Decrementa a velocidade com limite mínimo de 0.001
      speedValueSpan.textContent = player.speed.toFixed(3); // Atualiza o valor da velocidade na tela
  }
})

addEventListener("keyup", function(e){
  if (e.code == "KeyD") playervx = 0;
  if (e.code == "KeyA") playervx = 0;
  if (e.code == "KeyS") playervy = 0;
  if (e.code == "KeyW") playervy = 0;
})

function tela(){
    criandoNivel();
}