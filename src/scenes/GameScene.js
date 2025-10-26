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
        this.background = new Background({ color: 0x000000 });
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
        // Set up background
        this.background.addTo(this.container);
        this.background.resize(this.app.screen.width, this.app.screen.height);
        
        // Try to use background from spritesheet
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        const groundLevel = h * 0.85;

        // Create characters using spritesheets
        const characterSS = this.assetLoader.getSpriteSheet('character');
        const characterPositions = [
            { x: w * 0.25, y: groundLevel, groundY: groundLevel, direction: 'right', scale: 1.0 },
            { x: w * 0.5, y: groundLevel, groundY: groundLevel, direction: 'left', scale: 1.1 },
            { x: w * 0.75, y: groundLevel, groundY: groundLevel, direction: 'right', scale: 0.9 }
        ];

        characterPositions.forEach((pos, i) => {
            const id = `char-${i+1}`;
            const options = {
                direction: pos.direction,
                scale: pos.scale
            };
            
            const character = this.characters.addCharacter(id, characterSS, pos, options);
            
            // Add some personality with random idle behaviors
            this.setupCharacterBehaviors(character, i);
        });

        // Enhanced interaction system
        this.setupInteractions();

        // Respond to resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        console.log('GameScene loaded with asset-based background');
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
        const groundY = this.background.getGroundLevel() || this.app.screen.height * 0.85;
        
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
        
        const groundY = this.background.getGroundLevel() || this.app.screen.height * 0.85;
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
    
    handleResize() {
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        
        this.background.resize(w, h);
        const newGroundLevel = this.background.getGroundLevel() || h * 0.85;
        
        this.characters.setGroundLevelForAll(newGroundLevel);
        this.characters.snapAllToGround();
    }

    update(delta) {
        // Update characters with physics and animations
        this.characters.update(delta);
        
        // Update background if it has parallax or animations
        if (this.background.updateParallax) {
            this.background.updateParallax(0);
        }
    }
}
