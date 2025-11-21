// ----------------------------------------------------
// ⚙️ GAME CONFIGURATION DATA (EASY TO EDIT) 
// ----------------------------------------------------
const GAME_DATA = {
    // Media for the Gallery Modal
    galleryImages: [
        './assets/images/zaky.jpg',
        './assets/images/zaky.jpg',
        './assets/images/zaky.jpg',
        './assets/images/zaky.jpg',
    ],
    // Data for the Alphabet Modal
    alphabetData: {
        A:['Aquarium Date','Arcade Date'], B:['Bowling','Beach'], C:['Coffee Date','Camping'],
        D:['Dinner Date','Drawing (Draw each other)'], E:['Escape Room','Evening stroll'], F:['Fireworks','Fun challenge'],
        G:['Go Shopping','Game Night'], H:['Hot Air Balloon','Hiking'], I:['Ice Skating','Ice Cream'],
        J:['Japanese dining','Jacuzzi'], K:['Karaoke','KFC'], L:['Live Concert','Lunch Date'],
        M:['Movie Marathon','Magic Show'], N:['Night Market','Netflix'], O:['Obstacle course','Online games'],
        P:['Pool Party','Photo Shoot'], Q:['Quiz Date','Quality time'], R:['Ramen Date','Roadtrip'],
        S:['Stargazing','Surprise'], T:['Travel Planning','Trampoline'], U:['Unwind','Ukulele Lesson'],
        V:['Vacation','Video Timelapse'], W:['Waterpark','Wedding'], X:['Xmas Party','X Marks the Spot'],
        Y:['Yes Challenge','Yogurt Date'], Z:['Zoo','Zip-line Adventure']
    },
    // Platform locations (bottom is height from ground, width is optional)
    platforms: [
        { left: 1200, bottom: 200, width: 200 },
        { left: 1500, bottom: 250, width: 300 },
        { left: 2800, bottom: 300, width: 200 },
        { left: 4500, bottom: 200, width: 400 },
    ],
    // Memory Spots (Memory spots should align with or float above a platform/ground)
    memorySpots: [
        { 
            left: 800, 
            bottom: 180, 
            type: 'photo', 
            text: 'We virtually met here in this app ❤️',
            description: `I remember when we first met, it was me who made the first move. <br /> <br />
            although it was all thanks to a common friend, it was all you that I fell inlove to <br /> <br /> 

            you even thought you were set up with someone who was married, luckily i was not haha <br /> <br />
            <img src="./assets/images/first_move.jpeg" alt="first move">` 
            ,  photo: './assets/images/zaky.jpg' },
        { left: 1650, bottom: 330, type: 'audio', text: 'Sinta - makkunii',description: 'At some point I found myself writing a song about you', audio: './assets/audio/sinta_makkunii.mp3' },
        { left: 3500, bottom: 180, type: 'alphabet', text: 'Our alphabet dating list', description: 'Remember when we made this list?' },
        { left: 4700, bottom: 280, type: 'gallery', text: 'Our first meetup gallery', description: 'Keeping this love in a photograph' },
        { left: 6500, bottom: 200, type: 'text', text: 'With you is like an adventure. Looking forward to more memories.' , description: 'No words needed, just looking forward.'},
    ]
};
// ----------------------------------------------------

function isCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + b.height > b.y
  );
}


// --- CONSTANTS & Utility ---
const groundHeight = 120; // Must match CSS #ground height
const gameWidth = 8000;
const playerWidth = 46;
const gravity = 1.2, jumpStrength = 22, acceleration = 1, maxSpeed = 8;
const WALK_CYCLE_INTERVAL = 150; // Milliseconds per frame swap
// 👇 ADJUSTED FOR RELIABLE PLATFORM LANDING 👇
const COLLISION_TOLERANCE_Y = 5; // Increased buffer for physics stability

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// 🏃‍♀️ SPRITE DEFINITIONS
const IDLE_SPRITE = './assets/images/mjay.png'; 
const WALK_SPRITE_1 = './assets/images/mjay_walking_side_view.png'; 
const WALK_SPRITE_2 = './assets/images/mjay_standing_side_view.png'; 

