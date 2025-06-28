import { Post } from "./PlotCanvas";
import { useState } from "react";
import Posts from "./Post";
import Settings from "./Settings";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({posts }: {posts: Post[] }) {
  const [activeTab, setActiveTab] = useState("Posts");
  const { theme } = useTheme();

  return (
    <div
      className="h-full p-4 box-border overflow-y-auto sidebar bg-black text-white"
    >
      {/* Tabs */}
      <div className="flex mb-4 gap-2">
        {["Posts", "Settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-2 border border-gray-700 rounded cursor-pointer text-white ${
              activeTab === tab ? "bg-gray-700" : "bg-black"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "Posts" && <Posts posts={posts} />}
        {activeTab === "Settings" && <Settings />}
      </div>
    </div>
  );
}