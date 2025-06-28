import React, { useEffect, useState } from "react";
import { Post } from "./PlotCanvas";
import { supabase } from "@/util/supabase/supabase";

interface PostViewProps {
  selectedPost: Post | null;
  onClose: () => void;
}

const PostView: React.FC<PostViewProps> = ({ selectedPost, onClose }) => {
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const [posterProfile, setPosterProfile] = useState<{
    username: string;
    profile_picture: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedPost?.post_id) {
      setReplies([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/get_replys?parent_id=${selectedPost.post_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load replies");
        return res.json();
      })
      .then((data: Post[]) => {
        setReplies(data);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedPost]);

  useEffect(() => {
    if (!selectedPost?.poster_id) {
      setPosterProfile(null);
      return;
    }

    supabase
      .from("profile")
      .select("username, profile_picture")
      .eq("id", selectedPost.poster_id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching profile:", error);
          setPosterProfile(null);
        } else {
          setPosterProfile(data);
        }
      });
  }, [selectedPost?.poster_id]);

  const handleReply = async () => {
    if (!selectedPost?.post_id || replyText.trim() === "") return;

    setIsPosting(true);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: selectedPost.post_id,
          text: replyText.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post reply");
      }

      const newReply = await res.json();
      setReplies((prev) => [...prev, newReply]);
      setReplyText("");
    } catch (err) {
      console.error(err);
      alert("Could not post reply.");
    } finally {
      setIsPosting(false);
    }
  };

  if (!selectedPost) return null;

  return (
    <div className="relative w-[90%] max-w-[600px] h-[90%] max-h-[600px] bg-black p-6 rounded overflow-auto border border-white my-4">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white text-xl"
      >
        [x]
      </button>

      <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
      {posterProfile ? (
  <div className="flex items-center space-x-3 mt-2 mb-2">
    <img
      src={posterProfile.profile_picture}
      alt={`${posterProfile.username}'s profile`}
      className="w-8 h-8 rounded-full border border-white"
    />
    <span className="text-white font-medium">@{posterProfile.username}</span>
  </div>
) : (
  <p className="text-white">No profile found</p>
)}


      <p className="mt-2 text-white">{selectedPost.post_content_text}</p>
      {selectedPost.post_content_image && (
        <img
          src={selectedPost.post_content_image}
          alt={selectedPost.title}
          className="mt-4 max-w-full max-h-[300px] object-contain"
        />
      )}

      {/* Reply box */}
      <div className="mt-6">
        <textarea
          className="w-full bg-gray-800 text-white p-2 rounded resize-none"
          rows={1}
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <button
          onClick={handleReply}
          disabled={isPosting || replyText.trim() === ""}
          className="mt-2 px-4 py-1 text-white rounded border border-white hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white transition-colors"
        >
          {isPosting ? "Posting..." : "Reply"}
        </button>
      </div>

      {/* Replies */}
      <div className="mt-6 border-t border-gray-600 pt-4">
        <h3 className="text-lg font-semibold mb-2 text-white">Replies</h3>

        {loading && <p className="text-white">Loading replies...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {replies.length === 0 && !loading && (
          <p className="text-white">No replies yet.</p>
        )}

        {replies.map((reply) => (
          <div
            key={reply.post_id}
            className="ml-4 border-l border-gray-700 pl-4"
          >
            <PostView selectedPost={reply} onClose={onClose} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostView;
