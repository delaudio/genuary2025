let currentFrame;
let inputText = "▢";
let fontSizeMax = 18; // Increased maximum size
let fontSizeMin = 8; // Increased minimum size
let spacing = 12; // Increased spacing
let kerning = 0.3; // Adjusted kerning for larger text

// Audio visualization parameters
let bassLevel = 0;
let midLevel = 0;
let highLevel = 0;

function setup() {
  let canvas = createCanvas(1080, 1080);
  canvas.drawingContext.canvas.setAttribute("willReadFrequently", true);
  canvas.drawingContext = canvas.canvas.getContext("2d", {
    willReadFrequently: true,
  });
  textFont("monospace");
  textAlign(LEFT, CENTER);
  noLoop();
  window.isSketchReady = true;
}

function updateAudioLevels() {
  if (!window.audioData || !window.currentAudioFrame) return;

  const frame = window.currentAudioFrame;
  if (frame) {
    bassLevel = frame.bass;
    midLevel = frame.mid;
    highLevel = frame.high;

    // More pronounced audio-reactive size changes
    fontSizeMax = map(bassLevel, 0, 1, 16, 20);
    spacing = map(midLevel, 0, 1, 11, 13);
    kerning = map(highLevel, 0, 1, 0.2, 0.4);
  }
}

function loadImageFromBase64(base64Data) {
  return new Promise((resolve) => {
    loadImage("data:image/png;base64," + base64Data, (img) => {
      currentFrame = img;
      resolve();
    });
  });
}

window.processFrame = async function (base64Image, audioData) {
  window.currentAudioFrame = audioData;
  await loadImageFromBase64(base64Image);
  draw();
  return window.frameData;
};

function draw() {
  if (!currentFrame) {
    console.log("No image loaded yet");
    return;
  }

  background(0);
  updateAudioLevels();

  let x = 0;
  let y = spacing;
  let counter = 0;

  while (y < height) {
    const imgX = round(map(x, 0, width, 0, currentFrame.width));
    const imgY = round(map(y, 0, height, 0, currentFrame.height));
    const c = currentFrame.get(imgX, imgY);

    // Enhanced brightness calculation
    const brightness = (red(c) + green(c) + blue(c)) / 3;
    const normalizedBrightness = pow(brightness / 255, 0.8); // Gamma correction for better midtones

    push();
    translate(x, y);

    // More dynamic audio reactivity for size
    const audioBoost = map(bassLevel + midLevel, 0, 2, 1, 1.3);
    const fontSize =
      map(normalizedBrightness, 0, 1, fontSizeMin, fontSizeMax) * audioBoost;
    textSize(max(fontSize, 1));

    // Enhanced color handling for brighter output
    const satBoost = map(midLevel, 0, 1, 1.2, 1.4); // Increased base saturation
    const brightBoost = map(highLevel, 0, 1, 1.2, 1.5); // Increased brightness boost

    // Color enhancement with brightness preservation
    const r = min(255, red(c) * satBoost * brightBoost + 20); // Add base brightness
    const g = min(255, green(c) * satBoost * brightBoost + 20);
    const b = min(255, blue(c) * satBoost * brightBoost + 20);

    // Additional highlight enhancement for brighter areas
    const highlight = map(normalizedBrightness, 0.7, 1, 0, 30);
    fill(
      min(255, r + highlight),
      min(255, g + highlight),
      min(255, b + highlight)
    );

    const letter = inputText;
    text(letter, 0, 0);

    const letterWidth = textWidth(letter) + kerning;
    x += letterWidth;

    pop();

    if (x + letterWidth >= width) {
      x = 0;
      y += spacing;
    }

    counter++;
    if (counter >= inputText.length) {
      counter = 0;
    }
  }

  window.frameData = canvas.toDataURL("image/png");
}
