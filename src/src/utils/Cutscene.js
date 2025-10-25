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
        this.timeline.to(character.sprite.position, { x: position.x, y: position.y, duration, ease });
        return this;
    }

    animate(character, animationName, atTime) {
        if (!character) return this;
        this.timeline.add(() => {
            character.playAnimation(animationName);
        }, atTime || '+=0');
        return this;
    }

    speak(character, text, duration = 2, atTime) {
        if (!character) return this;
        this.timeline.add(() => {
            character.showBubble(text, character.sprite.parent || character.stage, duration);
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
