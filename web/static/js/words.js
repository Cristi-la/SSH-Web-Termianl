const wordList = [
    'Web terminal',
    'SSH??',
    'Remote Host',
    'Notes',
    'Sessions',
    'WebSSH',
    'Terminal',
    'Sharing...',
    'Web DevTools',
    'CodeEditor',
    'online',
    'Secure',
    'SSHKey',
    'CommandLine',
    'LinuxServer',
    'Remote Access',
    'DevOps',
    'Collaboration',
    'Code Sharing',
    'WebDev',
];

const colors = ['#0284c7', '#0369a1', '#075985', '#0c4a6e', '#082f49', '#0ea5e9', '#38bdf8', '#475569'];
const fontWeights = ['normal', 'bold'];
const opacities = [0.7, 0.8, 0.9, 1];
const rotationSpeeds = [5, 6, 7, 8, 9, 10];
const fontSizes = [16, 18, 22, 24, 28, 32, 38, 46, 50];
var screenWidth = window.innerWidth;
let wordInterval;

function updateScreenWidth() {
    screenWidth = window.innerWidth;
}


function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomCasing(word) {
    return Math.random() < 0.5 ? word.toUpperCase() : word.toLowerCase();
}

function createWord() {
    const wordWrapper = document.createElement('div');
    wordWrapper.className = 'word-wrapper';

    const word = document.createElement('div');
    word.className = 'word';
    const originalWord = getRandomElement(wordList);
    word.textContent = getRandomCasing(originalWord);

    const randomSize = getRandomElement(fontSizes);
    const randomLeft = Math.floor(Math.random() * screenWidth);
    const randomRotation = Math.floor(Math.random() * 10);

    const randomColor = getRandomElement(colors);
    const randomFontWeight = getRandomElement(fontWeights);
    const randomOpacity = getRandomElement(opacities);
    const randomGlowSize = Math.floor(Math.random() * 8) + 5;
    const randomBlur = Math.floor(Math.random() * 3) +1 ; 
    const randomRotationSpeed = getRandomElement(rotationSpeeds);
    const randomRotationDirection = Math.random() < 0.5 ? -1 : 1;

    word.style.color = randomColor;
    word.style.fontWeight = randomFontWeight;
    word.style.opacity = randomOpacity;
    word.classList = 'disable_selection'
    word.style.fontSize = `${randomSize}px`;
    wordWrapper.style.animation = `fall ${randomRotationSpeed}s linear infinite`;

    // Adding glow effect
    word.style.textShadow = `0 0 ${randomGlowSize}px rgba(${randomColor}, 1)`;
    word.style.filter = `blur(${randomBlur}px)`;

    wordWrapper.style.left = `${randomLeft}px`;
    word.style.transform = `rotate(${randomRotation * randomRotationDirection}deg)`;

    wordWrapper.appendChild(word);
    document.body.appendChild(wordWrapper);
}
function removeWordsAtBottom() {
    const words = document.querySelectorAll('.word');
    const screenHeight = window.innerHeight;

    words.forEach((word) => {
        const rect = word.getBoundingClientRect();

        if (rect.top >= screenHeight) {
            word.remove();
        }
    });
}
function startAnimation() {
    wordInterval = setInterval(() => {
        createWord();
        removeWordsAtBottom();
    }, 500); // Add a new word every second
}

function stopAnimation() {
    clearInterval(wordInterval);
}

// Start the animation when the page loads
startAnimation()

document.addEventListener("visibilitychange", function() {
    if (document.visibilityState == 'hidden') stopAnimation()
    else startAnimation() 
  });

// Update screenWidth on window resize
window.addEventListener('resize', updateScreenWidth);