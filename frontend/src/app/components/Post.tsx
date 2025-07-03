import { useState, useEffect } from "react";
import { supabase } from "@/util/supabase/supabase";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
const CLOUD_NAME = "didu3zhu4";
const UPLOAD_PRESET = "ml_default";

export async function convertToWebP(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/webp", 0.9);
  });
}

export async function uploadToCloudinary(webpBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", webpBlob);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Cloudinary upload failed");

  const data = await res.json();
  return data.secure_url;
}

export default function Posts() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [fileName, setFileName] = useState("No file chosen");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      setFileName("No file chosen");
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setFileName(file ? file.name : "No file chosen");
  }

  const handleImageUpload = async () => {
    if (!image) return null;
    const webpBlob = await convertToWebP(image);
    const imageUrl = await uploadToCloudinary(webpBlob);
    return imageUrl;
  };

  const handleSubmit = async () => {
    if (!session) {
      alert("You must be logged in to post");
      return;
    }
  
    try {
      const imageUrl = await handleImageUpload();
  
      const embedResponse = await fetch("http://localhost:8000/embed-only", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          text,
        }),
      });
  
      if (!embedResponse.ok) {
        const errorText = await embedResponse.text();
        console.error("Embedding service error:", errorText);
        alert("Failed to embed text.");
        return;
      }
  
      const embedResult = await embedResponse.json();
      const [pointX, pointY, pointZ] = embedResult.coordinates;
  
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title,
            point_x: pointX,
            point_y: pointY,
            point_z: pointZ,
            post_content_text: text || null,
            post_content_image: imageUrl || null,
            parent_id: null, 
            poster_id: session.user.id,
          },
        ])
        .select();
  
      if (error) {
        console.error("Insert error:", error);
        alert("Failed to create post: " + error.message);
        return;
      }
  
      console.log("Inserted post:", data);
      alert("Post created successfully!");
  
      setTitle("");
      setText("");
      setImage(null);
      setFileName("No file chosen");
    } catch (err) {
      console.error("Error during submit:", err);
      alert("Something went wrong.");
    }
  };


    return (
    <div className="bg-black text-white min-h-screen p-4">
      <h2 className="text-white text-2xl font-bold mb-4">Posts</h2>

      <div className="relative">
        {!session && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-80 text-white text-xl font-semibold rounded">
            You must log in to post!
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (session) handleSubmit();
          }}
          className={`mb-8 p-4 border border-gray-600 rounded transition-all duration-200 ${
            !session ? "blur-sm pointer-events-none select-none" : ""
          }`}
        >
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block mb-4 w-full p-2 border border-gray-600 rounded bg-black text-white"
          />
          <textarea
            placeholder="Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="block mb-4 w-full p-2 border border-gray-600 rounded bg-black text-white"
          />

          <label className="block mb-2 text-white">
            Upload Image
            <br />
            <span className="inline-block font-bold text-dodgerblue px-2 py-1 border border-gray-400 rounded cursor-pointer mt-2">
              Choose file
              <input
                type="file"
                accept="image/*"
                title="Upload an image"
                onChange={handleFileChange}
                className="hidden"
              />
            </span>
            {/* Show selected file name */}
            <span className="ml-3 text-white align-middle">{fileName}</span>
          </label>

          {previewUrl && (
              <div className="mt-4 max-w-xs max-h-48 relative border border-gray-600 rounded overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            )}

          <button
            type="submit"
            disabled={!session}
            className="block w-full p-2 bg-black text-white border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
