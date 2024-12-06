import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const scene = new THREE.Scene();


//Space background
const loader = new THREE.TextureLoader();
loader.load('textures/space.jpg', function(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set(2, 2);
  scene.background = texture;
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

    // Optional: adjust the model's scale and position
    model.scale.set(1.5, 1.5, 1.5); // Scale the model if necessary
    model.rotation.y = Math.PI;
    model.position.set(0, 0.5, 0); // Set the position of the model
    model.castShadow = true;
    model.receiveShadow = true;
    model.velocity = new THREE.Vector3(0, 0, 0);
  },
  (xhr) => {
    // Optional: Track the loading progress
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error) => {
    // Handle any errors that occur
    console.error('An error happened while loading the GLTF model:', error);
  }
);

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

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement)

// ------------ Ground (lane) setup ------------
const groundGeometry = new THREE.BoxGeometry(10, 0.5, 50);
//const groundMaterial = new THREE.MeshStandardMaterial({ color: '#264653' });
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
        
      //float wave = sin(vUv.x * 10.0 + iTime) * 0.5 + 0.6;
      //float colorFactor = sin(vUv.y * 20.0 - iTime) * 0.5 + 0.5;
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
      //gl_FragColor = vec4(auroraColor * wave, 1.0);
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
scoreOverlay.style.display = 'flex';
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

// ------------ Menu ------------
let isPaused = false;
let isFallingOffEdge = false;

// Pause function
function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    console.log("Game Paused");
    pausedOverlay.style.display = 'flex';
  } else {
    console.log("Game Resumed");
    pausedOverlay.style.display = 'none';
  }
}

// Score update function (based on how many frames passed)
function updateScore() {
  scoreOverlay.innerText = 'Score: ' + Math.floor(frames/20);
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
      // if (cube.position.y <= groundLevel + 0.51) {
      //   cube.velocity.y = 0.2;
      // }
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

// ------------ Enemies ------------
const enemies = [];
let frames = 0;
let spawnRate = 200;

// Collision detection function

// function boxCollision(box1, box2) {
//   const xCollide = Math.abs(box1.position.x - box2.position.x) < 1;
//   const yCollide = Math.abs(box1.position.y - box2.position.y) < 1;
//   const zCollide = Math.abs(box1.position.z - box2.position.z) < 1;
//   return xCollide && yCollide && zCollide;
// }

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

// ------------ Powerups ------------
let hasShield = false;
let isInvulnerable = false;

const shieldPowerUps = [];
const shieldSpawnRate = 1500;

function spawnShieldPowerUp() {
  const shieldGeometry = new THREE.SphereGeometry(0.5, 16, 16); 
  const shieldMaterial = new THREE.MeshStandardMaterial({ color: 'cyan', emissive: 'blue', emissiveIntensity: 0.5 });
  const shieldPowerUp = new THREE.Mesh(shieldGeometry, shieldMaterial);
  
  // Position the shield power-up at a random x within the lane, and slightly above ground
  const laneWidth = ground.geometry.parameters.width; 
  shieldPowerUp.position.set(
    (Math.random() - 0.5) * laneWidth, 
    groundLevel + 1, 
    -15 // spawn ahead of the player
  );
  
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

// ------------ Animation loop ------------
function animate() {
  // If paused, exit animate function
  if (isPaused) {
    requestAnimationFrame(animate);
    return;
  }

  groundMaterial.uniforms.iTime.value = clock.getElapsedTime();
  const animationId = requestAnimationFrame(animate);

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

    // const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    // const enemyMaterial = new THREE.MeshStandardMaterial({ color: 'red' });


    const enemyType = Math.floor(Math.random() * 3);

    let enemyGeometry;
  let enemyMaterial;
  
  // Define colors for different enemy types
  switch (enemyType) {
    case 0: // Box enemy
      enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
      enemyMaterial = new THREE.ShaderMaterial({
        vertexShader: enemyVertexShader,
        fragmentShader: enemyFragmentShader,
        uniforms: {
          color: { value: new THREE.Color(0x8eecf5) }, 
          shininess: { value: 64 }, // Shininess factor
        },
      });
      break;
    case 1: // Sphere enemy (larger radius)
      enemyGeometry = new THREE.SphereGeometry(1, 4, 2);
      enemyMaterial = new THREE.ShaderMaterial({
        vertexShader: enemyVertexShader,
        fragmentShader: enemyFragmentShader,
        uniforms: {
          color: { value: new THREE.Color(0xdcccff) }, // Green color
          shininess: { value: 64 }, // Shininess factor
        },
      });
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

    enemy.position.set(
      (Math.random() - 0.5) * 10,
      groundLevel + 0.5,
      -15
    );
    enemy.velocity = new THREE.Vector3(0, 0, 0.05);
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
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
      console.log("Shield acquired!");
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
          console.log("Shield broken! Player is invulnerable for 1 second.");
          setTimeout(() => {
            isInvulnerable = false;
            console.log("Invulnerability worn off.");
          }, 1000);
          
          // Remove the enemy that broke the shield
          scene.remove(enemy);
          enemies.splice(index, 1);
        } else if (!isInvulnerable) {
          // Normal game over behavior if no shield and not invulnerable
          cancelAnimationFrame(animationId);
          alert('Game Over!');
        } 
        // If isInvulnerable, just ignore the collisionds
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
    alert('Game Over! You fell off the edge.');
  }

  updateScore();

  renderer.render(scene, camera);

  controls.update();
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});