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
