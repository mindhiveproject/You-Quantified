import { useEffect, useRef } from "react";
import { spCode } from "./mirrors_shaderpackcode";
import { createSculptureWithGeometry } from 'shader-park-core';
import { OrbitControls } from 'shader-park-core/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Scene, BoxGeometry, SphereGeometry, Vector3, PerspectiveCamera, WebGLRenderer, Color, Clock, MeshBasicMaterial, MeshStandardMaterial, Mesh } from 'shader-park-core/node_modules/three';

const Mirrors = ({ value }) => {

  function map(valor) {
    return valor * 2;
  }

  const canvasRef = useRef();

  let state = {
    time: 0.0,
    buttonHover: 0.0,
    currButtonHover: 0.0,
    click: 0.0,
    currClick: 0.0,
  };

  useEffect(() => {
    // ------------------------------------------------ Setup ------------------------------------------------
    const canvas = canvasRef.current;

    let scene = new Scene();

    let camera = new PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    camera.position.z = 1;

    let renderer = new WebGLRenderer({ antialias: true, transparent: true, powerPreference: "high-performance" });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new Color(1, 1, 1), 0);


    canvas.appendChild(renderer.domElement);

    let clock = new Clock();

    let geometry = new BoxGeometry(2, 2, 2);

    let mesh = createSculptureWithGeometry(geometry, spCode(), () => ({
      time: state.time,
      buttonHover: state.currButtonHover,
      click: state.currClick,
      _scale: 0.5,
      valor: map(value.current["Speed Change"]),
    }));

    scene.add(mesh);

    let controls = new OrbitControls(camera, renderer.domElement, {
      enableDamping: true,
      dampingFactor: 0.25,
      zoomSpeed: 0.5,
      rotateSpeed: 0.5
    });

    controls.enabled = false;

    let onWindowResize = () => {
      camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    }

    let id;
    // ------------------------------------------------ Dynamic aspect? ------------------------------------------------
    let render = () => {
      id = requestAnimationFrame(render);
      state.time += clock.getDelta();
      state.currButtonHover = state.currButtonHover * 0.999 + state.buttonHover * 0.001;
      state.currClick = state.currClick * 0.97 + state.click * 0.03;
      renderer.render(scene, camera);
    };

    render();
    let observer = new ResizeObserver(function () {
      onWindowResize();
    });

    observer.observe(canvas)

    return () => {
      observer.disconnect();
      cancelAnimationFrame(id);
      renderer.clear();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Event listeners (except for resize)
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleMouseOver = () => (state.buttonHover = 5);
    const handleMouseOut = () => (state.buttonHover = 0.0);
    const handleMouseDown = () => (state.click = 1.0);
    const handleMouseUp = () => (state.click = 0.0);

    canvas.addEventListener('mouseover', handleMouseOver);
    canvas.addEventListener('mouseout', handleMouseOut);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    //canvas.addEventListener("compositionupdate", ()=>{state.value=value});
    //canvas.addEventListener("pointermove", ()=>{state.value=value});

    return () => {
      // Cleanup event listeners when component unmounts
      canvas.removeEventListener('mouseover', handleMouseOver);
      canvas.removeEventListener('mouseout', handleMouseOut);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return <div className="h-100" ref={canvasRef} />
};

export default Mirrors;