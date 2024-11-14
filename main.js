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
    model.position.set(0, 0, 0); // Set the position of the model
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


// Ground (lane) setup
const groundGeometry = new THREE.BoxGeometry(10, 0.5, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: '#264653' });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, -2, 0);
ground.receiveShadow = true;
scene.add(ground);

// Player cube setup
// const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
// const cubeMaterial = new THREE.MeshStandardMaterial({ color: '#ae00ff' });
// const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
// cube.position.set(0, 0, 0);
// cube.castShadow = true;
// cube.velocity = new THREE.Vector3(0, 0, 0);
// scene.add(cube);

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
      if (model.position.y <= groundLevel + 0.51) {
        model.velocity.y = 0.2;
      }
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

// Enemy cubes array
const enemies = [];
let frames = 0;
let spawnRate = 200;

// Collision detection function
function boxCollision(box1, box2) {
  const xCollide = Math.abs(box1.position.x - box2.position.x) < 1;
  const yCollide = Math.abs(box1.position.y - box2.position.y) < 1;
  const zCollide = Math.abs(box1.position.z - box2.position.z) < 1;
  return xCollide && yCollide && zCollide;
}

// Animation loop
function animate() {
  const animationId = requestAnimationFrame(animate);

  // Apply gravity
  // cube.velocity.y += gravity;
  // cube.position.y += cube.velocity.y;

  

  // Ground collision
  // if (cube.position.y - 0.5 <= groundLevel) {
  //   cube.position.y = groundLevel + 0.5;
  //   cube.velocity.y = 0;
  // }
  const moveSpeed = 0.1;
  if (model)
  {
    model.velocity.y += gravity;
    model.position.y += model.velocity.y;
    if (model.position.y - 0.5 <= groundLevel) {
      model.position.y = groundLevel + 0.5;
      model.velocity.y = 0;
    }
    if (keys.a) model.position.x -= moveSpeed;
    if (keys.d) model.position.x += moveSpeed;
    if (keys.w) model.position.z -= moveSpeed;
    if (keys.s) model.position.z += moveSpeed;
  }
  

  // Player movement
 
  // if (keys.a) cube.position.x -= moveSpeed;
  // if (keys.d) cube.position.x += moveSpeed;
  // if (keys.w) cube.position.z -= moveSpeed;
  // if (keys.s) cube.position.z += moveSpeed;

  

  // Enemy spawning
  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 20;

    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const enemyMaterial = new THREE.MeshStandardMaterial({ color: 'red' });
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

  // Update enemies
  enemies.forEach((enemy, index) => {
    enemy.position.z += enemy.velocity.z;

    // Collision with player
    // if (boxCollision(cube, enemy)) {
    //   cancelAnimationFrame(animationId);
    //   alert('Game Over!');
    // }
    if (model)
    if (boxCollision(model, enemy)) {
      cancelAnimationFrame(animationId);
      alert('Game Over!');
    }

    // Remove off-screen enemies
    if (enemy.position.z > 10) {
      scene.remove(enemy);
      enemies.splice(index, 1);
    }
  });

  frames++;



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