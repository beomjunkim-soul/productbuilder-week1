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
                    display: grid;
                    place-items: center;
                    width: clamp(56px, 12vw, 82px);
                    min-height: clamp(56px, 12vw, 82px);
                    border: 1px solid var(--tile-border, rgba(23, 32, 51, 0.12));
                    border-radius: 8px;
                    background: var(--tile-bg, #f8fafc);
                    color: inherit;
                    font-size: clamp(1.1rem, 4vw, 1.75rem);
                    font-weight: 800;
                    position: relative;
                    transform: translateY(12px);
                    opacity: 0;
                    animation: settle 360ms ease forwards;
                    animation-delay: ${delay};
                }

                :host([bonus]) {
                    border-color: var(--accent, #2563eb);
                }

                .number {
                    display: grid;
                    place-items: center;
                    width: 100%;
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
                        transform: translateY(12px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
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
        lottoBall.setAttribute('label', '보너스');
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
    drawStatus.textContent = '생성 중';
    lottoBallsContainer.classList.add('is-drawing');

    window.setTimeout(() => {
        renderNumbers();
        lottoBallsContainer.classList.remove('is-drawing');
        drawStatus.textContent = '완료';
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
