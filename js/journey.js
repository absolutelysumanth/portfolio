import * as THREE from "./vendor/three.module.min.js";
import { createWater } from "./water.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";
import { buildBlueprints } from "./blueprints.js";

export function createJourney(host, projects, onUpdate, onSelect) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 180);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentMap.texture;
  environment.dispose();
  pmrem.dispose();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(75, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float uSceneMix;varying vec3 vDirection;void main(){vec3 d=normalize(vDirection);float y=d.y;float band=exp(-abs(y)*11.);vec3 color=mix(vec3(.018,.022,.026),vec3(.91,.925,.93),band);float cloud=sin(d.x*5.+d.z*3.)*sin(d.y*13.+d.z*4.);color+=cloud*.035*band;gl_FragColor=vec4(mix(color,vec3(.75,.756,.765),uSceneMix),1.);}`,
    }),
  );
  sky.material.uniforms.uSceneMix = { value: 0 };
  scene.add(sky);
  scene.add(new THREE.HemisphereLight("#e7edf3", "#272c32", 1.25));
  const key = new THREE.DirectionalLight("#ffffff", 3.5);
  key.position.set(-4, 9, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#c6d0dc", 3);
  rim.position.set(5, 4, -4);
  scene.add(rim);
  const sculpture = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(1.16, 1.42);
  s.bezierCurveTo(0.45, 2.05, -1.18, 1.9, -1.27, 0.92);
  s.bezierCurveTo(-1.38, -0.03, -0.42, -0.12, 0.3, -0.45);
  s.bezierCurveTo(1.02, -0.78, 0.66, -1.37, -0.03, -1.37);
  s.bezierCurveTo(-0.53, -1.37, -0.85, -1.12, -1.03, -0.86);
  s.lineTo(-1.43, -1.43);
  s.bezierCurveTo(-0.72, -2.02, 0.66, -2.05, 1.12, -1.21);
  s.bezierCurveTo(1.85, 0.13, 0.43, 0.43, -0.16, 0.7);
  s.bezierCurveTo(-0.85, 1.0, -0.66, 1.38, -0.02, 1.38);
  s.bezierCurveTo(0.36, 1.38, 0.62, 1.21, 0.83, 1.01);
  s.closePath();
  const geometry = new THREE.ExtrudeGeometry(s, {
    depth: 0.48,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.085,
    bevelThickness: 0.08,
    curveSegments: 40,
  });
  geometry.center();
  const face = new THREE.MeshPhysicalMaterial({
    color: "#20252a",
    metalness: 1,
    roughness: 0.17,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2.3,
  });
  const side = new THREE.MeshPhysicalMaterial({
    color: "#9cabb5",
    metalness: 1,
    roughness: 0.19,
    envMapIntensity: 2,
  });
  const mark = new THREE.Mesh(geometry, [face, side]);
  mark.position.set(-0.24, 2.12, 0);
  sculpture.add(mark);
  const rimLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 28),
    new THREE.LineBasicMaterial({
      color: "#a9b1b8",
      transparent: true,
      opacity: 0.25,
    }),
  );
  rimLines.position.copy(mark.position);
  sculpture.add(rimLines);
  const diamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.4, 0),
    new THREE.MeshPhysicalMaterial({
      color: "#dce7ed",
      metalness: 0.05,
      roughness: 0.04,
      transmission: 0.74,
      thickness: 1.1,
      ior: 1.7,
      envMapIntensity: 2.5,
      clearcoat: 1,
    }),
  );
  diamond.position.set(1.28, 2.25, 0.1);
  diamond.rotation.set(0.25, 0.45, 0.15);
  sculpture.add(diamond);
  sculpture.rotation.y = -0.18;
  scene.add(sculpture);
  const water = createWater(reduced);
  const ground = water.surface;
  scene.add(ground);
  const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.01);
  const waterHit = new THREE.Vector3();
  let wasLiveOpening = true;

  const clamp = THREE.MathUtils.clamp;
  const mix = THREE.MathUtils.lerp;
  const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
  const lightColor = new THREE.Color("#bfc1c3");
  const blackColor = new THREE.Color("#040506");
  const shotCanvas = document.createElement("canvas");
  const shotContext = shotCanvas.getContext("2d");
  const shotTexture = new THREE.CanvasTexture(shotCanvas);
  shotTexture.colorSpace = THREE.SRGBColorSpace;
  let shotReady = false;
  const reel = new THREE.Group();
  scene.add(reel);
  const panels = [];
  function reelTexture(project) {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 933;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = new Image();
    function draw() {
      ctx.fillStyle = project.color;
      ctx.fillRect(0, 0, 1600, 933);
      ctx.fillStyle = "#f0eee5";
      ctx.font = "24px Arial";
      ctx.fillText("SUMANTH N / SELECTED WORK", 65, 75);
      ctx.font = "bold 108px Arial";
      const words = project.name.split(" ");
      words.forEach((word, i) => ctx.fillText(word, 60, 310 + i * 115, 800));
      ctx.font = "32px Arial";
      ctx.fillStyle = "#c3c6bb";
      ctx.fillText(project.domain.toUpperCase(), 65, 620, 780);
      ctx.font = "25px Arial";
      ctx.fillText(
        project.number +
          " / " +
          (project.type === "concept" ? "CONCEPT EXPLORATION" : "PROJECT"),
        65,
        850,
      );
      if (image.complete && image.naturalWidth)
        ctx.drawImage(image, 950, 65, 600, 800);
      texture.needsUpdate = true;
      queueMicrotask(request);
    }
    image.onload = draw;
    image.src = "images/exhibits/" + project.id + ".svg";
    draw();
    return texture;
  }
  const textures = [shotTexture, ...projects.map(reelTexture)];
  textures.forEach((texture, i) => {
    // Each segment bends along the same arc, so the reel reads as one surface.
    const geometry = new THREE.PlaneGeometry(5.4, 3.15, 48, 2);
    const original = geometry.attributes.position.array.slice();
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      toneMapped: false,
    });
    const panel = new THREE.Mesh(geometry, material);
    panel.userData = { index: i, original };
    reel.add(panel);
    panels.push(panel);
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(5.44, 3.19)),
      new THREE.LineBasicMaterial({
        color: "#24282b",
        transparent: true,
        opacity: 0.7,
      }),
    );
    border.visible = false;
    panel.add(border);
  });
  const blobUniforms = { time: { value: 0 }, morph: { value: 1 } };
  const blobMaterial = new THREE.MeshPhysicalMaterial({
    color: "#07090c",
    metalness: 1,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.6,
    transparent: true,
  });
  blobMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = blobUniforms.time;
    shader.uniforms.uMorph = blobUniforms.morph;
    shader.vertexShader =
      `uniform float uTime;uniform float uMorph;
      float blobHeight(vec3 p){return uMorph*(sin(p.x*4.+uTime*.33)*sin(p.y*3.6-uTime*.21)*sin(p.z*4.3+uTime*.19)*.16+sin(p.x*7.+p.y*3.+uTime*.15)*.025);}
      vec3 blobNormal(vec3 p){
        float e=.006;vec3 n=normalize(p);
        vec3 gradient=vec3(blobHeight(p+vec3(e,0.,0.))-blobHeight(p-vec3(e,0.,0.)),blobHeight(p+vec3(0.,e,0.))-blobHeight(p-vec3(0.,e,0.)),blobHeight(p+vec3(0.,0.,e))-blobHeight(p-vec3(0.,0.,e)))/(2.*e);
        return normalize((1.+blobHeight(p))*n-length(p)*(gradient-dot(gradient,n)*n));
      }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      "#include <beginnormal_vertex>\nobjectNormal=blobNormal(position);",
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed=position*(1.+blobHeight(position));",
    );
  };
  const blobGroup = new THREE.Group();
  scene.add(blobGroup);
  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.03, 5),
    blobMaterial,
  );
  blobGroup.add(blob);
  const armMaterial = new THREE.MeshPhysicalMaterial({
    color: "#0c0e11",
    metalness: 1,
    roughness: 0.15,
    envMapIntensity: 2.3,
  });
  const endpoints = [
    new THREE.Vector3(-2.35, 0.65, 0),
    new THREE.Vector3(2.35, 0.65, 0),
    new THREE.Vector3(-2.35, -0.65, 0),
    new THREE.Vector3(2.35, -0.65, 0),
  ];
  const arms = endpoints.map((end) => {
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.04, 1, 10),
      armMaterial,
    );
    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 12),
      armMaterial,
    );
    blobGroup.add(cylinder, satellite);
    return { cylinder, satellite, end };
  });
  const blueprint = buildBlueprints();
  blueprint.models.forEach((group) => scene.add(group));
  scene.add(blueprint.room);
  let metrics = [],
    state = { id: "home", p: 0 },
    visible = true,
    paused = false,
    raf = 0,
    last = 0,
    px = 0,
    py = 0;
  let currentFilm = 0,
    manualFilm = null,
    lastWorkProgress = -1,
    drag = null;
  let raycaster = new THREE.Raycaster();
  const look = new THREE.Vector3();
  function measure() {
    metrics = Array.from(document.querySelectorAll(".journey-chapter")).map(
      (el) => ({ id: el.id, start: el.offsetTop, height: el.offsetHeight, el }),
    );
  }
  let targetScroll = scrollY,
    playhead = scrollY;
  function stateAt(y) {
    let chapter = metrics[0];
    metrics.forEach((m) => {
      if (y >= m.start - 1) chapter = m;
    });
    const distance =
      chapter.id === "contact" ? chapter.height - innerHeight : chapter.height;
    const p = clamp((y - chapter.start) / Math.max(distance, 1), 0, 1);
    return { id: chapter.id, p };
  }
  function updateState() {
    targetScroll = scrollY;
    state = stateAt(targetScroll);
    const p = state.p;
    if (state.id === "portfolio" && Math.abs(p - lastWorkProgress) > 0.003) {
      manualFilm = null;
      lastWorkProgress = p;
    }
    request();
  }
  function showBlueprints(value) {
    blueprint.models.forEach((g) => (g.visible = value));
    blueprint.room.visible = value;
  }
  function resetScene() {
    sky.visible = false;
    ground.visible = false;
    sculpture.visible = false;
    reel.visible = false;
    blobGroup.visible = false;
    showBlueprints(false);
    blobMaterial.opacity = 1;
    scene.background.copy?.(blackColor);
  }
  scene.background = new THREE.Color("#040506");
  function cameraAt(x, y, z, tx = 0, ty = 0, tz = 0) {
    camera.position.set(x, y, z);
    look.set(tx, ty, tz);
    camera.lookAt(look);
  }
  function renderReel(position, fold = 0, opacity = 1, opening = 1) {
    reel.visible = true;
    panels.forEach((panel, i) => {
      const offset = i - position;
      const arc = offset * 0.5;
      panel.position.set(
        Math.sin(arc) * 11 * (1 - fold * 0.85),
        Math.sin(offset * 0.8) * fold * 0.25,
        -(1 - Math.cos(arc)) * 5 - fold * Math.abs(offset) * 0.3,
      );
      panel.rotation.set(
        fold * (i % 2 ? 1 : -1) * 0.15,
        -arc * 0.75 + fold * offset * 0.7,
        fold * offset * 0.14,
      );
      panel.scale.setScalar(mix(1, 0.28, fold));
      panel.material.opacity =
        opacity * (i === 0 ? 1 : smooth(0.08, 0.55, opening));
      panel.children[0].material.opacity = opacity * 0.65;
      const attr = panel.geometry.attributes.position;
      const base = panel.userData.original;
      for (let j = 0; j < attr.count; j++) {
        const x = base[j * 3],
          y = base[j * 3 + 1];
        const curl = fold * 1.8;
        attr.setXYZ(
          j,
          curl > 0.01 ? Math.sin(x * curl) / curl : x,
          y * (i === 0 ? mix(5.4 / 3.15 / camera.aspect, 1, opening) : 1),
          -0.05 * x * x * opening +
            (curl > 0.01 ? (1 - Math.cos(x * curl)) / curl : 0),
        );
      }
      attr.needsUpdate = true;
      panel.geometry.computeBoundingSphere();
    });
  }
  function render(time) {
    raf = 0;
    if (paused || document.hidden || !visible) return;
    if (time - last < 32 && !reduced) {
      request();
      return;
    }
    const elapsed = Math.min((time - last) / 1000, 0.25) || 0.033;
    last = time;
    playhead = reduced
      ? targetScroll
      : mix(playhead, targetScroll, 1 - Math.exp(-elapsed * 12));
    if (Math.abs(playhead - targetScroll) < 0.1) playhead = targetScroll;
    state = stateAt(playhead);
    const small = camera.aspect < 0.85;
    const { id, p } = state;
    water.update(reduced ? 0 : time * 0.001);
    const openingHandoff = state.id === "home" && state.p >= 0.38;
    if (!shotReady || (openingHandoff && wasLiveOpening)) {
      sky.visible = true;
      ground.visible = true;
      sculpture.visible = true;
      reel.visible = false;
      blobGroup.visible = false;
      showBlueprints(false);
      sky.material.uniforms.uSceneMix.value = 0;
      sculpture.scale.setScalar(1);
      sculpture.rotation.y = -0.18 + px * 0.12;
      sculpture.position.y =
        0.25 + (reduced ? 0 : Math.sin(time * 0.00065) * 0.045);
      cameraAt(
        px * 0.2,
        0.85 + py * 0.08,
        small ? 16.5 : 11,
        0,
        small ? 3.8 : 0.85,
        0,
      );
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      shotContext.drawImage(
        renderer.domElement,
        0,
        0,
        shotCanvas.width,
        shotCanvas.height,
      );
      shotTexture.needsUpdate = true;
      shotReady = true;
    }
    resetScene();
    blobUniforms.time.value = reduced ? 0 : time * 0.001;
    blob.rotation.set(0.2, reduced ? 0.6 : time * 0.00004, 0);
    blobGroup.position.set(0, 0, 0);
    blobGroup.rotation.set(0, 0, 0);
    blobGroup.scale.setScalar(1);
    let processIndex = 0,
      mode = "dark";
    let introOpacity = 1,
      workOpacity = 1,
      studioOpacity = 1;
    let contactPoints = null;
    if (id === "home") {
      const transition = reduced ? 0 : smooth(0.38, 0.98, p);
      if (p < 0.38 || reduced) {
        wasLiveOpening = true;
        sky.visible = true;
        ground.visible = true;
        sculpture.visible = true;
        sky.material.uniforms.uSceneMix.value = 0;
        sculpture.scale.setScalar(1);
        sculpture.rotation.y = -0.18 + px * 0.12;
        sculpture.position.y =
          0.25 + (reduced ? 0 : Math.sin(time * 0.00065) * 0.045);
        diamond.rotation.y = 0.45 + (reduced ? 0 : time * 0.000035);
        cameraAt(
          px * 0.2,
          0.85 + py * 0.08,
          small ? 16.5 : 11,
          0,
          small ? 3.8 : 0.85,
          0,
        );
        scene.background.copy(blackColor);
      } else {
        // Exclusive handoff: the live sculpture and water never share a pass with the reel.
        wasLiveOpening = false;
        scene.background.copy(lightColor);
        const distance = small ? 17 : 9;
        cameraAt(0, 0, distance, 0, 0, 0);
        currentFilm = mix(currentFilm, 0, 1 - Math.exp(-elapsed * 9));
        renderReel(currentFilm, 0, 1, transition);
        const visibleHeight =
          2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const cover = (visibleHeight * camera.aspect) / 5.4;
        reel.scale.setScalar(mix(cover, 1, transition));
        reel.position.set(0, 0, 0);
      }
      introOpacity = 1 - smooth(0.1, 0.37, p);
      mode = transition > 0.35 ? "light" : "dark";
    } else if (id === "portfolio") {
      mode = "light";
      scene.background.copy(lightColor);
      const fold = reduced ? 0 : smooth(0.77, 1, p);
      const desired =
        manualFilm ?? 1 + smooth(0, 0.76, p) * (projects.length - 1);
      currentFilm = reduced
        ? desired
        : mix(currentFilm, desired, 1 - Math.exp(-elapsed * 9));
      if (Math.abs(currentFilm - desired) < 0.001) currentFilm = desired;
      renderReel(currentFilm, fold, 1 - smooth(0.7, 1, fold));
      reel.scale.setScalar(1);
      reel.position.set(0, 0, 0);
      cameraAt(0, 0, small ? 17 : 9, 0, 0, 0);
      blobGroup.visible = fold > 0.05;
      blobGroup.scale.setScalar(mix(0.15, 1.4, fold));

      blob.material.opacity = smooth(0.05, 0.45, fold);
      arms.forEach((a) => {
        a.cylinder.visible = false;
        a.satellite.visible = false;
      });
      workOpacity = 1 - smooth(0.73, 0.9, p);
      onSelect(clamp(Math.round(currentFilm) - 1, 0, projects.length - 1));
    } else if (id === "process") {
      mode = p < 0.055 ? "light" : "dark";
      scene.background.copy(lightColor).lerp(blackColor, smooth(0, 0.08, p));
      const t = clamp(p * 5.15 - 0.18, 0, 4.9);
      processIndex = clamp(Math.round(t), 0, 4);
      blueprint.models.forEach((group, i) => {
        const distance = Math.abs(t - i);
        const strength = 1 - smooth(0.28, 0.75, distance);
        const assemble = reduced ? 0 : smooth(0.05, 0.72, distance) * 1.8;
        blueprint.pose(
          group,
          strength * smooth(0.015, 0.09, p) * (1 - smooth(0.94, 1, p)),
          assemble,
          smooth(0, 0.7, strength),
        );
        group.position.set(0, small ? 1.7 : 0.45, -distance * 0.7);
        group.scale.setScalar(small ? 0.68 : 1);
        group.rotation.set(0, (reduced ? 0 : (t - i) * 0.5) + 0.03, 0);
      });
      cameraAt(
        small ? 4.8 : 5,
        small ? 4.2 : 3.4,
        small ? 11.5 : 9.5,
        0,
        small ? 0.6 : 0.0,
        0,
      );
      if (p > 0.92) {
        const roomEntry = smooth(0.92, 1, p);
        blueprint.pose(blueprint.room, roomEntry, 1.25, 1, 0, roomEntry * 0.05);
        blueprint.room.position.set(small ? 0 : 1.3, small ? -1.5 : -0.3, 0);
        blueprint.room.scale.setScalar(small ? 0.72 : 1);
        blueprint.room.rotation.y = 0.06;
        cameraAt(
          mix(small ? 4.8 : 5, small ? 8 : 7, roomEntry),
          mix(small ? 4.2 : 3.4, 4.1, roomEntry),
          mix(small ? 11.5 : 9.5, 11, roomEntry),
          0,
          mix(small ? 0.6 : 0, 0.5, roomEntry),
          0,
        );
      }
      if (p < 0.06 && !reduced) {
        blobGroup.visible = true;
        blobGroup.scale.setScalar((1 - smooth(0, 0.06, p)) * 1.4);
        arms.forEach((a) => {
          a.cylinder.visible = false;
          a.satellite.visible = false;
        });
      }
    } else if (id === "about") {
      scene.background.copy(blackColor);
      const build = reduced ? 1 : mix(0.05, 1, smooth(0, 0.38, p));
      const fly = reduced ? 0 : smooth(0.4, 0.86, p);
      const explode = reduced ? 0 : smooth(0.73, 1, p);
      blueprint.pose(
        blueprint.room,
        1 - smooth(0.84, 1, p),
        (1 - build) * 1.32 + explode * 2.8,
        1,
        explode,
        build,
      );
      blueprint.room.position.set(small ? 0 : 1.3, small ? -1.5 : -0.3, 0);
      blueprint.room.scale.setScalar(small ? 0.72 : 1);
      blueprint.room.rotation.y = mix(0.06, -0.25, fly);
      cameraAt(
        mix(small ? 8 : 7, 1.7, fly),
        mix(4.1, 1.2, fly),
        mix(11, 2.3, fly),
        mix(0, 1.3, fly),
        mix(0.5, 0.3, fly),
        mix(0, -1.1, fly),
      );
      studioOpacity = 1 - smooth(0.5, 0.75, p);
      if (explode > 0.4) {
        blobGroup.visible = true;
        blobGroup.scale.setScalar(smooth(0.4, 1, explode) * 1.2);
        blobGroup.position.set(1.4, 0.4, -0.6);
        arms.forEach((a) => {
          a.cylinder.visible = false;
          a.satellite.visible = false;
        });
      }
      const exit = smooth(0.8, 1, p);
      camera.position.lerp(new THREE.Vector3(0, 0.15, small ? 12 : 8.3), exit);
      camera.lookAt(
        new THREE.Vector3(
          1.3 * (1 - exit),
          mix(0.3, small ? -0.2 : 0, exit),
          -1.1 * (1 - exit),
        ),
      );
      blobGroup.position.lerp(new THREE.Vector3(0, small ? -0.35 : 0, 0), exit);
      blobGroup.scale.multiplyScalar(mix(1, (small ? 0.7 : 1.15) / 1.2, exit));
      mode = exit > 0.45 ? "light" : "dark";
      scene.background.copy(blackColor).lerp(lightColor, exit);
    } else {
      mode = "light";
      scene.background.copy(lightColor);
      blobGroup.visible = true;

      const scale = small ? 0.7 : 1.15;
      blobGroup.scale.setScalar(scale);
      blobGroup.position.y = small ? -0.35 : 0;
      const grow = reduced ? 1 : smooth(0, 0.55, p);
      arms.forEach((arm) => {
        arm.cylinder.visible = grow > 0.01;
        arm.satellite.visible = grow > 0.01;
        const end = arm.end.clone().multiplyScalar(grow);
        if (small) {
          end.x *= 0.72;
          end.y *= 1.5;
        }
        arm.satellite.position.copy(end);
        arm.cylinder.position.copy(end).multiplyScalar(0.5);
        arm.cylinder.scale.set(1, end.length(), 1);
        arm.cylinder.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          end.clone().normalize(),
        );
      });
      cameraAt(0, 0.15, small ? 12 : 8.3, 0, small ? -0.2 : 0, 0);
    }
    renderer.render(scene, camera);
    host.dataset.openingLayer = ground.visible
      ? "live-water"
      : reel.visible
        ? "reel"
        : "other";
    host.dataset.liveLayers = String(
      Number(sculpture.visible) + Number(reel.visible),
    );
    host.dataset.waterRipples = String(water.activity.count);
    host.dataset.waterTime = water.activity.time.toFixed(2);
    host.dataset.roomBuild =
      id === "about"
        ? (reduced ? 1 : mix(0.05, 1, smooth(0, 0.38, p))).toFixed(3)
        : id === "process" && p > 0.92
          ? (smooth(0.92, 1, p) * 0.05).toFixed(3)
          : "0";
    if (id === "contact") {
      contactPoints = arms.map((arm) => {
        const position = arm.satellite.position.clone();
        const center = blobGroup.localToWorld(position.clone());
        const edge = blobGroup.localToWorld(
          position.clone().add(new THREE.Vector3(0.14, 0, 0)),
        );
        const projected = center.project(camera);
        const projectedEdge = edge.project(camera);
        return {
          x: (projected.x * 0.5 + 0.5) * host.clientWidth,
          y: (-0.5 * projected.y + 0.5) * host.clientHeight,
          radius:
            Math.abs(projectedEdge.x - projected.x) * 0.5 * host.clientWidth,
        };
      });
    }
    host.dataset.chapter = id;
    host.dataset.progress = p.toFixed(3);
    onUpdate({
      id,
      p,
      mode,
      processIndex,
      introOpacity,
      workOpacity,
      studioOpacity,
      contactPoints,
    });
    if (
      !reduced ||
      (id === "portfolio" &&
        manualFilm !== null &&
        Math.abs(currentFilm - manualFilm) > 0.001)
    )
      request();
  }
  function request() {
    if (!raf && !paused) raf = requestAnimationFrame(render);
  }
  function resize() {
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    const captureWidth = Math.min(1280, host.clientWidth);
    shotCanvas.width = captureWidth;
    shotCanvas.height = Math.max(
      1,
      Math.round((captureWidth * host.clientHeight) / host.clientWidth),
    );
    shotTexture.needsUpdate = true;
    shotReady = false;
    camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
    camera.updateProjectionMatrix();
    measure();
    playhead = scrollY;
    updateState();
  }
  new ResizeObserver(resize).observe(host);
  addEventListener("scroll", updateState, { passive: true });
  addEventListener("resize", resize);
  function disturbWater(e, strength = 1) {
    if (reduced || state.id !== "home" || state.p >= 0.38) return;
    const rect = host.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    if (
      raycaster.ray.intersectPlane(waterPlane, waterHit) &&
      waterHit.distanceTo(camera.position) < 65
    ) {
      water.ripple(waterHit.x, waterHit.z, performance.now() * 0.001, strength);
      request();
    }
  }
  window.addEventListener("pointermove", (e) => disturbWater(e), {
    passive: true,
  });
  host.addEventListener("pointermove", (e) => {
    px = e.clientX / innerWidth - 0.5;
    py = e.clientY / innerHeight - 0.5;
    if (drag && state.id === "portfolio") {
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 8) drag.moved = true;
      if (drag.moved) {
        manualFilm = clamp(
          drag.start - (dx / host.clientWidth) * 3,
          1,
          projects.length,
        );
        request();
      }
    } else request();
  });
  host.addEventListener("pointerdown", (e) => {
    if (e.button === 0 && state.id === "home") {
      disturbWater(e, 1.35);
      return;
    }
    if (e.button !== 0 || state.id !== "portfolio") return;
    drag = { x: e.clientX, start: manualFilm ?? currentFilm, moved: false };
    host.setPointerCapture(e.pointerId);
  });
  function release(e, cancelled = false) {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (host.hasPointerCapture(e.pointerId))
      host.releasePointerCapture(e.pointerId);
    if (moved) {
      manualFilm = Math.round(manualFilm ?? currentFilm);
      onSelect(clamp(manualFilm - 1, 0, projects.length - 1));
    } else if (!cancelled) {
      const rect = host.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObjects(panels)[0];
      if (hit) {
        manualFilm = Math.max(1, hit.object.userData.index);
        onSelect(clamp(manualFilm - 1, 0, projects.length - 1));
      }
    }
    request();
  }
  host.addEventListener("pointerup", (e) => release(e));
  host.addEventListener("pointercancel", (e) => release(e, true));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) request();
  });
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    host.classList.remove("journey-ready");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    host.classList.add("journey-ready");
    request();
  });
  resize();
  request();
  host.classList.add("journey-ready");
  return {
    goToProject(index) {
      if (state.id === "portfolio") {
        manualFilm = index + 1;
        request();
      }
    },
    pause(value) {
      paused = value;
      if (!value) request();
    },
    refresh: resize,
  };
}
