const TAU = 2 * Math.PI;
const curves = [];
const chars = " .:-=+*#%@".split("");
const colors = ["#FFFFFF", "#0000FF"];

function getDimensions() {
  // Using exact dimensions for video
  const width = 1080;
  const height = 1080;
  const charSize = Math.max(6, Math.floor(width / 60)); // Reduced character size for more characters
  document.getElementById("ascii").style.fontSize = `${charSize}px`;
  return {
    width: Math.floor(width / charSize),
    height: Math.floor(height / charSize),
  };
}

let { width, height } = getDimensions();

class Curve {
  constructor(index) {
    this.a = TAU / 2 + (index * TAU) / 4;
    this.b = TAU / 3 + (index * TAU) / 4;
    this.c = TAU / 6 + (index * TAU) / 8;
    this.delta1 = (TAU * index) / 2;
    this.delta2 = (TAU * (index + 1)) / 2;
    this.rotX = Math.random() * TAU;
    this.rotY = Math.random() * TAU;
    this.rotZ = Math.random() * TAU;
    this.rotSpeed = TAU / TAU ** 4;
    this.color = colors[index];
    // Increased scale factors to fill more space
    this.scaleY = 3.5;
    this.scaleX = 3.5;
  }

  rotate3D(x, y, z) {
    let y1 = y * Math.cos(this.rotX) - z * Math.sin(this.rotX);
    let z1 = y * Math.sin(this.rotX) + z * Math.cos(this.rotX);
    let x2 = x * Math.cos(this.rotY) + z1 * Math.sin(this.rotY);
    let z2 = -x * Math.sin(this.rotY) + z1 * Math.cos(this.rotY);
    let x3 = x2 * Math.cos(this.rotZ) - y1 * Math.sin(this.rotZ);
    let y3 = x2 * Math.sin(this.rotZ) + y1 * Math.cos(this.rotZ);
    return [x3 * this.scaleX, y3 * this.scaleY, z2 * this.scaleY];
  }

  project(x, y, z) {
    // Modified projection to reduce perspective effect
    const scale = TAU / (TAU / 2 + z);
    return [x * scale, y * scale];
  }

  render() {
    const buffer = Array(width * height).fill(" ");
    const zBuffer = Array(width * height).fill(Infinity);

    // Increased number of points for smoother curves
    for (let t = 0; t < TAU; t += TAU / 800) {
      let x = Math.sin(this.a * t + this.delta1);
      let y = Math.sin(this.b * t + this.delta2);
      let z = Math.sin(this.c * t);

      [x, y, z] = this.rotate3D(x, y, z);
      const [projX, projY] = this.project(x, y, z);

      // Modified screen position calculation to use more space
      const screenX = Math.floor(((projX + 1.2) * width) / 2.4);
      const screenY = Math.floor(((projY + 1.2) * height) / 2.4);

      if (screenX >= 0 && screenX < width && screenY >= 0 && screenY < height) {
        const idx = screenY * width + screenX;
        if (z < zBuffer[idx]) {
          const intensity = Math.max(0, Math.min(1, (TAU / 2 + z) / TAU));
          const charIndex = Math.floor(intensity * (chars.length - 1));
          buffer[idx] = chars[charIndex] || " ";
          zBuffer[idx] = z;
        }
      }
    }
    return { buffer, zBuffer };
  }

  update() {
    this.rotX += this.rotSpeed;
    this.rotY += (this.rotSpeed * TAU) / 8;
    this.rotZ += (this.rotSpeed * TAU) / 10;
  }
}

for (let i = 0; i < 2; i++) {
  curves.push(new Curve(i));
}

const asciiElement = document.getElementById("ascii");

function animate() {
  const finalBuffer = Array(width * height).fill(" ");
  const finalZBuffer = Array(width * height).fill(Infinity);
  const colorBuffer = Array(width * height).fill(0);

  curves.forEach((curve, idx) => {
    const { buffer, zBuffer } = curve.render();
    for (let i = 0; i < buffer.length; i++) {
      if (zBuffer[i] < finalZBuffer[i]) {
        finalBuffer[i] = buffer[i];
        finalZBuffer[i] = zBuffer[i];
        colorBuffer[i] = idx;
      }
    }
    curve.update();
  });

  let output = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const char = finalBuffer[idx];
      const color = colors[colorBuffer[idx]];
      output += `<span style="color: ${color}">${char}</span>`;
    }
    output += "\n";
  }

  asciiElement.innerHTML = output;
  requestAnimationFrame(animate);
}

animate();