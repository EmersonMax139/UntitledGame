import { Scene } from 'phaser';

// Platform configuration type
export interface PlatformConfig {
    MAX_PLATFORMS: number;
    MIN_HORIZONTAL_GAP: number;
    MIN_VERTICAL_GAP: number;
    PLATFORM_WIDTH: number;
    PLATFORM_HEIGHT: number;
    BASE_HEIGHT: number;
    MIN_SCALE: number;
    MAX_SCALE: number;
}

// Default platform configuration
export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
    MAX_PLATFORMS: 5,        // Maximum number of platforms to attempt to place
    MIN_HORIZONTAL_GAP: 100, // Minimum horizontal gap between platforms
    MIN_VERTICAL_GAP: 150,    // Minimum vertical gap between platforms
    PLATFORM_WIDTH: 150,     // Approximate width of platform sprite when scaled to 1
    PLATFORM_HEIGHT: 32,     // Approximate height of platform sprite when scaled to 1
    BASE_HEIGHT: 100,         // Height of base platform from bottom of screen
    MIN_SCALE: 1,          // Minimum platform scale
    MAX_SCALE: 2,           // Maximum platform scale
};

// Platform positions tracker type
export interface PlatformPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class PlatformGenerator {
    private scene: Scene;
    private width: number;
    private height: number;
    private config: PlatformConfig;
    private platformGroup: Phaser.Physics.Arcade.StaticGroup;
    private basePlatform: PlatformPosition | null = null;
    
    constructor(
        scene: Scene, 
        platformGroup: Phaser.Physics.Arcade.StaticGroup,
        config: PlatformConfig = DEFAULT_PLATFORM_CONFIG
    ) {
        this.scene = scene;
        this.width = scene.game.config.width as number;
        this.height = scene.game.config.height as number;
        this.config = config;
        this.platformGroup = platformGroup;
    }
    
    /**
     * Creates the base platform at the bottom of the screen
     */
    createBasePlatform(): Phaser.GameObjects.GameObject {
        const baseScale = 2;
        const basePlatform = this.platformGroup.create(
            200, 
            this.height - this.config.BASE_HEIGHT, 
            'ground'
        ).setScale(baseScale).refreshBody();
        
        // Add the base platform to the tracking array for validation
        this.basePlatform = {
            x: 200,
            y: this.height - this.config.BASE_HEIGHT,
            width: this.config.PLATFORM_WIDTH * baseScale,
            height: this.config.PLATFORM_HEIGHT * baseScale
        };
        
        return basePlatform;
    }
    
    /**
     * Creates randomly positioned platforms above the base platform
     */
    createRandomPlatforms(): Phaser.GameObjects.GameObject[] {
        // Track placed platforms to check for gaps
        const placedPlatforms: PlatformPosition[] = [];
        
        // Add base platform to the tracking array if it exists
        if (this.basePlatform) {
            placedPlatforms.push(this.basePlatform);
        }
        
        const createdPlatforms: Phaser.GameObjects.GameObject[] = [];
        
        // Number of platforms to generate
        let attemptsRemaining = this.config.MAX_PLATFORMS * 2; // Allow extra attempts
        let platformsCreated = 0;
        
        // Available area for platforms (above base platform)
        const baseY = this.height - this.config.BASE_HEIGHT;
        const minY = 100; // Keep platforms from being too high
        
        while (attemptsRemaining > 0 && platformsCreated < this.config.MAX_PLATFORMS) {
            attemptsRemaining--;
            
            // Random scale for variety
            const scale = this.config.MIN_SCALE + 
                (Math.random() * (this.config.MAX_SCALE - this.config.MIN_SCALE));
            
            // Calculate platform dimensions
            const platformWidth = this.config.PLATFORM_WIDTH * scale;
            const platformHeight = this.config.PLATFORM_HEIGHT * scale;
            
            // Random position
            const x = platformWidth/2 + Math.random() * (this.width - platformWidth);
            const y = minY + Math.random() * (baseY - minY - platformHeight);
            
            // Check if this position would be valid
            if (this.isValidPlatformPosition(x, y, platformWidth, platformHeight, placedPlatforms)) {
                // Create the platform
                const platform = this.platformGroup.create(x, y, 'ground').setScale(scale).refreshBody();
                
                // Track this platform
                placedPlatforms.push({
                    x: x,
                    y: y,
                    width: platformWidth,
                    height: platformHeight
                });
                
                createdPlatforms.push(platform);
                platformsCreated++;
            }
        }
        
        return createdPlatforms;
    }
    
    /**
     * Checks if a platform position is valid (maintaining minimum gaps)
     */
    private isValidPlatformPosition(
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        placedPlatforms: PlatformPosition[]
    ): boolean {
        // Check for minimum distance from all existing platforms
        for (const platform of placedPlatforms) {
            // Calculate center-to-center distances
            const horizontalDistance = Math.abs(x - platform.x);
            const verticalDistance = Math.abs(y - platform.y);
            
            // Calculate minimum allowed distances (half of each platform width + gap)
            const minHorizontalDistance = (width/2 + platform.width/2) + this.config.MIN_HORIZONTAL_GAP;
            
            // For vertical distance, use different gap rules for base platform
            const isBasePlatform = platform === this.basePlatform;
            const verticalGap = isBasePlatform ? this.config.MIN_VERTICAL_GAP * 1.5 : this.config.MIN_VERTICAL_GAP;
            const minVerticalDistance = (height/2 + platform.height/2) + verticalGap;
            
            // If both distances are less than minimum, there's a conflict
            if (horizontalDistance < minHorizontalDistance && verticalDistance < minVerticalDistance) {
                return false;
            }
        }
        
        return true;
    }
}