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
    <div id="objective-display" style="background: rgba(20,20,30,0.8); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 14px; margin-bottom: 5px; border-left: 4px solid #00d2ff;">○ Objective: Purchase Climbers Gear</div>
    <div id="ice-status" style="display: none; background: rgba(0, 150, 255, 0.4); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #00d2ff; text-align: center; margin-bottom: 5px; text-shadow: 0 0 5px #00d2ff; animation: pulse 1s infinite alternate;">❄ ICE STATUS: FROST AURA ACTIVE</div>
    <div id="stamina-ui" style="display: none; position: absolute; top: 100px; left: 20px; width: 20px; height: 200px; background: rgba(0,0,0,0.5); border: 2px solid #fff; border-radius: 5px;">
        <div id="stamina-fill" style="position: absolute; bottom: 0; width: 100%; height: 100%; background: linear-gradient(to top, #4caf50, #81c784); border-radius: 3px; transition: height 0.1s;"></div>
        <div style="position: absolute; top: -25px; left: -10px; width: 40px; text-align: center; color: #fff; font-weight: bold; font-size: 10px;">STAMINA</div>
    </div>
    <div id="budget-container" style="display: none; background: rgba(20,20,30,0.8); color: #4CAF50; padding: 8px 12px; border-radius: 8px; font-size: 16px; font-weight: bold; margin-bottom: 5px; border-left: 4px solid #4CAF50;">Budget: $<span id="budget-value">1000</span></div>
    <div id="drone-ui" style="display: none; position: absolute; top: 100px; right: 20px; width: 40px; height: 200px; background: rgba(0,0,0,0.5); border: 2px solid #fff; border-radius: 5px;">
        <div id="heat-fill" style="position: absolute; bottom: 0; width: 100%; height: 0%; background: linear-gradient(to top, #ffeb3b, #f44336); border-radius: 3px; transition: height 0.1s;"></div>
        <div style="position: absolute; top: -25px; left: 0; width: 100%; text-align: center; color: #fff; font-weight: bold; font-size: 12px;">HEAT</div>
    </div>
    <div id="photo-prompt" style="display: none; position: absolute; top: 150px; left: 50%; transform: translateX(-50%); background: rgba(10,10,20,0.9); width: 400px; padding: 10px 20px; border: 2px solid #00d2ff; box-shadow: 0 0 20px rgba(0,210,255,0.5); border-radius: 4px; text-align: center;">
        <div style="color: #00d2ff; font-size: 12px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">Secured Connection: Enter Access Code</div>
        <div id="arrow-sequence" style="font-size: 28px; letter-spacing: 15px; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;"></div>
    </div>
    <div id="instructions" style="background: rgba(20,20,30,0.8); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Move with WASD or Arrows. Find the exit!</div>
    <div id="interact-hint" style="display: none; background: rgba(255,255,255,0.9); color: #000; width: 30px; height: 30px; border-radius: 50%; align-items: center; justify-content: center; font-weight: bold; font-family: Arial; border: 2px solid #000; box-shadow: 0 0 10px rgba(0,0,0,0.5);">O</div>
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

// Shop System
const shopUI = document.createElement('div');
shopUI.id = 'shop-ui';
shopUI.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background: rgba(15, 15, 25, 0.95);
    color: #fff;
    padding: 30px;
    border: 3px solid #00d2ff;
    border-radius: 16px;
    display: none;
    z-index: 2000;
    box-shadow: 0 0 50px rgba(0, 210, 255, 0.4);
    text-align: center;
`;
container.appendChild(shopUI);

let isShopOpen = false;
let isClimbing = false;
let climbProgress = 0; // 0 to 7 (number of rungs)
let timingArrowPos = 0;
let timingArrowDir = 1;
let lastHitResult = ''; // 'GREAT', 'MISS', or ''
let feedbackTimer = 0;
const RUNG_COUNT = 7;
const RUNG_Y_POSITIONS = [520, 450, 380, 310, 240, 170, 100]; // Y positions for each rung

let splashActive = false;
let splashTimer = 0;
let splashAlpha = 0;
let splashPhase = 'image'; // 'image', 'black', 'text'

let debugMode = false;
let inventory = {
    climbers_gear: false,
    sun_hat: false,
    melon: false,
    sword: false,
    lorebook: false
};
let budget = 1000;

let isLorebookOpen = false;
const loreEntries = {
    aircraft: "A tight aircraft cabin. The seats are red and the aisle is blue. It smells like recycled air and anticipation.",
    airport: "Soekarno-Hatta International Airport. The gateway to the archipelago.",
    destination: "Gunung Parang. A massive andesite intrusion. The steel rungs look daunting but the view from the hanging hotel is worth it.",
    borobudur: "The world's largest Buddhist temple. A masterpiece of stone and devotion.",
    marketplace: "Ubud Art Market. A kaleidoscope of colors, crafts, and culture.",
    kawah: "Ijen Crater. Famous for its electric blue flames and the sulfur miners' perseverance.",
    lake_toba: "The largest volcanic lake in the world. Formed by a supervolcanic eruption that changed the world."
};

let transitionActive = false;
let transitionTimer = 0;
const lorebookUI = document.createElement('div');
lorebookUI.id = 'lorebook-ui';
lorebookUI.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    height: 600px;
    background: #f4e4bc;
    color: #433422;
    padding: 40px;
    border: 10px solid #5d4037;
    border-radius: 4px;
    display: none;
    z-index: 3000;
    box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.1);
    font-family: 'Georgia', serif;
    overflow-y: auto;
`;
container.appendChild(lorebookUI);

function openLorebook() {
    isLorebookOpen = true;
    updateLorebookUI();
    lorebookUI.style.display = 'block';
}

function closeLorebook() {
    isLorebookOpen = false;
    lorebookUI.style.display = 'none';
}

function updateLorebookUI() {
    let html = `
        <h1 style="text-align: center; border-bottom: 2px solid #5d4037; padding-bottom: 10px; margin-top: 0;">ENCYCLOPEDIA INDONESIA</h1>
        <div style="font-style: italic; text-align: center; margin-bottom: 20px;">Traveler's Records</div>
    `;

    for (const [key, entry] of Object.entries(loreEntries)) {
        const isDiscovered = currentMap === key || (key === 'aircraft' && currentMap !== 'none'); // Simplified discovery
        html += `
            <div style="margin-bottom: 25px; padding: 15px; border-left: 3px solid #5d4037; background: rgba(0,0,0,0.03);">
                <h3 style="margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">${key.replace('_', ' ')}</h3>
                <p style="margin: 0; line-height: 1.5; color: #5d4037;">${isDiscovered ? entry : "?? discovered by visiting ??"}</p>
            </div>
        `;
    }

    html += `<div style="text-align: center; margin-top: 30px; font-size: 12px; opacity: 0.7;">[Press TAB to close]</div>`;
    lorebookUI.innerHTML = html;
}

window.openLoreShop = function () {
    isShopOpen = true;
    updateLoreShopUI();
    shopUI.style.display = 'block';
}

window.updateLoreShopUI = function () {
    shopUI.innerHTML = `
        <h2 style="color: #ff9800; margin-bottom: 20px; font-size: 24px;">LORE KEEPER'S HUT</h2>
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: rgba(121, 85, 72, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #795548;">
                <div style="font-size: 40px;">📖</div>
            </div>
            <p style="margin-bottom: 15px; font-size: 16px;">"A book that grows with your journey. Contains wisdom of the islands."</p>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; border: 1px solid #795548;">
                <span style="font-weight: bold;">Lorebook</span>
                ${inventory.lorebook
            ? '<span style="color: #4CAF50; font-weight: bold;">OWNED</span>'
            : (budget >= 100
                ? '<button onclick="buyLorebook()" style="background: #ff9800; color: #000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">$100</button>'
                : '<span style="color: #f44336; font-size: 12px;">INSUFFICIENT FUNDS</span>')}
            </div>
        </div>
        <button onclick="closeShop()" style="background: none; border: 2px solid #fff; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">CLOSE</button>
    `;
}

