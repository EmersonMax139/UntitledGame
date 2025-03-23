import { Physics, Scene } from 'phaser';

export class Bullet extends Physics.Arcade.Sprite {
    speed: number = 400;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'bullet');
    }

    fire(x: number, y: number, direction: string): void {
        this.body.reset(x, y);
        
        this.setActive(true);
        this.setVisible(true);
        
        if (direction === 'left') {
            this.setVelocityX(-this.speed);
        } else {
            this.setVelocityX(this.speed);
        }
    }

    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        // Auto-destroy when off-screen
        const width = this.scene.game.config.width as number;
        const height = this.scene.game.config.height as number;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

export class BulletGroup extends Physics.Arcade.Group {
    constructor(scene: Scene) {
        super(scene.physics.world, scene);

        this.createMultiple({
            frameQuantity: 10,
            key: 'bullet',
            active: false,
            visible: false,
            classType: Bullet
        });
    }

    fireBullet(x: number, y: number, direction: string): Bullet | null {
        const bullet = this.getFirstDead(false) as Bullet;
        
        if (bullet) {
            bullet.fire(x, y, direction);
            return bullet;
        }
        
        return null;
    }
}