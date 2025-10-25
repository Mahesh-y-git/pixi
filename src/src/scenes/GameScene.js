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
        // Setup background with ground level
        this.background.addTo(this.container);
        this.background.resize(this.app.screen.width, this.app.screen.height);
        
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        const groundLevel = h * 0.85; // Ground at 85% down the screen
        
        // Set up ground level in background
        this.background.setGroundLevel(groundLevel);
        
        // Add some background elements for depth
        // You can replace these with actual textures when you have them
        this.addBackgroundElements(w, h, groundLevel);

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
        
        // Start some ambient animations
        this.startAmbientAnimations();
    }
    
    addBackgroundElements(w, h, groundLevel) {
        // Create simple background elements (replace with actual assets)
        // Sky gradient
        this.background.setGradient(0x87CEEB, 0xE0F6FF); // Sky blue gradient
        
        // Add some "clouds" (simple white circles)
        for (let i = 0; i < 3; i++) {
            const cloud = new PIXI.Graphics();
            cloud.beginFill(0xFFFFFF, 0.8);
            cloud.drawCircle(0, 0, 30 + Math.random() * 20);
            cloud.drawCircle(25, 0, 25 + Math.random() * 15);
            cloud.drawCircle(-25, 0, 20 + Math.random() * 10);
            cloud.endFill();
            
            cloud.x = (w / 4) * (i + 1);
            cloud.y = h * 0.2 + Math.random() * (h * 0.2);
            
            this.container.addChild(cloud);
        }
        
        // Add ground texture (simple grass-colored rectangle)
        const ground = new PIXI.Graphics();
        ground.beginFill(0x228B22); // Forest green
        ground.drawRect(0, groundLevel, w, h - groundLevel);
        ground.endFill();
        this.container.addChildAt(ground, 1); // Behind characters but above background
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