window.buyLorebook = function () {
    if (budget >= 100) {
        budget -= 100;
        inventory.lorebook = true;
        document.getElementById('budget-value').innerText = budget;
        updateLoreShopUI();
        updateObjective();
    }
}

function triggerTransition(nextMap, nextX, nextY) {
    if (transitionActive) return;
    transitionActive = true;
    transitionTimer = 120; // 2 seconds at 60fps
    pendingTransition = { nextMap, nextX, nextY };
}

// Drone Minigame State
let isDroneActive = false;
let droneX = 400;
let droneY = 400;
let droneHeat = 0;
let droneDead = false;
let photoMode = false;
let dodgeMode = false;
let dodgeTimer = 0;
let droneProjectiles = [];
let droneExplosions = [];
let currentPhotoTarget = null;
let photoSuccessCount = 0;
let researchComplete = false;
let iceStatusTimer = 0;
let stamina = 100;
let isExhausted = false;
let boatPausedTimer = 0;
let lakeWaves = [];
let boatVX = 0;
let boatVY = 0;
let currentPhotoIndex = 0;

const LAVA_TARGETS = [
    { id: 'top', x: 400, y: 200, sequence: ['arrowup', 'arrowup', 'arrowdown', 'arrowleft'], direction: 'UP UP DOWN LEFT', color: 'cyan', completed: false, scanned: false },
    { id: 'left', x: 200, y: 400, sequence: ['arrowleft', 'arrowup', 'arrowdown', 'arrowright'], direction: 'LEFT UP DOWN RIGHT', color: 'cyan', completed: false, scanned: false },
    { id: 'right', x: 600, y: 400, sequence: ['arrowright', 'arrowdown', 'arrowright', 'arrowup'], direction: 'RIGHT DOWN RIGHT UP', color: 'cyan', completed: false, scanned: false },
    { id: 'bottom', x: 400, y: 600, sequence: ['arrowdown', 'arrowright', 'arrowup', 'arrowleft'], direction: 'DOWN RIGHT UP LEFT', color: 'cyan', completed: false, scanned: false }
];

function openShop() {
    isShopOpen = true;
    updateShopUI();
    shopUI.style.display = 'block';
}

function updateShopUI() {
    shopUI.innerHTML = `
        <h2 style="color: #00d2ff; margin-bottom: 20px; font-size: 24px; letter-spacing: 2px;">EQUIPMENT SHOP</h2>
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: rgba(0, 210, 255, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(0, 210, 255, 0.3);">
                <img src="Rope.png" style="width: 50px; height: 50px; image-rendering: pixelated;">
            </div>
            <p style="margin-bottom: 15px; font-size: 16px;">Essential gear for the andesite intrusion climb.</p>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 210, 255, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(0, 210, 255, 0.3);">
                <span style="font-weight: bold;">Climbers Gear</span>
                ${inventory.climbers_gear
            ? '<span style="color: #4CAF50; font-weight: bold;">PURCHASED</span>'
            : '<button onclick="buyItem(\'climbers_gear\')" style="background: #00d2ff; color: #000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s;">BUY</button>'}
            </div>
        </div>
        <button onclick="closeShop()" style="background: none; border: 2px solid #fff; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;">CLOSE</button>
    `;
}

window.buyItem = function (itemId) {
    inventory[itemId] = true;
    updateShopUI();
    updateObjective();
};

window.closeShop = function () {
    isShopOpen = false;
    shopUI.style.display = 'none';
};

window.openSouvenirShop = function () {
    isShopOpen = true;
    updateSouvenirShopUI();
    shopUI.style.display = 'block';
}

window.updateSouvenirShopUI = function () {
    shopUI.innerHTML = `
        <h2 style="color: #ffca28; margin-bottom: 20px; font-size: 24px;">UBUD ART MARKET</h2>
        <p style="margin-bottom: 20px;">Choose ONE souvenir to take home!</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid ${inventory.sun_hat ? '#4CAF50' : 'rgba(255,255,255,0.1)'}">
                <div style="width: 50px; height: 50px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">
                    <img src="pixil-frame-0 (22).png" style="width: 40px; height: 40px; image-rendering: pixelated;">
                </div>
                <div style="font-weight: bold; margin-bottom: 5px;">Straw Hat</div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 15px;">A stylish hat for the tropical sun.</div>
                ${(inventory.sun_hat || inventory.melon) ?
            (inventory.sun_hat ? '<span style="color: #4CAF50;">SELECTED</span>' : '<span style="color: #666;">UNAVAILABLE</span>') :
            '<button onclick="selectSouvenir(\'sun_hat\')" style="background: #ffca28; color: #000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">SELECT</button>'}
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid ${inventory.melon ? '#4CAF50' : 'rgba(255,255,255,0.1)'}">
                <div style="width: 50px; height: 50px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">
                    <img src="pixilart-drawing (7).png" style="width: 40px; height: 40px; image-rendering: pixelated;">
                </div>
                <div style="font-weight: bold; margin-bottom: 5px;">Melon</div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 15px;">+1000% Ice Damage (Useless here).</div>
                ${(inventory.sun_hat || inventory.melon) ?
            (inventory.melon ? '<span style="color: #4CAF50;">SELECTED</span>' : '<span style="color: #666;">UNAVAILABLE</span>') :
            '<button onclick="selectSouvenir(\'melon\')" style="background: #ffca28; color: #000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">SELECT</button>'}
            </div>
        </div>
        <button onclick="closeShop()" style="background: none; border: 2px solid #fff; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">CLOSE</button>
    `;
}

window.selectSouvenir = function (itemId) {
    inventory[itemId] = true;
    updateSouvenirShopUI();
    updateObjective();
}

window.openSwordShop = function () {
    isShopOpen = true;
    updateSwordShopUI();
    shopUI.style.display = 'block';
}

window.updateSwordShopUI = function () {
    shopUI.innerHTML = `
        <h2 style="color: #607d8b; margin-bottom: 20px; font-size: 24px;">???</h2>
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: rgba(0, 0, 0, 0.4); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #555;">
                <img src="pixil-frame-0 (28).png" style="width: 60px; height: 60px; image-rendering: pixelated;">
            </div>
            <p style="margin-bottom: 15px; font-size: 16px; color: #cfd8dc;">"Never touch it without its scabbard nearby... wait... where's the scabbard!?"</p>
            <div style="color: #ff5252; font-weight: bold; margin-bottom: 15px;">+1000% CRITDMG</div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; border: 1px solid #444;">
                <span style="font-weight: bold;">Mysterious Sword</span>
                ${inventory.sword
            ? '<span style="color: #4CAF50; font-weight: bold;">ACQUIRED</span>'
            : (budget >= 1000
                ? '<button onclick="buySword()" style="background: #607d8b; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">$1000</button>'
                : '<span style="color: #f44336; font-size: 12px;">INSUFFICIENT FUNDS</span>')}
            </div>
        </div>
        <button onclick="closeShop()" style="background: none; border: 2px solid #fff; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">CLOSE</button>
    `;
}

window.buySword = function () {
    if (budget >= 1000) {
        budget -= 1000;
        inventory.sword = true;
        document.getElementById('budget-value').innerText = budget;
        updateSwordShopUI();
    }
}

