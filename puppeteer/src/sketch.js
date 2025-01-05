let time = 0;
const zoomSpeed = 0.002;
const cubes = [];
const SIDE_LENGTH = 20;
const BASE_SCALE = 1;
let gridTopX, gridTopY;

// Audio analysis data
let currentFrame = 0;
let bassLevel = 0;
let midLevel = 0;
let highLevel = 0;
let lastFrameTime = 0;
const frameInterval = 1000 / 30; // 30fps

const colorPalette = [
  { r: 90, g: 90, b: 90 }, // Dark gray
  { r: 85, g: 85, b: 85 }, // Very similar dark gray
  { r: 80, g: 80, b: 80 }, // Similar dark gray
  { r: 75, g: 75, b: 75 }, // Similar dark gray
  { r: 70, g: 70, b: 70 }, // Similar dark gray
];

class IsoCube {
  constructor(c, r, z, size = 1) {
    this.c = c;
    this.r = r;
    this.z = z;
    this.size = size;
    this.colorIndex = floor(random(colorPalette.length));
    this.baseSize = size;
    this.zOffset = 0;
  }

  getColor() {
    return colorPalette[this.colorIndex];
  }

  draw(scale, opacity = 1) {
    const audioSizeFactor = 1 + this.zOffset * 0.5;
    const sl = SIDE_LENGTH * scale * this.size * audioSizeFactor;

    const moveX = sin(time * 0.02 + this.c * 0.5) * (10 + bassLevel * 100);
    const moveY = cos(time * 0.02 + this.r * 0.5) * (10 + midLevel * 100);
    const x = gridTopX + ((this.c - this.r) * sl * sqrt(3)) / 2 + moveX;
    const y =
      gridTopY +
      ((this.c + this.r) * sl) / 2 -
      (sl * this.z + this.zOffset * 10) +
      moveY;

    const points = [];
    for (let angle = PI / 6; angle < PI * 2; angle += PI / 3) {
      points.push(createVector(x + cos(angle) * sl, y + sin(angle) * sl));
    }

    stroke(50, 50, 50);
    strokeWeight(0.5);

    const cubeColor = this.getColor();

    fill(
      cubeColor.r * 0.85 * (1 + highLevel * 0.5),
      cubeColor.g * 0.85 * (1 + highLevel * 0.5),
      cubeColor.b * 0.85 * (1 + highLevel * 0.5),
      255 * opacity
    );
    quad(
      x,
      y,
      points[5].x,
      points[5].y,
      points[0].x,
      points[0].y,
      points[1].x,
      points[1].y
    );

    fill(
      cubeColor.r * 0.92 * (1 + midLevel * 5.5),
      cubeColor.g * 0.92 * (1 + midLevel * 0.5),
      cubeColor.b * 0.92 * (1 + midLevel * 0.5),
      255 * opacity
    );
    quad(
      x,
      y,
      points[1].x,
      points[1].y,
      points[2].x,
      points[2].y,
      points[3].x,
      points[3].y
    );

    fill(
      cubeColor.r * (1 + bassLevel * 3.5),
      cubeColor.g * (1 + bassLevel * 0.5),
      cubeColor.b * (1 + bassLevel * 1.5),
      255 * opacity
    );
    quad(
      x,
      y,
      points[3].x,
      points[3].y,
      points[4].x,
      points[4].y,
      points[5].x,
      points[5].y
    );
  }

  updateAudioReactivity(bass, mid, high) {
    this.zOffset = map(randomGaussian(0, 1), -1, 1, 0, high);
  }
}

function generatePattern() {
  for (let layer = 0; layer < 3; layer++) {
    const ringSize = 3 + layer;

    for (let i = -ringSize; i <= ringSize; i++) {
      for (let j = -ringSize; j <= ringSize; j++) {
        if (abs(i) === ringSize || abs(j) === ringSize) {
          if (abs(i) === abs(j) && random() < 0.4) continue;
          const size = map(noise(i * 0.5, j * 0.5, layer), 0, 1, 0.8, 1.2);
          cubes.push(new IsoCube(i, j, layer, size));
        }
      }
    }

    const decorCount = 5 + layer * 2;
    for (let i = 0; i < decorCount; i++) {
      const angle = (TWO_PI * i) / decorCount;
      const radius = ringSize - 1;
      const x = cos(angle) * radius;
      const y = sin(angle) * radius;
      cubes.push(new IsoCube(x, y, layer, 0.7));
    }
  }

  cubes.sort((a, b) => {
    const depthA = a.z * 1000 + a.r + a.c;
    const depthB = b.z * 1000 + b.r + b.c;
    return depthA - depthB;
  });
}

function setup() {
  createCanvas(1080, 1080);
  noSmooth(); // Disable anti-aliasing for better performance
  frameRate(30); // Match the frame rate used in analysis
  gridTopX = width / 2;
  gridTopY = height / 2;
  generatePattern();
  console.log("Setup complete");
  lastFrameTime = millis();
}

function updateAudioLevels() {
  if (!window.audioData) return;

  // Ensure we don't go beyond the audio data length
  currentFrame = min(currentFrame, window.audioData.length - 1);

  const frame = window.audioData[currentFrame];
  if (frame) {
    bassLevel = frame.bass;
    midLevel = frame.mid;
    highLevel = frame.high;

    cubes.forEach((cube) => {
      cube.updateAudioReactivity(bassLevel, midLevel, highLevel);
    });
  }
}

function draw() {
  // Strict frame timing
  const currentTime = millis();
  if (currentTime - lastFrameTime < frameInterval) {
    return; // Skip this frame if not enough time has passed
  }

  // Update frame counter based on exact timing
  const elapsedFrames = floor((currentTime - lastFrameTime) / frameInterval);
  currentFrame += elapsedFrames;
  lastFrameTime = currentTime;

  updateAudioLevels();

  background(85, 85, 85);

  const cycleLength = log(30) / zoomSpeed;
  const normalizedTime = (time % cycleLength) / cycleLength;

  const scaleRatio = 0.5;
  const scaleMultiplier = map(normalizedTime, 0, 1, 5, 30);

  const currentScale = BASE_SCALE * scaleMultiplier;

  for (let i = 0; i < 7; i++) {
    const patternScale = currentScale * pow(scaleRatio, i);
    const opacity = 0.7;

    for (const cube of cubes) {
      cube.draw(patternScale, opacity);
    }
  }

  time += 1;
}

function windowResized() {
  resizeCanvas(1080, 1080);
  gridTopX = width / 2;
  gridTopY = height / 2;
}
