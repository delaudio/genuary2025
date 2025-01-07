let time = 0;
const gridSize = 50; // Make grid dimensions equal for square
let frame = 0;
let charSize;
let offsetX;
let offsetY;

// Using more varied characters for better visual definition
const chars = " .·:+*#▒█".split("");

function setup() {
  createCanvas(1080, 1080);
  noSmooth(); // Disable anti-aliasing for better performance
  frameRate(30); // Match the frame rate of the audio data
  textFont("monospace");
  calculateDimensions();
}

function calculateDimensions() {
  // Calculate the size of each character to fill the canvas
  charSize = width / gridSize;
  // Calculate offsets to center the grid
  offsetX = (width - gridSize * charSize) / 2;
  offsetY = (height - gridSize * charSize) / 2;
  textSize(charSize);
  textAlign(LEFT, TOP);
}

function updateAudioLevels() {
  if (!window.audioData) return;

  // Use the exact frame number from the renderer
  if (typeof window.frameNumber !== "undefined") {
    frame = window.frameNumber;
  }

  // Ensure we don't go beyond the audio data length
  frame = min(frame, window.audioData.length - 1);
}

function draw() {
  updateAudioLevels();

  // Get current audio frame data
  const currentFrame = window.audioData[frame];
  const bass = currentFrame.bass;
  const mid = currentFrame.mid;
  const high = currentFrame.high;

  background(0);

  // Draw each character individually to maintain proper spacing
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const xNorm = (x / gridSize) * 2 - 1;
      const yNorm = (y / gridSize) * 2 - 1;

      // Create wave patterns based on audio values
      const dist = sqrt(xNorm * xNorm + yNorm * yNorm);
      const angle = atan2(yNorm, xNorm);

      // Create more complex patterns using both distance and angle
      const bassWave = sin(dist * 3 + time * 0.1) * bass;
      const midWave = cos(dist * 5 + angle + time * 0.15) * mid;
      const highWave = sin(dist * 7 + angle * 2 + time * 0.2) * high;

      // Combine waves with weights
      const z = (bassWave * 0.5 + midWave * 0.3 + highWave * 0.2) * 0.5 + 0.5;

      // Map to characters
      const charIndex = floor(constrain(z, 0, 0.999) * chars.length);

      // Calculate position for this character
      const xPos = offsetX + x * charSize;
      const yPos = offsetY + y * charSize;

      // Draw the character
      fill(255);
      noStroke();
      text(chars[charIndex], xPos, yPos);
    }
  }

  // Update time
  time += 1;
}

function windowResized() {
  resizeCanvas(1080, 1080);
  calculateDimensions();
}
