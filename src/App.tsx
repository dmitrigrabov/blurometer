import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { calculateBlurriness } from "./utils/blurDetection";
import { detectIdCard } from "./utils/idCardDetection";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

type Image = {
  src: string;
  blurriness: number;
};

const App = () => {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const webcamRef = useRef<Webcam | null>(null);

  const [detectedIdCard, setDetectedIdCard] = useState<Image | null>(null);

  useEffect(() => {
    if (model) {
      return;
    }
    async function loadModel() {
      // Initialize TensorFlow.js with WebGL backend
      await tf.setBackend("webgl");
      await tf.ready();

      const loaded = await cocoSsd.load();

      setModel(loaded);
    }

    loadModel();
  }, [model]);

  useEffect(() => {
    const interval = setInterval(() => {
      const imageSrc = webcamRef.current?.getScreenshot();

      if (imageSrc && model) {
        console.time("TIME:detectIdCard");
        detectIdCard(imageSrc, model).then((idCard) => {
          console.timeEnd("TIME:detectIdCard");

          if (!idCard) {
            return;
          }

          console.time("TIME:calculateBlurriness");
          calculateBlurriness(idCard).then((blurriness) => {
            console.timeEnd("TIME:calculateBlurriness");

            if (!detectedIdCard || blurriness > detectedIdCard.blurriness) {
              setDetectedIdCard({ src: idCard, blurriness });
            }
          });
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [webcamRef, detectedIdCard, model]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen/2">
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-1">
          <Webcam
            audio={false}
            screenshotFormat="image/jpeg"
            ref={webcamRef}
            screenshotQuality={1}
            videoConstraints={{ facingMode: "environment" }}
          />
        </div>
        <div className="flex flex-col flex-1">
          {detectedIdCard && (
            <div className="id-card-container">
              <h3>Detected ID Card:</h3>
              <img
                src={detectedIdCard.src}
                alt="Detected ID Card"
                style={{ maxWidth: "100%", height: "auto" }}
              />

              <div className="flex flex-1">
                <p>
                  Blurriness:{" "}
                  {detectedIdCard.blurriness?.toFixed(2) ?? "Calculating..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
