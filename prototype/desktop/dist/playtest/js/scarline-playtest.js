import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const canvas = document.getElementById("canvas");
const boostFill = document.getElementById("boost-fill");
const statsEl = document.getElementById("stats");
const msgEl = document.getElementById("msg");
const flashEl = document.getElementById("flash");
const menuHint = document.getElementById("menu-hint");
const burnoutBanner = document.getElementById("burnout-banner");
const burnoutText = burnoutBanner?.querySelector("span");
const speedLinesEl = document.getElementById("speed-lines");

let timeScale = 1;
let burnoutFxActive = 0;
let gfxQuality = "high";

function applyQualityPreset() {
  const q = new URLSearchParams(location.search).get("quality");
  const low = q === "low";
  gfxQuality = low ? "low" : "high";
  if (low) {
    ssaoPass.enabled = false;
    renderer.setPixelRatio(1);
    sun.shadow.mapSize.set(2048, 2048);
    bloom.strength = 0.22;
  }
}

function triggerBurnoutBanner(kind, label) {
  if (!burnoutBanner || !burnoutText) return;
  burnoutText.textContent = label;
  burnoutBanner.classList.toggle("wrecked", kind === "wrecked");
  burnoutBanner.style.opacity = "1";
  burnoutBanner.style.transform = "scale(1)";
  speedLinesEl && (speedLinesEl.style.opacity = kind === "takedown" ? "0.55" : "0.85");
  document.body.classList.toggle("fx-wrecked", kind === "wrecked");
  timeScale = kind === "wrecked" ? 0.22 : 0.38;
  burnoutFxActive = kind === "wrecked" ? 1.85 : 1.1;
  pulseFlash(kind === "wrecked" ? 0.35 : 0.28);
  player.impactShake = Math.max(player.impactShake || 0, kind === "wrecked" ? 0.65 : 0.4);
}

function tickBurnoutFx(dtReal) {
  if (burnoutFxActive <= 0) return;
  burnoutFxActive -= dtReal;
  if (burnoutFxActive <= 0) {
    timeScale = 1;
    if (burnoutBanner) {
      burnoutBanner.style.opacity = "0";
      burnoutBanner.style.transform = "scale(0.82)";
    }
    speedLinesEl && (speedLinesEl.style.opacity = "0");
    document.body.classList.remove("fx-wrecked");
  }
}

/** Daño arcade: coches aguantan mucho más */
const DAMAGE = {
  wall: 0.0035,
  car: 0.0028,
  carBoost: 0.0045,
  maxPenalty: 0.06,
  penaltyFrom: 0.92,
  visualDarken: 0.35,
};

const CAR_TYPES = {
  hatch: { name: "Hatch RS", color: 0xff6b4a, len: 3.75, w: 1.85, h: 0.52, accel: 46, maxSp: 47, boostSp: 61, resist: 1.15 },
  muscle: { name: "Muscle V8", color: 0xd62839, len: 4.35, w: 2.05, h: 0.58, accel: 41, maxSp: 49, boostSp: 63, resist: 1.25 },
  gt: { name: "GT-7", color: 0x1dd3b0, len: 4.15, w: 1.95, h: 0.48, accel: 43, maxSp: 50, boostSp: 64, resist: 1.1 },
  prototype: { name: "Proto-X", color: 0x9b5cff, len: 4.75, w: 1.9, h: 0.42, accel: 45, maxSp: 52, boostSp: 68, resist: 0.95 },
};

const CIRCUITS = {
  scarline_gp: {
    name: "Scarline GP",
    laps: 2,
    width: 13,
    featured: true,
    // GP layout: pit straight, heavy T1 braking, flowing esses, hairpin and final sweeper.
    points: [
      [56, -38], [56, -15], [56, 8], [51, 23], [39, 30], [25, 27],
      [17, 17], [19, 7], [30, 1], [39, -7], [37, -19], [26, -27],
      [8, -29], [-10, -24], [-25, -13], [-39, 0], [-49, 14], [-50, 27],
      [-41, 37], [-27, 38], [-16, 30], [-12, 18], [-17, 7], [-29, -1],
      [-41, -9], [-43, -22], [-32, -34], [-12, -39], [12, -40], [36, -40],
    ],
    sky: 0x87b5ff,
    fog: 0xc8daf5,
  },
  coastal_ring: {
    name: "Coastal Ring",
    laps: 3,
    width: 13,
    // Coastal GP-style layout: long seafront straight, heavy braking hairpin,
    // flowing middle sector and a second full-throttle return straight.
    points: [
      [66, -8], [66, 20], [62, 37], [50, 47], [30, 50], [2, 50],
      [-28, 50], [-50, 47], [-63, 37], [-67, 20], [-67, -2],
      [-62, -18], [-49, -27], [-34, -29], [-23, -23], [-18, -10],
      [-20, 4], [-30, 13], [-43, 13], [-51, 5], [-53, -8],
      [-47, -27], [-30, -43], [-5, -49], [25, -49], [48, -43],
      [62, -29],
    ],
    sky: 0x6eb5ff,
    fog: 0xa8d4ff,
  },
  industrial_port: {
    name: "Industrial Port",
    laps: 3,
    width: 12,
    // Tight street circuit with two long straights, 90-degree turns and a hairpin.
    points: [
      [52, 34], [52, 5], [52, -28], [45, -39], [30, -43],
      [8, -43], [-20, -43], [-43, -43], [-54, -35], [-54, -18],
      [-54, 9], [-54, 34], [-45, 43], [-28, 43], [-10, 43],
      [4, 36], [8, 23], [2, 12], [-10, 7], [-23, 10],
      [-31, 20], [-29, 31], [-18, 36], [4, 36], [25, 36], [43, 36],
    ],
    sky: 0x9aa3b5,
    fog: 0xbfc7d4,
  },
};

