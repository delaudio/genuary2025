# Genuary 2025 - P5.js + React + Remotion

Daily creative coding sketches for Genuary 2025, built with P5.js, React, and Remotion for video export.

## About

This repository contains my submissions for [Genuary 2025](https://genuary.art/), a month-long creative coding challenge. Each sketch is built using:

- P5.js for creative coding
- React for component architecture
- Remotion for high-quality video export

## Project Structure

```
/src
  /components
    /sketches          # Daily P5.js sketches
    /compositions      # Remotion video compositions
  /utils              # Helper functions
  /constants          # Configuration and constants
```

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/genuary2025
cd genuary2025
```

2. Install dependencies:

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

## Creating Sketches

1. Create a new P5.js sketch in `/src/components/sketches`
2. Create a Remotion composition in `/src/components/compositions`
3. Add your composition to `src/Root.tsx`

Example sketch structure:

```jsx
import { useEffect } from "react";
import p5 from "p5";

const Sketch = () => {
  useEffect(() => {
    const s = (p) => {
      p.setup = () => {
        // Setup code
      };

      p.draw = () => {
        // Draw code
      };
    };

    new p5(s);
  }, []);

  return <div id="sketch-container" />;
};
```

## Rendering Videos

1. Set up your composition in `Root.tsx`:

```jsx
<Composition
  id="sketch-name"
  component={SketchComponent}
  durationInFrames={150}
  fps={30}
  width={1920}
  height={1080}
/>
```

2. Render the video:

```bash
npm run dev
```

Render the composition you want from the sidebar

## Contributing

Feel free to fork and submit pull requests. Please follow the existing code style.

## License

MIT License. See LICENSE file for details.