import * as PIXI from 'pixi.js';
import { Scene } from './Scene';
import { Character } from '../game/Character';
import { AssetLoader } from '../utils/AssetLoader';
import { Background } from '../components/Background';
import { CharacterManager } from '../game/CharacterManager';

export class GameScene extends Scene {
    constructor(app) {
        super();
        this.app = app;
        this.assetLoader = new AssetLoader();
        this.background = new Background({ color: 0x1099bb });
        this.characters = new CharacterManager(this.container);
    }

    preload(onComplete) {
        const assets = [
            { name: 'character', url: 'assets/spritesheets/character.json' }
        ];
        this.assetLoader.loadAssets(assets, () => {
            this.onAssetsLoaded();
            onComplete();
        });
    }

    onAssetsLoaded() {
        // attach background and resize it to the app
        this.background.addTo(this.container);
        this.background.resize(this.app.screen.width, this.app.screen.height);

        const characterSpritesheet = this.assetLoader.getSpriteSheet('character');

        // create 3 characters spread horizontally
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        const positions = [
            { x: w * 0.25, y: h * 0.6 },
            { x: w * 0.5, y: h * 0.6 },
            { x: w * 0.75, y: h * 0.6 }
        ];

        positions.forEach((pos, i) => {
            const id = `char-${i+1}`;
            const c = this.characters.addCharacter(id, characterSpritesheet, pos);
            // stagger idle speed slightly
            c.sprite.animationSpeed = 0.08 + i * 0.02;
        });

        // clicking/tapping moves the nearest character and shows a bubble
        this.app.stage.interactive = true;
        this.app.stage.on('pointerdown', (event) => {
            const pos = event.data.global;
            // find nearest character
            let nearest = null;
            let bestDist = Infinity;
            for (const c of this.characters.characters) {
                const dx = c.sprite.x - pos.x;
                const dy = c.sprite.y - pos.y;
                const d = dx*dx + dy*dy;
                if (d < bestDist) { bestDist = d; nearest = c; }
            }
            if (nearest) {
                nearest.moveTo(pos);
                nearest.showBubble('On my way!', this.container, 2);
            }
        });

        // respond to resize
        window.addEventListener('resize', () => {
            this.background.resize(this.app.screen.width, this.app.screen.height);
        });
    }

    update(delta) {
        // Update game logic here
    }
}
