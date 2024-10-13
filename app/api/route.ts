import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");
  const date = searchParams.get("date");
  const imageUrl = searchParams.get("imageUrl");

  if (!location) {
    return NextResponse.json(
      { error: "Location is required" },
      { status: 400 }
    );
  }

  // Construisez l'URL de l'image de fond d'écran
  let wallpaperUrl = `https://example.com/generate-wallpaper?location=${encodeURIComponent(
    location
  )}`;
  if (date) {
    wallpaperUrl += `&date=${encodeURIComponent(date)}`;
  }
  if (imageUrl) {
    wallpaperUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;
  }

  // Ici, vous devriez appeler votre service de génération de fond d'écran
  // Pour cet exemple, nous retournons simplement l'URL construite
  return NextResponse.json({ imageUrl: wallpaperUrl });
}
