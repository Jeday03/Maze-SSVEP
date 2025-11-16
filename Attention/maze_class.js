//console.log('Outro.js')
///////////////////////////////////////////////////////////////
//Classe simples da célula
class Cell { 
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.visited = false; //Para construir o labirinto
      this.walls = [true, true, true, true]; // [top, right, bottom, left]
    }
}

//Labirinto Gerado Atraves do Metodo Randomizado de Primm
class Maze{
    constructor(rows, cols, cellSize){
        //Variaveis: Linhas, Colunas e Tamanho da Celula
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;
        //Construção
        this.grid = this.createGrid(); //Grade de Celulas
        this.canvas = this.createCanvas(); //Canvas a ser utilizado
        this.ctx = this.canvas.getContext('2d');
        this.generateMaze(); //Carrega o Labirinto
        this.draw(); //Desenha
    }

    
    reset(rows, cols, cellSize){ //Função utilizada para recriar o labirinto
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;
        this.grid = this.createGrid();
        this.canvas = this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.generateMaze();
        this.draw();
    }

    createGrid() {//Cria a Grade de Celulas matriz[row][col] // matriz [x][y]
        const grid = [];
        for (let row = 0; row < this.rows; row++) {
            const rowArr = [];
            for (let col = 0; col < this.cols; col++) {
                rowArr.push(new Cell(row, col));
            }
            grid.push(rowArr);
        }
        return grid;
    }
  
    createCanvas(){  //Cria o canvas
        let canvas = document.getElementById(canvasMaze); // Pegar canvas
        canvas.style.display = 'block'; // Mostrar Canvas
        canvas.parentNode.classList.add(canvasContainer);
        let canvasWidth = this.cols * this.cellSize;
        let canvasHeight = this.rows * this.cellSize;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        return canvas;
    }
  
    generateMaze() { //Cria o labirinto, através do metodo de Primm
        const stack = [];
        let currentCell = this.grid[0][0];
        currentCell.visited = true;
        while (true) {
            const unvisitedNeighbors = this.getUnvisitedNeighbors(currentCell);
            if (unvisitedNeighbors.length > 0) {
                const nextCell = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
                stack.push(currentCell);
                this.removeWall(currentCell, nextCell);
                currentCell = nextCell;
                currentCell.visited = true;
            } else if (stack.length > 0) {
                currentCell = stack.pop();
            } else {
                break;
            }
        }
    }
    
    getUnvisitedNeighbors(cell) {  //Pega todos os vizinhos que ainda não estão dentro do labirinto
        const neighbors = [];
        const { x, y } = cell;
        if (y > 0 && !this.grid[x][y - 1].visited) {
          neighbors.push(this.grid[x][y - 1]);
        }
        if (x < this.rows - 1 && !this.grid[x + 1][y].visited) {
          neighbors.push(this.grid[x + 1][y]);
        }
        if (y < this.cols - 1 && !this.grid[x][y + 1].visited) {
          neighbors.push(this.grid[x][y + 1]);
        }
        if (x > 0 && !this.grid[x - 1][y].visited) {
          neighbors.push(this.grid[x - 1][y]);
        }
        return neighbors;
    }
    
    removeWall(currentCell, nextCell) {    //Remove as duas paredes identicas entre duas celulas
        const deltaX = nextCell.x - currentCell.x;
        const deltaY = nextCell.y - currentCell.y;
        if (deltaX === 1) { // nextCell is to the right
            currentCell.walls[1] = false;
            nextCell.walls[3] = false;
        } else if (deltaX === -1) { // nextCell is to the left
            currentCell.walls[3] = false;
            nextCell.walls[1] = false;
        } else if (deltaY === 1) { // nextCell is below
            currentCell.walls[2] = false;
            nextCell.walls[0] = false;
        } else if (deltaY === -1) { // nextCell is above
            currentCell.walls[0] = false;
            nextCell.walls[2] = false;
        }
    }
    
