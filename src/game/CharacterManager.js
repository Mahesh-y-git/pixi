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

        // Create new character
        const character = new Character(spritesheet, startPosition);
        character.id = id;

        // Apply additional options
        if (options.scale) {
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
        if (options.animationSpeed !== undefined) {
            character.sprite.animationSpeed = options.animationSpeed;
        }

        // Add to container and tracking arrays
        character.addToScene(this.container);
        this.characters.push(character);
        this.charactersById.set(id, character);

        console.log(`Character '${id}' added to CharacterManager`);
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

    // Character formation/grouping
    arrangeInLine(startPos, endPos, spacing = 50) {
        const count = this.characters.length;
        if (count === 0) return;

        const deltaX = (endPos.x - startPos.x) / Math.max(count - 1, 1);
        const deltaY = (endPos.y - startPos.y) / Math.max(count - 1, 1);

        this.characters.forEach((character, index) => {
            const targetPos = {
                x: startPos.x + deltaX * index,
                y: startPos.y + deltaY * index
            };
            character.moveTo(targetPos, 1);
        });
    }

    arrangeInCircle(center, radius) {
        const count = this.characters.length;
        if (count === 0) return;

        const angleStep = (2 * Math.PI) / count;

        this.characters.forEach((character, index) => {
            const angle = angleStep * index;
            const targetPos = {
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius
            };
            character.moveTo(targetPos, 1);
        });
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
