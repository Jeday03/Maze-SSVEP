console.log('Transitioned to another JavaScript file');
function loadNewScript(scriptPath) {
    var script = document.createElement('script');
    script.src = scriptPath;
    document.body.appendChild(script);
  }
////////////////////////////////////////////////////////////////
// Alteração da tela
canvas.style.display = 'block';
canvas.width = window.innerWidth * 0.999;
canvas.height = window.innerHeight * 0.9;

// Variaveis Iniciais
var arraySize = 4;
var radius = Math.min(canvas.width, canvas.height) / 16;
var colors = [
    { name: 'Verde', hex: '#45F483' },
    { name: 'Azul', hex: '#36B6E5' },
    { name: 'Laranja', hex: '#E5C747' },
    { name: 'Rosa', hex: '#E055F5' },
    { name: 'Vermelho', hex: '#F07553' }
];
var randomArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * colors.length));
var colorNames = randomArray.map(num => colors[num].name);
var colorHex = randomArray.map(num => colors[num].hex);
var currentIndex = 0;
console.log(colorNames);
var estados = generateRandomBooleanArray(arraySize);
console.log(estados);
var entradas = [];
var keyHandlerActive = false;
var timeouts = [];
executeTimings(0);

// Função Principal
function executeTimings(index) {
    if (index < arraySize && document.getElementById('telaTraining').style.display !== 'none') {
        var color = colorHex[index];
        currentIndex = index;
        console.log(entradas);
        timeouts.push(setTimeout(() => drawCross(ctx, canvas), 1500));
        timeouts.push(setTimeout(() => drawRandomCircles(ctx, canvas, color, estados[index]), 3500));
        timeouts.push(setTimeout(() => drawCircle(ctx, canvas), 5500));
        timeouts.push(setTimeout(() => drawNothing(ctx, canvas), 7500));
        timeouts.push(setTimeout(() => executeTimings(index + 1), 7500));
    } else {
        sendTrainingEvents();
        DrawEnding(); 
        menu.style.display = 'block';
    }
}

// Funções Desenho
function drawCross(ctx, canvas) {
    console.log('drawCross');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const crossImg = new Image();
    crossImg.onload = function() {
        const scaleFactor = 4;
        const scaledWidth = crossImg.width / scaleFactor;
        const scaledHeight = crossImg.height / scaleFactor;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        ctx.drawImage(crossImg, x, y, scaledWidth, scaledHeight);
    };
    crossImg.src = 'images/cross.png';
}

function drawRandomCircles(ctx, canvas, color, state) {
    console.log('drawRandom');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const radius = Math.min(canvas.width, canvas.height) / 16;

    let newIndex = Math.floor(Math.random() * colors.length);
    while (colors[newIndex].hex === color) {
        newIndex = Math.floor(Math.random() * colors.length);
    }
    const newColor = colors[newIndex].hex;

    for (let i = 0; i < 2; i++) {
        const centerX = Math.random() * (canvas.width - 2 * radius) + radius;
        const centerY = Math.random() * (canvas.height - 2 * radius) + radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        if (!state && i === 0) {
            ctx.fillStyle = newColor;
        }
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

function drawCircle(ctx, canvas) {
    console.log('drawCircle');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const crossImg = new Image();
    crossImg.onload = function() {
        const scaleFactor = 4;
        const scaledWidth = crossImg.width / scaleFactor;
        const scaledHeight = crossImg.height / scaleFactor;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        ctx.drawImage(crossImg, x, y, scaledWidth, scaledHeight);

        // Adiciona um ouvinte de evento de teclado à janela
        window.addEventListener('keydown', keydownHandler);

        // Define um temporizador para limpar o ouvinte de evento de teclado após 2000 milissegundos (2 segundos)
        setTimeout(() => {
            window.removeEventListener('keydown', keydownHandler);
        }, 2000);
    };
    crossImg.src = 'images/circle.png';
}

function drawNothing(ctx, canvas) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function DrawEnding() {
    const canvas = document.getElementById('mazeCanvas'); // Obter a referência para o canvas
    const ctx = canvas.getContext('2d'); // Obter o contexto de desenho 2D

    // Chamar as funções drawCircle e drawCross para desenhar o círculo e a cruz
    drawCircle(ctx, canvas);
    drawCross(ctx, canvas);
}

// Funções Auxiliares
function generateRandomBooleanArray(length) { //Gerar Array resposta
    var booleanArray = [];
    for (var i = 0; i < length / 2; i++) {
        booleanArray.push(true);
    }
    for (var j = 0; j < length / 2; j++) {
        booleanArray.push(false);
    }
    for (var k = booleanArray.length - 1; k > 0; k--) {
        var randomIndex = Math.floor(Math.random() * (k + 1));
        var temp = booleanArray[k];
        booleanArray[k] = booleanArray[randomIndex];
        booleanArray[randomIndex] = temp;
    }
    return booleanArray;
}

function sendTrainingEvents() { //Enviar as respostas para o Websocket
    let trainingEvents = {output: estados, input: entradas};
    if (trainingEvents.output.length > trainingEvents.input.length) {
        // Calcula a diferença de tamanho entre entradas e estados
        let diff = trainingEvents.output.length - trainingEvents.input.length;
        // Adiciona nulls ao final de estados para igualar o tamanho
        for (let i = 0; i < diff; i++) {
            trainingEvents.input.push(null);
        }
    }

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(trainingEvents));
    } else {
        // Handle the case when the WebSocket connection is not open
        console.log("WebSocket connection is not open. Retrying in a moment...");
        setTimeout(sendTrainingEvents, 1000); // Retry sending after 1 second
    }
}

function keydownHandler(event) { //Input do Usuario
    var key = event.key.toLowerCase();
    if (key === 'arrowup') {
        checkAndUpdateResult(true);
    } else if (key === 'arrowdown') {
        checkAndUpdateResult(false);
    }
}

function checkAndUpdateResult(inputValue) { // Console.log para verificar os resultados
    if (currentIndex >= 0 && currentIndex < estados.length && entradas[currentIndex] === undefined) {
      entradas[currentIndex] = inputValue
      console.log('Entrada: ' + inputValue + ', Saida: ' + estados[currentIndex])
    }
}