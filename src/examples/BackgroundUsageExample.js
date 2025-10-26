import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { AssetLoader } from '../utils/AssetLoader';
import { Background } from '../components/Background';

/**
 * A self-contained, reusable component for creating a dynamic, animated background.
 * It loads a single JSON spritesheet and uses its textures to build a rich scene
 * with parallax effects, animations, and neatly arranged elements.
 *
 * @example
 * // In your scene's preload or constructor:
 * const dynamicBackground = new DynamicBackground({
 *     width: this.app.screen.width,
 *     height: this.app.screen.height,
 *     assetUrl: 'assets/spritesheets/your_background.json'
 * });
 * this.container.addChild(dynamicBackground);
 * await dynamicBackground.load();
 * 
 * // In your scene's update loop:
 * dynamicBackground.update(delta);
 */
export class DynamicBackground extends PIXI.Container {
    constructor(options = {}) {
        super();
        this.options = {
            width: 800,
            height: 600,
            assetUrl: 'assets/spritesheets/background.json', // Default asset
            ...options
        };

        this.screenWidth = this.options.width;
        this.screenHeight = this.options.height;
        this.groundLevel = this.screenHeight * 0.85;

        this.assetLoader = new AssetLoader();
        this.background = new Background();
        this.addChild(this.background);

        this.spritesheet = null;
    }

    /**
     * Loads the background assets and builds the scene.
     * @returns {Promise<void>} A promise that resolves when the background is ready.
     */
    async load() {
        return new Promise((resolve) => {
            this.assetLoader.loadAssets([{ name: 'dynamic_bg', url: this.options.assetUrl }], () => {
                this.onAssetsLoaded();
                resolve();
            });
        });
    }

    onAssetsLoaded() {
        this.spritesheet = this.assetLoader.getSpriteSheet('dynamic_bg');
        if (!this.spritesheet || !this.spritesheet.textures) {
            console.warn(`DynamicBackground: Spritesheet not found or empty at ${this.options.assetUrl}. Creating fallback.`);
            this.createFallbackBackground();
            return;
        }

        // 1. Set the main background texture
        this.setupMainBackground();

        // 2. Add parallax layers for depth
        this.addParallaxLayers();

        // 3. Add static decorations like houses and large trees
        this.addDecorations();

        // 4. Add animated elements like clouds and birds
        this.addAnimatedElements();
        
        // 5. Add foreground elements for a sense of depth
        this.addForegroundElements();

        // Resize to fit the screen
        this.background.resize(this.screenWidth, this.screenHeight);
        this.background.setGroundLevel(this.groundLevel);
    }

    setupMainBackground() {
        // Use a texture named 'sky' or 'main_bg' or the first one as the main background
        const mainBgTexture = this.spritesheet.textures['sky'] || this.spritesheet.textures['main_bg'] || Object.values(this.spritesheet.textures)[0];
        if (mainBgTexture) {
            this.background.setTexture(mainBgTexture);
        } else {
            this.background.setGradient(0x87CEEB, 0xE0F6FF); // Fallback gradient
        }
    }

    addParallaxLayers() {
        // Look for textures with 'parallax', 'cloud', or 'mountain' in their name
        const parallaxTextures = this.getTexturesByKeyword(['parallax', 'mountain', 'far_hills']);
        
        parallaxTextures.forEach((texture, index) => {
            this.background.addParallaxLayer(texture, {
                speed: 0.1 + index * 0.1,
                depth: 1 + index,
                alpha: 0.5 + index * 0.15,
                offsetY: this.screenHeight * (0.1 + index * 0.05),
                tiling: true
            });
        });
    }

    addDecorations() {
        // Add houses, big trees, etc.
        const houseTextures = this.getTexturesByKeyword(['house', 'building', 'castle']);
        houseTextures.forEach((texture, i) => {
            const scale = 0.8 + Math.random() * 0.4;
            const decoration = new PIXI.Sprite(texture);
            decoration.anchor.set(0.5, 1);
            decoration.scale.set(scale);
            decoration.position.set(this.screenWidth * (0.2 + i * 0.3), this.groundLevel);
            this.addChild(decoration);
        });

        const treeTextures = this.getTexturesByKeyword(['tree', 'pine']);
        for (let i = 0; i < 5; i++) {
            const texture = treeTextures[i % treeTextures.length];
            if (!texture) continue;
            const tree = new PIXI.Sprite(texture);
            tree.anchor.set(0.5, 1);
            tree.scale.set(0.7 + Math.random() * 0.3);
            tree.position.set(Math.random() * this.screenWidth, this.groundLevel);
            tree.zIndex = this.groundLevel - tree.y;
            this.addChild(tree);
        }
    }

