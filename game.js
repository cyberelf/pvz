import { Plant, Zombie, Pea, Sun, PlantType } from './entities.js';
import { GameLoop } from './gameLoop.js';
import { UI } from './ui.js';
import { LawnMower } from './entities.js';
import { AudioManager } from './audio.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UI(this);
        this.gameLoop = new GameLoop(this);
        this.audioManager = new AudioManager();  // 初始化音频管理器
        
        // 初始化游戏状态
        this.plants = [];
        this.zombies = [];
        this.peas = [];
        this.suns = [];
        this.sunAmount = 500;
        this.selectedPlant = null;
        this.shovelSelected = false;  // 添加铲子选择状态
        
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

        this.gameOver = false;  // 添加游戏结束标志

        // 初始化小推车
        this.lawnMowers = Array(this.gridRows).fill(null).map((_, i) => 
            new LawnMower(
                this.gridStartX - 50,  // 放在格子左侧
                (i + 0.5) * this.cellHeight
            )
        );

        this.speedMultiplier = 1;  // 添加速度倍数
        this.setupSpeedControl();  // 添加速度控制设置

        this.init();
    }

    init() {
        this.ui.addPlantSelectionButtons();
        this.setupEventListeners();
        this.spawnFirstZombie();
        this.gameLoop.start();
        this.setupMusicControls();
    }

    setupMusicControls() {
        // 创建音乐控制容器
        const musicControls = document.createElement('div');
        musicControls.style.position = 'absolute';
        musicControls.style.top = '10px';
        musicControls.style.right = '10px';
        musicControls.style.zIndex = '1000';
        musicControls.style.display = 'flex';
        musicControls.style.gap = '10px';

        // 创建播放按钮
        const playButton = document.createElement('button');
        playButton.textContent = '▶️ 播放音乐';
        playButton.style.padding = '5px 10px';
        playButton.style.cursor = 'pointer';
        playButton.style.backgroundColor = '#4CAF50';
        playButton.style.color = 'white';
        playButton.style.border = 'none';
        playButton.style.borderRadius = '4px';

        // 创建音量按钮
        const muteButton = document.createElement('button');
        muteButton.textContent = '🔊';
        muteButton.style.padding = '5px 10px';
        muteButton.style.cursor = 'pointer';
        muteButton.style.backgroundColor = '#f0f0f0';
        muteButton.style.border = 'none';
        muteButton.style.borderRadius = '4px';

        // 添加播放按钮事件
        playButton.addEventListener('click', () => {
            this.audioManager.playBackgroundMusic();
            this.musicStarted = true;
            playButton.style.display = 'none';  // 播放后隐藏播放按钮
            muteButton.style.display = 'block'; // 显示音量控制按钮
        });

        // 添加音量控制事件
        muteButton.addEventListener('click', () => {
            this.audioManager.toggleMute();
            muteButton.textContent = this.audioManager.isMuted ? '🔇' : '🔊';
        });

        // 初始状态下隐藏音量按钮
        muteButton.style.display = 'none';

        // 将按钮添加到控制容器
        musicControls.appendChild(playButton);
        musicControls.appendChild(muteButton);
        document.body.appendChild(musicControls);
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
        if (this.gameOver) {
            this.resetGame();
            this.gameOver = false;
            this.gameLoop.start();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 检查是否点击了阳光
        for (let sun of this.suns) {
            if (!sun.collected) {
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
        if (gridPos) {
            if (this.shovelSelected) {
                // 如果选择了铲子，移除植物并回收阳光
                const plant = this.grid[gridPos.row][gridPos.col];
                if (plant) {
                    // 计算回收的阳光
                    const costs = {
                        [PlantType.SUNFLOWER]: 50,
                        [PlantType.PEASHOOTER]: 100,
                        [PlantType.WALLNUT]: 50,
                        [PlantType.SPIKEWEED]: 100,
                        [PlantType.TORCHWOOD]: 175
                    };
                    const refund = Math.floor(costs[plant.type] / 2);  // 确保返还值为整数
                    this.sunAmount = Math.floor(this.sunAmount + refund);  // 确保总阳光数为整数

                    // 移除植物
                    this.grid[gridPos.row][gridPos.col] = null;
                    this.plants = this.plants.filter(p => p !== plant);
                    
                    // 取消铲子选择
                    this.shovelSelected = false;
                    document.querySelector('.plant-button').classList.remove('selected');
                }
            } else if (this.selectedPlant && !this.grid[gridPos.row][gridPos.col]) {
                // 种植新植物
                const costs = {
                    [PlantType.SUNFLOWER]: 50,
                    [PlantType.PEASHOOTER]: 100,
                    [PlantType.WALLNUT]: 50,
                    [PlantType.SPIKEWEED]: 100,
                    [PlantType.TORCHWOOD]: 175  // 添加火炬树桩的价格
                };
                const cost = costs[this.selectedPlant];
                if (this.sunAmount >= cost) {
                    const pos = this.getGridCenterPosition(gridPos.row, gridPos.col);
                    const plant = new Plant(pos.x, pos.y, this.selectedPlant);
                    this.plants.push(plant);
                    this.grid[gridPos.row][gridPos.col] = plant;
                    this.sunAmount -= cost;
                    
                    // 取消植物选择
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
        // 修改僵尸速度计算
        const baseSpeed = this.baseZombieSpeed * this.speedMultiplier;
        const levelSpeedIncrease = (this.level - 1) * 0.3;
        const waveSpeedIncrease = Math.min(Math.floor((this.waveCount % this.wavesPerLevel) / 10) * 0.2, 0.8);
        return baseSpeed * (1 + levelSpeedIncrease + waveSpeedIncrease);
    }

    getZombiesCount() {
        // 每关卡基础数量+1，每3波增加1个，最多7
        const baseCount = Math.min(2 + (this.level - 1), 4);
        return Math.min(baseCount + Math.floor((this.waveCount % this.wavesPerLevel) / 3), 7);
    }

    getWaveInterval() {
        // 波数越高，间隔越短，最短1秒
        return Math.max(2000 - this.waveCount * 100, 1000);
    }

    spawnFirstZombie() {
        // 空所有僵尸
        this.zombies = [];
        
        // 随机选择不同的道路
        let lanes = Array.from({length: this.gridRows}, (_, i) => i);
        this.shuffleArray(lanes);
        
        // 生成第一波僵尸，确保从画布右侧开始
        const zombieSpeed = this.getZombieSpeed();
        for (let i = 0; i < 2; i++) {
            const y = (lanes[i] + 0.5) * this.cellHeight;
            // 确保僵尸从画布右侧开始
            const x = this.canvas.width + 50;  // 添加一些额外距离
            this.zombies.push(new Zombie(x, y, zombieSpeed));
        }
        // 只播放一次僵尸叫声
        this.audioManager.playSound('zombieGroan');
        
        this.zombieSpawned = true;
        this.waveCount = 1;
    }

    spawnZombie() {
        if (this.isSpawningZombies) return;
        
        this.isSpawningZombies = true;
        console.log('Spawning new wave...'); // 添加调试信息
        
        setTimeout(() => {
            // 查是否要升级关卡
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
                const x = this.canvas.width + 50;  // 确保从画布右侧开始
                this.zombies.push(new Zombie(x, y, zombieSpeed));
            }
            // 每波僵尸只播放一次叫声
            this.audioManager.playSound('zombieGroan');
            
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
        // 据波数返回成间隔，最短4秒
        return Math.max(8000 - this.waveCount * 200, 4000);
    }

    update() {
        if (this.gameOver) return;  // 如果游戏结束就不再更新

        const currentTime = Date.now();

        // 更新植物
        this.plants = this.plants.filter(plant => {
            plant.update(this);
            return plant.health > 0;
        });

        // 更新豌豆和碰撞检测
        this.peas = this.peas.filter(pea => {
            pea.speed = 8 * this.speedMultiplier;  // 调整豌豆速度
            pea.update(this);  // 传入 game 实例以检查火炬树桩
            
            for (let zombie of this.zombies) {
                if (Math.abs(pea.y - zombie.y) < this.cellHeight/2 && 
                    pea.x >= zombie.x && 
                    pea.x <= zombie.x + zombie.size) {
                    zombie.takeDamage(pea.damage);
                    this.audioManager.playSound('peaHit');  // 播放子弹击中音效
                    return false;
                }
            }
            return pea.x < this.canvas.width;
        });

        // 新阳光
        this.suns.forEach(sun => {
            sun.speed = 1 * this.speedMultiplier;  // 调整阳光速度
            sun.update();
        });

        // 按时间间隔生成僵尸
        if (!this.isSpawningZombies && 
            currentTime - this.lastZombieSpawnTime >= this.getSpawnInterval()) {
            this.spawnZombie();
            this.lastZombieSpawnTime = currentTime;
        }

        // 更新僵尸
        let zombieKilled = false;  // 添加志来跟踪是否有僵尸被杀死
        this.zombies = this.zombies.filter(zombie => {
            zombie.update(this);  // 传递 game 实例
            const currentTime = Date.now();
            let canMove = true;
            const zombieRow = Math.floor(zombie.y / this.cellHeight);
            
            // 检查是否到达最左边
            if (zombie.x <= this.gridStartX - zombie.size) {
                this.handleGameOver();
                return false;
            }

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
                            this.audioManager.playSound('zombieEat');  // 播放吃植物的声音
                            
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
                    return true;  // 保持阳光在数中直到消失
                }
                return sun.size > 0;  // 当阳光完全缩小后移除
            });
        }

        // 更新小推车
        this.lawnMowers.forEach(mower => {
            if (!mower.used) {
                mower.update(this);  // 传递 game 实例
                // 检查是否有僵尸触推车
                if (!mower.active) {
                    const mowerRow = Math.floor(mower.y / this.cellHeight);
                    for (const zombie of this.zombies) {
                        const zombieRow = Math.floor(zombie.y / this.cellHeight);
                        if (zombieRow === mowerRow && 
                            zombie.x <= this.gridStartX) {
                            mower.active = true;
                            break;
                        }
                    }
                }

                // 如果小推车被激活清除同一行的僵尸
                if (mower.active) {
                    const mowerRow = Math.floor(mower.y / this.cellHeight);
                    this.zombies = this.zombies.filter(zombie => {
                        const zombieRow = Math.floor(zombie.y / this.cellHeight);
                        return zombieRow !== mowerRow || zombie.x > mower.x + mower.size/2;
                    });
                }

                // 如果小推车到达画布边缘，标记为已使用
                if (mower.x > this.canvas.width) {
                    mower.used = true;
                }
            }
        });

        // 修改游戏结束件：只有当僵尸到达最左边且该行没有可的小推车时才结束游戏
        this.zombies.forEach(zombie => {
            if (zombie.x <= this.gridStartX - zombie.size) {
                const zombieRow = Math.floor(zombie.y / this.cellHeight);
                const mower = this.lawnMowers[zombieRow];
                if (mower.used) {
                    this.handleGameOver();
                }
            }
        });

        // 更新显示信息
        this.updateInfoDisplay();
    }

    updateInfoDisplay() {
        // 确保获取到正确的DOM元素
        if (!this.sunAmountDisplay) {
            this.sunAmountDisplay = document.getElementById('sunAmount');
        }
        if (this.sunAmountDisplay) {
            this.sunAmountDisplay.textContent = Math.floor(this.sunAmount);
        }

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

        // 绘制小推车
        this.lawnMowers.forEach(mower => mower.draw(this.ctx));

        // 如果游戏结束，制游戏结束画面
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('游戏结束!', this.canvas.width/2, this.canvas.height/2 - 30);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('点击重新开始', this.canvas.width/2, this.canvas.height/2 + 30);
        }
    }

    resetGame() {
        // 停止当前游戏循环
        this.gameLoop.stop();

        this.plants = [];
        this.zombies = [];
        this.peas = [];
        this.suns = [];
        this.sunAmount = 500;
        this.selectedPlant = null;
        this.shovelSelected = false;
        this.waveCount = 0;
        this.level = 1;
        this.zombieSpawned = false;
        this.isSpawningZombies = false;
        this.gameOver = false;
        this.lastZombieSpawnTime = Date.now();
        
        // 重置僵尸速度
        this.baseZombieSpeed = 0.2;  // 重置基础速度
        
        // ��置网格
        this.grid = Array(this.gridRows).fill(null)
            .map(() => Array(this.gridCols).fill(null));
        
        // 重植物按钮状态
        document.querySelectorAll('.plant-button').forEach(btn => {
            btn.style.backgroundColor = '#f0f0f0';
            btn.style.borderColor = '#666';
            // 移除选中标记
            const selectedMark = btn.querySelector('div[style*="position: absolute"]');
            if (selectedMark) {
                btn.removeChild(selectedMark);
            }
        });
        
        // 重置小推车
        this.lawnMowers = Array(this.gridRows).fill(null).map((_, i) => 
            new LawnMower(
                this.gridStartX - 50,
                (i + 0.5) * this.cellHeight
            )
        );
        
        // 生成第一波僵尸
        this.spawnFirstZombie();

        // 重新启动游戏循环
        this.gameLoop = new GameLoop(this);  // 创建新的游戏循环实例
        this.gameLoop.start();

        this.speedMultiplier = 1;  // 重置速度倍数
        // 重置速度按钮
        document.querySelectorAll('.speed-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('speed1x').classList.add('selected');

        this.audioManager.stop();  // 停止背景音乐
        this.audioManager.playBackgroundMusic();  // 重新始播放
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

        // 添加重置按钮的事件监听器
        const resetButton = document.getElementById('resetButton');
        resetButton.addEventListener('click', () => {
            this.resetGame();
            this.gameOver = false;
        });
    }

    handleGameOver() {
        this.gameOver = true;
        this.gameLoop.stop();  // 使用 stop 方法停止循环
    }

    setupSpeedControl() {
        const speeds = [1, 2, 4, 8];
        speeds.forEach(speed => {
            const button = document.getElementById(`speed${speed}x`);
            if (button) {
                button.addEventListener('click', () => {
                    this.speedMultiplier = speed;
                    // 更新按钮样式
                    document.querySelectorAll('.speed-button').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    button.classList.add('selected');
                });
            }
        });
    }
} 