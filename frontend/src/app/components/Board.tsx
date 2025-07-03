import PlotCanvas from "./PlotCanvas";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { fetchPosts } from "./PlotCanvas";
import { Post } from "../types/Post";
import PostView from "./PostView";
import Posts from "./Post";


export default function ResizableLayout() {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); 
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  useEffect(() => {
    const divider = dividerRef.current;
    if (!divider || !leftRef.current || !rightRef.current) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
    
      if (!leftRef.current || !rightRef.current || !divider) return;
    
      const startX = e.clientX;
      const startLeftWidth = leftRef.current.getBoundingClientRect().width;
      const containerWidth = divider.parentElement!.getBoundingClientRect().width;
    
      const onMouseMove = (e: MouseEvent) => {
        if (!leftRef.current || !rightRef.current) return;
    
        const deltaX = e.clientX - startX;
        const clampedWidth = Math.max(100, Math.min(containerWidth - 100, startLeftWidth + deltaX));
    
        leftRef.current.style.width = `${clampedWidth}px`;
        rightRef.current.style.width = `${containerWidth - clampedWidth - 4}px`;
      };
    
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
    
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    divider.addEventListener("mousedown", onMouseDown);

    return () => {
      divider.removeEventListener("mousedown", onMouseDown);
    };
  }, []);
  useEffect(() => {
    const fetchPostsAndSet = async () => {
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts); 
    };
    fetchPostsAndSet();
  }, []);
  
  
    



  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div ref={leftRef} className="relative" style={{ width: "50%" }}>
        <PlotCanvas posts={posts} onPostSelect={setSelectedPost} />
        {selectedPost && (
          <PostView
            selectedPost={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </div>
      <div
        ref={dividerRef}
        className="w-1 bg-gray-600 cursor-col-resize hover:bg-gray-500 transition-colors"
      ></div>
      <div
        ref={rightRef}
        className="bg-gray-900 text-white p-4 overflow-auto"
        style={{ width: "50%" }}
      >
        <Posts />
      </div>
    </div>
  );
}