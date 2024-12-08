import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// Create the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement)

//Space background
const loader = new THREE.TextureLoader();
loader.load('textures/space.jpg', function(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  scene.background = texture;
  renderer.render(scene, camera);
});

// Create a new loader2 instance using GLTFLoader
const loader2 = new GLTFLoader();
let model;
// Load a GLTF model
loader2.load(
  'roboball/scene.gltf', // The path to the GLTF model
  (gltf) => {
    // The model is successfully loaded
    model = gltf.scene;
    scene.add(model);

    // Adjust the model's scale and position
    model.scale.set(1.5, 1.5, 1.5); // Scale the model
    model.rotation.y = Math.PI;
    model.position.set(0, 0.5, 0); // Set the position of the model
    model.castShadow = true;
    model.receiveShadow = true;
    model.velocity = new THREE.Vector3(0, 0, 0);
  },
  (xhr) => {
    // Track the loading progress
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error) => {
    // Handle any errors that occur
    console.error('An error happened while loading the GLTF model:', error);
  }
);

// ------------ Ground (lane) setup ------------
const groundGeometry = new THREE.BoxGeometry(10, 0.5, 50);
const groundMaterial = new THREE.ShaderMaterial({ 
  uniforms: {
    iTime: { value: 0.0 }, // Time uniform for animation
},
vertexShader: `
    varying vec2 vUv;

    void main() {
        vUv = uv; // Pass UV coordinates to the fragment shader
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,
fragmentShader: `
    uniform float iTime;
    varying vec2 vUv;

    void main() {
      vec2 distortedUv = vUv;
      distortedUv.y += sin(distortedUv.x * 10.0 + iTime * 2.0) * 0.1; // Horizontal waves
      distortedUv.x += sin(distortedUv.y * 15.0 - iTime * 1.5) * 0.05; // Vertical waves

      // Create a wave-like pattern using sine functions
      float wave = sin(distortedUv.x * 10.0 + iTime) * 0.5 + 0.6;
      float colorFactor = sin(distortedUv.y * 20.0 - iTime) * 0.5 + 0.5;


      vec3 baseColor = vec3(0.05, 0.1, 0.1); // Minimum brightness color
      vec3 auroraColor = mix(vec3(0.0, 0.8, 0.5), vec3(0.3, 0.1, 0.8), colorFactor);
      vec3 finalColor = mix(baseColor, auroraColor, wave);
      // Combine wave effect with aurora color
      gl_FragColor = vec4(finalColor, 1.0);
    }
`,
side: THREE.DoubleSide,
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, -2, 0);
ground.receiveShadow = true;
scene.add(ground);

// Lighting setup
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
light.castShadow = true;
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Gravity and ground level
const gravity = -0.01;
const groundLevel = ground.position.y;

// Imports for overlays
const googleFontLink = document.createElement('link');
googleFontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
googleFontLink.rel = 'stylesheet';
document.head.appendChild(googleFontLink);

// Score overlay
const scoreOverlay = document.createElement('div');
scoreOverlay.style.position = 'absolute';
scoreOverlay.style.top = '0';
scoreOverlay.style.left = '0';
scoreOverlay.style.width = '100%';
scoreOverlay.style.height = '100%';
scoreOverlay.style.color = 'white';
scoreOverlay.style.fontSize = '50px';
scoreOverlay.style.justifyContent = 'center';
scoreOverlay.style.display = 'none';
scoreOverlay.style.fontFamily = 'Orbitron, sans-serif';
scoreOverlay.innerText = 'Score: 0';
document.body.appendChild(scoreOverlay);

// Pause overlay
const pausedOverlay = document.createElement('div');
pausedOverlay.style.position = 'absolute';
pausedOverlay.style.top = '0';
pausedOverlay.style.left = '0';
pausedOverlay.style.width = '100%';
pausedOverlay.style.height = '100%';
pausedOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
pausedOverlay.style.color = 'white';
pausedOverlay.style.fontSize = '50px';
pausedOverlay.style.justifyContent = 'center';
pausedOverlay.style.lineHeight = '100vh';
pausedOverlay.style.display = 'none';
pausedOverlay.style.fontFamily = 'Orbitron, sans-serif';
pausedOverlay.innerText = 'GAME PAUSED';
document.body.appendChild(pausedOverlay);

// Start menu overlay
const startMenuOverlay = document.createElement('div');
startMenuOverlay.style.position = 'absolute';
startMenuOverlay.style.top = '0';
startMenuOverlay.style.left = '0';
startMenuOverlay.style.width = '100%';
startMenuOverlay.style.height = '100%';
startMenuOverlay.style.color = 'white';
startMenuOverlay.style.fontSize = '50px';
startMenuOverlay.style.display = 'flex';
startMenuOverlay.style.justifyContent = 'center';
startMenuOverlay.style.alignItems = 'center';
startMenuOverlay.style.fontFamily = 'Orbitron, sans-serif';
startMenuOverlay.innerHTML = `
  <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100vh; text-align: center; font-family: Orbitron, sans-serif; padding: 20px;">
    <div style="flex-grow: 0; margin-top: 20px;">
      <p style="font-size: 60px; margin: 0;">SPACE DASH</p>
      <p style="font-size: 24px; margin: 10px 0 20px;">Uh-oh, the space police are hot on your trail! Navigate through dangerous obstacles and stay ahead of them for as long as you can. One wrong move, and you'll be thrown into the deepest corner of space prison!</p>
    </div>
    
    <div style="flex-grow: 1;"></div> <!-- Empty space to push the button to the bottom -->
    
    <button id="startGameButton" style="font-family: 'Orbitron'; font-size: 24px; padding: 15px 30px; background-color: transparent; color: white; border: 2px solid white; border-radius: 10px; cursor: pointer; margin: 10px auto 20px; display: block; width: 400px; height: 60px;">
      Start Game
    </button>    
  </div>
`;
document.body.appendChild(startMenuOverlay);

// Game over overlay
const gameOverOverlay = document.createElement('div');
gameOverOverlay.style.position = 'absolute';
gameOverOverlay.style.top = '0';
gameOverOverlay.style.left = '0';
gameOverOverlay.style.width = '100%';
gameOverOverlay.style.height = '100%';
gameOverOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
gameOverOverlay.style.color = 'white';
gameOverOverlay.style.fontSize = '50px';
gameOverOverlay.style.display = 'none';
gameOverOverlay.style.justifyContent = 'center';
gameOverOverlay.style.alignItems = 'center';
gameOverOverlay.style.fontFamily = 'Orbitron, sans-serif';
gameOverOverlay.innerHTML = `
  <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100vh; text-align: center; font-family: Orbitron, sans-serif; padding: 20px;">
    <div style="flex-grow: 0; margin-top: 20px;">
      <p style="font-size: 60px; margin: 0;">YOU'VE BEEN CAUGHT!</p>
      <p id="finalScore" style="font-size: 24px; margin: 10px 0 20px;"></p>
    </div>
    
    <div style="flex-grow: 1;"></div> <!-- Empty space to push the button to the bottom -->
    
    <button id="replayButton" style="font-family: 'Orbitron'; font-size: 24px; padding: 15px 30px; background-color: transparent; color: white; border: 2px solid white; border-radius: 10px; cursor: pointer; margin: 10px auto 20px; display: block; width: 400px; height: 60px;">
      Play Again
    </button>    
  </div>
`;
document.body.appendChild(gameOverOverlay);
// ------------ Menu ------------
let isPaused = false;
let gameStarted = false;
let isFallingOffEdge = false;

// Pause function
function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pausedOverlay.style.display = 'flex';
  } else {
    pausedOverlay.style.display = 'none';
  }
}

// Handle start game button click
const startGameButton = document.getElementById('startGameButton');
startGameButton.addEventListener('click', () => {
  startGame();
});

// Start game function
function startGame() {
  // Remove the start menu
  startMenuOverlay.style.display = 'none';
  scoreOverlay.style.display = 'flex';
  flashlightOverlay.style.display = 'block';
  // Start the game loop
  gameStarted = true;
  animate();
}

// Score update function (based on how many frames passed)
function updateScore() {
  scoreOverlay.innerText = 'Score: ' + Math.floor(frames/20);
}

// Game over display function
function handleGameOver() {
  scoreOverlay.style.display = 'none';
  gameOverOverlay.style.display = 'flex';
  const finalScore = document.getElementById('finalScore');
  finalScore.innerText = 'Score: ' + Math.floor(frames/20);
}

// Handle start game button click
const replayButton = document.getElementById('replayButton');
replayButton.addEventListener('click', () => {
  replayGame();
});

// Restart game function
function replayGame() {
  // reset score and display
  frames = 0;
  scoreOverlay.style.display = 'flex';
  gameOverOverlay.style.display = 'none';
  raygunOverlay.style.display = 'none';
  laserOverlay.style.display = 'none';
  flashlight.visible = false;
  flashlightBeam.visible = false;

  // reset player position and direction
  model.scale.set(1.5, 1.5, 1.5); // Scale the model if necessary
  model.rotation.y = Math.PI;
  model.position.set(0, 0.5, 0); // Set the position of the model
  model.castShadow = true;
  model.receiveShadow = true;
  model.velocity = new THREE.Vector3(0, 0, 0);

  // reset other game variables
  isFallingOffEdge = false;
  enemies.forEach(enemy => {
    scene.remove(enemy);
  });
  enemies = [];
  shieldPowerUps.forEach(shield => {
    scene.remove(shield);
  });
  shieldPowerUps = [];
  raygunPowerUps.forEach(raygun => {
    scene.remove(raygun);
  });
  raygunPowerUps = [];
  hasShield = false;
  shieldSphere = null;
  isInvulnerable = false;
  hasRaygun = false;
  isTimeStopped = false;

  // restart animation
  animate();
}

// Key press tracking
const keys = { a: false, d: false, w: false, s: false };
window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a = true;
      break;
    case 'KeyD':
      keys.d = true;
      break;
    case 'KeyW':
      keys.w = true;
      break;
    case 'KeyS':
      keys.s = true;
      break;
    case 'Space':
      if (model.position.y- 1.5 <= groundLevel + 0.51) {
        model.velocity.y = 0.25;
      }
      break;
    case 'Escape':
      togglePause();
      break;
  }
});
window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a = false;
      break;
    case 'KeyD':
      keys.d = false;
      break;
    case 'KeyW':
      keys.w = false;
      break;
    case 'KeyS':
      keys.s = false;
      break;
  }
});

// ------------ Flashlight ------------
const flashlightOverlay = document.getElementById('flashlightOverlay');

// Spotlight as the flashlight
const flashlight = new THREE.SpotLight(0xffffff, 1, 50, Math.PI / 8, 0.5, 2);
flashlight.castShadow = true;
flashlight.visible = false; // Off initially
scene.add(flashlight);

const flashlightTarget = new THREE.Object3D();
scene.add(flashlightTarget);
flashlight.target = flashlightTarget;

// Create a cone geometry to visualize the flashlight beam
const beamGeometry = new THREE.ConeGeometry(3, 5, 32, 1, true);
const beamMaterial = new THREE.MeshBasicMaterial({
  color: 0xffe0e0,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
});
const flashlightBeam = new THREE.Mesh(beamGeometry, beamMaterial);
flashlightBeam.visible = false; // Only visible when flashlight is on
scene.add(flashlightBeam);
flashlightBeam.rotation.x = -Math.PI / 2;

// Toggle flashlight on icon click
flashlightOverlay.addEventListener('click', () => {
  flashlight.visible = !flashlight.visible;
  flashlightBeam.visible = flashlight.visible;
});


function updateFlashlight() {
  if (!model) return;
  
  // Position flashlight at player's position
  flashlight.position.copy(model.position);
  flashlight.position.y += 0.5; // slightly above ground level
  // Assume player faces down the negative Z axis.
  const forward = new THREE.Vector3(0, -1, 0);
  forward.applyQuaternion(model.quaternion);
  
  // Set flashlight target ahead of player
  const targetPos = new THREE.Vector3().copy(model.position).add(forward.setLength(10));
  flashlightTarget.position.copy(targetPos);

  // Position and orient the beam
  flashlightBeam.position.copy(model.position);
  flashlightBeam.position.y += 0.5;
  flashlightBeam.position.z -= 2;
  
  // Orient the beam along forward vector
  // The cone by default points along -Y, so rotate to point along forward
  flashlightBeam.lookAt(targetPos);
}

// ------------ Enemies ------------
let enemies = [];
let frames = 0;
let spawnRate = 200;

// Collision detection function
function boxCollision(box1, box2) {
  const halfSize1 = box1.scale.x / 2; // Assuming scale.x represents half width
  const halfSize2 = box2.scale.x / 2;

  const xCollide = Math.abs(box1.position.x - box2.position.x) < (halfSize1 + halfSize2);
  const yCollide = Math.abs(box1.position.y - box2.position.y) < (halfSize1 + halfSize2);
  const zCollide = Math.abs(box1.position.z - box2.position.z) < (halfSize1 + halfSize2);
  
  return xCollide && yCollide && zCollide;
}

let rotationSpeed=0;
// Lane boundary detection
function isPlayerInLane() {
  // Calculate lane boundaries
  const laneMinX = ground.position.x - (ground.geometry.parameters.width / 2);
  const laneMaxX = ground.position.x + (ground.geometry.parameters.width / 2);

  // Calculate player boundaries
  const radius = model.scale.x / 2;
  const playerMinX = model.position.x - radius;
  const playerMaxX = model.position.x + radius;

  // Check if player is within lane
  return playerMinX >= laneMinX && playerMaxX <= laneMaxX;
}

const enemyVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * vec4(vPosition, 1.0);
  }
`;

const enemyFragmentShader = `
  uniform vec3 color;
  uniform float shininess;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vec3 lightDirection = normalize(vec3(0.5, 0.5, 1.0));
    float diff = max(dot(vNormal, lightDirection), 0.0);
    vec3 diffuse = diff * color;

    // Specular highlights
    vec3 viewDirection = normalize(-vPosition);  // Direction from fragment to camera
    vec3 reflectDir = reflect(-lightDirection, vNormal);  // Reflection of light direction
    float spec = pow(max(dot(viewDirection, reflectDir), 0.0), shininess); // Phong specular model
    vec3 specular = spec * vec3(1.0);  // White specular highlight

    gl_FragColor = vec4(diffuse + specular, 1.0);
  }
`;


const clock = new THREE.Clock();

// ------------ Powerup: Shield ------------
let hasShield = false;
let isInvulnerable = false;
let shieldSphere = null;

let shieldPowerUps = [];
const shieldSpawnRate = 1500;

function spawnShieldPowerUp() {
  const position = getNonOverlappingPosition(ground.geometry.parameters.width, -15);
  if (position === null) return;

  const shieldGeometry = new THREE.SphereGeometry(0.5, 16, 16); 
  const shieldMaterial = new THREE.MeshStandardMaterial({ color: 'cyan', emissive: 'blue', emissiveIntensity: 0.5 });
  const shieldPowerUp = new THREE.Mesh(shieldGeometry, shieldMaterial);
  
  shieldPowerUp.position.set(position.x, position.y, position.z);
  shieldPowerUp.velocity = new THREE.Vector3(0, 0, 0.05);
  shieldPowerUp.castShadow = true;

  scene.add(shieldPowerUp);
  shieldPowerUps.push(shieldPowerUp);
}

function playerCollidesWithShield(shield) {
  const xCollide = Math.abs(model.position.x - shield.position.x) < 1;
  const yCollide = Math.abs(model.position.y - shield.position.y) < 1;
  const zCollide = Math.abs(model.position.z - shield.position.z) < 1;
  return xCollide && yCollide && zCollide;
}

// ------------ Powerup: Raygun ------------
// Variables to track raygun state
let hasRaygun = false;
let isTimeStopped = false;
let timeStopStart = 0;
const timeStopDuration = 5000; // 5 seconds

// We'll need a raycaster and a vector2 for obstacle-clicking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create the raygun UI element, initially hidden
const raygunOverlay = document.createElement('img');
raygunOverlay.src = 'images/raygun.png';
raygunOverlay.style.position = 'absolute';
raygunOverlay.style.width = '80px';
raygunOverlay.style.height = '80px';
raygunOverlay.style.bottom = '20px';
raygunOverlay.style.right = '20px';
raygunOverlay.style.cursor = 'pointer';
raygunOverlay.style.display = 'none'; // Hidden until we have the raygun
document.body.appendChild(raygunOverlay);

const shootSound = new Audio('sounds/raygun_laser.mp3'); // Update the audio file path as needed
shootSound.volume = 0.2; // Adjust volume if desired

function activateLaser() {
  laserOverlay.style.display = 'block';
}

function deactivateLaser() {
  laserOverlay.style.display = 'none';
}

// When raygunOverlay is clicked, if we have the raygun and time isn't stopped yet, stop time
raygunOverlay.addEventListener('click', () => {
  if (hasRaygun && !isTimeStopped) {
    isTimeStopped = true;
    timeStopStart = performance.now();
    raygunOverlay.style.display = 'none';

    activateLaser();
  }
});

// Function to spawn raygun powerup
function spawnRaygunPowerUp() {
  const position = getNonOverlappingPosition(ground.geometry.parameters.width, -15);
  if (position === null) return;

  const gunGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const gunMaterial = new THREE.MeshStandardMaterial({ color: 'yellow' });
  const raygunPowerUp = new THREE.Mesh(gunGeometry, gunMaterial);

  raygunPowerUp.position.set(position.x, position.y, position.z);
  raygunPowerUp.velocity = new THREE.Vector3(0, 0, 0.05);
  scene.add(raygunPowerUp);
  raygunPowerUps.push(raygunPowerUp);
}

// Array to track the raygun powerups
let raygunPowerUps = [];
const raygunSpawnRate = 3000; // Spawn a raygun powerup every 3000 frames or so

// Function to check collision with raygun powerup
function playerCollidesWithRaygun(rg) {
  const xCollide = Math.abs(model.position.x - rg.position.x) < 1;
  const yCollide = Math.abs(model.position.y - rg.position.y) < 1;
  const zCollide = Math.abs(model.position.z - rg.position.z) < 1;
  return xCollide && yCollide && zCollide;
}

// On mouse click in the scene, if time is stopped, try to zap enemies
window.addEventListener('click', (event) => {
  if (isTimeStopped) {
    // Convert mouse coordinates to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(enemies);
    if (intersects.length > 0) {
      // Zap the first enemy hit
      const hitEnemy = intersects[0].object;
      const enemyIndex = enemies.indexOf(hitEnemy);
      if (enemyIndex > -1) {
        scene.remove(hitEnemy);
        enemies.splice(enemyIndex, 1);
        
        shootSound.currentTime = 0; 
        shootSound.play();
      }
    }
  }
});

// ------------ Prevent Overlap ------------
const spawnRadius = 0.75; 

// Checks if a potential spawn position overlaps with any existing objects
function isOverlapping(x, y, z) {
  const allObjects = [...enemies, ...shieldPowerUps, ...raygunPowerUps];

  for (const obj of allObjects) {
    const dx = obj.position.x - x;
    const dy = obj.position.y - y;
    const dz = obj.position.z - z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // If objects are too close, consider it overlapping
    if (dist < spawnRadius * 2) return true;
  }

  return false;
}

// Tries multiple times to find a random, non-overlapping position
function getNonOverlappingPosition(laneWidth, zPos = -15, maxAttempts = 50) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const x = (Math.random() - 0.5) * laneWidth;
    const y = groundLevel + 1;
    
    if (!isOverlapping(x, y, zPos)) {
      return { x, y, z: zPos };
    }

    attempts++;
  }
  // If no suitable position found, you could return null and skip spawning
  return null;
}


