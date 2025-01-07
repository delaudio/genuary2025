// Wait for page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScene);
} else {
  initScene();
}

function initScene() {
  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, 1080 / 1080, 0.1, 1000);
    camera.position.z = 50;

    const container = document.getElementById("container");
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1080, 1080);
    container.appendChild(renderer.domElement);

    const PARTICLE_COUNT = 1000000;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const frequencies = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    // Create a more structured initial distribution
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const layer = Math.floor(Math.random() * 5);
      const baseRadius = 10 + layer * 8;

      const radiusVariation = (Math.random() - 0.5) * 4;
      const radius = baseRadius + radiusVariation;

      const spiralTightness = 0.1;
      const theta = (i / PARTICLE_COUNT) * Math.PI * 20 + layer * Math.PI * 0.5;
      const spiralRadius = radius + theta * spiralTightness;

      positions[i * 3] = Math.cos(theta) * spiralRadius;
      positions[i * 3 + 1] = Math.sin(theta) * spiralRadius;
      positions[i * 3 + 2] = (layer - 2) * 2;

      scales[i] = 0.05 + layer * 0.01 + Math.random() * 0.02;
      frequencies[i] = 0.7 + layer * 0.1 + Math.random() * 0.3;
      phases[i] = theta + Math.random() * Math.PI;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute(
      "frequency",
      new THREE.BufferAttribute(frequencies, 1)
    );
    geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
      },
      vertexShader: `
        attribute float scale;
        attribute float frequency;
        attribute float phase;
        uniform float time;
        uniform float bass;
        uniform float mid;
        
        #define PI 3.14159265359
        
        vec2 lissajous(float t, float a, float b, float delta) {
            return vec2(
                sin(a * t),
                sin(b * t + delta)
            );
        }
        
        void main() {
            vec3 pos = position;
            float t = time * frequency + phase;
            
            float cycleTime = 10.0;
            float patternTime = time / cycleTime;
            float currentPhase = floor(mod(patternTime, 6.0));
            float nextPhase = mod(currentPhase + 1.0, 6.0);
            float blend = fract(patternTime);
            
            vec2 currentPattern, nextPattern;
            float phaseDiff1 = bass * PI * 2.0;
            float phaseDiff2 = mid * PI * 2.0;
            float scale1 = 20.0 + bass * 25.0;
            float scale2 = 20.0 + mid * 25.0;
            
            if(currentPhase < 1.0) {
                currentPattern = lissajous(t, 1.0, 1.0, PI * 0.5) * scale1;
            } else if(currentPhase < 2.0) {
                currentPattern = lissajous(t, 2.0, 1.0, 0.0) * scale1;
            } else if(currentPhase < 3.0) {
                currentPattern = lissajous(t, 3.0, 2.0, PI * 0.25) * scale1;
            } else if(currentPhase < 4.0) {
                currentPattern = lissajous(t, 5.0, 4.0, PI * 0.5) * scale1;
            } else if(currentPhase < 5.0) {
                currentPattern = lissajous(t, 3.0, 1.0, PI * 0.3) * scale1;
            } else {
                currentPattern = lissajous(t, 4.0, 3.0, PI * 0.25) * scale1;
            }
            
            if(nextPhase < 1.0) {
                nextPattern = lissajous(t, 1.0, 1.0, PI * 0.5) * scale2;
            } else if(nextPhase < 2.0) {
                nextPattern = lissajous(t, 2.0, 1.0, 0.0) * scale2;
            } else if(nextPhase < 3.0) {
                nextPattern = lissajous(t, 3.0, 2.0, PI * 0.25) * scale2;
            } else if(nextPhase < 4.0) {
                nextPattern = lissajous(t, 5.0, 4.0, PI * 0.5) * scale2;
            } else if(nextPhase < 5.0) {
                nextPattern = lissajous(t, 3.0, 1.0, PI * 0.3) * scale2;
            } else {
                nextPattern = lissajous(t, 4.0, 3.0, PI * 0.25) * scale2;
            }
            
            vec2 blendedPattern = mix(currentPattern, nextPattern, blend);
            
            float transitionPeak = sin(blend * PI);
            float audioIntensity = (bass + mid) * 0.5;
            float transitionImpulse = transitionPeak * audioIntensity;
            
            float distanceFromCenter = length(pos.xy) / 40.0;
            float falloff = smoothstep(1.0, 0.0, distanceFromCenter);
            
            float audioImpulse = abs(bass - mid) * 2.0;
            float explosiveForce = (audioImpulse + transitionImpulse) * falloff * 20.0;
            vec2 radialForce = normalize(pos.xy) * explosiveForce;
            
            pos.xy += blendedPattern * falloff;
            pos.xy += radialForce;
            
            float zDisplacement = sin(t * 2.0) * cos(t) * 15.0 * audioIntensity * falloff;
            zDisplacement += transitionImpulse * 10.0 * sin(t);
            pos.z += zDisplacement;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            float sizeVariation = audioIntensity * audioIntensity + transitionImpulse * 0.5;
            float size = scale * (0.2 + sizeVariation * 0.8);
            float centerBoost = (1.0 - falloff) * 0.2;
            gl_PointSize = size * (20.0 / -mvPosition.z) * (1.0 - centerBoost);
        }
      `,
      fragmentShader: `
        uniform float bass;
        uniform float mid;
        uniform float time;

        void main() {
            float r = length(gl_PointCoord - vec2(0.5));
            if (r > 0.5) discard;

            vec3 bassColor = vec3(0.8, 0.2, 0.3);
            vec3 midColor = vec3(0.2, 0.6, 0.8);
            vec3 quietColor = vec3(0.6);

            vec3 color = quietColor;
            color = mix(color, bassColor, bass);
            color = mix(color, midColor, mid);

            float hueShift = sin(time * 0.2) * 0.2;
            color = mix(color, vec3(color.g, color.b, color.r), hueShift);

            float brightness = 0.5 + (bass + mid) * 0.5;
            
            gl_FragColor = vec4(color * brightness, 0.8);
        }
      `,
      transparent: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    function draw() {
      try {
        if (!window.audioData || typeof window.frameNumber === "undefined") {
          console.warn("Waiting for audio data...");
          return false;
        }

        const frame = window.frameNumber;
        const currentFrame = window.audioData[frame % window.audioData.length];

        material.uniforms.time.value = (frame / 30) * Math.PI; // Assuming 30fps
        material.uniforms.bass.value = currentFrame.bass;
        material.uniforms.mid.value = currentFrame.mid;

        renderer.render(scene, camera);
        return true; // Signal successful render
      } catch (error) {
        console.error("Error in draw:", error);
        return false;
      }
    }

    // Export the draw function and signal ready state
    window.draw = draw;
    window.sceneReady = true;

    // Try initial render
    draw();
  } catch (error) {
    console.error("Error initializing scene:", error);
    window.sceneReady = false;
  }
}
