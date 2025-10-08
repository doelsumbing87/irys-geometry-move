// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const bestScoreDisplay = document.getElementById('bestScore');
const musicBtn = document.getElementById('musicBtn');
const sfxBtn = document.getElementById('sfxBtn');

// Canvas responsiveness
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = 800;
    const maxHeight = 500;
    const aspectRatio = maxWidth / maxHeight;
    
    let width = container.clientWidth;
    let height = width / aspectRatio;
    
    if (height > window.innerHeight * 0.7) {
        height = window.innerHeight * 0.7;
        width = height * aspectRatio;
    }
    
    canvas.width = Math.min(width, maxWidth);
    canvas.height = canvas.width / aspectRatio;
    
    const scaleFactor = canvas.width / maxWidth; 
    
    if (gameState.player.baseWidth) {
        gameState.player.width = gameState.player.baseWidth * scaleFactor;
        gameState.player.height = gameState.player.baseHeight * scaleFactor;
    }
    
    // Perbarui fisika pemain (gravitasi & lompatan) agar terasa konsisten
    if (gameState.player.baseJumpForce) {
        gameState.player.jumpForce = gameState.player.baseJumpForce * scaleFactor;
        gameState.player.gravity = gameState.player.baseGravity * scaleFactor;
    }

    // Atur ulang posisi ground dan pemain jika game sedang berjalan
    if (gameState.gameStarted && !gameState.gameOver) {
        // Sesuaikan groundY berdasarkan tinggi kanvas yang baru
        gameState.groundY = canvas.height - (50 * scaleFactor); // Ground juga diskalakan
        
        // Pastikan pemain tetap di atas ground setelah resize
        if (gameState.player.y > gameState.groundY - gameState.player.height) {
            gameState.player.y = gameState.groundY - gameState.player.height;
        }
    }
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Audio context for sound generation
let audioContext;
let musicEnabled = true;
let sfxEnabled = true;
let bgMusicInterval;

// Initialize audio
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        startBackgroundMusic();
    }
}

// Background music
function startBackgroundMusic() {
    if (!audioContext || !musicEnabled) return;
    
    stopBackgroundMusic();
    
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
    let noteIndex = 0;

    function playNote() {
        if (!musicEnabled || !audioContext) return;
        
        const osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = notes[noteIndex];
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.5);
        
        noteIndex = (noteIndex + 1) % notes.length;
    }
    
    playNote();
    bgMusicInterval = setInterval(playNote, 400);
}

function stopBackgroundMusic() {
    if (bgMusicInterval) {
        clearInterval(bgMusicInterval);
        bgMusicInterval = null;
    }
}

// Sound effects
function playJumpSound() {
    if (!audioContext || !sfxEnabled) return;
    
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.frequency.value = 400;
    osc.type = 'square';
    
    gainNode.gain.value = 0.1;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
}

function playCollectSound() {
    if (!audioContext || !sfxEnabled) return;
    
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.frequency.value = 800;
    osc.type = 'sine';
    
    gainNode.gain.value = 0.15;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    osc.stop(audioContext.currentTime + 0.2);
}

function playCrashSound() {
    if (!audioContext || !sfxEnabled) return;
    
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.frequency.value = 100;
    osc.type = 'sawtooth';
    
    gainNode.gain.value = 0.2;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
}

function playLevelUpSound() {
    if (!audioContext || !sfxEnabled) return;
    
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            gainNode.gain.value = 0.15;
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            osc.start();
            osc.stop(audioContext.currentTime + 0.3);
        }, i * 100);
    });
}

// Audio control buttons
musicBtn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    musicBtn.classList.toggle('muted', !musicEnabled);
    musicBtn.textContent = musicEnabled ? '🎵' : '🔇';
    if (musicEnabled && gameState.gameStarted) {
        initAudio();
    } else if (!musicEnabled) {
        stopBackgroundMusic();
    }
});

sfxBtn.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    sfxBtn.classList.toggle('muted', !sfxEnabled);
    sfxBtn.textContent = sfxEnabled ? '🔊' : '🔈';
});

// Load character image
const charImg = new Image();
charImg.src = 'char.png';
const fireImg = new Image();
fireImg.src = 'fireblast.png';

