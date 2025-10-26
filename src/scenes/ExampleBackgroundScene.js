import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { AssetLoader } from '../utils/AssetLoader';
import { Background } from '../components/Background';
import { CharacterManager } from '../game/CharacterManager';

export class ExampleBackgroundScene extends Scene {
    constructor(app) {
        super();
        this.app = app;
        this.assetLoader = new AssetLoader();
        this.background = new Background();
        this.characters = new CharacterManager(this.container);
    }

    preload(onComplete) {
        const assets = [
            { name: 'bg', url: 'src/assets/background.json' }
        ];
        
        this.assetLoader.loadAssets(assets, () => {
            this.onAssetsLoaded();
            onComplete && onComplete();
        });
    }

    onAssetsLoaded() {
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        const groundLevel = h * 0.85;

        // ====== USING BACKGROUND JSON FILE ======
        
        // 1. Get the background spritesheet
        const bgSpritesheet = this.assetLoader.getSpriteSheet('bg');
        
        // 2. Use a specific background texture from the JSON
        if (bgSpritesheet && bgSpritesheet.textures) {
            // Available backgrounds from background.json: castle_bg, forest_bg, mountain_bg
            const castleTexture = bgSpritesheet.textures['cloud1'];
            
            if (castleTexture) {
                this.background.setTexture(castleTexture);
            } else {
                // Fallback to gradient if texture not found
                this.background.setGradient(0x87CEEB, 0xE0F6FF);
            }
        } else {
            // Fallback background
            this.background.setGradient(0x87CEEB, 0xE0F6FF);
        }

        // 3. Add background to scene and set ground level
        this.background.addTo(this.container);
        this.background.resize(w, h);
        this.background.setGroundLevel(groundLevel);

        // ====== ADDING ITEMS TO BACKGROUND ======
        
        // Method 1: Using background textures as decorations
        this.addBackgroundDecorations(bgSpritesheet, w, h, groundLevel);
        
        // Method 2: Creating simple graphic elements
      //  this.addSimpleBackgroundItems(w, h, groundLevel);
        
        // Method 3: Adding parallax layers for depth
      //  this.addParallaxLayers(bgSpritesheet, w, h);
        
        // Method 4: Adding foreground elements
       // this.addForegroundElements(w, h, groundLevel);
        
        // Method 5: Adding animated background elements
      //  this.addAnimatedBackgroundItems(w, h, groundLevel);

        // Add a character for reference
        

        // Setup interactions
        this.setupInteractions(w, h, groundLevel);
    }

    // Method 1: Using textures from background JSON
    addBackgroundDecorations(bgSpritesheet, w, h, groundLevel) {
        if (!bgSpritesheet || !bgSpritesheet.textures) return;

        // Example: Add smaller background elements as decorations
        const textures = Object.keys(bgSpritesheet.textures);
        
        textures.forEach((textureName, index) => {
            const texture = bgSpritesheet.textures[textureName];
            
            // Add small decorative elements at different positions
            this.background.addDecoration(texture, 
                (w / (textures.length + 1)) * (index + 1), // Spread across width
                h * 0.2, // Upper part of screen
                {
                    scale: 0.3, // Make them smaller
                    alpha: 0.6, // Semi-transparent
                    anchor: { x: 0.5, y: 0.5 }
                }
            );
        });
    }

    // Method 2: Creating simple graphic elements
    addSimpleBackgroundItems(w, h, groundLevel) {
        // Add trees using simple graphics
        for (let i = 0; i < 5; i++) {
            const tree = this.createTree();
            const x = (w / 6) * (i + 1) + (Math.random() - 0.5) * 100;
            tree.position.set(x, groundLevel);
            this.container.addChild(tree);
        }

        // Add rocks
        for (let i = 0; i < 3; i++) {
            const rock = this.createRock();
            const x = Math.random() * w;
            rock.position.set(x, groundLevel - rock.height/2);
            this.container.addChild(rock);
        }

        // Add clouds
        for (let i = 0; i < 4; i++) {
            const cloud = this.createCloud();
            const x = Math.random() * w;
            const y = h * 0.1 + Math.random() * (h * 0.3);
            cloud.position.set(x, y);
            this.container.addChild(cloud);
        }
    }

    // Method 3: Adding parallax layers
    addParallaxLayers(bgSpritesheet, w, h) {
        if (!bgSpritesheet || !bgSpritesheet.textures) return;

        const textures = Object.values(bgSpritesheet.textures);
        
        // Add background layers with different speeds and depths
        textures.forEach((texture, index) => {
            this.background.addParallaxLayer(texture, {
                speed: 0.3 + index * 0.2, // Different speeds
                depth: 2 + index,         // Different depths
                alpha: 0.4 + index * 0.2, // Different transparency
                scaleY: 0.8,              // Slightly squashed
                offsetY: h * 0.1,         // Offset from top
                tiling: true              // Make it tileable
            });
        });
    }