// ------------ Animation loop ------------
function animate() {
  // If paused, exit animate function
  if (isPaused) {
    requestAnimationFrame(animate);
    return;
  }

  groundMaterial.uniforms.iTime.value = clock.getElapsedTime();
  const animationId = requestAnimationFrame(animate);

  // Shield
  if (shieldSphere && model) {
    shieldSphere.position.copy(model.position);
  }

  // Raygun
  if (frames % raygunSpawnRate === 0) {
    spawnRaygunPowerUp();
  }

  // Update raygun powerups
  raygunPowerUps.forEach((rg, index) => {
    rg.position.z += rg.velocity.z;

    if (model && playerCollidesWithRaygun(rg)) {
      hasRaygun = true;
      raygunOverlay.style.display = 'block'; // Show raygun icon
      scene.remove(rg);
      raygunPowerUps.splice(index, 1);
    }

    if (rg.position.z > 10) {
      scene.remove(rg);
      raygunPowerUps.splice(index, 1);
    }
  });

  // If time is stopped, check how long it has been
  if (isTimeStopped) {
    const elapsed = performance.now() - timeStopStart;
    if (elapsed > timeStopDuration) {
      isTimeStopped = false;

      deactivateLaser();
    }
  }

  // Gravity
  const moveSpeed = 0.1;
  if (model) {
    model.velocity.y += gravity;
    model.position.y += model.velocity.y;
    
    if (keys.a) model.position.x -= moveSpeed;
    if (keys.d) model.position.x += moveSpeed;
    if (keys.w) model.position.z -= moveSpeed;
    if (keys.s) model.position.z += moveSpeed;
  }

  // Enemy spawning
  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 20;

    const position = getNonOverlappingPosition(ground.geometry.parameters.width, -20);
    if (position !== null) {
      let enemyGeometry, enemyMaterial;
      const enemyType = Math.floor(Math.random() * 3);
      
      const lavabasecolor = loader.load("textures/Lava_004_COLOR.jpg");
      const lavanormalMap = loader.load("textures/Lava_004_NORM.jpg");
      const lavaheightMap = loader.load("textures/Lava_004_DISP.png");
      const lavaroughnessMap = loader.load("textures/Lava_004_ROUGH.jpg");
      const lavaambientOcclusionMap = loader.load("textures/Lava_004_OCC.jpg");
    
    // Define colors for different enemy types
    switch (enemyType) {
      case 0: // Box enemy
        enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
        enemyMaterial = new THREE.MeshStandardMaterial({ color: 0x8eecf5, map: lavabasecolor, normalMap: lavanormalMap});
        break;
      case 1: // Sphere enemy (larger radius)
        enemyGeometry = new THREE.SphereGeometry(0.75, 64, 64);
        enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xdcccff, map: lavabasecolor, normalMap: lavanormalMap, displacementMap: lavaheightMap, displacementScale: 0.5, roughnessMap: lavaroughnessMap, roughness: 0.5, aoMap: lavaambientOcclusionMap });
        break;
      case 2: // Sphere enemy (smaller radius)
        enemyGeometry = new THREE.SphereGeometry(0.5,8, 8);
        enemyMaterial = new THREE.ShaderMaterial({
          vertexShader: enemyVertexShader,
          fragmentShader: enemyFragmentShader,
          uniforms: {
            color: { value: new THREE.Color(0xddf0ff) }, // Blue color
            shininess: { value: 64 }, // Shininess factor
          },
        });
        break;
    }

      const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

      enemy.position.set(position.x, position.y, position.z);
      enemy.velocity = new THREE.Vector3(0, 0, 0.05);
      enemy.castShadow = true;
      scene.add(enemy);
      enemies.push(enemy);
    }
  }
  // Power up spawning
  if (frames % shieldSpawnRate === 0) {
    spawnShieldPowerUp();
  }

  // Update shield power-ups
  shieldPowerUps.forEach((shield, index) => {
    shield.position.z += shield.velocity.z;

    // Check collision with player
    if (model && playerCollidesWithShield(shield)) {
      hasShield = true;
      scene.remove(shield);
      shieldPowerUps.splice(index, 1);
    }

    // Shield sphere
    if (!shieldSphere && hasShield) {
      const shieldSphereGeometry = new THREE.SphereGeometry(1.0, 32, 32); 
      const shieldSphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3
      });
      shieldSphere = new THREE.Mesh(shieldSphereGeometry, shieldSphereMaterial);
      shieldSphere.position.copy(model.position);
      scene.add(shieldSphere);
    }

    // Remove off-screen shield power-ups
    if (shield.position.z > 10) {
      scene.remove(shield);
      shieldPowerUps.splice(index, 1);
    }
  });

  // Update enemies
  enemies.forEach((enemy, index) => {
    enemy.position.z += enemy.velocity.z;

    if (model) {
      // Collision with player
      if (boxCollision(model, enemy)) {
        if (hasShield) {
          // Shield breaks, player becomes invulnerable for 1 second
          hasShield = false;
          isInvulnerable = true;
          // Break shield sphere
          if (shieldSphere) {
            scene.remove(shieldSphere);
            shieldSphere = null;
          }
          setTimeout(() => {
            isInvulnerable = false;
          }, 1000);
          // Remove the enemy that broke the shield
          scene.remove(enemy);
          enemies.splice(index, 1);
        } else if (!isInvulnerable) {
          // Normal game over behavior if no shield and not invulnerable
          cancelAnimationFrame(animationId);
          handleGameOver();
        } 
        // If isInvulnerable, just ignore the collisions
      }
    }

    // Remove off-screen enemies
    if (enemy.position.z > 10) {
      scene.remove(enemy);
      enemies.splice(index, 1);
    }
  });

  frames++;
  if (model)
  {
    if (frames%420==0) //every 7 sec
    {
      rotationSpeed=0.03;
    }
    if (frames%420==120)
    {
      rotationSpeed=-0.03;
    }
    if (frames%420==240)
    {
      rotationSpeed=0;
    }
    model.rotation.y += rotationSpeed;
  }

  // If player is not in lane
  if (model && !isPlayerInLane()) {
    isFallingOffEdge = true;
  }

  if (!isFallingOffEdge) {
    // Apply normal ground collision if the player is NOT falling off the edge
    if (model.position.y - 1.5 <= groundLevel) {
      model.position.y = groundLevel + 1.5;
      model.velocity.y = 0;
    }
  }

  if (isFallingOffEdge && model.position.y < -50) {
    cancelAnimationFrame(animationId);
    handleGameOver();
  }

  updateScore();
  updateFlashlight();

  renderer.render(scene, camera);

  controls.update();
}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});