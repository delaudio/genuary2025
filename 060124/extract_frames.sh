#!/bin/bash

# Input video file
input_file="recording_20250106_000501.mp4"

# Create output directory if it doesn't exist
mkdir -p movie_frames

# Extract frames using ffmpeg
ffmpeg \
  -hide_banner \
  -i "${input_file}" \
  -vf "fps=30" \
  -frame_pts 1 \
  "movie_frames/frame_%05d.png"

echo "Frames extracted to: movie_frames/"