    isWall(x, y, vx, vy) { //Checador de Colisão constante entre o Player e o Labirinto,
    //onde (x,y) e a posição ATUAL do player, enquanto (vx,vy) é a direção que ele quer ir
        const cellX = Math.round(x);
        const cellY = Math.round(y);
        const cell = this.grid[cellX][cellY]; //Celula atual do player
        const directionX = Math.sign(vx); // -1 for left, 1 for right
        const directionY = Math.sign(vy); // -1 for up, 1 for down
        const restX = x % 1;
        const restY = y % 1;
        //Variaveis para permitir se aproximar da parede
        const r = Math.abs((cellX + 0.5) - x);
        const l = Math.abs((cellX - 0.5) - x);
        const u = Math.abs((cellY + 0.5) - y);
        const d = Math.abs((cellY - 0.5) - y);
        // Se o player quiser se mover para fora do labirinto
        if (cellX < 0 || cellX >= this.rows ||
            cellY < 0 || cellY >= this.cols) {
            return true; 
        }
        // Se o player estiver indo para uma direção, tiver uma parede, e estiver proximo dela
        if (directionX === 1 && r <= 0.5 && cell.walls[1]) { // Right wall
            return true;
        } else if (directionX === -1 && l <= 0.5 && cell.walls[3]) { // Left wall
            return true;
        } else if (directionY === 1 && u <= 0.5 && cell.walls[2]) { // Bottom wall
            return true;
        } else if (directionY === -1 && d <= 0.5 && cell.walls[0]) { // Top wall
            return true;
        }
        //Se o player quiser andar pela quina de uma parede
        //TEM BUG ACONTECENDO NAS BORDAS DO LABIRINTO, QUANDO ELE VERIFICA UMA CELULA INEXISTENTE
        if (restX > 0.25 && restX < 0.75){
            if(y > 1 && directionY === -1 && this.grid[Math.floor(x)][Math.round(y)-1].walls[1]){return true;}
            if(y < this.cols -1 && directionY === 1 && this.grid[Math.floor(x)][Math.round(y)+1].walls[1]){return true;}
        }
        if (restY > 0.25 && restY < 0.75){
            if(x > 1 && directionX === -1 && this.grid[Math.round(x)-1][Math.floor(y)].walls[2]){return true;}
            if(x < this.rows -1 && directionX === 1 && this.grid[Math.round(x)+1][Math.floor(y)].walls[2]){return true;}
        }
        //Se nenhuma dessas situações ocorrer, o movimento e realizado
        return false; // No collision
    }

    draw() {//Desenha o labirinto, baseado nas paredes da grid
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = row * this.cellSize;
                const y = col * this.cellSize;
                const cell = this.grid[row][col];
                if (cell.walls[0]) { // Top wall
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + this.cellSize, y);
                    ctx.stroke();
                }
                if (cell.walls[1]) { // Right wall
                    ctx.beginPath();
                    ctx.moveTo(x + this.cellSize, y);
                    ctx.lineTo(x + this.cellSize, y + this.cellSize);
                    ctx.stroke();
                }
                if (cell.walls[2]) { // Bottom wall
                    ctx.beginPath();
                    ctx.moveTo(x + this.cellSize, y + this.cellSize);
                    ctx.lineTo(x, y + this.cellSize);
                    ctx.stroke();
                }
                if (cell.walls[3]) { // Left wall
                    ctx.beginPath();
                    ctx.moveTo(x, y + this.cellSize);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
        }
    }

    solveMaze(originX, originY, targetX, targetY){ //Retorna a lista de celulas, de um ponto ORIGEM até um ponto TARGET
        const visited = new Set();
        const queue = [[originX, originY, []]];
        while (queue.length > 0) {
            const [x, y, path] = queue.shift();
            if (x === targetX && y === targetY) {
                const cells = [];
                for (const [x, y] of path) {
                    cells.push(this.grid[x][y]);
                }
                return cells;
            }
            const key = `${x},${y}`;
            if (!visited.has(key)) {
                visited.add(key);
                for (let i = 0; i < 4; i++) {
                    if (!this.grid[x][y].walls[i]) {
                        let nx = x, ny = y;
                        if (i === 0) ny--;
                        else if (i === 1) nx++;
                        else if (i === 2) ny++;
                        else if (i === 3) nx--;
    
                        const nextKey = `${nx},${ny}`;
                        if (!visited.has(nextKey)) {
                            queue.push([nx, ny, path.concat([[nx, ny]])]);
                        }
                    }
                }
            }
        }
        return null;
      }
  } 
  
