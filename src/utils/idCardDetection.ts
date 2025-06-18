import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export let model: cocoSsd.ObjectDetection | null = null;

export function resetModel() {
  model = null;
}

async function loadModel() {
  if (!model) {
    // Initialize TensorFlow.js with WebGL backend
    await tf.setBackend("webgl");
    await tf.ready();

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
    console.log("Starting ID card detection...");
    const model = await loadModel();
    console.log("Model loaded successfully");

    // Create an image element from base64
    const img = new globalThis.Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = base64Image;
    });
    console.log("Image loaded, dimensions:", img.width, "x", img.height);

    // Detect objects in the image
    console.log("Running object detection...");
    const predictions = await model.detect(img, 3, 0.2);
    console.log("Detection results:", predictions);

    // Look for document/card-like objects
    const cardPrediction = predictions.find(
      (pred: Prediction) =>
        pred.class === "book" || // COCO-SSD sometimes classifies cards as books
        pred.class === "cell phone" || // or phones
        pred.class === "remote" // or remotes
    );

    if (!cardPrediction) {
      console.log("No card-like object detected");
      return null;
    }
    console.log("Card detected:", cardPrediction);

    // Create a canvas to draw all detections
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Optionally, crop the card area as before (tight crop)
    const [x, y, width, height] = cardPrediction.bbox;

    // Add 10% margin to the crop size
    const marginX = width * 0.05;
    const marginY = height * 0.05;

    const expandedX = Math.max(0, x - marginX);
    const expandedY = Math.max(0, y - marginY);
    const expandedWidth = Math.min(img.width - expandedX, width + 2 * marginX);
    const expandedHeight = Math.min(
      img.height - expandedY,
      height + 2 * marginY
    );

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = expandedWidth;
    cropCanvas.height = expandedHeight;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) throw new Error("Could not get crop canvas context");
    cropCtx.drawImage(
      canvas,
      expandedX,
      expandedY,
      expandedWidth,
      expandedHeight,
      0,
      0,
      expandedWidth,
      expandedHeight
    );

    // Return the cropped image with rectangles/labels as base64
    const result = cropCanvas.toDataURL("image/jpeg", 1);
    console.log("Cropped image generated, length:", result.length);
    return result;
  } catch (error) {
    console.error("Error detecting ID card:", error);
    return null;
  }
}
