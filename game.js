import { Plant, Zombie, Pea, Sun, PlantType } from './entities.js';
import { GameLoop } from './gameLoop.js';
import { UI } from './ui.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UI(this);
        this.gameLoop = new GameLoop(this);
        
        // 初始化游戏状态
        this.plants = [];
        this.zombies = [];
        this.peas = [];
        this.suns = [];
        this.sunAmount = 500;
        this.selectedPlant = null;
        
        // 初始化网格系统
        this.gridCols = 9;
        this.gridRows = 5;
        this.cellWidth = 80;
        this.cellHeight = this.canvas.height / this.gridRows;
        this.gridStartX = (this.canvas.width - this.gridCols * this.cellWidth) / 2;
        this.grid = Array(this.gridRows).fill(null).map(() => Array(this.gridCols).fill(null));

        // 初始化关卡系统
        this.level = 1;
        this.waveCount = 0;
        this.wavesPerLevel = 10;
        this.gameStarted = true;
        this.zombieSpawned = false;
        this.baseZombieSpeed = 0.2;

        this.isSpawningZombies = false;

        this.lastZombieSpawnTime = Date.now();  // 添加上次生成僵尸的时间

        this.autoCollectSun = false;
        this.setupAutoCollect();
        this.setupInfoDisplay();

        this.init();
    }

    init() {
        this.ui.addPlantSelectionButtons();
        this.ui.addResetButton();
        this.setupEventListeners();
        this.spawnFirstZombie();
        this.gameLoop.start();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    getGridPosition(x, y) {
        const relativeX = x - this.gridStartX;
        const col = Math.floor(relativeX / this.cellWidth);
        const row = Math.floor(y / this.cellHeight);
        
        if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
            return { row, col };
        }
        return null;
    }

    getGridCenterPosition(row, col) {
        return {
            x: this.gridStartX + (col + 0.5) * this.cellWidth,
            y: (row + 0.5) * this.cellHeight
        };
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 检查是否点击了阳光
        for (let sun of this.suns) {
            if (!sun.collected) {  // 只检查未被收集的阳光
                const dx = x - sun.x;
                const dy = y - sun.y;
                if (dx * dx + dy * dy < sun.size * sun.size) {
                    sun.collected = true;
                    this.sunAmount += 25;
                    return;
                }
            }
        }

        // 获取点击的格子位置
        const gridPos = this.getGridPosition(x, y);
        if (gridPos && this.selectedPlant) {
            if (!this.grid[gridPos.row][gridPos.col]) {
                const costs = {
                    [PlantType.SUNFLOWER]: 50,
                    [PlantType.PEASHOOTER]: 100,
                    [PlantType.WALLNUT]: 50,
                    [PlantType.SPIKEWEED]: 100
                };
                const cost = costs[this.selectedPlant];
                if (this.sunAmount >= cost) {
                    const pos = this.getGridCenterPosition(gridPos.row, gridPos.col);
                    const plant = new Plant(pos.x, pos.y, this.selectedPlant);
                    this.plants.push(plant);
                    this.grid[gridPos.row][gridPos.col] = plant;
                    this.sunAmount -= cost;
                    
                    this.selectedPlant = null;
                    document.querySelectorAll('.plant-button').forEach(btn => {
                        btn.style.backgroundColor = '#f0f0f0';
                        btn.style.borderColor = '#666';
                    });
                }
            }
        }
    }

    getZombieSpeed() {
        // 每卡增加30%速度，每10波增加20%速度
        const levelSpeedIncrease = (this.level - 1) * 0.3;
        const waveSpeedIncrease = Math.min(Math.floor((this.waveCount % this.wavesPerLevel) / 10) * 0.2, 0.8);
        return this.baseZombieSpeed * (1 + levelSpeedIncrease + waveSpeedIncrease);
    }

    getZombiesCount() {
        // 每关卡基础数量+1，每3波增加1个，最多7个
        const baseCount = Math.min(2 + (this.level - 1), 4);
        return Math.min(baseCount + Math.floor((this.waveCount % this.wavesPerLevel) / 3), 7);
    }

    getWaveInterval() {
        // 波数越高，间隔越短，最短1秒
        return Math.max(2000 - this.waveCount * 100, 1000);
    }

    spawnFirstZombie() {
        // 随机选择不同的道路
        let lanes = Array.from({length: this.gridRows}, (_, i) => i);
        this.shuffleArray(lanes);
        
        // 生成第一波僵尸
        const zombieSpeed = this.getZombieSpeed();
        for (let i = 0; i < 2; i++) {
            const y = (lanes[i] + 0.5) * this.cellHeight;
            this.zombies.push(new Zombie(this.canvas.width, y, zombieSpeed));
        }
        
        this.zombieSpawned = true;
        this.waveCount = 1;
    }

    spawnZombie() {
        if (this.isSpawningZombies) return;
        
        this.isSpawningZombies = true;
        console.log('Spawning new wave...'); // 添加调试信息
        
        setTimeout(() => {
            // 检查是否需要升级关卡
            if (this.waveCount % this.wavesPerLevel === 0) {
                this.level++;
            }
            
            this.waveCount++;
            console.log(`Wave ${this.waveCount} starting...`); // 添加调试信息
            
            // 获取当前波次的僵尸属性
            const zombieSpeed = this.getZombieSpeed();
            const zombieCount = this.getZombiesCount();
            
            // 随机选择不同的道路
            let lanes = Array.from({length: this.gridRows}, (_, i) => i);
            this.shuffleArray(lanes);
            
            // 生成新一波僵尸
            for (let i = 0; i < zombieCount; i++) {
                const y = (lanes[i % this.gridRows] + 0.5) * this.cellHeight;
                this.zombies.push(new Zombie(this.canvas.width, y, zombieSpeed));
            }
            
            console.log(`Spawned ${zombieCount} zombies`); // 添加调试信息
            this.isSpawningZombies = false;
        }, this.getWaveInterval());
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    removePlant(plant) {
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                if (this.grid[row][col] === plant) {
                    this.grid[row][col] = null;
                    break;
                }
            }
        }
    }

    getSpawnInterval() {
        // 根据波数返回生成间隔，最短4秒
        return Math.max(8000 - this.waveCount * 200, 4000);
    }

    update() {
        const currentTime = Date.now();

        // 更新植物
        this.plants = this.plants.filter(plant => {
            plant.update(this);
            return plant.health > 0;
        });

        // 更新豌豆和碰撞检测
        this.peas = this.peas.filter(pea => {
            pea.update();
            
            for (let zombie of this.zombies) {
                if (Math.abs(pea.y - zombie.y) < this.cellHeight/2 && 
                    pea.x >= zombie.x && 
                    pea.x <= zombie.x + zombie.size) {
                    zombie.takeDamage(pea.damage);
                    return false;
                }
            }
            return pea.x < this.canvas.width;
        });

        // 新阳光
        this.suns.forEach(sun => sun.update());

        // 按时间间隔生成僵尸
        if (!this.isSpawningZombies && 
            currentTime - this.lastZombieSpawnTime >= this.getSpawnInterval()) {
            this.spawnZombie();
            this.lastZombieSpawnTime = currentTime;
        }

        // 更新僵尸
        let zombieKilled = false;  // 添加标志来跟踪是否有僵尸被杀死
        this.zombies = this.zombies.filter(zombie => {
            const currentTime = Date.now();
            let canMove = true;
            const zombieRow = Math.floor(zombie.y / this.cellHeight);
            
            for (let plant of this.plants) {
                const plantRow = Math.floor(plant.y / this.cellHeight);
                if (plantRow === zombieRow && 
                    plant.x > zombie.x - zombie.size && 
                    plant.x < zombie.x + zombie.size) {
                    
                    if (plant.type !== PlantType.SPIKEWEED) {
                        canMove = false;
                        if (currentTime - zombie.lastAttackTime >= zombie.attackInterval) {
                            plant.takeDamage(zombie.attackDamage);
                            zombie.lastAttackTime = currentTime;
                            
                            if (plant.health <= 0) {
                                this.removePlant(plant);
                                canMove = true;
                            }
                        }
                    }
                }
            }
            
            if (canMove) {
                zombie.move();
            }

            if (zombie.health <= 0) {
                zombieKilled = true;  // 标记僵尸被杀死
                return false;
            }
            return true;
        });

        // 在所有僵尸更新完成后检查是否需要生成新的僵尸
        if (zombieKilled && this.zombies.length === 0 && !this.isSpawningZombies) {
            this.spawnZombie();
        }

        // 自动收集阳光
        if (this.autoCollectSun) {
            this.suns = this.suns.filter(sun => {
                if (!sun.collected && sun.state === 'falling' && sun.y >= sun.originY) {
                    sun.collected = true;
                    this.sunAmount += 25;
                    return true;  // 保持阳光在数组中直到消失
                }
                return sun.size > 0;  // 当阳光完全缩小后移除
            });
        }

        // 更新显示信息
        this.updateInfoDisplay();
    }

    updateInfoDisplay() {
        this.sunAmountDisplay.textContent = this.sunAmount;
        this.levelDisplay.textContent = this.level;
        this.waveDisplay.textContent = 
            `${this.waveCount % this.wavesPerLevel || this.wavesPerLevel}`;
        this.zombieCountDisplay.textContent = this.getZombiesCount();
        this.speedBoostDisplay.textContent = 
            Math.round((this.getZombieSpeed() / this.baseZombieSpeed - 1) * 100);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制草坪道路
        for (let i = 0; i < this.gridRows; i++) {
            this.ctx.fillStyle = i % 2 === 0 ? '#458B00' : '#528B00';
            this.ctx.fillRect(0, i * this.cellHeight, this.canvas.width, this.cellHeight);
        }

        // 绘制格子线
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;

        // 绘制垂直线
        for (let i = 0; i <= this.gridCols; i++) {
            const x = this.gridStartX + i * this.cellWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let i = 0; i <= this.gridRows; i++) {
            const y = i * this.cellHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(this.gridStartX, y);
            this.ctx.lineTo(this.gridStartX + this.gridCols * this.cellWidth, y);
            this.ctx.stroke();
        }

        // 绘制游戏元素
        this.plants.forEach(plant => plant.draw(this.ctx));
        this.zombies.forEach(zombie => zombie.draw(this.ctx));
        this.peas.forEach(pea => pea.draw(this.ctx));
        this.suns.forEach(sun => sun.draw(this.ctx));
    }

    resetGame() {
        this.plants = [];
        this.zombies = [];
        this.peas = [];
        this.suns = [];
        this.sunAmount = 500;
        this.selectedPlant = null;
        this.waveCount = 0;
        this.level = 1;
        this.zombieSpawned = false;
        
        this.grid = Array(this.gridRows).fill(null)
            .map(() => Array(this.gridCols).fill(null));
        
        document.querySelectorAll('.plant-button').forEach(btn => {
            btn.style.backgroundColor = '#f0f0f0';
            btn.style.borderColor = '#666';
        });
        
        this.isSpawningZombies = false;
        this.spawnFirstZombie();
        this.lastZombieSpawnTime = Date.now();
    }

    setupAutoCollect() {
        const checkbox = document.getElementById('autoCollect');
        checkbox.addEventListener('change', (e) => {
            this.autoCollectSun = e.target.checked;
        });
    }

    setupInfoDisplay() {
        this.sunAmountDisplay = document.getElementById('sunAmount');
        this.levelDisplay = document.getElementById('level');
        this.waveDisplay = document.getElementById('wave');
        this.zombieCountDisplay = document.getElementById('zombieCount');
        this.speedBoostDisplay = document.getElementById('speedBoost');
    }
} 