// --- DOM Element Cache ---
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const mjayPixel = document.getElementById('mjay-pixel');
const distantMountains = document.getElementById('distant-mountains');
const closeClouds = document.getElementById('close-clouds');
const endingModal = document.getElementById('ending-modal');
const closeEndingBtn = document.getElementById('close-ending');

// Modals
const memModal = document.getElementById('memory-modal'), memImg = document.getElementById('memory-img'), memText = document.getElementById('memory-text'), memTitle = document.getElementById('memory-title'), audioPlayerContainer = document.getElementById('audio-player-container'), closeMem = document.getElementById('close-memory'), audioEl = document.getElementById('memory-audio');
const alphaModal = document.getElementById('alphabet-modal'), alphaList = document.getElementById('alphabet-list'), closeAlpha = document.getElementById('close-alpha');
const galleryModal = document.getElementById('gallery-modal'), closeGallery = document.getElementById('close-gallery');
const polaroidCollageContainer = document.getElementById('polaroid-collage-container');

// Audio Controls
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const playerTime = document.getElementById('player-time');

// Mobile Controls
const joystickContainer = document.getElementById('joystick-container');
const joystickThumb = document.getElementById('joystick-thumb');
const jumpBtn = document.getElementById('jump-btn');
const starField = document.getElementById('star-field');
const numberOfStars = 100; // Use this constant

// --- Game State Variables ---
let px = 750, py = groundHeight, vx = 0, vy = 0; // Start player at left: 750px
let isJumping = false, isModalOpen = false;
let canTriggerMemory = true;
let endingTriggered = false;
let walkFrame = 0;
let lastWalkTime = 0;
const keys = {};
let previousTimestamp = 0;
let joystickActive = false;
let audioInterval;

// Global platforms array will be populated in initializeWorldElements
let platforms = [];


// ----------------------------------------------------
// --- LOADING & STARTUP LOGIC ---
// ----------------------------------------------------

/**
 * Initializes world elements, renders non-dynamic content, and starts the game loop.
 * This is called ONLY after all assets are loaded.
 */
function startGame() {
    // 1. Build the World Elements and get platform boundaries
    platforms = initializeWorldElements(); 

    // 2. Render Static UI (like the Alphabet list)
    renderAlphabet(); 

    // 3. Create Background Effects
    createTwinklingStars();
    
    // 4. Hide loading screen after a short delay for smooth transition
    setTimeout(() => {
        if (loadingScreen) {
             // Fade out the loading screen
             loadingScreen.style.opacity = '0';
             loadingScreen.addEventListener('transitionend', () => {
                 loadingScreen.style.display = 'none';
             }, { once: true });
        }
        
        // 5. Start the main game loop and input handler
        requestAnimationFrame(updateGame);
        handleMovementInput(); 

    }, 500); 
}


/**
 * Preloads all images (including gallery and memory spot photos).
 */
function preloadAllAssets() {
    // 1. Collect all image URLs
    let imageSources = [
        IDLE_SPRITE,
        WALK_SPRITE_1,
        WALK_SPRITE_2,
        './assets/images/makkunii.png', // The end goal image
        ...GAME_DATA.galleryImages 
    ];

    // Collect all unique photo URLs from memory spots 
    GAME_DATA.memorySpots.forEach(spot => {
        if (spot.photo) {
            imageSources.push(spot.photo);
        }
        // Extract image src from description HTML (for first_move.jpeg)
        const match = /<img src=["'](.*?)["']/.exec(spot.description);
        if (match && match[1]) {
            imageSources.push(match[1]);
        }
        // Optional: Preload audio files too if desired, just push spot.audio
        if (spot.audio) {
            // Note: Preloading audio is done via <link rel="preload"> in HTML or XHR,
            // but for simplicity, we focus on images here.
        }
    });

    // Filter for unique URLs
    imageSources = Array.from(new Set(imageSources.filter(src => src && typeof src === 'string')));

    let loadedCount = 0;
    const totalCount = imageSources.length;
    
    if (totalCount === 0) {
        startGame();
        return;
    }

    imageSources.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loadedCount++;
            // Update the loading bar
            if (loadingBar) {
                const progress = (loadedCount / totalCount) * 100;
                loadingBar.style.width = `${progress}%`;
            }

            if (loadedCount === totalCount) {
                startGame(); // CRITICAL: Calls startGame only when loading is done
            }
        };
        img.src = src;
    });
}
// ----------------------------------------------------


