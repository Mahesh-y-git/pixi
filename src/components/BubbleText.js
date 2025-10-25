import * as PIXI from 'pixi.js';

export class Background {
    constructor(options = {}) {
        this.container = new PIXI.Container();
        this.graphics = new PIXI.Graphics();
        this.sprite = null;
        
        // Default properties
        this.color = options.color !== undefined ? options.color : 0x1099bb;
        this.texture = options.texture || null;
        this.width = options.width || 800;
        this.height = options.height || 600;
        
        this.container.addChild(this.graphics);
        this.render();
    }

    addTo(stage) {
        if (stage && !stage.children.includes(this.container)) {
            stage.addChildAt(this.container, 0); // Add at bottom layer
        }
    }

    removeFrom(stage) {
        if (stage && stage.children.includes(this.container)) {
            stage.removeChild(this.container);
        }
    }

    setColor(color) {
        this.color = color;
        this.texture = null; // Clear texture when setting color
        this.render();
    }

    setTexture(texture) {
        this.texture = texture;
        this.render();
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.render();
    }

    render() {
        // Clear previous content
        this.graphics.clear();
        
        if (this.sprite) {
            this.container.removeChild(this.sprite);
            this.sprite = null;
        }

        if (this.texture) {
            // Use texture/sprite
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.width = this.width;
            this.sprite.height = this.height;
            this.container.addChild(this.sprite);
        } else {
            // Use solid color
            this.graphics.rect(0, 0, this.width, this.height);
            this.graphics.fill(this.color);
        }
    }

    // Gradient background support
    setGradient(topColor, bottomColor) {
        this.graphics.clear();
        
        if (this.sprite) {
            this.container.removeChild(this.sprite);
            this.sprite = null;
        }

        // Create a simple vertical gradient using multiple rectangles
        const steps = 100;
        const stepHeight = this.height / steps;
        
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            const r = Math.round((1 - ratio) * ((topColor >> 16) & 0xFF) + ratio * ((bottomColor >> 16) & 0xFF));
            const g = Math.round((1 - ratio) * ((topColor >> 8) & 0xFF) + ratio * ((bottomColor >> 8) & 0xFF));
            const b = Math.round((1 - ratio) * (topColor & 0xFF) + ratio * (bottomColor & 0xFF));
            
            const color = (r << 16) | (g << 8) | b;
            
            this.graphics.rect(0, i * stepHeight, this.width, stepHeight);
            this.graphics.fill(color);
        }
    }

    // Pattern/tiled background support
    setPattern(texture, scaleX = 1, scaleY = 1) {
        this.graphics.clear();
        
        if (this.sprite) {
            this.container.removeChild(this.sprite);
            this.sprite = null;
        }

        if (!texture) return;

        const tiledSprite = new PIXI.TilingSprite({
            texture: texture,
            width: this.width,
            height: this.height
        });
        
        tiledSprite.tileScale.set(scaleX, scaleY);
        this.sprite = tiledSprite;
        this.container.addChild(this.sprite);
    }

    // Animation support
    scrollTexture(speedX = 0, speedY = 0) {
        if (this.sprite && this.sprite instanceof PIXI.TilingSprite) {
            return {
                update: (delta) => {
                    this.sprite.tilePosition.x += speedX * delta;
                    this.sprite.tilePosition.y += speedY * delta;
                }
            };
        }
        return null;
    }

    // Parallax layers support
    addParallaxLayer(texture, speed = 1, depth = 1) {
        const layer = new PIXI.Sprite(texture);
        layer.width = this.width;
        layer.height = this.height;
        layer.alpha = 0.7 / depth; // Farther layers are more transparent
        
        const layerData = {
            sprite: layer,
            speed: speed,
            depth: depth,
            originalX: 0
        };
        
        this.container.addChild(layer);
        return layerData;
    }

    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.container) {
            this.container.destroy(true);
        }
    }
}
