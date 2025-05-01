// textureDebugger.js
// This utility helps diagnose texture loading issues in THREE.js

export class TextureDebugger {
    constructor() {
        // Create diagnostic UI container
        this.createUI();
        
        // Store a list of textures we've tested
        this.testedTextures = [];
    }
    
    createUI() {
        // Create UI container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.color = 'white';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.maxWidth = '400px';
        container.style.maxHeight = '80vh';
        container.style.overflowY = 'auto';
        container.style.fontFamily = 'monospace';
        container.style.fontSize = '12px';
        container.style.zIndex = '9999';
        
        // Add header
        const header = document.createElement('h3');
        header.textContent = 'Texture Debugger';
        header.style.margin = '0 0 10px 0';
        container.appendChild(header);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.addEventListener('click', () => {
            container.style.display = 'none';
        });
        container.appendChild(closeButton);
        
        // Add content area
        this.content = document.createElement('div');
        container.appendChild(this.content);
        
        // Add input field and test button for testing URLs
        const inputArea = document.createElement('div');
        inputArea.style.marginTop = '10px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter texture URL or data URI';
        input.style.width = '100%';
        input.style.marginBottom = '5px';
        inputArea.appendChild(input);
        
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Texture';
        testButton.style.marginRight = '5px';
        testButton.addEventListener('click', () => {
            this.testTexture(input.value);
        });
        inputArea.appendChild(testButton);
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        const fileButton = document.createElement('button');
        fileButton.textContent = 'Test Local File';
        fileButton.addEventListener('click', () => {
            fileInput.click();
        });
        inputArea.appendChild(fileButton);
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.testTexture(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
        
        container.appendChild(inputArea);
        inputArea.appendChild(fileInput);
        
        // Add container to document
        document.body.appendChild(container);
        this.container = container;
    }
    
    log(message, type = 'info') {
        const line = document.createElement('div');
        line.style.marginBottom = '5px';
        line.style.wordBreak = 'break-all';
        
        switch(type) {
            case 'error':
                line.style.color = '#ff5555';
                break;
            case 'success':
                line.style.color = '#55ff55';
                break;
            case 'warning':
                line.style.color = '#ffff55';
                break;
            default:
                line.style.color = '#ffffff';
        }
        
        line.textContent = message;
        this.content.appendChild(line);
        this.content.scrollTop = this.content.scrollHeight;
        
        // Also log to console
        if (type === 'error') {
            console.error(message);
        } else {
            console.log(message);
        }
    }
    
    testTexture(url) {
        if (!url) {
            this.log('No URL provided', 'error');
            return;
        }
        
        // Add to tested list
        if (!this.testedTextures.includes(url)) {
            this.testedTextures.push(url);
        }
        
        this.log(`Testing texture: ${url.substring(0, 50)}...`);
        
        // Test with Image object first
        this.testWithImage(url);
        
        // Test with THREE.js TextureLoader
        this.testWithTextureLoader(url);
    }
    
    testWithImage(url) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        const startTime = performance.now();
        
        img.onload = () => {
            const loadTime = (performance.now() - startTime).toFixed(2);
            this.log(`✅ Image loaded: ${img.width}x${img.height} (${loadTime}ms)`, 'success');
            
            // Create a preview
            this.createPreview(img);
        };
        
        img.onerror = (err) => {
            this.log(`❌ Image failed to load`, 'error');
            console.error('Image load error:', err);
        };
        
        img.src = url;
    }
    
    testWithTextureLoader(url) {
        // Skip TextureLoader test for data URIs as we already tested with Image
        if (url.startsWith('data:')) {
            return;
        }
        
        // If THREE.js is not available
        if (typeof THREE === 'undefined') {
            this.log('THREE.js not found, skipping TextureLoader test', 'warning');
            return;
        }
        
        const loader = new THREE.TextureLoader();
        loader.crossOrigin = 'Anonymous';
        
        const startTime = performance.now();
        
        loader.load(
            url,
            (texture) => {
                const loadTime = (performance.now() - startTime).toFixed(2);
                this.log(`✅ TextureLoader success: ${texture.image.width}x${texture.image.height} (${loadTime}ms)`, 'success');
            },
            (progress) => {
                if (progress.lengthComputable) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    this.log(`TextureLoader loading: ${percent}%`);
                }
            },
            (error) => {
                this.log(`❌ TextureLoader error`, 'error');
                console.error('TextureLoader error:', error);
            }
        );
    }
    
    createPreview(img) {
        const previewContainer = document.createElement('div');
        previewContainer.style.marginTop = '5px';
        previewContainer.style.marginBottom = '15px';
        previewContainer.style.border = '1px solid #555';
        previewContainer.style.padding = '5px';
        
        const preview = document.createElement('img');
        preview.src = img.src;
        preview.style.maxWidth = '100%';
        preview.style.maxHeight = '200px';
        preview.style.display = 'block';
        
        const infoText = document.createElement('div');
        infoText.style.marginTop = '5px';
        infoText.style.fontSize = '10px';
        infoText.textContent = `Size: ${img.width}x${img.height}, Type: ${img.src.startsWith('data:') ? 'Data URI' : 'URL'}`;
        
        previewContainer.appendChild(preview);
        previewContainer.appendChild(infoText);
        this.content.appendChild(previewContainer);
    }
    
    testUploaded(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.testTexture(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Usage:
// 1. Import this file in your HTML:
//    <script type="module" src="path/to/textureDebugger.js"></script>
//
// 2. Create an instance of the debugger:
//    const debugger = new TextureDebugger();
//
// 3. Test textures:
//    debugger.testTexture('url/to/texture.png');
//    Or use the UI to test textures interactively

// If this script is loaded directly, create an instance
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        window.textureDebugger = new TextureDebugger();
        console.log('Texture Debugger initialized. Access it via window.textureDebugger');
    });
}