import "./App.css";
import { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { calculateBlurriness } from "./utils/blurDetection";

const App = () => {
  const webcamRef = useRef<Webcam | null>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  useEffect(() => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (imageSrc) {
      calculateBlurriness(imageSrc).then((blurriness) => {
        console.log("Calculated blurriness", blurriness);
      });
    }

    const interval = setInterval(() => {
      const imageSrc = webcamRef.current?.getScreenshot();

      if (imageSrc) {
        console.time("calculateBlurriness");
        calculateBlurriness(imageSrc).then((blurriness) => {
          console.timeEnd("calculateBlurriness");
          console.log("Calculated blurriness", blurriness);
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [webcamRef]);

  return (
    <div>
      <Webcam
        audio={false}
        height={720}
        screenshotFormat="image/jpeg"
        width={1280}
        videoConstraints={videoConstraints}
        ref={webcamRef}
      ></Webcam>
    </div>
  );
};

export default App;
