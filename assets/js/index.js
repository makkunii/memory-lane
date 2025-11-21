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
        { left: 6500, bottom: 200, type: 'text', text: 'With you is like an adventure. Looking forward to more memories.' , description: 'No words needed, just looking forward.'}, // Added description here too
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


// --- DOM Element Setup (Dynamically generated) ---
const gameContainer = document.getElementById('game-container');
const groundHeight = 120; // Must match CSS #ground height

// Function to generate the platforms and append to the game world
function initializeWorldElements() {
    // 1. Add Ground (already in HTML)

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
    });

    // 3. Add Memory Spots
    GAME_DATA.memorySpots.forEach((m, index) => {
        const spotEl = document.createElement('div');
        spotEl.className = 'memory-spot';
        spotEl.style.left = `${m.left}px`;
        // Spots float 10px above their base height
        spotEl.style.bottom = `${m.bottom}px`;
        spotEl.setAttribute('data-type', m.type);
        spotEl.setAttribute('data-text', m.text);
        if (m.photo) spotEl.setAttribute('data-photo', m.photo);
        if (m.audio) spotEl.setAttribute('data-audio', m.audio);
        spotEl.setAttribute('data-spot-id', `m${index + 1}`);
        gameContainer.appendChild(spotEl);
    });
}
initializeWorldElements();


// --- Player & Physics ---
const player=document.getElementById('player');
const mjayPixel=document.getElementById('mjay-pixel'); // Get the image element for sprite swapping
const gameWidth=8000;
const playerWidth=46;
let px=750, py=groundHeight, vx=0, vy=0; // Start player at left: 750px
const gravity=1.2, jumpStrength=22, acceleration=1, maxSpeed=8;
let isJumping=false, isModalOpen=false;

let canTriggerMemory = true;
let endingTriggered = false;


// Re-read platforms dynamically after they're created
const platforms=[];
document.querySelectorAll('.platform').forEach(el=>{
const width = parseInt(el.style.width) || 200;
platforms.push({el, left:parseInt(el.style.left), bottom:parseInt(el.style.bottom), width:width, height:20});
});

function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

// 🏃‍♀️ SPRITE DEFINITIONS
// IMPORTANT: Update these paths to match where your files are actually located!
const IDLE_SPRITE = './assets/images/mjay.png'; 
const WALK_SPRITE_1 = './assets/images/mjay_walking_side_view.png'; 
// Since you only provided one walk sprite, we will use the standing one as the second frame.
const WALK_SPRITE_2 = './assets/images/mjay_standing_side_view.png'; 


let walkFrame = 0;
const WALK_CYCLE_INTERVAL = 150; // Milliseconds per frame swap
let lastWalkTime = 0;

function updateWalkAnimation(timestamp) {
    // Check if the player is moving horizontally
    const isMoving = Math.abs(vx) > 0.5 && !isModalOpen && !isJumping;

    if (isMoving) {
        player.classList.add('is-walking');

        // Check direction and flip sprite
        if (vx < -0.5) {
            player.style.transform = 'scaleX(-1)'; // Flip horizontally for left movement
        } else if (vx > 0.5) {
            player.style.transform = 'scaleX(1)'; // Default for right movement
        }
        
        // Sprite Swapping Logic
        if (timestamp - lastWalkTime > WALK_CYCLE_INTERVAL) {
            walkFrame = 1 - walkFrame; // Toggle between 0 and 1
            lastWalkTime = timestamp;
            
            if (walkFrame === 0) {
                mjayPixel.src = WALK_SPRITE_1; // Step 1: Walking sprite
            } else {
                mjayPixel.src = WALK_SPRITE_2; // Step 2: Standing sprite (or the second walk frame if you had one)
            }
        }

    } else {
        // Player is idle
        player.classList.remove('is-walking');
        mjayPixel.src = IDLE_SPRITE;
        walkFrame = 0; // Reset walk frame
    }
    
    // Check for jumping and add/remove class
    if (isJumping) {
        player.classList.add('is-jumping');
        mjayPixel.src = IDLE_SPRITE; // Show idle or a jump sprite when mid-air
    } else {
        player.classList.remove('is-jumping');
    }
}


