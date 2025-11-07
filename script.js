const openCameraBtn = document.getElementById('openCameraBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const cameraSection = document.getElementById('cameraSection');
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const captureBtn = document.getElementById('captureBtn');
const fileInput = document.getElementById('fileInput');
const outputText = document.getElementById('outputText');
const readBtn = document.getElementById('readBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
let stream = null;
let speech = window.speechSynthesis;

// Open camera when button clicked
openCameraBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    cameraSection.style.display = 'block';
    openCameraBtn.style.display = 'none';
  } catch (err) {
    alert('Camera access denied or unavailable: ' + err.message);
  }
});

// Close camera
closeCameraBtn.addEventListener('click', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  cameraSection.style.display = 'none';
  openCameraBtn.style.display = 'inline-block';
});

// Capture from camera
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => readTextFromImage(blob));
});

// Upload image or PDF
fileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type === 'application/pdf') {
    extractPdfAsImage(file);
  } else {
    readTextFromImage(file);
  }
});

// Extract first page of PDF as image
function extractPdfAsImage(file) {
  const reader = new FileReader();
  reader.onload = async function() {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });

    const pdfCanvas = document.createElement('canvas');
    const pdfCtx = pdfCanvas.getContext('2d');
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    await page.render({ canvasContext: pdfCtx, viewport }).promise;
    pdfCanvas.toBlob(blob => readTextFromImage(blob));
  };
  reader.readAsArrayBuffer(file);
}

// OCR Function with progress bar
function readTextFromImage(imageFile) {
  outputText.textContent = '';
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = 'Starting OCR...';

  Tesseract.recognize(imageFile, 'eng', {
    logger: info => {
      if (info.status === 'recognizing text') {
        const progress = Math.round(info.progress * 100);
        progressBar.style.width = progress + '%';
        progressText.textContent = `Reading text... ${progress}%`;
      }
    }
  })
    .then(result => {
      progressBar.style.width = '100%';
      progressText.textContent = '✅ Done!';
      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressText.textContent = '';
      }, 1500);

      const text = result.data.text.trim() || 'No text detected.';
      outputText.textContent = text;
    })
    .catch(err => {
      outputText.textContent = 'Error: ' + err.message;
      progressContainer.style.display = 'none';
      progressText.textContent = '';
    });
}

// Read Aloud Functionality
readBtn.addEventListener('click', () => {
  const text = outputText.textContent.trim();
  if (!text) return alert('No text to read.');
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  speech.speak(utterance);
});

stopBtn.addEventListener('click', () => {
  if (speech.speaking) speech.cancel();
});

// Download as .txt
downloadBtn.addEventListener('click', () => {
  const text = outputText.textContent.trim();
  if (!text) return alert('No text to download.');
  const blob = new Blob([text], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'extracted-text.txt';
  link.click();
});