    addAnimatedElements() {
        // Animate clouds
        const cloudTextures = this.getTexturesByKeyword(['cloud']);
        cloudTextures.forEach((texture, i) => {
            const cloud = new PIXI.Sprite(texture);
            cloud.anchor.set(0.5);
            cloud.scale.set(0.5 + Math.random() * 0.5);
            cloud.alpha = 0.7 + Math.random() * 0.3;
            cloud.position.set(Math.random() * this.screenWidth, this.screenHeight * (0.1 + Math.random() * 0.2));
            this.addChild(cloud);

            gsap.to(cloud.position, {
                x: this.screenWidth + cloud.width,
                duration: 50 + Math.random() * 30,
                repeat: -1,
                ease: 'none',
                delay: i * 5,
                onRepeat: () => {
                    cloud.position.x = -cloud.width;
                    cloud.position.y = this.screenHeight * (0.1 + Math.random() * 0.2);
                }
            });
        });

        // Animate birds from a spritesheet animation
        const birdAnimation = this.spritesheet.animations ? (this.spritesheet.animations['bird_fly'] || this.spritesheet.animations['bird']) : null;
        if (birdAnimation) {
            for (let i = 0; i < 3; i++) {
                const bird = new PIXI.AnimatedSprite(birdAnimation);
                bird.animationSpeed = 0.2;
                bird.play();
                bird.anchor.set(0.5);
                bird.scale.set(0.8 + Math.random() * 0.4);
                bird.position.set(-100, this.screenHeight * (0.2 + Math.random() * 0.3));
                this.addChild(bird);

                gsap.to(bird.position, {
                    x: this.screenWidth + 100,
                    duration: 20 + Math.random() * 15,
                    repeat: -1,
                    delay: i * 7,
                    ease: 'none'
                });
            }
        }
    }
    
    addForegroundElements() {
        const foregroundTextures = this.getTexturesByKeyword(['bush', 'rock', 'grass']);
        for (let i = 0; i < 10; i++) {
            const texture = foregroundTextures[i % foregroundTextures.length];
            if (!texture) continue;
            
            const element = new PIXI.Sprite(texture);
            element.anchor.set(0.5, 1);
            element.scale.set(0.9 + Math.random() * 0.3);
            element.position.set(Math.random() * this.screenWidth, this.groundLevel + 10 + Math.random() * 20);
            element.zIndex = 999; // Ensure it's in front
            this.addChild(element);
        }
    }

    /**
     * Finds textures in the spritesheet that include any of the given keywords.
     * @param {string[]} keywords - An array of keywords to search for.
     * @returns {PIXI.Texture[]} An array of matching textures.
     */
    getTexturesByKeyword(keywords) {
        if (!this.spritesheet || !this.spritesheet.textures) return [];
        const textures = [];
        for (const key in this.spritesheet.textures) {
            if (keywords.some(keyword => key.includes(keyword))) {
                textures.push(this.spritesheet.textures[key]);
            }
        }
        return textures;
    }
    
    createFallbackBackground() {
        this.background.setGradient(0x87CEEB, 0xE0F6FF);
        this.background.resize(this.screenWidth, this.screenHeight);
        this.background.setGroundLevel(this.groundLevel);

        // Add simple clouds
        for (let i = 0; i < 4; i++) {
            const cloud = this.createCloud();
            cloud.position.set(Math.random() * this.screenWidth, this.screenHeight * (0.1 + Math.random() * 0.3));
            this.addChild(cloud);
        }
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

    update(delta) {
        // This method can be called from the main game loop to update animations.
        if (this.background.updateParallax) {
            // The argument to updateParallax would typically be camera movement speed.
            // For now, we can simulate a slow scroll.
            this.background.updateParallax(0.2);
        }
    }
}
