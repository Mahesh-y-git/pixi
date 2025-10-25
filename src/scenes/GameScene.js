import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
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
        // No longer create own background - will use centralized one
        this.characters = new CharacterManager(this.container);
        this.usesCentralizedBackground = true;
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
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        const groundLevel = h * 0.85; // Ground at 85% down the screen
        
        // Since we're using centralized background, just get the ground level from it
        // The background is already set up in main.js

        const characterSpritesheet = this.assetLoader.getSpriteSheet('character');

        // Create 3 characters on the ground with proper positioning
        const characterPositions = [
            { 
                x: w * 0.25, 
                y: groundLevel, 
                groundY: groundLevel,
                direction: 'right',
                scale: 1.0
            },
            { 
                x: w * 0.5, 
                y: groundLevel, 
                groundY: groundLevel,
                direction: 'left',
                scale: 1.1
            },
            { 
                x: w * 0.75, 
                y: groundLevel, 
                groundY: groundLevel,
                direction: 'right',
                scale: 0.9
            }
        ];

        characterPositions.forEach((pos, i) => {
            const id = `char-${i+1}`;
            const options = {
                direction: pos.direction,
                scale: pos.scale,
                animationSpeeds: {
                    idle: 0.08 + i * 0.02,
                    walk: 0.12 + i * 0.02,
                    run: 0.20 + i * 0.02
                }
            };
            
            const character = this.characters.addCharacter(id, characterSpritesheet, pos, options);
            
            // Add some personality with random idle behaviors
            this.setupCharacterBehaviors(character, i);
        });

        // Enhanced interaction system
        this.setupInteractions();

        // Respond to resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Since background is centralized, we don't start ambient animations here
        console.log('GameScene loaded with centralized background management');
    }
    
    // Called when centralized background changes
    onBackgroundChanged(backgroundType) {
        console.log(`GameScene received background change: ${backgroundType}`);
        
        // Adjust character behavior based on background
        switch(backgroundType) {
            case 'forest':
                this.characters.setPropertyForAll('tint', 0xFFFFFF);
                break;
            case 'castle':
                this.characters.setPropertyForAll('tint', 0xF0F0F0);
                break;
            case 'mountain':
                this.characters.setPropertyForAll('tint', 0xE0E0E0);
                break;
        }
    }
    
    addBackgroundElements(w, h, groundLevel) {
        // ===== USING BACKGROUND JSON FILE =====
        
        // Try to get background textures from JSON file
        const bgSpritesheet = this.assetLoader.getSpriteSheet('bg');
        
        if (bgSpritesheet && bgSpritesheet.textures) {
            console.log('Available background textures:', Object.keys(bgSpritesheet.textures));
            
            // Use forest background if available
            const forestBg = bgSpritesheet.textures['forest_bg'];
            if (forestBg) {
                this.background.setTexture(forestBg);
                console.log('Using forest background from JSON');
            } else {
                // Fallback to gradient
                this.background.setGradient(0x87CEEB, 0xE0F6FF);
            }
        } else {
            // Fallback to gradient if no background textures
            this.background.setGradient(0x87CEEB, 0xE0F6FF);
        }
        
        // ===== ADD DECORATIVE ITEMS =====
        
        // Add trees at fixed positions
        this.addTrees(w, h, groundLevel);
        
        // Add rocks scattered around
        this.addRocks(w, h, groundLevel);
        
        // Add sun
        this.addSun(w, h);
        
        // Add clouds
        this.addClouds(w, h);
        
        // Add ground texture overlay
        this.addGroundOverlay(w, h, groundLevel);
    }
    
    addTrees(w, h, groundLevel) {
        const treePositions = [
            { x: w * 0.1, scale: 1.0 },
            { x: w * 0.25, scale: 0.8 },
            { x: w * 0.85, scale: 1.2 },
            { x: w * 0.92, scale: 0.9 }
        ];
        
        treePositions.forEach(pos => {
            const tree = new PIXI.Container();
            
            // Trunk
            const trunk = new PIXI.Graphics();
            trunk.beginFill(0x8B4513); // Brown
            trunk.drawRect(-8, -60, 16, 60);
            trunk.endFill();
            
            // Leaves (multiple circles for fuller look)
            const leaves = new PIXI.Graphics();
            leaves.beginFill(0x228B22); // Green
            leaves.drawCircle(0, -70, 25);
            leaves.drawCircle(-15, -65, 20);
            leaves.drawCircle(15, -65, 20);
            leaves.drawCircle(0, -85, 18);
            leaves.endFill();
            
            tree.addChild(trunk);
            tree.addChild(leaves);
            tree.position.set(pos.x, groundLevel);
            tree.scale.set(pos.scale);
            
            this.container.addChild(tree);
        });
    }
    
    addRocks(w, h, groundLevel) {
        for (let i = 0; i < 6; i++) {
            const rock = new PIXI.Graphics();
            rock.beginFill(0x696969); // Gray
            
            const width = 15 + Math.random() * 25;
            const height = 10 + Math.random() * 15;
            rock.drawEllipse(0, 0, width, height);
            rock.endFill();
            
            rock.position.set(
                Math.random() * w,
                groundLevel - height/2 + Math.random() * 10
            );
            
            this.container.addChild(rock);
        }
    }
    
    addSun(w, h) {
        const sun = new PIXI.Graphics();
        sun.beginFill(0xFFD700); // Gold
        sun.drawCircle(0, 0, 30);
        sun.endFill();
        
        // Add sun rays
        sun.lineStyle(3, 0xFFD700);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = Math.cos(angle) * 35;
            const y1 = Math.sin(angle) * 35;
            const x2 = Math.cos(angle) * 50;
            const y2 = Math.sin(angle) * 50;
            sun.moveTo(x1, y1);
            sun.lineTo(x2, y2);
        }
        
        sun.position.set(w * 0.85, h * 0.15);
        this.container.addChild(sun);
        
        // Animate sun rotation
        gsap.to(sun, {
            rotation: Math.PI * 2,
            duration: 20,
            repeat: -1,
            ease: "none"
        });
    }
    
    addClouds(w, h) {
        const cloudPositions = [
            { x: w * 0.2, y: h * 0.2 },
            { x: w * 0.6, y: h * 0.15 },
            { x: w * 0.8, y: h * 0.25 }
        ];
        
        cloudPositions.forEach((pos, i) => {
            const cloud = new PIXI.Graphics();
            cloud.beginFill(0xFFFFFF, 0.9);
            
            // Create fluffy cloud shape
            const baseSize = 25 + Math.random() * 15;
            cloud.drawCircle(0, 0, baseSize);
            cloud.drawCircle(baseSize * 0.8, 0, baseSize * 0.8);
            cloud.drawCircle(-baseSize * 0.8, 0, baseSize * 0.6);
            cloud.drawCircle(0, -baseSize * 0.5, baseSize * 0.7);
            
            cloud.endFill();
            cloud.position.set(pos.x, pos.y);
            
            this.container.addChild(cloud);
            
            // Animate clouds slowly drifting
            gsap.to(cloud.position, {
                x: cloud.x + 50,
                duration: 30 + i * 10,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });
    }
    
    addGroundOverlay(w, h, groundLevel) {
        // Add grass texture overlay
        const ground = new PIXI.Graphics();
        ground.beginFill(0x228B22, 0.3); // Semi-transparent green
        ground.drawRect(0, groundLevel, w, h - groundLevel);
        ground.endFill();
        
        // Add some grass blades
        for (let i = 0; i < 30; i++) {
            const grass = new PIXI.Graphics();
            grass.lineStyle(2, 0x32CD32);
            grass.moveTo(0, 0);
            grass.lineTo(1 + Math.random() * 2, -8 - Math.random() * 12);
            
            grass.position.set(Math.random() * w, groundLevel);
            ground.addChild(grass);
        }
        
        this.container.addChildAt(ground, 1); // Behind characters
    }
    
    setupCharacterBehaviors(character, index) {
        // Random idle behaviors for more life-like characters
        const behaviors = ['wave', 'look_around', 'stretch'];
        
        setInterval(() => {
            if (character.isIdle && !character.isMoving) {
                const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
                
                switch (randomBehavior) {
                    case 'wave':
                        character.showBubble('Hello there!', this.container, 1.5);
                        break;
                    case 'look_around':
                        character.flipDirection();
                        setTimeout(() => character.flipDirection(), 1000);
                        break;
                    case 'stretch':
                        // Could trigger a stretch animation if available
                        character.showBubble('*stretches*', this.container, 1);
                        break;
                }
            }
        }, 8000 + index * 2000); // Stagger behaviors
    }
    
    setupInteractions() {
        this.app.stage.interactive = true;
        this.app.stage.on('pointerdown', (event) => {
            this.handlePointerDown(event);
        });
        
        // Add keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
    }
    
    handlePointerDown(event) {
        const pos = event.data.global;
        const groundY = this.background.getGroundLevel();
        
        // Adjust click position to ground level
        const targetPosition = {
            x: pos.x,
            y: groundY,
            groundY: groundY
        };
        
        // Find nearest character
        const nearest = this.characters.findNearestCharacter(pos);
        
        if (nearest) {
            // Determine movement type based on distance
            const distance = nearest.distanceTo({ sprite: { x: pos.x, y: pos.y } });
            const movementType = distance > 200 ? 'run' : 'walk';
            
            // Move character and show appropriate bubble
            nearest.moveTo(targetPosition, null, movementType);
            
            const messages = [
                'On my way!', 'Coming!', 'Moving out!', 'Roger that!', 'Let\'s go!'
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            nearest.showBubble(randomMessage, this.container, 2);
        }
    }
    
    handleKeyDown(event) {
        const chars = this.characters.getAllCharacters();
        if (chars.length === 0) return;
        
        const groundY = this.background.getGroundLevel();
        const centerX = this.app.screen.width / 2;
        
        switch (event.key.toLowerCase()) {
            case 'l': // Line formation
                this.characters.arrangeInLine(
                    { x: centerX - 150, y: groundY, groundY },
                    { x: centerX + 150, y: groundY, groundY },
                    'walk', 0.2
                );
                break;
                
            case 'c': // Circle formation
                this.characters.arrangeInCircle(
                    { x: centerX, y: groundY, groundY },
                    100, 'walk', 0.15
                );
                break;
                
            case 'r': // Make all run to center
                this.characters.moveAllTo(
                    { x: centerX, y: groundY, groundY },
                    'run'
                );
                break;
                
            case 'f': // Flip all directions
                this.characters.setDirectionForAll(
                    chars[0].direction === 'left' ? 'right' : 'left'
                );
                break;
                
            case 'a': // Attack animation for all
                chars.forEach(char => char.attack());
                break;
        }
    }
    
    startAmbientAnimations() {
        // Add subtle background animations
        // Animate clouds slowly
        const clouds = this.container.children.filter(child => 
            child instanceof PIXI.Graphics && child.x < this.app.screen.width
        );
        
        clouds.forEach((cloud, index) => {
            gsap.to(cloud, {
                x: cloud.x + 20,
                duration: 30 + index * 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });
    }
    
    handleResize() {
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        const newGroundLevel = h * 0.85;
        
        this.background.resize(w, h);
        this.background.setGroundLevel(newGroundLevel);
        this.characters.setGroundLevelForAll(newGroundLevel);
        this.characters.snapAllToGround();
    }

    update(delta) {
        // Update characters with physics and animations
        this.characters.update(delta);
        
        // Update background parallax if implemented
        if (this.background.updateParallax) {
            this.background.updateParallax(0); // No camera movement for now
        }
        
        // Update any weather effects
        if (this.weatherEffect && this.weatherEffect.update) {
            this.weatherEffect.update(delta);
        }
    }
}