// Game state
const gameState = {
    player: {
        x: 100,
        y: 300,
        baseWidth: 50,
        baseHeight: 50,
        width: 50,
        height: 100,
        velocityY: 0,
        baseGravity: 0.6,
        baseJumpForce: -15,
        gravity: 0.9,
        jumpForce: -23,
        isJumping: false
    },
    obstacles: [],
    flyingObstacles: [],
    dataBlocks: [],
    score: 0,
    level: 1,
    gameStarted: false,
    gameOver: false,
    groundY: 350,
    bestScore: localStorage.getItem('irysGameBestScore') || 0
};

bestScoreDisplay.textContent = gameState.bestScore;

// Level configurations (10 levels)
const levelConfigs = [
    // Level 1: Lebih lambat, rintangan lebih jarang untuk pemanasan
    { speed: 3, obstacleFreq: 140, dataBlockFreq: 100, flyingObstacleFreq: 300, obstacleHeight: 50, name: "Beginner Network" },
    // Level 2: Kecepatan mulai naik sedikit
    { speed: 3.5, obstacleFreq: 130, dataBlockFreq: 95, flyingObstacleFreq: 270, obstacleHeight: 55, name: "Data Stream" },
    // Level 3: Rintangan udara mulai lebih sering muncul
    { speed: 4, obstacleFreq: 120, dataBlockFreq: 90, flyingObstacleFreq: 240, obstacleHeight: 60, name: "Node Path" },
    // Level 4: Kecepatan dan kepadatan mulai terasa
    { speed: 4.5, obstacleFreq: 110, dataBlockFreq: 85, flyingObstacleFreq: 210, obstacleHeight: 65, name: "Chain Flow" },
    // Level 5: Titik tengah, keseimbangan antara kecepatan dan frekuensi
    { speed: 5, obstacleFreq: 100, dataBlockFreq: 80, flyingObstacleFreq: 180, obstacleHeight: 70, name: "Network Rush" },
    // Level 6: Permainan mulai cepat
    { speed: 5.5, obstacleFreq: 95, dataBlockFreq: 75, flyingObstacleFreq: 165, obstacleHeight: 75, name: "Data Highway" },
    // Level 7: Rintangan menjadi sangat sering
    { speed: 6, obstacleFreq: 90, dataBlockFreq: 70, flyingObstacleFreq: 150, obstacleHeight: 80, name: "Blockchain Speed" },
    // Level 8: Tantangan presisi tinggi
    { speed: 6.5, obstacleFreq: 85, dataBlockFreq: 65, flyingObstacleFreq: 140, obstacleHeight: 85, name: "Decentralized Chaos" },
    // Level 9: Mendekati puncak kesulitan
    { speed: 7, obstacleFreq: 80, dataBlockFreq: 60, flyingObstacleFreq: 130, obstacleHeight: 90, name: "Irys Master" },
    // Level 10: Kecepatan maksimal dengan rintangan yang sangat padat
    { speed: 8, obstacleFreq: 75, dataBlockFreq: 55, flyingObstacleFreq: 120, obstacleHeight: 95, name: "Ultimate Network" }
];

let currentConfig = levelConfigs[0];
let frameCount = 0;

// Initialize game
function initGame() {
    resizeCanvas();
    gameState.groundY = canvas.height - 50;
    gameState.player.y = gameState.groundY - gameState.player.height - 10;
    gameState.player.velocityY = 0;
    gameState.player.isJumping = false;
    gameState.obstacles = [];
    gameState.flyingObstacles = [];
    gameState.dataBlocks = [];
    gameState.score = 0;
    gameState.level = 1;
    gameState.gameOver = false;
    gameState.gameStarted = true;
    currentConfig = levelConfigs[0];
    frameCount = 0;
    scoreDisplay.textContent = gameState.score;
    levelDisplay.textContent = gameState.level;
}

// Player jump
function jump() {
    if (!gameState.player.isJumping && gameState.gameStarted && !gameState.gameOver) {
        gameState.player.velocityY = gameState.player.jumpForce;
        gameState.player.isJumping = true;
        playJumpSound();
    }
}

// Event listeners
canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

startBtn.addEventListener('click', () => {
    initAudio();
    startScreen.style.display = 'none';
    initGame();
    gameLoop();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    initGame();
    gameLoop();
});

// Create obstacle
function createObstacle() {
    const height = currentConfig.obstacleHeight * (canvas.height / 500);
    gameState.obstacles.push({
        x: canvas.width,
        y: gameState.groundY - height,
        width: 30 * (canvas.width / 800),
        height: height
    });
}

