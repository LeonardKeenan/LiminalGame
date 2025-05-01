import { Room } from './room.js';

class Game {
    constructor() {
        console.log('Game constructor called');
        this.setupStartScreen();
        this.isGameStarted = false;
    }

    setupStartScreen() {
        const startButton = document.getElementById('start-button');
        console.log('Found start button:', startButton); // Debug log
        
        startButton.addEventListener('click', (e) => {
            console.log('Start button clicked!'); // Debug log
            e.preventDefault();
            this.startGame();
        });
    }

    startGame() {
        console.log('startGame called'); // Debug log
        if (this.isGameStarted) {
            console.log('Game already started'); // Debug log
            return;
        }
        
        const startScreen = document.getElementById('start-screen');
        const gameContainer = document.getElementById('game-container');
        
        console.log('Fading out start screen'); // Debug log
        startScreen.style.transition = 'opacity 1s';
        startScreen.style.opacity = '0';
        
        setTimeout(() => {
            console.log('Timeout callback triggered'); // Debug log
            startScreen.style.display = 'none';
            gameContainer.style.display = 'block';
            console.log('Game container display:', gameContainer.style.display); // New debug
            console.log('Game container visibility:', window.getComputedStyle(gameContainer).visibility); // New debug
            this.initializeGame();
        }, 1000);
    }

    initializeGame() {
        console.log('Initializing game'); // Debug log
        this.isGameStarted = true;
        this.lastTime = 0;
        try {
            console.log('Creating Room instance...'); // New debug log
            this.room = new Room();
            console.log('Room instance created successfully'); // New debug log
            console.log('Starting room...'); // New debug log
            this.room.start();
            console.log('Room started successfully'); // New debug log
            console.log('Starting game loop...'); // New debug log
            this.gameLoop();
            console.log('Game initialized successfully'); // Debug log
        } catch (error) {
            console.error('Error initializing game:', error.message); // More detailed error
            console.error('Error stack:', error.stack); // Add stack trace
        }
    }

    update(deltaTime) {
        this.room.update(deltaTime);
    }

    draw() {
        this.room.render();
    }

    gameLoop(currentTime = 0) {
        try {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.draw();

            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('Error in game loop:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}

// Add this at the bottom
console.log('Loading game.js');
window.addEventListener('load', () => {
    console.log('Window loaded, creating game instance');
    window.gameInstance = new Game(); // Make it accessible for debugging
}); 