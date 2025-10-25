import { Character } from './Character';

export class CharacterManager {
    constructor(container) {
        this.container = container;
        this.characters = [];
        this.charactersById = new Map();
    }

    addCharacter(id, spritesheet, startPosition, options = {}) {
        // Check if character with this ID already exists
        if (this.charactersById.has(id)) {
            console.warn(`Character with ID '${id}' already exists. Removing old one.`);
            this.removeCharacter(id);
        }

        // Ensure position has ground level
        const position = {
            x: startPosition.x,
            y: startPosition.y,
            groundY: startPosition.groundY || startPosition.y
        };

        // Create new character with enhanced options
        // Merge position into options for simple graphics mode
        const characterOptions = { ...options, ...position };
        const character = new Character(spritesheet, position, characterOptions);
        character.id = id;

        // Apply legacy options for backward compatibility
        if (options.scale && !options.scale) {
            character.sprite.scale.set(options.scale.x || options.scale, options.scale.y || options.scale);
        }
        if (options.tint !== undefined) {
            character.sprite.tint = options.tint;
        }
        if (options.alpha !== undefined) {
            character.sprite.alpha = options.alpha;
        }
        if (options.rotation !== undefined) {
            character.sprite.rotation = options.rotation;
        }

        // Add to container and tracking arrays
        character.addToScene(this.container);
        this.characters.push(character);
        this.charactersById.set(id, character);

        console.log(`Character '${id}' added to CharacterManager at position (${position.x}, ${position.y}) with ground at ${position.groundY}`);
        return character;
    }

    removeCharacter(id) {
        const character = this.charactersById.get(id);
        if (!character) {
            console.warn(`Character with ID '${id}' not found`);
            return false;
        }

        // Remove from container
        if (character.sprite && this.container.children.includes(character.sprite)) {
            this.container.removeChild(character.sprite);
        }

        // Remove bubble if exists
        if (character._bubble) {
            character._bubble.destroy();
        }

        // Remove from tracking arrays
        const index = this.characters.indexOf(character);
        if (index > -1) {
            this.characters.splice(index, 1);
        }
        this.charactersById.delete(id);

        console.log(`Character '${id}' removed from CharacterManager`);
        return true;
    }

    getCharacter(id) {
        return this.charactersById.get(id);
    }

    hasCharacter(id) {
        return this.charactersById.has(id);
    }

    getAllCharacters() {
        return [...this.characters];
    }

    getCharacterIds() {
        return Array.from(this.charactersById.keys());
    }

    // Find nearest character to a position
    findNearestCharacter(position, maxDistance = Infinity) {
        let nearest = null;
        let bestDistance = maxDistance;

        for (const character of this.characters) {
            const dx = character.sprite.x - position.x;
            const dy = character.sprite.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bestDistance) {
                bestDistance = distance;
                nearest = character;
            }
        }

