import { gsap } from 'gsap';

export class Cutscene {
    constructor(options = {}) {
        this.timeline = gsap.timeline({ paused: true });
        this.onComplete = options.onComplete || null;
        if (this.onComplete) this.timeline.eventCallback('onComplete', this.onComplete);
    }

    wait(seconds) {
        this.timeline.to({}, { duration: seconds });
        return this;
    }

    move(character, position, duration = 1, ease = 'power1.inOut') {
        if (!character || !character.sprite) return this;
        
        // Use the enhanced character movement system if available
        if (typeof character.moveTo === 'function') {
            // Use character's enhanced moveTo method which handles walk animation and direction
            this.timeline.add(() => {
                const targetPosition = {
                    x: position.x,
                    y: position.y,
                    groundY: position.groundY || position.y
                };
                character.moveTo(targetPosition, duration, 'walk');
            });
        } else {
            // Fallback to direct sprite position animation
            // Calculate direction for sprite flipping if character has setDirection method
            if (typeof character.setDirection === 'function') {
                const deltaX = position.x - character.sprite.x;
                if (Math.abs(deltaX) > 5) {
                    this.timeline.add(() => {
                        character.setDirection(deltaX > 0 ? 'right' : 'left');
                    });
                }
            }
            
            // Play walk animation if available
            if (typeof character.playAnimation === 'function') {
                this.timeline.add(() => {
                    character.playAnimation('walk');
                });
            }
            
            // Animate the position
            this.timeline.to(character.sprite.position, { 
                x: position.x, 
                y: position.y, 
                duration, 
                ease,
                onComplete: () => {
                    // Return to idle animation after movement
                    if (typeof character.playAnimation === 'function') {
                        character.playAnimation('idle');
                    }
                }
            });
        }
        
        return this;
    }

    // Enhanced movement methods
    walkTo(character, position, duration = 1, ease = 'power1.inOut') {
        return this.move(character, position, duration, ease);
    }

    runTo(character, position, duration = 0.6, ease = 'power2.out') {
        if (!character || !character.sprite) return this;
        
        if (typeof character.runTo === 'function') {
            this.timeline.add(() => {
                const targetPosition = {
                    x: position.x,
                    y: position.y,
                    groundY: position.groundY || position.y
                };
                character.runTo(targetPosition, duration);
            });
        } else {
            // Fallback with run animation
            if (typeof character.setDirection === 'function') {
                const deltaX = position.x - character.sprite.x;
                if (Math.abs(deltaX) > 5) {
                    this.timeline.add(() => {
                        character.setDirection(deltaX > 0 ? 'right' : 'left');
                    });
                }
            }
            
            if (typeof character.playAnimation === 'function') {
                this.timeline.add(() => {
                    character.playAnimation('run');
                });
            }
            
            this.timeline.to(character.sprite.position, { 
                x: position.x, 
                y: position.y, 
                duration, 
                ease,
                onComplete: () => {
                    if (typeof character.playAnimation === 'function') {
                        character.playAnimation('idle');
                    }
                }
            });
        }
        
        return this;
    }

    jumpTo(character, position, height = null, duration = 0.8) {
        if (!character || !character.sprite) return this;
        
        if (typeof character.jumpTo === 'function') {
            this.timeline.add(() => {
                const targetPosition = {
                    x: position.x,
                    y: position.y,
                    groundY: position.groundY || position.y
                };
                character.jumpTo(targetPosition, height);
            });
        } else {
            // Fallback jump animation
            if (typeof character.setDirection === 'function') {
                const deltaX = position.x - character.sprite.x;
                if (Math.abs(deltaX) > 5) {
                    this.timeline.add(() => {
                        character.setDirection(deltaX > 0 ? 'right' : 'left');
                    });
                }
            }
            
            if (typeof character.playAnimation === 'function') {
                this.timeline.add(() => {
                    character.playAnimation('jump');
                });
            }
            
            const jumpHeight = height || 80;
            const currentY = character.sprite.y;
            const targetY = position.y;
            
            // Create jump arc
            this.timeline.to(character.sprite.position, {
                x: position.x,
                duration: duration,
                ease: 'power2.out'
            });
            
            this.timeline.to(character.sprite.position, {
                y: currentY - jumpHeight,
                duration: duration / 2,
                ease: 'power2.out'
            }, '-=' + duration);
            
            this.timeline.to(character.sprite.position, {
                y: targetY,
                duration: duration / 2,
                ease: 'power2.in',
                onComplete: () => {
                    if (typeof character.playAnimation === 'function') {
                        character.playAnimation('idle');
                    }
                }
            });
        }
        
        return this;
    }

