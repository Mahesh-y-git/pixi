import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BubbleText } from '../components/BubbleText';

export class Character {
	constructor(spritesheet, startPosition, options = {}) {
		this.spritesheet = spritesheet;
		this.options = options;
		
		// Character state
		this.currentAnimation = 'idle';
		this.direction = 'right'; // 'left' or 'right'
		this.isMoving = false;
		this.moveTween = null;
		this.groundY = startPosition.groundY || startPosition.y;
		
		// Animation speeds for different actions
		this.animationSpeeds = {
			idle: 0.08,
			walk: 0.15,
			run: 0.25,
			attack: 0.2,
			hurt: 0.1,
			die: 0.1,
			jump: 0.12,
			...options.animationSpeeds
		};
		
		// Create sprite - either from spritesheet or simple graphics
		if (this.spritesheet && this.spritesheet.animations && this.spritesheet.animations.idle) {
			// Use spritesheet animation
			const idleTex = this.spritesheet.animations.idle;
			this.sprite = new PIXI.AnimatedSprite(idleTex);
			this.sprite.animationSpeed = this.animationSpeeds.idle;
			this.sprite.play();
		} else {
			// Create simple graphic character
			this.sprite = this.createSimpleCharacterGraphic(options);
		}
		
	//	this.sprite.anchor.set(0.5, 1); // Anchor at bottom center for ground positioning
		this.sprite.position.set(startPosition.x, this.groundY);
		
		// Character properties
		this._bubble = null;
		this.id = null;
		this.baseScale = options.scale || 1;
		this.sprite.scale.set(this.baseScale);
		
		// Movement properties
		this.moveSpeed = options.moveSpeed || 100; // pixels per second
		this.jumpHeight = options.jumpHeight || 80;
		this.jumpDuration = options.jumpDuration || 0.6;
		
		// Physics
		this.isGrounded = true;
		this.velocity = { x: 0, y: 0 };
		this.gravity = options.gravity || 500;
		
		// Initialize direction
		this.setDirection(options.direction || 'right');
	}
	
	createSimpleCharacterGraphic(options = {}) {
		const container = new PIXI.Container();
		
		// Character body (rectangle)
		const body = new PIXI.Graphics();
		const color = options.color || 0x7ED321;
		body.beginFill(color);
		body.drawRoundedRect(-15, -50, 30, 50, 5);
		body.endFill();
		
		// Character head (circle)
		const head = new PIXI.Graphics();
		head.beginFill(color);
		head.drawCircle(0, -60, 12);
		head.endFill();
		
		// Character eyes
		const leftEye = new PIXI.Graphics();
		leftEye.beginFill(0x000000);
		leftEye.drawCircle(-5, -60, 2);
		leftEye.endFill();
		
		const rightEye = new PIXI.Graphics();
		rightEye.beginFill(0x000000);
		rightEye.drawCircle(5, -60, 2);
		rightEye.endFill();
		
		// Add name text
		if (options.name) {
			const nameText = new PIXI.Text(options.name, {
				fontFamily: 'Arial',
				fontSize: 12,
				fill: 0xFFFFFF,
				align: 'center'
			});
			nameText.anchor.set(0.5);
			nameText.position.set(0, -25);
			container.addChild(nameText);
		}
		
		container.addChild(body);
		container.addChild(head);
		container.addChild(leftEye);
		container.addChild(rightEye);
		
		return container;
	}

