import * as THREE from "./vendor/three.module.min.js";
import { Reflector } from "./vendor/Reflector.js";

const waveFunctions = `
  uniform float uTime;
  uniform float uMotion;
  uniform vec4 uRipples[8];
  float waterHeight(vec2 p) {
    float t=uTime*uMotion;
    float h=sin(p.x*.72+p.y*.23-t*.72)*.065;
    h+=sin(p.x*1.41-p.y*.65+t*.53)*.035;
    h+=sin(p.x*2.63+p.y*1.73-t*1.12)*.018;
    for(int i=0;i<8;i++) {
      float age=max(0.,uTime-uRipples[i].z);
      float d=length(p-uRipples[i].xy);
      float front=d-age*2.25;
      float envelope=exp(-front*front*.38)*exp(-age*.65);
      h+=sin(d*8.2-age*7.4)*envelope*.065*uRipples[i].w*uMotion;
    }
    return h*uMotion;
  }
`;

export function createWater(reduced = false) {
  const shader = {
    uniforms: {
      ...THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),
      uTime: { value: 0 },
      uMotion: { value: reduced ? 0 : 1 },
      uRipples: {
        value: Array.from(
          { length: 8 },
          () => new THREE.Vector4(0, 0, -100, 0),
        ),
      },
    },
    vertexShader: `
      uniform mat4 textureMatrix;
      varying vec4 vUv;
      varying vec2 vWater;
      varying vec3 vWorld;
      ${waveFunctions}
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main(){
        vec3 displaced=position;
        displaced.z+=waterHeight(position.xy);
        vWater=position.xy;
        vWorld=(modelMatrix*vec4(displaced,1.)).xyz;
        vUv=textureMatrix*vec4(displaced,1.);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(displaced,1.);
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec3 color;
      varying vec4 vUv;
      varying vec2 vWater;
      varying vec3 vWorld;
      ${waveFunctions}
      #include <common>
      #include <logdepthbuf_pars_fragment>
      void main(){
        #include <logdepthbuf_fragment>
        float e=.04;
        float h=waterHeight(vWater);
        vec2 slope=vec2(waterHeight(vWater+vec2(e,0.))-h,waterHeight(vWater+vec2(0.,e))-h)/e;
        vec3 n=normalize(vec3(-slope.x,1.,slope.y));
        vec3 view=normalize(cameraPosition-vWorld);
        float fresnel=.62+.38*pow(1.-max(dot(n,view),0.),4.);
        vec4 uv=vUv;
        uv.xy+=vec2(slope.x,-slope.y)*uv.w*.32;
        vec2 sampleUv=uv.xy/uv.w;
        float dispersion=.00055*length(slope);
        vec3 reflection;
        reflection.r=texture2D(tDiffuse,sampleUv+vec2(dispersion,0.)).r;
        reflection.g=texture2D(tDiffuse,sampleUv).g;
        reflection.b=texture2D(tDiffuse,sampleUv-vec2(dispersion,0.)).b;
        vec3 light=normalize(vec3(-.08,.12,-1.));
        vec3 halfway=normalize(view+light);
        float spec=pow(max(dot(n,halfway),0.),140.);
        float streak=pow(.5+.5*sin(vWater.x*2.7+vWater.y*.9-uTime*.3),14.);
        vec3 base=mix(vec3(.055,.065,.079),reflection,fresnel);
        base+=vec3(.38,.4,.43)*spec*.22;
        base+=vec3(.10,.105,.11)*streak*pow(1.-abs(dot(n,view)),3.)*.12;
        float ribbon = exp(-pow((vWorld.x - 2.5 - sin(vWorld.z*.3+uTime*.35)*.8)/1.1,2.));
        float broken = .35+.65*pow(.5+.5*sin(vWater.y*4.+h*16.-uTime*.8),3.);
        base += vec3(.58,.002,.008)*ribbon*broken*(.25+length(slope)*2.)*exp(-abs(vWorld.z)*.045);
        float distanceToCamera=length(cameraPosition-vWorld);
        float horizon=smoothstep(25.,85.,distanceToCamera);
        base=mix(base,vec3(.27,.025,.045),horizon*.68);
        gl_FragColor=vec4(base,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  };
  const surface = new Reflector(new THREE.PlaneGeometry(180, 180, 160, 160), {
    color: 0x8b929a,
    textureWidth: 1024,
    textureHeight: 768,
    clipBias: 0.012,
    shader,
    multisample: 0,
  });
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.01;
  surface.frustumCulled = false;
  const uniforms = surface.material.uniforms;
  let cursor = 0,
    lastRippleTime = -100,
    lastPoint = new THREE.Vector2(1000, 1000);
  function ripple(x, z, time, strength = 1, force = false) {
    if (
      reduced ||
      (!force && (time - lastRippleTime < 0.075 ||
      (time - lastRippleTime < 0.5 && lastPoint.distanceTo(new THREE.Vector2(x, -z)) < 0.1)))
    )
      return;
    uniforms.uRipples.value[cursor].set(x, -z, time, strength);
    cursor = (cursor + 1) % 8;
    lastRippleTime = time;
    lastPoint.set(x, -z);
  }
  return {
    surface,
    update(time) {
      uniforms.uTime.value = time;
    },
    ripple,
    get activity() {
      return {
        count: uniforms.uRipples.value.filter(
          (r) => r.w > 0 && uniforms.uTime.value - r.z < 8,
        ).length,
        time: uniforms.uTime.value,
        lastRippleTime,
      };
    },
  };
}
