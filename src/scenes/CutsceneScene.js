import * as PIXI from 'pixi.js';
import { Scene } from './Scene';
import { gsap } from 'gsap';
import { AssetLoader } from '../utils/AssetLoader';
import { CharacterManager } from '../game/CharacterManager';
import { Cutscene } from '../utils/Cutscene';
import { DynamicBackground } from '../examples/BackgroundUsageExample';

export class CutsceneScene extends Scene {
    constructor(app, options = {}) {
        super();
        this.app = app;
        this.assetLoader = new AssetLoader();
        this.characters = new CharacterManager(this.container);
        this.cutscene = null;

        // --- Dynamic Background ---
        this.dynamicBackground = new DynamicBackground({
            width: this.app.screen.width,
            height: this.app.screen.height,
            assetUrl: 'src/assets/background.json'
        });
        this.container.addChild(this.dynamicBackground);
    }

    preload(onComplete) {
        const assets = [
            { name: 'knight', url: 'src/assets/knight.json' },
            { name: 'princess', url: 'src/assets/prince.json' },
            { name: 'dragon', url: 'src/assets/dragon.json' },
        ];

        // Load characters + dynamic background together
        Promise.all([
            new Promise((resolve) => this.assetLoader.loadAssets(assets, resolve)),
            this.dynamicBackground.load()
        ]).then(() => {
            this.onAssetsLoaded();
            onComplete && onComplete();
        });
    }

    onAssetsLoaded() {
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        const groundY = h * 0.88; // clean ground alignment

        // --- Characters ---
        const knightSS = this.assetLoader.getSpriteSheet('knight');
        const princessSS = this.assetLoader.getSpriteSheet('princess');
        const dragonSS = this.assetLoader.getSpriteSheet('dragon');

        const knight = this.characters.addCharacter('knight', knightSS, { x: -100, y: groundY });
        const princess = this.characters.addCharacter('princess', princessSS, { x: w * 0.2, y: groundY });
        const dragon = this.characters.addCharacter('dragon', dragonSS, { x: w + 200, y: h * 0.6 });

        // Scaling & anchoring for symmetry
        [knight, princess, dragon].forEach(ch => {
            ch.sprite.anchor.set(0.5, 1);
        });
        knight.sprite.scale.set(1.2);
        princess.sprite.scale.set(1.0);
        dragon.sprite.scale.set(1.6);

        // --- Cutscene Timeline ---
        this.cutscene = new Cutscene({ onComplete: () => console.log('Cutscene finished') });

        // Title text
        const title = new PIXI.Text('The Dragon of Aralore', {
            fontFamily: 'Georgia',
            fontSize: 48,
            fill: 0xffffff,
        });
        title.anchor.set(0.5);
        title.position.set(w / 2, h * 0.25);
        title.alpha = 0;
        this.container.addChild(title);

        // Title fade in/out
        this.cutscene.timeline.to(title, { alpha: 1, duration: 1 });
        this.cutscene.wait(1);
        this.cutscene.timeline.to(title, { alpha: 0, duration: 1 });

        // Character entrance
        this.cutscene.move(knight, { x: w * 0.35, y: groundY }, 2);
        this.cutscene.move(dragon, { x: w * 0.75, y: h * 0.6 }, 2);
        this.cutscene.wait(0.5);

        this.cutscene.call(() => {
            princess.playAnimation('idle');
            knight.playAnimation('idle');
            dragon.playAnimation('idle');
        });

        // Dialogue
        this.cutscene.speak(princess, "Sir Knight! Beware the dragon!", 3);
        this.cutscene.wait(0.5);
        this.cutscene.speak(knight, "I will protect you!", 2);

        // Battle
        this.cutscene.move(knight, { x: w * 0.6, y: groundY - 20 }, 1.5);
        this.cutscene.animate(knight, 'attack');
        this.cutscene.wait(0.5);
        this.cutscene.animate(dragon, 'roar');

        this.cutscene.call(() => {
            gsap.to(dragon.sprite.scale, { x: 1.2, y: 1.2, duration: 0.2, yoyo: true, repeat: 3 });
        });
        this.cutscene.move(dragon, { x: w + 300, y: h * 0.6 }, 2);

        // Ending
        this.cutscene.wait(1);
        this.cutscene.call(() => {
            const endText = new PIXI.Text('To be continued...', {
                fontFamily: 'Georgia',
                fontSize: 38,
                fill: 0xffffff
            });
            endText.anchor.set(0.5);
            endText.position.set(w / 2, h * 0.8);
            endText.alpha = 0;
            this.container.addChild(endText);
            gsap.to(endText, { alpha: 1, duration: 1 });
        });

        this.cutscene.play();
    }

    update(delta) {
        this.characters.update(delta);
        if (this.dynamicBackground) this.dynamicBackground.update(delta);
    }
}
