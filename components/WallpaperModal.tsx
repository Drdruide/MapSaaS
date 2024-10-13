"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { pinOptions } from "@/utils/pinOptions";

interface WallpaperModalProps {
  wallpaperUrl: string;
  onClose: () => void;
  selectedPin: string;
}

export function WallpaperModal({
  wallpaperUrl,
  onClose,
  selectedPin,
}: WallpaperModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [resizedImageUrl, setResizedImageUrl] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyEffects = async (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1170;
    canvas.height = 2532;

    // Dessiner l'image de base
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const markerSize = 150; // Garder la grande taille du marqueur
    const markerX = canvas.width / 2 - markerSize / 2;
    const markerY = canvas.height / 2 - markerSize; // Ajuster la position verticale pour que la pointe soit au centre

    // Dessiner le marqueur pin-l-heart de Mapbox
    await drawMapboxMarker(ctx, markerX, markerY, markerSize);

    // Ajouter la date
    const dateMatch = wallpaperUrl.match(/date=([^&]+)/);
    if (dateMatch) {
      const dateString = decodeURIComponent(dateMatch[1]);
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      // Dessiner l'arrière-plan de la date avec un effet d'ombre
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      const dateBackgroundWidth = 160;
      const dateBackgroundHeight = 50;
      const dateBackgroundX = canvas.width / 2 - dateBackgroundWidth / 2;
      const dateBackgroundY = markerY + markerSize + 80; // Ajusté pour être sous le marqueur
      ctx.roundRect(
        dateBackgroundX,
        dateBackgroundY,
        dateBackgroundWidth,
        dateBackgroundHeight,
        25
      );
      ctx.fill();

      ctx.restore(); // Restaure le contexte pour ne pas appliquer l'ombre au texte

      // Ajouter le texte de la date
      ctx.font = "bold 24px 'Montserrat', sans-serif";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        formattedDate,
        canvas.width / 2,
        dateBackgroundY + dateBackgroundHeight / 2
      );
    }

    const resizedUrl = canvas.toDataURL("image/png");
    setResizedImageUrl(resizedUrl);
  };

  const drawMapboxMarker = async (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    const selectedPinOption = pinOptions.find((pin) => pin.id === selectedPin);
    const markerUrl = selectedPinOption ? selectedPinOption.file : "/pin/1.svg";
    const markerImg = new Image();
    markerImg.src = markerUrl;

    await new Promise((resolve) => {
      markerImg.onload = resolve;
    });

    const scale = size / markerImg.width;
    const markerHeight = markerImg.height * scale;

    // Dessiner l'ombre
    ctx.beginPath();
    ctx.arc(x + size / 2, y + markerHeight, size / 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fill();

    // Dessiner le marqueur
    ctx.drawImage(markerImg, x, y, size, markerHeight);
  };

  useEffect(() => {
    if (wallpaperUrl) {
      setImageLoaded(false);
      setImageError(null);
      setResizedImageUrl(null);
      setErrorDetails("");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = wallpaperUrl;
      img.onload = () => {
        setImageLoaded(true);
        applyEffects(img);
      };
      img.onerror = (error) => {
        console.error("Erreur lors du chargement de l'image:", error);
        setImageError(`Impossible de charger l'image. Veuillez réessayer.`);
        setErrorDetails(
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallpaperUrl]);

  if (!wallpaperUrl) return null;

  const handleDownload = () => {
    if (resizedImageUrl) {
      const link = document.createElement("a");
      link.href = resizedImageUrl;
      link.download = "wallpaper.png";
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-xs w-full">
        {!imageLoaded && !imageError && (
          <div className="w-full h-96 flex items-center justify-center">
            <p>Chargement du fond d&apos;écran...</p>
          </div>
        )}
        {imageError && (
          <div className="w-full h-96 flex flex-col items-center justify-center text-red-500">
            <p>{imageError}</p>
            <p className="text-xs mt-2 max-w-full overflow-auto">
              {errorDetails}
            </p>
          </div>
        )}
        {imageLoaded && resizedImageUrl && (
          <img
            src={resizedImageUrl}
            alt="Fond d'écran généré"
            className="w-full h-auto rounded-lg"
            style={{ aspectRatio: "9 / 19.5" }}
          />
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className="mt-4 flex justify-between">
          <Button onClick={onClose}>Fermer</Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!imageLoaded || !resizedImageUrl}
          >
            Télécharger
          </Button>
        </div>
      </div>
    </div>
  );
}
