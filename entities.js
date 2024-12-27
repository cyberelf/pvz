import { Graphics } from './graphics.js';

// 植物类型枚举
export const PlantType = {
    SUNFLOWER: 'SUNFLOWER',
    PEASHOOTER: 'PEASHOOTER',
    WALLNUT: 'WALLNUT',
    SPIKEWEED: 'SPIKEWEED',
    TORCHWOOD: 'TORCHWOOD',
    POTATO_MINE: 'POTATO_MINE'  // 添加土豆地雷类型
};

// 植物基类
export class Plant {
    static useDefaultShapes = false;

    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 40;
        this.lastShotTime = 0;
        this.shootInterval = 2000;
        this.health = 100;
        this.isReady = false;  // 用于土豆地雷的准备状态
        this.readyTime = 0;    // 用于土豆地雷的准备时间计时

        // 根据类型设置特定属性
        switch (type) {
            case PlantType.SUNFLOWER:
                this.health = 80;
                this.lastSunTime = Date.now();
                this.sunInterval = 10000;
                break;
            case PlantType.PEASHOOTER:
                this.health = 100;
                break;
            case PlantType.WALLNUT:
                this.health = 400;
                break;
            case PlantType.SPIKEWEED:
                this.health = 100;
                break;
            case PlantType.TORCHWOOD:
                this.health = 100;
                break;
            case PlantType.POTATO_MINE:
                this.health = 50;
                this.isReady = false;
                this.readyTime = Date.now() + 15000;  // 15秒后准备完毕
                break;
        }
    }

    update(game) {
        const currentTime = Date.now();

        switch (this.type) {
            case PlantType.SUNFLOWER:
                if (currentTime - this.lastSunTime >= this.sunInterval) {
                    game.suns.push(new Sun(this.x, this.y - 20));
                    this.lastSunTime = currentTime;
                }
                break;
            case PlantType.PEASHOOTER:
                if (currentTime - this.lastShotTime >= this.shootInterval) {
                    // 检查这一行是否有僵尸
                    const hasZombieInRow = game.zombies.some(zombie => 
                        Math.abs(zombie.y - this.y) < game.cellHeight/2 && 
                        zombie.x > this.x
                    );
                    if (hasZombieInRow) {
                        game.peas.push(new Pea(this.x + 20, this.y));
                        this.lastShotTime = currentTime;
                    }
                }
                break;
            case PlantType.POTATO_MINE:
                // 更新土豆地雷的准备状态
                if (!this.isReady && currentTime >= this.readyTime) {
                    this.isReady = true;
                }
                break;
        }
    }

    draw(ctx) {
        switch (this.type) {
            case PlantType.SUNFLOWER:
                ctx.fillStyle = '#FFD700';
                break;
            case PlantType.PEASHOOTER:
                ctx.fillStyle = '#32CD32';
                break;
            case PlantType.WALLNUT:
                ctx.fillStyle = '#8B4513';
                break;
            case PlantType.SPIKEWEED:
                ctx.fillStyle = '#696969';
                break;
            case PlantType.TORCHWOOD:
                ctx.fillStyle = '#FF4500';
                break;
            case PlantType.POTATO_MINE:
                // 根据准备状态显示不同颜色
                ctx.fillStyle = this.isReady ? '#8B4513' : '#D2691E';
                break;
        }

        // 绘制植物主体
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        ctx.fill();

        // 为土豆地雷添加准备状态指示
        if (this.type === PlantType.POTATO_MINE && !this.isReady) {
            // 绘制准备进度条
            const progress = 1 - (this.readyTime - Date.now()) / 15000;
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x - 20, this.y - 30, 40 * Math.max(0, Math.min(1, progress)), 5);
        }

        // 显示血量条
        const healthPercentage = this.health / (this.type === PlantType.WALLNUT ? 400 : 100);
        ctx.fillStyle = `rgb(${255 * (1 - healthPercentage)}, ${255 * healthPercentage}, 0)`;
        ctx.fillRect(this.x - 20, this.y + 25, 40 * healthPercentage, 5);
    }

    takeDamage(damage) {
        this.health -= damage;
    }
}

export class Zombie {
    static useDefaultShapes = false;

    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.health = 100;
        this.speed = speed || 0.2;
        this.size = 40;
        this.lastAttackTime = 0;
        this.attackDamage = 10;
        this.attackInterval = 1000;
        this.flashUntil = 0;
    }

    takeDamage(damage) {
        this.health -= damage;
        this.flashUntil = Date.now() + 200;
    }

    move() {
        this.x -= this.speed * (this.game ? this.game.speedMultiplier : 1);
    }

    draw(ctx) {
        const time = Date.now();
        const isFlashing = time < this.flashUntil;
        
        if (Zombie.useDefaultShapes) {
            // ... 原来的默认形状绘制代码 ...
        } else {
            Graphics.createZombieSVG(ctx, this.x, this.y, this.size, time, isFlashing);
        }
        
        // 只显示数字血量
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 先绘制描边
        ctx.strokeText(
            Math.ceil(this.health),
            this.x,
            this.y - this.size/2 - 10
        );
        // 再绘制文字
        ctx.fillText(
            Math.ceil(this.health),
            this.x,
            this.y - this.size/2 - 10
        );
    }

    update(game) {
        this.game = game;  // 保存game引用以在move中使用
        this.attackInterval = 1000 / game.speedMultiplier;
    }
}

