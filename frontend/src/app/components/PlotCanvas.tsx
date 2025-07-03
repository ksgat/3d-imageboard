import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Post } from "../types/Post";
import { supabase } from "@/util/supabase/supabase";
interface PlotCanvasProps {
  posts: Post[];
  onPostSelect: (post: Post) => void;
}

export default function PlotCanvas({ posts, onPostSelect }: PlotCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const spheresRef = useRef<THREE.Mesh[]>([]);
    const labelsRef = useRef<THREE.Sprite[]>([]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;  
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x1e1e1e);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color('black');
        
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
        camera.position.z = 5;
        cameraRef.current = camera;

        const controls = new OrbitControls(camera, canvasRef.current);
        controlsRef.current = controls;

        controls.enableDamping = true;
        controls.dampingFactor = 0.5;
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.enableZoom = true;

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

        const animate = () => {
            if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

            const width = canvasRef.current!.parentElement!.clientWidth;
            const height = canvasRef.current!.parentElement!.clientHeight;

            rendererRef.current.setSize(width, height);
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();

            rendererRef.current.render(scene, cameraRef.current);
            controls.update();
            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            // Cleanup
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
            controlsRef.current?.dispose();
        };
    }, []);

    useEffect(() => {
        if (!sceneRef.current) return;

        spheresRef.current.forEach(sphere => sceneRef.current?.remove(sphere));
        labelsRef.current.forEach(label => sceneRef.current?.remove(label));
        spheresRef.current = [];
        labelsRef.current = [];

        posts.forEach((post, index) => {
            if (post.parent_id != null) return;
            
            const geometry = new THREE.SphereGeometry(0.1, 16, 16);
            const length = post.post_content_text?.length ?? 0;
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(index / length, 0.7, 0.5),
                shininess: 30
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(post.point_x, post.point_y, post.point_z);
            sphere.userData = { post };

            const label = createTextLabel(post.title);
            sphere.add(label);
            
            sceneRef.current?.add(sphere);
            spheresRef.current.push(sphere);
            labelsRef.current.push(label);
        });
    }, [posts]);

    useEffect(() => {
        if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
      
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
      
        const onClick = (event: MouseEvent) => {
          const rect = canvasRef.current!.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
          raycaster.setFromCamera(mouse, cameraRef.current!);
          const intersects = raycaster.intersectObjects(spheresRef.current);
      
          if (intersects.length > 0) {
            const selected = intersects[0].object.userData.post as Post;
            onPostSelect(selected);
          }
        };
      
        canvasRef.current.addEventListener("click", onClick);
    const canvas = canvasRef.current;
        return () => {
          canvas?.removeEventListener("click", onClick);
        };
      }, [onPostSelect]);

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
}

function createTextLabel(text: string): THREE.Sprite {
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

export async function fetchPosts(): Promise<Post[]> {
    const { data, error } = await supabase.from('posts').select('*');
    if (error) throw error;
    return (data ?? []).map(p => ({
      post_id: p.post_id,
      title: p.title ?? '',
      point_x: p.point_x ?? 0,
      point_y: p.point_y ?? 0,
      point_z: p.point_z ?? 0,
      post_content_text: p.post_content_text,
      post_content_image: p.post_content_image ?? null,
      parent_id: p.parent_id ?? null,
      created_at: p.created_at,
      poster_id: p.poster_id ?? '',
    }));
  }
  