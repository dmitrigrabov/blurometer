import * as cocoSsd from "@tensorflow-models/coco-ssd";

export let model: cocoSsd.ObjectDetection | null = null;

export function resetModel() {
  model = null;
}

async function loadModel() {
  if (!model) {
    model = await cocoSsd.load();
  }
  return model;
}

interface Prediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export async function detectIdCard(
  base64Image: string
): Promise<string | null> {
  try {
    const model = await loadModel();

    // Create an image element from base64
    const img = new globalThis.Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = base64Image;
    });

    // Detect objects in the image
    const predictions = await model.detect(img);

    // Look for document/card-like objects
    const cardPrediction = predictions.find(
      (pred: Prediction) =>
        pred.class === "book" || // COCO-SSD sometimes classifies cards as books
        pred.class === "cell phone" || // or phones
        pred.class === "remote" // or remotes
    );

    if (!cardPrediction) {
      return null;
    }

    // Create a canvas to crop the detected area
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Add some padding around the detected area
    const padding = 20;
    const x = Math.max(0, cardPrediction.bbox[0] - padding);
    const y = Math.max(0, cardPrediction.bbox[1] - padding);
    const width = Math.min(img.width - x, cardPrediction.bbox[2] + padding * 2);
    const height = Math.min(
      img.height - y,
      cardPrediction.bbox[3] + padding * 2
    );

    // Set canvas size to match the cropped area
    canvas.width = width;
    canvas.height = height;

    // Draw the cropped area
    ctx.drawImage(
      img,
      x,
      y,
      width,
      height, // Source rectangle
      0,
      0,
      width,
      height // Destination rectangle
    );

    // Return the cropped image as base64
    return canvas.toDataURL("image/jpeg");
  } catch (error) {
    console.error("Error detecting ID card:", error);
    return null;
  }
}
