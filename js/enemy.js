import * as THREE from 'three';

export class Enemy {
    constructor(scene, position = new THREE.Vector3(0, 1.5, -5), walls = [], textureUrl = null) {
        console.log('Enemy constructor called with:', {
            position: position.toArray(),
            hasWalls: walls.length > 0,
            textureUrl: textureUrl ? 'Provided' : 'None'
        });
        
        this.scene = scene;
        this.walls = walls;
        
        // Create a plane geometry (2 units tall, 1 unit wide)
        const geometry = new THREE.PlaneGeometry(1, 2);
        
        // Create temporary white material (visible while texture loads)
        const tempMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000, // Red material to make it obvious
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, tempMaterial);
        this.mesh.position.copy(position);
        scene.add(this.mesh);

        // Log the scale of the mesh
        console.log('Enemy mesh created with:', {
            scale: this.mesh.scale.toArray(),
            visible: this.mesh.visible,
            position: this.mesh.position.toArray()
        });

        // Load texture if provided
        if (textureUrl) {
            this.loadTextureWithFallback(textureUrl);
        }
        
        // Movement properties
        this.moveSpeed = 4.0;
        this.minDistanceToPlayer = 1.0;
        
        // Health properties (needed for draw method)
        this.health = 100;
        this.radius = 1; // Default radius for drawing
    }

    /**
     * Loads a texture with improved error handling and CORS support
     */
    loadTextureWithFallback(textureUrl) {
        console.log('Loading enemy texture from URL:', textureUrl);
        
        // Create a new texture loader with proper settings
        const loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';
        
        // For data URIs and regular URLs
        loader.load(
            textureUrl,
            (texture) => {
                console.log('Enemy texture loaded successfully');
                
                // Apply appropriate texture settings
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                
                // Get texture dimensions for proper aspect ratio
                const image = texture.image;
                let aspectRatio = 1;
                
                if (image) {
                    aspectRatio = image.width / image.height;
                    console.log('Enemy texture dimensions:', {
                        width: image.width, 
                        height: image.height, 
                        aspectRatio
                    });
                }
                
                this.applyTexture(texture, aspectRatio);
            },
            (progress) => {
                if (progress.lengthComputable) {
                    console.log('Enemy texture loading progress:', 
                        Math.round((progress.loaded / progress.total) * 100) + '%');
                }
            },
            (error) => {
                console.error('Error loading enemy texture:', error);
                this.applyFallbackMaterial();
                // Try backup method if regular loading fails
                this.loadTextureManually(textureUrl);
            }
        );
    }
    
    /**
     * Alternative approach using manual image loading
     * This can sometimes bypass CORS issues
     */
    loadTextureManually(textureUrl) {
        console.log('Attempting manual loading of texture:', textureUrl);
        
        // Create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Set up event handlers
        img.onload = () => {
            console.log('Image manually loaded successfully:', img.width, 'x', img.height);
            
            try {
                // Create texture from loaded image
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                texture.minFilter = THREE.LinearFilter; // Avoid mipmap requirement
                
                this.applyTexture(texture, img.width / img.height);
            } catch (e) {
                console.error('Error creating texture from manually loaded image:', e);
                this.applyFallbackMaterial();
            }
        };
        
        img.onerror = (err) => {
            console.error('Error manually loading image:', err);
            this.applyFallbackMaterial();
        };
        
        // Start image loading
        img.src = textureUrl;
    }
    
    /**
     * Apply the successfully loaded texture to the mesh with proper material settings
     */
    applyTexture(texture, aspectRatio) {
        // Scale mesh to match image aspect ratio while maintaining height
        this.mesh.scale.x = aspectRatio;
        
        // Create and apply new material with loaded texture
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5 // Helps with transparency artifacts
        });

        // Dispose of old material and apply new one
        if (this.mesh.material) {
            this.mesh.material.dispose();
        }
        this.mesh.material = material;
        
        console.log('Enemy material updated with texture, new scale:', this.mesh.scale.toArray());
    }
    
    /**
     * Apply a fallback material if texture loading fails
     */
    applyFallbackMaterial() {
        console.log('Applying fallback material to enemy');
        
        const fallbackMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000, // Red color to make it visible
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: true // Show wireframe to make it more obvious
        });
        
        if (this.mesh.material) {
            this.mesh.material.dispose();
        }
        this.mesh.material = fallbackMaterial;
    }

    update(playerPosition, deltaTime) {
        if (!playerPosition) {
            console.warn('Enemy update called without valid playerPosition');
            return;
        }
        
        // Make enemy always face the player
        const directionToPlayer = new THREE.Vector3()
            .subVectors(playerPosition, this.mesh.position);
        const angle = Math.atan2(directionToPlayer.x, directionToPlayer.z);
        this.mesh.rotation.y = angle;

        // Move towards player if not too close
        const distanceToPlayer = directionToPlayer.length();
        
        // Uncomment this to enable movement when ready
    
        if (distanceToPlayer > this.minDistanceToPlayer) {
            const moveDirection = directionToPlayer.normalize();
            this.mesh.position.add(
                moveDirection.multiplyScalar(this.moveSpeed * deltaTime)
            );
        }
        
        
        // Add debug logs for tracking enemy in scene
        if (Math.random() < 0.01) { // Log occasionally to avoid console spam
            console.log('Enemy update:', {
                position: this.mesh.position.toArray(),
                distanceToPlayer,
                isVisible: this.mesh.visible,
                inScene: this.scene.children.includes(this.mesh)
            });
        }
    }

    checkCollision(proposedPosition, moveDirection) {
        // Initialize raycaster if it doesn't exist
        if (!this.raycaster) {
            console.log('Creating raycaster for enemy collision detection');
            this.raycaster = new THREE.Raycaster();
            this.collisionDistance = 0.5; // Default collision distance
        }
        
        // Check in multiple directions for better collision detection
        const directions = [
            moveDirection,
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(1, 0, 1).normalize(),
            new THREE.Vector3(-1, 0, 1).normalize(),
            new THREE.Vector3(1, 0, -1).normalize(),
            new THREE.Vector3(-1, 0, -1).normalize()
        ];

        for (const direction of directions) {
            this.raycaster.set(proposedPosition, direction.normalize());
            const intersects = this.raycaster.intersectObjects(this.walls);
            
            if (intersects.length > 0 && intersects[0].distance < this.collisionDistance) {
                return true;
            }
        }
        return false;
    }

    findAlternativePath(currentPosition, targetPosition) {
        // Try different angles to find a clear path
        const angleOffsets = [0, Math.PI/4, -Math.PI/4, Math.PI/2, -Math.PI/2];
        const direction = new THREE.Vector3().subVectors(targetPosition, currentPosition).normalize();
        
        for (const angleOffset of angleOffsets) {
            const testDirection = direction.clone();
            testDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
            
            const testPosition = currentPosition.clone().add(
                testDirection.multiplyScalar(this.moveSpeed/2)
            );
            
            if (!this.checkCollision(testPosition, testDirection)) {
                return testDirection;
            }
        }
        
        return null; // No clear path found
    }

    draw(ctx) {
        if (!ctx) {
            console.warn('Enemy draw called without valid context');
            return;
        }
        
        // Draw enemy
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar
        const healthBarWidth = 40;
        const healthBarHeight = 5;
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - 30, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - 30, (this.health/100) * healthBarWidth, healthBarHeight);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }
    
    /**
     * Helper method to test texture loading separately
     * Call this method to debug texture issues
     */
    static testTextureLoading(url) {
        console.log('Testing texture:', url);
        
        // 1. Test with regular Image loading
        const startTime = performance.now();
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const loadTime = performance.now() - startTime;
            console.log(`✅ Image loaded: ${img.width}x${img.height} (${loadTime.toFixed(2)}ms)`);
            
            // Create canvas to test if image data is valid
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            try {
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, 1, 1);
                console.log('Image data test:', imageData.data);
            } catch (e) {
                console.error('❌ Canvas drawing failed - possible tainted canvas:', e);
                console.log('This indicates a CORS issue with the image source');
            }
        };
        
        img.onerror = (err) => {
            console.error('❌ Image load failed:', err);
        };
        
        img.src = url;
        
        // 2. Test with Three.js TextureLoader if THREE is available
        if (typeof THREE !== 'undefined' && THREE.TextureLoader) {
            const loader = new THREE.TextureLoader();
            loader.crossOrigin = 'anonymous';
            
            loader.load(
                url,
                (texture) => {
                    console.log('✅ THREE.js texture loaded:', texture);
                    console.log('Texture image:', texture.image.width, 'x', texture.image.height);
                    
                    // Test creating material with texture
                    const material = new THREE.MeshBasicMaterial({ map: texture });
                    console.log('Material created successfully with texture');
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        console.log(`THREE.js loading: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                    }
                },
                (error) => {
                    console.error('❌ THREE.js texture loading failed:', error);
                }
            );
        } else {
            console.log('THREE.js not found, skipping TextureLoader test');
        }
    }
}