export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 5;
        this.health = 100;
        this.keys = {};

        // Set up keyboard controls
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    update(deltaTime) {
        // Movement controls
        if (this.keys['w'] || this.keys['ArrowUp']) this.y -= this.speed;
        if (this.keys['s'] || this.keys['ArrowDown']) this.y += this.speed;
        if (this.keys['a'] || this.keys['ArrowLeft']) this.x -= this.speed;
        if (this.keys['d'] || this.keys['ArrowRight']) this.x += this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }
} 