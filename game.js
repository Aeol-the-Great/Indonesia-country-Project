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
ui.innerHTML = `
    <div id="map-name" style="background: rgba(20,20,30,0.8); color: #00d2ff; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 5px;">AIRCRAFT CABIN</div>
    <div id="interact-hint" style="display: none; background: rgba(255,255,255,0.9); color: #000; width: 30px; height: 30px; border-radius: 50%; display: none; align-items: center; justify-content: center; font-weight: bold; font-family: Arial; border: 2px solid #000; box-shadow: 0 0 10px rgba(0,0,0,0.5);">O</div>
`;
ui.style.position = 'absolute';
ui.style.top = '20px';
ui.style.left = '20px';
ui.style.zIndex = '100';
container.appendChild(ui);

// Dialogue System
const dialogueBox = document.createElement('div');
dialogueBox.id = 'dialogue-box';
dialogueBox.style.cssText = `
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    background: rgba(10, 10, 15, 0.95);
    color: #fff;
    padding: 25px;
    border: 3px solid #00d2ff;
    border-radius: 12px;
    font-size: 18px;
    line-height: 1.6;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
    text-align: center;
`;
container.appendChild(dialogueBox);

const mapImg = new Image();
const airportImg = new Image();
const destinationImg = new Image();
mapImg.src = 'pixil-frame-0 (3).png';
airportImg.src = 'pixil-frame-0 (7).png';
destinationImg.src = 'pixil-frame-1.png';

const VIEWPORT_SIZE = 600;
const MAP_SIZE = 800;
const PLAYER_SIZE = 32;
const SPEED = 5;

let currentMap = 'aircraft';
let playerX = 400;
let playerY = 700;
let keys = {};
let isDialogueOpen = false;

const maps = {
    aircraft: {
        img: mapImg,
        name: 'AIRCRAFT CABIN',
        spawn: { x: 400, y: 700 },
        exitRect: { x: 330, y: 133, w: 40, h: 40 },
        collisions: [
            { x: 0, y: 0, w: 330, h: 800 },
            { x: 470, y: 0, w: 330, h: 800 }
        ]
    },
    airport: {
        img: airportImg,
        name: 'AIRPORT GATE',
        spawn: { x: 250, y: 400 },
        exitRect: { x: 370, y: 135, w: 60, h: 20 },
        collisions: [
            { x: 0, y: 620, w: 800, h: 180 },
            { x: 0, y: 0, w: 800, h: 135 }
        ]
    },
    destination: {
        img: destinationImg,
        name: 'DESTINATION',
        spawn: { x: 400, y: 400 },
        collisions: [],
        interactables: [
            {
                x: 65, y: 100, w: 70, h: 250, // Covers the white boxes in top left
                text: "A hanging hotel that is placed on the top of a massive andesite intrusion\nTo get there you climb on steel rungs like a ladder\nThis place is the pinnacle and reason for my hatred of tourism agency apps."
            }
        ]
    }
};

window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    // Interact with O key
    if (key === 'o' && !isDialogueOpen) {
        checkInteraction();
    } else if (isDialogueOpen && (key === 'o' || key === 'escape' || key === ' ')) {
        closeDialogue();
    }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function checkInteraction() {
    if (currentMap !== 'destination') return;

    const map = maps.destination;
    map.interactables.forEach(obj => {
        const dx = (playerX + PLAYER_SIZE / 2) - (obj.x + obj.w / 2);
        const dy = (playerY + PLAYER_SIZE / 2) - (obj.y + obj.h / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) { // Interaction range
            showDialogue(obj.text);
        }
    });
}

function showDialogue(text) {
    isDialogueOpen = true;
    dialogueBox.innerText = text;
    dialogueBox.style.display = 'block';
}

function closeDialogue() {
    isDialogueOpen = false;
    dialogueBox.style.display = 'none';
}

function update() {
    if (isDialogueOpen) return;

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
        const exit = maps.aircraft.exitRect;
        if (playerX < exit.x + exit.w && playerX + PLAYER_SIZE > exit.x &&
            playerY < exit.y + exit.h && playerY + PLAYER_SIZE > exit.y) {
            currentMap = 'airport';
            playerX = maps.airport.spawn.x;
            playerY = maps.airport.spawn.y;
            document.getElementById('map-name').textContent = maps.airport.name;
        }
    } else if (currentMap === 'airport') {
        const exit = maps.airport.exitRect;
        if (playerX < exit.x + exit.w && playerX + PLAYER_SIZE > exit.x &&
            playerY < exit.y + exit.h && playerY + PLAYER_SIZE > exit.y) {
            currentMap = 'destination';
            playerX = maps.destination.spawn.x;
            playerY = maps.destination.spawn.y;
            document.getElementById('map-name').textContent = maps.destination.name;
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

    // Interaction Hint (O icon)
    const hint = document.getElementById('interact-hint');
    let showingHint = false;
    if (currentMap === 'destination' && !isDialogueOpen) {
        maps.destination.interactables.forEach(obj => {
            const dx = (playerX + PLAYER_SIZE / 2) - (obj.x + obj.w / 2);
            const dy = (playerY + PLAYER_SIZE / 2) - (obj.y + obj.h / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                hint.style.display = 'flex';
                hint.style.position = 'absolute';
                hint.style.left = (camX + playerX + PLAYER_SIZE / 2 - 15) + 'px';
                hint.style.top = (camY + playerY - 40) + 'px';
                showingHint = true;
            }
        });
    }
    if (!showingHint) hint.style.display = 'none';

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
