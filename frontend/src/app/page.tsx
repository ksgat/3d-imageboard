"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import PlotCanvas, { Post } from "./components/PlotCanvas";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./context/ThemeContext";

export default function ResizableLayout() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const throttledResize = useRef<NodeJS.Timeout | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then(setPosts)
      .catch((err) => console.error("Failed to fetch posts:", err));
  }, []);

  const updateCanvasDimensions = useCallback(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      setCanvasDimensions({
        width: Math.max(rect.width, 100),
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (throttledResize.current) clearTimeout(throttledResize.current);
      throttledResize.current = setTimeout(updateCanvasDimensions, 16);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (throttledResize.current) clearTimeout(throttledResize.current);
    };
  }, [updateCanvasDimensions]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    document.querySelectorAll("canvas, iframe").forEach((el) => {
      (el as HTMLElement).style.pointerEvents = "none";
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const newWidth = Math.max(150, Math.min(window.innerWidth - e.clientX, 800));
    setSidebarWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    document.querySelectorAll("canvas, iframe").forEach((el) => {
      (el as HTMLElement).style.pointerEvents = "";
    });

    updateCanvasDimensions();
  }, [updateCanvasDimensions]);

  // Add mousemove/up listeners
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Update canvas size when sidebar changes
  useEffect(() => {
    updateCanvasDimensions();
  }, [sidebarWidth, updateCanvasDimensions]);

return (
  <div
    className={`flex w-screen h-screen overflow-hidden ${
      theme === "dark" ? "bg-gray-900" : "bg-white"
    }`}
  >
    {/* Canvas area */}
    <div 
      ref={canvasContainerRef} 
      className="relative"
      style={{ width: `calc(100vw - ${sidebarWidth}px - 6px)` }}
    >
      <PlotCanvas posts={posts} />
    </div>

    <div
      onMouseDown={handleMouseDown}
      className="resizable-divider"
      style={{
      zIndex: 10,
      backgroundColor: theme === "dark" ? "var(--foreground)" : "var(--background)",
      }}
    />
    <div 
      className="flex-shrink-0"
      style={{ width: sidebarWidth }}
    >
      <Sidebar width={sidebarWidth} posts={posts} />
    </div>

    {}
    

  </div>
);
}