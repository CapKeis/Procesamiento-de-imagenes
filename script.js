// ------------------ SHADER: video-filter ------------------
AFRAME.registerShader('video-filter', {
  schema: {
    map: { type: 'map', is: 'uniform' },
    mode: { type: 'int', is: 'uniform', default: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D map;
    uniform int mode;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(map, vUv);
      if (mode == 1) {
        // Grayscale
        float l = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(vec3(l), color.a);
      } else if (mode == 2) {
        // Sepia
        vec3 c = color.rgb;
        float r = dot(c, vec3(0.393, 0.769, 0.189));
        float g = dot(c, vec3(0.349, 0.686, 0.168));
        float b = dot(c, vec3(0.272, 0.534, 0.131));
        gl_FragColor = vec4(clamp(vec3(r, g, b), 0.0, 1.0), color.a);
      } else if (mode == 3) {
        // Invertir colores
        gl_FragColor = vec4(vec3(1.0 - color.rgb), color.a);
      } else {
        gl_FragColor = color;
      }
    }`
});

// ==== Este script mejora la camara ====
// navigator.mediaDevices.getUserMedia({
//   video: {
//     facingMode: "environment", 
//     width: { ideal: 1920 },
//     height: { ideal: 1080 }
//   }
// }).then(stream => {
// });

// ------------------ lógica AR / entidades ------------------
const totalTargets = 78; // 13 países × 6 imágenes cada uno
const container = document.getElementById("targets-container");
let currentEntity = null;

// Animación (play/pause)
let animRunning = true;

// Animaciones disponibles
const animationTypes = [
  { property: "rotation", to: "0 360 0", dur: 5000 },  
  { property: "scale", to: "0.07 0.07 0.07", dur: 2000, dir: "alternate" }, 
  { property: "position", to: "0 0.6 0", dur: 2000, dir: "alternate" } 
];

function createEntity(i, range, modelSrc, videoId, pos="0 0.3 0", scale="0.05 0.05 0.05") {
  if (i >= range[0] && i <= range[1]) {
    const entity = document.createElement("a-entity");
    entity.setAttribute("mindar-image-target", `targetIndex: ${i}`);

    // Modelo animado
    let modelAR = document.createElement("a-gltf-model");
    modelAR.setAttribute("src", modelSrc);
    modelAR.setAttribute("position", pos);
    modelAR.setAttribute("scale", scale);

    // VIDEO: plano con shader 'video-filter'
    let videoAR = document.createElement("a-plane");
    videoAR.setAttribute("material", `shader: video-filter; map: ${videoId}; mode: 0; side: double;`);
    videoAR.setAttribute("position", "0 0.3 0");
    videoAR.setAttribute("scale", "1 0.9 1");
    videoAR.setAttribute("visible", "false");
    videoAR.dataset.video = videoId;

    entity.appendChild(modelAR);
    entity.appendChild(videoAR);

    entity.modelAR = modelAR;
    entity.videoAR = videoAR;

    entity.addEventListener("targetFound", () => {
      currentEntity = entity;
      document.getElementById("ar-ui").style.display = "flex";
    });

    entity.addEventListener("targetLost", () => {
      if (currentEntity === entity) {
        currentEntity = null;
      }
      document.getElementById("ar-ui").style.display = "none";
      document.getElementById("filter-ui").style.display = "none";
      document.getElementById("anim-ui").style.display = "none";
    });

    container.appendChild(entity);
  }
}

// ------------------ CREACIÓN DE ENTIDADES POR PAÍS ------------------
// Ejemplo reducido con 13 países (ajusta según tus rangos reales)
for (let i = 0; i < totalTargets; i++) {
  createEntity(i, [0,5], "modelos/copa_mundial.glb", "#video-ARG", "0 0.2 0", "0.01 0.01 0.01");
  createEntity(i, [6,11], "modelos/balon_futbol_paises.glb", "#video-AUS");
  createEntity(i, [12,17], "modelos/copa_mundial.glb", "#video-BRA", "0 0.2 0", "0.01 0.01 0.01");
  createEntity(i, [18,23], "modelos/balon_de_futbol.glb", "#video-CAN");
  createEntity(i, [24,29], "modelos/balon_futbol_paises.glb", "#video-COR");
  createEntity(i, [30,35], "modelos/copa_mundial.glb", "#video-ECU", "0 0.2 0", "0.01 0.01 0.01");
  createEntity(i, [36,41], "modelos/balon_de_futbol.glb", "#video-EU");
  createEntity(i, [42,47], "modelos/balon_futbol_paises.glb", "#video-IRN");
  createEntity(i, [48,53], "modelos/copa_mundial.glb", "#video-JPN", "0 0.2 0", "0.01 0.01 0.01");
  createEntity(i, [54,59], "modelos/balon_de_futbol.glb", "#video-JRD");
  createEntity(i, [60,65], "modelos/balon_futbol_paises.glb", "#video-MEX");
  createEntity(i, [66,71], "modelos/copa_mundial.glb", "#video-NZL", "0 0.2 0", "0.01 0.01 0.01");
  createEntity(i, [72,77], "modelos/balon_de_futbol.glb", "#video-UZB"); 
}

// ------------------ FUNCIONES BOTONES ------------------
function hideAll() {
  if (currentEntity) {
    if (currentEntity.modelAR) currentEntity.modelAR.setAttribute("visible", "false");
    if (currentEntity.videoAR) {
      currentEntity.videoAR.setAttribute("visible", "false");
      const vidSel = currentEntity.videoAR.dataset.video;
      if (vidSel) {
        const videoEl = document.querySelector(vidSel);
        if (videoEl) {
          videoEl.pause();
          videoEl.currentTime = 0;
          videoEl.style.filter = "none";
        }
      }
      currentEntity.videoAR.setAttribute('material','mode: 0');
    }
  }
  document.getElementById("filter-ui").style.display = "none";
  document.getElementById("anim-ui").style.display = "none";
}

function showModel() {
  hideAll();
  if (currentEntity && currentEntity.modelAR) {
    currentEntity.modelAR.setAttribute("visible", "true");
    document.getElementById("anim-ui").style.display = "flex";
    animRunning = false;
    document.getElementById("anim-toggle-btn").innerText = "▶ Iniciar Animación";
  }
}

function showVideo() {
  hideAll();
  if (currentEntity && currentEntity.videoAR) {
    currentEntity.videoAR.setAttribute("visible", "true");
    const vidSel = currentEntity.videoAR.dataset.video;
    if (vidSel) {
      const videoEl = document.querySelector(vidSel);
      if (videoEl) videoEl.play();
    }
    document.getElementById("filter-ui").style.display = "flex";
  }
}

function restartScanner() {
  hideAll();
  document.getElementById("ar-ui").style.display = "none";
  document.getElementById("filter-ui").style.display = "none";
  document.getElementById("anim-ui").style.display = "none";
}

// ---------------- FILTROS ----------------
function applyFilter(type) {
  if (!currentEntity || !currentEntity.videoAR) return;
  const vidSel = currentEntity.videoAR.dataset.video;
  const videoEl = vidSel ? document.querySelector(vidSel) : null;

  let mode = 0;
  if (type === 'grayscale') mode = 1;
  else if (type === 'sepia') mode = 2;
  else if (type === 'invert') mode = 3;

  currentEntity.videoAR.setAttribute('material', `mode: ${mode}`);

  if (videoEl) {
    if (type === 'grayscale') videoEl.style.filter = "grayscale(100%)";
    else if (type === 'sepia') videoEl.style.filter = "sepia(100%)";
    else if (type === 'invert') videoEl.style.filter = "invert(100%)";
    else videoEl.style.filter = "none";
  }
}

// ---------------- ANIMACIÓN ----------------
function toggleAnimation() {
  if (!currentEntity || !currentEntity.modelAR) return;

  if (!animRunning) {
    // elegir animación al azar
    const anim = animationTypes[Math.floor(Math.random() * animationTypes.length)];
    let attr = `property: ${anim.property}; to: ${anim.to}; loop: true; dur: ${anim.dur}`;
    if (anim.dir) attr += `; dir: ${anim.dir}`;
    currentEntity.modelAR.setAttribute("animation", attr);

    animRunning = true;
    document.getElementById("anim-toggle-btn").innerText = "⏸ Pausar Animación";
  } else {
    currentEntity.modelAR.removeAttribute("animation");
    animRunning = false;
    document.getElementById("anim-toggle-btn").innerText = "▶ Iniciar Animación";
  }
}

