import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/util/supabase/supabase";


export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const body = await request.json();

  if (
    !body.title || typeof body.title !== 'string' ||
    !body.text || typeof body.text !== 'string' ||
    typeof body.image_url !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  const embedResponse = await fetch("http://localhost:8000/embed-only", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: body.title, text: body.text }),
  });

  if (!embedResponse.ok) {
    const errorText = await embedResponse.text().catch(() => "Unknown error");
    return NextResponse.json(
      { error: `Failed to call embed-only endpoint: ${errorText}` },
      { status: embedResponse.status }
    );
  }

  const embedData = await embedResponse.json();

  const post = {
    title: body.title,
    post_content_text: body.text,
    post_content_image: body.image_url,
    poster_id: user.id,
    parent_id: null,
    point_x: embedData.coordinates?.[0] ?? null,
    point_y: embedData.coordinates?.[1] ?? null,
    point_z: embedData.coordinates?.[2] ?? null,
  };

  const { data, error } = await supabase.from("posts").insert(post);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data, status: "success" });
}
