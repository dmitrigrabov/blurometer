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
    const predictions = await model.detect(img);
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

    // Draw rectangles and labels for all predictions
    predictions.forEach((pred) => {
      const [x, y, width, height] = pred.bbox;
      ctx.strokeStyle = pred === cardPrediction ? "#00ff00" : "#ff0000"; // Green for card, red for others
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      ctx.font = "18px Arial";
      ctx.fillStyle = pred === cardPrediction ? "#00ff00" : "#ff0000";
      const label = `${pred.class} (${(pred.score * 100).toFixed(1)}%)`;
      ctx.fillText(label, x + 4, y + 22);
    });

    // Optionally, crop the card area as before (tight crop)
    const [x, y, width, height] = cardPrediction.bbox;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = width;
    cropCanvas.height = height;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) throw new Error("Could not get crop canvas context");
    cropCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

    // Return the cropped image with rectangles/labels as base64
    const result = cropCanvas.toDataURL("image/jpeg", 0.95);
    console.log("Cropped image generated, length:", result.length);
    return result;
  } catch (error) {
    console.error("Error detecting ID card:", error);
    return null;
  }
}