function updateObjective() {
    const objectiveEl = document.getElementById('objective-display');
    const instructionEl = document.getElementById('instructions');

    if (currentMap === 'kawah') {
        if (researchComplete) {
            objectiveEl.innerHTML = '<span style="color: #4CAF50;">✓ Research Done: Return to Pilot</span>';
            instructionEl.innerText = "Fly the drone back to your character and press F to move on!";
        } else {
            const completedCount = LAVA_TARGETS.filter(t => t.completed).length;
            objectiveEl.innerHTML = `<span style="color: #ffca28;">○ Objective: Research Blue Lava (${completedCount}/4)</span>`;
            instructionEl.innerText = "Pilot over blue lava vents. Survive the scan (Space), then press Space again to enter the code!";
        }
    } else if (currentMap === 'marketplace') {
        if (inventory.sun_hat || inventory.melon) {
            objectiveEl.innerHTML = '<span style="color: #4CAF50;">✓ Objective: Souvenir Acquired</span>';
            instructionEl.innerText = "You have what you need. Find the west exit to head to Kawah Ijen!";
        } else {
            objectiveEl.innerHTML = '<span style="color: #ffca28;">○ Objective: Visit Ubud Art Market</span>';
            instructionEl.innerText = "Find the shop and buy a souvenir!";
        }
    } else if (currentMap === 'borobudur') {
        objectiveEl.innerHTML = '<span style="color: #ffca28;">○ Objective: Explore Borobudur</span>';
        instructionEl.innerText = "Explore the majestic Borobudur Temple.";
    } else if (currentMap === 'aircraft') {
        objectiveEl.innerHTML = '<span style="color: #ffca28;">○ Objective: Get to your seat</span>';
        instructionEl.innerText = "Get to your seat. The flight to Indonesia will begin shortly.";
    } else if (currentMap === 'airport') {
        objectiveEl.innerHTML = '<span style="color: #ffca28;">○ Objective: Enter the Gate</span>';
        instructionEl.innerText = "Enter the gate doors to start your journey!";
    } else if (currentMap === 'lake_toba') {
        objectiveEl.innerHTML = '<span style="color: #00d2ff;">○ Objective: Enjoy Lake Toba</span>';
        instructionEl.innerText = "You're on a boat! Relax and enjoy the view of the worlds largest volcanic lake.";
    } else if (inventory.climbers_gear) {
        objectiveEl.innerHTML = '<span style="color: #4CAF50;">✓ Objective: Equipment Acquired</span>';
        instructionEl.innerText = "Move to the rock face and press SPACE to climb!";
        if (!inventory.lorebook) {
            instructionEl.innerText += " (Optional: Get the Lorebook from the red house)";
        }
    } else {
        objectiveEl.innerHTML = '<span style="color: #ffca28;">○ Objective: Purchase Climbers Gear</span>';
        instructionEl.innerText = "Find the equipment shop at Gunung Parang.";
    }
}

// Update UI setup to include objective and shop trigger hint
const mapImg = new Image();
const airportImg = new Image();
const destinationImg = new Image();
const ropeImg = new Image();
const climbImg = new Image();
const splashImg = new Image();
const borobudurImg = new Image();
const marketplaceImg = new Image();
const strawHatImg = new Image();
const melonImg = new Image();
const kawahImg = new Image();
mapImg.src = 'pixil-frame-0 (3).png';
airportImg.src = 'pixil-frame-0 (7).png';
destinationImg.src = 'pixil-frame-1.png';
ropeImg.src = 'Rope.png';
climbImg.src = 'pixil-frame-0 (1) (2).png';
splashImg.src = 'pixil-frame-0 (11).png';
borobudurImg.src = 'pixil-frame-0 (12).png';
marketplaceImg.src = 'pixilart-drawing (6).png';
strawHatImg.src = 'pixil-frame-0 (22).png';
melonImg.src = 'pixilart-drawing (7).png';
kawahImg.src = 'pixil-frame-0 (15).png';
const lakeTobaImg = new Image();
lakeTobaImg.src = 'pixil-frame-0 (26).png';
const swordImg = new Image();
swordImg.src = 'pixil-frame-0 (28).png';
const boatRightImg = new Image();
boatRightImg.src = 'pixil-frame-0 (30).png';
const boatDownImg = new Image();
boatDownImg.src = 'pixil-frame-0 (31).png';
const boatUpImg = new Image();
boatUpImg.src = 'pixil-frame-0 (32).png';
const boatLeftImg = new Image();
boatLeftImg.src = 'pixil-frame-0 (33).png';

const VIEWPORT_WIDTH = 600;
const VIEWPORT_HEIGHT = 600;
const MAP_SIZE = 800;
const PLAYER_SIZE = 32;
const SPEED = 5;

let currentMap = 'aircraft';
let playerX = 400;
let playerY = 700;
let playerFacing = 'down';
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
        name: 'GUNUNG PARANG VIA FERRATA',
        size: 1600,
        spawn: { x: 100, y: 1380 },
        collisions: [
            // Four squares (Equipment boxes) - individually defined
            { x: 128, y: 160, w: 144, h: 112 }, // Box 1
            { x: 128, y: 304, w: 144, h: 112 }, // Box 2
            { x: 128, y: 448, w: 144, h: 112 }, // Box 3
            { x: 128, y: 592, w: 144, h: 112 }, // Box 4
            // House
            { x: 816, y: 784, w: 464, h: 512 },
            // Rock Face (Top Right) - more granular stair-step approach
            { x: 1136, y: 0, w: 464, h: 112 },
            { x: 1168, y: 112, w: 432, h: 112 },
            { x: 1216, y: 224, w: 384, h: 112 },
            { x: 1264, y: 336, w: 336, h: 112 },
            { x: 1328, y: 448, w: 272, h: 112 },
            { x: 1408, y: 560, w: 192, h: 112 },
            { x: 1488, y: 672, w: 112, h: 112 },
            { x: 1552, y: 784, w: 48, h: 80 }
        ],
        interactables: [
            {
                x: 128, y: 160, w: 144, h: 544,
                text: "A hanging hotel that is placed on the top of a massive andesite intrusion\nTo get there you climb on steel rungs like a ladder\nThis place is the pinnacle and reason for my hatred of tourism agency apps.",
                type: 'shop'
            },
            {
                x: 1200, y: 0, w: 400, h: 600, // Rock face area
                type: 'climb_trigger'
            },
            {
                x: 1024, y: 1152, w: 48, h: 96, // Yellow Door
                type: 'lore_shop'
            }
        ]
    },
    borobudur: {
        img: borobudurImg,
        name: 'BOROBUDUR TEMPLE',
        size: 1600,
        spawn: { x: 800, y: 1500 },
        checkCollision: (x, y) => {
            const centerX = 800;
            const centerY = 800;
            const playerCenterX = x + 16;
            const playerCenterY = y + 16;
            const dx = playerCenterX - centerX;
            const dy = playerCenterY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 1. Grass (walkable if distance > 720)
            if (dist > 720) return false;

            // 2. Teleport Area (walkable at far east)
            if (playerCenterX > 1550) return false;

            // 3. Inner circles (walkable if distance < 360)
            if (dist < 360) return false;

            // 3. Pathways (walkable if within 90px of center lines)
            // Vertical path
            if (Math.abs(dx) < 90) return false;
            // Horizontal path
            if (Math.abs(dy) < 90) return false;

            // 4. Otherwise, it's a collision (the temple steps/terraces)
            return true;
        },
        exitRect: { x: 1200, y: 750, w: 40, h: 100 }, // Middle of east path
        interactables: []
    },
    marketplace: {
        img: marketplaceImg,
        name: 'UBUD ART MARKET',
        size: 1000,
        spawn: { x: 50, y: 150 },
        checkCollision: (x, y) => false,
        exitRect: { x: 950, y: 110, w: 50, h: 100 }, // East end of road
        interactables: [
            {
                x: 310, y: 530, w: 140, h: 380, // Peach buildings
                type: 'souvenir_shop'
            },
            {
                x: 450, y: 0, w: 100, h: 50, // Dark grey area at the top
                type: 'sword_shop'
            }
        ]
    },
    kawah: {
        img: kawahImg,
        name: 'IJEN CRATER VOLCANOLOGY',
        size: 800,
        spawn: { x: 400, y: 750 }, // Wooden platform bottom
        checkCollision: (x, y) => {
            // Player only on wooden platform
            if (y > 720 && x > 350 && x < 450) return false;
            return true;
        },
        interactables: []
    },
    lake_toba: {
        img: lakeTobaImg,
        name: 'LAKE TOBA BOAT TRIP',
        size: 8000,
        spawn: { x: 4000, y: 4000 },
        checkCollision: (x, y) => {
            // Restrict movement to within the orange square on the map
            // Bounds calculated from 300x300 image (Scale: 8000/300)
            if (x < 1467 || x > 7067 || y < 533 || y > 6027) return true;
            return false;
        },
        interactables: []
    }
};

