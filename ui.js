import { PlantType } from './entities.js';

export class UI {
    constructor(game) {
        this.game = game;
    }

    createPlantButton(name, cost, plantType) {
        const button = document.createElement('div');
        button.style.cssText = `
            width: 100px;
            height: 120px;
            border: 2px solid #666;
            border-radius: 10px;
            padding: 10px;
            cursor: pointer;
            background-color: #f0f0f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s;
            margin: 0 5px;
        `;

        // 创建图形容器
        const shapeContainer = document.createElement('div');
        shapeContainer.style.cssText = `
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        `;

        // 创建 canvas 来绘制形状
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');

        // 根据植物类型绘制不同的形状
        ctx.beginPath();
        if (plantType === PlantType.WALLNUT) {
            ctx.fillStyle = '#8B4513';
            ctx.arc(25, 25, 20, 0, Math.PI * 2);
        }
        else if (plantType === PlantType.SPIKEWEED) {
            ctx.fillStyle = '#696969';
            ctx.moveTo(25, 5);
            ctx.lineTo(45, 25);
            ctx.lineTo(25, 45);
            ctx.lineTo(5, 25);
            ctx.closePath();
        }
        else {
            ctx.fillStyle = plantType === PlantType.SUNFLOWER ? 'yellow' : 'green';
            ctx.arc(25, 25, 20, 0, Math.PI * 2);
        }
        ctx.fill();

        shapeContainer.appendChild(canvas);

        // 创建文本
        const text = document.createElement('div');
        text.textContent = name;
        text.style.fontSize = '14px';

        const costText = document.createElement('div');
        costText.textContent = `${cost}阳光`;
        costText.style.fontSize = '12px';
        costText.style.color = '#666';

        button.appendChild(shapeContainer);
        button.appendChild(text);
        button.appendChild(costText);

        // 添加点击事件
        button.onclick = () => {
            // 移除其他按钮的选中状态
            document.querySelectorAll('.plant-button').forEach(btn => {
                btn.style.backgroundColor = '#f0f0f0';
                btn.style.borderColor = '#666';
            });

            if (this.game.selectedPlant === plantType) {
                // 如果点击已选中的植物，取消选择
                this.game.selectedPlant = null;
                button.style.backgroundColor = '#f0f0f0';
                button.style.borderColor = '#666';
            } else {
                // 选择新的植物
                this.game.selectedPlant = plantType;
                button.style.backgroundColor = '#e0ffe0';
                button.style.borderColor = '#00ff00';
            }
        };

        button.className = 'plant-button';
        return button;
    }

    addPlantSelectionButtons() {
        const container = document.getElementById('gameContainer');
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            justify-content: center;
            align-items: flex-start;
        `;
        
        // 创建所有植物按钮
        const plants = [
            { type: PlantType.SUNFLOWER, name: '向日葵', cost: '50' },
            { type: PlantType.PEASHOOTER, name: '豌豆射手', cost: '100' },
            { type: PlantType.WALLNUT, name: '坚果', cost: '50' },
            { type: PlantType.SPIKEWEED, name: '地刺', cost: '100' }
        ];

        plants.forEach(plant => {
            const btn = this.createPlantButton(plant.name, plant.cost, plant.type);
            buttonContainer.appendChild(btn);
        });

        // 添加铲子按钮
        const shovelBtn = this.createShovelButton();
        buttonContainer.appendChild(shovelBtn);

        container.insertBefore(buttonContainer, this.game.canvas);
    }

    createShovelButton() {
        const button = document.createElement('div');
        button.style.cssText = `
            width: 80px;
            height: 80px;
            border: 2px solid #666;
            border-radius: 10px;
            padding: 10px;
            cursor: pointer;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            margin-left: 20px;
        `;
        button.className = 'plant-button';

        // 创建 canvas 来绘制铲子图标
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');

        // 绘制铲子图标
        ctx.save();
        // 铲子手柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(27, 20, 6, 35);

        // 铲子头
        ctx.beginPath();
        ctx.moveTo(15, 10);
        ctx.lineTo(45, 10);
        ctx.lineTo(40, 20);
        ctx.lineTo(20, 20);
        ctx.closePath();
        ctx.fillStyle = '#A9A9A9';
        ctx.fill();
        
        // 添加边框使图标更清晰
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();

        button.appendChild(canvas);

        // 添加点击事件
        button.onclick = () => {
            // 取消植物选择
            this.game.selectedPlant = null;
            document.querySelectorAll('.plant-button').forEach(btn => {
                btn.style.backgroundColor = '#f0f0f0';
                btn.style.borderColor = '#666';
            });
            
            // 切换铲子状态
            this.game.shovelSelected = !this.game.shovelSelected;
            button.style.backgroundColor = this.game.shovelSelected ? '#e0ffe0' : '#f0f0f0';
            button.style.borderColor = this.game.shovelSelected ? '#00ff00' : '#666';
        };

        return button;
    }

    addResetButton() {
        const container = document.getElementById('gameContainer');
        const resetButton = document.createElement('button');
        resetButton.textContent = '重新开始';
        resetButton.style.cssText = `
            margin: 10px;
            padding: 10px 20px;
            font-size: 16px;
            background-color: #ff4444;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
        
        resetButton.onmouseover = () => {
            resetButton.style.backgroundColor = '#ff6666';
        };
        
        resetButton.onmouseout = () => {
            resetButton.style.backgroundColor = '#ff4444';
        };
        
        resetButton.onclick = () => this.game.resetGame();
        
        container.insertBefore(resetButton, this.game.canvas);
    }
} 