export class Pea {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.damage = 20;
        this.size = 12;
        this.isFirePea = false;  // 添加火焰状态
    }

    update(game) {
        this.x += this.speed;

        // 检查是否经过火炬树桩
        for (const plant of game.plants) {
            if (plant.type === PlantType.TORCHWOOD &&
                Math.abs(this.y - plant.y) < game.cellHeight/2 &&
                Math.abs(this.x - plant.x) < plant.size/2 &&
                !this.isFirePea) {
                this.isFirePea = true;
                this.damage *= 2;  // 伤害翻倍
                break;
            }
        }
    }

    draw(ctx) {
        if (this.isFirePea) {
            // 绘制火焰豌豆
            const time = Date.now() / 100;
            ctx.save();
            ctx.translate(this.x, this.y);

            // 火焰效果
            for (let i = 0; i < 5; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI / 2.5 + time);
                ctx.beginPath();
                ctx.fillStyle = '#FF4500';
                ctx.globalAlpha = 0.7 + Math.sin(time + i) * 0.3;
                ctx.moveTo(0, -this.size);
                ctx.quadraticCurveTo(this.size, -this.size/2, 0, -this.size/2);
                ctx.quadraticCurveTo(-this.size, -this.size/2, 0, -this.size);
                ctx.fill();
                ctx.restore();
            }

            // 中心豌豆
            ctx.beginPath();
            ctx.fillStyle = '#FF6B00';
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        } else {
            // 原来的豌豆绘制代码
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/1.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

export class Sun {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originY = y;  // 记录初始Y坐标（向日葵的位置
        this.targetY = y - 100;  // 先向上飘100像素
        this.speed = 1;
        this.size = 30;
        this.state = 'rising';  // 添加状态：rising（上升）或 falling（下落）
        this.hoverTime = 1000;  // 在最高点悬停1秒
        this.startTime = Date.now();
        this.collected = false;  // 添加收集状态
    }

    update() {
        const currentTime = Date.now();
        
        if (this.collected) {
            // 如果被收集，向上飘然后消失
            this.y -= this.speed * 2;
            this.size = Math.max(0, this.size - 1);  // 逐渐缩��
            return;
        }

        if (this.state === 'rising') {
            if (this.y > this.targetY) {
                this.y -= this.speed;
            } else {
                if (currentTime - this.startTime > this.hoverTime) {
                    this.state = 'falling';
                }
            }
        } else if (this.state === 'falling') {
            if (this.y < this.originY) {
                this.y += this.speed;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加发光效果
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/1.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

export class LawnMower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.speed = 5;
        this.active = false;
        this.used = false;
    }

    update(game) {
        if (this.active) {
            this.x += this.speed * game.speedMultiplier;
        }
    }

    draw(ctx) {
        if (this.used) return;  // 如果已使用就不绘制

        ctx.save();
        ctx.translate(this.x, this.y);

        // 绘制小推车主体
        ctx.fillStyle = '#666666';
        ctx.fillRect(-this.size/2, -this.size/3, this.size, this.size/1.5);

        // 绘制轮子
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(-this.size/3, this.size/4, this.size/6, 0, Math.PI * 2);
        ctx.arc(this.size/3, this.size/4, this.size/6, 0, Math.PI * 2);
        ctx.fill();

        // 绘制刀片
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.arc(this.size/2, 0, this.size/3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 添加爆炸效果类
export class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.createTime = Date.now();
        this.duration = 1000;  // 爆炸效果持续1秒
        this.particles = [];
        
        // 创建爆炸粒子
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5 + Math.random() * 5,
                alpha: 1
            });
        }
    }

    isExpired() {
        return Date.now() - this.createTime >= this.duration;
    }

    update() {
        const progress = (Date.now() - this.createTime) / this.duration;
        
        this.particles.forEach(particle => {
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            // 更新透明度
            particle.alpha = 1 - progress;
            // 粒子逐渐变小
            particle.size *= 0.95;
        });
    }

    draw(ctx) {
        ctx.save();
        
        // 绘制爆炸光环
        const progress = (Date.now() - this.createTime) / this.duration;
        const radius = this.size * (1 + progress * 2);
        const alpha = 1 - progress;
        
        // 绘制外圈光环
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.3})`;
        ctx.fill();
        
        // 绘制内圈光环
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 69, 0, ${alpha * 0.5})`;
        ctx.fill();

        // 绘制爆炸粒子
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 69, 0, ${particle.alpha})`;
            ctx.fill();
        });

        ctx.restore();
    }
} 