const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const path = require("path");

async function analyzeAudio(inputFile, fps = 30, duration = 15) {
  const audioPath = path.join(__dirname, inputFile);
  const totalFrames = fps * duration;

  console.log("Starting audio analysis...");

  return new Promise((resolve, reject) => {
    // Create temporary files for each frequency band
    const bassFile = path.join(__dirname, "temp_bass.raw");
    const midFile = path.join(__dirname, "temp_mid.raw");
    const highFile = path.join(__dirname, "temp_high.raw");

    // Process audio with FFmpeg
    ffmpeg(audioPath)
      .addOptions([
        // Split audio into three streams
        "-filter_complex",
        "[0:a]asplit=3[a][b][c];" +
          // Low frequencies (20-250Hz)
          "[a]lowpass=f=250,highpass=f=20[bass];" +
          // Mid frequencies (250-4000Hz)
          "[b]lowpass=f=4000,highpass=f=250[mid];" +
          // High frequencies (4000-20000Hz)
          "[c]lowpass=f=20000,highpass=f=4000[high]",
      ])
      .output(bassFile)
      .outputOptions([
        "-map",
        "[bass]",
        "-f",
        "f32le",
        "-acodec",
        "pcm_f32le",
        "-ar",
        "44100",
      ])
      .output(midFile)
      .outputOptions([
        "-map",
        "[mid]",
        "-f",
        "f32le",
        "-acodec",
        "pcm_f32le",
        "-ar",
        "44100",
      ])
      .output(highFile)
      .outputOptions([
        "-map",
        "[high]",
        "-f",
        "f32le",
        "-acodec",
        "pcm_f32le",
        "-ar",
        "44100",
      ])
      .on("end", async () => {
        try {
          // Read the raw audio data
          const [bassData, midData, highData] = await Promise.all([
            fs.readFile(bassFile),
            fs.readFile(midFile),
            fs.readFile(highFile),
          ]);

          // Convert raw data to float32 arrays
          const bassArray = new Float32Array(bassData.buffer);
          const midArray = new Float32Array(midData.buffer);
          const highArray = new Float32Array(highData.buffer);

          // Calculate frames
          const samplesPerFrame = Math.floor(bassArray.length / totalFrames);
          const audioFrames = [];

          for (let frame = 0; frame < totalFrames; frame++) {
            const start = frame * samplesPerFrame;
            const end = start + samplesPerFrame;

            const bassEnergy = calculateEnergy(bassArray.slice(start, end));
            const midEnergy = calculateEnergy(midArray.slice(start, end));
            const highEnergy = calculateEnergy(highArray.slice(start, end));

            audioFrames.push({
              frame,
              time: frame / fps,
              bass: normalizeEnergy(bassEnergy),
              mid: normalizeEnergy(midEnergy),
              high: normalizeEnergy(highEnergy),
            });
          }

          // Apply temporal smoothing
          const smoothedFrames = smoothFrames(audioFrames);

          // Save results
          const outputPath = path.join(__dirname, "audio-data.json");
          await fs.writeFile(
            outputPath,
            JSON.stringify(smoothedFrames, null, 2)
          );

          // Clean up temporary files
          await Promise.all([
            fs.unlink(bassFile),
            fs.unlink(midFile),
            fs.unlink(highFile),
          ]);

          console.log("Audio analysis complete");
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (err) => {
        console.error("FFmpeg Error:", err);
        reject(err);
      })
      .run();
  });
}

function calculateEnergy(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

function normalizeEnergy(energy) {
  // Adjust these values based on your audio characteristics
  const minEnergy = 0.01;
  const maxEnergy = 0.2;
  const normalized = (energy - minEnergy) / (maxEnergy - minEnergy);
  return Math.max(0, Math.min(1, normalized));
}

function smoothFrames(frames) {
  const windowSize = 3; // Number of frames to average
  return frames.map((frame, i) => {
    if (i < windowSize || i >= frames.length - windowSize) return frame;

    const window = frames.slice(i - windowSize, i + windowSize + 1);
    return {
      frame: frame.frame,
      time: frame.time,
      bass: averageValues(window, "bass"),
      mid: averageValues(window, "mid"),
      high: averageValues(window, "high"),
    };
  });
}

function averageValues(frames, key) {
  const sum = frames.reduce((acc, frame) => acc + frame[key], 0);
  return sum / frames.length;
}

// Run the analysis
analyzeAudio("icefall.wav", 30, 15).catch(console.error);