// --- Game Loop (Physics Always Runs) ---
function updateGame(timestamp){
// Physics always runs, even when modal is open.
px+=vx; vx*=0.85; px=clamp(px,20,gameWidth-playerWidth-10);
vy-=gravity; py=clamp(py+vy,groundHeight,1000);

let restingY = groundHeight, onPlatform = false;
platforms.forEach(p => {
    const platformTopY = p.bottom + p.height;
    const isOverlapX = px < (p.left + p.width) && (px + playerWidth) > p.left;
    if (isOverlapX && py >= p.bottom && py < platformTopY && vy <= 0) {
        restingY = platformTopY;
        onPlatform = true;
        vy = 0;
        py = restingY;
    }
});

if(py<=groundHeight && vy<=0 && !onPlatform){ vy=0; py=groundHeight; }
isJumping = !onPlatform && py > groundHeight;
player.style.left=px+'px'; player.style.bottom=py+'px';
window.scrollTo({left:px-window.innerWidth/2+playerWidth/2, behavior:'auto'});

 // Parallax Logic
 const scrollOffset = px - (window.innerWidth / 2);
 document.getElementById('distant-mountains').style.backgroundPositionX = `${-scrollOffset * 0.1}px`;
 document.getElementById('close-clouds').style.backgroundPositionX = `${-scrollOffset * 0.3}px`;

updateWalkAnimation(timestamp); // 🏃‍♀️ Update the walk animation class here
checkMemoryTriggers();
checkEndingTrigger();

requestAnimationFrame(updateGame);
}
// Start the game loop with the timestamp argument
requestAnimationFrame(updateGame);

// 💖 ENDING TRIGGER FUNCTION
const endingModal = document.getElementById('ending-modal');
const closeEndingBtn = document.getElementById('close-ending');

const makkuniiEl = document.getElementById('makkunii-pixel');

function checkEndingTrigger() {
 if (px > 7800 && !endingTriggered && !isModalOpen) {
  openEndingModal();
 }
}


function openEndingModal() {
 isModalOpen = true;
 endingTriggered = true;
 vx = 0;
  // UX: Apply Blur to game container
  gameContainer.classList.add('blurred');
 endingModal.classList.add('show');
  // UX: Set focus to the close button for accessibility
  closeEndingBtn.focus();
}

