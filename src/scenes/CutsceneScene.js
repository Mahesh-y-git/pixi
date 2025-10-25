import * as PIXI from 'pixi.js';
import { Scene } from './Scene';
import { gsap } from 'gsap';
import { AssetLoader } from '../utils/AssetLoader';
import { Background } from '../components/Background';
import { CharacterManager } from '../game/CharacterManager';
import { Cutscene } from '../utils/Cutscene';

export class CutsceneScene extends Scene {
    constructor(app, options = {}) {
        super();
        this.app = app;
        this.assetLoader = new AssetLoader();
        this.background = new Background({ color: options.bgColor || 0x000000 });
        this.characters = new CharacterManager(this.container);
        this.cutscene = null;
    }

    preload(onComplete) {
        const assets = [
            { name: 'knight', url: 'assets/spritesheets/knight.json' },
            { name: 'princess', url: 'assets/spritesheets/princess.json' },
            { name: 'dragon', url: 'assets/spritesheets/dragon.json' },
            { name: 'bg', url: 'assets/spritesheets/background.json' }
        ];
        this.assetLoader.loadAssets(assets, () => {
            this.onAssetsLoaded();
            onComplete && onComplete();
        });
    }

    onAssetsLoaded() {
        // add background
        this.background.addTo(this.container);
        this.background.resize(this.app.screen.width, this.app.screen.height);
        const bgTex = this.assetLoader.getSpriteSheet('bg');
        if (bgTex && bgTex.textures && Object.keys(bgTex.textures).length) {
            // if background is stored as a texture or spritesheet, try to use one
            const texKeys = Object.keys(bgTex.textures);
            const t = bgTex.textures[texKeys[0]];
            this.background.setTexture(t);
        }

        // create characters
        const knightSS = this.assetLoader.getSpriteSheet('knight');
        const princessSS = this.assetLoader.getSpriteSheet('princess');
        const dragonSS = this.assetLoader.getSpriteSheet('dragon');

        const w = this.app.screen.width;
        const h = this.app.screen.height;

        const knight = this.characters.addCharacter('knight', knightSS, { x: -100, y: h * 0.6 });
        const princess = this.characters.addCharacter('princess', princessSS, { x: w * 0.2, y: h * 0.6 });
        const dragon = this.characters.addCharacter('dragon', dragonSS, { x: w + 200, y: h * 0.35 });

        // small tweaks
        knight.sprite.scale.set(1.2);
        princess.sprite.scale.set(1.0);
        dragon.sprite.scale.set(1.6);

        // prepare a cutscene timeline
        this.cutscene = new Cutscene({ onComplete: () => console.log('Cutscene finished') });

        // intro title
        const title = new PIXI.Text('The Dragon of Aralore', { fontFamily: 'Serif', fontSize: 48, fill: 0xffffff, align: 'center' });
        title.anchor.set(0.5);
        title.x = w / 2; title.y = h * 0.2;
        title.alpha = 0;
        this.container.addChild(title);

        this.cutscene.timeline.to(title, { alpha: 1, duration: 1 });
        this.cutscene.wait(1);
        this.cutscene.timeline.to(title, { alpha: 0, duration: 1 });

        // characters enter
        this.cutscene.move(knight, { x: w * 0.35, y: h * 0.6 }, 2);
        this.cutscene.move(dragon, { x: w * 0.75, y: h * 0.35 }, 2);
        this.cutscene.wait(0.5);
        this.cutscene.call(() => {
            princess.playAnimation('idle');
            knight.playAnimation('idle');
            dragon.playAnimation('idle');
        });

        // small exchange
        this.cutscene.speak(princess, "Sir Knight! Beware the dragon!", 3);
        this.cutscene.wait(0.5);
        this.cutscene.speak(knight, "I will protect you!", 2);

        // the fight: knight moves to dragon, dragon breathes (scale/pulse), knight attack
        this.cutscene.move(knight, { x: w * 0.6, y: h * 0.55 }, 1.5);
        this.cutscene.animate(knight, 'attack');
        this.cutscene.wait(0.5);
        this.cutscene.animate(dragon, 'roar');

        // final: dragon staggers and exits
        this.cutscene.call(() => {
            // simple tween on dragon to simulate hit reaction
            gsap.to(dragon.sprite.scale, { x: 1.2, y: 1.2, duration: 0.2, yoyo: true, repeat: 3 });
        });
        this.cutscene.move(dragon, { x: w + 300, y: h * 0.35 }, 2);

        // close
        this.cutscene.wait(1);
        this.cutscene.call(() => {
            const end = new PIXI.Text('To be continued...', { fontFamily: 'Serif', fontSize: 36, fill: 0xffffff });
            end.anchor.set(0.5);
            end.x = w / 2; end.y = h * 0.5;
            end.alpha = 0;
            this.container.addChild(end);
            gsap.to(end, { alpha: 1, duration: 1 });
        });

        // start the cutscene
        this.cutscene.play();
    }

    update(delta) {
        // update characters
        this.characters.update(delta);
    }
}
