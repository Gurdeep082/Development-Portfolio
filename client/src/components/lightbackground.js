import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const LightBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvasContainer = canvasRef.current; // Store the ref in a local variable

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // White background

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (canvasContainer) {
      canvasContainer.appendChild(renderer.domElement);
    }

    // Load a circular texture
    const textureLoader = new THREE.TextureLoader();
    const circleTexture = textureLoader.load(
      "https://threejs.org/examples/textures/sprites/circle.png"
    );

    // Create star geometry
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 11000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    // Random positions and fixed colors for stars
    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Randomly assign one of three fixed colors
      const colorType = Math.floor(Math.random() * 3);
      if (colorType === 0) {
        // Red
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.0;
        starColors[i * 3 + 2] = 0.0;
      } else if (colorType === 1) {
        // Green
        starColors[i * 3] = 0.0;
        starColors[i * 3 + 1] = 1.0;
        starColors[i * 3 + 2] = 0.0;
      } else {
        // Blue
        starColors[i * 3] = 0.0;
        starColors[i * 3 + 1] = 0.0;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(starColors, 3)
    );

    // Star material with circular shape
    const starMaterial = new THREE.PointsMaterial({
      vertexColors: true, // Keep colors fixed
      size: 2, // Increase size for visibility
      sizeAttenuation: true, // Ensures stars scale correctly
      map: circleTexture, // Use circular texture
      alphaTest: 0.5, // Ensure transparency works
      transparent: true, // Remove square edges
    });

    // Create star points
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Set camera position
    camera.position.z = 800;

    // Animate stars
    const animateStars = () => {
      requestAnimationFrame(animateStars);

      // Rotate stars slightly
      stars.rotation.y += 0.0005;
      stars.rotation.x += 0.0002;

      // Move stars downward
      const positions = stars.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.05;

        // Reset star position if it moves out of bounds
        if (positions[i + 1] < -1000) {
          positions[i + 1] = 1000;
        }
      }

      stars.geometry.attributes.position.needsUpdate = true;

      // Render the scene
      renderer.render(scene, camera);
    };

    // Window resize handling
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    animateStars();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (canvasContainer) {
        canvasContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={canvasRef} style={canvasStyle} />;
};

// CSS styles for the canvas to ensure it covers the entire window
const canvasStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: -1,
};

export default LightBackground;
