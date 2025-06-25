let model, webcam;
const modelURL = "model/";
const CONFIDENCE_THRESHOLD = 0.90;
let isPlayingVideo = false;
const VIDEO_SRC = "resposta_derivada_1_x.mp4";

async function init() {
    try {
        // 1. Carrega o modelo
        document.getElementById("resultado").innerText = "Carregando modelo...";
        model = await tmImage.load(modelURL + "model.json", modelURL + "metadata.json");
        console.log("✅ Modelo carregado com sucesso");
        
        // 2. Configura o vídeo (inicialmente oculto)
        const video = document.getElementById("video-resposta");
        video.style.display = "block";
        video.src = VIDEO_SRC;
        video.muted = true; // Essencial para autoplay
        video.preload = "auto"; // Pré-carrega o vídeo
        video.playsInline = true; // Importante para mobile
        
        // 3. Configura a webcam
        document.getElementById("resultado").innerText = "Configurando câmera...";
        webcam = new tmImage.Webcam(300, 300, true);
        
        await webcam.setup();
        await webcam.play();
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        document.getElementById("resultado").innerText = "Aguardando gesto...";
        
        // 4. Inicia o loop de detecção
        window.requestAnimationFrame(loop);
        
        // 5. Adiciona listener para interação necessária em alguns navegadores
        document.body.addEventListener('click', () => {
            console.log("Interação registrada - autoplay liberado");
        });
        
    } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        document.getElementById("resultado").innerText = "Erro ao iniciar. Verifique o console.";
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    try {
        const prediction = await model.predict(webcam.canvas);
        const resultado = document.getElementById("resultado");
        const video = document.getElementById("video-resposta");

        // Encontra a predição com maior probabilidade
        const bestPrediction = prediction.reduce((max, current) => 
            current.probability > max.probability ? current : max
        );

        resultado.innerText = `Analisando: ${bestPrediction.className} (${(bestPrediction.probability * 100).toFixed(1)}%)`;

        if (bestPrediction.probability >= CONFIDENCE_THRESHOLD && bestPrediction.className === "derivada_1_x") {
            if (!isPlayingVideo) {
                console.log("🎬 Tentando reproduzir vídeo...");
                video.style.display = "block";
                video.currentTime = 0;
                
                const playPromise = video.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        isPlayingVideo = true;
                        resultado.innerText = `Resposta para: ${bestPrediction.className}`;
                        console.log("✅ Vídeo iniciado com sucesso");
                    }).catch(e => {
                        console.error("❌ Falha no autoplay:", e);
                        // Mostra controles se falhar
                        video.controls = true;
                        resultado.innerText += " - Clique no vídeo para reproduzir";
                    });
                }
            }
        } else {
            if (isPlayingVideo) {
                video.style.display = "none";
                video.pause();
                isPlayingVideo = false;
            }
        }
    } catch (error) {
        console.error("❌ Erro na predição:", error);
    }
}

// Event listeners para controle do vídeo
document.getElementById("video-resposta").addEventListener('ended', () => {
    const video = document.getElementById("video-resposta");
    video.style.display = "none";
    isPlayingVideo = false;
    console.log("⏹ Vídeo terminado");
});

document.getElementById("video-resposta").addEventListener('error', (e) => {
    console.error("❌ Erro no vídeo:", e);
    document.getElementById("resultado").innerText = "Erro no vídeo. Verifique o console.";
});

// Inicializa quando a página carrega
window.addEventListener('DOMContentLoaded', init);