const cameraElement = document.getElementById('camera');
const overlayElement = document.getElementById('camera-overlay');
const startCameraButton = document.getElementById('start-camera');
const scanButton = document.getElementById('scan-button');
const logButton = document.getElementById('log-button');
const predictionOutput = document.getElementById('prediction-output');
const inventoryForm = document.getElementById('inventory-form');
const locationInput = document.getElementById('location');
const notesInput = document.getElementById('notes');
const inventoryTableBody = document.querySelector('#inventory-table tbody');
const emptyRow = document.getElementById('empty-row');

let model;
let stream;
let latestPrediction = null;

async function loadModel() {
  predictionOutput.querySelector('.hint').textContent = 'Loading AI model…';
  try {
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    predictionOutput.querySelector('.hint').textContent =
      'Model loaded. Start the camera to begin scanning.';
  } catch (error) {
    console.error('Failed to load model', error);
    predictionOutput.querySelector('.hint').textContent =
      'Could not load AI model. Check your connection and refresh the page.';
  }
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Camera not supported in this browser. Try using the latest Chrome or Edge.');
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    cameraElement.srcObject = stream;
    overlayElement.classList.add('hidden');
    scanButton.disabled = false;
    startCameraButton.disabled = true;
  } catch (error) {
    console.error('Unable to access camera', error);
    alert('Unable to access the camera. Please grant camera permissions and try again.');
  }
}

async function classifyCurrentFrame() {
  if (!model) {
    alert('Model not ready yet. Please wait for it to finish loading.');
    return null;
  }

  if (!cameraElement.srcObject) {
    alert('Start the camera before scanning.');
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = cameraElement.videoWidth;
  canvas.height = cameraElement.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(cameraElement, 0, 0, canvas.width, canvas.height);

  predictionOutput.innerHTML = `
    <h2>Latest Scan</h2>
    <p class="hint">Analysing frame…</p>
  `;

  try {
    const predictions = await model.classify(canvas);
    if (!predictions.length) {
      predictionOutput.innerHTML = `
        <h2>Latest Scan</h2>
        <p class="hint">No predictions available. Try again.</p>
      `;
      latestPrediction = null;
      logButton.disabled = true;
      return null;
    }

    const [primary, ...rest] = predictions;
    latestPrediction = primary;
    renderPrediction(primary, rest);
    logButton.disabled = false;
    return primary;
  } catch (error) {
    console.error('Prediction failed', error);
    predictionOutput.innerHTML = `
      <h2>Latest Scan</h2>
      <p class="hint">Prediction failed. ${error.message}</p>
    `;
    latestPrediction = null;
    logButton.disabled = true;
    return null;
  }
}

function renderPrediction(primary, rest) {
  const probability = (primary.probability * 100).toFixed(1);
  const secondaryList = rest
    .slice(0, 3)
    .map(
      (item) =>
        `<li>${item.className} <span class="confidence">${(item.probability * 100).toFixed(1)}%</span></li>`
    )
    .join('');

  predictionOutput.innerHTML = `
    <h2>Latest Scan</h2>
    <div class="prediction-details">
      <div class="label">${primary.className}</div>
      <progress max="100" value="${probability}"></progress>
      <div class="confidence">Confidence: ${probability}%</div>
      ${
        secondaryList
          ? `<div class="alternatives"><strong>Other possibilities:</strong><ul>${secondaryList}</ul></div>`
          : ''
      }
    </div>
  `;
}

function addRowToTable({ label, confidence, location, notes }) {
  const row = document.createElement('tr');

  const timestampCell = document.createElement('td');
  const timestamp = new Date().toLocaleString();
  timestampCell.textContent = timestamp;

  const labelCell = document.createElement('td');
  labelCell.textContent = label;

  const confidenceCell = document.createElement('td');
  confidenceCell.textContent = `${confidence.toFixed(1)}%`;

  const locationCell = document.createElement('td');
  locationCell.textContent = location;

  const notesCell = document.createElement('td');
  notesCell.textContent = notes;

  row.append(timestampCell, labelCell, confidenceCell, locationCell, notesCell);
  inventoryTableBody.appendChild(row);
}

function handleInventorySubmit(event) {
  event.preventDefault();
  if (!latestPrediction) {
    alert('Scan an item before adding it to the inventory.');
    return;
  }

  const location = locationInput.value.trim();
  const notes = notesInput.value.trim();

  if (!location) {
    alert('Please provide a location for the item.');
    return;
  }

  if (emptyRow) {
    emptyRow.remove();
  }

  addRowToTable({
    label: latestPrediction.className,
    confidence: latestPrediction.probability * 100,
    location,
    notes
  });

  inventoryForm.reset();
  logButton.disabled = true;
  latestPrediction = null;
  predictionOutput.innerHTML = `
    <h2>Latest Scan</h2>
    <p class="hint">Scan another item to keep building your inventory.</p>
  `;
}

startCameraButton.addEventListener('click', startCamera);
scanButton.addEventListener('click', classifyCurrentFrame);
inventoryForm.addEventListener('submit', handleInventorySubmit);

loadModel();

window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
});