const KEYS = {};
window.addEventListener("keydown", (e) => {
  KEYS[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "Digit1", "Digit2", "Digit3"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyR") resetRace();
  if (e.code === "KeyC") cyclePlayerCar();
  if (e.code === "Digit1") loadCircuit("scarline_gp");
  if (e.code === "Digit2") loadCircuit("coastal_ring");
  if (e.code === "Digit3") loadCircuit("industrial_port");
});
window.addEventListener("keyup", (e) => { KEYS[e.code] = false; });

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.38;
renderer.physicallyCorrectLights = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, 1, 0.2, 650);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
ssaoPass.kernelRadius = 6;
ssaoPass.minDistance = 0.004;
ssaoPass.maxDistance = 0.12;
composer.addPass(ssaoPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.68, 0.86);
composer.addPass(bloom);
const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    exposure: { value: 1.06 },
    saturation: { value: 1.14 },
    contrast: { value: 1.08 },
  },
  vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float exposure,saturation,contrast;
    varying vec2 vUv;
    void main(){
      vec4 c=texture2D(tDiffuse,vUv);
      c.rgb*=exposure;
      float l=dot(c.rgb,vec3(0.299,0.587,0.114));
      c.rgb=mix(vec3(l),c.rgb,saturation);
      c.rgb=(c.rgb-0.5)*contrast+0.5;
      gl_FragColor=c;
    }`,
};
composer.addPass(new ShaderPass(ColorGradeShader));
composer.addPass(new OutputPass());

const sun = new THREE.DirectionalLight(0xffe8cc, 2.1);
sun.position.set(85, 120, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 280;
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
sun.shadow.bias = -0.00015;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xc8e6ff, 0x3d5a40, 0.72));
const fillSun = new THREE.DirectionalLight(0x9ec8ff, 0.35);
fillSun.position.set(-40, 30, -20);
scene.add(fillSun);
scene.add(new THREE.AmbientLight(0x8a9aaa, 0.22));

const trackRoot = new THREE.Group();
scene.add(trackRoot);

const propsRoot = new THREE.Group();
scene.add(propsRoot);

const sparkGeo = new THREE.BufferGeometry();
const sparkCount = 80;
const sparkPos = new Float32Array(sparkCount * 3);
const sparkVel = new Float32Array(sparkCount * 3);
sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(
  sparkGeo,
  new THREE.PointsMaterial({ color: 0xffaa44, size: 0.35, transparent: true, opacity: 0, depthWrite: false })
);
scene.add(sparks);
let sparkLife = 0;
const impactDebris = [];
const smokePuffs = [];
const impactSmokeMat = new THREE.MeshBasicMaterial({ color: 0x555b62, transparent: true, opacity: 0.42, depthWrite: false });

function spawnSmoke(x, y, z, amount = 5) {
  for (let i = 0; i < amount; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.16, 8, 7), impactSmokeMat.clone());
    puff.position.set(x + (Math.random() - 0.5) * 0.7, y + Math.random() * 0.45, z + (Math.random() - 0.5) * 0.7);
    puff.userData = { life: 0.75 + Math.random() * 0.55, maxLife: 1.3, drift: new THREE.Vector3((Math.random()-.5)*0.8, 1.0+Math.random()*1.1, (Math.random()-.5)*0.8) };
    scene.add(puff); smokePuffs.push(puff);
  }
}

function updateImpactEffects(dt) {
  for (let i = impactDebris.length - 1; i >= 0; i--) {
    const d = impactDebris[i];
    d.life -= dt; d.velocity.y -= 13 * dt;
    d.mesh.position.addScaledVector(d.velocity, dt);
    d.mesh.rotation.x += d.spin.x * dt; d.mesh.rotation.y += d.spin.y * dt; d.mesh.rotation.z += d.spin.z * dt;
    if (d.mesh.position.y < 0.12) { d.mesh.position.y = 0.12; d.velocity.y *= -0.22; d.velocity.x *= 0.72; d.velocity.z *= 0.72; }
    if (d.life <= 0) { scene.remove(d.mesh); disposeTree(d.mesh); impactDebris.splice(i, 1); }
  }
  for (let i = smokePuffs.length - 1; i >= 0; i--) {
    const puff = smokePuffs[i], u = puff.userData;
    u.life -= dt; puff.position.addScaledVector(u.drift, dt); puff.scale.multiplyScalar(1 + dt * 0.85);
    puff.material.opacity = Math.max(0, 0.42 * (u.life / u.maxLife));
    if (u.life <= 0) { scene.remove(puff); puff.geometry.dispose(); puff.material.dispose(); smokePuffs.splice(i, 1); }
  }
}


let groundMesh = null;
let skyDome = null;

function disposeTree(root) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(o=>{
    if(o.geometry) geometries.add(o.geometry);
    if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
      materials.add(m);
      for(const value of Object.values(m)) if(value && value.isTexture) textures.add(value);
    });
  });
  geometries.forEach(g=>g.dispose()); textures.forEach(t=>t.dispose()); materials.forEach(m=>m.dispose());
}

function makeSky(colorTop) {
  if (skyDome) { scene.remove(skyDome); disposeTree(skyDome); }
  const geo = new THREE.SphereGeometry(380, 48, 24);
  const sunDir = new THREE.Vector3(85, 120, 45).normalize();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      top: { value: new THREE.Color(colorTop) },
      horizon: { value: new THREE.Color(0xe8eef5) },
      sun: { value: sunDir },
    },
    depthWrite: false,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 horizon;
      uniform vec3 sun;
      varying vec3 vPos;
      void main() {
        float h = vPos.y * 0.5 + 0.5;
        vec3 col = mix(horizon, top, pow(h, 0.72));
        float sunDot = pow(max(dot(vPos, sun), 0.0), 380.0);
        col += vec3(1.0, 0.92, 0.78) * sunDot * 0.55;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  skyDome = new THREE.Mesh(geo, mat);
  scene.add(skyDome);
}

function buildGround() {
  if (groundMesh) { scene.remove(groundMesh); disposeTree(groundMesh); }
  const mat = groundPbrMaterial
    ? groundPbrMaterial.clone()
    : (() => {
      const tex = makeGrassTexture();
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(48, 48);
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.02 });
    })();
  groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(520, 520, 1, 1), mat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
}

function makeGrassTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#2d5a34";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    g.fillStyle = Math.random() > 0.5 ? "#357a3f" : "#244a2c";
    g.fillRect(x, y, 1, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function sampleOval(t, rx, rz) {
  return { x: Math.cos(t) * rx, z: Math.sin(t) * rz };
}

function buildCenterline(def) {
  const pts = [];
  if (def.oval) {
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      const p = sampleOval(t, def.oval.rx, def.oval.rz);
      pts.push(new THREE.Vector3(p.x, 0, p.z));
    }
  } else {
    const raw = def.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(raw, true, "centripetal", 0.35);
    for (let i = 0; i <= 220; i++) pts.push(curve.getPoint(i / 220));
  }
  return pts;
}

const textureLoader = new THREE.TextureLoader();
const ASSET_BASE = "./assets/";
let roadPbrMaterial = null;
let heroGltfTemplate = null;
let assetsReady = false;

function wrapTex(tex, isColor = false, repeat = 14) {
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.repeat.set(repeat, repeat);
  return tex;
}

function loadTex(url, isColor, repeat) {
  return new Promise((resolve, reject) => {
    textureLoader.load(url, (t) => resolve(wrapTex(t, isColor, repeat)), undefined, reject);
  });
}

async function loadRoadPBR() {
  const base = `${ASSET_BASE}textures/`;
  const [diff, normal, rough, ao] = await Promise.all([
    loadTex(`${base}clean_asphalt_diff_2k.jpg`, true, 16),
    loadTex(`${base}clean_asphalt_nor_gl_2k.jpg`, false, 16),
    loadTex(`${base}clean_asphalt_rough_2k.jpg`, false, 16),
    loadTex(`${base}clean_asphalt_ao_2k.jpg`, false, 16),
  ]);
  roadPbrMaterial = new THREE.MeshStandardMaterial({
    map: diff,
    normalMap: normal,
    roughnessMap: rough,
    aoMap: ao,
    aoMapIntensity: 1.1,
    metalness: 0.04,
    roughness: 1,
    color: 0xcccccc,
    envMapIntensity: 0.45,
  });
  roadPbrMaterial.normalScale = new THREE.Vector2(1.35, 1.35);
}

let groundPbrMaterial = null;

async function loadGroundPBR() {
  const base = `${ASSET_BASE}textures/`;
  try {
    const [diff, normal, rough] = await Promise.all([
      loadTex(`${base}grass_diff_1k.jpg`, true, 28),
      loadTex(`${base}grass_nor_gl_1k.jpg`, false, 28),
      loadTex(`${base}grass_rough_1k.jpg`, false, 28),
    ]);
    groundPbrMaterial = new THREE.MeshStandardMaterial({
      map: diff,
      normalMap: normal,
      roughnessMap: rough,
      metalness: 0,
      roughness: 1,
      color: 0xd8e8d4,
    });
    groundPbrMaterial.normalScale = new THREE.Vector2(0.95, 0.95);
  } catch {
    groundPbrMaterial = null;
  }
}

async function setupImageBasedLighting() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  try {
    const hdr = await new RGBELoader().loadAsync(`${ASSET_BASE}hdri/sky_1k.hdr`);
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
  } catch {
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }
  pmrem.dispose();
}

async function loadHeroTemplate() {
  const gltf = await new GLTFLoader().loadAsync(`${ASSET_BASE}vehicles/Spectral_GT_RS_CC0.glb`);
  const model = gltf.scene;
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m) return;
      if (m.map) m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      m.metalness = Math.min(0.9, (m.metalness ?? 0.5) + 0.2);
      m.roughness = Math.max(0.18, (m.roughness ?? 0.4) * 0.85);
      m.envMapIntensity = 1.35;
    });
  });
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const targetLen = 5.15;
  const scale = targetLen / Math.max(size.x, size.z, 0.001);
  model.scale.setScalar(scale);
  model.rotation.y = -Math.PI / 2;
  const aligned = new THREE.Box3().setFromObject(model);
  const center = aligned.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -aligned.min.y + 0.02, -center.z);
  heroGltfTemplate = model;
}

function createSpectralMesh(carTypeKey, tintHex = null) {
  const anchor = new THREE.Group();
  const body = cloneSkinned(heroGltfTemplate);
  body.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (Array.isArray(o.material)) {
      o.material = o.material.map((m) => {
        const c = m.clone();
        if (tintHex && c.color) c.color.lerp(new THREE.Color(tintHex), 0.12);
        return c;
      });
    } else {
      const c = o.material.clone();
      if (tintHex && c.color) c.color.lerp(new THREE.Color(tintHex), 0.12);
      o.material = c;
    }
  });
  anchor.add(body);
  const t = CAR_TYPES[carTypeKey];
  anchor.userData = {
    useGltf: true,
    gltfRoot: body,
    bodyMat: null,
    baseColor: tintHex ?? t.color,
    wheels: [],
    typeKey: carTypeKey,
    damageMarks: [],
    detachedPanels: new Set(),
    detachedWheels: new Set(),
    bumperDetached: false,
    impactScars: new THREE.Group(),
    deformation: 0,
  };
  anchor.add(anchor.userData.impactScars);
  return anchor;
}

function replaceCarMesh(car, tintHex = null) {
  const old = car.mesh;
  scene.remove(old);
  disposeTree(old);
  car.mesh = heroGltfTemplate
    ? createSpectralMesh(car.typeKey, tintHex)
    : makeCarMesh(car.typeKey);
  scene.add(car.mesh);
}

function applyFleetMeshes() {
  if (!heroGltfTemplate) return;
  const rivalTints = [0xd62839, 0x1dd3b0, 0x9b5cff];
  replaceCarMesh(player, null);
  rivals.forEach((r, i) => replaceCarMesh(r, rivalTints[i]));
  CAR_TYPES.hatch.name = "Spectral GT RS";
  assetsReady = true;
}

function makeAsphaltTexture() {
  const c=document.createElement("canvas"); c.width=c.height=512;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#292b30"; ctx.fillRect(0,0,512,512);
  for(let i=0;i<42000;i++){
    const v=24+Math.random()*38;
    ctx.fillStyle=`rgba(${v},${v},${v+3},${Math.random()*0.24})`;
    const x=Math.random()*512,y=Math.random()*512;
    ctx.fillRect(x,y,Math.random()*2.2+0.4,Math.random()*2.2+0.4);
  }
  // Faint longitudinal rubbering and repair seams.
  ctx.strokeStyle="rgba(8,9,12,0.18)"; ctx.lineWidth=5;
  for(let i=0;i<8;i++){const x=70+i*52;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+8,150,x-6,350,x+3,512);ctx.stroke();}
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(2,2); return tex;
}

function clearSceneGroup(group) {
  const geometries=new Set(), materials=new Set();
  group.traverse(o=>{
    if(o.geometry) geometries.add(o.geometry);
    if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));
  });
  while(group.children.length) group.remove(group.children[0]);
  geometries.forEach(g=>g.dispose());
  for(const m of materials) for(const value of Object.values(m)) if(value && value.isTexture) value.dispose();
  materials.forEach(m=>m.dispose());
}

function makeKerbTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 16;
  const ctx = c.getContext("2d");
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#e31837" : "#f3f3f8";
    ctx.fillRect(i * 8, 0, 8, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function buildKerbs(centerline, trackWidth, y) {
  const tex = makeKerbTexture();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0.04 });
  const kerbW = 0.62;
  const buildSide = (sign) => {
    const count = centerline.length - 1;
    const positions = new Float32Array(count * 2 * 3);
    const uvs = new Float32Array(count * 2 * 2);
    const indices = [];
  let dist = 0;
    for (let i = 0; i < count; i++) {
      const prev = centerline[(i - 1 + count) % count];
      const next = centerline[(i + 1) % count];
      const p = centerline[i];
      const tx = next.x - prev.x;
      const tz = next.z - prev.z;
      const len = Math.hypot(tx, tz) || 1;
      const nx = (tz / len) * sign;
      const nz = (-tx / len) * sign;
      if (i > 0) dist += Math.hypot(p.x - centerline[i - 1].x, p.z - centerline[i - 1].z);
      const inner = trackWidth / 2 + 0.12;
      const outer = inner + kerbW;
      const k = i * 6;
      positions[k] = p.x + nx * inner;
      positions[k + 1] = y;
      positions[k + 2] = p.z + nz * inner;
      positions[k + 3] = p.x + nx * outer;
      positions[k + 4] = y;
      positions[k + 5] = p.z + nz * outer;
      const uv = i * 4;
      uvs[uv] = 0;
      uvs[uv + 1] = dist / 1.8;
      uvs[uv + 2] = 1;
      uvs[uv + 3] = dist / 1.8;
      const j = (i + 1) % count;
      const a = i * 2;
      const b = i * 2 + 1;
      const c = j * 2;
      const d = j * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
    tex.repeat.set(1, 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.receiveShadow = true;
    trackRoot.add(mesh);
  };
  buildSide(1);
  buildSide(-1);
}

let facadeMaterial = null;
function getFacadeMaterial() {
  if (facadeMaterial) return facadeMaterial;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#6d737a";
  ctx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 6; col++) {
      const lit = Math.random() > 0.38;
      ctx.fillStyle = lit ? `rgba(255,210,140,${0.35 + Math.random() * 0.45})` : "rgba(30,36,44,0.85)";
      ctx.fillRect(12 + col * 40, 10 + row * 30, 28, 22);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.strokeRect(12 + col * 40, 10 + row * 30, 28, 22);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  facadeMaterial = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.82,
    metalness: 0.12,
    envMapIntensity: 0.55,
  });
  return facadeMaterial;
}

function makeTrackRibbon(points, width, y, material) {
  const count=points.length-1;
  const positions=new Float32Array(count*2*3);
  const uvs=new Float32Array(count*2*2);
  const indices=[];
  let distance=0;
  for(let i=0;i<count;i++){
    const prev=points[(i-1+count)%count], next=points[(i+1)%count], p=points[i];
    const tx=next.x-prev.x, tz=next.z-prev.z, len=Math.hypot(tx,tz)||1;
    const nx=tz/len, nz=-tx/len;
    if(i>0) distance+=Math.hypot(p.x-points[i-1].x,p.z-points[i-1].z);
    const k=i*6, half=width/2;
    positions[k]=p.x+nx*half; positions[k+1]=y; positions[k+2]=p.z+nz*half;
    positions[k+3]=p.x-nx*half; positions[k+4]=y; positions[k+5]=p.z-nz*half;
    const uv=i*4; uvs[uv]=0; uvs[uv+1]=distance/7; uvs[uv+2]=1; uvs[uv+3]=distance/7;
    const j=(i+1)%count, a=i*2,b=i*2+1,c=j*2,d=j*2+1;
    indices.push(a,b,c,b,d,c);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geo.setAttribute("uv",new THREE.BufferAttribute(uvs,2));
  geo.setAttribute("uv2",new THREE.BufferAttribute(uvs.slice(),2));
  geo.setIndex(indices); geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material); mesh.material.side=THREE.DoubleSide;
  mesh.receiveShadow=true; trackRoot.add(mesh); return mesh;
}

function buildTrackMesh(centerline, width) {
  clearSceneGroup(trackRoot);
  clearSceneGroup(propsRoot);

  const asphalt = roadPbrMaterial
    ? roadPbrMaterial.clone()
    : new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: makeAsphaltTexture(),
      roughness: 0.88,
      metalness: 0.02,
    });
  if (asphalt.normalScale) asphalt.normalScale.set(1.35, 1.35);
  const shoulderMat = roadPbrMaterial
    ? roadPbrMaterial.clone()
    : new THREE.MeshStandardMaterial({ color: 0x6e7068, roughness: 0.96 });
  if (shoulderMat.color) shoulderMat.color.multiplyScalar(0.72);
  makeTrackRibbon(centerline, width + 2.8, 0.028, shoulderMat);
  makeTrackRibbon(centerline, width, 0.095, asphalt);
  buildKerbs(centerline, width, 0.097);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xe8e9e7, roughness: 0.65 });
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xbfc3c8, roughness: 0.7 });
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x555a66,
    roughness: 0.35,
    metalness: 0.55,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xff6b4a,
    emissive: 0xff2200,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.6,
  });

  for (let i = 0; i < centerline.length - 1; i++) {
    const p0 = centerline[i];
    const p1 = centerline[i + 1];
    const dx = p1.x - p0.x;
    const dz = p1.z - p0.z;
    const len = Math.hypot(dx, dz) || 0.001;
    const yaw = Math.atan2(dx, dz);
    const midX = (p0.x + p1.x) / 2;
    const midZ = (p0.z + p1.z) / 2;
    // Continuous ribbons below provide a smooth road surface; these are per-section markings only.
    // Continuous painted white edge lines make the road read as a real circuit.
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, len + 0.25), edgeMat);
      edge.position.set(midX + Math.sin(yaw) * side * (width / 2 - 0.32), 0.132, midZ + Math.cos(yaw) * side * (width / 2 - 0.32));
      edge.rotation.y = yaw;
      trackRoot.add(edge);
    }
    // Dashed centre markings are only used on longer straights.
    if (len > 7 && i % 2 === 0) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.018, Math.min(3.2, len * 0.42)), dashMat);
      dash.position.set(midX, 0.135, midZ);
      dash.rotation.y = yaw;
      trackRoot.add(dash);
    }

    if (i % 11 === 0 && len > 6) {
      for (const side of [-1, 1]) {
        const ox = Math.sin(yaw) * side * (width / 2 + 1.05);
        const oz = Math.cos(yaw) * side * (width / 2 + 1.05);
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.72, len * 0.35 + 0.4), barrierMat);
        wall.position.set(midX + ox, 0.38, midZ + oz);
        wall.rotation.y = yaw;
        wall.castShadow = true;
        trackRoot.add(wall);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, len * 0.35 + 0.4), railMat);
        rail.position.copy(wall.position);
        rail.position.y = 0.68;
        rail.rotation.y = yaw;
        trackRoot.add(rail);
      }
    }
  }

  const s0 = centerline[0];
  const s1 = centerline[1];
  const sy = Math.atan2(s1.x - s0.x, s1.z - s0.z);
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.92, 0.14, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25 })
  );
  line.position.set(s0.x, 0.08, s0.z);
  line.rotation.y = sy;
  trackRoot.add(line);
  // Starting grid boxes and braking-distance boards add familiar motorsport track language.
  const gridMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.75 });
  for (let row = 0; row < 6; row++) {
    for (const side of [-1, 1]) {
      const boxMark = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.008, 2.2), gridMat);
      boxMark.position.set(
        s0.x + Math.sin(sy) * (-5 - row * 3) + Math.cos(sy) * side * 2.1,
        0.102,
        s0.z + Math.cos(sy) * (-5 - row * 3) - Math.sin(sy) * side * 2.1
      );
      boxMark.rotation.y = sy;
      trackRoot.add(boxMark);
    }
  }

  addProps(centerline, width);
  addCircuitLife(centerline, width);
}

function addCircuitLife(centerline, width) {
  const addProp = (geo, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    propsRoot.add(m);
    return m;
  };
  const concrete = getFacadeMaterial().clone();
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd4ff, metalness: 0.55, roughness: 0.14, emissive: 0x2a4560, emissiveIntensity: 0.35, envMapIntensity: 1.1 });
  const seatColors = [0xff4a3a, 0x3d8bfd, 0x4caf6a, 0xffc947];
  const flagMat = new THREE.MeshStandardMaterial({ color: 0xff6b4a, side: THREE.DoubleSide, emissive: 0x551100, emissiveIntensity: 0.2 });

  function grandstandAt(x, z, yaw, depth = 6, tiers = 4, length = 14) {
    const stand = new THREE.Group();
    stand.position.set(x, 0, z);
    stand.rotation.y = yaw;
    for (let t = 0; t < tiers; t++) {
      const h = 0.42 + t * 0.38;
      const base = new THREE.Mesh(new THREE.BoxGeometry(length, h, depth * 0.85), concrete);
      base.position.set(0, h / 2, 0);
      base.castShadow = true;
      stand.add(base);
      for (let s = 0; s < Math.floor(length / 1.05); s++) {
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.28, 0.42),
          new THREE.MeshStandardMaterial({ color: seatColors[(t + s) % seatColors.length], roughness: 0.65 })
        );
        seat.position.set((s - length / 2.1) * 1.05, 0.35 + t * 0.38, depth * 0.22);
        seat.castShadow = true;
        stand.add(seat);
      }
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(length + 1.2, 0.35, depth + 0.8), steelMat());
    roof.position.set(0, tiers * 0.38 + 0.55, 0);
    stand.add(roof);
    const crowdN = Math.min(420, Math.floor(length * tiers * 5));
    if (crowdN > 8) {
      const crowdGeo = new THREE.SphereGeometry(0.11, 5, 4);
      const crowdMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, crowdN);
      crowd.castShadow = true;
      const dummy = new THREE.Object3D();
      let ci = 0;
      for (let t = 0; t < tiers && ci < crowdN; t++) {
        for (let s = 0; s < Math.floor(length / 0.85) && ci < crowdN; s++) {
          dummy.position.set((s - length / 1.8) * 0.82, 0.55 + t * 0.38, depth * 0.15);
          dummy.scale.setScalar(0.85 + Math.random() * 0.35);
          dummy.updateMatrix();
          crowd.setMatrixAt(ci, dummy.matrix);
          crowd.setColorAt(ci, new THREE.Color().setHSL(0.02 + Math.random() * 0.12, 0.55, 0.38 + Math.random() * 0.22));
          ci++;
        }
      }
      crowd.count = ci;
      crowd.instanceMatrix.needsUpdate = true;
      if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
      stand.add(crowd);
    }
    propsRoot.add(stand);
  }

  function steelMat() {
    return new THREE.MeshStandardMaterial({ color: 0x5a616c, metalness: 0.75, roughness: 0.35 });
  }

  function pitBuilding(x, z, yaw) {
    addProp(new THREE.BoxGeometry(22, 5.5, 9), concrete, x, 2.75, z, yaw);
    addProp(new THREE.BoxGeometry(20, 2.2, 0.35), glass, x, 3.8, z - Math.cos(yaw) * 4.6, yaw);
    for (let i = 0; i < 6; i++) {
      addProp(new THREE.BoxGeometry(2.8, 2.4, 0.15), steelMat(), x - 8 + i * 3.2, 1.2, z + Math.sin(yaw) * 4.3, yaw);
    }
    addProp(new THREE.BoxGeometry(3, 0.9, 0.12), new THREE.MeshStandardMaterial({ color: 0xff6b4a, emissive: 0x772200, emissiveIntensity: 0.5 }), x, 6.2, z - Math.sin(yaw) * 2, yaw);
  }

  for (let i = 0; i < centerline.length; i += 32) {
    const p = centerline[i];
    const p2 = centerline[(i + 2) % centerline.length];
    const yaw = Math.atan2(p2.x - p.x, p2.z - p.z);
    for (const side of [-1, 1]) {
      const ox = Math.sin(yaw) * side * (width / 2 + 11);
      const oz = Math.cos(yaw) * side * (width / 2 + 11);
      if (i % 64 === 0) grandstandAt(p.x + ox, p.z + oz, yaw + (side > 0 ? 0.08 : -0.08));
      if (i % 48 === 12) {
        const bMat = getFacadeMaterial().clone();
        bMat.map = bMat.map.clone();
        bMat.map.repeat.set(1.2, 2);
        addProp(new THREE.BoxGeometry(5, 7, 5), bMat, p.x + ox * 1.35, 3.5, p.z + oz * 1.35, yaw);
        addProp(new THREE.BoxGeometry(4.2, 1.8, 0.2), glass, p.x + ox * 1.35, 5.8, p.z + oz * 1.35, yaw);
      }
      if (i % 20 === 0) {
        const pole = addProp(new THREE.CylinderGeometry(0.05, 0.05, 3.8, 6), steelMat(), p.x + ox, 1.9, p.z + oz, yaw);
        const flag = addProp(new THREE.PlaneGeometry(1.4, 0.9), flagMat, p.x + ox + 0.7, 3.5, p.z + oz, yaw + Math.PI / 2);
        flag.position.y = 3.3;
      }
    }
  }
  const start = centerline[0];
  const next = centerline[3];
  const sy = Math.atan2(next.x - start.x, next.z - start.z);
  pitBuilding(start.x - Math.cos(sy) * 18, start.z + Math.sin(sy) * 18, sy);
  if (activeCircuitId === "scarline_gp") {
    grandstandAt(-32, 18, -0.35, 7, 5, 24);
    grandstandAt(38, -22, 1.2, 6, 4, 18);
  }
}

function addLandscapeTree(addProp, x, z, leafMat) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3422, roughness: 0.95 });
  addProp(new THREE.CylinderGeometry(0.14, 0.22, 2.6, 8), trunkMat, x, 1.3, z);
  for (let layer = 0; layer < 3; layer++) {
    const s = 1.35 - layer * 0.22;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(s, 1.4, 10), leafMat);
    cone.position.set(x, 2.2 + layer * 1.05, z);
    cone.castShadow = true;
    cone.receiveShadow = true;
    propsRoot.add(cone);
  }
}

function addProps(centerline, width) {
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x222228, metalness: 0.7, roughness: 0.35 });
  const lightBulb = new THREE.MeshStandardMaterial({ color: 0xfff0cc, emissive: 0xffaa55, emissiveIntensity: 1.2 });
  const addProp = (geo, mat, x, y, z, ry=0) => {
    const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true; propsRoot.add(m); return m;
  };
  const concrete = new THREE.MeshStandardMaterial({color:0x777d83,roughness:0.92});
  const glass = new THREE.MeshStandardMaterial({color:0x263b4b,metalness:0.45,roughness:0.2});
  const steel = new THREE.MeshStandardMaterial({color:0x4a515b,metalness:0.8,roughness:0.32});
  const foliage = [0x28583a,0x356b42,0x477b45].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:1}));
  for (let i = 0; i < centerline.length; i += 24) {
    const p=centerline[i], p2=centerline[(i+2)%centerline.length];
    const yaw=Math.atan2(p2.x-p.x,p2.z-p.z);
    for(const side of [-1,1]){
      const ox=Math.sin(yaw)*side*(width/2+4.5), oz=Math.cos(yaw)*side*(width/2+4.5);
      const pole=addProp(new THREE.CylinderGeometry(0.1,0.15,5.8,10),lampMat,p.x+ox,2.9,p.z+oz);
      const arm=addProp(new THREE.BoxGeometry(1.25,0.1,0.12),lampMat,p.x+ox-Math.sin(yaw)*0.48,5.55,p.z+oz-Math.cos(yaw)*0.48,yaw);
      const bulb=addProp(new THREE.SphereGeometry(0.25,12,12),lightBulb,p.x+ox-Math.sin(yaw)*0.9,5.45,p.z+oz-Math.cos(yaw)*0.9);
      const pl=new THREE.PointLight(0xffcc88,0.28,20); pl.position.copy(bulb.position); propsRoot.add(pl);
    }
  }
  // Circuit-specific landmarks make each venue read differently at a glance.
  if(activeCircuitId==='scarline_gp'){
    // Main grandstand and pit complex on the outside of the start straight.
    addProp(new THREE.BoxGeometry(27,4.2,7),concrete,-28,2.1,12,-0.25);
    addProp(new THREE.BoxGeometry(25,2.1,0.35),glass,-28,3.1,8.35,-0.25);
    for(let i=0;i<9;i++) addProp(new THREE.BoxGeometry(2.2,0.18,1.4),steel,-38+i*2.5,4.35,9.2,-0.25);
    addProp(new THREE.BoxGeometry(20,1.2,5),steel,-28,5.1,12,-0.25);
    for (let i = 0; i < 10; i++) {
      const p = centerline[(i * 18) % centerline.length];
      const side = i % 2 ? 1 : -1;
      const x = p.x + side * (width / 2 + 18 + (i % 3) * 4);
      const z = p.z + (i % 4 - 1.5) * 5;
      addLandscapeTree(addProp, x, z, foliage[i % foliage.length]);
    }
  } else if(activeCircuitId==='coastal_ring'){
    const sand=new THREE.MeshStandardMaterial({color:0xc8b78e,roughness:1});
    const sea=new THREE.MeshStandardMaterial({color:0x167e9c,roughness:0.3,metalness:0.12});
    const beach=addProp(new THREE.PlaneGeometry(230,230),sand,0,-0.12,0); beach.rotation.x=-Math.PI/2;
    const water=addProp(new THREE.PlaneGeometry(210,210),sea,0,-0.08,-120); water.rotation.x=-Math.PI/2;
    const palm = new THREE.MeshStandardMaterial({ color: 0x2d6e48, roughness: 0.88 });
    for (let i = 0; i < 8; i++) {
      const p = centerline[(i * 12) % centerline.length];
      const side = i % 2 ? 1 : -1;
      const x = p.x + side * (width / 2 + 16);
      const z = p.z + ((i % 5) - 2) * 4;
      addLandscapeTree(addProp, x, z, palm);
    }
    for(let i=0;i<7;i++) addProp(new THREE.BoxGeometry(8,3,5),new THREE.MeshStandardMaterial({color:i%2?0xf1e6d2:0xd5e1e4}),-75+i*22,1.5,58+(i%2)*9,0.15);
  } else {
    // Industrial Port: container stacks, gantry cranes, warehouse and dockside machinery.
    const containerMats=[0x9d4b35,0x315d79,0xb18a3d,0x52645b].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.8,metalness:0.25}));
    for(let i=0;i<28;i++){
      const p=centerline[(i*8)%centerline.length], side=i%2?1:-1;
      const x=p.x+side*(width/2+12+(i%3)*3), z=p.z+(i%4-1.5)*4;
      const h=2.6+(i%3)*2.4;
      addProp(new THREE.BoxGeometry(6,h,2.6),containerMats[i%containerMats.length],x,h/2,z,(i%2)*0.12);
      for(let k=0;k<5;k++) addProp(new THREE.BoxGeometry(0.035,h*0.92,0.035),steel,x-2.5+k*1.25,h/2,z+1.33);
    }
    for(const x of [-66,66]){
      addProp(new THREE.BoxGeometry(2,19,2),steel,x,9.5,0);
      addProp(new THREE.BoxGeometry(2,19,2),steel,x+18,9.5,0);
      addProp(new THREE.BoxGeometry(22,1.2,1.2),steel,x+9,19,0);
      addProp(new THREE.BoxGeometry(1,6,1),steel,x+9,15.5,0);
      addProp(new THREE.BoxGeometry(12,0.6,0.6),new THREE.MeshStandardMaterial({color:0xffa62b,emissive:0x5a2700}),x+9,12.3,0);
    }
    addProp(new THREE.BoxGeometry(32,8,12),concrete,0,4,-72);
    addProp(new THREE.BoxGeometry(29,3,0.3),glass,0,5.2,-65.8);
  }
  // Branded overhead start gantry and trackside advertising boards.
  const gantryMat=new THREE.MeshStandardMaterial({color:0x20242c,metalness:0.7,roughness:0.3});
  const start=centerline[0], next=centerline[2], yaw=Math.atan2(next.x-start.x,next.z-start.z);
  const gx=start.x-Math.cos(yaw)*1.5, gz=start.z+Math.sin(yaw)*1.5;
  for(const side of [-1,1]) addProp(new THREE.BoxGeometry(0.45,6,0.45),gantryMat,gx+Math.cos(yaw)*side*(width/2+1.8),3,gz-Math.sin(yaw)*side*(width/2+1.8),yaw);
  addProp(new THREE.BoxGeometry(width+4,0.65,0.7),gantryMat,gx,6,gz,yaw);
  const signMat=new THREE.MeshStandardMaterial({color:0xff6b4a,emissive:0x6b1708,emissiveIntensity:0.55});
  addProp(new THREE.BoxGeometry(5,0.9,0.18),signMat,gx,6.1,gz,yaw);
  for(let i=0;i<10;i++){
    const p=centerline[Math.floor(i/10*centerline.length)];
    const board=addProp(new THREE.BoxGeometry(4.5,1.1,0.22),gantryMat,p.x+(i%2?1:-1)*(width/2+2),1.5,p.z);
    addProp(new THREE.BoxGeometry(4.1,0.65,0.08),signMat,board.position.x,1.52,board.position.z+0.14);
  }
}

let activeCircuitId = "scarline_gp";
let activeDef = CIRCUITS.scarline_gp;
let centerline = [];
let trackWidth = 13;
let totalLaps = 2;

function nearestTrackInfo(x, z) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < centerline.length - 1; i++) {
    const a = centerline[i];
    const b = centerline[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz + 1e-6)));
    const px = a.x + abx * t;
    const pz = a.z + abz * t;
    const d = (x - px) ** 2 + (z - pz) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const a = centerline[best];
  const b = centerline[best + 1];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const tx = dx / len;
  const tz = dz / len;
  const nx = tz;
  const nz = -tx;
  const px = a.x + tx * ((x - a.x) * tx + (z - a.z) * tz);
  const pz = a.z + tz * ((x - a.x) * tx + (z - a.z) * tz);
  const lat = (x - px) * nx + (z - pz) * nz;
  return { index: best, px, pz, nx, nz, tx, tz, lat };
}

function makeCarMesh(typeKey) {
  const t = CAR_TYPES[typeKey];
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: t.color, metalness: 0.72, roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.16,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101720, metalness: 0.35, roughness: 0.22 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x142735, metalness: 0.25, roughness: 0.12, transparent: true, opacity: 0.88, clearcoat: 1 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.92 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x9ca8b5, metalness: 0.92, roughness: 0.2 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xc6ccd3, metalness: 0.95, roughness: 0.22 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xeaf7ff, emissive: 0xb8e8ff, emissiveIntensity: 1.1, roughness: 0.18 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff263b, emissive: 0xff0018, emissiveIntensity: 1.0, roughness: 0.2 });
  const add = (geo, mat, x, y, z, parent=g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const box = (w,h,l,mat,x,y,z,rx=0,ry=0,rz=0) => {
    const m=add(new THREE.BoxGeometry(w,h,l),mat,x,y,z); m.rotation.set(rx,ry,rz); return m;
  };
  const L=t.len, W=t.w, base=0.39;
  // A faceted, tapered body shell sits over the chassis to break up the old box-car silhouette.
  const keyStations = [
    [-L*0.50, W*0.68, base+0.10, base+0.34, base+0.43],
    [-L*0.34, W*0.88, base+0.08, base+0.48, base+0.52],
    [ L*0.02, W*0.96, base+0.08, base+0.53, base+0.56],
    [ L*0.31, W*0.90, base+0.08, base+0.48, base+0.51],
    [ L*0.50, W*0.70, base+0.10, base+0.34, base+0.42],
  ];
  // More longitudinal sections give impacts enough vertices to create readable dents.
  const stations = [];
  for (let i=0;i<keyStations.length-1;i++) {
    const a=keyStations[i], b=keyStations[i+1];
    for(let j=0;j<3;j++) { const t=j/3; stations.push(a.map((v,k)=>v+(b[k]-v)*t)); }
  }
  stations.push(keyStations[keyStations.length-1]);
  const ring = (z, w, low, shoulder, top) => [
    [-w*0.78,low,z], [w*0.78,low,z], [w,low+0.10,z], [w,shoulder,z],
    [w*0.82,top-0.035,z], [w*0.48,top,z], [-w*0.48,top,z],
    [-w*0.82,top-0.035,z], [-w,shoulder,z], [-w,low+0.10,z],
  ];
  const shellVerts=[];
  for (const st of stations) shellVerts.push(...ring(...st));
  const shellIdx=[];
  for(let r=0;r<stations.length-1;r++) for(let k=0;k<10;k++){
    const a=r*10+k, b=r*10+(k+1)%10, c=(r+1)*10+k, d=(r+1)*10+(k+1)%10;
    shellIdx.push(a,b,c,b,d,c);
  }
  const shellGeo=new THREE.BufferGeometry();
  shellGeo.setAttribute('position',new THREE.Float32BufferAttribute(shellVerts,3));
  shellGeo.setIndex(shellIdx); shellGeo.computeVertexNormals();
  const shell=add(shellGeo,paint,0,0,0); shell.material.side=THREE.DoubleSide;
  // Hood vents and rear diffuser details add readable highlights at chase-camera distance.
  for(const side of [-1,1]){
    box(0.34,0.025,0.72,dark,side*W*0.27,base+t.h*0.73,L*0.27,-0.02);
    for(let v=0;v<3;v++) box(0.025,0.018,0.54,chrome,side*W*0.27+(v-1)*0.09,base+t.h*0.75,L*0.27,-0.02);
  }
  box(W*0.72,0.12,0.16,dark,0,base+0.12,-L*0.47);
  // Damage decals are revealed progressively after impacts, rather than only darkening the paint.
  const damageMarks=[];
  for(const side of [-1,1]){
    const mark=add(new THREE.SphereGeometry(0.22,12,8),dark,side*W*0.34,base+0.25,L*0.43);
    mark.scale.set(0.85,0.18,1.35); mark.visible=false; damageMarks.push(mark);
  }
  const rearDent=add(new THREE.SphereGeometry(0.24,12,8),dark,0,base+0.24,-L*0.46);
  rearDent.scale.set(1.8,0.18,0.8); rearDent.visible=false; damageMarks.push(rearDent);
  // Lower chassis, sculpted-looking hood and rear deck.
  box(W*0.96, t.h*0.72, L*0.78, paint, 0, base+t.h*0.36, -L*0.015);
  box(W*0.88, t.h*0.38, L*0.34, paint, 0, base+t.h*0.65, L*0.29, -0.025);
  box(W*0.9, t.h*0.34, L*0.22, paint, 0, base+t.h*0.61, -L*0.36, 0.025);
  // Separate exterior panels make severe impacts more than a texture-only effect.
  const hoodPanel = box(W*0.70,0.055,L*0.285,paint,0,base+t.h*0.69,L*0.275,-0.018);
  const doorPanels = [];
  for (const side of [-1,1]) {
    const door = box(0.055,t.h*0.52,L*0.34,paint,side*W*0.493,base+t.h*0.53,-L*0.015,0,0,side*0.025);
    doorPanels.push({ side, mesh: door });
    box(0.035,0.035,0.12,chrome,side*W*0.525,base+t.h*0.61,L*0.015);
  }
  // Cabin silhouette varies by class; the dark glazing is split into windscreen and side windows.
  const cabinLen = typeKey === 'hatch' ? L*0.43 : typeKey === 'muscle' ? L*0.38 : L*0.42;
  const cabin = box(W*0.72, t.h*0.92, cabinLen, glass, 0, base+t.h+0.23, -L*0.055, -0.08);
  cabin.scale.y = typeKey === 'prototype' ? 0.72 : 0.82;
  box(W*0.78, 0.09, cabinLen*1.08, paint, 0, base+t.h+0.57, -L*0.055);
  // Detachable bumper assemblies: the bumper is a separate physical-looking part.
  const frontBumper = new THREE.Group();
  frontBumper.add(new THREE.Mesh(new THREE.BoxGeometry(W*1.02,0.12,0.28), paint));
  frontBumper.add(new THREE.Mesh(new THREE.BoxGeometry(W*0.98,0.17,0.22), dark));
  frontBumper.children[0].position.y = 0.02; frontBumper.children[1].position.y = 0.08;
  frontBumper.position.set(0,base,L*0.49); frontBumper.children.forEach(m=>{m.castShadow=true;m.receiveShadow=true;}); g.add(frontBumper);
  const rearBumper = new THREE.Group();
  rearBumper.add(new THREE.Mesh(new THREE.BoxGeometry(W*0.96,0.16,0.2), dark));
  rearBumper.position.set(0,base+0.09,-L*0.48); rearBumper.children[0].castShadow=true; g.add(rearBumper);
  box(W*0.42, 0.13, 0.035, chrome, 0, base+0.24, L*0.495);
  for (const side of [-1,1]) {
    box(W*0.22,0.09,0.045,headMat,side*W*0.34,base+0.34,L*0.485);
    box(W*0.2,0.08,0.045,tailMat,side*W*0.34,base+0.31,-L*0.485);
    // Side skirts and mirrors give the silhouette more depth.
    box(0.12,0.16,L*0.58,dark,side*W*0.48,base+0.05,-L*0.015);
    box(0.18,0.11,0.2,paint,side*W*0.43,base+t.h+0.17,L*0.11);
  }
  // Front intake, mesh-like grille slats, rear exhaust tips and splitter.
  box(W*0.42,0.16,0.045,dark,0,base+0.19,L*0.493);
  for(let i=0;i<5;i++) box(W*0.36,0.012,0.018,chrome,0,base+0.13+i*0.025,L*0.52);
  box(W*1.02,0.055,0.34,dark,0,base+0.015,L*0.48);
  for(const side of [-1,1]){
    const exhaust=add(new THREE.CylinderGeometry(0.075,0.075,0.16,12),chrome,side*W*0.31,base+0.13,-L*0.49);
    exhaust.rotation.x=Math.PI/2;
  }
  // Wheel arches, tyres and machined multi-part rims.
  const wheels=[];
  const wx=W*0.49, wz=L*0.32, wheelR=typeKey==='prototype'?0.32:0.36;
  for (const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    const wheelGroup=new THREE.Group();
    wheelGroup.position.set(sx*wx,0.34,sz*wz);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(wheelR,wheelR,0.27,24),rubber);
    tire.rotation.z=Math.PI/2; tire.castShadow=true; wheelGroup.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(wheelR*0.62,wheelR*0.62,0.285,20),rimMat);
    rim.rotation.z=Math.PI/2; wheelGroup.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.3,12),chrome);
    hub.rotation.z=Math.PI/2; wheelGroup.add(hub);
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(wheelR*0.43,wheelR*0.43,0.29,24),new THREE.MeshStandardMaterial({color:0x7d858d,metalness:0.88,roughness:0.36}));
    disc.rotation.z=Math.PI/2; wheelGroup.add(disc);
    const caliper=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.2,0.12),new THREE.MeshStandardMaterial({color:typeKey==='prototype'?0x9b5cff:0xc73535,metalness:0.35,roughness:0.42}));
    caliper.position.set(0,wheelR*0.42,0.08); wheelGroup.add(caliper);
    const spokes=new THREE.Group();
    for(let k=0;k<5;k++){
      const sp=new THREE.Mesh(new THREE.BoxGeometry(0.035, wheelR*1.0, 0.045),chrome);
      sp.position.y=wheelR*0.25; sp.rotation.z=k*Math.PI*2/5; spokes.add(sp);
    }
    wheelGroup.add(spokes); g.add(wheelGroup); wheels.push(wheelGroup);
    const arch=add(new THREE.TorusGeometry(wheelR*1.12,0.075,7,22,Math.PI),paint,sx*wx,0.36,sz*wz);
    arch.rotation.x=Math.PI/2; arch.rotation.z=sz===1?0:Math.PI;
  }
  // Class-specific aero details.
  if (typeKey === 'muscle') {
    box(W*0.32,0.2,L*0.22,dark,0,base+t.h+0.08,L*0.31);
    box(W*0.92,0.1,0.12,paint,0,base+t.h+0.45,-L*0.42);
    for(const side of [-1,1]) box(0.12,0.12,0.52,chrome,side*W*0.37,base+0.12,-L*0.18);
  } else if (typeKey === 'gt') {
    box(W*1.08,0.08,L*0.2,paint,0,base+t.h*0.65,-L*0.42);
    box(W*0.9,0.09,0.12,dark,0,base+t.h+0.45,-L*0.4);
    box(0.1,0.1,L*0.5,chrome,0,base+0.12,-L*0.02);
  } else if (typeKey === 'prototype') {
    box(W*1.22,0.1,L*0.24,paint,0,base+t.h*0.45,-L*0.43);
    box(W*0.12,0.28,L*0.26,dark,0,base+t.h*0.78,-L*0.4);
    box(W*1.32,0.08,0.18,paint,0,base+t.h*0.62,-L*0.48);
    for(const side of [-1,1]) box(0.1,0.22,L*0.32,dark,side*W*0.47,base+0.12,-L*0.36);
  } else {
    box(W*0.92,0.1,0.12,paint,0,base+t.h+0.45,-L*0.4);
  }
  // Windscreen fracture lines are hidden until a hard impact reaches the glass.
  const crackMat = new THREE.LineBasicMaterial({ color: 0xd9e5e9, transparent: true, opacity: 0.9, depthTest: true });
  const cracks = new THREE.Group();
  const glassY = base + t.h + 0.25, glassZ = cabinLen * 0.42 - L*0.055;
  const crackPaths = [
    [[0,0,0],[0.12,0.02,0.01],[0.2,0.12,0.02]], [[0.12,0.02,0.01],[0.03,0.15,0.025],[-0.02,0.23,0.03]],
    [[0.12,0.02,0.01],[0.25,-0.05,0.025],[0.34,-0.12,0.03]], [[0.03,0.15,0.025],[-0.1,0.19,0.03],[-0.19,0.27,0.035]],
    [[-0.02,0.23,0.03],[-0.12,0.31,0.035],[-0.16,0.4,0.04]]
  ];
  for (const path of crackPaths) {
    const points = path.map(([x,y,z])=>new THREE.Vector3(x,glassY+y,glassZ+z));
    cracks.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),crackMat));
  }
  cracks.visible = false; g.add(cracks);
  // Racing number panel and subtle hood stripe.
  box(W*0.24,0.012,L*0.24,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5}),0,base+t.h*0.73,L*0.19);
  g.userData = { bodyMat: paint, baseColor: t.color, wheels, typeKey, damageMarks, shellGeo, shell, frontBumper, rearBumper, hoodPanel, doorPanels, cracks, bumperDetached: false, detachedPanels: new Set(), detachedWheels: new Set(), impactScars: new THREE.Group(), deformation: 0 };
  g.add(g.userData.impactScars);
  return g;
}

function createCar(typeKey, isPlayer) {
  const t = CAR_TYPES[typeKey];
  return {
    mesh: makeCarMesh(typeKey),
    typeKey,
    isPlayer,
    x: 0,
    z: 0,
    yaw: 0,
    vx: 0,
    vz: 0,
    speed: 0,
    damage: 0,
    boost: 0.55,
    boostActive: false,
    lap: 0,
    _crossReady: true,
    _lastIdx: undefined,
    stunned: 0,
    visualImpactCooldown: 0,
    aiOffset: Math.random(),
  };
}

let player = createCar("hatch", true);
let rivals = [
  createCar("muscle", false),
  createCar("gt", false),
  createCar("prototype", false),
];
const allCars = () => [player, ...rivals];

scene.add(player.mesh);
rivals.forEach((r) => scene.add(r.mesh));

function loadCircuit(id) {
  activeCircuitId = id;
  activeDef = CIRCUITS[id];
  totalLaps = activeDef.laps;
  trackWidth = activeDef.width;
  centerline = buildCenterline(activeDef);
  buildTrackMesh(centerline, trackWidth);
  scene.fog = new THREE.Fog(activeDef.fog, 100, 280);
  makeSky(activeDef.sky);
  menuHint.textContent = activeDef.featured
    ? `${activeDef.name} · ${totalLaps} vueltas (prototipo)`
    : `${activeDef.name} · ${totalLaps} vueltas`;
  showMsg(activeDef.name.toUpperCase());
  resetRace();
}

function cyclePlayerCar() {
  const keys = Object.keys(CAR_TYPES);
  const i = keys.indexOf(player.typeKey);
  const next = keys[(i + 1) % keys.length];
  const px = player.x, pz = player.z, py = player.yaw;
  player.typeKey = next;
  replaceCarMesh(player, null);
  player.x = px; player.z = pz; player.yaw = py;
  showMsg(CAR_TYPES[next].name);
}

function getStartPose(offsetZ) {
  const p = centerline[0];
  const p1 = centerline[2];
  const yaw = Math.atan2(p1.x - p.x, p1.z - p.z);
  const nx = Math.sin(yaw);
  const nz = Math.cos(yaw);
  return {
    x: p.x - nx * 5,
    z: p.z - nz * 5 + offsetZ,
    yaw,
  };
}

function resetRace() {
  // Mantener mallas CC0; solo reiniciar estado físico y daño visual leve.
  for (const car of allCars()) {
    car.damage = 0;
    car.mesh.userData.deformation = 0;
    car.mesh.userData.detachedPanels?.clear();
    car.mesh.userData.detachedWheels?.clear();
    car.mesh.userData.bumperDetached = false;
    if (car.mesh.userData.useGltf && car.mesh.userData.gltfRoot) {
      car.mesh.userData.gltfRoot.traverse((o) => {
        if (o.isMesh) o.visible = true;
      });
    }
  }
  for (const d of impactDebris) { scene.remove(d.mesh); disposeTree(d.mesh); } impactDebris.length = 0;
  for (const p of smokePuffs) scene.remove(p); smokePuffs.length = 0;
  const sp = getStartPose(0);
  Object.assign(player, {
    ...sp,
    vx: 0,
    vz: 0,
    speed: 0,
    damage: 0,
    boost: 0.65,
    lap: 0,
    _crossReady: true,
    _lastIdx: undefined,
    stunned: 0,
    impactShake: 0,
    smokeTimer: 0,
    visualImpactCooldown: 0,
  });
  rivals.forEach((r, i) => {
    const s = getStartPose((i - 1) * 3.5);
    Object.assign(r, {
      ...s, vx: 0, vz: 0, speed: 0, damage: 0, boost: 0.55, lap: 0,
      _crossReady: true, _lastIdx: undefined, stunned: 0, impactShake: 0, smokeTimer: 0, visualImpactCooldown: 0,
    });
  });
}

function damagePenalty(car) {
  if (car.damage < DAMAGE.penaltyFrom) return 1;
  const t = (car.damage - DAMAGE.penaltyFrom) / (1 - DAMAGE.penaltyFrom);
  return 1 - DAMAGE.maxPenalty * t;
}

function applyDamage(car, amount) {
  const resist = CAR_TYPES[car.typeKey].resist;
  car.damage = Math.min(1, car.damage + amount / resist);
}

function addImpactScar(car, local, strength) {
  const data=car.mesh.userData;
  const sideHit=Math.abs(local.x)>CAR_TYPES[car.typeKey].w*0.32;
  const y=Math.max(0.34,Math.min(1.45,local.y));
  const scarMat=new THREE.MeshStandardMaterial({color:0x17191d,roughness:0.96,metalness:0.05,transparent:true,opacity:0.72,depthWrite:false});
  const patch=new THREE.Mesh(new THREE.SphereGeometry(0.22+strength*0.22,12,8),scarMat);
  patch.position.set(local.x, y, local.z);
  patch.scale.set(sideHit?0.10:0.85,sideHit?0.72:0.10,0.75+strength*0.45);
  data.impactScars.add(patch);
  const scratchMat=new THREE.LineBasicMaterial({color:0xc2c5c8,transparent:true,opacity:0.72});
  for(let i=0;i<3;i++){
    const a=new THREE.Vector3(local.x+(Math.random()-.5)*0.16,y+(Math.random()-.5)*0.08,local.z+(Math.random()-.5)*0.18);
    const b=a.clone().add(new THREE.Vector3((Math.random()-.5)*(sideHit?0.04:0.55),(Math.random()-.5)*0.07,(Math.random()-.5)*0.48));
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),scratchMat);
    data.impactScars.add(line);
  }
}

function launchDebris(car, part, strength, velocityScale=1) {
  if(!part || !part.parent) return;
  const mesh=car.mesh;
  part.updateMatrixWorld(true);
  const worldPos=new THREE.Vector3(); part.getWorldPosition(worldPos);
  const detached=part.clone(true);
  detached.position.copy(worldPos);
  detached.quaternion.copy(part.getWorldQuaternion(new THREE.Quaternion()));
  detached.traverse(o=>{ if(o.isMesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=true;o.receiveShadow=true;} });
  scene.add(detached);
  const dir=new THREE.Vector3(car.vx,0,car.vz);
  if(dir.lengthSq()<0.1) dir.set(Math.sin(car.yaw),0,Math.cos(car.yaw));
  dir.normalize();
  impactDebris.push({mesh:detached,life:6.5,velocity:dir.multiplyScalar((2.5+strength*5)*velocityScale).add(new THREE.Vector3((Math.random()-.5)*4,2+strength*4,(Math.random()-.5)*4)),spin:new THREE.Vector3(3+Math.random()*5,4+Math.random()*6,2+Math.random()*5)});
  part.visible=false;
}

function applyVisualImpact(car, worldX, worldZ, strength) {
  if (strength < 0.12 || (car.visualImpactCooldown || 0) > 0) return;
  car.visualImpactCooldown = 0.18;
  if (car.mesh.userData?.useGltf) {
    car.impactShake = Math.max(car.impactShake || 0, strength * 0.55);
    if (car.isPlayer && strength > 0.35) emitSparks(worldX, worldZ);
    return;
  }
  const mesh = car.mesh, data = mesh.userData;
  mesh.position.set(car.x, 0, car.z); mesh.rotation.y = car.yaw; mesh.updateMatrixWorld(true);
  const local = mesh.worldToLocal(new THREE.Vector3(worldX, 0.62, worldZ));
  // Localised, persistent vertex deformation with a sharper crease at the impact centre.
  const pos = data.shellGeo.attributes.position;
  const radius = 0.95 + strength * 1.25;
  let changed = false;
  for (let i = 0; i < pos.count; i++) {
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const dx=x-local.x, dy=y-local.y, dz=z-local.z;
    const dist=Math.sqrt(dx*dx+dy*dy*0.62+dz*dz);
    if(dist<radius && y>0.30){
      const falloff=Math.pow(1-dist/radius,1.55);
      const sideNormal=Math.abs(local.x)>0.45?Math.sign(local.x):Math.sign(dx||1);
      pos.setY(i,y-falloff*strength*0.48);
      pos.setX(i,x-sideNormal*falloff*strength*0.15);
      pos.setZ(i,z-Math.sign(dz||1)*falloff*strength*0.08);
      changed=true;
    }
  }
  if(changed){pos.needsUpdate=true;data.shellGeo.computeVertexNormals();data.deformation=Math.min(1,data.deformation+strength*0.42);}
  addImpactScar(car,local,strength);
  if(strength>0.32) data.cracks.visible=true;

  const t=CAR_TYPES[car.typeKey];
  // Front/rear impacts can tear off bumpers and deform the hood; side hits can remove a door.
  if(strength>0.54 && Math.abs(local.z)>t.len*0.28 && !data.bumperDetached){
    const frontHit=local.z>0;
    launchDebris(car,frontHit?data.frontBumper:data.rearBumper,strength,0.85);
    data.bumperDetached=true;
  }
  if(strength>0.72 && local.z>t.len*0.16 && !data.detachedPanels.has('hood')){
    launchDebris(car,data.hoodPanel,strength,0.65); data.detachedPanels.add('hood');
    pulseFlash(0.13);
  }
  if(strength>0.66 && Math.abs(local.x)>t.w*0.34){
    const side=local.x>0?1:-1;
    const door=data.doorPanels.find(p=>p.side===side);
    if(door && !data.detachedPanels.has(`door_${side}`)){
      launchDebris(car,door.mesh,strength,0.72); data.detachedPanels.add(`door_${side}`);
    }
  }
  // Extreme side/front corner impacts may rip a wheel free; this is rare by design.
  if(strength>0.93 && Math.abs(local.x)>t.w*0.34 && Math.abs(local.z)>t.len*0.22){
    const wheelIndex=(local.x>0?1:0)+(local.z>0?2:0);
    const wheel=data.wheels[wheelIndex];
    if(wheel && !data.detachedWheels.has(wheelIndex)){
      launchDebris(car,wheel,strength,0.5); data.detachedWheels.add(wheelIndex);
    }
  }
  spawnSmoke(worldX,0.55,worldZ,Math.round(4+strength*10));
  car.impactShake=Math.max(car.impactShake||0,strength*0.5);
}

function syncMesh(car) {
  car.visualImpactCooldown = Math.max(0, (car.visualImpactCooldown || 0) - 1/60);
  car.mesh.position.set(car.x, 0, car.z);
  car.mesh.rotation.y = car.yaw;
  if (car.mesh.userData.useGltf && car.mesh.userData.gltfRoot) {
    car.mesh.userData.gltfRoot.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        m.emissive?.setHex(car.boostActive ? 0x551100 : car.stunned > 0 ? 0x001144 : 0x000000);
        if (m.emissiveIntensity !== undefined) m.emissiveIntensity = car.boostActive ? 0.18 : car.stunned > 0 ? 0.1 : 0;
      });
    });
  }
  const body = car.mesh.userData.bodyMat;
  if (!body) {
    const spin = car.speed * 0.35;
    car.mesh.userData.wheels?.forEach((w, i) => { if (!car.mesh.userData.detachedWheels?.has(i)) w.rotation.x = spin + i * 0.1; });
    return;
  }
  const c = new THREE.Color(car.mesh.userData.baseColor);
  body.color.copy(c).lerp(new THREE.Color(0x1a1a22), car.damage * DAMAGE.visualDarken);
  body.emissive.setHex(car.boostActive ? 0xff5500 : car.stunned > 0 ? 0x2244ff : 0x000000);
  body.emissiveIntensity = car.boostActive ? 0.45 : car.stunned > 0 ? 0.2 : 0;
  const marks = car.mesh.userData.damageMarks || [];
  marks.forEach((mark, i) => { mark.visible = car.damage > (i === 2 ? 0.22 : 0.07 + i * 0.065); });
  if (car.impactShake > 0) car.impactShake = Math.max(0, car.impactShake - 0.025);
  const spin = car.speed * 0.35;
  car.mesh.userData.wheels.forEach((w, i) => { if(!car.mesh.userData.detachedWheels.has(i)) w.rotation.x = spin + i * 0.1; });
}

function emitSparks(x, z) {
  sparkLife = 0.22;
  sparks.material.opacity = 1;
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = x + (Math.random() - 0.5) * 0.8;
    sparkPos[i * 3 + 1] = 0.35 + Math.random() * 0.55;
    sparkPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.8;
    sparkVel[i * 3] = (Math.random() - 0.5) * 18;
    sparkVel[i * 3 + 1] = 2 + Math.random() * 9;
    sparkVel[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  sparks.geometry.attributes.position.needsUpdate = true;
}

function resolveTrack(car, isPlayerHit) {
  const info = nearestTrackInfo(car.x, car.z);
  const half = trackWidth / 2 + 0.15;
  if (Math.abs(info.lat) <= half) return;
  const sign = info.lat > 0 ? 1 : -1;
  car.x = info.px + info.nx * sign * half;
  car.z = info.pz + info.nz * sign * half;
  const dot = car.vx * info.nx * sign + car.vz * info.nz * sign;
  if (dot > 1.5) {
    car.boost = Math.min(1, car.boost + 0.05);
    if (car.isPlayer) pulseFlash(0.12);
  }
  car.vx -= info.nx * sign * dot * 1.25;
  car.vz -= info.nz * sign * dot * 1.25;
  applyDamage(car, DAMAGE.wall);
  if (Math.abs(dot) > 8) {
    applyVisualImpact(car, car.x, car.z, Math.min(0.9, Math.abs(dot) / 25));
    if (car.isPlayer) emitSparks(car.x, car.z);
  }
  if (car.isPlayer && Math.abs(dot) > 11 && car.speed > 28 && car.damage > 0.78) {
    car.stunned = Math.max(car.stunned || 0, 0.7);
    triggerBurnoutBanner("wrecked", "WRECKED!");
    spawnSmoke(car.x, 0.6, car.z, 16);
  }
}

function carCarCollision(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const dist = Math.hypot(dx, dz);
  const minD = 2.35;
  if (dist >= minD || dist < 0.01) return;

  const nx = dx / dist;
  const nz = dz / dist;
  const overlap = minD - dist;
  a.x -= nx * overlap * 0.5;
  a.z -= nz * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.z += nz * overlap * 0.5;

  const rvx = b.vx - a.vx;
  const rvz = b.vz - a.vz;
  const relSpeed = rvx * nx + rvz * nz;
  if (relSpeed > 0) return;

  const boostMulA = a.boostActive ? 2.15 : 1;
  const boostMulB = b.boostActive ? 2.15 : 1;
  const impulse = -relSpeed * 0.62 * (boostMulA + boostMulB) * 0.5;
  a.vx -= nx * impulse * boostMulA;
  a.vz -= nz * impulse * boostMulA;
  b.vx += nx * impulse * boostMulB;
  b.vz += nz * impulse * boostMulB;

  const lean = a.isPlayer ? ((KEYS.KeyA || KEYS.ArrowLeft) ? -1 : 0) + ((KEYS.KeyD || KEYS.ArrowRight) ? 1 : 0) : 0;
  if (a.isPlayer && a.boostActive && lean) {
    b.vx += (-nz * lean) * 3.8;
    b.vz += (nx * lean) * 3.8;
  }

  const dA = DAMAGE.car * (boostMulA > 1 ? 1.35 : 1);
  const dB = DAMAGE.car * (boostMulB > 1 ? 1.35 : 1);
  applyDamage(a, dA);
  applyDamage(b, dB);
  const impactStrength = Math.min(1, Math.abs(relSpeed) / 24);
  if (Math.abs(relSpeed) > 5.5) {
    const hitX = (a.x + b.x) / 2, hitZ = (a.z + b.z) / 2;
    applyVisualImpact(a, hitX, hitZ, impactStrength);
    applyVisualImpact(b, hitX, hitZ, impactStrength);
  }
  if (Math.abs(relSpeed) > 3.2) {
    emitSparks((a.x + b.x) / 2, (a.z + b.z) / 2);
    if (a.isPlayer || b.isPlayer) pulseFlash(0.16 + impactStrength * 0.2);
    a.impactShake = Math.max(a.impactShake || 0, impactStrength * 0.28);
    b.impactShake = Math.max(b.impactShake || 0, impactStrength * 0.28);
  }

  if (a.boostActive && relSpeed < -7) {
    const hitX = (a.x + b.x) / 2;
    const hitZ = (a.z + b.z) / 2;
    if (b.isPlayer === false && a.isPlayer) {
      b.stunned = 0.85;
      a.boost = Math.min(1, a.boost + 0.18);
      triggerBurnoutBanner("takedown", "TAKEDOWN!");
      emitSparks(hitX, hitZ);
      spawnSmoke(hitX, 0.55, hitZ, 14);
    } else if (a.isPlayer === false && b.isPlayer) {
      b.stunned = 0.95;
      b.damage = Math.min(1, b.damage + 0.08);
      triggerBurnoutBanner("wrecked", "WRECKED!");
      emitSparks(hitX, hitZ);
      spawnSmoke(hitX, 0.7, hitZ, 18);
    }
  }
}

function updateCarPhysics(car, dt, input) {
  const t = CAR_TYPES[car.typeKey];
  if (car.stunned > 0) {
    car.stunned -= dt;
    car.vx *= 0.965;
    car.vz *= 0.965;
    car.speed = Math.hypot(car.vx, car.vz);
    return;
  }

  car.boostActive = input.boost && car.boost > 0.02;
  if (car.boostActive) car.boost = Math.max(0, car.boost - dt * 0.42);
  else car.boost = Math.min(1, car.boost + dt * 0.045);

  const pen = damagePenalty(car);
  const maxSpeed = (car.boostActive ? t.boostSp : t.maxSp) * pen;
  const forward = { x: Math.sin(car.yaw), z: Math.cos(car.yaw) };

  if (input.accel) {
    car.vx += forward.x * t.accel * dt;
    car.vz += forward.z * t.accel * dt;
  }
  if (input.brake) {
    const f = 1 - Math.min(1, 58 * dt * 0.08);
    car.vx *= f;
    car.vz *= f;
  }

  car.speed = Math.hypot(car.vx, car.vz);
  if (car.speed > 0.4) {
    const grip = 2.75 * (car.boostActive ? 0.88 : 1);
    car.yaw += input.steer * grip * dt * (0.38 + car.speed / 85);
  }
  if (car.speed > maxSpeed) {
    const s = maxSpeed / car.speed;
    car.vx *= s;
    car.vz *= s;
    car.speed = maxSpeed;
  }

  car.vx *= 1 - dt * 0.32;
  car.vz *= 1 - dt * 0.32;
  car.x += car.vx * dt;
  car.z += car.vz * dt;
  resolveTrack(car);
}

function updateAI(car, dt) {
  const n = centerline.length;
  const prog = (performance.now() * 0.00022 + car.aiOffset) % 1;
  const idx = Math.floor(prog * (n - 2));
  const target = centerline[idx + 3] || centerline[idx];
  const dx = target.x - car.x;
  const dz = target.z - car.z;
  let desired = Math.atan2(dx, dz);
  let diff = desired - car.yaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const steer = Math.max(-1, Math.min(1, diff * 2.2));
  const nearPlayer = Math.hypot(player.x - car.x, player.z - car.z) < 10;
  updateCarPhysics(car, dt, {
    accel: true,
    brake: car.speed > CAR_TYPES[car.typeKey].maxSp + 4,
    steer,
    boost: nearPlayer && car.boost > 0.35 && Math.random() > 0.4,
  });
}

function updateLaps(car) {
  const info = nearestTrackInfo(car.x, car.z);
  const idx = info.index;
  const n = centerline.length - 1;
  if (car._lastIdx === undefined) car._lastIdx = idx;
  const crossed = car._lastIdx > n * 0.72 && idx < n * 0.1;
  if (crossed && car._crossReady) {
    car._crossReady = false;
    car.lap++;
    if (car.isPlayer) {
      if (car.lap < totalLaps) showMsg(`VUELTA ${car.lap + 1} / ${totalLaps}`);
      else showMsg("¡META!");
    }
  }
  if (idx > n * 0.18) car._crossReady = true;
  car._lastIdx = idx;
}

let flashT = 0;
function pulseFlash(a) { flashT = a; }
let msgT = 0;
function showMsg(text) {
  msgEl.textContent = text;
  msgEl.style.opacity = "1";
  msgT = 1.35;
}

(async function bootAssets() {
  const loading = showMsg;
  loading("CARGANDO ASSETS CC0...");
  try {
    await loadGroundPBR();
    await loadRoadPBR();
    await setupImageBasedLighting();
    await loadHeroTemplate();
    buildGround();
    loadCircuit("scarline_gp");
    applyFleetMeshes();
    applyQualityPreset();
    const info = gfxQuality === "low"
      ? "CALIDAD: BAJA (usa ?quality=high si puedes)"
      : `ASSETS OK · ~15MB · ${navigator.deviceMemory ? navigator.deviceMemory + "GB RAM" : "PC"}`;
    showMsg(`SPECTRAL GT · ${info}`);
  } catch (err) {
    console.error("Assets fallaron, modo procedural", err);
    buildGround();
    loadCircuit("scarline_gp");
    showMsg("FALTAN ASSETS — revisa carpeta assets/");
  }
})();

function readGamepad() {
  const pads=navigator.getGamepads?navigator.getGamepads():[];
  const pad=Array.from(pads).find(Boolean);
  if(!pad) return null;
  const axis=pad.axes[0]||0;
  const trigger=(i)=>pad.buttons[i]?Math.max(pad.buttons[i].value||0,pad.buttons[i].pressed?1:0):0;
  return { steer:Math.abs(axis)>0.12?axis:0, accel:trigger(7)>0.18, brake:trigger(6)>0.18, boost:!!pad.buttons[0]?.pressed };
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dtReal = Math.min(0.032, (now - last) / 1000);
  last = now;
  tickBurnoutFx(dtReal);
  const dt = dtReal * timeScale;

  const pad=readGamepad();
  const keyboardSteer=(KEYS.KeyA || KEYS.ArrowLeft ? -1 : 0) + (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0);
  const steer=pad && Math.abs(pad.steer)>0 ? pad.steer : keyboardSteer;
  updateCarPhysics(player, dt, {
    accel: KEYS.KeyW || KEYS.ArrowUp || !!pad?.accel,
    brake: KEYS.KeyS || KEYS.ArrowDown || !!pad?.brake,
    steer,
    boost: KEYS.KeyX || !!pad?.boost,
  });
  rivals.forEach((r) => updateAI(r, dt));
  for(const car of allCars()){
    car.smokeTimer=(car.smokeTimer||0)-dt;
    if(car.damage>0.42 && car.smokeTimer<=0 && car.speed>5){
      const rearX=car.x-Math.sin(car.yaw)*CAR_TYPES[car.typeKey].len*0.43;
      const rearZ=car.z-Math.cos(car.yaw)*CAR_TYPES[car.typeKey].len*0.43;
      spawnSmoke(rearX,0.72,rearZ,2); car.smokeTimer=0.28+(1-car.damage)*0.28;
    }
  }
  for (let i = 0; i < allCars().length; i++) {
    for (let j = i + 1; j < allCars().length; j++) carCarCollision(allCars()[i], allCars()[j]);
  }
  updateLaps(player);
  allCars().forEach(syncMesh);

  const camDist = 15;
  const camH = 7.5;
  const cx = player.x - Math.sin(player.yaw) * camDist;
  const cz = player.z - Math.cos(player.yaw) * camDist;
  const shake=(player.impactShake||0);
  camera.position.lerp(new THREE.Vector3(cx+(Math.random()-.5)*shake, camH+(Math.random()-.5)*shake, cz+(Math.random()-.5)*shake), 0.1);
  const look = new THREE.Vector3(
    player.x + Math.sin(player.yaw) * 6,
    1.2,
    player.z + Math.cos(player.yaw) * 6
  );
  camera.lookAt(look);

  if (flashT > 0) {
    flashT -= dt;
    flashEl.style.opacity = String(Math.max(0, flashT * 2.5));
  } else flashEl.style.opacity = "0";

  if (msgT > 0) {
    msgT -= dt;
    if (msgT <= 0) msgEl.style.opacity = "0";
  }

  updateImpactEffects(dt);

  if (sparkLife > 0) {
    sparkLife -= dt;
    sparks.material.opacity = Math.max(0, sparkLife * 4);
    for(let i=0;i<sparkCount;i++){
      sparkVel[i*3+1] -= 18*dt;
      sparkPos[i*3] += sparkVel[i*3]*dt;
      sparkPos[i*3+1] += sparkVel[i*3+1]*dt;
      sparkPos[i*3+2] += sparkVel[i*3+2]*dt;
    }
    sparks.geometry.attributes.position.needsUpdate = true;
  }

  const kmh = Math.round(player.speed * 3.6);
  const cond = player.damage < 0.25 ? "IMPECABLE" : player.damage < 0.5 ? "DAÑO LEVE" : player.damage < 0.8 ? "DAÑO ALTO" : "CRÍTICO";
  const speedValue=document.getElementById("speed-value");
  const carCondition=document.getElementById("car-condition");
  const damageFill=document.getElementById("damage-fill");
  if(speedValue) speedValue.textContent=String(kmh).padStart(3,"0");
  if(carCondition) carCondition.textContent=`CARROCERÍA · ${Math.round(player.damage*100)}% · ${cond}`;
  if(damageFill) damageFill.style.width=`${player.damage*100}%`;
  statsEl.innerHTML =
    `<strong>${activeDef.name}</strong><br/>` +
    `${CAR_TYPES[player.typeKey].name}<br/>` +
    `Daño: ${Math.round(player.damage * 100)}% (${cond})<br/>` +
    `${kmh} km/h · Boost ${Math.round(player.boost * 100)}%<br/>` +
    `Vuelta ${Math.min(player.lap + 1, totalLaps)}/${totalLaps}`;

  boostFill.style.width = `${player.boost * 100}%`;

  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  ssaoPass.setSize(w, h);
  bloom.resolution.set(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  composer.render();
}
requestAnimationFrame(frame);
