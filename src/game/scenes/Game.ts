import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { config } from '../main'; 
import { BulletGroup } from '../objects/Bullet';


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

    createRandomPlatforms() {
        // Track placed platforms to check for gaps
        const placedPlatforms: { x: number; y: number; width: number; height: number }[] = [];
        
        // Number of platforms to generate
        let attemptsRemaining = PLATFORM_CONFIG.MAX_PLATFORMS * 2; // Allow extra attempts for finding valid positions
        let platformsCreated = 0;
        
        // Available area for platforms (above base platform)
        const baseY = this.HEIGHT - PLATFORM_CONFIG.BASE_HEIGHT;
        const minY = 100; // Keep platforms from being too high
        
        while (attemptsRemaining > 0 && platformsCreated < PLATFORM_CONFIG.MAX_PLATFORMS) {
            attemptsRemaining--;
            
            // Random scale for variety
            const scale = PLATFORM_CONFIG.MIN_SCALE + 
                (Math.random() * (PLATFORM_CONFIG.MAX_SCALE - PLATFORM_CONFIG.MIN_SCALE));
            
            // Calculate platform dimensions
            const platformWidth = PLATFORM_CONFIG.PLATFORM_WIDTH * scale;
            const platformHeight = PLATFORM_CONFIG.PLATFORM_HEIGHT * scale;
            
            // Random position
            const x = platformWidth/2 + Math.random() * (this.WIDTH - platformWidth);
            const y = minY + Math.random() * (baseY - minY - platformHeight);
            
            // Check if this position would be valid
            if (this.isValidPlatformPosition(x, y, platformWidth, platformHeight, placedPlatforms)) {
                // Create the platform
                const platform = this.platforms.create(x, y, 'ground').setScale(scale).refreshBody();
                
                // Track this platform
                placedPlatforms.push({
                    x: x,
                    y: y,
                    width: platformWidth,
                    height: platformHeight
                });
                
                platformsCreated++;
            }
        }
    }

    isValidPlatformPosition(x: number, y: number, width: number, height: number, 
        placedPlatforms: { x: number; y: number; width: number; height: number }[]): boolean {
            // Check for minimum distance from all existing platforms
            for (const platform of placedPlatforms) {
            // Calculate center-to-center distances
            const horizontalDistance = Math.abs(x - platform.x);
            const verticalDistance = Math.abs(y - platform.y);

            // Calculate minimum allowed distances (half of each platform width + gap)
            const minHorizontalDistance = (width/2 + platform.width/2) + PLATFORM_CONFIG.MIN_HORIZONTAL_GAP;
            const minVerticalDistance = (height/2 + platform.height/2) + PLATFORM_CONFIG.MIN_VERTICAL_GAP;

            // If both distances are less than minimum, there's a conflict
            if (horizontalDistance < minHorizontalDistance && verticalDistance < minVerticalDistance) {
                return false;
            }
        }

        return true;
    }

    create ()
    {
        // Setup
        this.camera = this.cameras.main;

        this.background = this.add.image(512, 384, 'background');

        // Platform logic
        this.platforms = this.physics.add.staticGroup();

        // base platform
        this.platforms.create(this.WIDTH / 2 , this.HEIGHT - PLATFORM_CONFIG.BASE_HEIGHT, 'ground')
            .setScale(2)
            .refreshBody();
        
        this.createRandomPlatforms()

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