	moveTo(position, duration = null, animationType = 'walk') {
		// Stop any existing movement
		if (this.moveTween) {
			this.moveTween.kill();
		}
		
		const targetX = position.x;
		const targetY = position.groundY || position.y || this.groundY;
		
		// Calculate direction and face the character correctly
		const deltaX = targetX - this.sprite.x;
		if (Math.abs(deltaX) > 5) { // Only change direction for significant movement
			this.setDirection(deltaX > 0 ? 'right' : 'left');
		}
		
		// Calculate duration based on distance if not provided
		if (duration === null) {
			const distance = Math.sqrt(deltaX * deltaX + (targetY - this.sprite.y) * (targetY - this.sprite.y));
			duration = Math.max(0.3, distance / this.moveSpeed);
		}
		
		this.isMoving = true;
		this.playAnimation(animationType);
		
		// Create movement tween
		this.moveTween = gsap.to(this.sprite.position, {
			x: targetX,
			y: targetY,
			duration: duration,
			ease: "power2.out",
			onUpdate: () => {
				// Update bubble position if visible
				if (this._bubble && this._bubble.isVisible) {
					this._bubble.updatePosition(this.sprite.position);
				}
			},
			onComplete: () => {
				this.isMoving = false;
				this.groundY = targetY; // Update ground level
				this.playAnimation('idle');
				this.moveTween = null;
			}
		});
		
		return this.moveTween;
	}

	// Enhanced movement methods
	walkTo(position, duration = null) {
		return this.moveTo(position, duration, 'walk');
	}
	
	runTo(position, duration = null) {
		const runDuration = duration ? duration * 0.6 : null; // Running is faster
		return this.moveTo(position, runDuration, 'run');
	}

	// Jump mechanics
	jumpTo(position, height = null) {
		if (!this.isGrounded) return null;
		
		height = height || this.jumpHeight;
		const targetX = position.x;
		const targetY = position.groundY || position.y || this.groundY;
		
		// Face the correct direction
		const deltaX = targetX - this.sprite.x;
		if (Math.abs(deltaX) > 5) {
			this.setDirection(deltaX > 0 ? 'right' : 'left');
		}
		
		this.isGrounded = false;
		this.playAnimation('jump');
		
		const timeline = gsap.timeline({
			onComplete: () => {
				this.isGrounded = true;
				this.groundY = targetY;
				this.playAnimation('idle');
			}
		});
		
		// Jump arc animation
		timeline.to(this.sprite.position, {
			x: targetX,
			duration: this.jumpDuration,
			ease: "power2.out"
		}, 0);
		
		timeline.to(this.sprite.position, {
			y: this.sprite.y - height,
			duration: this.jumpDuration / 2,
			ease: "power2.out"
		}, 0);
		
		timeline.to(this.sprite.position, {
			y: targetY,
			duration: this.jumpDuration / 2,
			ease: "power2.in"
		}, this.jumpDuration / 2);
		
		return timeline;
	}

	// Direction control
	setDirection(direction) {
		if (direction === this.direction) return;
		
		this.direction = direction;
		if (direction === 'left') {
			this.sprite.scale.x = -Math.abs(this.baseScale);
		} else {
			this.sprite.scale.x = Math.abs(this.baseScale);
		}
	}
	
	flipDirection() {
		this.setDirection(this.direction === 'left' ? 'right' : 'left');
	}

	// Enhanced update method with physics
	update(delta) {
		// Apply gravity if not grounded
		if (!this.isGrounded) {
			this.velocity.y += this.gravity * delta;
			this.sprite.y += this.velocity.y * delta;
			
			// Check if landed
			if (this.sprite.y >= this.groundY) {
				this.sprite.y = this.groundY;
				this.velocity.y = 0;
				this.isGrounded = true;
				if (this.currentAnimation === 'jump') {
					this.playAnimation('idle');
				}
			}
		}
		
		// Update bubble position if character is moving
		if (this._bubble && this._bubble.isVisible && this.isMoving) {
			this._bubble.updatePosition(this.sprite.position);
		}
	}

	// Enhanced animation system
	playAnimation(name, force = false) {
		if (!force && this.currentAnimation === name) return;
		
		if (!this.spritesheet || !this.spritesheet.animations) {
			console.warn(`No animations available for character ${this.id}`);
			return;
		}
		
		const anim = this.spritesheet.animations[name];
		if (!anim) {
			console.warn(`Animation '${name}' not found for character ${this.id}`);
			return;
		}
		
		this.currentAnimation = name;
		this.sprite.textures = anim;
		this.sprite.animationSpeed = this.animationSpeeds[name] || 0.1;
		this.sprite.play();
	}
	
