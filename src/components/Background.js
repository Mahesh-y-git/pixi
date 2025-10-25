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

    // Ground level system
    setGroundLevel(groundY) {
        this.groundLevel = groundY;
        this.drawGroundLine();
    }
    
    drawGroundLine(color = 0x8B4513, thickness = 2) {
        if (!this.groundLevel) return;
        
        if (!this.groundLine) {
            this.groundLine = new PIXI.Graphics();
            this.container.addChild(this.groundLine);
        }
        
        this.groundLine.clear();
        this.groundLine.moveTo(0, this.groundLevel);
        this.groundLine.lineTo(this.width, this.groundLevel);
        this.groundLine.stroke({ color: color, width: thickness });
    }
    
    getGroundLevel() {
        return this.groundLevel || this.height * 0.8; // Default to 80% down
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

    // Enhanced parallax layers support
    addParallaxLayer(texture, options = {}) {
        const {
            speed = 1,
            depth = 1,
            alpha = 0.7 / depth,
            scaleX = 1,
            scaleY = 1,
            offsetY = 0,
            tiling = false
        } = options;
        
        let layer;
        if (tiling) {
            layer = new PIXI.TilingSprite({
                texture: texture,
                width: this.width,
                height: this.height
            });
        } else {
            layer = new PIXI.Sprite(texture);
            layer.width = this.width * scaleX;
            layer.height = this.height * scaleY;
        }
        
        layer.alpha = alpha;
        layer.y = offsetY;
        
        const layerData = {
            sprite: layer,
            speed: speed,
            depth: depth,
            originalX: 0,
            tiling: tiling
        };
        
        this.container.addChild(layer);
        this.parallaxLayers = this.parallaxLayers || [];
        this.parallaxLayers.push(layerData);
        
        return layerData;
    }
    
    // Update parallax layers (call this in your scene's update method)
    updateParallax(cameraX = 0) {
        if (!this.parallaxLayers) return;
        
        this.parallaxLayers.forEach(layer => {
            const parallaxOffset = cameraX * (1 - 1 / layer.depth) * layer.speed;
            layer.sprite.x = layer.originalX - parallaxOffset;
        });
    }
    
    // Add foreground elements (trees, rocks, etc.)
    addForegroundElement(texture, x, y, scale = 1) {
        const element = new PIXI.Sprite(texture);
        element.anchor.set(0.5, 1); // Bottom center anchor
        element.position.set(x, y);
        element.scale.set(scale);
        
        if (!this.foregroundElements) {
            this.foregroundElements = new PIXI.Container();
            this.container.addChild(this.foregroundElements);
        }
        
        this.foregroundElements.addChild(element);
        return element;
    }
    
    // Add background decorations
    addDecoration(texture, x, y, options = {}) {
        const {
            scale = 1,
            alpha = 1,
            tint = 0xFFFFFF,
            rotation = 0,
            anchor = { x: 0.5, y: 0.5 }
        } = options;
        
        const decoration = new PIXI.Sprite(texture);
        decoration.anchor.set(anchor.x, anchor.y);
        decoration.position.set(x, y);
        decoration.scale.set(scale);
        decoration.alpha = alpha;
        decoration.tint = tint;
        decoration.rotation = rotation;
        
        if (!this.decorations) {
            this.decorations = new PIXI.Container();
            this.container.addChild(this.decorations);
        }
        
        this.decorations.addChild(decoration);
        return decoration;
    }

    // Weather effects
    addRain(intensity = 1) {
        if (this.rainContainer) {
            this.container.removeChild(this.rainContainer);
        }
        
        this.rainContainer = new PIXI.Container();
        const raindrops = [];
        
        for (let i = 0; i < 100 * intensity; i++) {
            const drop = new PIXI.Graphics();
            drop.moveTo(0, 0);
            drop.lineTo(2, 15);
            drop.stroke({ color: 0x87CEEB, width: 1, alpha: 0.6 });
            
            drop.x = Math.random() * this.width;
            drop.y = Math.random() * this.height;
            drop.speed = 5 + Math.random() * 5;
            
            raindrops.push(drop);
            this.rainContainer.addChild(drop);
        }
        
        this.container.addChild(this.rainContainer);
        
        return {
            update: (delta) => {
                raindrops.forEach(drop => {
                    drop.y += drop.speed * delta;
                    drop.x -= 2 * delta; // Slight wind effect
                    
                    if (drop.y > this.height) {
                        drop.y = -15;
                        drop.x = Math.random() * this.width;
                    }
                });
            },
            stop: () => {
                if (this.rainContainer) {
                    this.container.removeChild(this.rainContainer);
                    this.rainContainer = null;
                }
            }
        };
    }
    
    // Lighting effects
    setAmbientLight(color = 0xFFFFFF, intensity = 1) {
        this.container.tint = color;
        this.container.alpha = intensity;
    }
    
    addLightSource(x, y, radius = 100, color = 0xFFFF99, intensity = 0.8) {
        const light = new PIXI.Graphics();
        const gradient = this.createRadialGradient(radius, color, intensity);
        light.beginFill(color, intensity);
        light.drawCircle(0, 0, radius);
        light.endFill();
        light.position.set(x, y);
        light.blendMode = PIXI.BLEND_MODES.ADD;
        
        if (!this.lightContainer) {
            this.lightContainer = new PIXI.Container();
            this.container.addChild(this.lightContainer);
        }
        
        this.lightContainer.addChild(light);
        return light;
    }
    
    createRadialGradient(radius, color, intensity) {
        // Simple radial gradient approximation using multiple circles
        const gradient = new PIXI.Graphics();
        const steps = 10;
        
        for (let i = steps; i > 0; i--) {
            const alpha = (intensity * i) / steps;
            const currentRadius = (radius * i) / steps;
            gradient.beginFill(color, alpha);
            gradient.drawCircle(0, 0, currentRadius);
            gradient.endFill();
        }
        
        return gradient;
    }

    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.groundLine) {
            this.groundLine.destroy();
        }
        if (this.rainContainer) {
            this.rainContainer.destroy();
        }
        if (this.lightContainer) {
            this.lightContainer.destroy();
        }
        if (this.foregroundElements) {
            this.foregroundElements.destroy();
        }
        if (this.decorations) {
            this.decorations.destroy();
        }
        if (this.container) {
            this.container.destroy(true);
        }
    }
}
