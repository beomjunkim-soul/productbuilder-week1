const modelURL = 'https://teachablemachine.withgoogle.com/models/LV6h2_yVN/model.json';
const metadataURL = 'https://teachablemachine.withgoogle.com/models/LV6h2_yVN/metadata.json';

const imageInput = document.querySelector('.image-input');
const imagePreview = document.querySelector('.image-preview');
const webcamPreview = document.querySelector('.webcam-preview');
const emptyPreview = document.querySelector('.empty-preview');
const webcamButton = document.querySelector('.webcam-button');
const analyzeButton = document.querySelector('.analyze-button');
const resultTitle = document.querySelector('.result-title');
const resultCopy = document.querySelector('.result-copy');
const meterList = document.querySelector('.meter-list');
const modelStatus = document.querySelector('.model-status');

let model;
let webcam;
let isWebcamRunning = false;
let activeSource = null;

function setStatus(message) {
    modelStatus.textContent = message;
}

function setResult(title, copy) {
    resultTitle.textContent = title;
    resultCopy.textContent = copy;
}

function setLoading(isLoading) {
    document.body.classList.toggle('is-loading', isLoading);
    analyzeButton.disabled = isLoading || !model || !activeSource;
}

function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
}

function normalizeLabel(label) {
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('dog') || label.includes('강아지') || label.includes('개')) {
        return '강아지상';
    }

    if (lowerLabel.includes('cat') || label.includes('고양이')) {
        return '고양이상';
    }

    return label;
}

function getResultCopy(label, probability) {
    if (label === '강아지상') {
        return `밝고 친근한 인상이 더 강하게 잡혔습니다. 신뢰도는 ${formatPercent(probability)}입니다.`;
    }

    if (label === '고양이상') {
        return `차분하고 또렷한 인상이 더 강하게 잡혔습니다. 신뢰도는 ${formatPercent(probability)}입니다.`;
    }

    return `가장 높은 모델 결과는 ${label}이고, 신뢰도는 ${formatPercent(probability)}입니다.`;
}

function renderMeters(predictions) {
    meterList.innerHTML = '';

    predictions.forEach((prediction) => {
        const row = document.createElement('div');
        const heading = document.createElement('div');
        const label = document.createElement('span');
        const value = document.createElement('span');
        const track = document.createElement('div');
        const fill = document.createElement('div');

        row.className = 'meter-row';
        heading.className = 'meter-heading';
        track.className = 'meter-track';
        fill.className = 'meter-fill';

        label.textContent = normalizeLabel(prediction.className);
        value.textContent = formatPercent(prediction.probability);
        fill.style.width = formatPercent(prediction.probability);

        heading.append(label, value);
        track.append(fill);
        row.append(heading, track);
        meterList.append(row);
    });
}

function applyPredictions(predictions) {
    const sortedPredictions = [...predictions].sort((a, b) => b.probability - a.probability);
    const topPrediction = sortedPredictions[0];
    const title = normalizeLabel(topPrediction.className);

    renderMeters(sortedPredictions);
    setResult(title, getResultCopy(title, topPrediction.probability));
}

async function predict(source) {
    if (!model || !source) {
        return;
    }

    setLoading(true);

    try {
        const predictions = await model.predict(source);
        applyPredictions(predictions);
        setStatus('분석 완료');
    } catch (error) {
        setResult('분석 실패', '이미지나 카메라 화면을 다시 선택해 주세요.');
        setStatus('오류 발생');
    } finally {
        setLoading(false);
    }
}

async function loadModel() {
    try {
        model = await tmImage.load(modelURL, metadataURL);
        setStatus('모델 준비 완료');
        setResult('대기 중', '사진을 선택하거나 카메라를 켠 뒤 분석할 수 있습니다.');
        analyzeButton.disabled = !activeSource;
    } catch (error) {
        setStatus('모델 로드 실패');
        setResult('연결 실패', '모델 파일을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.');
    }
}

function clearWebcamPreview() {
    if (webcam) {
        webcam.stop();
        webcam = null;
    }

    isWebcamRunning = false;
    webcamPreview.innerHTML = '';
    webcamButton.textContent = '카메라 켜기';
}

function showImagePreview(file) {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
        clearWebcamPreview();
        imagePreview.src = reader.result;
        imagePreview.hidden = false;
        emptyPreview.hidden = true;
        activeSource = imagePreview;
        analyzeButton.disabled = !model;
        setResult('대기 중', '선택한 사진을 분석할 수 있습니다.');
        setStatus(model ? '모델 준비 완료' : '모델 준비 중');
    });

    reader.readAsDataURL(file);
}

async function startWebcam() {
    if (isWebcamRunning) {
        clearWebcamPreview();
        activeSource = imagePreview.hidden ? null : imagePreview;
        analyzeButton.disabled = !model || !activeSource;
        return;
    }

    try {
        clearWebcamPreview();
        imagePreview.hidden = true;
        imagePreview.removeAttribute('src');
        emptyPreview.hidden = true;

        webcam = new tmImage.Webcam(420, 420, true);
        await webcam.setup();
        await webcam.play();

        isWebcamRunning = true;
        activeSource = webcam.canvas;
        webcamButton.textContent = '카메라 끄기';
        webcamPreview.appendChild(webcam.canvas);
        analyzeButton.disabled = !model;
        setResult('대기 중', '카메라 화면을 분석할 수 있습니다.');
        setStatus(model ? '모델 준비 완료' : '모델 준비 중');
        window.requestAnimationFrame(updateWebcam);
    } catch (error) {
        clearWebcamPreview();
        activeSource = null;
        emptyPreview.hidden = false;
        setResult('카메라 오류', '브라우저의 카메라 권한을 확인해 주세요.');
        setStatus('카메라 사용 불가');
    }
}

function updateWebcam() {
    if (!webcam || !isWebcamRunning) {
        return;
    }

    webcam.update();
    window.requestAnimationFrame(updateWebcam);
}

imageInput.addEventListener('change', (event) => {
    const [file] = event.target.files;

    if (file) {
        showImagePreview(file);
    }
});

webcamButton.addEventListener('click', startWebcam);
analyzeButton.addEventListener('click', () => predict(activeSource));

window.addEventListener('load', loadModel);