// --- WORLD SETUP FUNCTIONS ---

// Function to generate the platforms and append to the game world
function initializeWorldElements() {
    const platformBoundingBoxes = [];

    // 2. Add Platforms
    GAME_DATA.platforms.forEach((p, index) => {
        const platformEl = document.createElement('div');
        platformEl.className = 'platform';
        platformEl.style.left = `${p.left}px`;
        platformEl.style.bottom = `${p.bottom}px`;
        if (p.width) {
            platformEl.style.width = `${p.width}px`;
        }
        platformEl.setAttribute('data-platform-id', `p${index + 1}`);
        gameContainer.appendChild(platformEl);

        // Cache platform bounding box data for efficient physics checks
        platformBoundingBoxes.push({
            el: platformEl, 
            left: p.left, 
            bottom: p.bottom, 
            width: p.width || 200, 
            height: 20 // Assuming a standard platform height
        });
    });

    // 3. Add Memory Spots
    GAME_DATA.memorySpots.forEach((m, index) => {
        const spotEl = document.createElement('div');
        spotEl.className = 'memory-spot';
        spotEl.style.left = `${m.left}px`;
        spotEl.style.bottom = `${m.bottom}px`;
        // Store all data directly on the element for easy lookup later
        spotEl.dataset.type = m.type;
        spotEl.dataset.text = m.text;
        spotEl.dataset.photo = m.photo || '';
        spotEl.dataset.audio = m.audio || '';
        spotEl.dataset.spotIndex = index; // Store index to quickly reference GAME_DATA
        
        // Attach click listener for accessibility/direct click
        spotEl.addEventListener('click', () => {
            if (!isModalOpen) openMemorySpot(spotEl);
        });

        gameContainer.appendChild(spotEl);
    });

    return platformBoundingBoxes;
}

function createTwinklingStars() {
    const fragment = document.createDocumentFragment(); 
    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star'; 
        
        star.style.left = `${Math.random() * gameWidth}px`;
        star.style.top = `${Math.random() * (window.innerHeight * 0.7)}px`;
        
        // Using inline styles for star appearance as original code did
        const size = Math.random() > 0.9 ? '2px' : '1px';
        star.style.width = size;
        star.style.height = size;
        star.style.background = '#fff';
        star.style.boxShadow = `0 0 2px 0 #fff`;
        star.style.position = 'absolute';
        star.style.animation = `twinkle 1s ease-in-out ${Math.random() * 0.5 + 0.5}s infinite alternate`;
        star.style.animationDelay = `${Math.random() * 5}s`;

        fragment.appendChild(star);
    }
    starField.appendChild(fragment); 
}


// --- Player Animation ---

function updateWalkAnimation(timestamp) {
    const isMoving = Math.abs(vx) > 0.5 && !isModalOpen && !isJumping;

    if (isMoving) {
        player.classList.add('is-walking');

        // Sprite Flip
        player.style.transform = `scaleX(${vx < 0 ? -1 : 1})`;
        
        // Sprite Swapping Logic
        if (timestamp - lastWalkTime > WALK_CYCLE_INTERVAL) {
            walkFrame = 1 - walkFrame; 
            lastWalkTime = timestamp;
            mjayPixel.src = walkFrame === 0 ? WALK_SPRITE_1 : WALK_SPRITE_2;
        }

    } else {
        // Player is idle
        player.classList.remove('is-walking');
        if (!isJumping) mjayPixel.src = IDLE_SPRITE;
        walkFrame = 0;
    }
    
    // Check for jumping and add/remove class
    if (isJumping) {
        player.classList.add('is-jumping');
    } else {
        player.classList.remove('is-jumping');
    }
}


