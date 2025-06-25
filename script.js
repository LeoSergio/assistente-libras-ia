// Configurações
const MODEL_PATH = "model/";
const VIDEO_SOURCES = {
    "derivada_1_x": "videos/resposta_derivada_1_x.mp4",
    "letra_a": "videos/resposta_letra_a.mp4"
};
const CONFIDENCE_THRESHOLD = 0.85;

// Elementos DOM
const webcamElement = document.getElementById("webcam");
const canvasElement = document.getElementById("canvas");
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

// Variáveis globais
let model = null;
let webcam = null;
let isModelLoaded = false;
let debugMode = false;
let classes = [];

// Inicialização
async function init() {
    try {
        debugStatus.textContent = "Carregando modelo...";
        
        // Carrega o modelo
        model = await tmImage.load(MODEL_PATH + "model.json", MODEL_PATH + "metadata.json");
        classes = model.getClassLabels();
        modelClassesElement.textContent = classes.join(", ");
        
        isModelLoaded = true;
        debugStatus.textContent = "Modelo carregado com sucesso";
        
        // Configura botões
        startButton.addEventListener("click", startWebcam);
        debugBtn.addEventListener("click", toggleDebug);
        
        debugStatus.textContent = "Aguardando início da câmera...";
        
    } catch (error) {
        console.error("Erro na inicialização:", error);
        debugStatus.textContent = `Erro: ${error.message}`;
    }
}

// Inicia a webcam
async function startWebcam() {
    try {
        debugStatus.textContent = "Iniciando câmera...";
        startButton.disabled = true;
        
        // Configura a webcam
        webcam = new tmImage.Webcam(300, 300, true);
        await webcam.setup();
        await webcam.play();
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        
        // Atualiza os elementos visuais
        webcamElement.width = webcam.width;
        webcamElement.height = webcam.height;
        canvasElement.width = webcam.width;
        canvasElement.height = webcam.height;
        
        debugStatus.textContent = "Câmera iniciada - Detectando gestos...";
        
        // Inicia o loop de detecção
        requestAnimationFrame(loop);
        
    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        debugStatus.textContent = `Erro na câmera: ${error.message}`;
        startButton.disabled = false;
    }
}

// Loop principal de detecção
async function loop() {
    if (webcam) {
        webcam.update(); // Atualiza o frame da webcam
        await predict();
    }
    requestAnimationFrame(loop);
}

// Faz a predição do gesto
async function predict() {
    if (!isModelLoaded || !webcam) return;
    
    try {
        // Faz a predição
        const predictions = await model.predict(webcam.canvas);

        
        // Encontra a predição com maior confiança
        let topPrediction = predictions[0];
        for (const pred of predictions) {
            if (pred.probability > topPrediction.probability) {
                topPrediction = pred;
            }
        }
        
        // Atualiza a UI
        updateResults(topPrediction);
        
        // Debug
        if (debugMode) {
            lastPredictionElement.textContent = JSON.stringify(predictions.map(p => {
                return {
                    class: p.className,
                    confidence: (p.probability * 100).toFixed(1) + "%"
                };
            }), null, 2);
        }
        
    } catch (error) {
        console.error("Erro na predição:", error);
    }
}

// Atualiza os resultados na tela
function updateResults(prediction) {
    const confidence = prediction.probability;
    const confidencePercent = Math.round(confidence * 100);
    
    // Atualiza a barra de confiança
    confidenceBar.style.width = confidencePercent + "%";
    confidenceValue.textContent = confidencePercent;
    
    // Se a confiança for alta o suficiente
    if (confidence >= CONFIDENCE_THRESHOLD) {
        resultadoElement.textContent = prediction.className;
        resultadoElement.style.color = "#27ae60";
        
        // Mostra o vídeo correspondente
        playResponseVideo(prediction.className);
    } else {
        resultadoElement.textContent = "Indeterminado";
        resultadoElement.style.color = "#e74c3c";
        hideResponseVideo();
    }
}

// Reproduz o vídeo de resposta
function playResponseVideo(className) {
    if (VIDEO_SOURCES[className]) {
        respostaVideo.src = VIDEO_SOURCES[className];
        respostaVideo.style.display = "block";
        
        // Tenta reproduzir automaticamente
        respostaVideo.play().catch(e => {
            console.log("Autoplay bloqueado, mostrando controles");
            respostaVideo.controls = true;
        });
    }
}

// Oculta o vídeo de resposta
function hideResponseVideo() {
    respostaVideo.style.display = "none";
    respostaVideo.pause();
    respostaVideo.currentTime = 0;
}

// Alterna o modo debug
function toggleDebug() {
    debugMode = !debugMode;
    debugInfo.classList.toggle("hidden");
    debugBtn.textContent = debugMode ? "Ocultar Debug" : "Mostrar Debug";
}

// Inicializa o aplicativo
document.addEventListener("DOMContentLoaded", init);