//Classe modelo para o Player, Objetivo e NPC
class Objeto {
    constructor(maze, x, y, size, color) {//Todos eles precisam do labirinto, da suas coordenadas nele, seu tamanho e cor
        this.maze = maze;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    reset(maze, x, y, size, color) {
        this.maze = maze;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    draw() {//Por serem circulos, todos são desenhados da mesma forma
        const ctx = this.maze.ctx;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.x * this.maze.cellSize + this.maze.cellSize / 2,
            this.y * this.maze.cellSize + this.maze.cellSize / 2,
            this.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

  //Jogador, controlado pelo Paciente
  class Player extends Objeto {
    constructor(maze, x, y, size, color, speed) { //Possui velocidade e direção
        super(maze, x, y, size, color);
        this.speed = speed;
        this.vx = 0;
        this.vy = 0;
    }

    reset(maze, x, y, size, color, speed) {
        super.reset(maze, x, y, size, color);
        this.speed = speed;
        this.vx = 0;
        this.vy = 0;
    }

    move() {//Movimentação do player, pegando as direções playervx e playervy para guiar (sempre em 0 até receber input)
        this.vx = playervx;
        this.vy = playervy;
        let x = this.x + this.vx*this.speed;
        let y = this.y + this.vy*this.speed
        const willHitWall = this.maze.isWall(x, y, this.vx, this.vy);
        if (!willHitWall) {
            this.x = x;
            this.y = y;
        }
    }
  }
  
//Classe de objeto de destino
class Objetivo extends Objeto {
    constructor(maze, col, row, tam, color) {
        super(maze, col, row, tam, color);
    }
    reset(maze, col, row, tam, color) {
        super.reset(maze, col, row, tam, color);
    }
}

//Classes NPC
class NPC_P extends Objeto {
    constructor(maze, x, y, size, color, targetX, targetY) {
        //Estados de movimentação (moving e direction)
        //Direções (vx,vy), Posições anteriores e futuras (oldCell e nextCell),
        super(maze, x, y, size, color);
        this.index = 0;
        this.moving = false;
        this.oldCell;
        this.nextCell;
        this.vx = 0;
        this.vy = 0;
        this.direction = true;
        this.speed = 0.01;
        this.origin = this.maze.grid[x][y];
        this.targetX = targetX; 
        this.targetY = targetY;
        this.contato = false;
    }

    reset(maze, x, y, size, color) {
        super.reset(maze, x, y, size, color);
        this.index = 0;
        this.moving = false;
        this.oldCell;
        this.nextCell;
        this.vx = 0;
        this.vy = 0;
        this.direction = true;
        this.speed = 0.01;
        this.origin = this.maze.grid[x][y];
        this.targetX = targetX; 
        this.targetY = targetY;
        this.contato = false;
    }

    directMovement(){ //Pega a lista do caminho, celula a celula, e se movimenta, ida e volta
        if(this.contato) {
            this.color = 'green'
        }

        let listCell;
        if(!this.moving){
            this.oldCell = this.maze.grid[Math.round(this.x)][Math.round(this.y)];
            this.moving = true;
            if(this.direction){
                listCell = this.maze.solveMaze(this.oldCell.x, this.oldCell.y, this.targetX, this.targetY);
            } else{
                listCell = this.maze.solveMaze(this.oldCell.x, this.oldCell.y, this.origin.x, this.origin.y);}
            if(listCell.length == 0){
                this.direction = !this.direction;
                return
            }
            this.nextCell = listCell.shift();
            if(this.nextCell.x === this.origin.x && this.nextCell === this.origin.y){
                this.direction = !this.direction;
            }
        }
        const directX = this.oldCell.x - this.nextCell.x;
        const directY = this.oldCell.y - this.nextCell.y;
        this.index = (directY === 1) * 0 + (directX === -1) * 1 + 
        (directY === -1) * 2 + (directX === 1) * 3 + (directY === 0 && directX === 0) * 4;
        this.move();
    }

    randomMoviment() { //Caminho aleatorio, pegando a celula atual, escolhendo uma direção sem parede, e indo
        if(!this.moving){
            this.moving = true;
            this.oldCell = this.maze.grid[Math.round(this.x)][Math.round(this.y)];
            do {
                this.index = Math.floor(Math.random() * 4);
            } while (this.oldCell.walls[this.index]);
        }
        this.move();
    }

    move(){ //Baseado no indice de parede que ele quer ir, altera a direção do NPC. Quando chega no objetivo, para de mover
        if (this.index === 0) {
            this.vx = 0;
            this.vy = -5;
        } else if (this.index === 1) {
            this.vx = 5;
            this.vy = 0;
        } else if (this.index === 2) {
            this.vx = 0;
            this.vy = 5;
        } else if (this.index === 3) {
            this.vx = -5;
            this.vy = 0;
        } else {
            this.vx = 0;
            this.vy = 0;
            this.moving = false
        }
        this.x = this.x + this.vx*this.speed;
        this.y = this.y + this.vy*this.speed;
        if(Math.abs(this.oldCell.x - this.x) > 1 || Math.abs(this.oldCell.y - this.y) > 1){
            this.moving = false;
        }
    }
  }

class NPC_A extends NPC_P {
    constructor(maze, x, y, size, color, targetX, targetY) {
        super(maze, x, y, size, color, targetX, targetY);
    }
    reset(maze, x, y, size, color, targetX, targetY) {
        super.reset(maze, x, y, size, color, targetX, targetY);
    }
}
