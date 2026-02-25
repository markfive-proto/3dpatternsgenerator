import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SHADER_DEFS } from "./shaders";

export interface PatternConfig {
  objectType: string;
  shaderStyle: string;
  color: string;
  secondaryColor: string;
  size: number;
  noiseAmplitude: number;
  noiseFrequency: number;
  noiseSpeed: number;
  pointSize: number;
  particleDensity: number;
  opacity: number;
  bgColor: string;
  glowIntensity: number;
  rotationSpeed: number;
}

interface ThreeCanvasProps {
  config: PatternConfig;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// ═══════════════════════════════════════════════
// 16 BASE SHAPES
// ═══════════════════════════════════════════════

// Helix curve for spring shape — defined at module level to avoid class-in-block issues
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 6;
    return new THREE.Vector3(Math.cos(a) * 0.7, (t - 0.5) * 2.2, Math.sin(a) * 0.7);
  }
}

function createBaseGeometry(type: string, density: number): THREE.BufferGeometry {
  const s = density;
  switch (type) {
    case "sphere":
      return new THREE.SphereGeometry(1, s, s);
    case "torus":
      return new THREE.TorusGeometry(1, 0.4, s, s * 2);
    case "torusknot":
      return new THREE.TorusKnotGeometry(1, 0.3, s * 4, s);
    case "cube":
      return new THREE.BoxGeometry(1.6, 1.6, 1.6, s, s, s);
    case "cone":
      return new THREE.ConeGeometry(1, 2, s, s);
    case "cylinder":
      return new THREE.CylinderGeometry(1, 1, 2, s, s);
    case "octahedron":
      return new THREE.OctahedronGeometry(1, Math.min(s, 8));
    case "icosahedron":
      return new THREE.IcosahedronGeometry(1, Math.min(s, 8));
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(1, Math.min(s, 6));
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(1, Math.min(s, 8));
    case "capsule":
      return new THREE.CapsuleGeometry(0.7, 1.2, Math.min(s, 32), s);
    case "cinquefoil":
      return new THREE.TorusKnotGeometry(1, 0.25, s * 4, s, 2, 5);
    case "starknot":
      return new THREE.TorusKnotGeometry(1, 0.2, s * 4, s, 3, 7);
    case "crystal": {
      const geo = new THREE.OctahedronGeometry(1, Math.min(s, 8));
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * 1.8);
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }
    case "spring": {
      return new THREE.TubeGeometry(new HelixCurve(), Math.max(s * 3, 64), 0.15, Math.max(Math.floor(s / 4), 8), false);
    }
    case "mobius": {
      const segs = Math.max(s, 30);
      const strips = Math.max(Math.floor(s / 3), 8);
      const positions: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i <= segs; i++) {
        const u = (i / segs) * Math.PI * 2;
        for (let j = 0; j <= strips; j++) {
          const v = (j / strips) * 2 - 1;
          const ha = u / 2;
          const x = (1 + v * 0.35 * Math.cos(ha)) * Math.cos(u);
          const z = (1 + v * 0.35 * Math.cos(ha)) * Math.sin(u);
          const y = v * 0.35 * Math.sin(ha);
          positions.push(x, y, z);
        }
      }
      for (let i = 0; i < segs; i++) {
        for (let j = 0; j < strips; j++) {
          const a = i * (strips + 1) + j;
          const b = a + 1;
          const c = (i + 1) * (strips + 1) + j;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    }
    default:
      return new THREE.SphereGeometry(1, s, s);
  }
}

function createUniforms(config: PatternConfig) {
  return {
    uTime: { value: 0 },
    uNoiseAmplitude: { value: config.noiseAmplitude },
    uNoiseFrequency: { value: config.noiseFrequency },
    uPointSize: { value: config.pointSize },
    uSize: { value: config.size },
    uColor: { value: new THREE.Color(config.color) },
    uSecondaryColor: { value: new THREE.Color(config.secondaryColor) },
    uOpacity: { value: config.opacity },
    uGlowIntensity: { value: config.glowIntensity },
  };
}

