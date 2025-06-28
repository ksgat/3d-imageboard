import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import PostView from './PostView';
import { Post } from '../types/Post';

interface PlotCanvasProps {
    posts: Post[];
    isPaused: boolean;
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({ posts }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [postViewPosition, setPostViewPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    // Add refs for resize optimization
    const lastResizeTime = useRef(0);
    const pendingResize = useRef(false);

    // Drag handlers for PostView
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - postViewPosition.x,
            y: e.clientY - postViewPosition.y
        });
        e.preventDefault();
        e.stopPropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const container = mountRef.current;
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Allow movement across the entire container
        const maxX = containerRect.width - (containerRect.width * 0.7); // Leave space for the 70% width PostView
        const maxY = containerRect.height - (containerRect.height * 0.7); // Leave space for the 70% height PostView
        
        setPostViewPosition({
            x: Math.max(-containerRect.width * 0.35, Math.min(containerRect.width * 0.65, newX)),
            y: Math.max(-containerRect.height * 0.35, Math.min(containerRect.height * 0.65, newY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Global mouse event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset, postViewPosition]);

    // Reset position when a new post is selected
    useEffect(() => {
        if (selectedPost) {
            setPostViewPosition({ x: 0, y: 0 });
        }
    }, [selectedPost]);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('black');

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            // Add these for better performance
            alpha: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true, // Keep the buffer to prevent flicker
            // Double buffering settings
            depth: true,
            stencil: false
        });

        // Enable auto-clear to prevent frame overlap artifacts
        renderer.autoClear = true;
        renderer.autoClearColor = true;
        renderer.autoClearDepth = true;

        // Set pixel ratio but cap it to avoid performance issues on high-DPI displays
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        rendererRef.current = renderer;
        cameraRef.current = camera;

        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.target.set(0, 0, 0);
        camera.position.set(3, 3, 3);
        controls.enablePan = true;
        controls.panSpeed = 0.5;
        controls.update();

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        const gridSize = 10;
        const gridDivisions = 20;
        const gridColor = '#808080';

        const gridHelperXZ = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
        scene.add(gridHelperXZ);

        const gridHelperXY = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
        gridHelperXY.rotation.x = Math.PI / 2;
        scene.add(gridHelperXY);

        const gridHelperYZ = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
        gridHelperYZ.rotation.z = Math.PI / 2;
        scene.add(gridHelperYZ);

        const axesHelper = new THREE.AxesHelper(2);
        scene.add(axesHelper);

        const spheres: THREE.Mesh[] = [];   

        posts.forEach((post, index) => {
            if (post.parent_id != null) {
                return; // Skip posts that are replies
            }
        
            const geometry = new THREE.SphereGeometry(0.05, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(index / posts.length, 0.7, 0.5),
                shininess: 30
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(post.point_x, post.point_y, post.point_z);
            sphere.userData = { post };
            spheres.push(sphere);

        
            const label = createTextLabel(post.title, sphere);
            scene.add(label);   
            scene.add(sphere);
            sphere.add(label); // Attach label to sphere
        });
        
        
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredSphere: THREE.Mesh | null = null;

        const onMouseMove = (event: MouseEvent) => {
            if (!mountRef.current || isDragging) return; // Don't interact with spheres while dragging
            
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = -(((event.clientX - rect.left) / rect.width) * 2 - 1);
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 - 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(spheres);

            if (intersects.length > 0) {
                const sphere = intersects[0].object as THREE.Mesh;
                if (hoveredSphere !== sphere) {
                    if (hoveredSphere) {
                        (hoveredSphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000);
                    }
                    (sphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x444444);
                    hoveredSphere = sphere;
                }
            } else if (hoveredSphere) {
                (hoveredSphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000);
                hoveredSphere = null;
            }
        };

        const onMouseClick = (event: MouseEvent) => {   
            if (!mountRef.current || isDragging) return; // Don't click if we were dragging
            const rect = renderer.domElement.getBoundingClientRect();
            const mouseClick = new THREE.Vector2();
            mouseClick.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseClick.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouseClick, camera);
            const intersects = raycaster.intersectObjects(spheres);

            if (intersects.length > 0) {
                const sphere = intersects[0].object as THREE.Mesh;
                (sphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x888800);
                displayPointInfo(sphere.userData.post);
            }
        };

