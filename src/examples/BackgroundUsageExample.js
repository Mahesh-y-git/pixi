// ===== SIMPLE BACKGROUND USAGE EXAMPLE =====

// 1. Loading and using background JSON textures
function setupBackgroundFromJSON() {
    // Get the background spritesheet that we created
    const bgSpritesheet = this.assetLoader.getSpriteSheet('bg');
    
    if (bgSpritesheet && bgSpritesheet.textures) {
        // Use different backgrounds based on scene
        const backgrounds = {
            castle: bgSpritesheet.textures['castle_bg'],
            forest: bgSpritesheet.textures['forest_bg'],
            mountain: bgSpritesheet.textures['mountain_bg']
        };
        
        // Set the castle background
        if (backgrounds.castle) {
            this.background.setTexture(backgrounds.castle);
        }
        
        // OR create a tiled pattern background
        if (backgrounds.forest) {
            this.background.setPattern(backgrounds.forest, 0.5, 0.5); // Half scale tiling
        }
    }
}

// 2. Adding decorative items to background
function addBackgroundItems() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const groundLevel = h * 0.85;
    
    // Add trees at specific positions
    const treePositions = [
        { x: w * 0.1, y: groundLevel },
        { x: w * 0.9, y: groundLevel },
        { x: w * 0.3, y: groundLevel },
    ];
    
    treePositions.forEach(pos => {
        const tree = this.createSimpleTree();
        tree.position.set(pos.x, pos.y);
        this.container.addChild(tree);
    });
    
    // Add rocks scattered around
    for (let i = 0; i < 5; i++) {
        const rock = this.createSimpleRock();
        rock.position.set(
            Math.random() * w,
            groundLevel - 10 + Math.random() * 20
        );
        this.container.addChild(rock);
    }
    
    // Add a sun
    const sun = this.createSun();
    sun.position.set(w * 0.8, h * 0.2);
    this.container.addChild(sun);
}

// 3. Simple creation functions
function createSimpleTree() {
    const tree = new PIXI.Container();
    
    // Brown trunk
    const trunk = new PIXI.Graphics();
    trunk.beginFill(0x8B4513);
    trunk.drawRect(-5, -40, 10, 40);
    trunk.endFill();
    
    // Green leaves
    const leaves = new PIXI.Graphics();
    leaves.beginFill(0x228B22);
    leaves.drawCircle(0, -50, 20);
    leaves.endFill();
    
    tree.addChild(trunk);
    tree.addChild(leaves);
    return tree;
}

function createSimpleRock() {
    const rock = new PIXI.Graphics();
    rock.beginFill(0x696969);
    rock.drawEllipse(0, 0, 10 + Math.random() * 10, 5 + Math.random() * 5);
    rock.endFill();
    return rock;
}

function createSun() {
    const sun = new PIXI.Graphics();
    sun.beginFill(0xFFD700);
    sun.drawCircle(0, 0, 30);
    sun.endFill();
    
    // Add rays
    sun.lineStyle(3, 0xFFD700);
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = Math.cos(angle) * 35;
        const y1 = Math.sin(angle) * 35;
        const x2 = Math.cos(angle) * 45;
        const y2 = Math.sin(angle) * 45;
        sun.moveTo(x1, y1);
        sun.lineTo(x2, y2);
    }
    
    return sun;
}

// 4. Using in your existing GameScene
// Add this to your GameScene's onAssetsLoaded method:

/*
// After your existing background setup, add:
const bgSpritesheet = this.assetLoader.getSpriteSheet('bg');
if (bgSpritesheet && bgSpritesheet.textures) {
    // Try to use a background texture from JSON
    const forestBg = bgSpritesheet.textures['forest_bg'];
    if (forestBg) {
        this.background.setTexture(forestBg);
    }
}

// Add some simple background items
this.addBackgroundDecorations();

addBackgroundDecorations() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const groundLevel = h * 0.85;
    
    // Add 3 trees
    [0.15, 0.35, 0.85].forEach(position => {
        const tree = new PIXI.Container();
        
        const trunk = new PIXI.Graphics();
        trunk.beginFill(0x8B4513);
        trunk.drawRect(-6, -50, 12, 50);
        trunk.endFill();
        
        const leaves = new PIXI.Graphics();
        leaves.beginFill(0x228B22);
        leaves.drawCircle(0, -60, 25);
        leaves.endFill();
        
        tree.addChild(trunk, leaves);
        tree.position.set(w * position, groundLevel);
        this.container.addChild(tree);
    });
    
    // Add sun
    const sun = new PIXI.Graphics();
    sun.beginFill(0xFFD700);
    sun.drawCircle(0, 0, 25);
    sun.endFill();
    sun.position.set(w * 0.8, h * 0.2);
    this.container.addChild(sun);
}
*/
