import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Enemy } from './enemy.js';

export class Room {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#gameCanvas'),
            antialias: true
        });
        
        // Movement states
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isJumping = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        // Player settings
        this.playerHeight = 1.8;
        this.moveSpeed = 10.0;
        this.jumpForce = 8.0;      // Reduced for better control
        this.gravity = 20.0;       // Increased for snappier falls
        this.airControl = 0.8;     // Increased air control
        this.minHeight = this.playerHeight;
        
        // Separate velocities for better control
        this.moveVelocity = new THREE.Vector3();
        this.jumpVelocity = new THREE.Vector3();
        
        // Set initial player position
        this.camera.position.set(0, this.playerHeight, 0);
        
        // Add collision properties
        this.walls = []; // Array to store all wall meshes
        this.collisionDistance = 0.5; // Distance to keep from walls
        this.raycaster = new THREE.Raycaster();
        this.moveDirection = new THREE.Vector3();
        
        // Add enemy property
        this.enemy = null;
        
        // Add selected enemy texture property
        this.selectedEnemyTexture = null;
        
        this.setupRoom();
        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        this.setupEnemySelection();
        this.spawnEnemy();
    }

    setupRoom() {
        // Create materials with adjusted properties
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.1,    // More glossy
            metalness: 0.2
        });

        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf5f5f5,   // Off-white color
            roughness: 0.8,    // More matte
            metalness: 0.1
        });

        // Room dimensions (make these class properties so we can access them elsewhere)
        this.roomWidth = 20;
        this.roomLength = 20;
        this.roomHeight = 6;
        this.hallwayWidth = 4;
        this.hallwayLength = 15;

        // Create central room
        this.createMainRoom(floorMaterial, wallMaterial);
        
        // Create hallways
        this.createHallways(floorMaterial, wallMaterial);
        
        // Add hallway signs
        this.createHallwaySigns();
    }

    createMainRoom(floorMaterial, wallMaterial) {
        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.roomWidth, this.roomLength),
            floorMaterial
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(this.roomWidth, this.roomLength),
            wallMaterial
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.roomHeight;
        this.scene.add(ceiling);

        // Create walls with openings for hallways
        this.createWallWithOpening(wallMaterial, 'north');
        this.createWallWithOpening(wallMaterial, 'south');
        this.createWallWithOpening(wallMaterial, 'east');
        this.createWallWithOpening(wallMaterial, 'west');

        // Add walls to collision array
        const walls = this.scene.children.filter(child => 
            child.isMesh && 
            child !== floor && 
            child !== ceiling
        );
        this.walls.push(...walls);
    }

    createWallWithOpening(material, direction) {
        const openingWidth = this.hallwayWidth;
        const wallSegmentGeometry = new THREE.PlaneGeometry(
            (this.roomWidth - openingWidth) / 2,
            this.roomHeight
        );

        // Create two wall segments for each wall (left and right of opening)
        const leftSegment = new THREE.Mesh(wallSegmentGeometry, material);
        const rightSegment = new THREE.Mesh(wallSegmentGeometry, material);

        switch(direction) {
            case 'north':
                leftSegment.position.set(-(this.roomWidth + openingWidth) / 4, this.roomHeight/2, -this.roomLength/2);
                rightSegment.position.set((this.roomWidth + openingWidth) / 4, this.roomHeight/2, -this.roomLength/2);
                break;
            case 'south':
                leftSegment.position.set(-(this.roomWidth + openingWidth) / 4, this.roomHeight/2, this.roomLength/2);
                rightSegment.position.set((this.roomWidth + openingWidth) / 4, this.roomHeight/2, this.roomLength/2);
                leftSegment.rotation.y = Math.PI;
                rightSegment.rotation.y = Math.PI;
                break;
            case 'east':
                leftSegment.position.set(this.roomWidth/2, this.roomHeight/2, -(this.roomLength + openingWidth) / 4);
                rightSegment.position.set(this.roomWidth/2, this.roomHeight/2, (this.roomLength + openingWidth) / 4);
                leftSegment.rotation.y = -Math.PI / 2;
                rightSegment.rotation.y = -Math.PI / 2;
                break;
            case 'west':
                leftSegment.position.set(-this.roomWidth/2, this.roomHeight/2, -(this.roomLength + openingWidth) / 4);
                rightSegment.position.set(-this.roomWidth/2, this.roomHeight/2, (this.roomLength + openingWidth) / 4);
                leftSegment.rotation.y = Math.PI / 2;
                rightSegment.rotation.y = Math.PI / 2;
                break;
        }

        this.scene.add(leftSegment);
        this.scene.add(rightSegment);
    }

    createHallways(floorMaterial, wallMaterial) {
        // Create base materials for variations
        const materials = {
            standard: {
                floor: new THREE.MeshStandardMaterial({ 
                    color: 0xffffff,
                    roughness: 0.1,
                    metalness: 0.2
                }),
                wall: new THREE.MeshStandardMaterial({ 
                    color: 0xf5f5f5,
                    roughness: 0.8,
                    metalness: 0.1
                })
            },
            industrial: {
                floor: new THREE.MeshStandardMaterial({ 
                    color: 0xcccccc,
                    roughness: 0.7,
                    metalness: 0.5
                }),
                wall: new THREE.MeshStandardMaterial({ 
                    color: 0xe0e0e0,
                    roughness: 0.9,
                    metalness: 0.3
                })
            },
            clinical: {
                floor: new THREE.MeshStandardMaterial({ 
                    color: 0xffffff,
                    roughness: 0.05,
                    metalness: 0.8
                }),
                wall: new THREE.MeshStandardMaterial({ 
                    color: 0xffffff,
                    roughness: 0.2,
                    metalness: 0.4
                })
            },
            abandoned: {
                floor: new THREE.MeshStandardMaterial({ 
                    color: 0xe8e8e8,
                    roughness: 0.9,
                    metalness: 0.1
                }),
                wall: new THREE.MeshStandardMaterial({ 
                    color: 0xf0f0f0,
                    roughness: 1.0,
                    metalness: 0.0
                })
            }
        };

        // Create each hallway with its unique style
        this.createHallway('north', materials.standard, this.hallwayLength); // Original style
        this.createHallway('east', materials.clinical, this.hallwayLength);  // Clinical/sterile style
        this.createHallway('south', materials.industrial, this.hallwayLength); // Industrial style
        this.createHallway('west', materials.abandoned, this.hallwayLength * 3);  // Extended abandoned style with flickering lights
    }

    createHallway(direction, materials, length = this.hallwayLength) {
        // Create hallway floor
        const hallwayFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.hallwayWidth, length),
            materials.floor
        );
        hallwayFloor.rotation.x = -Math.PI / 2;

        // Create hallway ceiling
        const hallwayCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(this.hallwayWidth, length),
            materials.wall
        );
        hallwayCeiling.rotation.x = Math.PI / 2;
        hallwayCeiling.position.y = this.roomHeight;

        // Create hallway walls
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(length, this.roomHeight),
            materials.wall
        );
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(length, this.roomHeight),
            materials.wall
        );

        // Position hallway elements based on direction
        switch(direction) {
            case 'north':
                hallwayFloor.position.set(0, 0, -(this.roomLength/2 + length/2));
                hallwayCeiling.position.set(0, this.roomHeight, -(this.roomLength/2 + length/2));
                leftWall.position.set(-this.hallwayWidth/2, this.roomHeight/2, -(this.roomLength/2 + length/2));
                rightWall.position.set(this.hallwayWidth/2, this.roomHeight/2, -(this.roomLength/2 + length/2));
                leftWall.rotation.y = Math.PI / 2;
                rightWall.rotation.y = -Math.PI / 2;
                break;
            case 'south':
                hallwayFloor.position.set(0, 0, this.roomLength/2 + length/2);
                hallwayCeiling.position.set(0, this.roomHeight, this.roomLength/2 + length/2);
                leftWall.position.set(-this.hallwayWidth/2, this.roomHeight/2, this.roomLength/2 + length/2);
                rightWall.position.set(this.hallwayWidth/2, this.roomHeight/2, this.roomLength/2 + length/2);
                leftWall.rotation.y = Math.PI / 2;
                rightWall.rotation.y = -Math.PI / 2;
                break;
            case 'east':
                hallwayFloor.rotation.z = Math.PI / 2;
                hallwayCeiling.rotation.z = Math.PI / 2;
                hallwayFloor.position.set(this.roomWidth/2 + length/2, 0, 0);
                hallwayCeiling.position.set(this.roomWidth/2 + length/2, this.roomHeight, 0);
                leftWall.position.set(this.roomWidth/2 + length/2, this.roomHeight/2, -this.hallwayWidth/2);
                rightWall.position.set(this.roomWidth/2 + length/2, this.roomHeight/2, this.hallwayWidth/2);
                leftWall.rotation.y = 0;
                rightWall.rotation.y = Math.PI;
                break;
            case 'west':
                hallwayFloor.rotation.z = Math.PI / 2;
                hallwayCeiling.rotation.z = Math.PI / 2;
                hallwayFloor.position.set(-(this.roomWidth/2 + length/2), 0, 0);
                hallwayCeiling.position.set(-(this.roomWidth/2 + length/2), this.roomHeight, 0);
                
                // Fix wall positions and rotations
                leftWall.position.set(-(this.roomWidth/2 + length/2), this.roomHeight/2, -this.hallwayWidth/2);
                rightWall.position.set(-(this.roomWidth/2 + length/2), this.roomHeight/2, this.hallwayWidth/2);
                leftWall.rotation.y = 0;  // Changed from Math.PI / 2
                rightWall.rotation.y = Math.PI;  // Changed from Math.PI / 2
                break;
        }

        this.scene.add(hallwayFloor);
        this.scene.add(hallwayCeiling);
        this.scene.add(leftWall);
        this.scene.add(rightWall);

        // Add walls to collision array
        this.walls.push(leftWall, rightWall);

        // Update light placement for abandoned hallway
        if (direction === 'west') {
            const lightSpacing = 7;
            const numLights = Math.floor(length / lightSpacing);
            for (let i = 0; i < numLights; i++) {
                const lightPosition = -(this.roomWidth/2 + (i + 0.5) * lightSpacing);
                this.addAbandonedLight(lightPosition, this.roomHeight, 0);
            }
        }
    }

    createHallwaySigns() {
        const signs = [
            { 
                name: 'STANDARD', 
                position: [0, this.roomHeight - 0.5, -this.roomLength/2 - 0.1], 
                rotation: 0,
                color: 0x2196F3  // Original blue
            },
            { 
                name: 'CLINICAL', 
                position: [this.roomWidth/2 + 0.1, this.roomHeight - 0.5, 0], 
                rotation: -Math.PI/2,
                color: 0x4CAF50  // Green
            },
            { 
                name: 'INDUSTRIAL', 
                position: [0, this.roomHeight - 0.5, this.roomLength/2 + 0.1], 
                rotation: Math.PI,
                color: 0xFF9800  // Orange
            },
            { 
                name: 'ABANDONED', 
                position: [-this.roomWidth/2 - 0.1, this.roomHeight - 0.5, 0], 
                rotation: Math.PI/2,
                color: 0x9C27B0  // Purple
            }
        ];

        signs.forEach(sign => {
            const signBackground = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 0.6),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            
            const signBorder = new THREE.Mesh(
                new THREE.PlaneGeometry(1.8, 0.4),
                new THREE.MeshStandardMaterial({ color: sign.color })
            );
            
            signBackground.position.set(...sign.position);
            signBorder.position.set(...sign.position);
            
            signBackground.rotation.y = sign.rotation;
            signBorder.rotation.y = sign.rotation;
            
            signBorder.position.z += Math.cos(sign.rotation) * 0.01;
            signBorder.position.x += Math.sin(sign.rotation) * 0.01;

            this.scene.add(signBackground);
            this.scene.add(signBorder);
        });
    }

    setupLights() {
        // Main room light remains the same
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        this.addFluorescentLight(0, this.roomHeight, 0, 1.2);

        // Standard hallway (North) - Original warm fluorescent
        this.addFluorescentLight(0, this.roomHeight, -(this.roomLength/2 + 7/2), 0.9);
        this.addFluorescentLight(0, this.roomHeight, -(this.roomLength/2 + this.hallwayLength - 7/2), 0.9);

        // Clinical hallway (East) - Bright, cold lights
        this.addClinicalLight((this.roomWidth/2 + 7/2), this.roomHeight, 0);
        this.addClinicalLight((this.roomWidth/2 + this.hallwayLength - 7/2), this.roomHeight, 0);

        // Industrial hallway (South) - Sodium vapor style
        this.addIndustrialLight(0, this.roomHeight, (this.roomLength/2 + 7/2));
        this.addIndustrialLight(0, this.roomHeight, (this.roomLength/2 + this.hallwayLength - 7/2));

        // Abandoned hallway (West) - Flickering, dim light
        this.addAbandonedLight(-(this.roomWidth/2 + 7/2), this.roomHeight, 0);
        this.addAbandonedLight(-(this.roomWidth/2 + this.hallwayLength - 7/2), this.roomHeight, 0);
    }

    addFluorescentLight(x, y, z, intensity = 1.0) {
        // Create fluorescent fixture with brighter emissive
        const fixtureGeometry = new THREE.BoxGeometry(4, 0.2, 1);
        const fixtureMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.4  // Increased from 0.3
        });

        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixture.position.set(x, y - 0.1, z);
        this.scene.add(fixture);

        // Adjust light color to be slightly warmer
        const light = new THREE.PointLight(0xfff5e6, intensity, 15, 2);
        light.position.set(x, y - 0.3, z);
        this.scene.add(light);

        // Adjust glow effect
        const glowGeometry = new THREE.PlaneGeometry(5, 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff5e6,
            transparent: true,
            opacity: 0.2,  // Increased from 0.15
            side: THREE.DoubleSide
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, y - 0.15, z);
        glow.rotation.x = Math.PI / 2;
        this.scene.add(glow);
    }

    // New light types
    addClinicalLight(x, y, z) {
        const light = new THREE.PointLight(0xd4ebf2, 1.1, 12, 2);
        light.position.set(x, y - 0.3, z);
        this.scene.add(light);

        const fixture = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.2, 1),
            new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                emissive: 0xd4ebf2,
                emissiveIntensity: 0.6
            })
        );
        fixture.position.set(x, y - 0.1, z);
        this.scene.add(fixture);
    }

    addIndustrialLight(x, y, z) {
        const light = new THREE.PointLight(0xffd700, 0.8, 18, 1);
        light.position.set(x, y - 0.3, z);
        this.scene.add(light);

        const fixture = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.4),
            new THREE.MeshStandardMaterial({ 
                color: 0x808080,
                emissive: 0xffd700,
                emissiveIntensity: 0.3
            })
        );
        fixture.position.set(x, y - 0.2, z);
        this.scene.add(fixture);
    }

    addAbandonedLight(x, y, z) {
        const light = new THREE.PointLight(0xe6e6e6, 0.6, 10, 2);
        light.position.set(x, y - 0.3, z);
        this.scene.add(light);
        
        // Add flickering effect
        const intensity = { value: 0.6 };
        const flickerAnimation = () => {
            if (Math.random() > 0.95) {
                intensity.value = 0.2 + Math.random() * 0.4;
                light.intensity = intensity.value;
                setTimeout(() => {
                    intensity.value = 0.6;
                    light.intensity = intensity.value;
                }, 100);
            }
            requestAnimationFrame(flickerAnimation);
        };
        flickerAnimation();

        const fixture = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.2, 1),
            new THREE.MeshStandardMaterial({ 
                color: 0xcccccc,
                emissive: 0xe6e6e6,
                emissiveIntensity: 0.2
            })
        );
        fixture.position.set(x, y - 0.1, z);
        this.scene.add(fixture);
    }

    setupControls() {
        this.controls = new PointerLockControls(this.camera, document.body);
        this.camera.position.y = this.playerHeight;

        // Add pointer lock event handlers
        this.controls.addEventListener('lock', () => {
            console.log('Controls locked');
        });

        this.controls.addEventListener('unlock', () => {
            console.log('Controls unlocked');
        });
    }

    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Movement controls
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (!this.isJumping && this.camera.position.y <= this.minHeight) {
                        this.jumpVelocity.y = this.jumpForce;
                        this.isJumping = true;
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        // Make sure we're adding the event listeners to the document
        document.addEventListener('keydown', onKeyDown.bind(this));
        document.addEventListener('keyup', onKeyUp.bind(this));
    }

    setupEnemySelection() {
        const enemyOptions = document.querySelectorAll('.enemy-option');
        const startButton = document.getElementById('start-button');
        const customEnemyInput = document.getElementById('custom-enemy');
        
        // Enable start button immediately and select first enemy by default
        startButton.disabled = false;
        this.selectedEnemyTexture = enemyOptions[0].querySelector('img').src;
        enemyOptions[0].classList.add('selected');
        
        // Handle pre-made enemy selection
        enemyOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                enemyOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
                
                const input = option.querySelector('input');
                if (input) {
                    input.click();
                } else {
                    const enemyImg = option.querySelector('img');
                    this.selectedEnemyTexture = enemyImg.src;
                    startButton.disabled = false;
                }
            });
        });
        
        // Handle custom enemy upload
        customEnemyInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.selectedEnemyTexture = e.target.result;
                    // Update the preview image
                    const previewImg = customEnemyInput.parentElement.querySelector('.upload-preview');
                    if (previewImg) {
                        previewImg.src = e.target.result;
                    }
                    startButton.disabled = false;
                    
                    // Select this option
                    enemyOptions.forEach(opt => opt.classList.remove('selected'));
                    customEnemyInput.closest('.enemy-option').classList.add('selected');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    checkCollision(proposedPosition, moveDirection) {
        // Add diagonal directions for corner checking
        const directions = [
            moveDirection,                          // Movement direction
            moveDirection.clone().cross(new THREE.Vector3(0, 1, 0)), // Perpendicular to movement
            new THREE.Vector3(1, 0, 0),            // Right
            new THREE.Vector3(-1, 0, 0),           // Left
            new THREE.Vector3(0, 0, 1),            // Forward
            new THREE.Vector3(0, 0, -1),           // Backward
            new THREE.Vector3(1, 0, 1).normalize(), // Diagonal forward-right
            new THREE.Vector3(-1, 0, 1).normalize(), // Diagonal forward-left
            new THREE.Vector3(1, 0, -1).normalize(), // Diagonal back-right
            new THREE.Vector3(-1, 0, -1).normalize() // Diagonal back-left
        ];

        let closestIntersection = null;
        let closestDistance = Infinity;

        for (const direction of directions) {
            direction.normalize();
            this.raycaster.set(proposedPosition, direction);
            const intersects = this.raycaster.intersectObjects(this.walls);
            
            if (intersects.length > 0) {
                const distance = intersects[0].distance;
                // Increase minimum collision distance for corners
                const minDistance = direction.equals(moveDirection) ? this.collisionDistance : this.collisionDistance * 1.5;
                
                if (distance < minDistance && distance < closestDistance) {
                    closestDistance = distance;
                    closestIntersection = intersects[0];
                }
            }
        }

        if (closestIntersection) {
            // Get the normal of the wall we're colliding with
            const wallNormal = closestIntersection.face.normal.clone();
            wallNormal.applyQuaternion(closestIntersection.object.quaternion);
            
            // If we're moving into the wall (dot product is negative)
            const movingIntoWall = moveDirection.dot(wallNormal) < 0;
            
            if (movingIntoWall) {
                // Project the movement direction onto the wall plane
                const wallProjection = new THREE.Vector3();
                wallProjection.copy(moveDirection);
                wallProjection.addScaledVector(wallNormal, -moveDirection.dot(wallNormal));
                wallProjection.normalize();
                
                // Reduce sliding speed more aggressively near corners
                const cornerFactor = Math.pow(closestDistance / this.collisionDistance, 2);
                wallProjection.multiplyScalar(cornerFactor * 0.8); // Further reduce sliding speed
                
                return { collision: true, slideDirection: wallProjection };
            }
        }
        return { collision: false };
    }

    spawnEnemy() {
        console.log('Spawning enemy with texture:', this.selectedEnemyTexture); // Debug log
        const enemyPosition = new THREE.Vector3(0, 1.5, -5);
        this.enemy = new Enemy(
            this.scene, 
            enemyPosition, 
            this.walls,
            this.selectedEnemyTexture
        );
    }

    update(deltaTime) {
        if (this.controls.isLocked) {
            const delta = deltaTime / 1000;

            // Handle horizontal movement
            this.moveVelocity.x = 0;
            this.moveVelocity.z = 0;

            // Set direction based on keys
            if (this.moveForward) this.moveVelocity.z = -1;
            if (this.moveBackward) this.moveVelocity.z = 1;
            if (this.moveLeft) this.moveVelocity.x = -1;
            if (this.moveRight) this.moveVelocity.x = 1;

            // Normalize and apply movement
            if (this.moveVelocity.x !== 0 || this.moveVelocity.z !== 0) {
                this.moveVelocity.normalize();
                
                // Calculate proposed position
                const currentPosition = this.camera.position.clone();
                const moveSpeed = this.moveSpeed * (this.isJumping ? this.airControl : 1.0) * delta;
                
                // Combined movement direction
                const moveDirection = new THREE.Vector3();
                
                // Add forward/backward movement
                if (this.moveVelocity.z !== 0) {
                    const forwardDirection = new THREE.Vector3(0, 0, this.moveVelocity.z);
                    forwardDirection.applyQuaternion(this.camera.quaternion);
                    forwardDirection.y = 0;
                    moveDirection.add(forwardDirection);
                }
                
                // Add left/right movement
                if (this.moveVelocity.x !== 0) {
                    const rightDirection = new THREE.Vector3(this.moveVelocity.x, 0, 0);
                    rightDirection.applyQuaternion(this.camera.quaternion);
                    rightDirection.y = 0;
                    moveDirection.add(rightDirection);
                }
                
                moveDirection.normalize();
                
                // Calculate proposed position
                const proposedPosition = currentPosition.clone();
                proposedPosition.addScaledVector(moveDirection, moveSpeed);
                
                // Check collision and get sliding direction if needed
                const collisionResult = this.checkCollision(proposedPosition, moveDirection);
                
                if (!collisionResult.collision) {
                    // No collision, move normally
                    this.camera.position.copy(proposedPosition);
                } else if (collisionResult.slideDirection) {
                    // Slide along the wall
                    const slideMovement = collisionResult.slideDirection.multiplyScalar(moveSpeed);
                    this.camera.position.add(slideMovement);
                }
            }

            // Handle vertical movement (jumping and gravity)
            this.jumpVelocity.y -= this.gravity * delta;
            
            // Check vertical collision before applying
            const proposedY = this.camera.position.y + this.jumpVelocity.y * delta;
            if (proposedY > this.minHeight) {
                this.camera.position.y = proposedY;
            } else {
                this.camera.position.y = this.minHeight;
                this.jumpVelocity.y = 0;
                this.isJumping = false;
            }

            // Ceiling collision
            if (this.camera.position.y >= this.roomHeight - 0.5) {
                this.camera.position.y = this.roomHeight - 0.5;
                this.jumpVelocity.y = 0;
            }

            // Adjust collision distance based on speed
            const speed = this.moveVelocity.length();
            this.collisionDistance = 0.5 + (speed * delta); // Increase collision distance at higher speeds

            // Update enemy with delta time
            if (this.enemy) {
                this.enemy.update(this.camera.position, delta);
            }
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        // Add click handler for the game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Initial render
        this.render();
    }
} 