// --- Game Loop (Physics & Rendering) ---

function updateGame(timestamp) {
    const deltaTime = timestamp - previousTimestamp; 
    previousTimestamp = timestamp;

    // --- Input & Movement ---
    if (!isModalOpen) {
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            vx = clamp(vx + acceleration * (deltaTime / 16.67), -maxSpeed, maxSpeed);
        } else if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            vx = clamp(vx - acceleration * (deltaTime / 16.67), -maxSpeed, maxSpeed);
        }
    }

    // --- Physics ---
    vx *= 0.85; 
    px += vx;
    px = clamp(px, 20, gameWidth - playerWidth - 10);

    vy -= gravity;
    py += vy;


    // --- Collision Detection (FIXED LOGIC) ---
    let restingY = groundHeight;
    let onPlatform = false;

    // 1. Check Platforms
    platforms.forEach(p => {
        const platformTopY = p.bottom + p.height;
        const isOverlapX = px < (p.left + p.width) && (px + playerWidth) > p.left;
        
        // Check for collision when falling or stopped AND player's feet are near/at platform top
        if (isOverlapX && py <= platformTopY + COLLISION_TOLERANCE_Y && py >= p.bottom && vy <= 0) {
            // Snap the player to the top of the platform
            restingY = platformTopY;
            onPlatform = true;
        }
    });

    // 2. Check Ground
    if (!onPlatform && py <= groundHeight) { // Check against the fixed ground height
        restingY = groundHeight;
        onPlatform = true;
    }
    
    // Apply snapping and zero out vertical velocity if a collision was detected
    if (onPlatform) { 
        vy = 0;
        py = restingY;
    }
    // Safety clamp (prevents going below ground/platform if physics glitch)
    py = clamp(py, restingY, 1000); 

    isJumping = !onPlatform && py > groundHeight;

    // --- Rendering ---
    player.style.left = `${px}px`; 
    player.style.bottom = `${py}px`;

    // Parallax & Camera
    const scrollOffset = px - (window.innerWidth / 2) + (playerWidth / 2);
    window.scrollTo({ left: scrollOffset, behavior: 'auto' });
    distantMountains.style.backgroundPositionX = `${-scrollOffset * 0.1}px`;
    closeClouds.style.backgroundPositionX = `${-scrollOffset * 0.3}px`;

    // --- Auxiliary Updates ---
    updateWalkAnimation(timestamp); 
    checkMemoryTriggers();
    checkEndingTrigger();

    requestAnimationFrame(updateGame);
}


// 💖 ENDING TRIGGER FUNCTION

function checkEndingTrigger() {
 if (px > 7800 && !endingTriggered && !isModalOpen) {
  openEndingModal();
 }
}

function openEndingModal() {
 isModalOpen = true;
 endingTriggered = true;
 vx = 0;
  gameContainer.classList.add('blurred');
 endingModal.classList.add('show');
  closeEndingBtn.focus();
}

// --- Controls (Keyboard) ---

document.addEventListener('keydown', e => {
    if (isModalOpen) {
        if (e.key === 'Escape' || e.key === 'Enter') closeAllModals();
        return;
    }
    
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key.startsWith('Arrow') || ['w', 'a', 'd'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
    
    if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && vy === 0) {
        vy = jumpStrength;
    }
});

document.addEventListener('keyup', e => { keys[e.key] = false; });

