import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const SpaceBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvasContainer = canvasRef.current; // Store the ref in a local variable

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    if (canvasContainer) {
      canvasContainer.appendChild(renderer.domElement);
    }

    // Load circular texture for stars
    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load("https://threejs.org/examples/textures/sprites/circle.png");

    // Create stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 11000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 2000;
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      map: starTexture,
      color: 0xffffff,
      size: 1,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    camera.position.z = 800;

    // Animation loop
    const animateStars = () => {
      requestAnimationFrame(animateStars);

      stars.rotation.y += 0.0005;
      stars.rotation.x += 0.0002;

      const positions = stars.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.05;

        if (positions[i + 1] < -1000) {
          positions[i + 1] = 1000;
        }
      }
      stars.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    // Handle resizing properly
    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    animateStars();

    // Cleanup
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

const canvasStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  zIndex: -1,
};

export default SpaceBackground;