window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    // Priority 1: Dialogue Handling (Ensures we never get stuck)
    if (isDialogueOpen && (key === 'o' || key === 'escape' || key === ' ' || key === 'enter')) {
        closeDialogue();
        if (droneDead && (key === 'y' || key === ' ')) {
            resetDrone();
        }
        return;
    }

    if (key === 'tab') {
        e.preventDefault();
        if (inventory.lorebook) {
            if (isLorebookOpen) closeLorebook();
            else openLorebook();
        }
        return;
    }

    if (isLorebookOpen && (key === 'escape' || key === 'tab')) {
        closeLorebook();
        return;
    }

    // Priority 2: Drone Death Retry (Fallback)
    if (droneDead && (key === 'y' || key === ' ')) {
        resetDrone();
        return;
    }

    // Priority 3: Transition to Lake Toba after research (Must be near player)
    if (researchComplete && key === 'f') {
        const distToPlayer = Math.sqrt(Math.pow(droneX - 400, 2) + Math.pow(droneY - 742, 2));
        if (distToPlayer < 100) { // Slightly larger radius for ease of use
            isDroneActive = false;
            researchComplete = false;
            closeDialogue(); // Ensure no leftover messages
            triggerTransition('lake_toba', maps.lake_toba.spawn.x, maps.lake_toba.spawn.y);
            return;
        }
    }

    // Priority 4: Active Drone Input
    if (isDroneActive && !droneDead) {
        handleDroneInput(key);
        return;
    }

    // Interact with O key or Enter
    if ((key === 'o' || key === 'enter') && !isDialogueOpen && !isShopOpen && !isClimbing && !isLorebookOpen) {
        checkInteraction();
    } else if ((isShopOpen || isLorebookOpen) && key === 'escape') {
        closeShop();
        closeLorebook();
    } else if (key === ' ' && !isDialogueOpen && !isShopOpen && !isLorebookOpen) {
        if (isClimbing) {
            handleClimbInput();
        } else {
            checkClimbStart();
        }
    } else if (key === 'f' && !isDialogueOpen && !isShopOpen) {
        if (currentMap === 'borobudur') {
            checkPortalTransition();
        } else if (currentMap === 'marketplace') {
            checkFinalExit();
        }
    } else if (key === 'f3') {
        debugMode = !debugMode;
        console.log('Debug mode: ' + debugMode);
    }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function checkPortalTransition() {
    if (currentMap !== 'borobudur') return;
    const portal = maps.borobudur.exitRect;
    const dx = (playerX + PLAYER_SIZE / 2) - (portal.x + portal.w / 2);
    const dy = (playerY + PLAYER_SIZE / 2) - (portal.y + portal.h / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 100) {
        triggerTransition('marketplace', maps.marketplace.spawn.x, maps.marketplace.spawn.y);
    }
}

function checkFinalExit() {
    if (currentMap !== 'marketplace') return;
    const portal = maps.marketplace.exitRect;
    const dx = (playerX + PLAYER_SIZE / 2) - (portal.x + portal.w / 2);
    const dy = (playerY + PLAYER_SIZE / 2) - (portal.y + portal.h / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 100) {
        triggerTransition('kawah', maps.kawah.spawn.x, maps.kawah.spawn.y);
    }
}

function handleDroneInput(key) {
    if (photoMode) {
        const expected = currentPhotoTarget.sequence[currentPhotoIndex];
        if (key === expected) {
            currentPhotoIndex++;
            updateArrowDisplay();
            if (currentPhotoIndex === currentPhotoTarget.sequence.length) {
                currentPhotoTarget.completed = true;
                photoMode = false;
                photoSuccessCount++;
                document.getElementById('photo-prompt').style.display = 'none';
                updateObjective();
                if (photoSuccessCount >= LAVA_TARGETS.length) {
                    researchComplete = true;
                    updateObjective();
                    showDialogue("All blue lava samples captured! Fly the drone back to your character to board the boat (Press Space/O to close this message).");
                }
            }
        } else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            currentPhotoIndex = 0;
            updateArrowDisplay();
        }
    } else if (key === ' ' && !dodgeMode) {
        // If near a target, start dodge phase
        LAVA_TARGETS.forEach(target => {
            if (target.completed) return;
            const dx = droneX - target.x;
            const dy = droneY - target.y;
            if (Math.sqrt(dx * dx + dy * dy) < 60) {
                if (target.scanned) {
                    // Already scanned, just restart photo mode
                    photoMode = true;
                    currentPhotoTarget = target;
                    currentPhotoIndex = 0;
                    document.getElementById('photo-prompt').style.display = 'block';
                    updateArrowDisplay();
                } else {
                    dodgeMode = true;
                    dodgeTimer = 300; // 5 seconds
                    currentPhotoTarget = target;
                    droneProjectiles = [];
                    droneExplosions = [];
                }
            }
        });
    }
}

function resetDrone() {
    droneX = 400;
    droneY = 700;
    droneHeat = 0;
    droneDead = false;
    photoMode = false;
    dodgeMode = false;
    droneProjectiles = [];
    droneExplosions = [];
    currentPhotoIndex = 0;
    document.getElementById('drone-ui').style.display = 'block';
    document.getElementById('photo-prompt').style.display = 'none';
    closeDialogue(); // Unpause the game Loop

    // Ensure researchComplete persists unless we are resetting the whole map
    const completedCount = LAVA_TARGETS.filter(t => t.completed).length;
    if (completedCount >= 4) researchComplete = true;
}

function updateArrowDisplay() {
    const sequenceEl = document.getElementById('arrow-sequence');
    const seq = currentPhotoTarget.sequence;
    let html = "";
    const symbols = { 'arrowup': '↑', 'arrowdown': '↓', 'arrowleft': '←', 'arrowright': '→' };
    for (let i = 0; i < seq.length; i++) {
        const color = i < currentPhotoIndex ? '#4CAF50' : '#fff';
        html += `<span style="color: ${color}">${symbols[seq[i]]}</span>`;
    }
    sequenceEl.innerHTML = html;
}