	// Action animations
	attack(targetPosition = null, onComplete = null) {
		if (targetPosition) {
			const deltaX = targetPosition.x - this.sprite.x;
			if (Math.abs(deltaX) > 5) {
				this.setDirection(deltaX > 0 ? 'right' : 'left');
			}
		}
		
		this.playAnimation('attack');
		
		// Auto return to idle after attack animation
		setTimeout(() => {
			if (this.currentAnimation === 'attack') {
				this.playAnimation('idle');
			}
			if (onComplete) onComplete();
		}, (this.sprite.textures.length / this.sprite.animationSpeed) * 16.67); // Approximate frame time
	}
	
	hurt(knockbackForce = 20) {
		this.playAnimation('hurt');
		
		// Knockback effect
		const knockbackX = this.direction === 'right' ? -knockbackForce : knockbackForce;
		gsap.to(this.sprite.position, {
			x: this.sprite.x + knockbackX,
			duration: 0.3,
			ease: "power2.out"
		});
		
		// Return to idle after hurt animation
		setTimeout(() => {
			if (this.currentAnimation === 'hurt') {
				this.playAnimation('idle');
			}
		}, 800);
	}
	
	die() {
		this.playAnimation('die');
		this.isMoving = false;
		if (this.moveTween) {
			this.moveTween.kill();
		}
		
		// Fade out effect
		gsap.to(this.sprite, {
			alpha: 0,
			duration: 2,
			delay: 1,
			ease: "power2.out"
		});
	}

	// Ground and positioning
	setGroundLevel(y) {
		this.groundY = y;
		if (this.isGrounded) {
			this.sprite.y = y;
		}
	}
	
	snapToGround() {
		this.sprite.y = this.groundY;
		this.isGrounded = true;
		this.velocity.y = 0;
	}

	// Scene management
	addToScene(stage) {
		stage.addChild(this.sprite);
	}
	
	removeFromScene(stage) {
		if (stage.children.includes(this.sprite)) {
			stage.removeChild(this.sprite);
		}
	}

	// Enhanced bubble system
	showBubble(text, stage, duration = 2, options = {}) {
		if (!this._bubble) {
			this._bubble = new BubbleText();
			this._bubble.addTo(stage);
		}
		
		// Calculate bubble position (above character's head)
		const bubblePosition = {
			x: this.sprite.x,
			y: this.sprite.y  // Position above character
		};
		
		this._bubble.show(text, bubblePosition, duration);
	}
	
	hideBubble() {
		if (this._bubble) {
			this._bubble.hide();
		}
	}

	// Utility methods
	distanceTo(otherCharacter) {
		const dx = this.sprite.x - otherCharacter.sprite.x;
		const dy = this.sprite.y - otherCharacter.sprite.y;
		return Math.sqrt(dx * dx + dy * dy);
	}
	
	isNear(otherCharacter, threshold = 50) {
		return this.distanceTo(otherCharacter) <= threshold;
	}
	
	lookAt(targetPosition) {
		const deltaX = targetPosition.x - this.sprite.x;
		if (Math.abs(deltaX) > 5) {
			this.setDirection(deltaX > 0 ? 'right' : 'left');
		}
	}
	
	// Animation state queries
	get isIdle() { return this.currentAnimation === 'idle'; }
	get isWalking() { return this.currentAnimation === 'walk'; }
	get isRunning() { return this.currentAnimation === 'run'; }
	get isJumping() { return this.currentAnimation === 'jump'; }
	get isAttacking() { return this.currentAnimation === 'attack'; }
	
	// Cleanup
	destroy() {
		if (this.moveTween) {
			this.moveTween.kill();
		}
		if (this._bubble) {
			this._bubble.destroy();
		}
		if (this.sprite) {
			this.sprite.destroy();
		}
	}
}

