import * as faceapi from "face-api.js";
import React, { useState, useRef, useEffect } from "react";

import "./App.css";

function App() {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [captureVideo, setCaptureVideo] = useState(false);

    const videoRef = useRef();
    const canvasRef = useRef();

    const width = 1280;
    const height = 720;

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = process.env.PUBLIC_URL + "/models";

            Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            ]).then(setModelsLoaded(true));
        };
        loadModels();
    }, []);

    const startVideo = () => {
        setCaptureVideo(true);
        navigator.mediaDevices
            .getUserMedia({
                video: { width, height },
                audio: false,
            })
            .then((stream) => {
                let video = videoRef.current;
                video.srcObject = stream;
                video.play();
            })
            .catch((err) => {
                console.log("error : ", err);
            });
    };

    const handleVideoOnPlay = () => {
        setInterval(async () => {
            if (canvasRef && canvasRef.current) {
                canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
                const displaySize = {
                    width,
                    height,
                };

                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                console.log(resizedDetections);

                canvasRef && canvasRef.current && canvasRef.current.getContext("2d").clearRect(0, 0, width, height);
                canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                canvasRef && canvasRef.current && faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
                canvasRef && canvasRef.current && faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
                canvasRef &&
                    canvasRef.current &&
                    resizedDetections.forEach((result) => {
                        const { age, gender, genderProbability } = result;
                        new faceapi.draw.DrawTextField([`Perkiraan Umur ${Math.round(age, 0)} Tahun`, `Jenis Kelamin : ${gender} ${Math.round(genderProbability)}`], result.detection.box.bottomLeft).draw(canvasRef.current);
                    });
            }
        }, 2000);
    };

    const closeWebcam = () => {
        videoRef.current.pause();
        videoRef.current.srcObject.getTracks()[0].stop();
        setCaptureVideo(false);
    };

    return (
        <div className="App">
            <div style={{ textAlign: "center", padding: "10px" }}>
                {captureVideo && modelsLoaded ? (
                    <button onClick={closeWebcam} className="btn">
                        Close Webcam
                    </button>
                ) : (
                    <button onClick={startVideo} className="btn">
                        Open Webcam
                    </button>
                )}
            </div>
            {captureVideo ? (
                modelsLoaded ? (
                    <div>
                        <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
                            <video ref={videoRef} height={height} width={width} onPlay={handleVideoOnPlay} style={{ borderRadius: "10px" }} />
                            <canvas ref={canvasRef} style={{ position: "absolute" }} />
                        </div>
                    </div>
                ) : (
                    <div>loading...</div>
                )
            ) : (
                <></>
            )}
        </div>
    );
}

export default App;