function checkClimbStart() {
    if (currentMap !== 'destination' || !inventory.climbers_gear) return;

    const map = maps.destination;
    map.interactables.forEach(obj => {
        if (obj.type === 'climb_trigger') {
            const dx = (playerX + PLAYER_SIZE / 2) - (obj.x + obj.w / 2);
            const dy = (playerY + PLAYER_SIZE / 2) - (obj.y + obj.h / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) {
                startClimbing();
            }
        }
    });
}

function startClimbing() {
    isClimbing = true;
    climbProgress = 0;
    timingArrowPos = 0;
    document.getElementById('map-name').textContent = "CLIMBING VIA FERRATA";
}

function handleClimbInput() {
    // Check if arrow is in the center (center is 0.5, range 0.4 to 0.6)
    if (timingArrowPos > 0.4 && timingArrowPos < 0.6) {
        climbProgress++;
        lastHitResult = 'GREAT!';
        feedbackTimer = 60;
        if (climbProgress >= RUNG_COUNT) {
            finishClimb();
        }
    } else {
        // Fail: maybe slip down a bit
        climbProgress = Math.max(0, climbProgress - 1);
        lastHitResult = 'MISS!';
        feedbackTimer = 60;
    }
}

function finishClimb() {
    isClimbing = false;
    document.getElementById('map-name').textContent = maps.destination.name;

    // Start Cutscene
    splashActive = true;
    splashTimer = 360; // Total duration: 6 seconds
    splashAlpha = 0;
    splashPhase = 'image';
}