// Create data block
function createDataBlock() {
    const minY = 50;
    const maxY = gameState.groundY - 100;
    const y = Math.random() * (maxY - minY) + minY;
    const size = 25 * (canvas.width / 800);
    
    gameState.dataBlocks.push({
        x: canvas.width,
        y: y,
        width: size,
        height: size,
        collected: false
    });
}

// Create flying obstacle
function createFlyingObstacle() {
    // Tentukan area vertikal di mana rintangan bisa muncul
    const minY = 50 * (canvas.height / 500); // Jarak dari atas
    const maxY = gameState.groundY - 150 * (canvas.height / 500); // Jarak dari ground
    
    // Pilih posisi Y acak di antara minY dan maxY
    const y = Math.random() * (maxY - minY) + minY;
    
    // Tentukan ukuran rintangan terbang
    const size = 35 * (canvas.width / 800);
    
    gameState.flyingObstacles.push({
        x: canvas.width,
        y: y,
        width: size,
        height: size,
    });
}

// Check collision
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update level
function updateLevel() {
    const prevLevel = gameState.level;
    gameState.level = Math.min(10, Math.floor(gameState.score / 10) + 1);
    
    if (gameState.level !== prevLevel) {
        currentConfig = levelConfigs[gameState.level - 1];
        levelDisplay.textContent = gameState.level;
        playLevelUpSound();
    }
}

// Show game over
function showGameOver() {
    gameState.gameStarted = false;
    
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem('irysGameBestScore', gameState.bestScore);
        bestScoreDisplay.textContent = gameState.bestScore;
    }
    
    document.getElementById('finalScore').textContent = `Final Score: ${gameState.score}`;
    document.getElementById('levelReached').textContent = `Level Reached: ${gameState.level} - ${currentConfig.name}`;
    gameOverScreen.style.display = 'block';
}

