export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.walls = [
            // Define some basic walls for the corridor
            { x: 100, y: 100, width: 20, height: 400 },
            { x: 500, y: 100, width: 20, height: 400 },
            { x: 100, y: 100, width: 420, height: 20 },
            { x: 100, y: 500, width: 420, height: 20 },
        ];
    }

    draw(ctx) {
        // Draw floor
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw walls
        ctx.fillStyle = '#666';
        for (const wall of this.walls) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
    }
} 