function checkInteraction() {
    const map = maps[currentMap];
    if (!map.interactables) return;

    map.interactables.forEach(obj => {
        const dx = (playerX + PLAYER_SIZE / 2) - (obj.x + obj.w / 2);
        const dy = (playerY + PLAYER_SIZE / 2) - (obj.y + obj.h / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) { // Interaction range
            if (obj.type === 'shop') {
                openShop();
            } else if (obj.type === 'souvenir_shop') {
                openSouvenirShop();
            } else if (obj.type === 'sword_shop') {
                openSwordShop();
            } else if (obj.type === 'lore_shop') {
                openLoreShop();
            } else {
                showDialogue(obj.text);
            }
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

    // Space reserved for future dialogue closing logic
}

function update() {
    if (transitionActive) {
        transitionTimer--;
        if (transitionTimer === 60) { // Halfway: screen is black, change map
            currentMap = pendingTransition.nextMap;
            playerX = pendingTransition.nextX;
            playerY = pendingTransition.nextY;
            document.getElementById('map-name').textContent = maps[currentMap].name;
            updateObjective();

            // Map-specific setups
            if (currentMap === 'marketplace') {
                document.getElementById('budget-container').style.display = 'block';
            } else if (currentMap === 'kawah') {
                document.getElementById('budget-container').style.display = 'none';
                isDroneActive = true;
                resetDrone();
                updateObjective();
            } else if (currentMap === 'lake_toba') {
                document.getElementById('stamina-ui').style.display = 'block';
                stamina = 100;
                isExhausted = false;
            } else {
                document.getElementById('stamina-ui').style.display = 'none';
            }
        }
        if (transitionTimer <= 0) {
            transitionActive = false;
            pendingTransition = null;
        }
        return;
    }

    if (!isDialogueOpen && !isShopOpen) {
        if (isClimbing) {
            timingArrowPos += 0.02 * timingArrowDir;
            if (timingArrowPos > 1 || timingArrowPos < 0) timingArrowDir *= -1;
            if (feedbackTimer > 0) feedbackTimer--;
            return;
        }

        if (isDroneActive && !droneDead) {
            updateDrone();
            return;
        }
    } else {
        // Special case: Allow drone and stamina updates during dialogue for extraction/boat
        if (isDroneActive && !droneDead) updateDrone();
        if (currentMap === 'lake_toba') updateStaminaAndWaves(0, 0); // Helper or similar
    }

    if (splashActive) {
        splashTimer--;

        // Image Phase (3 seconds = 180 frames)
        if (splashTimer > 180) {
            splashPhase = 'image';
            // Fade in (first 60 frames)
            if (splashTimer > 300) {
                splashAlpha = Math.min(1, splashAlpha + 0.05);
            }
            // Fade out (last 60 frames of image phase)
            else if (splashTimer < 240) {
                splashAlpha = Math.max(0, splashAlpha - 0.05);
            }
            // Stay opaque (middle 60 frames)
            else {
                splashAlpha = 1;
            }
        }
        // Black Screen Phase (2 seconds = 120 frames)
        else if (splashTimer > 60) {
            if (splashPhase !== 'black') {
                splashPhase = 'black';
                splashAlpha = 0; // Reset alpha for black screen fade-in
            }
            splashAlpha = Math.min(1, splashAlpha + 0.05);
        }
        // Text Phase (1 second = 60 frames)
        else {
            splashPhase = 'text';
            splashAlpha = 1; // Text is always fully visible during its phase
        }

        if (splashTimer <= 0) {
            splashActive = false;
            triggerTransition('borobudur', maps.borobudur.spawn.x, maps.borobudur.spawn.y);
        }
        return;
    }

    let moveX = 0;
    let moveY = 0;

    let canMove = true;
    if (currentMap === 'lake_toba') {
        if (boatPausedTimer > 0) {
            boatPausedTimer--;
            canMove = false;
        }
        if (isExhausted) {
            canMove = false;
        }
    }

    if (canMove) {
        if (currentMap === 'lake_toba') {
            const acc = 0.15;
            const friction = 0.985;
            const maxBoatSpeed = 8;

            if (keys['w']) boatVY -= acc;
            if (keys['s']) boatVY += acc;
            if (keys['a']) boatVX -= acc;
            if (keys['d']) boatVX += acc;

            boatVX *= friction;
            boatVY *= friction;

            // Cap speed
            const speed = Math.sqrt(boatVX * boatVX + boatVY * boatVY);
            if (speed > maxBoatSpeed) {
                boatVX = (boatVX / speed) * maxBoatSpeed;
                boatVY = (boatVY / speed) * maxBoatSpeed;
            }

            if (Math.abs(boatVX) < 0.01) boatVX = 0;
            if (Math.abs(boatVY) < 0.01) boatVY = 0;

            moveX = boatVX;
            moveY = boatVY;

            if (moveY < -0.5) playerFacing = 'up';
            else if (moveY > 0.5) playerFacing = 'down';
            else if (moveX < -0.5) playerFacing = 'left';
            else if (moveX > 0.5) playerFacing = 'right';

        } else {
            if (keys['w']) { moveY -= SPEED; playerFacing = 'up'; }
            if (keys['s']) { moveY += SPEED; playerFacing = 'down'; }
            if (keys['a']) { moveX -= SPEED; playerFacing = 'left'; }
            if (keys['d']) { moveX += SPEED; playerFacing = 'right'; }
        }
    }

    // Stamina Logic for Lake Toba
    if (currentMap === 'lake_toba') {
        const isMoving = moveX !== 0 || moveY !== 0;
        const rechargeRate = 0.2;
        const exhaustedRechargeRate = rechargeRate * 1.5;

        if (isMoving) {
            stamina = Math.max(0, stamina - 0.5);
            if (stamina === 0) isExhausted = true;
        } else {
            const currentRecharge = isExhausted ? exhaustedRechargeRate : rechargeRate;
            stamina = Math.min(100, stamina + currentRecharge);
            if (stamina === 100) isExhausted = false;
        }

        // Update Stamina UI
        const fill = document.getElementById('stamina-fill');
        fill.style.height = stamina + '%';
        fill.style.background = isExhausted ? '#f44336' : (stamina < 30 ? '#ff9800' : '#4caf50');

        // Lake Waves Logic
        // Lake Waves Logic: Spawn around the player in the massive lake
        if (Math.random() < 0.04) {
            lakeWaves.push({
                x: playerX + (Math.random() - 0.5) * 800,
                y: playerY + (Math.random() - 0.5) * 800,
                radius: 5,
                maxRadius: 60 + Math.random() * 40,
                life: 90
            });
        }

        lakeWaves.forEach(w => {
            w.radius += 1;
            w.life--;

            // Collision with boat
            const dx = (playerX + PLAYER_SIZE / 2) - w.x;
            const dy = (playerY + PLAYER_SIZE / 2) - w.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < w.radius + 15 && w.life > 20) {
                if (boatPausedTimer === 0) {
                    boatPausedTimer = 60; // 1 second pause
                    stamina = Math.max(0, stamina - 20);
                    // Impact kills momentum
                    boatVX *= 0.2;
                    boatVY *= 0.2;
                }
            }
        });
        lakeWaves = lakeWaves.filter(w => w.life > 0);
    }

    const activeMap = maps[currentMap];
    const mapSize = activeMap.size || MAP_SIZE;

    // Check X movement
    let nextX = Math.max(0, Math.min(playerX + moveX, mapSize - PLAYER_SIZE));
    let collisionX = false;

    if (activeMap.checkCollision) {
        collisionX = activeMap.checkCollision(nextX, playerY);
    } else if (activeMap.collisions) {
        activeMap.collisions.forEach(rect => {
            if (nextX < rect.x + rect.w && nextX + PLAYER_SIZE > rect.x &&
                playerY < rect.y + rect.h && playerY + PLAYER_SIZE > rect.y) collisionX = true;
        });
    }

    if (!collisionX) playerX = nextX;

    // Check Y movement
    let nextY = Math.max(0, Math.min(playerY + moveY, mapSize - PLAYER_SIZE));
    let collisionY = false;

    if (activeMap.checkCollision) {
        collisionY = activeMap.checkCollision(playerX, nextY);
    } else if (activeMap.collisions) {
        activeMap.collisions.forEach(rect => {
            if (playerX < rect.x + rect.w && playerX + PLAYER_SIZE > rect.x &&
                nextY < rect.y + rect.h && nextY + PLAYER_SIZE > rect.y) collisionY = true;
        });
    }

    if (!collisionY) playerY = nextY;

    if (currentMap === 'aircraft') {
        const exit = maps.aircraft.exitRect;
        if (playerX < exit.x + exit.w && playerX + PLAYER_SIZE > exit.x &&
            playerY < exit.y + exit.h && playerY + PLAYER_SIZE > exit.y) {
            triggerTransition('airport', maps.airport.spawn.x, maps.airport.spawn.y);
        }
    } else if (currentMap === 'airport') {
        const exit = maps.airport.exitRect;
        if (playerX < exit.x + exit.w && playerX + PLAYER_SIZE > exit.x &&
            playerY < exit.y + exit.h && playerY + PLAYER_SIZE > exit.y) {
            triggerTransition('destination', maps.destination.spawn.x, maps.destination.spawn.y);
        }
    }
}

function draw() {
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (transitionActive) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '32px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Three Days Later...', 300, 300);
        return;
    }

    if (isClimbing) {
        document.getElementById('interact-hint').style.display = 'none';
        drawClimbingMinigame();
        return;
    }

    if (isDroneActive) {
        drawDroneMinigame();
        return;
    }

    const activeMap = maps[currentMap];
    const mapSize = activeMap.size || MAP_SIZE;

    let camX = (VIEWPORT_WIDTH / 2) - playerX - (PLAYER_SIZE / 2);
    let camY = (VIEWPORT_HEIGHT / 2) - playerY - (PLAYER_SIZE / 2);
    camX = Math.min(0, Math.max(camX, VIEWPORT_WIDTH - mapSize));
    camY = Math.min(0, Math.max(camY, VIEWPORT_HEIGHT - mapSize));

    const activeImg = activeMap.img;
    ctx.drawImage(activeImg, camX, camY, mapSize, mapSize);

    // Draw Lake Waves
    if (currentMap === 'lake_toba') {
        lakeWaves.forEach(w => {
            const alpha = w.life / 60;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(camX + w.x, camY + w.y, w.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = `rgba(0, 210, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(camX + w.x, camY + w.y, w.radius - 5, 0, Math.PI * 2);
            ctx.stroke();
        });

        if (boatPausedTimer > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('WAVE IMPACT!', 300, 250);
        }
    }

    // Draw Exit Marker for Borobudur
    if (currentMap === 'borobudur') {
        const exit = maps.borobudur.exitRect;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(camX + exit.x + exit.w / 2, camY + exit.y + exit.h / 2, exit.w / 2, exit.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Collision Debug (F3 to toggle)
    if (debugMode) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        activeMap.collisions.forEach(rect => {
            ctx.fillRect(camX + rect.x, camY + rect.y, rect.w, rect.h);
        });
    }

    // Interaction Hint (O or SPACE icon)
    const hint = document.getElementById('interact-hint');
    let showingHint = false;
    if ((currentMap === 'destination' || currentMap === 'marketplace' || currentMap === 'borobudur') && !isDialogueOpen && !isShopOpen && !isClimbing && !splashActive) {
        // Shared logic for interactables and portal
        const interactables = maps[currentMap].interactables || [];
        interactables.forEach(obj => {
            const dx = (playerX + PLAYER_SIZE / 2) - (obj.x + obj.w / 2);
            const dy = (playerY + PLAYER_SIZE / 2) - (obj.y + obj.h / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            const triggerDist = obj.type === 'climb_trigger' ? 200 : (obj.type === 'souvenir_shop' ? 150 : 120);

            if (distance < triggerDist) {
                if (obj.type === 'climb_trigger' && !inventory.climbers_gear) return;

                hint.style.display = 'flex';
                hint.innerText = (obj.type === 'climb_trigger') ? 'SPACE' : ((obj.type === 'lore_shop') ? 'ENTER' : 'O');
                hint.style.width = (obj.type === 'climb_trigger') ? '60px' : ((obj.type === 'lore_shop') ? '60px' : '30px');
                hint.style.borderRadius = (obj.type === 'climb_trigger' || obj.type === 'lore_shop') ? '8px' : '50%';
                hint.style.position = 'absolute';
                hint.style.left = (camX + playerX + PLAYER_SIZE / 2 - ((obj.type === 'climb_trigger' || obj.type === 'lore_shop') ? 30 : 15)) + 'px';
                hint.style.top = (camY + playerY - 40) + 'px';
                showingHint = true;
            }
        });

        // Specific portal hint for Borobudur
        if (currentMap === 'borobudur') {
            const portal = maps.borobudur.exitRect;
            const dx = (playerX + PLAYER_SIZE / 2) - (portal.x + portal.w / 2);
            const dy = (playerY + PLAYER_SIZE / 2) - (portal.y + portal.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                hint.style.display = 'flex';
                hint.innerText = 'F';
                hint.style.width = '30px';
                hint.style.borderRadius = '50%';
                hint.style.position = 'absolute';
                hint.style.left = (camX + playerX + PLAYER_SIZE / 2 - 15) + 'px';
                hint.style.top = (camY + playerY - 40) + 'px';
                showingHint = true;
            }
        }

        // Specific portal hint for Marketplace
        if (currentMap === 'marketplace') {
            const portal = maps.marketplace.exitRect;
            const dx = (playerX + PLAYER_SIZE / 2) - (portal.x + portal.w / 2);
            const dy = (playerY + PLAYER_SIZE / 2) - (portal.y + portal.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                hint.style.display = 'flex';
                hint.innerText = 'F';
                hint.style.width = '30px';
                hint.style.borderRadius = '50%';
                hint.style.position = 'absolute';
                hint.style.left = (camX + playerX + PLAYER_SIZE / 2 - 15) + 'px';
                hint.style.top = (camY + playerY - 40) + 'px';
                showingHint = true;
            }
        }
    }
    if (!showingHint) hint.style.display = 'none';

    // Draw Player
    if (!isClimbing && !splashActive) {
        if (currentMap === 'lake_toba') {
            // Draw Boat
            let boatImg = boatDownImg;
            if (playerFacing === 'up') boatImg = boatUpImg;
            if (playerFacing === 'left') boatImg = boatLeftImg;
            if (playerFacing === 'right') boatImg = boatRightImg;

            // Adjust size to make it look boat-shaped (increased by factor of 3)
            const isHorizontal = playerFacing === 'left' || playerFacing === 'right';
            const bW = isHorizontal ? 192 : 96;
            const bH = isHorizontal ? 96 : 192;

            // Offset to keep the larger boat centered on the 32x32 logical hit box
            const offX = (PLAYER_SIZE - bW) / 2;
            const offY = (PLAYER_SIZE - bH) / 2;

            ctx.drawImage(boatImg, camX + playerX + offX, camY + playerY + offY, bW, bH);
        } else {
            ctx.fillStyle = '#00d2ff';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.fillRect(camX + playerX, camY + playerY, PLAYER_SIZE, PLAYER_SIZE);
            ctx.strokeRect(camX + playerX, camY + playerY, PLAYER_SIZE, PLAYER_SIZE);
        }

        // Draw Souvenir Hat
        if (inventory.sun_hat && currentMap !== 'lake_toba') {
            ctx.drawImage(strawHatImg, camX + playerX - 10, camY + playerY - 15, PLAYER_SIZE + 20, 25);
        }
    }

    // Draw Cutscene Overlay
    if (splashActive) {
        ctx.fillStyle = '#000';

        if (splashPhase === 'image') {
            ctx.save();
            ctx.globalAlpha = splashAlpha;
            ctx.drawImage(splashImg, -150, 0, 900, 600);
            ctx.restore();
        } else if (splashPhase === 'black' || splashPhase === 'text') {
            ctx.globalAlpha = splashAlpha;
            ctx.fillRect(0, 0, 600, 600);

            if (splashPhase === 'text') {
                ctx.fillStyle = '#fff';
                ctx.font = '32px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Three Days Later...', 300, 300);
            }
        }
    }
}

function drawClimbingMinigame() {
    // Draw the climbing map
    ctx.drawImage(climbImg, -150, 0, 900, 600);

    // Draw Player on rungs
    const pY = climbProgress >= RUNG_COUNT ? RUNG_Y_POSITIONS[RUNG_COUNT - 1] : RUNG_Y_POSITIONS[climbProgress];

    // Rope extending from TOP (shrinking as we go up)
    if (inventory.climbers_gear) {
        ctx.strokeStyle = '#e91e63'; // Signature Rope Color
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]); // Optional: make it look like a cable
        ctx.beginPath();
        ctx.moveTo(300, 0); // Center of 600
        ctx.lineTo(300, pY + 15);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
    }

    ctx.fillStyle = '#00d2ff';
    ctx.strokeStyle = '#fff';
    ctx.fillRect(285, pY, 30, 30);
    ctx.strokeRect(285, pY, 30, 30);

    // Draw Feedback
    if (feedbackTimer > 0) {
        ctx.fillStyle = lastHitResult === 'GREAT!' ? '#4CAF50' : '#f44336';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(lastHitResult, 300, 300);
    }

    // Draw Timing Bar
    const barX = 150;
    const barY = 550;
    const barW = 300;
    const barH = 25;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(barX, barY - 2, barW, barH + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(barX, barY - 2, barW, barH + 4);

    // Center Target Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4CAF50';
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(barX + barW * 0.4, barY, barW * 0.2, barH);
    ctx.shadowBlur = 0;

    // Moving Arrow (Sleeker design)
    const arrowX = barX + barW * timingArrowPos;
    ctx.fillStyle = '#fff';
    ctx.fillRect(arrowX - 2, barY - 5, 4, barH + 10);

    ctx.fillStyle = '#ffca28';
    ctx.beginPath();
    ctx.moveTo(arrowX, barY - 10);
    ctx.lineTo(arrowX - 8, barY - 22);
    ctx.lineTo(arrowX + 8, barY - 22);
    ctx.fill();

    // Instructions
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PRESS SPACE IN THE GREEN ZONE TO CLIMB THE PEAK', 300, 520);

    // Progress
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px Arial';
    ctx.fillText(`HEIGHT: ${climbProgress}/${RUNG_COUNT}`, 300, 500);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function updateDrone() {
    let moveX = 0;
    let moveY = 0;
    const droneSpeed = 4;

    if (keys['w']) moveY -= droneSpeed;
    if (keys['s']) moveY += droneSpeed;
    if (keys['a']) moveX -= droneSpeed;
    if (keys['d']) moveX += droneSpeed;

    if (moveX !== 0 || moveY !== 0) {
        droneHeat += 0.5;
        droneX = Math.max(20, Math.min(780, droneX + moveX));
        droneY = Math.max(20, Math.min(780, droneY + moveY));
    } else {
        droneHeat = Math.max(0, droneHeat - 0.2);
    }

    if (droneHeat >= 100) {
        droneHeat = 100;
        droneDead = true;
        showDialogue("The drone's circuits melted from the extreme volcanic heat! (Press Space or Y to retry)");
    }

    document.getElementById('heat-fill').style.height = droneHeat + '%';

    // Aggressive Completion Check (Stick to true once hit)
    const completedCount = LAVA_TARGETS.filter(t => t.completed).length;
    if (completedCount >= 4) {
        if (!researchComplete) {
            researchComplete = true;
            updateObjective();
            showDialogue("SCANS COMPLETE! Return to your character at the bottom to board the boat (Press Space/O to close).");
        }
    }

    if (droneDead) return;

    if (dodgeMode) {
        dodgeTimer--;

        // Spawn flurry of acidic blue projectiles (Reduced frequency)
        if (dodgeTimer % 15 === 0) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            droneProjectiles.push({
                x: currentPhotoTarget.x,
                y: currentPhotoTarget.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5 + Math.random() * 10
            });
        }

        // Random explosions (Shockwaves) - Reduced frequency and now coming from red research zones
        if (dodgeTimer % 100 === 0) {
            droneExplosions.push({
                x: currentPhotoTarget.x,
                y: currentPhotoTarget.y,
                radius: 10,
                maxRadius: 60 + Math.random() * 40,
                life: 60
            });
        }

        // Update Projectiles
        droneProjectiles.forEach(p => {
            const dx = droneX - p.x;
            const dy = droneY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Frost Aura Freeze Logic (Requires Melon + Katana)
            if (inventory.melon && inventory.sword && dist < 40 && !p.frozen) {
                p.frozen = true;
                p.freezeTimer = 240; // 4 seconds
                iceStatusTimer = 240;
            }

            if (p.frozen) {
                p.freezeTimer--;
                if (p.freezeTimer <= 0) p.frozen = false;
            } else {
                p.x += p.vx;
                p.y += p.vy;
            }

            // Collision with drone
            if (dist < p.size + 5) {
                droneDead = true;
                showDialogue("Acidic Explosion Destroyed the Drone! Retry? (Press Space or Y)");
            }
        });
        droneProjectiles = droneProjectiles.filter(p => p.x > 0 && p.x < 800 && p.y > 0 && p.y < 800);

        // Update Explosions
        droneExplosions.forEach(exp => {
            const dx = droneX - exp.x;
            const dy = droneY - exp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Frost Aura Freeze for Explosions
            if (inventory.melon && inventory.sword && dist < 40 && !exp.frozen) {
                exp.frozen = true;
                exp.freezeTimer = 240;
                iceStatusTimer = 240;
            }

            if (exp.frozen) {
                exp.freezeTimer--;
                if (exp.freezeTimer <= 0) exp.frozen = false;
            } else {
                exp.radius += 2;
                exp.life--;
            }

            // Explosion collision
            if (dist < exp.radius && exp.life > 30) {
                droneDead = true;
                showDialogue("The Nuclear Blue Fire Consumed You! Retry? (Press Space or Y)");
            }
        });
        droneExplosions = droneExplosions.filter(exp => exp.life > 0);

        // Handle Ice Status UI
        const iceUI = document.getElementById('ice-status');
        if (iceStatusTimer > 0) {
            iceStatusTimer--;
            iceUI.style.display = 'block';
        } else {
            iceUI.style.display = 'none';
        }

        if (dodgeTimer <= 0) {
            dodgeMode = false;
            currentPhotoTarget.scanned = true; // Mark as scanned so red indicator disappears
            currentPhotoIndex = 0;
            // No longer automatically starting photoMode
        }
    }

    // Check for lava targets proximity
    let nearTarget = false;
    LAVA_TARGETS.forEach(target => {
        if (target.completed) return;
        const dx = droneX - target.x;
        const dy = droneY - target.y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
            nearTarget = true;
        }
    });

    if (!nearTarget && photoMode) {
        photoMode = false;
        document.getElementById('photo-prompt').style.display = 'none';
    }
}

function drawDroneMinigame() {
    // Hide interaction hint from other maps/states
    document.getElementById('interact-hint').style.display = 'none';

    // Draw Kawah Ijen
    ctx.drawImage(kawahImg, 0, 0, 600, 600);

    // Draw Player standing still on platform
    ctx.fillStyle = '#00d2ff';
    ctx.strokeStyle = '#fff';
    ctx.fillRect(285, 540, PLAYER_SIZE, PLAYER_SIZE);
    ctx.strokeRect(285, 540, PLAYER_SIZE, PLAYER_SIZE);
    if (inventory.sun_hat) {
        ctx.drawImage(strawHatImg, 285 - 10, 540 - 15, PLAYER_SIZE + 20, 25);
    }

    // Draw Lava Target Markers
    LAVA_TARGETS.forEach(target => {
        if (target.completed) return;

        // Adjust for 800->600 scale
        const tx = target.x * 600 / 800;
        const ty = target.y * 600 / 800;

        if (!target.scanned) {
            // RED: Ready for Scan
            ctx.strokeStyle = '#f44336';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(tx, ty, 20, 0, Math.PI * 2);
            ctx.stroke();

            // Pulsing glow
            ctx.shadowBlur = 10 + Math.sin(Date.now() / 200) * 5;
            ctx.shadowColor = '#f44336';
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // GREEN: Scanned, Ready for Photo/Type
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(tx, ty, 22, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 15;
            ctx.shadowColor = '#4CAF50';
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Helpful prompt
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText("READY FOR PHOTO", tx, ty + 40);
        }

        // Draw Sequence symbols above target
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const symbols = { 'arrowup': '↑', 'arrowdown': '↓', 'arrowleft': '←', 'arrowright': '→' };
        const seqText = target.sequence.map(s => symbols[s]).join(' ');
        ctx.fillText(seqText, tx, ty - 30);
    });

    // Draw Projectiles
    droneProjectiles.forEach(p => {
        ctx.fillStyle = p.frozen ? '#e1f5fe' : '#00d2ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.frozen ? '#00d2ff' : '#00d2ff';
        ctx.beginPath();
        ctx.arc(p.x * 600 / 800, p.y * 600 / 800, p.size * 600 / 800, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.frozen) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    // Draw Explosions
    droneExplosions.forEach(exp => {
        const alpha = exp.life / 60;
        const color = exp.frozen ? `rgba(179, 229, 252, ${alpha * 0.7})` : `rgba(0, 210, 255, ${alpha * 0.5})`;
        ctx.fillStyle = color;
        ctx.strokeStyle = exp.frozen ? `rgba(255, 255, 255, ${alpha})` : `rgba(130, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(exp.x * 600 / 800, exp.y * 600 / 800, exp.radius * 600 / 800, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });

    if (dodgeMode) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EVADE THE NUCLEAR BLUE LAVA!', 300, 100);
        ctx.font = '16px Arial';
        ctx.fillText(`CAPTURING SCAN... ${Math.ceil(dodgeTimer / 60)}s`, 300, 130);
    }

    // Draw Drone (Camera viewport 600, map is 800)
    const dx = droneX * 600 / 800;
    const dy = droneY * 600 / 800;

    ctx.fillStyle = droneDead ? '#555' : '#eee';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.rect(dx - 10, dy - 10, 20, 20);
    ctx.fill();
    ctx.stroke();
    // Propellers
    const angle = Date.now() / 50;
    ctx.beginPath();
    ctx.moveTo(dx - 15 * Math.cos(angle), dy - 15 * Math.sin(angle));
    ctx.lineTo(dx + 15 * Math.cos(angle), dy + 15 * Math.sin(angle));
    ctx.stroke();

    // Research Completion UI
    if (researchComplete) {
        // Pilot is at roughly 400, 740 in drone coords
        const dx_pilot = 400;
        const dy_pilot = 740;
        const distToPlayer = Math.sqrt(Math.pow(droneX - dx_pilot, 2) + Math.pow(droneY - dy_pilot, 2));
        const nearPlayer = distToPlayer < 120; // Extra lenient

        // Visual Indicator over the pilot (viewport coords)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = nearPlayer ? '#00ff00' : '#ffff00';
        ctx.fillText(nearPlayer ? "CLEARED! PRESS F TO BOARD" : "RETURN TO PILOT AT BOTTOM", 300, 480);
        ctx.shadowBlur = 0;

        // Draw a pulse circle around the landing zone
        ctx.strokeStyle = nearPlayer ? '#00ff00' : '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dx_pilot * 600 / 800, dy_pilot * 600 / 800, (30 + Math.sin(Date.now() / 200) * 10), 0, Math.PI * 2);
        ctx.stroke();

        if (nearPlayer) {
            // Giant pastel blue button at top right
            const btnX = 420;
            const btnY = 30;
            const btnW = 150;
            const btnH = 60;

            ctx.fillStyle = 'rgba(179, 229, 252, 0.9)'; // Pastel Blue
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 10);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#01579b'; // Dark blue text
            ctx.font = 'bold 28px Arial';
            ctx.fillText("F", btnX + btnW / 2, btnY + 42);

            ctx.font = 'bold 12px Arial';
            ctx.fillText("BOARD BOAT", btnX + btnW / 2, btnY + 16);
        }
    }
}

const images = [mapImg, airportImg, destinationImg, ropeImg, climbImg, splashImg, borobudurImg, marketplaceImg, strawHatImg, melonImg, kawahImg, lakeTobaImg, swordImg, boatRightImg, boatDownImg, boatUpImg, boatLeftImg];
let loadedCount = 0;
images.forEach(img => {
    img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) {
            updateObjective();
            gameLoop();
        }
    };
    // If image is already cached/loaded
    if (img.complete) img.onload();
});
