let colors;
let frame = 0;
let patternColors = [];
const FIXED_SIZE = 90;
let time = 0;

function setup() {
  createCanvas(1080, 1920);
  frameRate(30);

  // Ensure colors are valid
  colors = [
    color(0) || color(0), // Fallback to black if color creation fails
    color(20) || color(20), // Very dark gray
    color(40) || color(40), // Dark gray
  ];

  // Initialize color grid with exact dimensions
  const cols = width / FIXED_SIZE;
  const rows = height / FIXED_SIZE;

  for (let y = 0; y < rows; y++) {
    patternColors[y] = [];
    for (let x = 0; x < cols; x++) {
      let selectedColor = random(colors);
      // Fallback to first color if random selection somehow returns invalid color
      if (
        !selectedColor ||
        (selectedColor._array && selectedColor._array.some(isNaN))
      ) {
        selectedColor = colors[0];
      }
      patternColors[y][x] = selectedColor;
    }
  }
}

function updateAudioLevels() {
  if (!window.audioData) return { bass: 0, mid: 0, high: 0 };

  if (typeof window.frameNumber !== "undefined") {
    frame = window.frameNumber;
  }

  frame = min(frame, window.audioData.length - 1);
  return window.audioData[frame];
}

function getStringOffset(x, y, time, audioLevels) {
  const stringPos = x / width;

  // Increase base amplitude from 4 to 8 or higher
  const amplitude =
    12 *
    ((1 - stringPos) * audioLevels.bass +
      // Add more pronounced sine wave influence with audio
      sin(stringPos * PI * 2) * audioLevels.mid + // Doubled frequency of sine
      stringPos * audioLevels.high);

  // Make the oscillation more dynamic
  return (
    amplitude *
    sin(
      y * 0.015 + // Increased y influence
        time * 0.15 + // Increased time influence for faster movement
        stringPos * PI * 2 // Added more waviness across horizontal position
    )
  );
}

function drawPattern(x, y, size, baseColor, time, audioLevels) {
  push();
  translate(x, y);
  noStroke();

  // Calculate number of gradient steps based on audio level
  const audioIntensity =
    (audioLevels.bass + audioLevels.mid + audioLevels.high) / 3;
  const minSteps = 2;
  const maxSteps = 15;
  const steps = floor(lerp(minSteps, maxSteps, audioIntensity));

  const stepSize = size / steps;

  for (let i = 0; i < steps; i++) {
    // Avoid division by zero and handle NaN
    let gradientPos = steps === 1 ? 0 : i / (steps - 1);
    if (isNaN(gradientPos)) gradientPos = 0;

    let gradientIntensity = gradientPos * audioIntensity;
    if (isNaN(gradientIntensity)) gradientIntensity = 0;

    // Clamp the gradient intensity to avoid extreme values
    const clampedIntensity = constrain(gradientIntensity, 0, 1);

    // Fallback to base color if we get NaN in lerpColor
    let stripeColor = lerpColor(baseColor, color(180), clampedIntensity);
    if (stripeColor._array && stripeColor._array.some(isNaN)) {
      stripeColor = baseColor; // Fallback to base color if any NaN values
    }

    fill(stripeColor);
    rect(i * stepSize, 0, stepSize + 1, size);
  }

  pop();
}

function draw() {
  const audioLevels = updateAudioLevels();
  background(30);
  noStroke();

  // Draw patterns
  const rows = height / FIXED_SIZE;
  const cols = width / FIXED_SIZE;

  for (let y = 0; y < height; y += FIXED_SIZE) {
    const row = floor(y / FIXED_SIZE);
    for (let x = 0; x < width; x += FIXED_SIZE) {
      const col = floor(x / FIXED_SIZE);
      drawPattern(x, y, FIXED_SIZE, patternColors[row][col], time, audioLevels);
    }
  }

  // Draw oscillating sewing lines
  stroke(239, 178, 31);
  const baseStrokeWeight = map(audioLevels.high, 0, 1, 2.5, 4);
  strokeWeight(baseStrokeWeight);

  // Draw vertical sewing lines
  for (let x = FIXED_SIZE; x <= width; x += FIXED_SIZE) {
    for (let row = 0; row < rows; row++) {
      const y1 = row * FIXED_SIZE + 5;
      const y2 = (row + 1) * FIXED_SIZE - 5;

      const offset1 = getStringOffset(x, y1, time, audioLevels);
      const offset2 = getStringOffset(x, y2, time, audioLevels);

      const segmentCount = 5;
      const segmentLength = (y2 - y1) / segmentCount;

      for (let i = 0; i < segmentCount; i++) {
        const t = i / segmentCount;
        const nextT = (i + 1) / segmentCount;

        const segY1 = lerp(y1, y2, t);
        const segY2 = lerp(y1, y2, t + 0.15);
        const segX1 = lerp(x + offset1, x + offset2, t);
        const segX2 = lerp(x + offset1, x + offset2, nextT);

        line(segX1, segY1, segX2, segY2);
      }
    }
  }

  time += 1;
}

function windowResized() {
  resizeCanvas(1080, 1920);
  const cols = width / FIXED_SIZE;
  const rows = height / FIXED_SIZE;

  for (let y = 0; y < rows; y++) {
    patternColors[y] = patternColors[y] || [];
    for (let x = 0; x < cols; x++) {
      patternColors[y][x] = patternColors[y][x] || random(colors);
    }
  }
}
