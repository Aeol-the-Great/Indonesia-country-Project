const map = document.getElementById('map');
const player = document.getElementById('player');
const posXDisplay = document.getElementById('posX');
const posYDisplay = document.getElementById('posY');

// Game State
let currentLocation = 'aircraft';
let playerX = 400; // Centered in 800px wide aisle
let playerY = 600;
const speed = 4;
const keys = {};

// Animation State
let direction = 'down';
let frame = 0;
let frameCounter = 0;
const frameSpeed = 8;

// Aircraft Config (800x800 map)
let mapWidth = 800;
let mapHeight = 800; // Single tile height
let cabinLeft = 330; // Left edge of red fuselage
let cabinRight = 470; // Right edge of red fuselage

// Door logic (Cyan spot on map)
const doorRect = { x: 195, y: 133, w: 40, h: 40 };

function switchMap(target) {
    currentLocation = target;
    map.className = target;

    if (target === 'airport') {
        mapWidth = 3000;
        mapHeight = 3000;
        playerX = 1500;
        playerY = 1500;
    } else {
        mapWidth = 800;
        mapHeight = 5000;
        playerX = 400; // Middle of scaled aisle
        playerY = 600;
    }
}

// Map and Screen Dimensions
const screenWidth = 800;
const screenHeight = 600;

// Priority system for movement
let lastKey = '';
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        lastKey = key;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function update() {
    let moving = false;
    let newDirection = direction;

    let nextX = playerX;
    let nextY = playerY;

    // Movement
    if ((keys['w'] || keys['arrowup']) && (lastKey === 'w' || lastKey === 'arrowup' || !keys['a'] && !keys['s'] && !keys['d'])) {
        nextY -= speed;
        newDirection = 'up';
        moving = true;
    } else if ((keys['s'] || keys['arrowdown']) && (lastKey === 's' || lastKey === 'arrowdown' || !keys['w'] && !keys['a'] && !keys['d'])) {
        nextY += speed;
        newDirection = 'down';
        moving = true;
    } else if ((keys['a'] || keys['arrowleft']) && (lastKey === 'a' || lastKey === 'arrowleft' || !keys['w'] && !keys['s'] && !keys['d'])) {
        nextX -= speed;
        newDirection = 'left';
        moving = true;
    } else if ((keys['d'] || keys['arrowright']) && (lastKey === 'd' || lastKey === 'arrowright' || !keys['w'] && !keys['s'] && !keys['a'])) {
        nextX += speed;
        newDirection = 'right';
        moving = true;
    }

    // Collision Logic
    if (currentLocation === 'aircraft') {
        // Check for Exit Door (Cyan spot)
        const inDoor = nextX <= doorRect.x + 10 &&
            nextY >= doorRect.y && nextY <= doorRect.y + doorRect.h;

        if (inDoor) {
            switchMap('airport');
            return requestAnimationFrame(update);
        }

        // Restrict to Aisle (Allow deviation for the door)
        let canExit = (nextY >= 130 && nextY <= 175);
        let leftBound = canExit ? 195 : cabinLeft;

        if (nextX >= leftBound && nextX <= cabinRight) {
            playerX = nextX;
        } else {
            playerX = Math.max(leftBound, Math.min(nextX, cabinRight));
        }
    } else {
        // Airport is free roam
        playerX = nextX;
    }

    playerY = nextY;

    // Update Direction and Animation
    if (moving) {
        direction = newDirection;
        frameCounter++;
        if (frameCounter >= frameSpeed) {
            frame = (frame + 1) % 4;
            frameCounter = 0;
        }
    } else {
        frame = 0;
        frameCounter = 0;
    }

    // Update Player Visual Position (relative to the map)
    // -32 to center the 64px sprite on the coordinate
    player.style.left = (playerX - 32) + 'px';
    player.style.top = (playerY - 32) + 'px';

    playerX = Math.max(0, Math.min(playerX, mapWidth));
    playerY = Math.max(0, Math.min(playerY, mapHeight));

    // Camera/Map Positioning with Clamping
    // We want to center the screen on the player (400, 300)
    let offsetX = 400 - playerX;
    let offsetY = 300 - playerY;

    // Clamp camera so it never shows anything outside the 0 to map dimensions
    // Since map is child of container, transform translate(offsetX, offsetY) moves the map.
    // At map edge (x=0), offset should be 0. At map edge (x=800), offset should be (800 - mapWidth).
    if (mapWidth > 800) {
        offsetX = Math.min(0, Math.max(offsetX, 800 - mapWidth));
    } else {
        offsetX = (800 - mapWidth) / 2;
    }

    if (mapHeight > 600) {
        offsetY = Math.min(0, Math.max(offsetY, 600 - mapHeight));
    } else {
        offsetY = (600 - mapHeight) / 2;
    }

    // Update CSS Classes for Sprite
    player.className = '';
    player.classList.add(direction);
    player.classList.add(`frame-${frame}`);

    // UI Update (posX/posY are hidden via CSS but kept updated for state)
    posXDisplay.textContent = Math.round(playerX);
    posYDisplay.textContent = Math.round(playerY);

    map.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    requestAnimationFrame(update);
}

// Start Game Loop
requestAnimationFrame(update);
