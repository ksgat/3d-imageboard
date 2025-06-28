import { NextRequest } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const SUPABASE_TABLE = "posts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parent_id, text } = body;

    if (typeof parent_id !== "string" || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid parent_id or text" }), {
        status: 400,
      });
    }

    const data = {
      title: "",
      post_content_text: text,
      post_content_image: "",
      point_x: 0,
      point_y: 0,
      point_z: 0,
      parent_id,
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: response.status,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating reply:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
