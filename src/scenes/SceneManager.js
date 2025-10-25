export class SceneManager {
    constructor(app) {
        this.app = app;
        this.scenes = new Map();
        this.currentScene = null;
        this.currentSceneName = null;
        this.isTransitioning = false;
    }

    addScene(name, scene) {
        if (this.scenes.has(name)) {
            console.warn(`Scene '${name}' already exists. Replacing it.`);
            const existingScene = this.scenes.get(name);
            if (existingScene === this.currentScene) {
                this.currentScene.deactivate();
                this.currentScene = null;
                this.currentSceneName = null;
            }
            existingScene.destroy();
        }
        
        this.scenes.set(name, scene);
        console.log(`Scene '${name}' added to SceneManager`);
    }

    removeScene(name) {
        if (!this.scenes.has(name)) {
            console.warn(`Scene '${name}' not found`);
            return false;
        }

        const scene = this.scenes.get(name);
        
        // If this is the current scene, deactivate it first
        if (scene === this.currentScene) {
            this.currentScene.deactivate();
            this.currentScene = null;
            this.currentSceneName = null;
        }

        scene.destroy();
        this.scenes.delete(name);
        console.log(`Scene '${name}' removed from SceneManager`);
        return true;
    }

    changeScene(name, transition = null) {
        if (this.isTransitioning) {
            console.warn('Scene transition already in progress');
            return false;
        }

        if (!this.scenes.has(name)) {
            console.error(`Scene '${name}' not found. Available scenes:`, Array.from(this.scenes.keys()));
            return false;
        }

        const newScene = this.scenes.get(name);
        
        // If it's the same scene, do nothing
        if (newScene === this.currentScene) {
            console.log(`Scene '${name}' is already active`);
            return true;
        }

        this.isTransitioning = true;

        // Handle transition
        if (transition && typeof transition === 'object') {
            this._performTransition(newScene, name, transition);
        } else {
            this._changeSceneImmediate(newScene, name);
        }

        return true;
    }

    _changeSceneImmediate(newScene, name) {
        // Deactivate current scene
        if (this.currentScene) {
            this.currentScene.deactivate();
        }

        // Activate new scene
        this.currentScene = newScene;
        this.currentSceneName = name;
        this.currentScene.activate(this.app);
        
        this.isTransitioning = false;
        console.log(`Switched to scene: ${name}`);
    }

    _performTransition(newScene, name, transition) {
        const { type = 'fade', duration = 0.5 } = transition;

        switch (type) {
            case 'fade':
                this._fadeTransition(newScene, name, duration);
                break;
            case 'slide':
                this._slideTransition(newScene, name, duration, transition.direction || 'left');
                break;
            default:
                console.warn(`Unknown transition type: ${type}. Using immediate transition.`);
                this._changeSceneImmediate(newScene, name);
                break;
        }
    }

    _fadeTransition(newScene, name, duration) {
        if (this.currentScene) {
            // Fade out current scene
            this.currentScene.fadeOut(duration / 2, () => {
                this.currentScene.deactivate();
                
                // Activate and fade in new scene
                this.currentScene = newScene;
                this.currentSceneName = name;
                this.currentScene.activate(this.app);
                this.currentScene.fadeIn(duration / 2, () => {
                    this.isTransitioning = false;
                    console.log(`Faded to scene: ${name}`);
                });
            });
        } else {
            // No current scene, just fade in the new one
            this.currentScene = newScene;
            this.currentSceneName = name;
            this.currentScene.activate(this.app);
            this.currentScene.fadeIn(duration, () => {
                this.isTransitioning = false;
                console.log(`Faded to scene: ${name}`);
            });
        }
    }

    _slideTransition(newScene, name, duration, direction) {
        // Simple slide transition (you can enhance this)
        if (this.currentScene) {
            this.currentScene.deactivate();
        }

        this.currentScene = newScene;
        this.currentSceneName = name;
        this.currentScene.activate(this.app);
        
        // For now, just do immediate transition
        // You can implement actual sliding animation here
        this.isTransitioning = false;
        console.log(`Slid to scene: ${name}`);
    }

    getScene(name) {
        return this.scenes.get(name);
    }

    getCurrentScene() {
        return this.currentScene;
    }

    getCurrentSceneName() {
        return this.currentSceneName;
    }

    hasScene(name) {
        return this.scenes.has(name);
    }

    listScenes() {
        return Array.from(this.scenes.keys());
    }

    // Update current scene (call this in your main game loop)
    update(delta) {
        if (this.currentScene && this.currentScene.isActive && !this.isTransitioning) {
            this.currentScene.update(delta);
        }
    }

    // Handle resize events
    resize(width, height) {
        if (this.currentScene && this.currentScene.resize) {
            this.currentScene.resize(width, height);
        }
    }

    // Input event forwarding
    onPointerDown(event) {
        if (this.currentScene && this.currentScene.onPointerDown && !this.isTransitioning) {
            this.currentScene.onPointerDown(event);
        }
    }

    onPointerUp(event) {
        if (this.currentScene && this.currentScene.onPointerUp && !this.isTransitioning) {
            this.currentScene.onPointerUp(event);
        }
    }

    onPointerMove(event) {
        if (this.currentScene && this.currentScene.onPointerMove && !this.isTransitioning) {
            this.currentScene.onPointerMove(event);
        }
    }

    onKeyDown(event) {
        if (this.currentScene && this.currentScene.onKeyDown && !this.isTransitioning) {
            this.currentScene.onKeyDown(event);
        }
    }

    onKeyUp(event) {
        if (this.currentScene && this.currentScene.onKeyUp && !this.isTransitioning) {
            this.currentScene.onKeyUp(event);
        }
    }

    // Cleanup
    destroy() {
        // Destroy all scenes
        for (const [name, scene] of this.scenes) {
            scene.destroy();
        }
        
        this.scenes.clear();
        this.currentScene = null;
        this.currentSceneName = null;
        this.isTransitioning = false;
        this.app = null;
        
        console.log('SceneManager destroyed');
    }

    // Getter for current scene (alias)
    get current() {
        return this.currentScene;
    }
}
