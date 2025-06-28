import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    // Optional: Validate other fields as needed, e.g. bio, profile_picture, etc.

    // Insert new profile row
    const { data, error } = await supabase
      .from("profile")
      .insert([
        {
          username: body.username,
          profile_picture: body.profile_picture ?? null,
          tag: body.tag ?? null,
          bio: body.bio ?? null,
          point_x: body.point_x ?? null,
          point_y: body.point_y ?? null,
          point_z: body.point_z ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 }); // Created
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
