const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

async function renderAnimation(durationInSeconds = 10, fps = 30) {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1080,
    height: 1080,
  });

  // Load the HTML file
  const htmlPath = path.join(__dirname, "..", "src", "040124.html");
  console.log("Loading HTML from:", htmlPath);
  await page.goto(`file:${htmlPath}`);

  // Wait for p5.js canvas to be created and setup to complete
  await page.waitForFunction(() => {
    return (
      document.querySelector("canvas") !== null &&
      typeof window.draw === "function" &&
      typeof window.setup === "function"
    );
  });

  // Give extra time for initial setup
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("Canvas is ready");

  // Create output directories
  const framesDir = path.join(__dirname, "..", "frames");
  const outputDir = path.join(__dirname, "..", "output");
  await fs.mkdir(framesDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const totalFrames = durationInSeconds * fps;

  // Inject frame capture code
  await page.evaluate((fps) => {
    return new Promise((resolve) => {
      const originalDraw = window.draw;
      window.frameCount = 0;

      window.draw = function () {
        originalDraw();
        const canvas = document.querySelector("canvas");
        if (canvas) {
          try {
            window.frameData = canvas.toDataURL("image/png");
          } catch (e) {
            console.error("Error capturing frame:", e);
          }
        }
      };

      // Set frame rate
      window.frameRate(fps);
      setTimeout(resolve, 100); // Give time for the new draw function to take effect
    });
  }, fps);

  console.log("Starting frame capture...");

  // Capture frames
  for (let i = 0; i < totalFrames; i++) {
    try {
      // Wait for next frame and animation to update
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 1000 / 60); // Add small delay to ensure frame renders
            });
          })
      );

      // Get frame data
      const frameData = await page.evaluate(() => window.frameData);

      if (!frameData) {
        console.error("No frame data received for frame", i);
        continue;
      }

      const base64Data = frameData.replace(/^data:image\/png;base64,/, "");
      const framePath = path.join(
        framesDir,
        `frame_${String(i).padStart(5, "0")}.png`
      );

      await fs.writeFile(framePath, base64Data, "base64");
      console.log(`Captured frame ${i + 1}/${totalFrames}`);
    } catch (error) {
      console.error(`Error capturing frame ${i}:`, error);
    }
  }

  await browser.close();

  console.log("Rendering video...");
  const outputPath = path.join(outputDir, "output.mp4");
  const { exec } = require("child_process");
  const ffmpegCommand = `ffmpeg -framerate ${fps} -i "${path.join(
    framesDir,
    "frame_%05d.png"
  )}" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`;

  return new Promise((resolve, reject) => {
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`FFmpeg error: ${error}`);
        reject(error);
        return;
      }
      console.log(`Video rendering complete: ${outputPath}`);
      resolve();
    });
  });
}

// Run the renderer with error handling
renderAnimation(10, 30).catch((error) => {
  console.error("Rendering failed:", error);
  process.exit(1);
});