export function ThreeCanvas({ config, canvasRef }: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const sceneDataRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    object: THREE.Object3D | null;
    material: THREE.ShaderMaterial | null;
    animationId: number;
    startTime: number;
    currentObjectType: string;
    currentDensity: number;
    currentShaderStyle: string;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = Math.max(container.clientWidth, 100);
    const height = Math.max(container.clientHeight, 100);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.bgColor);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.5, 5.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const data = {
      renderer,
      scene,
      camera,
      controls,
      object: null as THREE.Object3D | null,
      material: null as THREE.ShaderMaterial | null,
      animationId: 0,
      startTime: performance.now(),
      currentObjectType: "",
      currentDensity: 0,
      currentShaderStyle: "",
    };
    sceneDataRef.current = data;

    function clearObject() {
      if (!data.object) return;
      data.object.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.LineSegments) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            (child.material as THREE.Material)?.dispose();
          }
        }
      });
      scene.remove(data.object);
      data.object = null;
      data.material = null;
    }

    function buildObject(objectType: string, density: number, shaderStyle: string) {
      clearObject();

      const shaderDef = SHADER_DEFS[shaderStyle];
      if (!shaderDef) return;

      const cfg = configRef.current;
      const baseGeo = createBaseGeometry(objectType, density);

      const mat = new THREE.ShaderMaterial({
        vertexShader: shaderDef.vertexShader,
        fragmentShader: shaderDef.fragmentShader,
        uniforms: createUniforms(cfg),
        transparent: shaderDef.transparent ?? false,
        depthWrite: shaderDef.depthWrite ?? true,
        wireframe: shaderDef.wireframe ?? false,
        side: shaderDef.side === "double" ? THREE.DoubleSide : THREE.FrontSide,
        blending: shaderDef.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

      let obj: THREE.Object3D;

      if (shaderDef.renderMode === "points") {
        const posAttr = baseGeo.attributes.position as THREE.BufferAttribute;
        const cloned = new Float32Array(posAttr.array.length);
        cloned.set(posAttr.array);
        const pointsGeo = new THREE.BufferGeometry();
        pointsGeo.setAttribute("position", new THREE.BufferAttribute(cloned, 3));
        // Copy normals if they exist for proper vNormal in shader
        if (baseGeo.attributes.normal) {
          const normAttr = baseGeo.attributes.normal as THREE.BufferAttribute;
          const normCloned = new Float32Array(normAttr.array.length);
          normCloned.set(normAttr.array);
          pointsGeo.setAttribute("normal", new THREE.BufferAttribute(normCloned, 3));
        }
        baseGeo.dispose();
        obj = new THREE.Points(pointsGeo, mat);
      } else {
        obj = new THREE.Mesh(baseGeo, mat);
      }

      scene.add(obj);
      data.object = obj;
      data.material = mat;
      data.currentObjectType = objectType;
      data.currentDensity = density;
      data.currentShaderStyle = shaderStyle;
    }

    const cfg = configRef.current;
    buildObject(cfg.objectType, cfg.particleDensity, cfg.shaderStyle);

    function animate() {
      data.animationId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - data.startTime) / 1000;
      const c = configRef.current;

      if (
        c.objectType !== data.currentObjectType ||
        c.particleDensity !== data.currentDensity ||
        c.shaderStyle !== data.currentShaderStyle
      ) {
        buildObject(c.objectType, c.particleDensity, c.shaderStyle);
      }

      if (data.material) {
        const u = data.material.uniforms;
        u.uTime.value = elapsed * c.noiseSpeed;
        u.uNoiseAmplitude.value = c.noiseAmplitude;
        u.uNoiseFrequency.value = c.noiseFrequency;
        u.uSize.value = c.size;
        u.uColor.value.set(c.color);
        u.uSecondaryColor.value.set(c.secondaryColor);
        u.uOpacity.value = c.opacity;
        u.uGlowIntensity.value = c.glowIntensity;
        if (u.uPointSize) u.uPointSize.value = c.pointSize;
      }

      if (data.object) {
        data.object.rotation.y += c.rotationSpeed * 0.01;
      }

      scene.background = new THREE.Color(c.bgColor);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(data.animationId);
      clearObject();
      renderer.dispose();
      sceneDataRef.current = null;
    };
  }, [canvasRef]);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: 200 }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}