import * as THREE from "./vendor/three.module.min.js";

export function buildBlueprints() {
  const wire = (color) =>
    new THREE.LineBasicMaterial({
      color: color || "#ecf0f3",
      transparent: true,
      opacity: 1,
      depthTest: true,
    });
  function make() {
    const group = new THREE.Group();
    group.userData.lines = [];
    group.userData.material = wire();
    return group;
  }
  function edges(group, geometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const object = new THREE.LineSegments(
      new THREE.EdgesGeometry(
        geometry,
        /Sphere|Cylinder|Cone|Torus/.test(geometry.type) ? 1 : 25,
      ),
      group.userData.material,
    );
    object.position.set(x, y, z);
    object.rotation.set(rx, ry, rz);
    group.add(object);
    return object;
  }
  function box(g, w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    return edges(g, new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz);
  }
  function lines(g, points) {
    const pairs = [];
    for (let i = 0; i < points.length - 1; i++)
      pairs.push(
        new THREE.Vector3(...points[i]),
        new THREE.Vector3(...points[i + 1]),
      );
    const geometry = new THREE.BufferGeometry().setFromPoints(pairs);
    const line = new THREE.LineSegments(geometry, g.userData.material);
    g.add(line);
    return line;
  }
  function circle(g, r, x, y, z, rx = 0, ry = 0) {
    const points = [];
    for (let i = 0; i <= 64; i++)
      points.push([
        Math.cos((i / 64) * Math.PI * 2) * r,
        Math.sin((i / 64) * Math.PI * 2) * r,
        0,
      ]);
    const c = lines(g, points);
    c.position.set(x, y, z);
    c.rotation.set(rx, ry, 0);
    return c;
  }
  function grid(g, w, d, n = 12, y = 0, x = 0, z = 0) {
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      lines(g, [
        [x - w / 2 + f * w, y, z - d / 2],
        [x - w / 2 + f * w, y, z + d / 2],
      ]);
      lines(g, [
        [x - w / 2, y, z - d / 2 + f * d],
        [x + w / 2, y, z - d / 2 + f * d],
      ]);
    }
  }
  function screen(g, w, h, x, y, z) {
    box(g, w, h, 0.09, x, y, z);
    box(g, w - 0.15, 0.05, 0.03, x, y + h / 2 - 0.13, z + 0.07);
    for (let i = 0; i < 3; i++)
      circle(g, 0.025, x - w / 2 + 0.15 + i * 0.1, y + h / 2 - 0.13, z + 0.075);
  }
  const desk = make();
  box(desk, 5, 0.07, 3, 0, -0.35, 0);
  grid(desk, 4.7, 2.7, 14, -0.29);
  box(desk, 1.9, 0.035, 0.13, -0.6, -0.25, 1.15, 0, 0.05, 0);
  const pencil = edges(
    desk,
    new THREE.CylinderGeometry(0.075, 0.075, 2.4, 8),
    1.5,
    0.65,
    -0.25,
    0,
    0,
    -0.55,
  );
  edges(
    desk,
    new THREE.ConeGeometry(0.075, 0.3, 8),
    0.82,
    -0.44,
    -0.25,
    0,
    0,
    Math.PI - 0.55,
  );
  edges(
    desk,
    new THREE.CylinderGeometry(0.32, 0.24, 0.5, 20, 1, true),
    -1.6,
    0,
    -0.65,
  );
  circle(desk, 0.32, -1.6, 0.25, -0.65, Math.PI / 2);
  edges(
    desk,
    new THREE.TorusGeometry(0.2, 0.035, 6, 18, Math.PI * 1.7),
    -1.2,
    0,
    -0.65,
    0,
    0,
    Math.PI / 2,
  );
  const steam = [];
  for (let i = 0; i <= 40; i++)
    steam.push([-1.6 + Math.sin(i * 0.2) * 0.08, 0.35 + i * 0.025, -0.65]);
  lines(desk, steam);
  const sketch = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    sketch.push([-1.3 + t * 2.5, -0.23, Math.sin(t * Math.PI * 2) * 0.55]);
  }
  lines(desk, sketch);
  box(desk, 0.55, 0.17, 0.3, 0.8, -0.18, 0.95, 0, -0.2, 0);

  const frame = make();
  screen(frame, 4, 2.7, -0.35, 0.4, 0);
  box(frame, 0.22, 0.5, 0.13, -0.35, -1.2, 0);
  box(frame, 1.5, 0.05, 0.7, -0.35, -1.47, 0.15);
  box(frame, 1.6, 0.05, 0.5, -0.5, -1.43, 1.1, 0.1, 0, 0);
  screen(frame, 0.9, 1.65, 1.8, -0.25, 0.6);
  box(frame, 0.55, 0.06, 0.02, 1.8, 0.25, 0.67);
  box(frame, 0.55, 0.06, 0.02, 1.8, -0.05, 0.67);
  box(frame, 0.55, 0.06, 0.02, 1.8, -0.35, 0.67);
  box(frame, 1.4, 0.12, 0.015, -1, 0.95, 0.08);
  box(frame, 1.9, 0.05, 0.015, -0.75, 0.55, 0.08);
  box(frame, 1.5, 0.05, 0.015, -0.95, 0.37, 0.08);
  const ball = edges(
    frame,
    new THREE.SphereGeometry(0.6, 12, 8),
    0.55,
    -0.15,
    0.12,
  );
  ball.rotation.z = 0.2;
  box(frame, 0.6, 0.2, 0.02, -1.1, -0.6, 0.08);

  const material = make();
  edges(material, new THREE.SphereGeometry(0.95, 18, 10), 0, 0.1, 0);
  edges(material, new THREE.CylinderGeometry(1.1, 1.1, 0.1, 40), 0, -0.95, 0);
  box(material, 0.05, 2.3, 0.05, -2, 0.1, -0.2);
  edges(
    material,
    new THREE.ConeGeometry(0.32, 0.55, 4),
    -2,
    1.3,
    -0.2,
    0,
    0,
    Math.PI / 2,
  );
  lines(material, [
    [-2, -1, -0.2],
    [-2.5, -1.4, 0.4],
    [-2, -1, -0.2],
    [-1.5, -1.4, 0.4],
    [-2, -1, -0.2],
    [-2, -1.4, -0.8],
  ]);
  box(material, 0.05, 2.4, 0.05, 2, 0.1, 0);
  box(material, 0.8, 1, 0.08, 2, 1.1, 0, 0, -0.5, 0);
  edges(material, new THREE.OctahedronGeometry(0.55), -1.4, 1.2, 0);
  box(material, 0.4, 0.4, 0.4, 1.4, 1.9, -0.1, 0, 0.2, 0.15);
  circle(material, 0.18, -0.7, -1.4, 0.7, Math.PI / 2);
  box(material, 0.4, 0.07, 0.24, 0.3, -1.4, 0.8);

  const detail = make();
  box(detail, 4.9, 0.08, 3.1, 0, -0.45, 0);
  grid(detail, 4.7, 2.9, 14, -0.39);
  circle(detail, 0.68, -0.65, 0.4, 0.1, 0, 0.1);
  circle(detail, 0.58, -0.65, 0.4, 0.1, 0, 0.1);
  box(detail, 0.12, 1, 0.1, -1.1, -0.55, 0.15, 0, 0, -0.4);
  box(detail, 0.7, 0.9, 0.7, 1.25, 0.2, -0.7, 0.1, 0.35, 0);
  lines(detail, [
    [1.3, 0.75, -0.7],
    [2, 1.5, -0.7],
    [2.5, 1.5, -0.7],
  ]);
  lines(detail, [
    [0.2, 0.15, 0.7],
    [0.5, 0.6, 0.7],
    [0.7, 0.05, 0.7],
    [0.2, 0.15, 0.7],
  ]);
  lines(detail, [
    [0.5, 0.3, 0.7],
    [0.85, 0.1, 0.7],
  ]);
  box(detail, 0.9, 0.6, 0.03, 2, 0.6, 0.8, 0, -0.2, 0);
  lines(detail, [
    [1.7, 0.45, 0.83],
    [1.9, 0.6, 0.83],
    [2.1, 0.4, 0.83],
    [2.3, 0.7, 0.83],
  ]);

  const launch = make();
  box(launch, 3.3, 0.12, 2.1, 0, -0.65, 0.3);
  screen(launch, 3.3, 2.15, 0, 0.42, -0.72);
  screen(launch, 1.1, 1.5, -2, -0.22, 0.25);
  screen(launch, 0.75, 1.45, 2, -0.25, 0.55);
  edges(launch, new THREE.OctahedronGeometry(0.5), 0, 0.4, -0.52);
  circle(launch, 0.85, 0, 0.4, -0.52, 0.3, 0.3);
  for (let i = 0; i < 5; i++)
    box(launch, 0.05, 0.05, 0.02, 0.65 + i * 0.15, -0.65, 0.7);
  box(launch, 3.1, 0.025, 0.9, 0, -0.56, 0.65);
  screen(launch, 0.8, 0.6, 2.2, 1.5, -0.5);
  circle(launch, 0.22, 2.2, 1.5, -0.42);

  const room = make();
  grid(room, 11, 8, 14, -1.5);
  box(room, 11, 0.05, 8, 0, -1.55, 0);
  box(room, 0.06, 5.5, 8, -5.5, 1.25, 0);
  box(room, 11, 5.5, 0.06, 0, 1.25, -4);
  for (let i = 0; i < 4; i++)
    box(room, 2.1, 0.07, 0.65, -4.2, -0.6 + i * 0.9, -3.6);
  for (let i = 0; i < 12; i++)
    box(
      room,
      0.14,
      0.5,
      0.45,
      -5 + i * 0.14,
      0.6,
      -3.6,
      0,
      0,
      ((i % 3) - 1) * 0.05,
    );
  box(room, 4, 0.1, 1.8, 1, -0.05, -1);
  box(room, 0.12, 1.45, 0.12, -0.8, -0.8, -1.7);
  box(room, 0.12, 1.45, 0.12, 2.8, -0.8, -1.7);
  box(room, 0.12, 1.45, 0.12, -0.8, -0.8, -0.2);
  box(room, 0.12, 1.45, 0.12, 2.8, -0.8, -0.2);
  screen(room, 1.8, 1.25, 1.1, 0.85, -1.25);
  box(room, 0.1, 0.3, 0.1, 1.1, 0.08, -1.25);
  box(room, 0.75, 0.05, 0.4, 1.1, -0.02, -1.2);
  box(room, 1.2, 0.05, 0.4, 0.8, 0.05, -0.4);
  box(room, 0.4, 0.2, 0.4, -0.2, 0.1, -0.5);
  box(room, 1.2, 0.12, 1.15, 0.6, -0.75, 1);
  box(room, 1.2, 1.25, 0.09, 0.6, -0.05, 1.5, 0, 0.0, -0.05);
  edges(room, new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), 0.6, -1.15, 1);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    lines(room, [
      [0.6, -1.45, 1],
      [0.6 + Math.cos(a) * 0.7, -1.45, 1 + Math.sin(a) * 0.7],
    ]);
  }
  lines(room, [
    [2.5, 0, -1.5],
    [2.5, 1.4, -1.5],
    [1.8, 1.85, -1.5],
  ]);
  edges(
    room,
    new THREE.ConeGeometry(0.35, 0.35, 12, 1, true),
    1.7,
    1.7,
    -1.5,
    0,
    0,
    -0.4,
  );
  lines(room, [
    [0.5, 4, -1],
    [0.5, 2.8, -1],
  ]);
  edges(
    room,
    new THREE.SphereGeometry(0.65, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    0.5,
    2.75,
    -1,
  );
  edges(room, new THREE.CylinderGeometry(0.32, 0.25, 0.6, 12), 4, -1.2, 0.2);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    lines(room, [
      [4, -0.9, 0.2],
      [4 + Math.sin(a) * 0.5, -0.1 + i * 0.08, 0.2 + Math.cos(a) * 0.4],
    ]);
    edges(
      room,
      new THREE.SphereGeometry(0.18, 6, 3),
      4 + Math.sin(a) * 0.5,
      -0.1 + i * 0.08,
      0.2 + Math.cos(a) * 0.4,
      0,
      0,
      a,
    );
  }
  circle(room, 0.4, 3, 2, -3.95);
  lines(room, [
    [3, 2, -3.9],
    [3, 2.25, -3.9],
    [3, 2, -3.9],
    [3.2, 2, -3.9],
  ]);
  box(room, 1.6, 1.2, 0.05, 4, 1.2, -3.95);
  box(room, 1.6, 1.2, 0.05, -1, 1.3, -3.95);
  box(room, 0.1, 5.5, 0.1, 5.5, 1.25, 0);
  box(room, 11, 0.08, 0.08, 0, 4, 4);
  box(room, 0.08, 5.5, 0.08, -5.5, 1.25, 4);

  const models = [desk, frame, material, detail, launch];
  [...models, room].forEach((group, gi) => {
    group.traverse((object) => {
      if (!object.isLine) return;
      const i = group.userData.lines.length;
      object.userData.home = object.position.clone();
      object.userData.rotation = object.rotation.clone();
      object.userData.scatter = new THREE.Vector3(
        Math.sin(i * 7.13 + gi) * 2,
        Math.cos(i * 5.37 + gi) * 1.6,
        Math.sin(i * 3.17) * 2,
      );
      object.userData.count = object.geometry.attributes.position.count;
      object.userData.originalPositions =
        object.geometry.attributes.position.array.slice();
      object.userData.fragment = 0;
      object.userData.stroke = 1;
      group.userData.lines.push(object);
    });
  });
  function pose(
    group,
    opacity,
    assembly = 0,
    draw = 1,
    fragment = 0,
    build = 1,
  ) {
    group.visible = opacity > 0.005;
    if (!group.visible) return;
    group.userData.material.opacity = opacity;
    group.userData.lines.forEach((line, lineIndex) => {
      const rank = lineIndex / Math.max(group.userData.lines.length - 1, 1);
      const localBuild = THREE.MathUtils.clamp(
        (build - rank * 0.62) / 0.38,
        0,
        1,
      );
      const scatter = assembly * (build < 1 ? 1 - localBuild : 1);
      line.position
        .copy(line.userData.home)
        .addScaledVector(line.userData.scatter, scatter);
      line.rotation.copy(line.userData.rotation);
      line.rotation.x += scatter * 0.18;
      line.rotation.y += scatter * 0.25;
      const stroke = THREE.MathUtils.clamp(draw * localBuild, 0, 1);
      if (
        Math.abs(line.userData.fragment - fragment) > 0.001 ||
        Math.abs(line.userData.stroke - stroke) > 0.0005
      ) {
        const positions = line.geometry.attributes.position;
        const original = line.userData.originalPositions;
        const segments = positions.count / 2;
        for (let segment = 0; segment < segments; segment++) {
          const a = segment * 6;
          const seed = segment * 7.13 + lineIndex * 31.73;
          const dx = Math.sin(seed) * fragment * 3.5,
            dy = Math.cos(seed * 1.7) * fragment * 3.5,
            dz = Math.sin(seed * 2.1) * fragment * 3.5;
          const fill = THREE.MathUtils.clamp(stroke * segments - segment, 0, 1);
          positions.setXYZ(
            segment * 2,
            original[a] + dx,
            original[a + 1] + dy,
            original[a + 2] + dz,
          );
          positions.setXYZ(
            segment * 2 + 1,
            original[a] + (original[a + 3] - original[a]) * fill + dx,
            original[a + 1] + (original[a + 4] - original[a + 1]) * fill + dy,
            original[a + 2] + (original[a + 5] - original[a + 2]) * fill + dz,
          );
        }
        positions.needsUpdate = true;
        line.geometry.computeBoundingSphere();
        line.userData.fragment = fragment;
        line.userData.stroke = stroke;
      }
      line.geometry.setDrawRange(0, line.userData.count);
    });
  }
  return { models, room, pose };
}
