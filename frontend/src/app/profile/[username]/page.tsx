"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ProfileData {
  username: string;
  profile_picture: string;
  tag?: string | null;
  bio?: string | null;
  point_x?: number | null;
  point_y?: number | null;
  point_z?: number | null;
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);

      if (!username) {
        setError("No username provided");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/get-profile?username=${username}`);

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Failed to load profile" }));
        setError(json.error || "Failed to load profile");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.username !== username) {
        setError("Profile not found");
        setProfile(null);
      } else {
        setProfile(data);
        setError(null);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [username]);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div>
      <h1>{profile.username}</h1>
      <img
        src={profile.profile_picture}
        alt={`${profile.username}’s profile`}
        width={150}
        height={150}
      />
      {profile.tag && <p>Tag: {profile.tag}</p>}
      {profile.bio && <p>Bio: {profile.bio}</p>}
      <p>
        Coordinates:{" "}
        {[
          profile.point_x?.toFixed(2),
          profile.point_y?.toFixed(2),
          profile.point_z?.toFixed(2),
        ].join(", ")}
      </p>
    </div>
  );
}