// Update game
function update() {
    if (gameState.gameOver) return;

    frameCount++;

    // Update player
    gameState.player.velocityY += gameState.player.gravity;
    gameState.player.y += gameState.player.velocityY;

    // Ground collision
    if (gameState.player.y + gameState.player.height >= gameState.groundY) {
        gameState.player.y = gameState.groundY - gameState.player.height;
        gameState.player.velocityY = 0;
        gameState.player.isJumping = false;
    }

    // Ceiling collision
    if (gameState.player.y < 0) {
        gameState.player.y = 0;
        gameState.player.velocityY = 0;
    }

    // Create ground obstacles
    if (frameCount % currentConfig.obstacleFreq === 0) {
        createObstacle();
    }

    // --- KODE BARU DITAMBAHKAN ---
    // Create flying obstacles based on its frequency
    if (currentConfig.flyingObstacleFreq && frameCount % currentConfig.flyingObstacleFreq === 0) {
        createFlyingObstacle();
    }
    // --- AKHIR KODE BARU ---

    // Create data blocks
    if (frameCount % currentConfig.dataBlockFreq === 0) {
        createDataBlock();
    }

    // Update ground obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        gameState.obstacles[i].x -= currentConfig.speed * (canvas.width / 800);

        // Check collision with player
        if (checkCollision(gameState.player, gameState.obstacles[i])) {
            gameState.gameOver = true;
            playCrashSound();
            showGameOver();
            return; // Hentikan fungsi update jika game over
        }

        // Remove off-screen obstacles and add score
        if (gameState.obstacles[i].x + gameState.obstacles[i].width < 0) {
            gameState.obstacles.splice(i, 1);
            gameState.score++;
            scoreDisplay.textContent = gameState.score;
            updateLevel();
        }
    }

    // --- KODE BARU DITAMBAHKAN ---
    // Update flying obstacles
    for (let i = gameState.flyingObstacles.length - 1; i >= 0; i--) {
        const flyingObstacle = gameState.flyingObstacles[i];
        flyingObstacle.x -= currentConfig.speed * (canvas.width / 800);

        // Check collision with player
        if (checkCollision(gameState.player, flyingObstacle)) {
            gameState.gameOver = true;
            playCrashSound();
            showGameOver();
            return; // Hentikan fungsi update jika game over
        }

        // Remove off-screen flying obstacles
        if (flyingObstacle.x + flyingObstacle.width < 0) {
            gameState.flyingObstacles.splice(i, 1);
        }
    }
    // --- AKHIR KODE BARU ---

    // Update data blocks
    for (let i = gameState.dataBlocks.length - 1; i >= 0; i--) {
        gameState.dataBlocks[i].x -= currentConfig.speed * (canvas.width / 800);

        // Check collision with player
        if (!gameState.dataBlocks[i].collected && 
            checkCollision(gameState.player, gameState.dataBlocks[i])) {
            gameState.dataBlocks[i].collected = true;
            gameState.score += 2; // Menambah 2 poin untuk data block
            scoreDisplay.textContent = gameState.score;
            playCollectSound();
            updateLevel();
        }

        // Remove off-screen data blocks
        if (gameState.dataBlocks[i].x + gameState.dataBlocks[i].width < 0) {
            gameState.dataBlocks.splice(i, 1);
        }
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.2)';
    ctx.lineWidth = 1;
    const gridSize = 40 * (canvas.width / 800);
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw ground
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, gameState.groundY, canvas.width, canvas.height - gameState.groundY);
    
    // Draw ground line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, gameState.groundY);
    ctx.lineTo(canvas.width, gameState.groundY);
    ctx.stroke();
    
    // Draw player (character image or fallback)
    if (charImg.complete && charImg.naturalHeight !== 0) {
        ctx.drawImage(charImg, gameState.player.x, gameState.player.y, 
                     gameState.player.width, gameState.player.height);
    } else {
        // Fallback: draw a cute character if image fails to load
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gameState.player.x + gameState.player.width / 2, 
               gameState.player.y + gameState.player.height / 2, 
               gameState.player.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(gameState.player.x + gameState.player.width * 0.35, 
               gameState.player.y + gameState.player.height * 0.4, 
               3 * (canvas.width / 800), 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gameState.player.x + gameState.player.width * 0.65, 
               gameState.player.y + gameState.player.height * 0.4, 
               3 * (canvas.width / 800), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 * (canvas.width / 800);
        ctx.beginPath();
        ctx.arc(gameState.player.x + gameState.player.width / 2, 
               gameState.player.y + gameState.player.height * 0.6, 
               8 * (canvas.width / 800), 0, Math.PI);
        ctx.stroke();
    }
    
    // Draw ground obstacles
    gameState.obstacles.forEach(obstacle => {
        // Obstacle body
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Obstacle border
        ctx.strokeStyle = '#c92a2a';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Warning stripes
        ctx.fillStyle = '#fff5f5';
        const stripeHeight = 5 * (canvas.height / 500);
        for (let y = obstacle.y; y < obstacle.y + obstacle.height; y += stripeHeight * 2) {
            ctx.fillRect(obstacle.x, y, obstacle.width, stripeHeight);
        }
    });

    // --- KODE BARU DITAMBAHKAN ---
    // Draw flying obstacles
    // Draw flying obstacles
    gameState.flyingObstacles.forEach(obstacle => {
    // Cek apakah gambar sudah selesai dimuat untuk menghindari error
        if (fireImg.complete && fireImg.naturalHeight !== 0) {
        // Gambar semburan api di posisi rintangan
        ctx.drawImage(fireImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
        // Jika gambar gagal dimuat, gambar kotak oranye sebagai cadangan
        ctx.fillStyle = '#ff922b';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
    // --- AKHIR KODE BARU ---
    
    // Draw data blocks
    gameState.dataBlocks.forEach(block => {
        if (!block.collected) {
            const gradient = ctx.createRadialGradient(
                block.x + block.width / 2, block.y + block.height / 2, 0,
                block.x + block.width / 2, block.y + block.height / 2, block.width
            );
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                block.x - block.width / 2, block.y - block.height / 2, 
                block.width * 2, block.height * 2
            );
            
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(block.x, block.y, block.width, block.height);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(block.x, block.y, block.width, block.height);
            
            ctx.fillStyle = '#ffffff';
            const iconSize = block.width * 0.4;
            ctx.fillRect(
                block.x + (block.width - iconSize) / 2, 
                block.y + (block.height - iconSize) / 2, 
                iconSize, iconSize
            );
        }
    });
    
    // Draw level name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `${Math.max(12, canvas.width / 40)}px "Segoe UI"`;
    ctx.textAlign = 'center';
    ctx.fillText(currentConfig.name, canvas.width / 2, 30);
}
// Game loop
function gameLoop() {
    if (gameState.gameStarted && !gameState.gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else if (gameState.gameOver) {
        draw(); // Draw one last frame
    }
}

// Initial canvas setup
resizeCanvas();