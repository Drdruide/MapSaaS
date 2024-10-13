export const colorOptions = [
  { id: "original", name: "Original", value: "none" }, // Ajout de l'option originale
  { id: "red", name: "Rouge", value: "#FF0000" },
  { id: "cyan", name: "Cyan", value: "#00FFFF" },
  { id: "green", name: "Vert", value: "#00FF00" },
  { id: "yellow", name: "Jaune", value: "#FFFF00" },
  { id: "orange", name: "Orange", value: "#FFA500" },
  { id: "magenta", name: "Magenta", value: "#FF00FF" },
  { id: "white", name: "Blanc", value: "#FFFFFF" },
];

export const pinOptions = [
  { id: "coeur1", name: "Coeur 1", file: "/pin/coeur1.svg" },
  { id: "coeur2", name: "Coeur 2", file: "/pin/coeur2.svg" },
  { id: "coeur3", name: "Coeur 3", file: "/pin/coeur3.svg" },
  { id: "custom", name: "Photo personnelle", file: null },
];

export const mapStyles = [
  {
    id: "default",
    name: "Carte par défaut",
    style: "samuelbns/cm26girtq00cs01pe7e7fhj72",
  },
  {
    id: "alternative",
    name: "Carte alternative",
    style: "samuelbns/cm27n0p2200j701pl7v127w7h",
  },
];

export const previewMapUrl = "/pin/preview-map-paris-costum1.png";
export const previewMapUrlAlternative = "/pin/preview-map-paris-costum2.png"; // Ajoutez cette ligne

export const markerSizes = [
  { id: "small", name: "Petit", size: 100 },
  { id: "medium", name: "Moyen", size: 150 },
  { id: "large", name: "Grand", size: 200 },
];
