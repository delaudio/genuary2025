import { useRef, useEffect } from "react";
import { useCurrentFrame } from "remotion";
import p5 from "p5";

const scriptText = `export const P5Sketch030124 = ({ width = 1920, height = 1080 }) => {

  const sketchRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const p5Instance = useRef<p5 | null>(null);
  const charsRef = useRef<any[]>([]);
  const PHASE1 = 300;
  const PHASE2 = 500;
  const TOTAL = 600;

  useEffect(() => {
    if (!sketchRef.current) return;
    const sketch = (p: p5) => {
      p.setup = () => setupSketch(p, charsRef.current, width, height);
      p.draw = () => {
        p.background(30);
        p.fill(212, 212, 212);
        charsRef.current.forEach((char) => {
          if (frame <= PHASE1) {
            char.moveToRandom(p.map(frame, 0, PHASE1, 0, 1, true), p);
          } else if (frame <= PHASE2) {
            char.moveBack(p.map(frame, PHASE1, PHASE2, 0, 1, true), p);
          } else {
            char.moveToRandom(p.map(frame, PHASE2, TOTAL, 0, 1, true), p);
          }
          char.display(p);
        });
      };
    };

    p5Instance.current = new p5(sketch, sketchRef.current);

    return () => {
      p5Instance.current?.remove();
      charsRef.current = [];
    };
  }, [width, height, frame]);

  useEffect(() => p5Instance.current?.draw(), [frame]);

  return <div ref={sketchRef} />;
};`;

class Char {
  constructor(char, x, y, p) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
    this.currentX = x;
    this.currentY = y;
    this.randomX = p.random(p.width);
    this.randomY = p.random(p.height);
  }

  moveToRandom(t, p) {
    const slowT = p.pow(t, 3); // Add cubic easing
    this.currentX = p.lerp(this.originalX, this.randomX, slowT);
    this.currentY = p.lerp(this.originalY, this.randomY, slowT);
  }

  moveBack(t, p) {
    const slowT = p.pow(t, 3); // Add cubic easing
    this.currentX = p.lerp(this.randomX, this.originalX, slowT);
    this.currentY = p.lerp(this.randomY, this.originalY, slowT);
  }

  display(p) {
    p.drawingContext.fillText(this.char, this.currentX, this.currentY);
  }
}

const setupSketch = (p, chars, width, height) => {
  p.createCanvas(width, height);
  p.frameRate(60);
  p.textFont("Courier New");
  p.textSize(16);
  p.noLoop();

  const lines = scriptText.split("\n");
  let y = 60;
  lines.forEach((line, i) => {
    let x = 60;
    const num = (i + 1).toString().padStart(2, " ") + " ";
    [...num, ...line].forEach((char) => {
      chars.push(new Char(char, x, y, p));
      x += p.textWidth(char);
    });
    y += 20;
  });
};

export const P5Sketch030124 = ({ width = 1920, height = 1080 }) => {
  
  const sketchRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const p5Instance = useRef<p5 | null>(null);
  const charsRef = useRef<any[]>([]);
  const PHASE1 = 300;
  const PHASE2 = 500;
  const TOTAL = 600;

  useEffect(() => {
    if (!sketchRef.current) return;
    const sketch = (p: p5) => {
      p.setup = () => setupSketch(p, charsRef.current, width, height);
      p.draw = () => {
        p.background(30);
        p.fill(212, 212, 212);
        charsRef.current.forEach((char) => {
          if (frame <= PHASE1) {
            char.moveToRandom(p.map(frame, 0, PHASE1, 0, 1, true), p);
          } else if (frame <= PHASE2) {
            char.moveBack(p.map(frame, PHASE1, PHASE2, 0, 1, true), p);
          } else {
            char.moveToRandom(p.map(frame, PHASE2, TOTAL, 0, 1, true), p);
          }
          char.display(p);
        });
      };
    };

    p5Instance.current = new p5(sketch, sketchRef.current);

    return () => {
      p5Instance.current?.remove();
      charsRef.current = [];
    };
  }, [width, height, frame]);

  useEffect(() => p5Instance.current?.draw(), [frame]);

  return <div ref={sketchRef} />;
};

export default P5Sketch030124;
