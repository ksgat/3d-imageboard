'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/util/supabase/supabase';
import { convertToWebP, uploadToCloudinary } from '../components/Post';
import { ProfileData } from '../types/Profile';
import Image from 'next/image';
export default function Settings() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    tag: '',
    bio: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProfile(data);
        setFormData({
          username: data.username,
          tag: data.tag || '',
          bio: data.bio || '',
        });
        setPreviewUrl(data.profile_picture || null);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      // if no new image, keep preview as current profile pic
      setPreviewUrl(profile?.profile_picture || null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleUpdate = async () => {
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      let uploadedUrl = profile?.profile_picture || null;

      if (imageFile) {
        const webpBlob = await convertToWebP(imageFile);
        uploadedUrl = await uploadToCloudinary(webpBlob);
      }

      const { error } = await supabase
        .from('profile')
        .update({
          username: formData.username,
          tag: formData.tag,
          bio: formData.bio,
          profile_picture: uploadedUrl,
        })
        .eq('id', user.id);

      if (error) {
        console.error(error);
        alert("Failed to update profile: " + error.message);
      } else {
        alert("Profile updated.");
        setProfile((prev: ProfileData | null) => {
          if (!prev) return null; // must return null or valid ProfileData
          return {
            ...prev,
            ...formData,
            profile_picture: uploadedUrl,
            id: prev.id, // explicitly add id to reassure TS
          };
        });
        setImageFile(null);
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        alert("Unexpected error: " + err.message);
      } else {
        alert("An unknown error occurred.");
      }
    } finally {
      setUploading(false);
    }
      };

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <div className="text-white max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      {/* Profile Picture Preview */}
      {previewUrl && (
            <Image
            src={previewUrl}
            alt="Profile preview"
            width={96}
            height={96}
            className="rounded-full mb-4 object-cover border border-gray-600"
          />
 
      )}

      <label className="block mb-4">
        <span className="block mb-1">Change Profile Picture</span>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      <div className="mb-4">
        <label className="block mb-1">Username</label>
        <input
          type="text"
          className="w-full p-2 bg-gray-800 rounded"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Tag</label>
        <input
          type="text"
          className="w-full p-2 bg-gray-800 rounded"
          value={formData.tag}
          onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Bio</label>
        <textarea
          className="w-full p-2 bg-gray-800 rounded"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />
      </div>

      <button
        disabled={uploading}
        className={`border-white px-4 py-2 rounded ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleUpdate}
      >
        {uploading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
