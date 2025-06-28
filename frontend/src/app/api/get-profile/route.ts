import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("profile")
    .select("username, profile_picture, tag, bio, point_x, point_y, point_z")
    .eq("username", username)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
