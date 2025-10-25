import * as PIXI from 'pixi.js';

export class AssetLoader {
    constructor() {
        this.loadedAssets = new Map();
        this.isLoading = false;
    }

    async loadAssets(assets, onComplete) {
        if (this.isLoading) {
            console.warn('AssetLoader is already loading assets');
            return;
        }

        this.isLoading = true;
        const promises = [];

        for (const asset of assets) {
            if (this.loadedAssets.has(asset.name)) {
                console.log(`Asset ${asset.name} already loaded, skipping`);
                continue;
            }

            console.log(`Loading asset: ${asset.name} from ${asset.url}`);
            
            try {
                // Handle different asset types
                if (asset.url.endsWith('.json')) {
                    // Spritesheet JSON
                    const promise = PIXI.Assets.load(asset.url).then(spritesheet => {
                        this.loadedAssets.set(asset.name, spritesheet);
                        console.log(`Loaded spritesheet: ${asset.name}`);
                        return spritesheet;
                    }).catch(error => {
                        console.warn(`Failed to load spritesheet ${asset.name}: ${error.message}`);
                        // Create a placeholder spritesheet with colored rectangles
                        const placeholderSpritesheet = this.createPlaceholderSpritesheet(asset.name);
                        this.loadedAssets.set(asset.name, placeholderSpritesheet);
                        return placeholderSpritesheet;
                    });
                    promises.push(promise);
                } else if (asset.url.match(/\.(png|jpg|jpeg|webp|svg)$/i)) {
                    // Image texture
                    const promise = PIXI.Assets.load(asset.url).then(texture => {
                        this.loadedAssets.set(asset.name, texture);
                        console.log(`Loaded texture: ${asset.name}`);
                        return texture;
                    });
                    promises.push(promise);
                } else if (asset.url.match(/\.(mp3|wav|ogg)$/i)) {
                    // Audio file (if you plan to add audio)
                    const promise = new Promise((resolve) => {
                        const audio = new Audio(asset.url);
                        audio.onloadeddata = () => {
                            this.loadedAssets.set(asset.name, audio);
                            console.log(`Loaded audio: ${asset.name}`);
                            resolve(audio);
                        };
                        audio.onerror = () => {
                            console.error(`Failed to load audio: ${asset.name}`);
                            resolve(null);
                        };
                    });
                    promises.push(promise);
                } else {
                    // Generic asset
                    const promise = PIXI.Assets.load(asset.url).then(loadedAsset => {
                        this.loadedAssets.set(asset.name, loadedAsset);
                        console.log(`Loaded asset: ${asset.name}`);
                        return loadedAsset;
                    });
                    promises.push(promise);
                }
            } catch (error) {
                console.error(`Error loading asset ${asset.name}:`, error);
            }
        }

        try {
            await Promise.all(promises);
            console.log('All assets loaded successfully');
            this.isLoading = false;
            
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Error loading some assets:', error);
            this.isLoading = false;
            
            if (onComplete) {
                onComplete();
            }
        }
    }

    getAsset(name) {
        const asset = this.loadedAssets.get(name);
        if (!asset) {
            console.warn(`Asset '${name}' not found. Available assets:`, Array.from(this.loadedAssets.keys()));
        }
        return asset;
    }

    getSpriteSheet(name) {
        return this.getAsset(name);
    }

    getTexture(name) {
        return this.getAsset(name);
    }

    getAudio(name) {
        return this.getAsset(name);
    }

    hasAsset(name) {
        return this.loadedAssets.has(name);
    }

    removeAsset(name) {
        const asset = this.loadedAssets.get(name);
        if (asset) {
            // Clean up PIXI assets
            if (asset.destroy && typeof asset.destroy === 'function') {
                asset.destroy();
            }
            this.loadedAssets.delete(name);
            console.log(`Removed asset: ${name}`);
            return true;
        }
        return false;
    }

    clear() {
        for (const [name, asset] of this.loadedAssets) {
            if (asset.destroy && typeof asset.destroy === 'function') {
                asset.destroy();
            }
        }
        this.loadedAssets.clear();
        console.log('All assets cleared');
    }

    getLoadedAssets() {
        return Array.from(this.loadedAssets.keys());
    }

    // Create placeholder spritesheets for missing assets
    createPlaceholderSpritesheet(name) {
        // Create a simple colored rectangle texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Different colors for different character types
        const colors = {
            'knight': '#4A90E2',
            'princess': '#F5A623',
            'dragon': '#D0021B',
            'character': '#7ED321',
            'bg': '#9013FE'
        };
        
        const color = colors[name] || '#50E3C2';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(name.toUpperCase(), 32, 35);
        
        const texture = PIXI.Texture.from(canvas);
        
        // Create a mock spritesheet structure
        const mockSpritesheet = {
            textures: {
                [`${name}_placeholder`]: texture
            },
            animations: {
                idle: [texture],
                walk: [texture],
                run: [texture],
                attack: [texture],
                roar: [texture],
                jump: [texture],
                hurt: [texture],
                die: [texture]
            },
            baseTexture: texture.baseTexture
        };
        
        console.log(`Created placeholder spritesheet for: ${name}`);
        return mockSpritesheet;
    }

    // Preload multiple assets in batches to avoid overwhelming the browser
    async loadAssetsInBatches(assets, batchSize = 5, onProgress = null) {
        const totalAssets = assets.length;
        let loadedCount = 0;

        for (let i = 0; i < assets.length; i += batchSize) {
            const batch = assets.slice(i, i + batchSize);
            
            await new Promise((resolve) => {
                this.loadAssets(batch, () => {
                    loadedCount += batch.length;
                    if (onProgress) {
                        onProgress(loadedCount, totalAssets);
                    }
                    resolve();
                });
            });
        }
    }
}
