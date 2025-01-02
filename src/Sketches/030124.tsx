import { useRef, useEffect } from "react";
import { useCurrentFrame } from "remotion";
import p5 from "p5";

interface P5Sketch030124Props {
  readonly width?: number;
  readonly height?: number;
}

export const P5Sketch030124 = ({
  width = 1920,
  height = 1080,
}: P5Sketch030124Props) => {
  const sketchRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();

  useEffect(() => {
    if (!sketchRef.current) return;

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(width, height);
        p.colorMode(p.HSB);
        p.noStroke();
      };

      p.draw = () => {
        p.background(0);

        // Create an animated pattern based on the current frame
        const numCircles = 12;
        const radius = 400;

        for (let i = 0; i < numCircles; i++) {
          const angle = frame * 0.02 + (i * (2 * Math.PI)) / numCircles;
          const x = p.width / 2 + radius * Math.cos(angle);
          const y = p.height / 2 + radius * Math.sin(angle);

          const hue = (frame + i * 30) % 360;
          p.fill(hue, 80, 100);

          const size = 100 + Math.sin(frame * 0.05 + i) * 50;
          p.ellipse(x, y, size, size);
        }
      };
    };

    const p5Instance = new p5(sketch, sketchRef.current);
    return () => p5Instance.remove();
  }, [frame, height, width]);

  return <div ref={sketchRef} />;
};
