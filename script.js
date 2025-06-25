let modelURL = "model/";
let model, webcam, maxPredictions;

async function init() {
    model = await tmImage.load(modelURL + "model.json", modelURL + "metadata.json");
    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(300, 300, true);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    const resultado = document.getElementById("resultado");
    const video = document.getElementById("video-resposta");

    prediction.forEach(p => {
        if (p.probability > 0.95) {
            resultado.innerText = `Pergunta detectada: ${p.className}`;
            if (p.className === "derivada_1_x") {
                video.src = "resposta_derivada_1_x.mp4";
                video.play();
            }
        }
    });
}

init();
