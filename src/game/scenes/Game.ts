import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { config } from '../main'; 
import { BulletGroup } from '../objects/Bullet';
import { PlatformGenerator, DEFAULT_PLATFORM_CONFIG } from '../objects/PlatformGenerator';


// Platform generation configuration
const PLATFORM_CONFIG = {
    MAX_PLATFORMS: 4,        // Maximum number of platforms to attempt to place
    MIN_HORIZONTAL_GAP: 100, // Minimum horizontal gap between platforms
    MIN_VERTICAL_GAP: 200,    // Minimum vertical gap between platforms
    PLATFORM_WIDTH: 150,     // Approximate width of platform sprite when scaled to 1
    PLATFORM_HEIGHT: 32,     // Approximate height of platform sprite when scaled to 1
    BASE_HEIGHT: 400,         // Height of base platform from bottom of screen
    MIN_SCALE: 1,          // Minimum platform scale
    MAX_SCALE: 2,           // Maximum platform scale
};

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    platformGenerator: PlatformGenerator;
    player: any;
    platforms: any;
    cursors: any;
    bullets: BulletGroup;
    playerDirection: string = 'right';
    lastFired: number = 0; // For bullet cooldown
    fireRate: number = 200; // Milliseconds between bullets
    HEIGHT: any = config.width;
    WIDTH: any = config.height;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Setup
        this.camera = this.cameras.main;

        this.background = this.add.image(512, 384, 'background');

       // Platform logic
       this.platforms = this.physics.add.staticGroup();
        
       // Initialize platform generator
       this.platformGenerator = new PlatformGenerator(
           this, 
           this.platforms, 
           {
               ...DEFAULT_PLATFORM_CONFIG,
               // You can override specific config values here if needed
               // MIN_HORIZONTAL_GAP: 120,
               // MAX_PLATFORMS: 6,
           }
       );
       
       // Create base platform
       this.platformGenerator.createBasePlatform();
           
       // Create random platforms
       this.platformGenerator.createRandomPlatforms();

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

        // Bullets baby
        this.bullets = new BulletGroup(this);

        // Collision logic
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.bullets, this.platforms);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Main
        EventBus.emit('current-scene-ready', this);
    }

    update (time: number, delta: number)
    {
        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-160);
            this.playerDirection = 'left'
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(160);
            this.playerDirection = 'right'
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

        if (this.cursors.space.isDown && time > this.lastFired) {
            const bulletOffsetY = -10; // Adjust so bullet comes from gun position
            
            this.bullets.fireBullet(
                this.player.x, 
                this.player.y + bulletOffsetY, 
                this.playerDirection
            );
            
            this.lastFired = time + this.fireRate;
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
