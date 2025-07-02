"use client";

import { useState, useEffect, useRef} from "react";
import { useParams } from "next/navigation";
import { supabase } from '@/util/supabase/supabase';
import { Post } from "@/app/types/Post";
import { uploadToCloudinary, convertToWebP } from "@/app/components/Post";
import PlotCanvas from "@/app/components/PlotCanvas";
import { ProfileData } from "@/app/types/Profile";
export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: userData, error } = await supabase.auth.getUser();
      if (userData.user) {
        setCurrentUser(userData.user);
      }
    }
    checkAuth();
  }, []);

 
  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true);
      setError(null);

      if (!username) {
        setError("No username provided");
        setLoading(false);
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profile') 
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (!profileData) {
          throw new Error("Profile not found");
        }

        setProfile(profileData);
        const user = profileData.id; 

        setPostsLoading(true);
        const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .eq('poster_id', user)
            .order('created_at', { ascending: false });
          
          if (postsError) {
            console.warn("Failed to load posts:", postsError.message);
            setPosts([]);
          } else {
            setPosts(postsData ?? []);
          }
          
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setProfile(null);
        setPosts([]);
      } finally {
        setLoading(false);
        setPostsLoading(false);
      }
    }

    fetchProfileData();
  }, [username]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const webpBlob = await convertToWebP(file);
      const uploadedUrl = await uploadToCloudinary(webpBlob);

      const { error: updateError } = await supabase
        .from('profile')
        .update({ profile_picture: uploadedUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, profile_picture: uploadedUrl } : prev);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  }

  const exportPostsData = () => {
    const exportData = {
      username: profile?.username,
      posts: posts,
      exportedAt: new Date().toISOString(),
      totalPosts: posts.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}_posts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return (
      <div 
        className="min-h-screen bg-black text-white flex items-center justify-center text-lg"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen bg-black text-white flex items-center justify-center p-5"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        <div className="max-w-sm w-full flex flex-col gap-5 bg-black p-6 border border-white rounded-md text-center">
          <h2 className="text-2xl italic"><em>Error</em></h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div 
        className="min-h-screen bg-black text-white flex items-center justify-center"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        <div className="text-center">
          <h2 className="text-2xl italic mb-2"><em>Profile not found</em></h2>
          <p>The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black text-white p-5"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-black border border-white rounded-md p-6 mb-5">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0">
                <img
                  src={profile.profile_picture}
                  alt={`${profile.username}'s profile`}
                  className="w-32 h-32 rounded-full object-cover border-2 border-white"
                />
                
                {currentUser && currentUser.id === profile.id && (
                  <div>
                    <p
                      className="mt-2 underline text-sm cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? "Uploading..." : "Change profile picture"}
                    </p>
                    {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                    <input
                      id="profile-pic-upload"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl mb-2 italic">
                <em>{profile.username}</em>
              </h1>
  
              {profile.tag && (
                <div className="inline-block border border-white px-3 py-1 rounded-md text-sm mb-3">
                  {profile.tag}
                </div>

              )}
              
  
              {profile.bio && (
                <p className="text-lg mb-4 leading-relaxed">{profile.bio}</p>
              )}
  
              <div className="border border-white rounded-md p-4 inline-block">
                <h3 className="text-sm mb-2 italic">
                  <em>User Coords</em>
                </h3>
                <div className="text-sm">
                  <span>X: {profile.point_x?.toFixed(2) || "0.00"}</span>
                  <span className="ml-4">Y: {profile.point_y?.toFixed(2) || "0.00"}</span>
                  <span className="ml-4">Z: {profile.point_z?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
  
        {/* Posts Section */}
        <div className="bg-black border border-white rounded-md">
          <div className="p-6 border-b border-white">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl italic">
                <em>Posts ({posts.length})</em>
              </h2>
              {posts.length > 0 && (
                <button
                  onClick={exportPostsData}
                  className="bg-black text-white text-base px-5 py-2.5 border border-white cursor-pointer"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  Export JSON
                </button>
              )}
            </div>

          </div>
  
          <div className="divide-y divide-white">
            {postsLoading ? (
              <div className="p-8 text-center">
                <p>Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg mb-2 italic">
                  <em>No posts yet</em>
                </h3>
                <p>This user hasn't posted anything yet.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.post_id} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
  
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {post.post_content_text ?? "(No content)"}
                    </p>
                    {post.post_content_image && (
                      <img
                        src={post.post_content_image}
                        alt="Post image"
                        className="mt-4 max-w-full rounded"
                      />
                    )}
                  </div>
  
                  <div className="border border-white rounded-md p-3 inline-block text-sm">
                    <strong>Coordinates:</strong> X: {post.point_x.toFixed(2)}, Y:{" "}
                    {post.point_y.toFixed(2)}, Z: {post.point_z.toFixed(2)}
                  </div>
                </div>  
              ))
            )}
          </div>
        </div>
        <div className="w-full max-w-5xl mx-auto p-4">
            
    

        </div>
      </div>
    </div>
  );
  
}