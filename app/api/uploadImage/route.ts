import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    console.log("Début de la fonction POST");
    const formData = await request.formData();
    console.log("FormData reçue");
    const file = formData.get("customImage") as File;

    if (!file) {
      console.log("Aucun fichier uploadé");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("Fichier reçu:", file.name);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `custom_${Date.now()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    console.log("Chemin du fichier:", filepath);

    // Assurez-vous que le répertoire d'upload existe
    await createUploadDirectoryIfNotExists(uploadDir);

    await writeFile(filepath, buffer);
    console.log("Fichier écrit avec succès");

    return NextResponse.json({ imageUrl: `/uploads/${filename}` });
  } catch (error) {
    console.error("Erreur détaillée dans uploadImage API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

async function createUploadDirectoryIfNotExists(dir: string) {
  const fs = require("fs").promises;
  try {
    await fs.access(dir);
    console.log("Le répertoire d'upload existe déjà");
  } catch {
    console.log("Création du répertoire d'upload");
    await fs.mkdir(dir, { recursive: true });
  }
}
