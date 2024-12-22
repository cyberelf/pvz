export class AudioManager {
    constructor() {
        // 背景音乐
        this.bgMusic = new Audio('assets/bgm.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3;
        
        // 音效
        this.sounds = {
            zombieGroan: new Audio('assets/zombie_groan.mp3'),
            zombieEat: new Audio('assets/zombie_eat.mp3'),
            peaHit: new Audio('assets/pea_hit.mp3')
        };

        // 设置音效音量
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5;
        });
        
        // 特别调整子弹击中音效的音量
        if (this.sounds.peaHit) {
            this.sounds.peaHit.volume = 0.3;
        }
        
        // 添加音量控制
        this.isMuted = false;
    }

    playBackgroundMusic() {
        const playPromise = this.bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay prevented:", error);
            });
        }
    }

    playSound(soundName) {
        if (this.isMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // 重置音频以便重复播放
            sound.currentTime = 0;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Sound play prevented:", error);
                });
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.bgMusic.muted = this.isMuted;
        Object.values(this.sounds).forEach(sound => {
            sound.muted = this.isMuted;
        });
    }

    setVolume(volume) {
        this.bgMusic.volume = Math.max(0, Math.min(1, volume));
    }

    stop() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
} 