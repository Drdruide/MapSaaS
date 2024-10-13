/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { WallpaperModal } from "./WallpaperModal";
import {
  pinOptions,
  previewMapUrl,
  previewMapUrlAlternative,
  mapStyles,
  markerSizes,
} from "@/utils/pinOptions";
import { Input } from "./ui/input";
import Cropper from "react-easy-crop";

export function GeneratorForm() {
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [selectedPin, setSelectedPin] = useState(pinOptions[0].id);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [selectedMapStyle, setSelectedMapStyle] = useState(mapStyles[0].id);
  const [selectedMarkerSize, setSelectedMarkerSize] = useState(
    markerSizes[1].id
  ); // Taille moyenne par défaut
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapboxToken) {
      console.error("La clé API Mapbox n'est pas définie");
    } else {
      console.log("Clé API Mapbox:", mapboxToken.substring(0, 5) + "...");
    }
  }, [mapboxToken]);

  const fetchSuggestions = useCallback(async () => {
    if (location.length > 2 && mapboxToken) {
      const encodedLocation = encodeURIComponent(location);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&autocomplete=true`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.features) {
          const newSuggestions = data.features.map(
            (feature: { place_name: string }) => feature.place_name
          );
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
        } else {
          console.error("Réponse de l'API Mapbox inattendue:", data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des suggestions:", error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [location, mapboxToken]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCustomImage(event.target.files[0]);
      setSelectedPin("custom");
      setIsCropping(true);
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { width: number; height: number; x: number; y: number }
  ) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }
        resolve(URL.createObjectURL(blob));
      }, "image/jpeg");
    });
  };

  const handleCropSave = useCallback(async () => {
    if (customImage && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(
        URL.createObjectURL(customImage),
        croppedAreaPixels
      );
      if (croppedImage) {
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        setCustomImage(
          new File([blob], "cropped_image.jpg", { type: "image/jpeg" })
        );
      }
      setIsCropping(false);
    }
  }, [customImage, croppedAreaPixels]);

  const generateWallpaper = async () => {
    if (!location || !mapboxToken) return;

    const selectedStyle =
      mapStyles.find((style) => style.id === selectedMapStyle)?.style ||
      mapStyles[0].style;
    const zoom = 13;
    const width = 600;
    const height = 1280;

    const encodedLocation = encodeURIComponent(location);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const wallpaperUrl = `https://api.mapbox.com/styles/v1/${selectedStyle}/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}`;

        let proxyUrl = `/api/imageProxy?url=${encodeURIComponent(
          wallpaperUrl
        )}&selectedPin=${selectedPin}&markerSize=${selectedMarkerSize}`;

        if (selectedPin === "custom" && customImage) {
          const formData = new FormData();
          formData.append("customImage", customImage);
          try {
            const uploadResponse = await fetch("/api/uploadImage", {
              method: "POST",
              body: formData,
            });
            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(
                `HTTP error! status: ${uploadResponse.status}, message: ${errorData.error}, details: ${errorData.details}`
              );
            }
            const data = await uploadResponse.json();
            if (data.error) {
              throw new Error(data.error);
            }
            proxyUrl += `&customImageUrl=${encodeURIComponent(data.imageUrl)}`;
          } catch (error) {
            console.error(
              "Erreur détaillée lors de l'upload de l'image:",
              error
            );
            alert(
              `Une erreur s'est produite lors de l'upload de l'image personnalisée: ${error.message}`
            );
            return;
          }
        }

        setWallpaperUrl(proxyUrl);
        setIsModalOpen(true);
      } else {
        alert("Lieu non trouvé. Veuillez essayer une autre recherche.");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du fond d'écran:", error);
      alert("Une erreur s'est produite lors de la génération du fond d'écran.");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocation(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const generatePreview = useCallback(async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 245;
    canvas.height = 500;

    const backgroundImg = new Image();
    backgroundImg.src =
      selectedMapStyle === "alternative"
        ? previewMapUrlAlternative
        : previewMapUrl;
    await new Promise((resolve) => {
      backgroundImg.onload = resolve;
    });

    // Dessiner l'image de fond
    const scale = Math.max(
      canvas.width / backgroundImg.width,
      canvas.height / backgroundImg.height
    );
    const scaledWidth = backgroundImg.width * scale;
    const scaledHeight = backgroundImg.height * scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;
    ctx.drawImage(backgroundImg, offsetX, offsetY, scaledWidth, scaledHeight);

    const selectedPinOption = pinOptions.find((pin) => pin.id === selectedPin);
    if (selectedPinOption) {
      const selectedSize =
        markerSizes.find((size) => size.id === selectedMarkerSize)?.size || 150;
      const mockupScale = canvas.height / 2532;
      const markerSize = selectedSize * mockupScale;

      const markerX = canvas.width / 2 - markerSize / 2;
      const markerY = canvas.height / 2 - markerSize;
      const markerImg = new Image();
      markerImg.src = selectedPinOption.file ?? "";
      await new Promise((resolve) => {
        markerImg.onload = resolve;
      });

      // Ajuster la position de l'ombre en fonction du pin sélectionné
      let shadowOffsetX = 0;
      if (selectedPin === "coeur2") {
        shadowOffsetX = markerSize / 12;
      } else if (selectedPin === "coeur3") {
        shadowOffsetX = -markerSize / 12;
      }

      // Dessiner l'ombre
      ctx.beginPath();
      ctx.arc(
        markerX + markerSize / 2 + shadowOffsetX,
        markerY + markerSize,
        markerSize / 6,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fill();

      // Dessiner le marqueur
      ctx.drawImage(markerImg, markerX, markerY, markerSize, markerSize);
    }

    // Ajouter le bandeau d'avertissement
    ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
    const notchHeight = 34; // Hauteur approximative de l'encoche
    const bannerHeight = 60;
    ctx.fillRect(0, notchHeight, canvas.width, bannerHeight);
    ctx.fillStyle = "black";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "APERÇU",
      canvas.width / 2,
      notchHeight + bannerHeight / 2 - 20
    );
    ctx.fillText(
      "CARTE NON RÉELLE",
      canvas.width / 2,
      notchHeight + bannerHeight / 2
    );
    ctx.fillText(
      "RÉSULTAT FINAL DE MEILLEURE QUALITÉ",
      canvas.width / 2,
      notchHeight + bannerHeight / 2 + 20
    );

    setPreviewImageUrl(canvas.toDataURL());
  }, [selectedPin, selectedMapStyle, selectedMarkerSize]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 md:w-1/2">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Générez votre fond d'écran
        </h2>
        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Entrez un lieu"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choisissez un style de carte
            </label>
            <div className="flex justify-center space-x-4">
              {mapStyles.map((style) => (
                <button
                  key={style.id}
                  className={`w-24 h-24 border-2 rounded-md overflow-hidden ${
                    selectedMapStyle === style.id
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedMapStyle(style.id)}
                >
                  <img
                    src={
                      style.id === "default"
                        ? previewMapUrl
                        : previewMapUrlAlternative
                    }
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choisissez un pin ou uploadez une photo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {pinOptions.map((pin) => (
                <button
                  key={pin.id}
                  className={`p-2 border rounded-md ${
                    selectedPin === pin.id
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => {
                    setSelectedPin(pin.id);
                    if (pin.id === "custom" && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  {pin.id === "custom" ? (
                    customImage ? (
                      <img
                        src={URL.createObjectURL(customImage)}
                        alt="Custom"
                        className="w-full h-8 object-contain"
                      />
                    ) : (
                      "Upload"
                    )
                  ) : (
                    <img
                      src={pin.file || ""}
                      alt={pin.name}
                      className="w-full h-8 object-contain"
                    />
                  )}
                </button>
              ))}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choisissez la taille du marqueur
            </label>
            <div className="flex justify-between">
              {markerSizes.map((size) => (
                <button
                  key={size.id}
                  className={`px-4 py-2 rounded ${
                    selectedMarkerSize === size.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setSelectedMarkerSize(size.id)}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generateWallpaper} className="w-full">
            Générer le fond d'écran
          </Button>
        </div>
        {isModalOpen && (
          <WallpaperModal
            wallpaperUrl={wallpaperUrl}
            onClose={() => setIsModalOpen(false)}
            selectedPin={selectedPin}
            selectedMarkerSize={selectedMarkerSize}
            customImage={customImage}
            selectedMapStyle={selectedMapStyle} // Ajoutez cette ligne
          />
        )}

        {isCropping && customImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg w-96 h-96">
              <div className="relative w-full h-80">
                <Cropper
                  image={URL.createObjectURL(customImage)}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="mt-4 flex justify-between">
                <Button onClick={() => setIsCropping(false)}>Annuler</Button>
                <Button onClick={handleCropSave}>Sauvegarder</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="md:w-1/2">
        <h3 className="text-lg font-semibold mb-2">Prévisualisation</h3>
        <div className="relative w-[245px] h-[500px] mx-auto">
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Prévisualisation"
              className="absolute top-[1.5%] left-[4%] w-[92%] h-[97%] object-cover rounded-[4%]"
            />
          )}
          <img
            src="/iphone-mockup.png"
            alt="iPhone Mockup"
            className="absolute top-0 left-0 w-full h-full object-contain z-10"
          />
        </div>
      </div>
    </div>
  );
}
