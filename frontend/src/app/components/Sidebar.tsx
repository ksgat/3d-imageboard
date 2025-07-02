import { Post } from "../types/Post";
import { useState } from "react";
import Posts from "./Post";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({posts }: {posts: Post[] }) {
  const [activeTab, setActiveTab] = useState("Posts");
  const { theme } = useTheme();

  return (
    <div
      className="h-full p-4 box-border overflow-y-auto sidebar bg-black text-white"
    >
      {/* formerly tabs */}
      <div className="flex mb-4 gap-2">
      <Posts posts={posts} />
      </div>

 
    </div>
  );
}