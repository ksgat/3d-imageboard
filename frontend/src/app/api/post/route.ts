import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate incoming data
        if (!body.title || !body.text || typeof body.image_url !== "string") {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        const postResponse = await fetch("http://localhost:8000/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: body.title,
                text: body.text,
                image_url: body.image_url || "", // Pass image_url if provided
            }),
        });

        if (!postResponse.ok) {
            const error = await postResponse.text().catch(() => "Unknown error");
            return NextResponse.json(
                { error: `Failed to call /post endpoint: ${error}` },
                { status: postResponse.status }
            );
        }

        const postData = postResponse.status === 204 ? null : await postResponse.json().catch(() => null);
        if (postResponse.status !== 204 && !postData) {
            return NextResponse.json(
                { error: "Failed to parse response from /post endpoint" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            postData: postData || {},
            status: "success",
        });
    } catch (error) {
        return NextResponse.json(
            { error: `Error processing request: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 }
        );
    }
}