// --- Controls (Keyboard) ---
const keys={};
document.addEventListener('keydown', e=>{
if(isModalOpen) return;
keys[e.key]=true;
if(e.key===' ' || e.key.startsWith('Arrow') || e.key==='w' || e.key==='a' || e.key==='d') e.preventDefault();
if((e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W') && vy===0) vy=jumpStrength;
});
document.addEventListener('keyup', e=>{ keys[e.key]=false; });

function handleMovementInput(){
 if(!isModalOpen){
  if(keys['ArrowRight']||keys['d']||keys['D']) vx=clamp(vx+acceleration,-maxSpeed,maxSpeed);
  if(keys['ArrowLeft']||keys['a']||keys['A']) vx=clamp(vx-acceleration,-maxSpeed,maxSpeed);
 } else {
  // Allow velocity decay
 }
 requestAnimationFrame(handleMovementInput);
}
handleMovementInput();

// --- Interaction & Modals ---
// Removed global 'memDescription' reference to avoid ID conflicts.
const memModal=document.getElementById('memory-modal'), memImg=document.getElementById('memory-img'), memText=document.getElementById('memory-text'), memTitle=document.getElementById('memory-title'), audioPlayerContainer=document.getElementById('audio-player-container'), closeMem=document.getElementById('close-memory'), audioEl=document.getElementById('memory-audio');
const alphaModal=document.getElementById('alphabet-modal'), alphaList=document.getElementById('alphabet-list'), closeAlpha=document.getElementById('close-alpha');
const galleryModal=document.getElementById('gallery-modal'), closeGallery=document.getElementById('close-gallery');
const polaroidCollageContainer = document.getElementById('polaroid-collage-container');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const playerTime = document.getElementById('player-time');
let audioInterval;

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
 if (audioEl.ended) {
 stopAudio();
 }
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


function renderAlphabet(){ 
    alphaList.innerHTML=''; 
    Object.keys(GAME_DATA.alphabetData).forEach(letter=>{
        const wrapper=document.createElement('div'); wrapper.className='alpha-letter';
        const h=document.createElement('h4'); h.textContent=letter;
        const ul=document.createElement('ul');
        GAME_DATA.alphabetData[letter].forEach(item=>{ const li=document.createElement('li'); li.textContent=item; ul.appendChild(li); });
        wrapper.appendChild(h); wrapper.appendChild(ul); alphaList.appendChild(wrapper);
    });
}
renderAlphabet();

function checkMemoryTriggers(){
// ADDED: Memory Interaction Hint & Pulse
let nearMemory = false;

document.querySelectorAll('.memory-spot').forEach(spot=>{
 const sx=parseInt(spot.style.left);
 const sy=parseInt(spot.style.bottom);
 const closeX=Math.abs(px-sx)<60;
 const closeY=Math.abs(py-(sy-10))<50;

 if (closeX && closeY) {
 nearMemory = true;
 spot.style.boxShadow = '0 0 25px var(--electric-cyan), 0 0 50px var(--neon-pink)';
 } else {
 spot.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px var(--neon-pink)';
 }

 if(closeX && closeY && canTriggerMemory && !isModalOpen) {
 openMemorySpot(spot);
 }
});
}

function openMemorySpot(spot){
const type=spot.dataset.type||'text';
const text=spot.dataset.text||'';

// 🌟 CRITICAL: Find the corresponding data object to get the description
const spotLeft = parseInt(spot.style.left);
const spotData = GAME_DATA.memorySpots.find(m => m.left === spotLeft);
const description = spotData ? spotData.description : ''; 

const photo=spot.dataset.photo||'';
const audio=spot.dataset.audio||'';

if (isModalOpen) return;

isModalOpen = true;
canTriggerMemory = false;
vx = 0; // Stop player movement

// UX: Apply Blur to game container
gameContainer.classList.add('blurred');

// UX: Visual feedback for collection (temporarily remove spot after delay)
const originalStyle = spot.style.cssText;
spot.style.boxShadow = '0 0 50px #fff, 0 0 100px var(--neon-pink)';
spot.style.opacity = '0';

setTimeout(() => {
 // Restore original visual state after modal closes
 spot.style.opacity = '1';
 // Restore all original CSS styles
 spot.style.cssText = originalStyle; 
}, 1000);

// --- Determine Modal and Find Correct Description Element ---
let modalToOpen, closeBtn;

if(type==='photo' || type==='text' || type==='audio'){
    modalToOpen = memModal;
    closeBtn = closeMem;
}
else if(type==='alphabet'){
    modalToOpen = alphaModal;
    closeBtn = closeAlpha;
}
else if(type==='gallery'){
    modalToOpen = galleryModal;
    closeBtn = closeGallery;
}

// 🌟 FIX: Use the class selector on the specific modal element
const currentMemDescription = modalToOpen ? modalToOpen.querySelector('.modal-description') : null;

// Reset visual elements common to memory/text/audio
memTitle.style.display='block';
memImg.style.display='none';
audioPlayerContainer.style.display='none';

// 🌟 FIX: Clear the content using innerHTML on the correct element
if (currentMemDescription) currentMemDescription.innerHTML = ''; 

if(type==='photo' || type==='text' || type==='audio'){
 // Setup for memory modal
 if(type==='photo'){
 memImg.src=photo||'';
 memImg.style.display=photo?'block':'none';
 memText.textContent=text;
 memTitle.textContent='Fresh Start';
 if (currentMemDescription) currentMemDescription.innerHTML = description; // 🌟 USE INNERHTML FOR HTML CONTENT
 } else if(type==='audio'){
 memText.textContent=text;
 audioEl.src=audio||'';
 audioPlayerContainer.style.display=audio?'block':'none';
 memTitle.textContent='A song perhaps?';
 if (currentMemDescription) currentMemDescription.innerHTML = description; // 🌟 USE INNERHTML
 audioEl.load(); audioEl.onloadedmetadata = updateTimeDisplay; playerTime.textContent = 'Loading...'; playBtn.textContent = '▶ Play';
 } else { // 'text' type
 memText.textContent=text;
 memTitle.textContent='To Mommy';
 if (currentMemDescription) currentMemDescription.innerHTML = description; // 🌟 USE INNERHTML
 }
}
else if(type==='alphabet'){
 // Alphabet Modal logic:
 memTitle.textContent='[DATA TYPE: ALPHABET]'; 
 if (currentMemDescription) currentMemDescription.innerHTML = description; // 🌟 USE INNERHTML
}
else if(type==='gallery'){
 // Renders the gallery content using the externalized data
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
 
 memTitle.textContent='[DATA TYPE: GALLERY]'; 
 if (currentMemDescription) currentMemDescription.innerHTML = description; // 🌟 USE INNERHTML
}

if (modalToOpen) {
 modalToOpen.classList.add('show');
  // UX: Set focus to the close button
  closeBtn.focus();
}
}

function closeAllModals(){
memModal.classList.remove('show');
alphaModal.classList.remove('show');
galleryModal.classList.remove('show');
endingModal.classList.remove('show');
isModalOpen=false;
stopAudio();

// UX: Remove Blur from game container
gameContainer.classList.remove('blurred');

// FIX: Zero out horizontal velocity on close.
vx = 0;

// Re-enable memory trigger after a short delay (500ms cooldown)
setTimeout(() => {
 canTriggerMemory = true;
}, 500);
}

closeMem.onclick=closeAllModals;
closeAlpha.onclick=closeAllModals;
closeGallery.onclick=closeAllModals;
closeEndingBtn.onclick=closeAllModals;

// Attach click listeners to all memory spots (after they are created by initializeWorldElements)
document.querySelectorAll('.memory-spot').forEach(s=> s.addEventListener('click', ()=> {
if(!isModalOpen) {
 openMemorySpot(s);
}
}));
// Added Enter key listener to close modals
window.addEventListener('keydown', e=>{
  if(e.key==='Escape' || e.key==='Enter' && isModalOpen) closeAllModals();
});


// --- Mobile Joystick ---
const joystickContainer = document.getElementById('joystick-container');
const joystickThumb = document.getElementById('joystick-thumb');
const jumpBtn = document.getElementById('jump-btn');
let joystickActive=false, startX=0, moveX=0;

joystickContainer.addEventListener('touchstart', e=>{
if(isModalOpen) return;
e.preventDefault();
joystickActive=true;
// UX: Set Opacity Active
joystickContainer.classList.add('active');
const touch=e.touches[0];
startX=touch.clientX;
const rect = joystickContainer.getBoundingClientRect();
const x = touch.clientX - rect.left;
const y = touch.clientY - rect.top;
joystickThumb.style.left = `${x}px`;
joystickThumb.style.top = `${y}px`;
});
joystickContainer.addEventListener('touchmove', e=>{
if(!joystickActive || isModalOpen) return;
e.preventDefault();
const touch=e.touches[0];
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

moveX = x - centerX;
vx = clamp(moveX / 5, -maxSpeed, maxSpeed);

});
joystickContainer.addEventListener('touchend', e=>{
if(!joystickActive) return;
joystickActive=false;
// UX: Set Opacity Inactive
joystickContainer.classList.remove('active');
joystickThumb.style.left = '50%';
joystickThumb.style.top = '50%';
if (!isModalOpen) {
 vx=0;
}
});

// Jump button
jumpBtn.addEventListener('touchstart', (e)=>{
if(isModalOpen) return;
e.preventDefault();
if(vy===0) vy=jumpStrength;
});

// --- Dynamic Stars ---
const starField = document.getElementById('star-field');
const numberOfStars = 100;

function createTwinklingStars() {
 for (let i = 0; i < numberOfStars; i++) {
  const star = document.createElement('div');
  star.style.position = 'absolute';
 
  // Random position within the entire 8000px game world
  star.style.left = `${Math.random() * gameWidth}px`;
  star.style.top = `${Math.random() * (window.innerHeight * 0.7)}px`;
 
  const size = Math.random() > 0.9 ? '2px' : '1px';
  star.style.width = size;
  star.style.height = size;
  star.style.background = '#fff';
  star.style.boxShadow = `0 0 2px 0 #fff`;
 
  star.style.animation = `twinkle 1s ease-in-out ${Math.random() * 0.5 + 0.5}s infinite alternate`;
  star.style.animationDelay = `${Math.random() * 5}s`;

  starField.appendChild(star);
 }
}

createTwinklingStars();
