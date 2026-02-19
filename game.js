let mapWorld;
let currentMapDiv;
let playerDiv;
let mapNameLabel;

// Config
const VIEWPORT_SIZE = 600;
const MAP_SIZE = 800;
const PLAYER_SIZE = 32;
const SPEED = 5;

// State
let currentMap = 'aircraft';
let playerX = 400;
let playerY = 750;
let keys = {};

// Map Definitions
const maps = {
    aircraft: {
        name: 'Garuda Cabin',
        class: 'map-aircraft',
        spawn: { x: 400, y: 700 },
        // Light blue exit area - Updated to match visual spot in pixil-frame-0 (3).png
        exitRect: { x: 330, y: 133, w: 40, h: 40 },
        collisions: []
    },
    airport: {
        name: 'Gate 1 Terminal',
        class: 'map-airport',
        spawn: { x: 250, y: 400 }, // Spawn at yellow X
        // White squares at the bottom of the airport map
        collisions: [
            { x: 0, y: 620, w: 800, h: 180 } // Large white area at bottom
        ]
    }
};

// Initialize
function init() {
    switchMap('aircraft');
    requestAnimationFrame(gameLoop);
}

function switchMap(mapId) {
    console.log("Switching to map:", mapId);
    currentMap = mapId;
    const config = maps[mapId];

    currentMapDiv.className = config.class;
    mapNameLabel.textContent = config.name;

    playerX = config.spawn.x;
    playerY = config.spawn.y;

    // Flash effect
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

// Input handling
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    let nextX = playerX;
    let nextY = playerY;

    if (keys['w'] || keys['arrowup']) nextY -= SPEED;
    if (keys['s'] || keys['arrowdown']) nextY += SPEED;
    if (keys['a'] || keys['arrowleft']) nextX -= SPEED;
    if (keys['d'] || keys['arrowright']) nextX += SPEED;

    // Boundary check
    nextX = Math.max(0, Math.min(nextX, MAP_SIZE - PLAYER_SIZE));
    nextY = Math.max(0, Math.min(nextY, MAP_SIZE - PLAYER_SIZE));

    // Collision check (Map Specific)
    const activeMap = maps[currentMap];
    let collisionDetected = false;

    activeMap.collisions.forEach(rect => {
        if (nextX < rect.x + rect.w &&
            nextX + PLAYER_SIZE > rect.x &&
            nextY < rect.y + rect.h &&
            nextY + PLAYER_SIZE > rect.y) {
            collisionDetected = true;
        }
    });

    if (!collisionDetected) {
        playerX = nextX;
        playerY = nextY;
    }

    // Map Transition Logic
    if (currentMap === 'aircraft') {
        const exit = activeMap.exitRect;
        if (playerX < exit.x + exit.w &&
            playerX + PLAYER_SIZE > exit.x &&
            playerY < exit.y + exit.h &&
            playerY + PLAYER_SIZE > exit.y) {
            switchMap('airport');
        }
    }
}

function draw() {
    // Update player position
    playerDiv.style.left = playerX + 'px';
    playerDiv.style.top = playerY + 'px';

    // Camera follow (clamped)
    // We want the player to be at 300, 300 in the viewport
    let camX = 300 - playerX - (PLAYER_SIZE / 2);
    let camY = 300 - playerY - (PLAYER_SIZE / 2);

    // Bounding the camera to the 800x800 map relative to 600x600 viewport
    // Offset range is 0 to (600 - 800) = -200
    camX = Math.min(0, Math.max(camX, VIEWPORT_SIZE - MAP_SIZE));
    camY = Math.min(0, Math.max(camY, VIEWPORT_SIZE - MAP_SIZE));

    mapWorld.style.transform = `translate(${camX}px, ${camY}px)`;
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    mapWorld = document.getElementById('map-world');
    currentMapDiv = document.getElementById('current-map');
    playerDiv = document.getElementById('player');
    mapNameLabel = document.getElementById('map-name');

    if (!mapWorld || !currentMapDiv || !playerDiv || !mapNameLabel) {
        console.error("Game elements not found!");
        return;
    }

    init();
});
