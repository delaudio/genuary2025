const puppeteer = require("puppeteer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const path = require("path");

async function processFrame(page, frameIndex, audioFrameData, framesDir) {
  const paddedIndex = String(frameIndex).padStart(5, "0");
  const inputPath = path.join(
    process.cwd(),
    "movie_frames",
    `frame_${paddedIndex}.png`
  );
  const outputPath = path.join(framesDir, `frame_${paddedIndex}.png`);

  try {
    // Read and convert the input frame
    const imageBuffer = await fs.readFile(inputPath);
    const base64Image = imageBuffer.toString("base64");

    // Process the frame using p5.js
    const frameData = await page.evaluate(
      async (imgData, audioData) => {
        return await window.processFrame(imgData, audioData);
      },
      base64Image,
      audioFrameData
    );

    if (!frameData) {
      throw new Error("No frame data generated");
    }

    // Save the processed frame
    const base64Data = frameData.replace(/^data:image\/png;base64,/, "");
    await fs.writeFile(outputPath, base64Data, "base64");

    return outputPath;
  } catch (error) {
    throw new Error(`Frame processing failed: ${error.message}`);
  }
}

async function renderAnimation(durationInSeconds = 15, fps = 30) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  // Enable console log from the page
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("error", (err) => console.error("PAGE ERROR:", err));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

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

  // Create HTML template
  const tempHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
        <style>
          body { margin: 0; overflow: hidden; background: #000; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <script>${await fs.readFile(
          path.join(__dirname, "sketch.js"),
          "utf8"
        )}</script>
      </body>
    </html>
  `;

  const htmlPath = path.join(framesDir, "index.html");
  await fs.writeFile(htmlPath, tempHtml);
  await page.goto(`file://${htmlPath}`);

  // Wait for initial setup
  await page.waitForFunction(() => window.isSketchReady, { timeout: 10000 });

  console.log("Starting frame processing...");
  const totalFrames = durationInSeconds * fps;

  for (let i = 0; i < totalFrames; i++) {
    console.log(`Processing frame ${i + 1}/${totalFrames}`);
    await processFrame(page, i, audioData[i], framesDir);
  }

  await browser.close();

  // Combine frames into video
  console.log("Rendering final video...");
  const outputPath = path.join(outputDir, "output.mp4");
  const audioPath = path.join(__dirname, "gigi.wav");
  const finalOutputPath = path.join(outputDir, "final_output.mp4");

  try {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, "frame_%05d.png"))
        .inputFPS(fps)
        .videoCodec("libx264")
        .outputOptions(["-preset fast", "-crf 23", "-pix_fmt yuv420p"])
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
        .audioCodec("aac")
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
