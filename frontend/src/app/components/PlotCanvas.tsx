import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import PostView from './PostView';

interface Post {
    title: string;
    point_x: number;
    point_y: number;
    point_z: number;
    post_content_text: string;
    post_content_image?: string;
}

interface PlotCanvasProps {
    posts: Post[];
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({ posts }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('black');

        const containerWidth = mountRef.current.clientWidth;
        const containerHeight = mountRef.current.clientHeight;

        const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });

        rendererRef.current = renderer;
        cameraRef.current = camera;

        renderer.setSize(containerWidth, containerHeight);
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
        });

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredSphere: THREE.Mesh | null = null;

        const onMouseMove = (event: MouseEvent) => {
            if (!mountRef.current) return;
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
            if (!mountRef.current) return;
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
            sprite.position.copy(parent.position);
            sprite.position.y += 0.15;
            sprite.userData = { isLabel: true };

            return sprite;
        }

        function displayPointInfo(post: Post) {
            console.log("Clicked Post:", post);
            setSelectedPost(post);
        }

        const handleResize = () => {
            if (!mountRef.current || !camera || !renderer) return;

            const containerWidth = mountRef.current.clientWidth;
            const containerHeight = mountRef.current.clientHeight;

            camera.aspect = containerWidth / containerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerWidth, containerHeight);
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(mountRef.current);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            if (!mountRef.current) return;

            resizeObserver.disconnect();

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

            if (mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            mountRef.current.removeEventListener('mousemove', onMouseMove);
            mountRef.current.removeEventListener('click', onMouseClick);
            renderer.dispose();
        };
    }, [posts]);

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />
            {selectedPost && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="w-[70%] h-[70%]">
                        <PostView selectedPost={selectedPost} onClose={() => setSelectedPost(null)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlotCanvas;
export type { Post };