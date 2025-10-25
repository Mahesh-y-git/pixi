import * as PIXI from 'pixi.js';

export class Scene {
    constructor() {
        this.container = new PIXI.Container();
        this.isActive = false;
        this.isLoaded = false;
        this.app = null;
    }

    // Called when scene becomes active
    activate(app) {
        this.isActive = true;
        this.app = app;
        if (app && app.stage && !app.stage.children.includes(this.container)) {
            app.stage.addChild(this.container);
        }
        this.onActivate();
    }

    // Called when scene becomes inactive
    deactivate() {
        this.isActive = false;
        if (this.app && this.app.stage && this.app.stage.children.includes(this.container)) {
            this.app.stage.removeChild(this.container);
        }
        this.onDeactivate();
    }

    // Override in subclasses
    onActivate() {
        // Called when scene becomes active
    }

    // Override in subclasses  
    onDeactivate() {
        // Called when scene becomes inactive
    }

    // Preload assets - override in subclasses
    preload(onComplete) {
        this.isLoaded = true;
        if (onComplete) {
            onComplete();
        }
    }

    // Update loop - override in subclasses
    update(delta) {
        // Called every frame while scene is active
    }

    // Resize handler - override in subclasses
    resize(width, height) {
        // Called when app is resized
    }

    // Input handlers - override in subclasses
    onPointerDown(event) {
        // Handle pointer/mouse down events
    }

    onPointerUp(event) {
        // Handle pointer/mouse up events
    }

    onPointerMove(event) {
        // Handle pointer/mouse move events
    }

    onKeyDown(event) {
        // Handle keyboard down events
    }

    onKeyUp(event) {
        // Handle keyboard up events
    }

    // Utility methods
    addChild(displayObject) {
        this.container.addChild(displayObject);
    }

    removeChild(displayObject) {
        this.container.removeChild(displayObject);
    }

    getChildByName(name) {
        return this.container.getChildByName(name);
    }

    // Scene transition helpers
    fadeIn(duration = 0.5, onComplete = null) {
        this.container.alpha = 0;
        
        // Simple fade in without external animation library
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = (currentTime - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            this.container.alpha = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(duration = 0.5, onComplete = null) {
        this.container.alpha = 1;
        
        // Simple fade out without external animation library
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = (currentTime - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            this.container.alpha = 1 - progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Cleanup
    destroy() {
        this.deactivate();
        this.container.destroy(true);
        this.isActive = false;
        this.isLoaded = false;
        this.app = null;
    }

    // Getter for visibility
    get visible() {
        return this.container.visible;
    }

    set visible(value) {
        this.container.visible = value;
    }

    // Getter for alpha
    get alpha() {
        return this.container.alpha;
    }

    set alpha(value) {
        this.container.alpha = value;
    }
}
