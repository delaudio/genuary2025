const puppeteer = require("puppeteer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const path = require("path");

async function renderAnimation(durationInSeconds = 15, fps = 30) {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const framesDir = path.join(__dirname, "..", "frames");
  const outputDir = path.join(__dirname, "..", "output");
  await fs.mkdir(framesDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const tempHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          #ascii { font-family: monospace; line-height: 1; white-space: pre; }
        </style>
      </head>
      <body>
        <div id="ascii"></div>
        <script>
          ${await fs.readFile(path.join(__dirname, "sketch.js"), "utf8")}
        </script>
      </body>
    </html>
  `;

  const htmlPath = path.join(framesDir, "index.html");
  await fs.writeFile(htmlPath, tempHtml);

  await page.goto(`file://${htmlPath}`);
  await page.waitForSelector("#ascii");

  console.log("Starting frame capture...");
  const totalFrames = durationInSeconds * fps;

  for (let i = 0; i < totalFrames; i++) {
    const framePath = path.join(
      framesDir,
      `frame_${String(i).padStart(5, "0")}.png`
    );
    await page.screenshot({
      path: framePath,
      type: "png",
    });
    console.log(`Captured frame ${i + 1}/${totalFrames}`);
  }

  await browser.close();

  const outputPath = path.join(outputDir, "final_output.mp4");
  const audioPath = path.join(__dirname, "polar.wav");

  try {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, "frame_%05d.png"))
        .inputFPS(fps)
        .input(audioPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-preset fast", "-crf 23", "-pix_fmt yuv420p"])
        .output(outputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    console.log("Rendering complete!");
  } catch (error) {
    console.error("Rendering error:", error);
    throw error;
  }
}

renderAnimation(15, 30).catch(console.error);
