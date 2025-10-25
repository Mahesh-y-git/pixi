import * as PIXI from 'pixi.js';
import * as THREE from 'three';
import { SceneManager } from './scenes/SceneManager';
import { GameScene } from './scenes/GameScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { ExampleBackgroundScene } from './scenes/ExampleBackgroundScene';

class Game {
    constructor() {
        this.app = null;
        this.renderer = null; // optional three.js renderer
        this.sceneManager = null;
        this.backgroundManager = null; // Centralized background management
        this.currentBackground = 'forest'; // Current background theme
        this.init();
    }

    async init() {
        this.app = new PIXI.Application();
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            antialias: true,
            resizeTo: window,
        });

        const container = document.getElementById('app') || document.body;
        container.appendChild(this.app.canvas);

        // Create centralized background manager
        this.backgroundManager = new ExampleBackgroundScene(this.app);
        
        // Scene manager
        this.sceneManager = new SceneManager(this.app);
        const gameScene = new GameScene(this.app);
        const cutsceneScene = new CutsceneScene(this.app);
        this.sceneManager.addScene('game', gameScene);
        this.sceneManager.addScene('cutscene', cutsceneScene);

        // Create loading screen
        this.createLoadingScreen();

        // Preload background assets first, then scene assets
        console.log('Starting background preload...');
        this.backgroundManager.preload(() => {
            console.log('Background assets loaded');
            
            // Add background to the app stage (behind all scenes)
            this.app.stage.addChildAt(this.backgroundManager.container, 0);
            
            // Now load scene assets
            console.log('Starting scene preload...');
            gameScene.preload(() => {
                console.log('Game scene assets loaded, starting game');
                this.hideLoadingScreen();
                this.sceneManager.changeScene('game');
            });
        });

        // Add keyboard controls for background switching
        this.setupGlobalControls();

        this.app.ticker.add((delta) => {
            // Update background manager
            if (this.backgroundManager && typeof this.backgroundManager.update === 'function') {
                this.backgroundManager.update(delta);
            }
            
            // Update current scene
            const cur = this.sceneManager.current;
            if (cur && typeof cur.update === 'function') {
                cur.update(delta);
            }
        });
    }

    createLoadingScreen() {
        this.loadingContainer = new PIXI.Container();
        
        // Background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.8);
        bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        bg.endFill();
        this.loadingContainer.addChild(bg);
        
        // Loading text
        this.loadingText = new PIXI.Text('Loading Assets...', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.loadingText.anchor.set(0.5);
        this.loadingText.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        this.loadingContainer.addChild(this.loadingText);
        
        // Loading spinner
        this.loadingSpinner = new PIXI.Graphics();
        this.loadingSpinner.lineStyle(4, 0xFFFFFF);
        this.loadingSpinner.arc(0, 0, 30, 0, Math.PI);
        this.loadingSpinner.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 60);
        this.loadingContainer.addChild(this.loadingSpinner);
        
        this.app.stage.addChild(this.loadingContainer);
        
        // Animate spinner
        this.spinnerTween = setInterval(() => {
            if (this.loadingSpinner) {
                this.loadingSpinner.rotation += 0.1;
            }
        }, 16);
    }
    
    hideLoadingScreen() {
        if (this.spinnerTween) {
            clearInterval(this.spinnerTween);
        }
        if (this.loadingContainer && this.app.stage.children.includes(this.loadingContainer)) {
            this.app.stage.removeChild(this.loadingContainer);
            this.loadingContainer.destroy(true);
        }
    }
    
    // Error handling
    handleError(error) {
        console.error('Game initialization error:', error);
        this.showErrorScreen(error.message);
    }
    
    showErrorScreen(message) {
        const errorContainer = new PIXI.Container();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x330000, 0.9);
        bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        bg.endFill();
        errorContainer.addChild(bg);
        
        const errorText = new PIXI.Text(`Error: ${message}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFF6666,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: this.app.screen.width - 100
        });
        errorText.anchor.set(0.5);
        errorText.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        errorContainer.addChild(errorText);
        
        const retryText = new PIXI.Text('Click to retry', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            align: 'center'
        });
        retryText.anchor.set(0.5);
        retryText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 60);
        errorContainer.addChild(retryText);
        
        this.app.stage.addChild(errorContainer);
        
        // Make it interactive
        errorContainer.interactive = true;
        errorContainer.on('pointerdown', () => {
            location.reload();
        });
    }
    
    // Global controls for background management
    setupGlobalControls() {
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case '1':
                    this.changeBackground('forest');
                    break;
                case '2':
                    this.changeBackground('castle');
                    break;
                case '3':
                    this.changeBackground('mountain');
                    break;
                case 'b':
                    this.cycleBackground();
                    break;
                case 'w':
                    this.toggleWeather();
                    break;
                case 't':
                    this.cycleTimeOfDay();
                    break;
            }
        });
        
        console.log('Global Controls:');
        console.log('1/2/3 - Change background theme');
        console.log('B - Cycle through backgrounds');
        console.log('W - Toggle weather effects');
        console.log('T - Cycle time of day');
    }
    
    // Background management methods
    changeBackground(backgroundType) {
        if (!this.backgroundManager) return;
        
        this.currentBackground = backgroundType;
        console.log(`Changing background to: ${backgroundType}`);
        
        // Get background spritesheet
        const bgSpritesheet = this.backgroundManager.assetLoader.getSpriteSheet('bg');
        
        if (bgSpritesheet && bgSpritesheet.textures) {
            const texture = bgSpritesheet.textures[`${backgroundType}_bg`];
            if (texture) {
                this.backgroundManager.background.setTexture(texture);
            } else {
                console.warn(`Background texture '${backgroundType}_bg' not found`);
            }
        }
        
        // Notify current scene about background change
        const currentScene = this.sceneManager.current;
        if (currentScene && typeof currentScene.onBackgroundChanged === 'function') {
            currentScene.onBackgroundChanged(backgroundType);
        }
    }
    
    cycleBackground() {
        const backgrounds = ['forest', 'castle', 'mountain'];
        const currentIndex = backgrounds.indexOf(this.currentBackground);
        const nextIndex = (currentIndex + 1) % backgrounds.length;
        this.changeBackground(backgrounds[nextIndex]);
    }
    
    toggleWeather() {
        if (!this.backgroundManager) return;
        
        if (this.weatherEffect) {
            this.weatherEffect.stop();
            this.weatherEffect = null;
            console.log('Weather stopped');
        } else {
            this.weatherEffect = this.backgroundManager.background.addRain(1);
            console.log('Rain started');
        }
    }
    
    cycleTimeOfDay() {
        if (!this.backgroundManager) return;
        
        const times = [
            { name: 'day', tint: 0xFFFFFF },
            { name: 'sunset', tint: 0xFF8C69 },
            { name: 'night', tint: 0x4169E1 },
            { name: 'dawn', tint: 0xFFE4B5 }
        ];
        
        this.currentTimeIndex = (this.currentTimeIndex || 0) + 1;
        if (this.currentTimeIndex >= times.length) this.currentTimeIndex = 0;
        
        const time = times[this.currentTimeIndex];
        this.backgroundManager.background.setAmbientLight(time.tint, 0.8);
        console.log(`Time changed to: ${time.name}`);
    }
}

window.onload = () => {
    try {
        new Game();
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
};
