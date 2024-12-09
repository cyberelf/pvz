export class GameLoop {
    constructor(game) {
        this.game = game;
        this.running = false;
        this.animationFrameId = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.timeStep = 1000 / 60;  // 60 FPS
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.loop();
        }
    }

    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    loop(currentTime = performance.now()) {
        if (!this.running) return;

        // 计算时间增量
        this.deltaTime += (currentTime - this.lastTime) * (this.game.speedMultiplier || 1);
        this.lastTime = currentTime;

        // 根据累积的时间执行更新
        while (this.deltaTime >= this.timeStep) {
            this.game.update();
            this.deltaTime -= this.timeStep;
        }

        // 绘制
        this.game.draw();

        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }
} 