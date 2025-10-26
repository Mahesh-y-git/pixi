import * as PIXI from 'pixi.js';
import * as THREE from 'three';
import { SceneManager } from './scenes/SceneManager';
import { GameScene } from './scenes/GameScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { initDevtools } from '@pixi/devtools'; 

class Game {
    constructor() {
        this.app = null;
        this.renderer = null; // optional three.js renderer
        this.sceneManager = null;
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
        // Attach devtools (optional)
        if (typeof initDevtools === 'function') {
            console.log(initDevtools)
            window.__PIXI_APP__ = this.app;
            initDevtools({ app });
        }
        const container = document.getElementById('app') || document.body;
        container.appendChild(this.app.canvas);

       
        // Scene manager
        this.sceneManager = new SceneManager(this.app);
        const gameScene = new GameScene(this.app);
        const cutsceneScene = new CutsceneScene(this.app);
        this.sceneManager.addScene('game', gameScene);
       this.sceneManager.addScene('cutscene', cutsceneScene);

        // By default start with the cutscene
        // Ensure we preload assets for the scene before switching
        cutsceneScene.preload(() => {
            this.sceneManager.changeScene('cutscene');
        });

        this.app.ticker.add((delta) => {
            const cur = this.sceneManager.current;
            if (cur && typeof cur.update === 'function') cur.update(delta);
        });
    }
}

window.onload = () => {
    new Game();
};