    // Face direction without moving
    faceDirection(character, direction, atTime) {
        if (!character || typeof character.setDirection !== 'function') return this;
        this.timeline.add(() => {
            character.setDirection(direction);
        }, atTime || '+=0');
        return this;
    }

    // Look at another character or position
    lookAt(character, target, atTime) {
        if (!character) return this;
        this.timeline.add(() => {
            if (typeof character.lookAt === 'function') {
                const targetPos = target.sprite ? target.sprite.position : target;
                character.lookAt(targetPos);
            } else if (typeof character.setDirection === 'function') {
                const targetPos = target.sprite ? target.sprite.position : target;
                const deltaX = targetPos.x - character.sprite.x;
                if (Math.abs(deltaX) > 5) {
                    character.setDirection(deltaX > 0 ? 'right' : 'left');
                }
            }
        }, atTime || '+=0');
        return this;
    }

    animate(character, animationName, atTime) {
        if (!character) return this;
        this.timeline.add(() => {
            if (typeof character.playAnimation === 'function') {
                character.playAnimation(animationName);
            }
        }, atTime || '+=0');
        return this;
    }

    // Enhanced speak method with better bubble positioning
    speak(character, text, duration = 2, atTime) {
        if (!character) return this;
        this.timeline.add(() => {
            if (typeof character.showBubble === 'function') {
                // Use character's enhanced showBubble method
                const stage = character.sprite.parent || character.stage;
                character.showBubble(text, stage, duration);
            } else {
                // Fallback for older character implementation
                console.warn('Character does not have showBubble method');
            }
        }, atTime || '+=0');
        return this;
    }

    // Action animations
    attack(character, target = null, atTime) {
        if (!character) return this;
        this.timeline.add(() => {
            if (typeof character.attack === 'function') {
                const targetPos = target ? (target.sprite ? target.sprite.position : target) : null;
                character.attack(targetPos);
            } else if (typeof character.playAnimation === 'function') {
                if (target && typeof character.lookAt === 'function') {
                    const targetPos = target.sprite ? target.sprite.position : target;
                    character.lookAt(targetPos);
                }
                character.playAnimation('attack');
            }
        }, atTime || '+=0');
        return this;
    }

    hurt(character, knockbackForce = 20, atTime) {
        if (!character) return this;
        this.timeline.add(() => {
            if (typeof character.hurt === 'function') {
                character.hurt(knockbackForce);
            } else if (typeof character.playAnimation === 'function') {
                character.playAnimation('hurt');
            }
        }, atTime || '+=0');
        return this;
    }

    changeBackground(background, opts = {}, atTime) {
        this.timeline.add(() => {
            if (opts.color !== undefined) background.setColor(opts.color);
            if (opts.texture) background.setTexture(opts.texture);
        }, atTime || '+=0');
        return this;
    }

    call(fn, atTime) {
        this.timeline.add(() => fn && fn());
        return this;
    }

    play() {
        this.timeline.play();
        return this;
    }

    pause() {
        this.timeline.pause();
        return this;
    }

    seek(time) {
        this.timeline.seek(time);
        return this;
    }
}
