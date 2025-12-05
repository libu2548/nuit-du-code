// ============================================================================
// SNAKE GAME - Easter Egg implementation
// ============================================================================

class SnakeGame {
    constructor(canvasId, scoreId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById(scoreId);
        
        this.gridSize = 20;
        this.speed = 100; // ms per game tick
        this.gameActive = false;
        this.gameLoopInterval = null;
        
        // Snake: array of {x, y} segments
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        
        // Direction: {x, y} where x,y ∈ [-1, 0, 1]
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Food position
        this.food = this.generateFood();
        
        // Score
        this.score = 0;
        this.updateScore();
        
        // Bind keyboard handler
        this.keydownHandler = this.handleKeyDown.bind(this);
    }
    
    generateFood() {
        const gridX = Math.floor(this.canvas.width / this.gridSize);
        const gridY = Math.floor(this.canvas.height / this.gridSize);
        let newFood;
        let collision = true;
        
        while (collision) {
            newFood = {
                x: Math.floor(Math.random() * gridX),
                y: Math.floor(Math.random() * gridY)
            };
            collision = this.snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
        }
        return newFood;
    }
    
    handleKeyDown(e) {
        // Arrow keys only control snake during game
        switch(e.key) {
            case 'ArrowUp':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                    e.preventDefault();
                }
                break;
            case 'ArrowDown':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                    e.preventDefault();
                }
                break;
            case 'ArrowLeft':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                    e.preventDefault();
                }
                break;
            case 'ArrowRight':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                    e.preventDefault();
                }
                break;
            // Any other key exits the game
            case 'Escape':
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.stop();
                break;
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    update() {
        // Apply next direction
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        // Grid size
        const gridX = Math.floor(this.canvas.width / this.gridSize);
        const gridY = Math.floor(this.canvas.height / this.gridSize);

        // Wrap-around both horizontally and vertically: exiting one side appears on the opposite
        if (newHead.x < 0) {
            newHead.x = gridX - 1;
        } else if (newHead.x >= gridX) {
            newHead.x = 0;
        }

        if (newHead.y < 0) {
            newHead.y = gridY - 1;
        } else if (newHead.y >= gridY) {
            newHead.y = 0;
        }
        
        // Check self collision
        if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            this.gameOver();
            return;
        }
        
        // Add new head
        this.snake.unshift(newHead);
        
        // Check food collision
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
        } else {
            // Remove tail (no food eaten)
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (optional faint grid)
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.ctx.fillStyle = '#00f0ff';
        this.snake.forEach((seg, index) => {
            const x = seg.x * this.gridSize + 2;
            const y = seg.y * this.gridSize + 2;
            const size = this.gridSize - 4;

            // Head color changed to neon yellow; give it a modest glow
            if (index === 0) {
                this.ctx.fillStyle = '#ffd84d';
                this.ctx.shadowColor = 'rgba(255, 216, 77, 0.5)';
                this.ctx.shadowBlur = 6;
            } else {
                // Body: solid color, no shadow to prevent cumulative glow
                this.ctx.fillStyle = '#00f0ff';
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
            }

            this.ctx.fillRect(x, y, size, size);

            // Reset shadow after each segment to avoid accumulation
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
        });
        
        // Draw food with a small glow
        this.ctx.fillStyle = '#ff3ec4';
        this.ctx.shadowColor = 'rgba(255, 62, 196, 0.6)';
        this.ctx.shadowBlur = 6;
        const fx = this.food.x * this.gridSize + 4;
        const fy = this.food.y * this.gridSize + 4;
        this.ctx.fillRect(fx, fy, this.gridSize - 8, this.gridSize - 8);

        // Reset shadow to avoid global accumulation
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }
    
    gameOver() {
        this.stop();
        window.snakeGameManager.endGame();
        alert(`GAME OVER!\nFinal Score: ${this.score}`);
    }
    
    start() {
        if (this.gameActive) return;
        this.gameActive = true;
        
        // Listen for keyboard
        document.addEventListener('keydown', this.keydownHandler);
        
        // Start game loop
        this.gameLoopInterval = setInterval(() => {
            this.update();
            this.draw();
        }, this.speed);
        
        // Initial draw
        this.draw();
    }
    
    stop() {
        this.gameActive = false;
        clearInterval(this.gameLoopInterval);
        document.removeEventListener('keydown', this.keydownHandler);
    }
}

// ============================================================================
// EASTER EGG TRIGGER: Detect "Snake" in targetInput and launch game
// ============================================================================

let currentSnakeGame = null;
const snakeContainer = document.getElementById('snakeGameContainer');
const wrap = document.querySelector('.wrap');

// Export for use in main script
window.SnakeGame = SnakeGame;
window.currentSnakeGame = currentSnakeGame;

window.snakeGameManager = {
    startGame() {
        if (currentSnakeGame) return;
        
        // Hide main UI
        if (wrap) wrap.style.display = 'none';
        
        // Show game container
        if (snakeContainer) snakeContainer.style.display = 'flex';
        
        // Create and start game
        window.currentSnakeGame = currentSnakeGame = new SnakeGame('snakeCanvas', 'snakeScore');
        currentSnakeGame.start();
    },
    
    endGame() {
        if (currentSnakeGame) {
            currentSnakeGame.stop();
            currentSnakeGame = null;
            window.currentSnakeGame = null;
        }
        
        // Hide game container
        if (snakeContainer) snakeContainer.style.display = 'none';
        
        // Show main UI
        if (wrap) wrap.style.display = 'block';
        
        // Re-enable keyboard globally (set to re-focus targetInput context if needed)
        // The keyboard will be unfrozen by the main script
    }
};
