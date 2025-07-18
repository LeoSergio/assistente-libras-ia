let gestoConfirmado = null;

const MODEL_PATH = "model/";
const VIDEO_SOURCES = {
    "derivada_1_x": "resposta_derivada_1_x.mp4",
    "letra_a": "resposta_letra_a.mp4"
};
const CONFIDENCE_THRESHOLD = 0.85;

const startButton = document.getElementById("start-btn");
const enviarBtn = document.getElementById("enviar-btn");
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
let gestoDetectado = null; // ⬅️ Armazena o último gesto válido

async function init() {
    try {
        debugStatus.textContent = "Carregando modelo...";
        model = await tmImage.load(MODEL_PATH + "model.json", MODEL_PATH + "metadata.json");
        classes = model.getClassLabels();
        modelClassesElement.textContent = classes.join(", ");
        isModelLoaded = true;
        debugStatus.textContent = "Modelo carregado com sucesso";

        startButton.addEventListener("click", startWebcam);
        enviarBtn.addEventListener("click", () => {
            if (gestoConfirmado) {
                playResponseVideo(gestoConfirmado);
            } else {
                resultadoElement.textContent = "Nenhum gesto válido detectado.";
                resultadoElement.style.color = "#e67e22";
            }
        });

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

        // ✅ Armazena gesto só se ainda não foi salvo
        if (!gestoConfirmado) {
            gestoConfirmado = prediction.className;
            console.log("Gesto confirmado:", gestoConfirmado);
        }
    } else {
        resultadoElement.textContent = "Indeterminado";
        resultadoElement.style.color = "#e74c3c";
        // Não limpamos gestoConfirmado aqui, deixamos salvo até clicar no botão
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

enviarBtn.addEventListener("click", () => {
    respostaVideo.src = "resposta_derivada_1_x.mp4"; // ou qualquer vídeo
    respostaVideo.style.display = "block";
    respostaVideo.muted = true;
    respostaVideo.playsInline = true;

    respostaVideo.play().catch(e => {
        respostaVideo.controls = true;
    });
});
function mostrarVideoResposta() {
    respostaVideo.src = "resposta_derivada_1_x.mp4"; // seu vídeo de demonstração
    respostaVideo.style.display = "block";
    respostaVideo.muted = false;              // permite som se quiser
    respostaVideo.playsInline = true;
    respostaVideo.controls = true;            // ✅ mostra os controles

    // NÃO chama play() diretamente
}

enviarBtn.addEventListener("click", mostrarVideoResposta);


