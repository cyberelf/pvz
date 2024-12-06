import { Graphics } from './graphics.js';

// 植物类型枚举
export const PlantType = {
    SUNFLOWER: 'sunflower',
    PEASHOOTER: 'peashooter',
    WALLNUT: 'wallnut',
    SPIKEWEED: 'spikeweed'
};

// 植物基类
export class Plant {
    static useDefaultShapes = false;

    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        // 不同植物有不同的生命值
        switch(type) {
            case PlantType.WALLNUT:
                this.health = 400;
                break;
            case PlantType.PEASHOOTER:
                this.health = 150;
                break;
            case PlantType.SUNFLOWER:
                this.health = 100;
                break;
            case PlantType.SPIKEWEED:
                this.health = 100;
                break;
            default:
                this.health = 100;
        }
        this.size = type === PlantType.SPIKEWEED ? 40 : 
                    type === PlantType.SUNFLOWER ? 40 : 50;
        this.lastShootTime = Date.now();
        this.lastSunTime = Date.now();
        this.lastDamageTime = Date.now();
        this.flashUntil = 0;
        this.maxHealth = this.health;
    }

    takeDamage(damage) {
        this.health -= damage;
        this.flashUntil = Date.now() + 200;
    }

    update(game) {
        const currentTime = Date.now();
        
        if (this.type === PlantType.PEASHOOTER) {
            const plantRow = Math.floor(this.y / game.cellHeight);
            const hasZombieInLane = game.zombies.some(zombie => {
                const zombieRow = Math.floor(zombie.y / game.cellHeight);
                return plantRow === zombieRow && zombie.x > this.x;
            });
            
            if (hasZombieInLane && currentTime - this.lastShootTime > 1500) {
                game.peas.push(new Pea(this.x + this.size/2, this.y));
                this.lastShootTime = currentTime;
            }
        } 
        else if (this.type === PlantType.SUNFLOWER) {
            if (currentTime - this.lastSunTime > 10000) {
                game.suns.push(new Sun(this.x, this.y));
                this.lastSunTime = currentTime;
            }
        }
        else if (this.type === PlantType.SPIKEWEED) {
            if (currentTime - this.lastDamageTime > 1000) {
                const plantRow = Math.floor(this.y / game.cellHeight);
                game.zombies.forEach(zombie => {
                    const zombieRow = Math.floor(zombie.y / game.cellHeight);
                    if (plantRow === zombieRow && 
                        Math.abs(zombie.x - this.x) < this.size) {
                        zombie.takeDamage(10);
                    }
                });
                this.lastDamageTime = currentTime;
            }
        }
    }

    draw(ctx) {
        const time = Date.now();
        
        if (Plant.useDefaultShapes) {
            // ... 原来的默认形状绘制代码 ...
        } else {
            switch(this.type) {
                case PlantType.PEASHOOTER:
                    Graphics.createPeashooterSVG(ctx, this.x, this.y, this.size, time);
                    break;
                case PlantType.SUNFLOWER:
                    Graphics.createSunflowerSVG(ctx, this.x, this.y, this.size, time);
                    break;
                case PlantType.WALLNUT:
                    Graphics.createWallnutSVG(ctx, this.x, this.y, this.size, time);
                    break;
                case PlantType.SPIKEWEED:
                    Graphics.createSpikeweedSVG(ctx, this.x, this.y, this.size, time);
                    break;
            }
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
            this.y + this.size/2 + 15
        );
        // 再绘制文字
        ctx.fillText(
            Math.ceil(this.health),
            this.x,
            this.y + this.size/2 + 15
        );
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
        this.x -= this.speed;
    }

    draw(ctx) {
        const time = Date.now();
        
        if (Zombie.useDefaultShapes) {
            // ... 原来的默认形状绘制代码 ...
        } else {
            Graphics.createZombieSVG(ctx, this.x, this.y, this.size, time);
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
}

export class Pea {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.damage = 20;
        this.size = 12;
    }

    update() {
        this.x += this.speed;
    }

    draw(ctx) {
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

export class Sun {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originY = y;  // 记录初始Y坐标（向日葵的位置��
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
            this.size = Math.max(0, this.size - 1);  // 逐渐缩小
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