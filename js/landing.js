import * as THREE from "./vendor/three.module.min.js";
import { Reflector } from "./vendor/Reflector.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

export function createLanding(host) {
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
      fragmentShader: `varying vec3 vDirection;void main(){vec3 d=normalize(vDirection);float y=d.y;float band=exp(-abs(y)*11.);vec3 color=mix(vec3(.018,.022,.026),vec3(.91,.925,.93),band);float cloud=sin(d.x*5.+d.z*3.)*sin(d.y*13.+d.z*4.);color+=cloud*.035*band;gl_FragColor=vec4(color,1.);}`,
    }),
  );
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
  const reflectorShader = {
    ...Reflector.ReflectorShader,
    uniforms: THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),
    vertexShader: Reflector.ReflectorShader.vertexShader
      .replace("varying vec4 vUv;", "varying vec4 vUv; varying vec2 vGround;")
      .replace(
        "vUv = textureMatrix",
        "vGround=position.xy; vUv = textureMatrix",
      ),
    fragmentShader: Reflector.ReflectorShader.fragmentShader
      .replace(
        "varying vec4 vUv;",
        `varying vec4 vUv;varying vec2 vGround;
      vec2 hash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
      float cracks(vec2 p){vec2 n=floor(p);vec2 f=fract(p);float a=9.;float b=9.;for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=hash2(n+g);float d=length(g+o-f);if(d<a){b=a;a=d;}else if(d<b){b=d;}}}return 1.-smoothstep(.003,.022,b-a);}`,
      )
      .replace(
        "vec4 base = texture2DProj( tDiffuse, vUv );",
        `vec4 distorted=vUv;distorted.x+=sin(vGround.y*2.3+vGround.x*.5)*.0008*distorted.w;distorted.y+=sin(vGround.x*1.1)*.0004*distorted.w;vec4 base=texture2DProj(tDiffuse,distorted);float grain=fract(sin(dot(vGround,vec2(12.9898,78.233)))*43758.5453);base.rgb=base.rgb*.88+vec3(.05+grain*.012);base.rgb*=1.-cracks(vGround*.55)*.12;`,
      ),
  };
  const ground = new Reflector(new THREE.PlaneGeometry(160, 160), {
    color: 0x999999,
    textureWidth: 768,
    textureHeight: 768,
    clipBias: 0.003,
    shader: reflectorShader,
    multisample: 0,
  });
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.01;
  scene.add(ground);
  let visible = true,
    raf = 0,
    px = 0,
    py = 0,
    scroll = 0,
    last = 0;
  const v = new THREE.Vector3();
  function render(time) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (time - last < 32 && !reduced) {
      request();
      return;
    }
    last = time;
    const small = camera.aspect < 0.9;
    const z = small ? 16.5 : 11.0;
    camera.position.set(
      px * 0.28,
      0.85 + py * 0.1 + scroll * 0.4,
      z + scroll * 1.5,
    );
    v.set(0, (small ? 1.7 : 0.85) + scroll * 0.25, 0);
    camera.lookAt(v);
    sculpture.rotation.y = -0.18 + px * 0.14 - scroll * 0.3;
    diamond.rotation.y = 0.45 + (reduced ? 0 : time * 0.000035);
    renderer.render(scene, camera);
    if (!reduced) request();
  }
  function request() {
    if (!raf && visible) raf = requestAnimationFrame(render);
  }
  function resize() {
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
    camera.updateProjectionMatrix();
    request();
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) request();
    },
    { threshold: 0 },
  ).observe(host);
  host.parentElement.addEventListener("pointermove", (e) => {
    if (reduced) return;
    px = e.clientX / innerWidth - 0.5;
    py = e.clientY / innerHeight - 0.5;
    request();
  });
  addEventListener(
    "scroll",
    () => {
      scroll = Math.min(scrollY / Math.max(host.clientHeight, 1), 1);
      request();
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) request();
  });
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    host.classList.remove("scene-ready");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    host.classList.add("scene-ready");
    request();
  });
  resize();
  request();
  host.classList.add("scene-ready");
}