        mountRef.current.addEventListener('mousemove', onMouseMove, false);
        mountRef.current.addEventListener('click', onMouseClick, false);

        function createTextLabel(text: string, parent: THREE.Mesh): THREE.Sprite {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const context = canvas.getContext('2d') as CanvasRenderingContext2D;
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = 'Bold 20px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(0.5, 0.25, 1);
            sprite.position.set(0, 0.15, 0); 
            sprite.userData = { isLabel: true };
            
            return sprite;
                        }

        function displayPointInfo(post: Post) {
            console.log("Clicked Post:", post);
            setSelectedPost(post);
        }

        let isResizing = false;
        let resizeRAF: number | null = null;
        let lastValidFrame: ImageData | null = null;
        
        const handleResize = () => {
            if (!mountRef.current || !camera || !renderer || isResizing) return;

            const containerWidth = mountRef.current.clientWidth;
            const containerHeight = mountRef.current.clientHeight;

            const size = renderer.getSize(new THREE.Vector2());
            
            if (Math.abs(size.width - containerWidth) < 5 && 
                Math.abs(size.height - containerHeight) < 5) {
                return;
            }

            isResizing = true;

            try {
                const canvas = renderer.domElement;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    lastValidFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                }
            } catch (e) {
                // ignore
            }

            // Use RAF to sync with the render loop
            requestAnimationFrame(() => {
                if (!camera || !renderer || !mountRef.current) {
                    isResizing = false;
                    return;
                }

                try {
                    // Update camera first
                    camera.aspect = containerWidth / containerHeight;
                    camera.updateProjectionMatrix();
                    
                    // Resize renderer - this preserves the buffer now
                    renderer.setSize(containerWidth, containerHeight, false);
                    
                    // Force immediate render to fill new size
                    renderer.render(scene, camera);
                    
                } catch (error) {
                    console.warn('Resize error:', error);
                } finally {
                    isResizing = false;
                }
            });
        };

        // THROTTLED ResizeObserver - much less aggressive
        const resizeObserver = new ResizeObserver((entries) => {
            // Cancel previous resize if still pending
            if (resizeRAF) {
                cancelAnimationFrame(resizeRAF);
            }
            
            // Heavy throttling during drag operations
            resizeRAF = requestAnimationFrame(() => {
                setTimeout(() => {
                    handleResize();
                    resizeRAF = null;
                }, 16); // One frame delay (16ms = ~60fps)
            });
        });

        if (mountRef.current) {
            resizeObserver.observe(mountRef.current);
            // Initial resize
            handleResize();
        }

        // OPTIMIZED ANIMATION LOOP WITH FRAME BUFFERING
        let lastRenderTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        
        const animate = (currentTime: number = 0) => {
            animationFrameRef.current = requestAnimationFrame(animate);
            
            // Frame rate limiting (optional - removes if you want max FPS)
            if (currentTime - lastRenderTime < frameInterval && !isResizing) {
                return;
            }
            lastRenderTime = currentTime;
            
            // Only update controls if they need updating and not dragging
            if (controls.enabled && !isResizing && !isDragging) {
                controls.update();
            }
            
            // Always render - this maintains the frame buffer
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            if (!mountRef.current) return;

            // Clean up RAF
            if (resizeRAF) {
                cancelAnimationFrame(resizeRAF);
            }

            // Clean up timeouts
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            resizeObserver.disconnect();

            // Dispose of all resources
            while (scene.children.length > 0) {
                const child = scene.children[0];
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
                scene.remove(child);
            }

            if (mountRef.current?.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            mountRef.current?.removeEventListener('mousemove', onMouseMove);
            mountRef.current?.removeEventListener('click', onMouseClick);
            renderer.dispose();
        };
    }, [posts, isDragging]);

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />
            {selectedPost && (
                <div 
                    className={`absolute w-[70%] h-[70%] ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
                    style={{
                        left: `${postViewPosition.x}px`,
                        top: `${postViewPosition.y}px`,
                        userSelect: 'none',
                        zIndex: 1000
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <PostView selectedPost={selectedPost} onClose={() => setSelectedPost(null)} />
                </div>
            )}
        </div>
    );
};

export default PlotCanvas;
export type { Post };