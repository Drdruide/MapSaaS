"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { pinOptions, markerSizes } from "@/utils/pinOptions";

interface WallpaperModalProps {
  wallpaperUrl: string;
  onClose: () => void;
  selectedPin: string;
  selectedMarkerSize: string;
  customImage: File | null;
  selectedMapStyle: string; // Ajoutez cette prop
}

export function WallpaperModal({
  wallpaperUrl,
  onClose,
  selectedPin,
  selectedMarkerSize,
  customImage,
  selectedMapStyle, // Ajoutez cette prop
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

    const selectedSize =
      markerSizes.find((size) => size.id === selectedMarkerSize)?.size || 150;
    const markerX = canvas.width / 2 - selectedSize / 2;
    const markerY = canvas.height / 2 - selectedSize;

    // Dessiner le marqueur
    await drawMapboxMarker(ctx, markerX, markerY, selectedSize);

    const resizedUrl = canvas.toDataURL("image/png");
    setResizedImageUrl(resizedUrl);
  };

  const drawMapboxMarker = async (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    let markerImg: HTMLImageElement | ImageBitmap;
    let maskImg: HTMLImageElement;

    // Ajuster la taille pour l'image personnalisée
    const customImageSizeFactor = 2; // L'image personnalisée sera 2 fois plus grande
    const adjustedSize =
      selectedPin === "custom" ? size * customImageSizeFactor : size;

    if (selectedPin === "custom" && customImage) {
      markerImg = await createImageBitmap(customImage);
      maskImg = new Image();
      maskImg.src = "/pin/photo.svg";
      await new Promise((resolve) => {
        maskImg.onload = resolve;
      });
    } else {
      const selectedPinOption = pinOptions.find(
        (pin) => pin.id === selectedPin
      );
      const markerUrl = selectedPinOption
        ? selectedPinOption.file
        : "/pin/1.svg";
      markerImg = new Image();
      (markerImg as HTMLImageElement).src = markerUrl || "";
      await new Promise((resolve) => {
        (markerImg as HTMLImageElement).onload = resolve;
      });
    }

    const scale = adjustedSize / (markerImg.width || 1);
    const markerHeight = (markerImg.height || 1) * scale;

    // Ajuster la position pour centrer le marqueur plus grand
    const adjustedX =
      selectedPin === "custom" ? x - (adjustedSize - size) / 2 : x;
    const adjustedY = selectedPin === "custom" ? y - (adjustedSize - size) : y;

    // Dessiner l'ombre
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size, size / 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fill();

    // Dessiner le marqueur
    if (selectedPin === "custom") {
      // Créer un canvas temporaire pour le masquage
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCanvas.width = adjustedSize;
      tempCanvas.height = adjustedSize;

      // Dessiner le masque
      tempCtx.drawImage(maskImg, 0, 0, adjustedSize, adjustedSize);

      // Appliquer le mode de composition pour utiliser le masque
      tempCtx.globalCompositeOperation = "source-in";

      // Dessiner l'image personnalisée
      const aspectRatio = markerImg.width / markerImg.height;
      let drawWidth = adjustedSize;
      let drawHeight = adjustedSize;
      let offsetX = 0;
      let offsetY = 0;

      if (aspectRatio > 1) {
        drawHeight = adjustedSize / aspectRatio;
        offsetY = (adjustedSize - drawHeight) / 2;
      } else {
        drawWidth = adjustedSize * aspectRatio;
        offsetX = (adjustedSize - drawWidth) / 2;
      }

      tempCtx.drawImage(markerImg, offsetX, offsetY, drawWidth, drawHeight);

      // Dessiner le contour en suivant la forme du masque
      const imageData = tempCtx.getImageData(0, 0, adjustedSize, adjustedSize);
      const pixels = imageData.data;

      ctx.save();
      ctx.strokeStyle = selectedMapStyle === "default" ? "white" : "black";
      ctx.lineWidth = adjustedSize / 20; // Augmenter l'épaisseur du contour
      ctx.lineCap = "round"; // Ajouter cette ligne pour des extrémités arrondies
      ctx.lineJoin = "round"; // Ajouter cette ligne pour des jonctions arrondies

      let path = new Path2D();
      let isDrawing = false;

      for (let y = 0; y < adjustedSize; y++) {
        for (let x = 0; x < adjustedSize; x++) {
          const alpha = pixels[(y * adjustedSize + x) * 4 + 3];
          if (alpha > 0) {
            const hasTransparentNeighbor =
              (x > 0 && pixels[(y * adjustedSize + (x - 1)) * 4 + 3] === 0) ||
              (x < adjustedSize - 1 &&
                pixels[(y * adjustedSize + (x + 1)) * 4 + 3] === 0) ||
              (y > 0 && pixels[((y - 1) * adjustedSize + x) * 4 + 3] === 0) ||
              (y < adjustedSize - 1 &&
                pixels[((y + 1) * adjustedSize + x) * 4 + 3] === 0);

            if (hasTransparentNeighbor) {
              if (!isDrawing) {
                path.moveTo(adjustedX + x, adjustedY + y);
                isDrawing = true;
              } else {
                path.lineTo(adjustedX + x, adjustedY + y);
              }
            }
          } else if (isDrawing) {
            isDrawing = false;
          }
        }
      }

      ctx.stroke(path);
      ctx.restore();

      // Dessiner le résultat final sur le canvas principal
      ctx.drawImage(
        tempCanvas,
        adjustedX,
        adjustedY,
        adjustedSize,
        adjustedSize
      );
    } else {
      ctx.drawImage(
        markerImg,
        adjustedX,
        adjustedY,
        adjustedSize,
        markerHeight
      );
    }
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
