import { useState } from "react";
import { Post } from "./PlotCanvas";

const CLOUD_NAME = "didu3zhu4";
const UPLOAD_PRESET = "ml_default";

async function convertToWebP(file: File): Promise<Blob> {
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

async function uploadToCloudinary(webpBlob: Blob): Promise<string> {
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

export default function Posts({ posts }: { posts: Post[] }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleImageUpload = async () => {
    if (!image) return null;

    const webpBlob = await convertToWebP(image);
    const imageUrl = await uploadToCloudinary(webpBlob);
    return imageUrl;
  };

  const handleSubmit = async () => {
    const imageUrl = await handleImageUpload();
    const requestBody = { 
      title,
      text,
      image_url: imageUrl || ""
    };
    console.log("Request Body:", requestBody);
    const response = await fetch("/api/post", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      alert("Post created successfully!");
    } else {
      alert("Failed to create post.");
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <h2 className="text-white text-2xl font-bold mb-4">Posts</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="mb-8 p-4 bg-black border border-gray-600 rounded"
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
        <label className="block mb-4 text-white">
          Upload Image
          <input
            type="file"
            accept="image/*"
            title="Upload an image"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="block mt-2 text-white"
          />
        </label>
        <button
          type="submit"
          className="block w-full p-2 bg-black text-white border border-gray-600 rounded hover:bg-gray-800"
        >
          Submit
        </button>
      </form>
    </div>
  );
}