    // Method 4: Adding foreground elements
    addForegroundElements(w, h, groundLevel) {
        // Add bushes in foreground
        for (let i = 0; i < 3; i++) {
            const bush = this.createBush();
            const x = Math.random() * w;
            this.background.addForegroundElement(
                bush.texture, 
                x, 
                groundLevel + 10, // Slightly below ground
                0.8 + Math.random() * 0.4 // Random scale
            );
        }
    }

    // Method 5: Adding animated elements
    addAnimatedBackgroundItems(w, h, groundLevel) {
        // Add animated birds
        for (let i = 0; i < 2; i++) {
            const bird = this.createBird();
            bird.position.set(-50, h * 0.3 + Math.random() * (h * 0.2));
            this.container.addChild(bird);
            
            // Animate bird flying across screen
            gsap.to(bird.position, {
                x: w + 50,
                duration: 15 + Math.random() * 10,
                repeat: -1,
                delay: i * 5,
                ease: "none"
            });
            
            // Add slight up-down movement
            gsap.to(bird.position, {
                y: bird.y + 20,
                duration: 3,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });
        }

        // Add swaying grass
        this.addSwayingGrass(w, groundLevel);
    }

    // Helper methods to create simple graphics
    createTree() {
        const tree = new PIXI.Container();
        
        // Trunk
        const trunk = new PIXI.Graphics();
        trunk.beginFill(0x8B4513); // Brown
        trunk.drawRect(-8, -60, 16, 60);
        trunk.endFill();
        
        // Leaves
        const leaves = new PIXI.Graphics();
        leaves.beginFill(0x228B22); // Green
        leaves.drawCircle(0, -80, 30);
        leaves.drawCircle(-20, -70, 25);
        leaves.drawCircle(20, -70, 25);
        leaves.endFill();
        
        tree.addChild(trunk);
        tree.addChild(leaves);
        return tree;
    }

    createRock() {
        const rock = new PIXI.Graphics();
        rock.beginFill(0x696969); // Gray
        rock.drawEllipse(0, 0, 20 + Math.random() * 15, 15 + Math.random() * 10);
        rock.endFill();
        return rock;
    }

    createCloud() {
        const cloud = new PIXI.Graphics();
        cloud.beginFill(0xFFFFFF, 0.8);
        cloud.drawCircle(0, 0, 20 + Math.random() * 10);
        cloud.drawCircle(15, 0, 18 + Math.random() * 8);
        cloud.drawCircle(-15, 0, 15 + Math.random() * 8);
        cloud.endFill();
        return cloud;
    }

    createBush() {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(10, 15, 8, 0, Math.PI * 2);
        ctx.arc(20, 15, 10, 0, Math.PI * 2);
        ctx.arc(30, 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        return { texture: PIXI.Texture.from(canvas) };
    }

    createBird() {
        const bird = new PIXI.Graphics();
        bird.lineStyle(2, 0x000000);
        bird.moveTo(-5, 0);
        bird.lineTo(0, -3);
        bird.lineTo(5, 0);
        bird.moveTo(-5, 0);
        bird.lineTo(0, 3);
        bird.lineTo(5, 0);
        return bird;
    }

    addSwayingGrass(w, groundLevel) {
        for (let i = 0; i < 20; i++) {
            const grass = new PIXI.Graphics();
            grass.lineStyle(2, 0x32CD32);
            grass.moveTo(0, 0);
            grass.lineTo(2, -15 - Math.random() * 10);
            
            grass.position.set(Math.random() * w, groundLevel);
            this.container.addChild(grass);
            
            // Sway animation
            gsap.to(grass, {
                rotation: 0.1,
                duration: 2 + Math.random() * 2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                delay: Math.random() * 2
            });
        }
    }

    setupInteractions(w, h, groundLevel) {
        this.app.stage.interactive = true;
        this.app.stage.on('pointerdown', (event) => {
            const pos = event.data.global;
            
            // Move character to clicked position
            const character = this.characters.getCharacter('hero');
            if (character) {
                character.moveTo({
                    x: pos.x,
                    y: groundLevel,
                    groundY: groundLevel
                });
            }
            
            // Add a small effect at click position
            this.addClickEffect(pos.x, pos.y);
        });
    }

    addClickEffect(x, y) {
        const effect = new PIXI.Graphics();
        effect.beginFill(0xFFD700, 0.8);
        effect.drawCircle(0, 0, 5);
        effect.endFill();
        effect.position.set(x, y);
        this.container.addChild(effect);
        
        // Animate effect
        gsap.to(effect.scale, {
            x: 3,
            y: 3,
            duration: 0.5,
            ease: "power2.out"
        });
        
        gsap.to(effect, {
            alpha: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                this.container.removeChild(effect);
                effect.destroy();
            }
        });
    }

    update(delta) {
        this.characters.update(delta);
        
        // Update parallax if camera moves
        if (this.background.updateParallax) {
            this.background.updateParallax(0);
        }
    }
}
