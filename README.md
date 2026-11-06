# Sumanth N — Portfolio

A buildless portfolio with one scroll-driven 3D journey and a separate navigable project exhibition. Compatible with GitHub Pages; no API keys or build step are required.

## Local preview

Run `python -m http.server 8000 --bind 127.0.0.1` in this folder and open http://127.0.0.1:8000/.

Scroll normally through Home, Work, Process, About, and Contact. The page uses native document scrolling; one fixed WebGL scene follows a damped scroll playhead. The opening recedes into a curved project reel, the reel coils into a chrome form, five wireframe process models assemble, the studio camera moves through a room that fragments into lines, and the final contact connections grow into place. The same progression reverses when scrolling up.

The opening sculpture floats above an animated reflective water surface. Moving the pointer over the water creates travelling ripples; touch presses create an impulse too. The live opening hands over to a captured reel frame without rendering a second sculpture behind it. Studio components trace their individual line segments and assemble progressively before the camera moves through the finished room.

The opening has a brief scarlet light sweep across the chrome, followed by a water ripple. Pointer movement gently steers the sculpture and its lighting. Click or tap the scene, or activate “Dip the diamond” with the keyboard, to lower the diamond to the water and float it back. A ripple starts at its contact point. Repeated activation during a dip is ignored; dragging or vertical scrolling does not trigger it. Reduced motion keeps the scene static and hides the dip control.


Use the chapter menu for direct navigation. In Work, drag the reel or use the arrow buttons/keys. Enter the exhibition to explore the original museum scene and project stories. Escape closes it. The background journey pauses while the exhibition is open.

The crimson edition adds red typographic accents and reflected colour on the water, stronger waves and pointer impulses, and a dark kinetic exhibition. Artwork frames float with layered backing plates; metallic sculptures rotate inside orbiting red rings. A reflective floor and repeating architectural portals give depth to the camera's banked transitions. Gallery animation is capped at roughly 30 frames per second, pauses offscreen, and respects reduced motion.

## Source

- `js/journey.js`: shared scene, reflective opening, curved reel, morphing form, camera paths and scroll playhead.
- `js/water.js`: animated water geometry, distorted reflections and pointer ripple impulses.
- `js/blueprints.js`: original 3D line-art process/studio models, continuous stroke drawing, staggered assembly and reversible per-segment fragmentation.
- `js/gallery.js`: separate project exhibition.
- `js/projects.js`: project text and concept labels.
- `js/index.js`: chapter interface, navigation and exhibition lifecycle.

Original poster artwork is in `images/exhibits/`; it is a visual interpretation, not product photography. Invented projects are identified as concepts. The previous SVG process drawings remain as static fallbacks when WebGL cannot initialize.

The visual/motion reference is the user-selected https://byholm.co/ and the user's screen recording. Its logo, source code, project images, and text have not been imported.

Three.js 0.180.0, including its Reflector and RoomEnvironment examples, is vendored in `js/vendor/` with the MIT license. Google Fonts are optional with local font fallbacks. Reduced-motion preferences remove continuous movement and camera easing. Rendering pauses while the document is hidden or the exhibition is open.
