'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/util/supabase/supabase';
import Marquee from "react-fast-marquee";

interface Post {
  post_id: string;
  title: string;
  post_content_text: string;
  created_at: string;
}

interface Props {
  isMarquee?: boolean;
}

export default function NewestPostsList({ isMarquee = false }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('posts')
        .select('post_id, title, post_content_text, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error(error);
        setError('Failed to load posts.');
      } else {
        setPosts(data as Post[]);
      }

      setLoading(false);
    };

    fetchPosts();
  }, []);

  if (loading) return <p className="text-white p-4">Loading...</p>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (posts.length === 0) return <p className="text-white p-4">No posts yet.</p>;

  if (isMarquee) {
    const marqueePosts = [...posts, ...posts]; // duplicate for seamless scroll

    return (
      <div className="w-full overflow-hidden border border-white rounded bg-black p-4">
        <h2 className="text-xl font-bold text-white mb-4">Newest Posts</h2>
        <Marquee>
        <div className="whitespace-nowrap flex gap-12">
          {marqueePosts.map((post, idx) => (
            <div
              key={`${post.post_id}-${idx}`}
              className="inline-block max-w-xs border-b border-gray-700 pb-2 text-white"
            >
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="text-gray-300 text-sm truncate max-w-xs">{post.post_content_text}</p>
              <p className="text-gray-500 text-xs mt-1">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          ))}

        </div>
        </Marquee>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-x-auto p-4 border border-white rounded bg-black">
      <h2 className="text-xl font-bold text-white mb-4">Newest Posts</h2>
  
      <div className="flex gap-6">
        {posts.map((post) => (
          <div
            key={post.post_id}
            className="shrink-0 w-64 border-b border-gray-700 pb-2 text-white"
          >
            <h3 className="text-lg font-semibold">{post.title}</h3>
            <p className="text-gray-300 text-sm">{post.post_content_text}</p>
            <p className="text-gray-500 text-xs mt-1">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
