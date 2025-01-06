let currentFrame;
let inputText = "▢";
// Fixed sizes instead of audio-reactive
const fontSizeMax = 18;
const fontSizeMin = 8;
const baseSpacing = 12;
const baseKerning = 0.3;

// Audio visualization parameters
let bassLevel = 0;
let midLevel = 0;
let highLevel = 0;

function setup() {
  let canvas = createCanvas(1080, 1080);
  canvas.drawingContext.canvas.setAttribute('willReadFrequently', true);
  canvas.drawingContext = canvas.canvas.getContext('2d', { willReadFrequently: true });
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

window.processFrame = async function(base64Image, audioData) {
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

  background(20); // Slightly lighter background for better contrast
  updateAudioLevels();
  
  // Calculate overall audio energy for gentle lighting enhancement
  const audioEnergy = (bassLevel + midLevel + highLevel) / 3;
  // Increased base brightness range
  const globalBrightness = map(audioEnergy, 0, 1, 1.3, 1.5);
  
  let x = 0;
  let y = baseSpacing;
  let counter = 0;

  while (y < height) {
    const imgX = round(map(x, 0, width, 0, currentFrame.width));
    const imgY = round(map(y, 0, height, 0, currentFrame.height));
    const c = currentFrame.get(imgX, imgY);

    // Enhanced brightness calculation with increased base levels
    const brightness = (red(c) + green(c) + blue(c)) / 3;
    // Adjusted gamma for brighter midtones
    const normalizedBrightness = pow(brightness / 255, 0.5);

    push();
    translate(x, y);

    // Fixed font size based on brightness only
    const fontSize = map(normalizedBrightness, 0, 1, fontSizeMin, fontSizeMax);
    textSize(max(fontSize, 1));

    // Enhanced base color levels
    const r = red(c) * 1.2;   // Increase base colors by 20%
    const g = green(c) * 1.2;
    const b = blue(c) * 1.2;

    // Increased base boosts for audio-reactive lighting
    const bassBoost = map(bassLevel, 0, 1, 20, 40);    // Increased warm boost
    const midBoost = map(midLevel, 0, 1, 15, 30);      // Increased general brightness
    const highBoost = map(highLevel, 0, 1, 10, 20);    // Increased sparkle

    // Additional brightness boost for darker areas
    const brightnessBoost = map(normalizedBrightness, 0, 0.5, 30, 0);
    
    fill(
      min(255, (r + bassBoost + brightnessBoost) * globalBrightness),
      min(255, (g + midBoost + brightnessBoost) * globalBrightness),
      min(255, (b + highBoost + brightnessBoost) * globalBrightness)
    );

    const letter = inputText;
    text(letter, 0, 0);
    
    const letterWidth = textWidth(letter) + baseKerning;
    x += letterWidth;

    pop();

    if (x + letterWidth >= width) {
      x = 0;
      y += baseSpacing;
    }

    counter++;
    if (counter >= inputText.length) {
      counter = 0;
    }
  }

  window.frameData = canvas.toDataURL("image/png");
}