function handleMovementInput(){
    // Movement input handled within updateGame using keys map.
    // This function can be simplified or removed, but keeping it to handle the acceleration decay
    if(!isModalOpen){
        // Acceleration logic is in updateGame for smoother, deltaTime-based movement
    }
}


// --- Interaction & Modals ---

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function updateTimeDisplay() {
    if (audioEl.readyState >= 2) {
        const current = formatTime(audioEl.currentTime);
        const duration = formatTime(audioEl.duration);
        playerTime.textContent = `${current} / ${duration}`;
    } else {
        playerTime.textContent = 'Loading...';
    }
}

function startAudioTimer() {
    updateTimeDisplay();
    audioInterval = setInterval(() => {
        updateTimeDisplay();
        if (audioEl.ended) stopAudio();
    }, 1000);
}

function stopAudioTimer() {
    clearInterval(audioInterval);
}

function playAudio() {
    audioEl.play().then(() => {
        playBtn.textContent = '⏸ Pause';
        stopAudioTimer();
        startAudioTimer();
    }).catch(e => {
        console.error("Audio playback failed:", e);
        playBtn.textContent = 'Error';
    });
}

function pauseAudio() {
    audioEl.pause();
    playBtn.textContent = '▶ Play';
    stopAudioTimer();
}

function stopAudio() {
    audioEl.pause();
    audioEl.currentTime = 0;
    playBtn.textContent = '▶ Play';
    stopAudioTimer();
    updateTimeDisplay();
}

playBtn.addEventListener('click', () => {
    if (audioEl.paused || audioEl.ended) {
        playAudio();
    } else {
        pauseAudio();
    }
});

stopBtn.addEventListener('click', stopAudio);


function renderAlphabet() { 
    alphaList.innerHTML = ''; 
    Object.entries(GAME_DATA.alphabetData).forEach(([letter, items]) => {
        const wrapper = document.createElement('div'); wrapper.className = 'alpha-letter';
        const h = document.createElement('h4'); h.textContent = letter;
        const ul = document.createElement('ul');
        items.forEach(item => { 
            const li = document.createElement('li'); li.textContent = item; ul.appendChild(li); 
        });
        wrapper.appendChild(h); wrapper.appendChild(ul); alphaList.appendChild(wrapper);
    });
}

function checkMemoryTriggers(){
    document.querySelectorAll('.memory-spot').forEach(spot => {
        const sx = parseInt(spot.style.left);
        const sy = parseInt(spot.style.bottom);
        const isNear = Math.abs(px - sx) < 60 && Math.abs(py - (sy - 10)) < 50;

        // Visual feedback
        if (isNear) {
            spot.style.boxShadow = '0 0 25px var(--electric-cyan), 0 0 50px var(--neon-pink)';
        } else {
            spot.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px var(--neon-pink)';
        }

        // Trigger logic
        if (isNear && canTriggerMemory && !isModalOpen) {
            openMemorySpot(spot);
        }
    });
}

