import { NextRequest } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const SUPABASE_TABLE = "posts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parent_id = searchParams.get("parent_id");

  if (!parent_id) {
    return new Response(JSON.stringify({ error: "Missing or invalid parent_id" }), {
      status: 400,
    });
  }

  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?parent_id=eq.${parent_id}&order=created_at.asc`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching from Supabase:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
