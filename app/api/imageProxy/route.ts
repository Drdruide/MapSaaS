import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const date = searchParams.get("date");
  const imageUrl = searchParams.get("imageUrl");

  if (!url) {
    console.error("URL parameter is missing");
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  console.log("Fetching image from:", url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch image. Status: ${response.status}`);
      const text = await response.text();
      console.error("Response body:", text);
      return NextResponse.json(
        {
          error: `Failed to fetch image. Status: ${response.status}`,
          body: text,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");
    console.log("Content-Type from Mapbox:", contentType);

    const buffer = await response.arrayBuffer();

    console.log("Image fetched successfully. Buffer size:", buffer.byteLength);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Custom-Date": date || "",
        "X-Custom-Image-Url": imageUrl || "",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