        return nearest;
    }

    // Move all characters to random positions within bounds
    moveAllToRandomPositions(bounds, duration = 1) {
        this.characters.forEach(character => {
            const randomX = bounds.x + Math.random() * bounds.width;
            const randomY = bounds.y + Math.random() * bounds.height;
            character.moveTo({ x: randomX, y: randomY }, duration);
        });
    }

    // Show bubble for all characters
    showBubbleForAll(text, stage, duration = 2) {
        this.characters.forEach(character => {
            character.showBubble(text, stage, duration);
        });
    }

    // Play animation for all characters
    playAnimationForAll(animationName) {
        this.characters.forEach(character => {
            character.playAnimation(animationName);
        });
    }

    // Set properties for all characters
    setPropertyForAll(property, value) {
        this.characters.forEach(character => {
            if (character.sprite && character.sprite[property] !== undefined) {
                if (typeof value === 'object' && value.x !== undefined && value.y !== undefined) {
                    // Handle vector properties like scale, position
                    character.sprite[property].set(value.x, value.y);
                } else {
                    character.sprite[property] = value;
                }
            }
        });
    }

    // Update all characters (call this in your scene's update method)
    update(delta) {
        this.characters.forEach(character => {
            if (character.update) {
                character.update(delta);
            }
        });
    }

    // Get characters within a certain area
    getCharactersInArea(area) {
        return this.characters.filter(character => {
            const pos = character.sprite.position;
            return pos.x >= area.x && 
                   pos.x <= area.x + area.width &&
                   pos.y >= area.y && 
                   pos.y <= area.y + area.height;
        });
    }

    // Get characters within radius of a point
    getCharactersInRadius(center, radius) {
        return this.characters.filter(character => {
            const dx = character.sprite.x - center.x;
            const dy = character.sprite.y - center.y;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
    }

    // Sort characters by distance from a point (closest first)
    getSortedByDistance(position) {
        return [...this.characters].sort((a, b) => {
            const distA = Math.sqrt(
                Math.pow(a.sprite.x - position.x, 2) + 
                Math.pow(a.sprite.y - position.y, 2)
            );
            const distB = Math.sqrt(
                Math.pow(b.sprite.x - position.x, 2) + 
                Math.pow(b.sprite.y - position.y, 2)
            );
            return distA - distB;
        });
    }

    // Ground level management
    setGroundLevelForAll(groundY) {
        this.characters.forEach(character => {
            character.setGroundLevel(groundY);
        });
    }
    
    snapAllToGround() {
        this.characters.forEach(character => {
            character.snapToGround();
        });
    }

    // Enhanced movement commands
    moveAllTo(positions, animationType = 'walk') {
        if (!Array.isArray(positions)) {
            // Single position for all characters
            this.characters.forEach(character => {
                character.moveTo(positions, null, animationType);
            });
        } else {
            // Individual positions
            this.characters.forEach((character, index) => {
                if (index < positions.length) {
                    character.moveTo(positions[index], null, animationType);
                }
            });
        }
    }

    // Direction control
    setDirectionForAll(direction) {
        this.characters.forEach(character => {
            character.setDirection(direction);
        });
    }
    
    makeAllLookAt(targetPosition) {
        this.characters.forEach(character => {
            character.lookAt(targetPosition);
        });
    }

    // Character formation/grouping
    arrangeInLine(startPos, endPos, animationType = 'walk', stagger = 0.1) {
        const count = this.characters.length;
        if (count === 0) return;

        const deltaX = (endPos.x - startPos.x) / Math.max(count - 1, 1);
        const deltaY = (endPos.groundY || endPos.y || startPos.groundY || startPos.y);

        this.characters.forEach((character, index) => {
            const targetPos = {
                x: startPos.x + deltaX * index,
                y: startPos.y,
                groundY: deltaY
            };
            
            // Stagger the movement for more natural look
            setTimeout(() => {
                character.moveTo(targetPos, null, animationType);
            }, stagger * index * 1000);
        });
    }

    arrangeInCircle(center, radius, animationType = 'walk', stagger = 0.1) {
        const count = this.characters.length;
        if (count === 0) return;

        const angleStep = (2 * Math.PI) / count;

        this.characters.forEach((character, index) => {
            const angle = angleStep * index;
            const targetPos = {
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius,
                groundY: center.groundY || center.y
            };
            
            setTimeout(() => {
                character.moveTo(targetPos, null, animationType);
            }, stagger * index * 1000);
        });
    }
    
    // Formation marching
    marchInFormation(targetPosition, formation = 'line', animationType = 'walk') {
        const positions = this.calculateFormationPositions(targetPosition, formation);
        
        this.characters.forEach((character, index) => {
            if (index < positions.length) {
                character.moveTo(positions[index], null, animationType);
            }
        });
    }
    
    calculateFormationPositions(center, formation) {
        const count = this.characters.length;
        const positions = [];
        
        switch (formation) {
            case 'line':
                const spacing = 60;
                const startX = center.x - ((count - 1) * spacing) / 2;
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: startX + i * spacing,
                        y: center.y,
                        groundY: center.groundY || center.y
                    });
                }
                break;
                
            case 'column':
                const columnSpacing = 80;
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: center.x,
                        y: center.y + i * columnSpacing,
                        groundY: center.groundY || center.y + i * columnSpacing
                    });
                }
                break;
                
            case 'wedge':
                const wedgeSpacing = 50;
                for (let i = 0; i < count; i++) {
                    const row = Math.floor(i / 2);
                    const side = i % 2 === 0 ? -1 : 1;
                    positions.push({
                        x: center.x + (side * row * wedgeSpacing),
                        y: center.y + row * wedgeSpacing,
                        groundY: center.groundY || center.y
                    });
                }
                break;
                
            default:
                // Default to circle
                const radius = 50 + count * 5;
                const angleStep = (2 * Math.PI) / count;
                for (let i = 0; i < count; i++) {
                    const angle = angleStep * i;
                    positions.push({
                        x: center.x + Math.cos(angle) * radius,
                        y: center.y + Math.sin(angle) * radius,
                        groundY: center.groundY || center.y
                    });
                }
        }
        
        return positions;
    }

    // Cleanup
    clear() {
        // Remove all characters
        this.characters.forEach(character => {
            if (character.sprite && this.container.children.includes(character.sprite)) {
                this.container.removeChild(character.sprite);
            }
            if (character._bubble) {
                character._bubble.destroy();
            }
        });

        this.characters.length = 0;
        this.charactersById.clear();
        console.log('All characters cleared from CharacterManager');
    }

    destroy() {
        this.clear();
        this.container = null;
    }
}
