import "./App.css";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { calculateBlurriness } from "./utils/blurDetection";
import { detectIdCard } from "./utils/idCardDetection";

const App = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const [blurriness, setBlurriness] = useState<number | null>(null);
  const [detectedIdCard, setDetectedIdCard] = useState<string | null>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const imageSrc = webcamRef.current?.getScreenshot();

      if (imageSrc) {
        console.time("calculateBlurriness");
        calculateBlurriness(imageSrc).then((blurriness) => {
          console.timeEnd("calculateBlurriness");
          setBlurriness(blurriness);
        });

        detectIdCard(imageSrc).then((idCard) => {
          if (idCard) {
            setDetectedIdCard(idCard);
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [webcamRef]);

  return (
    <div className="app-container">
      <div className="camera-container">
        <Webcam
          audio={false}
          height={720}
          screenshotFormat="image/jpeg"
          width={1280}
          videoConstraints={videoConstraints}
          ref={webcamRef}
        />
      </div>
      <div className="info-container">
        <p>Blurriness: {blurriness?.toFixed(2) ?? "Calculating..."}</p>
        {detectedIdCard && (
          <div className="id-card-container">
            <h3>Detected ID Card:</h3>
            <img
              src={detectedIdCard}
              alt="Detected ID Card"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
