const puppeteer = require("puppeteer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const path = require("path");

async function renderAnimation(durationInSeconds = 15, fps = 30) {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  // Ensure directories exist
  const framesDir = path.join(__dirname, "..", "frames");
  const outputDir = path.join(__dirname, "..", "output");
  await fs.mkdir(framesDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  // Read the audio data
  console.log("Reading audio data...");
  const audioDataPath = path.join(__dirname, "audio-data.json");
  const audioData = JSON.parse(await fs.readFile(audioDataPath, "utf8"));
  console.log(`Loaded ${audioData.length} frames of audio data`);

  // Create HTML with frame number injection
  const tempHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script>
          window.audioData = ${JSON.stringify(audioData)};
          window.frameNumber = 0;  // Will be updated for each frame
        </script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
        <style>
          body { margin: 0; overflow: hidden; background: #000; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <script>
          ${await fs.readFile(path.join(__dirname, "sketch.js"), "utf8")}
        </script>
      </body>
    </html>
  `;

  const htmlPath = path.join(framesDir, "index.html");
  await fs.writeFile(htmlPath, tempHtml);

  await page.goto(`file://${htmlPath}`);
  await page.waitForFunction(
    () => {
      return (
        document.querySelector("canvas") !== null &&
        typeof window.draw === "function" &&
        typeof window.setup === "function" &&
        window.audioData !== undefined
      );
    },
    { timeout: 30000 }
  );

  console.log("Starting frame capture...");
  const totalFrames = durationInSeconds * fps;

  for (let i = 0; i < totalFrames; i++) {
    // Set exact frame number and capture frame
    await page.evaluate((frameNum) => {
      window.frameNumber = frameNum;
      return new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          const canvas = document.querySelector("canvas");
          window.frameData = canvas.toDataURL("image/png");
          resolve();
        });
      });
    }, i);

    const frameData = await page.evaluate(() => window.frameData);
    const base64Data = frameData.replace(/^data:image\/png;base64,/, "");
    const framePath = path.join(
      framesDir,
      `frame_${String(i).padStart(5, "0")}.png`
    );
    await fs.writeFile(framePath, base64Data, "base64");

    console.log(`Captured frame ${i + 1}/${totalFrames}`);
  }

  await browser.close();

  // Render final video
  const outputPath = path.join(outputDir, "output.mp4");
  const audioPath = path.join(__dirname, "ecoli.wav");
  const finalOutputPath = path.join(outputDir, "final_output.mp4");

  try {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, "frame_%05d.png"))
        .inputFPS(fps)
        .videoCodec("libx264")
        .outputOptions([
          "-preset fast",
          "-crf 23",
          "-pix_fmt yuv420p",
          "-force_key_frames expr:gte(t,n_forced*1/30)", // Force keyframe every frame
        ])
        .output(outputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(outputPath)
        .input(audioPath)
        .videoCodec("copy")
        .audioCodec("pcm_s16le")
        .outputOptions([
          "-vsync 1", // Hard synchronization
          "-map 0:v:0", // Video from first input
          "-map 1:a:0", // Audio from second input
          "-enc_time_base 1/30", // Force exact timing
        ])
        .output(finalOutputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    await fs.unlink(outputPath).catch(console.error);
    console.log("Rendering complete!");
  } catch (error) {
    console.error("Rendering error:", error);
    throw error;
  }
}

renderAnimation(15, 30).catch(console.error);
