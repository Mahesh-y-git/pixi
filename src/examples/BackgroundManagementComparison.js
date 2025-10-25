// ===== OPTION 2: PER-SCENE BACKGROUND MANAGEMENT =====

// This approach keeps backgrounds in each scene
// Better for: Scene-specific backgrounds, Different themes per scene, Independent scene management

// In GameScene.js - Scene-specific background
export class GameSceneWithOwnBackground extends Scene {
    constructor(app) {
        super();
        this.app = app;
        this.assetLoader = new AssetLoader();
        this.background = new Background({ color: 0x87CEEB }); // Sky blue for game
        this.characters = new CharacterManager(this.container);
    }

    onAssetsLoaded() {
        // Game-specific background setup
        this.background.addTo(this.container);
        this.background.resize(this.app.screen.width, this.app.screen.height);
        
        // Set game-specific background
        const bgSpritesheet = this.assetLoader.getSpriteSheet('bg');
        if (bgSpritesheet?.textures?.forest_bg) {
            this.background.setTexture(bgSpritesheet.textures.forest_bg);
        }
        
        this.setupGameBackground();
    }
    
    setupGameBackground() {
        // Game-specific background elements
        this.addTrees();
        this.addGameplayElements();
    }
}

// In CutsceneScene.js - Different background for cutscenes
export class CutsceneSceneWithOwnBackground extends Scene {
    constructor(app) {
        super();
        this.app = app;
        this.assetLoader = new AssetLoader();
        this.background = new Background({ color: 0x000000 }); // Dark for drama
        this.characters = new CharacterManager(this.container);
    }

    onAssetsLoaded() {
        // Cutscene-specific background setup
        this.background.addTo(this.container);
        this.background.resize(this.app.screen.width, this.app.screen.height);
        
        // Set dramatic background for cutscene
        const bgSpritesheet = this.assetLoader.getSpriteSheet('bg');
        if (bgSpritesheet?.textures?.castle_bg) {
            this.background.setTexture(bgSpritesheet.textures.castle_bg);
        }
        
        this.setupCutsceneBackground();
    }
    
    setupCutsceneBackground() {
        // Cutscene-specific dramatic elements
        this.addDramaticLighting();
        this.addCinematicElements();
    }
}

// ===== COMPARISON =====

/* 
CENTRALIZED (Option 1 - What we implemented):
✅ Pros:
- Consistent background across all scenes
- Easy global background changes (weather, time of day)
- Centralized background asset management
- Background persists during scene transitions
- Easy to implement global effects (rain, lighting)

❌ Cons:
- Less flexibility per scene
- All scenes share same background system
- More complex if scenes need very different backgrounds

PER-SCENE (Option 2):
✅ Pros:
- Each scene can have unique background style
- Better encapsulation (scenes are self-contained)
- Easier to customize per scene
- Scene transitions can include background changes

❌ Cons:
- Background assets loaded per scene
- More memory usage
- Harder to maintain consistency
- Background resets on every scene change
*/

// ===== HYBRID APPROACH (Best of both) =====

class HybridBackgroundManager {
    constructor(app) {
        this.app = app;
        this.globalBackground = null;  // Persistent background layer
        this.sceneOverlay = null;      // Scene-specific overlay
    }
    
    setGlobalBackground(texture) {
        // Set background that persists across scenes
        if (!this.globalBackground) {
            this.globalBackground = new Background();
            this.app.stage.addChildAt(this.globalBackground.container, 0);
        }
        this.globalBackground.setTexture(texture);
    }
    
    setSceneOverlay(scene, overlay) {
        // Add scene-specific overlay elements
        if (this.sceneOverlay) {
            this.sceneOverlay.destroy();
        }
        this.sceneOverlay = overlay;
        scene.container.addChildAt(overlay, 0);
    }
    
    changeWeather(type) {
        // Global weather effects
        if (this.globalBackground) {
            switch(type) {
                case 'rain':
                    return this.globalBackground.addRain(1);
                case 'clear':
                    // Clear weather effects
                    break;
            }
        }
    }
}

// Usage in main.js for hybrid:
/*
this.backgroundManager = new HybridBackgroundManager(this.app);
this.backgroundManager.setGlobalBackground(forestTexture);

// In each scene:
const sceneOverlay = this.createSceneSpecificOverlay();
this.backgroundManager.setSceneOverlay(this, sceneOverlay);
*/
