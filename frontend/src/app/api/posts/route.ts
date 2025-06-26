export async function GET() {
  const res = await fetch("http://127.0.0.1:8000/posts");
  const posts = await res.json();
  return Response.json(posts);
}