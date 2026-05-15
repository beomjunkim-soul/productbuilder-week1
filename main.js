class LottoBall extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const number = this.getAttribute('number');
        const label = this.getAttribute('label') || '';
        const delay = this.getAttribute('delay') || '0ms';
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --ball-start: #ffffff;
                    --ball-mid: #f7c64d;
                    --ball-end: #e95f4f;
                    display: grid;
                    place-items: center;
                    width: clamp(56px, 12vw, 82px);
                    aspect-ratio: 1;
                    border-radius: 50%;
                    background:
                        radial-gradient(circle at 33% 25%, var(--ball-start) 0 12%, transparent 13%),
                        radial-gradient(circle at 35% 30%, var(--ball-mid), var(--ball-end) 72%);
                    color: #1c212b;
                    font-size: clamp(1.1rem, 4vw, 1.75rem);
                    font-weight: 800;
                    box-shadow:
                        inset -10px -14px 20px rgba(113, 34, 34, 0.25),
                        inset 7px 8px 14px rgba(255, 255, 255, 0.55),
                        0 18px 32px rgba(17, 24, 39, 0.18);
                    position: relative;
                    transform: translateY(24px) scale(0.72) rotate(-18deg);
                    opacity: 0;
                    animation: settle 650ms cubic-bezier(.2, .95, .25, 1.25) forwards;
                    animation-delay: ${delay};
                }

                :host([bonus]) {
                    --ball-mid: #8bd7ff;
                    --ball-end: #3e7cf4;
                    color: #07162f;
                }

                .number {
                    display: grid;
                    place-items: center;
                    width: 58%;
                    aspect-ratio: 1;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.84);
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.9);
                    line-height: 1;
                }

                .label {
                    position: absolute;
                    bottom: -1.45rem;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #657083;
                    font: 700 0.68rem/1 system-ui, sans-serif;
                    letter-spacing: 0;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                @keyframes settle {
                    0% {
                        opacity: 0;
                        transform: translateY(-28px) scale(0.66) rotate(-24deg);
                    }
                    70% {
                        opacity: 1;
                        transform: translateY(4px) scale(1.06) rotate(7deg);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1) rotate(0);
                    }
                }
            </style>
            <span class="number">${number}</span>
            ${label ? `<span class="label">${label}</span>` : ''}
        `;
    }
}

customElements.define('lotto-ball', LottoBall);

const generateBtn = document.querySelector('.generate-btn');
const themeToggle = document.querySelector('.theme-toggle');
const themeToggleLabel = document.querySelector('.theme-toggle-label');
const lottoBallsContainer = document.querySelector('.lotto-balls-container');
const drawStatus = document.querySelector('.draw-status');
const themeStorageKey = 'lotto-theme';

function generateUniqueNumbers(count, max) {
    const numbers = new Set();
    while (numbers.size < count) {
        numbers.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
}

function buildBall(number, index, isBonus = false) {
    const lottoBall = document.createElement('lotto-ball');
    lottoBall.setAttribute('number', number);
    lottoBall.setAttribute('delay', `${index * 90}ms`);

    if (isBonus) {
        lottoBall.setAttribute('bonus', '');
        lottoBall.setAttribute('label', 'Bonus');
    }

    return lottoBall;
}

function renderNumbers() {
    const lottoNumbers = generateUniqueNumbers(6, 45);
    const bonusNumber = generateUniqueNumbers(1, 20)[0];

    lottoBallsContainer.innerHTML = '';
    lottoNumbers.forEach((number, index) => {
        lottoBallsContainer.appendChild(buildBall(number, index));
    });
    lottoBallsContainer.appendChild(buildBall(bonusNumber, lottoNumbers.length, true));
}

function generateDraw() {
    generateBtn.disabled = true;
    drawStatus.textContent = 'Drawing';
    lottoBallsContainer.classList.add('is-drawing');

    window.setTimeout(() => {
        renderNumbers();
        lottoBallsContainer.classList.remove('is-drawing');
        drawStatus.textContent = 'Complete';
        generateBtn.disabled = false;
    }, 420);
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? '화이트 모드로 전환' : '다크 모드로 전환');
    themeToggleLabel.textContent = isDark ? '화이트 모드' : '다크 모드';
    localStorage.setItem(themeStorageKey, theme);
}

function getInitialTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

generateBtn.addEventListener('click', generateDraw);
themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(nextTheme);
});

window.addEventListener('load', () => {
    applyTheme(getInitialTheme());
    renderNumbers();
});
