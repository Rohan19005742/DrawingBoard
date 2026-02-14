const canvas = document.getElementById('board');
const previewLayer = document.getElementById('previewLayer');
const deleteButton = document.getElementById('deleteButton');
const secretRestoreButton = document.getElementById('secretRestoreButton');
const statusMessage = document.getElementById('statusMessage');
const context = canvas.getContext('2d');
const previewContext = previewLayer.getContext('2d');

let isDrawing = false;
let lastPoint = null;
let deletedSnapshot = null;
let isShowingDeletedPreview = false;
let deleteHoldTimer = null;
let hardDeleteTriggered = false;
let hasDrawnSinceLastDelete = false;
let statusTimer = null;
let previewLoadToken = 0;

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.add('visible');

  if (statusTimer) {
    clearTimeout(statusTimer);
  }

  statusTimer = setTimeout(() => {
    statusMessage.classList.remove('visible');
  }, 1400);
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (canvas.width === Math.floor(width * ratio) && canvas.height === Math.floor(height * ratio)) {
    return;
  }

  const currentImage = canvas.toDataURL();

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  previewLayer.width = Math.floor(width * ratio);
  previewLayer.height = Math.floor(height * ratio);
  previewLayer.style.width = `${width}px`;
  previewLayer.style.height = `${height}px`;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#000000';
  context.lineWidth = 6;

  previewContext.setTransform(ratio, 0, 0, ratio, 0, 0);

  const image = new Image();
  image.onload = () => {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
  };
  image.src = currentImage;
}

function getPointFromEvent(event) {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function beginDrawing(event) {
  if (event.target === deleteButton) {
    return;
  }

  isDrawing = true;
  lastPoint = getPointFromEvent(event);
  hasDrawnSinceLastDelete = true;

  context.beginPath();
  context.moveTo(lastPoint.x, lastPoint.y);
}

function draw(event) {
  if (!isDrawing) {
    return;
  }

  const point = getPointFromEvent(event);
  context.lineTo(point.x, point.y);
  context.stroke();
  lastPoint = point;
}

function endDrawing() {
  if (!isDrawing) {
    return;
  }

  isDrawing = false;
  lastPoint = null;
  context.closePath();
}

function clearBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function startDeleteHold() {
  hardDeleteTriggered = false;

  deleteHoldTimer = setTimeout(() => {
    deletedSnapshot = null;
    hardDeleteTriggered = true;
    clearBoard();
    previewLoadToken += 1;
    previewContext.clearRect(0, 0, previewLayer.width, previewLayer.height);
    isShowingDeletedPreview = false;
    hasDrawnSinceLastDelete = false;
    showStatus('reset succesful');
  }, 2000);
}

function cancelDeleteHold() {
  if (deleteHoldTimer) {
    clearTimeout(deleteHoldTimer);
    deleteHoldTimer = null;
  }
}

function softDelete() {
  deletedSnapshot = canvas.toDataURL('image/png');
  clearBoard();
  previewLoadToken += 1;
  previewContext.clearRect(0, 0, previewLayer.width, previewLayer.height);
  isShowingDeletedPreview = false;
  hasDrawnSinceLastDelete = false;
  showStatus('succesfully deleted');
}

function onDeletePress(event) {
  event.preventDefault();
  deleteButton.setPointerCapture(event.pointerId);
  startDeleteHold();
}

function onDeleteRelease(event) {
  event.preventDefault();
  if (deleteButton.hasPointerCapture(event.pointerId)) {
    deleteButton.releasePointerCapture(event.pointerId);
  }
  cancelDeleteHold();

  if (!hardDeleteTriggered) {
    softDelete();
  }
}

function restorePreview() {
  if (!deletedSnapshot || isShowingDeletedPreview) {
    return;
  }

  previewLoadToken += 1;
  const currentToken = previewLoadToken;

  const image = new Image();
  image.onload = () => {
    if (currentToken !== previewLoadToken) {
      return;
    }

    previewContext.clearRect(0, 0, previewLayer.width, previewLayer.height);
    previewContext.drawImage(image, 0, 0, window.innerWidth, window.innerHeight);
    isShowingDeletedPreview = true;
  };
  image.src = deletedSnapshot;
}

function hidePreview() {
  previewLoadToken += 1;
  previewContext.clearRect(0, 0, previewLayer.width, previewLayer.height);
  isShowingDeletedPreview = false;
}

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  beginDrawing(event);
});

canvas.addEventListener('pointermove', (event) => {
  event.preventDefault();
  draw(event);
});

canvas.addEventListener('pointerup', endDrawing);
canvas.addEventListener('pointercancel', endDrawing);
canvas.addEventListener('pointerleave', endDrawing);

window.addEventListener('pointerup', () => {
  endDrawing();
  cancelDeleteHold();
});

window.addEventListener('resize', resizeCanvas);

deleteButton.addEventListener('pointerdown', onDeletePress);
deleteButton.addEventListener('pointerup', onDeleteRelease);
deleteButton.addEventListener('pointercancel', onDeleteRelease);

secretRestoreButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  restorePreview();
});

['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
  secretRestoreButton.addEventListener(eventName, (event) => {
    event.preventDefault();
    hidePreview();
  });
});

resizeCanvas();
