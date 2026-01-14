class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.baseSpeed = 50;
        this.gameSpeed = 350 - this.baseSpeed;
        this.foodCount = 0;
        this.speedBoost = 0;
        
        this.initializeGame();
        this.bindEvents();
        this.updateHighScore();
        this.initializeSpeedControl();
    }
    
    initializeGame() {
        this.generateFood();
        this.drawGame();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.changeDirection(e));
        console.log('键盘事件监听器已绑定');
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.resetGame();
            this.startGame();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            // 完全重置游戏状态，避免重新开始时出现问题
            this.resetGame();
        });
        
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            this.updateSpeed(parseInt(e.target.value));
        });
    }
    
    changeDirection(event) {
        if (!this.gameRunning || this.gamePaused) {
            console.log('游戏未运行或已暂停，忽略按键');
            return;
        }
        
        const LEFT_KEY = 37;
        const RIGHT_KEY = 39;
        const UP_KEY = 38;
        const DOWN_KEY = 40;
        
        const keyPressed = event.keyCode;
        const goingUp = this.dy === -1;
        const goingDown = this.dy === 1;
        const goingRight = this.dx === 1;
        const goingLeft = this.dx === -1;
        
        console.log(`按键事件: keyCode=${keyPressed}, 当前方向: dx=${this.dx}, dy=${this.dy}`);
        
        // 检查是否是方向键
        if (keyPressed >= 37 && keyPressed <= 40) {
            event.preventDefault(); // 防止页面滚动
            
            switch(keyPressed) {
                case LEFT_KEY:
                    if (!goingRight) {
                        this.dx = -1;
                        this.dy = 0;
                        console.log('左方向键生效 - 新方向: dx=' + this.dx + ', dy=' + this.dy);
                    } else {
                        console.log('左方向键被阻止 - 当前正在向右移动');
                    }
                    break;
                    
                case UP_KEY:
                    if (!goingDown) {
                        this.dx = 0;
                        this.dy = -1;
                        console.log('上方向键生效 - 新方向: dx=' + this.dx + ', dy=' + this.dy);
                    } else {
                        console.log('上方向键被阻止 - 当前正在向下移动');
                    }
                    break;
                    
                case RIGHT_KEY:
                    if (!goingLeft) {
                        this.dx = 1;
                        this.dy = 0;
                        console.log('右方向键生效 - 新方向: dx=' + this.dx + ', dy=' + this.dy);
                    } else {
                        console.log('右方向键被阻止 - 当前正在向左移动');
                    }
                    break;
                    
                case DOWN_KEY:
                    if (!goingUp) {
                        this.dx = 0;
                        this.dy = 1;
                        console.log('下方向键生效 - 新方向: dx=' + this.dx + ', dy=' + this.dy);
                    } else {
                        console.log('下方向键被阻止 - 当前正在向上移动');
                    }
                    break;
            }
        }
    }
    
    startGame() {
        console.log('开始游戏 - 当前状态:', {
            gameRunning: this.gameRunning,
            gamePaused: this.gamePaused,
            dx: this.dx,
            dy: this.dy,
            snakeHead: this.snake[0]
        });
        
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1;
            this.dy = 0;
        }
        
        this.gameLoop();
        this.updateButtonStates();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            document.getElementById('pauseBtn').textContent = '继续';
        } else {
            document.getElementById('pauseBtn').textContent = '暂停';
            this.gameLoop();
        }
        
        this.updateButtonStates();
    }
    
    resetGame() {
        console.log('重置游戏 - 之前状态:', {
            gameRunning: this.gameRunning,
            gamePaused: this.gamePaused,
            dx: this.dx,
            dy: this.dy,
            score: this.score
        });
        
        this.snake = [{ x: 10, y: 10 }];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.speedBoost = 0;
        this.foodCount = 0;
        
        this.gameSpeed = 350 - this.baseSpeed + this.speedBoost;
        
        this.generateFood();
        this.updateScore();
        this.updateButtonStates();
        this.drawGame();
        
        document.getElementById('pauseBtn').textContent = '暂停';
        
        console.log('重置游戏 - 之后状态:', {
            gameRunning: this.gameRunning,
            gamePaused: this.gamePaused,
            dx: this.dx,
            dy: this.dy,
            snakeHead: this.snake[0]
        });
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        setTimeout(() => {
            this.clearCanvas();
            this.moveSnake();
            
            if (this.checkGameOver()) {
                this.endGame();
                return;
            }
            
            this.checkFoodCollision();
            this.drawGame();
            this.gameLoop();
        }, this.gameSpeed);
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#4a5568';
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.3;
        
        for (let i = 0; i <= this.tileCount; i++) {
            const pos = i * this.gridSize;
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawGame() {
        this.clearCanvas();
        this.drawSnake();
        this.drawFood();
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize + 1;
            const y = segment.y * this.gridSize + 1;
            const size = this.gridSize - 2;
            
            if (index === 0) {
                this.ctx.fillStyle = '#48bb78';
                this.ctx.strokeStyle = '#38a169';
            } else {
                this.ctx.fillStyle = '#68d391';
                this.ctx.strokeStyle = '#48bb78';
            }
            
            this.ctx.fillRect(x, y, size, size);
            this.ctx.strokeRect(x, y, size, size);
            
            if (index === 0) {
                this.ctx.fillStyle = '#22543d';
                this.ctx.fillRect(x + 3, y + 3, 4, 4);
                this.ctx.fillRect(x + size - 7, y + 3, 4, 4);
            }
        });
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize + 1;
        const y = this.food.y * this.gridSize + 1;
        const size = this.gridSize - 2;
        
        this.ctx.fillStyle = '#f56565';
        this.ctx.strokeStyle = '#e53e3e';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.strokeRect(x, y, size, size);
        
        this.ctx.fillStyle = '#c53030';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    }
    
    moveSnake() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        this.snake.unshift(head);
        
        if (!this.checkFoodCollision()) {
            this.snake.pop();
        }
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }
    
    checkFoodCollision() {
        if (this.snake[0].x === this.food.x && this.snake[0].y === this.food.y) {
            this.score += 10;
            this.foodCount++;
            this.updateScore();
            this.generateFood();
            
            if (this.foodCount % 5 === 0) {
                this.speedBoost -= 10;
                this.gameSpeed = Math.max(50, 350 - this.baseSpeed + this.speedBoost);
            }
            
            return true;
        }
        return false;
    }
    
    checkGameOver() {
        const head = this.snake[0];
        
        console.log('检查游戏结束 - 蛇头位置:', head, '边界:', this.tileCount);
        
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            console.log('游戏结束: 撞墙');
            return true;
        }
        
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                console.log('游戏结束: 撞到自己');
                return true;
            }
        }
        
        return false;
    }
    
    endGame() {
        this.gameRunning = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
        }
        
        document.getElementById('finalScore').textContent = this.score;
        this.showGameOverModal();
        this.updateButtonStates();
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateHighScore() {
        document.getElementById('high-score').textContent = this.highScore;
    }
    
    initializeSpeedControl() {
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        speedSlider.value = this.baseSpeed;
        speedValue.textContent = this.baseSpeed;
    }
    
    updateSpeed(newSpeed) {
        this.baseSpeed = newSpeed;
        this.gameSpeed = 350 - newSpeed + this.speedBoost;
        document.getElementById('speedValue').textContent = newSpeed;
        
        if (this.gameSpeed < 50) {
            this.gameSpeed = 50;
        }
        if (this.gameSpeed > 300) {
            this.gameSpeed = 300;
        }
        
        console.log(`速度设置: ${newSpeed}, 实际延迟: ${this.gameSpeed}ms`);
    }
    
    getCurrentSpeed() {
        return this.gameSpeed - this.speedBoost;
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.gameRunning && !this.gamePaused) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        } else if (this.gameRunning && this.gamePaused) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }
    
    showGameOverModal() {
        document.getElementById('gameOverModal').style.display = 'block';
    }
    
    hideGameOverModal() {
        document.getElementById('gameOverModal').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});