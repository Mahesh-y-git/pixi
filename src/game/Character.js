import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BubbleText } from '../components/BubbleText';

export class Character {
	constructor(spritesheet, startPosition) {
		this.spritesheet = spritesheet;
		// If spritesheet provides animations, use the idle animation textures.
		const idleTex = (this.spritesheet && this.spritesheet.animations && this.spritesheet.animations.idle) || [];
		this.sprite = new PIXI.AnimatedSprite(idleTex);
		this.sprite.anchor.set(0.5);
		this.sprite.position.set(startPosition.x, startPosition.y);
		this.sprite.animationSpeed = 0.1;
		this.sprite.play();
		this._bubble = null;
		this.id = null;
	}

	moveTo(position, duration = 1) {
		gsap.to(this.sprite.position, {
			x: position.x,
			y: position.y,
			duration: duration,
			onStart: () => {
				this.playAnimation('walk');
			},
			onComplete: () => {
				this.playAnimation('idle');
			}
		});
	}

	update(delta) {
		// Placeholder for per-frame updates (e.g., physics, state machines)
	}

	playAnimation(name) {
		if (!this.spritesheet || !this.spritesheet.animations) return;
		const anim = this.spritesheet.animations[name];
		if (!anim) return;
		this.sprite.textures = anim;
		this.sprite.play();
	}

	addToScene(stage) {
		stage.addChild(this.sprite);
	}

	showBubble(text, stage, duration = 2) {
		if (!this._bubble) {
			this._bubble = new BubbleText();
			this._bubble.addTo(stage);
		}
		this._bubble.show(text, this.sprite.position, duration);
	}
}

