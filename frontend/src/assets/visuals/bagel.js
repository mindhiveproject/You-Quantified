import React, { useEffect, useRef } from 'react';
import { bagelShaderParkCode } from './bagel_shaderParkCode';
import { createSculptureWithGeometry } from 'shader-park-core';
import { OrbitControls } from 'shader-park-core/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Scene,  BoxGeometry, SphereGeometry, Vector3, PerspectiveCamera, WebGLRenderer, Color, Clock, MeshBasicMaterial, MeshStandardMaterial, Mesh } from 'shader-park-core/node_modules/three';

const Bagel = ({ value }) => {
  
  const canvasRef = useRef();

  //-------------- value mapping function --------------
  const degree_upper = 3.2;
  const degree_lower = 1.8;
  const degreeRange = degree_upper - degree_lower;
  const relative_upper = 0.8;
  const relative_lower = 0.37;
  const relativeRange = relative_upper - relative_lower;
  const easingFactor = 0.1;

  function mapDegree(master) {
    let master_limit = Math.min(Math.max(master, 0), 1.7); // cap between 0 and 1
    let degree;
    degree = (master_limit <= 0.3) * (degree_upper - master_limit * (degreeRange / 0.3));
    degree += (master_limit > 0.3 && master_limit <= 0.6) * (degree_upper - 0.3 * (degreeRange / 0.3));
    degree += (master_limit > 0.6) * (degree_lower + (master_limit - 0.6) * (degreeRange / 0.4));
    return degree;
  };

  function mapRelative(master) {
    let master_limit = Math.min(Math.max(master, 0), 1.7); // cap between 0 and 1
    let relative;
    relative = relative_lower;
    relative += (master_limit > 0.3 && master_limit <= 0.6) * (master_limit - 0.3) * (relativeRange / 0.3);
    relative += (master_limit > 0.6) * (0.6 - 0.3) * (relativeRange / 0.3);
    return relative;
  }

  let state = {
    time: 0.0,
    currMaster: 0.0
  };

  useEffect(() => {
    // ------------------------------------------------ Setup ------------------------------------------------
    const canvas = canvasRef.current;

    let scene = new Scene();

    let camera = new PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    camera.position.z = 2;

    let renderer = new WebGLRenderer({ antialias: true, transparent: true, powerPreference: "high-performance" });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new Color(1, 1, 1), 0);

    canvas.appendChild(renderer.domElement);

    let clock = new Clock();

    let geometry = new BoxGeometry(2, 2, 2);

    let mesh = createSculptureWithGeometry(geometry, bagelShaderParkCode(), () => ({
      time: state.time,
      degree: mapDegree(state.currMaster),
      relative: mapRelative(state.currMaster),
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
    };

    let id;
    // ------------------------------------------------ Dynamic aspect? ------------------------------------------------
    let render = () => {
      id = requestAnimationFrame(render);
      state.time += clock.getDelta();
      // update with easing
      let deltaS = value.current["Circle size"] - state.currMaster;
      state.currMaster += deltaS * easingFactor;
      // state.currMaster = value.current["Circle size"] * 0.1 + state.currMaster * 0.9;
      renderer.render(scene, camera);
    };

    render();
    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(id);
      renderer.clear();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return <div className="h-100" ref={canvasRef} />
};

export default Bagel;
