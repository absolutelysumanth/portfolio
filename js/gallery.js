import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";
import { Reflector } from "./vendor/Reflector.js";

export function createGallery(host, projects, onSelect, initialIndex = 0) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0c0506");
  scene.fog = new THREE.Fog("#0c0506", 18, 62);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(room, .06).texture;
  room.dispose(); pmrem.dispose();
  const redLight = new THREE.PointLight('#ff1424', 24, 22, 2);
  redLight.position.set(-2, 3, 3); scene.add(redLight);
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight("#ece8ed", "#260407", 1.1));
  const sunlight = new THREE.DirectionalLight("#fff6ee", 2.1);
  sunlight.position.set(4, 12, 9);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 1024);
  Object.assign(sunlight.shadow.camera, {
    left: -30,
    right: 45,
    top: 15,
    bottom: -10,
    near: 1,
    far: 70,
  });
  sunlight.shadow.bias = -0.0005;
  sunlight.shadow.normalBias = 0.04;
  scene.add(sunlight);
  scene.add(sunlight.target);
  const material = (color, roughness = 0.85, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const concrete = material("#181719");
  const ivory = material("#140b0d");
  const charcoal = material("#09090b", .2, .7);
  const steel = material("#7b7e76", 0.35, 0.6);
  function box(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  const floor = new Reflector(new THREE.PlaneGeometry(100, 45), {
    color: '#27232a', textureWidth: 1024, textureHeight: 1024,
    clipBias: .005, multisample: 0,
  });
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(15, -0.02, 0);
  floor.receiveShadow = true;
  scene.add(floor);
  box(100, 9, 0.3, ivory, 15, 4.5, -3.5);
  // Slender architectural fins frame the corridor without hiding the exhibits.
  for (let i = -1; i < 7; i++) {
    box(0.13, 7, 1.1, ivory, i * 7.5 - 3.7, 3.5, -2.8);
    box(7.3, 0.12, 1.3, ivory, i * 7.5, 6.8, -2.8);
    // Subtle floor joints, rather than an emissive grid.
    box(0.012, 0.004, 16, material("#b6b3a9"), i * 7.5 - 3.7, 0, 1);
  }
  const loader = new THREE.TextureLoader();
  const screens = [];
  const sculptures = [];
  const displayGroups = [];
  const orbitRings = [];
  const red = material('#e00920', .23, .65);
  // Repeating red portals make the camera travel readable in depth.
  for (let i = -1; i < projects.length + 1; i++) {
    const x = i * 7.5;
    box(.045, 6.3, .045, red, x-3.5, 3.15, -.6);
    box(6.9, .045, .045, red, x, 6.3, -.6);
    box(.045, .015, 13, red, x-3.5, .015, 1);
  }
  projects.forEach((project, i) => {
    const x = i * 7.5;
    const frame = box(3.34, 4.45, 0.18, charcoal, x, 2.9, -1.3);
    frame.userData.index = i;
    screens.push(frame);
    const display = new THREE.Group();
    display.position.set(x, 2.9, -1.3); scene.add(display);
    display.attach(frame); displayGroups.push(display);
    const leaves = [];
    for (let layer=0; layer<2; layer++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(3.35,4.45,.035), layer===0 ? red : steel);
      leaf.position.set(-.08-layer*.06,.05+layer*.04,-.20-layer*.13);
      leaf.castShadow = true; display.add(leaf); leaves.push(leaf);
    }
    display.userData.leaves = leaves;
    box(3.25, .07, .5, red, x, .64, -1.05);
    const texture = loader.load(`images/exhibits/${project.id}.svg?v=red20261106`, () =>
      requestRender(),
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(3.15, 4.2),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    poster.position.set(x, 2.9, -1.198);
    poster.userData.index = i;
    scene.add(poster);
    screens.push(poster);
    display.attach(poster);
    // A small museum label, drawn at print resolution.
    const label = document.createElement("canvas");
    label.width = 768;
    label.height = 192;
    const ctx = label.getContext("2d");
    ctx.fillStyle = "#29262b";
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = "#f1e9e9";
    ctx.font = "bold 38px Arial";
    ctx.fillText(project.number + " / " + project.name, 24, 65);
    ctx.font = "25px Arial";
    ctx.fillText(
      project.domain + (project.type === "concept" ? " — CONCEPT" : ""),
      24,
      118,
    );
    const labelTexture = new THREE.CanvasTexture(label);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 0.475),
      new THREE.MeshBasicMaterial({ map: labelTexture }),
    );
    plaque.position.set(x + 2.6, 1.6, -1.18);
    scene.add(plaque);
    box(1.15, 0.82, 1.15, ivory, x - 2.45, 0.41, 0.1);
    let shape;
    if (i === 0) shape = new THREE.TorusKnotGeometry(0.42, 0.13, 96, 12, 2, 3);
    if (i === 1) shape = new THREE.IcosahedronGeometry(0.58, 1);
    if (i === 2)
      shape = new THREE.TorusGeometry(0.45, 0.13, 16, 64, Math.PI * 1.6);
    if (i === 3) shape = new THREE.SphereGeometry(0.49, 40, 24);
    if (i === 4) shape = new THREE.ConeGeometry(0.52, 1.1, 5);
    const colors = ["#d8051c", "#bfc5cd", "#ee1026", "#989eaa", "#920413"];
    const sculpture = new THREE.Mesh(shape, material(colors[i], 0.18, 0.85));
    sculpture.position.set(x - 2.45, 1.5, 0.1);
    sculpture.castShadow = true;
    sculpture.rotation.set(0.15, 0.3, -0.1);
    scene.add(sculpture);
    sculptures.push(sculpture);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(.78, .012, 8, 80), red);
    orbit.position.copy(sculpture.position); scene.add(orbit); orbitRings.push(orbit);
    box(0.065, 5.8, 0.065, steel, x + 3.1, 2.9, 2.5);
    box(1.3, 0.075, 0.16, charcoal, x + 2.55, 5.8, 2.5);
  });
  let target = initialIndex;
  let current = initialIndex;
  let pointerX = 0,
    pointerY = 0;
  let raf = 0,
    visible = true,
    lastTime = 0;
  let drag;
  let size = { width: 1, height: 1 };
  const raycaster = new THREE.Raycaster();
  const lookAt = new THREE.Vector3();
  function frame(time) {
    raf = 0;
    if (!visible || document.hidden || !host.isConnected) return;
    if (!reducedMotion && time-lastTime < 32) { requestRender(); return; }
    const delta = Math.min((time - lastTime) / 1000, 0.05) || 0.016;
    lastTime = time;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 8);
    current += (target - current) * blend;
    const aspect = camera.aspect;
    const distance = aspect < 0.85 ? 12.6 : aspect < 1.15 ? 10.8 : 9.1;
    const parallax = reducedMotion ? 0 : .7;
    const travel = Math.min(Math.abs(target-current), 1);
    const t = reducedMotion ? 0 : time*.001;
    displayGroups.forEach((display,i) => {
      const active = Math.max(0, 1-Math.abs(current-i));
      display.position.y = 2.9 + (reducedMotion ? 0 : Math.sin(t*.8+i)*.09);
      display.rotation.y = reducedMotion ? 0 : Math.sin(t*.35+i)*.035 + pointerX*.09*active;
      display.rotation.x = reducedMotion ? 0 : pointerY*.035*active;
      display.userData.leaves.forEach((leaf,j) => {
        leaf.position.x = -.08-j*.06 - active*(j+1)*.10;
        leaf.position.z = -.20-j*.13 - active*(j+1)*.10;
        leaf.rotation.z = active*(j+1)*.025;
      });
      sculptures[i].rotation.set(.15 + Math.sin(t*.4+i)*.15,t*.27+i*.6,-.1);
      sculptures[i].position.y = 1.55 + Math.sin(t*1.1+i)*.12;
      orbitRings[i].position.y = sculptures[i].position.y;
      orbitRings[i].rotation.set(.8 + Math.sin(t*.3+i)*.35,t*.3+i,.3);
    });
    redLight.position.x = current*7.5 - 2;
    camera.up.set(reducedMotion ? 0 : Math.sin((target-current)*1.2)*.045,1,0);
    camera.position.set(
      2.2 + pointerX * parallax,
      3.3 - pointerY * parallax + travel*.5,
      distance + travel*2.5,
    );
    scene.position.x = -current * 7.5;
    lookAt.set(-0.1, 2.45, -0.8);
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
    if (!reducedMotion || Math.abs(target - current) > 0.0001) requestRender();
  }
  function requestRender() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }
  function resize() {
    size = {
      width: Math.max(host.clientWidth, 1),
      height: Math.max(host.clientHeight, 1),
    };
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    requestRender();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) requestRender();
    },
    { threshold: 0 },
  );
  visibilityObserver.observe(host);
  host.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      start: target,
      moved: false,
    };
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener("pointermove", (e) => {
    const rect = host.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) / rect.width - 0.5;
    pointerY = (e.clientY - rect.top) / rect.height - 0.5;
    if (drag) {
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 8) drag.moved = true;
      if (drag.moved) {
        target = THREE.MathUtils.clamp(
          drag.start - (dx / rect.width) * 1.8,
          0,
          projects.length - 1,
        );
        host.classList.add("is-dragging");
      }
    }
    requestRender();
  });
  function finishDrag(e, cancelled = false) {
    if (!drag) return;
    const wasMoved = drag.moved;
    drag = undefined;
    host.classList.remove("is-dragging");
    if (host.hasPointerCapture(e.pointerId))
      host.releasePointerCapture(e.pointerId);
    if (wasMoved) {
      target = Math.round(target);
      onSelect(target);
    } else if (!cancelled) {
      const rect = host.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObjects(screens)[0];
      if (hit) {
        target = hit.object.userData.index;
        onSelect(target);
      }
    }
    requestRender();
  }
  host.addEventListener("pointerup", (e) => finishDrag(e));
  host.addEventListener("pointercancel", (e) => finishDrag(e, true));
  host.addEventListener("pointerleave", () => {
    if (!drag) {
      pointerX = 0;
      pointerY = 0;
      requestRender();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestRender();
  });
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    host.classList.remove("gallery-ready");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    host.classList.add("gallery-ready");
    requestRender();
  });
  resize();
  requestRender();
  return {
    goTo(index) {
      target = index;
      requestRender();
    },
    resize,
  };
}
