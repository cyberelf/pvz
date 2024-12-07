export class Graphics {
    static createPeashooterSVG(ctx, x, y, size, time, isFlashing) {
        // 基础颜色
        const stemColor = isFlashing ? '#FF0000' : '#2E7D32';  // 深绿色茎干
        const headColor = isFlashing ? '#FF0000' : '#4CAF50';  // 绿色头部
        const mouthColor = isFlashing ? '#FF0000' : '#1B5E20'; // 深绿色嘴部

        // 茎干摆动动画
        const swayAmount = Math.sin(time / 500) * 5;

        ctx.save();
        ctx.translate(x, y);

        // 茎干
        ctx.beginPath();
        ctx.fillStyle = stemColor;
        ctx.moveTo(-size/4, size/4);
        ctx.quadraticCurveTo(swayAmount, 0, -size/6, -size/4);
        ctx.lineTo(size/6, -size/4);
        ctx.quadraticCurveTo(swayAmount, 0, size/4, size/4);
        ctx.fill();

        // 头部
        ctx.beginPath();
        ctx.fillStyle = headColor;
        ctx.arc(0, -size/4, size/3, 0, Math.PI * 2);
        ctx.fill();

        // 嘴部（会随时间张合）
        const mouthOpen = Math.sin(time / 300) * 0.2 + 0.3;
        ctx.beginPath();
        ctx.fillStyle = mouthColor;
        ctx.ellipse(size/3, -size/4, size/6, size/6 * mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    static createSunflowerSVG(ctx, x, y, size, time, isFlashing) {
        const petalColor = isFlashing ? '#FF0000' : '#FFD700';  // 金色花瓣
        const centerColor = isFlashing ? '#FF0000' : '#8B4513'; // 棕色中心
        const rotation = time / 1000;   // 旋转动画

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // 花瓣
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.fillStyle = petalColor;
            ctx.ellipse(0, -size/2, size/6, size/3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 中心
        ctx.beginPath();
        ctx.fillStyle = centerColor;
        ctx.arc(0, 0, size/4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    static createWallnutSVG(ctx, x, y, size, time, isFlashing) {
        const nutColor = isFlashing ? '#FF0000' : '#8B4513';
        const faceColor = isFlashing ? '#FF0000' : '#654321';
        const wobble = Math.sin(time / 500) * 3;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(wobble * Math.PI / 180);

        // 主体
        ctx.beginPath();
        ctx.fillStyle = nutColor;
        ctx.ellipse(0, 0, size/2, size/2 * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 表情（会眨眼）
        const blinkState = Math.sin(time / 300) > 0.9 ? 0 : 1;
        ctx.fillStyle = faceColor;
        
        // 眼睛
        ctx.beginPath();
        ctx.ellipse(-size/6, -size/6, size/10, size/10 * blinkState, 0, 0, Math.PI * 2);
        ctx.ellipse(size/6, -size/6, size/10, size/10 * blinkState, 0, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        ctx.beginPath();
        ctx.arc(0, size/6, size/8, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    static createSpikeweedSVG(ctx, x, y, size, time, isFlashing) {
        const baseColor = isFlashing ? '#FF0000' : '#696969';
        const spikeColor = isFlashing ? '#FF0000' : '#808080';
        const pulseScale = Math.sin(time / 300) * 0.1 + 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(pulseScale, pulseScale);

        // 基础形状
        ctx.beginPath();
        ctx.fillStyle = baseColor;
        ctx.moveTo(-size/2, 0);
        ctx.lineTo(0, -size/2);
        ctx.lineTo(size/2, 0);
        ctx.lineTo(0, size/2);
        ctx.closePath();
        ctx.fill();

        // 尖刺
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.fillStyle = spikeColor;
            ctx.moveTo(0, -size/4);
            ctx.lineTo(size/8, -size/2);
            ctx.lineTo(0, -size/1.5);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    static createZombieSVG(ctx, x, y, size, time, isFlashing) {
        const bodyColor = isFlashing ? '#FF0000' : '#90A4AE';
        const clothesColor = isFlashing ? '#FF0000' : '#4E342E';
        const walkCycle = Math.sin(time / 200) * 10;

        ctx.save();
        ctx.translate(x, y);

        // 身体
        ctx.beginPath();
        ctx.fillStyle = clothesColor;
        ctx.fillRect(-size/3, -size/2, size/1.5, size);

        // 头部
        ctx.beginPath();
        ctx.fillStyle = bodyColor;
        ctx.arc(0, -size/2, size/3, 0, Math.PI * 2);
        ctx.fill();

        // 手臂（摆动）
        ctx.beginPath();
        ctx.fillStyle = bodyColor;
        ctx.save();
        ctx.rotate(walkCycle * Math.PI / 180);
        ctx.fillRect(-size/2, -size/3, size/3, size/2);
        ctx.restore();

        // 腿（摆动）
        ctx.save();
        ctx.translate(0, size/2);
        ctx.rotate(-walkCycle * Math.PI / 180);
        ctx.fillRect(-size/4, 0, size/3, size/2);
        ctx.restore();

        ctx.restore();
    }
} 