"use client";

import React, { useState, useCallback, useRef, useEffect, ReactNode } from "react";
import PlotCanvas, { Post } from "./PlotCanvas";
import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";

interface ResizableLayoutProps {
  children?: ReactNode;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({ children }) => {
  const [leftWidth, setLeftWidth] = useState(70); // % of total width
  const [isDragging, setIsDragging] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Fetch posts with proper cleanup and error handling
  useEffect(() => {
    let isMounted = true;
    
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/posts");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch posts");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []); // This will run every time the component mounts

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newRightWidth = containerRect.right - e.clientX;

    const clampedRightWidth = Math.max(200, Math.min(containerRect.width * 0.5, newRightWidth));
    const newRightWidthPercent = (clampedRightWidth / containerRect.width) * 100;

    setLeftWidth(100 - newRightWidthPercent);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Always cleanup body styles when component unmounts
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup body styles when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center w-full h-screen"
        style={{ 
          backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000"
        }}
      >
        Loading posts...
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center w-full h-screen"
        style={{ 
          backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000"
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-full"
      style={{
        backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
      }}
    >
      {/* Left Panel - Canvas */}
      <div
        className="overflow-hidden"
        style={{
          width: `${leftWidth}%`,
        }}
      >
        {children ?? <PlotCanvas posts={posts} isPaused={false} />}
      </div>

      {/* Resizer */}
      <div
        className={`w-1.5 cursor-col-resize transition-colors duration-150 ${
          isDragging
            ? "bg-blue-500"
            : theme === "dark"
            ? "bg-gray-600 hover:bg-blue-400"
            : "bg-gray-300 hover:bg-blue-400"
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="w-full h-full relative">
          <div className="absolute inset-y-0 -left-1 -right-1 hover:bg-blue-400 hover:bg-opacity-20" />
        </div>
      </div>

      {/* Right Panel - Sidebar */}
      <div
        className="overflow-hidden"
        style={{
          width: `${100 - leftWidth}%`,
          backgroundColor: theme === "dark" ? "#333" : "#ddd",
        }}
      >
        <Sidebar posts={posts} />
      </div>
    </div>
  );
};

export default ResizableLayout;