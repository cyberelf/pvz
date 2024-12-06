export class GameLoop {
    constructor(game) {
        this.game = game;
        this.running = true;
    }

    start() {
        this.loop();
    }

    stop() {
        this.running = false;
    }

    loop() {
        if (this.running) {
            this.game.update();
            this.game.draw();
            requestAnimationFrame(() => this.loop());
        }
    }
} 