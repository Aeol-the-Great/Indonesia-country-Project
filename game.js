const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 600;
const container = document.getElementById('game-container');
container.innerHTML = '';
container.appendChild(canvas);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// UI Setup
const ui = document.createElement('div');
ui.id = 'ui-overlay';
ui.innerHTML = '<div id="map-name" style="background: rgba(20,20,30,0.8); color: #00d2ff; padding: 10px; border-radius: 8px; font-weight: bold;">AIRCRAFT CABIN</div>';
ui.style.position = 'absolute';
ui.style.top = '20px';
ui.style.left = '20px';
ui.style.zIndex = '100';
container.appendChild(ui);

const mapImg = new Image();
const airportImg = new Image();
mapImg.src = 'pixil-frame-0 (3).png';
airportImg.src = 'pixil-frame-0 (7).png';

const VIEWPORT_SIZE = 600;
const MAP_SIZE = 800;
const PLAYER_SIZE = 32;
const SPEED = 5;

let currentMap = 'aircraft';
let playerX = 400;
let playerY = 700;
let keys = {};

const maps = {
    aircraft: {
        img: mapImg,
        name: 'AIRCRAFT CABIN',
        spawn: { x: 400, y: 700 },
        exitRect: { x: 330, y: 133, w: 40, h: 40 },
        collisions: []
    },
    airport: {
        img: airportImg,
        name: 'AIRPORT GATE',
        spawn: { x: 250, y: 400 },
        collisions: [{ x: 0, y: 620, w: 800, h: 180 }]
    }
};

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function update() {
    let nextX = playerX;
    let nextY = playerY;

    if (keys['w'] || keys['arrowup']) nextY -= SPEED;
    if (keys['s'] || keys['arrowdown']) nextY += SPEED;
    if (keys['a'] || keys['arrowleft']) nextX -= SPEED;
    if (keys['d'] || keys['arrowright']) nextX += SPEED;

    nextX = Math.max(0, Math.min(nextX, MAP_SIZE - PLAYER_SIZE));
    nextY = Math.max(0, Math.min(nextY, MAP_SIZE - PLAYER_SIZE));

    const activeMap = maps[currentMap];
    let collisionDetected = false;
    activeMap.collisions.forEach(rect => {
        if (nextX < rect.x + rect.w && nextX + PLAYER_SIZE > rect.x &&
            nextY < rect.y + rect.h && nextY + PLAYER_SIZE > rect.y) collisionDetected = true;
    });

    if (!collisionDetected) { playerX = nextX; playerY = nextY; }

    if (currentMap === 'aircraft') {
        const exit = activeMap.exitRect;
        if (playerX < exit.x + exit.w && playerX + PLAYER_SIZE > exit.x &&
            playerY < exit.y + exit.h && playerY + PLAYER_SIZE > exit.y) {
            currentMap = 'airport';
            playerX = maps.airport.spawn.x;
            playerY = maps.airport.spawn.y;
            document.getElementById('map-name').textContent = maps.airport.name;
        }
    }
}

function draw() {
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let camX = 300 - playerX - (PLAYER_SIZE / 2);
    let camY = 300 - playerY - (PLAYER_SIZE / 2);
    camX = Math.min(0, Math.max(camX, VIEWPORT_SIZE - MAP_SIZE));
    camY = Math.min(0, Math.max(camY, VIEWPORT_SIZE - MAP_SIZE));

    const activeImg = maps[currentMap].img;
    ctx.drawImage(activeImg, camX, camY, MAP_SIZE, MAP_SIZE);

    // Draw Player
    ctx.fillStyle = '#00d2ff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.fillRect(camX + playerX, camY + playerY, PLAYER_SIZE, PLAYER_SIZE);
    ctx.strokeRect(camX + playerX, camY + playerY, PLAYER_SIZE, PLAYER_SIZE);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
