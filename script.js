const MODEL_PATH = "model/";
const VIDEO_SOURCES = {
    "derivada_1_x": "videos/resposta_derivada_1_x.mp4",
    "letra_a": "videos/resposta_letra_a.mp4"
};
const CONFIDENCE_THRESHOLD = 0.85;

const startButton = document.getElementById("start-btn");
const resultadoElement = document.getElementById("gesto-resultado");
const confidenceBar = document.getElementById("confidence-level");
const confidenceValue = document.getElementById("confidence-value");
const respostaVideo = document.getElementById("resposta-video");
const debugBtn = document.getElementById("debug-btn");
const debugInfo = document.getElementById("debug-info");
const debugStatus = document.getElementById("debug-status");
const modelClassesElement = document.getElementById("model-classes");
const lastPredictionElement = document.getElementById("last-prediction");

let model = null;
let webcam = null;
let isModelLoaded = false;
let debugMode = false;
let classes = [];

async function init() {
    try {
        debugStatus.textContent = "Carregando modelo...";
        model = await tmImage.load(MODEL_PATH + "model.json", MODEL_PATH + "metadata.json");
        classes = model.getClassLabels();
        modelClassesElement.textContent = classes.join(", ");
        isModelLoaded = true;
        debugStatus.textContent = "Modelo carregado com sucesso";
        startButton.addEventListener("click", startWebcam);
        debugBtn.addEventListener("click", toggleDebug);
        debugStatus.textContent = "Aguardando início da câmera...";
    } catch (error) {
        console.error("Erro na inicialização:", error);
        debugStatus.textContent = `Erro: ${error.message}`;
    }
}

async function startWebcam() {
    try {
        debugStatus.textContent = "Iniciando câmera...";
        startButton.disabled = true;

        webcam = new tmImage.Webcam(300, 300, true);
        await webcam.setup();
        await webcam.play();

        webcam.canvas.classList.add("webcam-canvas");
        document.getElementById("webcam-wrapper").appendChild(webcam.canvas);

        debugStatus.textContent = "Câmera iniciada - Detectando gestos...";
        requestAnimationFrame(loop);
    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        debugStatus.textContent = `Erro na câmera: ${error.message}`;
        startButton.disabled = false;
    }
}

async function loop() {
    if (webcam) {
        webcam.update();
        await predict();
    }
    requestAnimationFrame(loop);
}

async function predict() {
    if (!isModelLoaded || !webcam) return;

    try {
        const predictions = await model.predict(webcam.canvas);
        let topPrediction = predictions[0];
        for (const pred of predictions) {
            if (pred.probability > topPrediction.probability) {
                topPrediction = pred;
            }
        }
        updateResults(topPrediction);

        if (debugMode) {
            lastPredictionElement.textContent = JSON.stringify(predictions.map(p => ({
                class: p.className,
                confidence: (p.probability * 100).toFixed(1) + "%"
            })), null, 2);
        }
    } catch (error) {
        console.error("Erro na predição:", error);
    }
}

function updateResults(prediction) {
    const confidence = prediction.probability;
    const confidencePercent = Math.round(confidence * 100);

    confidenceBar.style.width = confidencePercent + "%";
    confidenceValue.textContent = confidencePercent;

    if (confidence >= CONFIDENCE_THRESHOLD) {
        resultadoElement.textContent = prediction.className;
        resultadoElement.style.color = "#27ae60";
        playResponseVideo(prediction.className);
    } else {
        resultadoElement.textContent = "Indeterminado";
        resultadoElement.style.color = "#e74c3c";
        hideResponseVideo();
    }
}

function playResponseVideo(className) {
    if (VIDEO_SOURCES[className]) {
        respostaVideo.src = VIDEO_SOURCES[className];
        respostaVideo.style.display = "block";
        respostaVideo.play().catch(e => {
            respostaVideo.controls = true;
        });
    }
}

function hideResponseVideo() {
    respostaVideo.style.display = "none";
    respostaVideo.pause();
    respostaVideo.currentTime = 0;
}

function toggleDebug() {
    debugMode = !debugMode;
    debugInfo.classList.toggle("hidden");
    debugBtn.textContent = debugMode ? "Ocultar Debug" : "Mostrar Debug";
}

document.addEventListener("DOMContentLoaded", init);
