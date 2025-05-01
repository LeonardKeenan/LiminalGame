// Get the canvas and its 2D context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size (full screen for simplicity)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize Game Variables
let gameRunning = true;

// Basic Game Loop
function gameLoop() {
  if (gameRunning) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
    // Add game logic here (e.g., player movement, enemy AI, etc.)
    requestAnimationFrame(gameLoop); // Call next frame
  }
}

// Start the game loop
gameLoop();