function openMemorySpot(spot) {
    if (isModalOpen) return;

    isModalOpen = true;
    canTriggerMemory = false;
    vx = 0; 

    const type = spot.dataset.type;
    const dataIndex = parseInt(spot.dataset.spotIndex);
    const spotData = GAME_DATA.memorySpots[dataIndex];
    
    // Initial UX Feedback
    gameContainer.classList.add('blurred');
    const originalStyle = spot.style.cssText;
    spot.style.boxShadow = '0 0 50px #fff, 0 0 100px var(--neon-pink)';
    spot.style.opacity = '0';
    setTimeout(() => {
        spot.style.opacity = '1';
        spot.style.cssText = originalStyle; 
    }, 1000);


    let modalToOpen, closeBtn;

    switch (type) {
        case 'photo':
        case 'text':
        case 'audio':
            modalToOpen = memModal;
            closeBtn = closeMem;
            
            memTitle.textContent = spotData.text; 
            memText.innerHTML = spotData.description; 
            const descEl = modalToOpen.querySelector('.modal-description');
            if (descEl) descEl.textContent = ''; 

            memImg.style.display = 'none';
            audioPlayerContainer.style.display = 'none';
            stopAudio();

            if (type === 'photo') {
                memImg.src = spotData.photo || '';
                memImg.style.display = spotData.photo ? 'block' : 'none';
            } else if (type === 'audio') {
                audioEl.src = spotData.audio || '';
                audioPlayerContainer.style.display = spotData.audio ? 'block' : 'none';
                audioEl.load(); audioEl.onloadedmetadata = updateTimeDisplay;
                playerTime.textContent = 'Loading...'; 
                playBtn.textContent = '▶ Play';
            }
            break;

        case 'alphabet':
            modalToOpen = alphaModal;
            closeBtn = closeAlpha;
            const alphaDescEl = alphaModal.querySelector('.modal-description');
            if (alphaDescEl) alphaDescEl.innerHTML = spotData.description;
            break;

        case 'gallery':
            modalToOpen = galleryModal;
            closeBtn = closeGallery;
            const galleryDescEl = galleryModal.querySelector('.modal-description');
            if (galleryDescEl) galleryDescEl.innerHTML = spotData.description;
            renderGallery();
            break;
    }

    if (modalToOpen) {
        modalToOpen.classList.add('show');
        closeBtn.focus();
    }
}

function renderGallery() {
    polaroidCollageContainer.innerHTML = '';
    GAME_DATA.galleryImages.forEach((imageUrl, index) => {
        const polaroidDiv = document.createElement('div');
        polaroidDiv.className = 'polaroid-image';
        const rotation = Math.random() * 10 - 5;
        polaroidDiv.style.setProperty('--rotation', `${rotation}deg`);

        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.alt = `Memory ${index + 1}`;

        const captionElement = document.createElement('div');
        captionElement.className = 'caption';
        captionElement.textContent = `Moment ${index + 1}`;

        polaroidDiv.appendChild(imgElement);
        polaroidDiv.appendChild(captionElement);
        polaroidCollageContainer.appendChild(polaroidDiv);
    });
}


function closeAllModals() {
    memModal.classList.remove('show');
    alphaModal.classList.remove('show');
    galleryModal.classList.remove('show');
    endingModal.classList.remove('show');
    isModalOpen = false;
    stopAudio();

    gameContainer.classList.remove('blurred');

    vx = 0;
    setTimeout(() => { canTriggerMemory = true; }, 500);
}

closeMem.onclick = closeAllModals;
closeAlpha.onclick = closeAllModals;
closeGallery.onclick = closeAllModals;
closeEndingBtn.onclick = closeAllModals;


// --- Mobile Joystick ---

joystickContainer.addEventListener('touchstart', e => {
    if (isModalOpen) return;
    e.preventDefault();
    joystickActive = true;
    joystickContainer.classList.add('active');
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    joystickThumb.style.left = `${x}px`;
    joystickThumb.style.top = `${y}px`;
}, { passive: false });

joystickContainer.addEventListener('touchmove', e => {
    if (!joystickActive || isModalOpen) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    let x = touch.clientX - rect.left;
    let y = touch.clientY - rect.top;
    const maxDist = 40;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
        x = centerX + (dx / dist) * maxDist;
        y = centerY + (dy / dist) * maxDist;
    }

    joystickThumb.style.left = `${x}px`;
    joystickThumb.style.top = `${y}px`;

    const moveX = x - centerX;
    vx = clamp(moveX / 5, -maxSpeed, maxSpeed);

}, { passive: false });

joystickContainer.addEventListener('touchend', () => {
    if (!joystickActive) return;
    joystickActive = false;
    joystickContainer.classList.remove('active');
    joystickThumb.style.left = '50%';
    joystickThumb.style.top = '50%';
});

// Jump button
jumpBtn.addEventListener('touchstart', (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    if (vy === 0) vy = jumpStrength;
}, { passive: false });


// --- Game Initialization ---
// Start the loading process
preloadAllAssets();