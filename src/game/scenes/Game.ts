import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { config } from '../main'; 

const PLATFORMS_MAX: number = 5;

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    player: any;
    platforms: any;
    cursors: any;
    HEIGHT: any = config.width;
    WIDTH: any = config.height;

    constructor ()
    {
        super('Game');
    }

    createRandomPlatforms(num: number) {
        for (let i = 0; i < num; i++) {
            let x = 200 + Math.floor(Math.random() * 400); // 200 < x < 400
            let y = 500 - (Math.floor(Math.random() * 500));  // y < 500

            this.platforms.create(x, y, 'ground').setScale(1.5);
        }    
    }

    create ()
    {
        // Setup
        this.camera = this.cameras.main;

        this.background = this.add.image(512, 384, 'background');

        // Platform logic
        this.platforms = this.physics.add.staticGroup();

        this.platforms.create(400, 600, 'ground').setScale(2).refreshBody();
        this.createRandomPlatforms(PLATFORMS_MAX)

        // Player logic
        this.player = this.physics.add.sprite(100, 450, 'fighter');

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('fighter', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'fighter', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('fighter', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // Collision logic
        this.physics.add.collider(this.player, this.platforms);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Main
        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-160);

            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(160);

            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);

            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
