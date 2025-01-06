#!/bin/bash

# Create output filename with timestamp
timestamp=$(date +%Y%m%d_%H%M%S)
output_file="recording_${timestamp}.mp4"

# Get screen dimensions using system_profiler
screen_info=$(system_profiler SPDisplaysDataType | grep Resolution)
screen_width=$(echo $screen_info | grep -o '[0-9]* x' | grep -o '[0-9]*')
screen_height=$(echo $screen_info | grep -o 'x [0-9]*' | grep -o '[0-9]*')

# Calculate center position for cropping
x_offset=$(( ($screen_width - 1080) / 2 ))
y_offset=$(( ($screen_height - 1080) / 2 ))

# Record the screen and crop to center
ffmpeg \
  -hide_banner \
  -f avfoundation \
  -i "3:" \
  -t 15 \
  -vf "crop=1080:1080:$x_offset:$y_offset" \
  -c:v libx264 \
  -preset ultrafast \
  -crf 18 \
  "${output_file}"

echo "Recording saved as: ${output_file}"