import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export class BubbleText {
    constructor() {
        this.container = new PIXI.Container();
        this.bubble = null;
        this.text = null;
        this.isVisible = false;
        this.hideTimeout = null;
    }

    addTo(stage) {
        if (stage && !stage.children.includes(this.container)) {
            stage.addChild(this.container);
        }
    }

    show(message, position, duration = 2) {
        // Clear any existing timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Create or update text
        if (!this.text) {
            this.text = new PIXI.Text({
                text: message,
                style: {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0x000000,
                    align: 'center',
                    wordWrap: true,
                    wordWrapWidth: 200
                }
            });
            this.container.addChild(this.text);
        } else {
            this.text.text = message;
        }

        // Create or update bubble background
        if (!this.bubble) {
            this.bubble = new PIXI.Graphics();
            this.container.addChildAt(this.bubble, 0); // Add behind text
        }

        // Clear and redraw bubble
        this.bubble.clear();
        
        // Calculate bubble dimensions based on text
        const textBounds = this.text.getBounds();
        const padding = 12;
        const bubbleWidth = textBounds.width + padding * 2;
        const bubbleHeight = textBounds.height + padding * 2;
        const cornerRadius = 8;

        // Draw bubble background
        this.bubble.roundRect(0, 0, bubbleWidth, bubbleHeight, cornerRadius);
        this.bubble.fill(0xFFFFFF);
        this.bubble.stroke({ color: 0x000000, width: 2 });

        // Draw speech bubble tail
        const tailSize = 8;
        const tailX = bubbleWidth / 2;
        const tailY = bubbleHeight;
        
        this.bubble.moveTo(tailX - tailSize, tailY);
        this.bubble.lineTo(tailX, tailY + tailSize);
        this.bubble.lineTo(tailX + tailSize, tailY);
        this.bubble.fill(0xFFFFFF);
        this.bubble.stroke({ color: 0x000000, width: 2 });

        // Position text within bubble
        this.text.x = padding;
        this.text.y = padding;

        // Position bubble above character
        this.container.x = position.x - bubbleWidth / 2;
        this.container.y = position.y - bubbleHeight - tailSize - 20; // 20px offset above character

        // Show with animation
        if (!this.isVisible) {
            this.container.alpha = 0;
            this.container.scale.set(0.8);
            this.isVisible = true;

            gsap.to(this.container, {
                alpha: 1,
                duration: 0.3,
                ease: "back.out(1.7)"
            });
            gsap.to(this.container.scale, {
                x: 1,
                y: 1,
                duration: 0.3,
                ease: "back.out(1.7)"
            });
        } else {
            // Just update position if already visible
            gsap.to(this.container, {
                x: position.x - bubbleWidth / 2,
                y: position.y - bubbleHeight - tailSize - 20,
                duration: 0.2
            });
        }

        // Auto-hide after duration
        if (duration > 0) {
            this.hideTimeout = setTimeout(() => {
                this.hide();
            }, duration * 1000);
        }
    }

    hide() {
        if (!this.isVisible) return;

        // Clear timeout if exists
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        gsap.to(this.container, {
            alpha: 0,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
                this.isVisible = false;
                this.container.scale.set(0.8);
            }
        });
        gsap.to(this.container.scale, {
            x: 0.8,
            y: 0.8,
            duration: 0.2,
            ease: "power2.out"
        });
    }

    destroy() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.container.destroy(true);
    }

    // Update position if character moves while bubble is visible
    updatePosition(position) {
        if (!this.isVisible) return;

        const textBounds = this.text?.getBounds();
        if (!textBounds) return;

        const padding = 12;
        const bubbleWidth = textBounds.width + padding * 2;
        const bubbleHeight = textBounds.height + padding * 2;
        const tailSize = 8;

        gsap.to(this.container, {
            x: position.x - bubbleWidth / 2,
            y: position.y - bubbleHeight - tailSize - 20,
            duration: 0.1
        });
    }
}
