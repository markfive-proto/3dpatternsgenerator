import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import type { PatternConfig } from "./ThreeCanvas";

interface PromptBarProps {
  onApply: (config: Partial<PatternConfig>) => void;
}

interface Preset {
  name: string;
  config: Partial<PatternConfig>;
}

// ═══════════════════════════════════════════════
// 20 PRESETS — showcasing all shaders + shapes
// ═══════════════════════════════════════════════

const PRESETS: Preset[] = [
  { name: "Plasma Globe", config: { objectType: "sphere", shaderStyle: "particles", color: "#f97316", secondaryColor: "#7c3aed", bgColor: "#000000", noiseAmplitude: 0.6, noiseFrequency: 2.5, noiseSpeed: 0.8, pointSize: 3, particleDensity: 120, size: 1.8, glowIntensity: 1.5 } },
  { name: "Holo Crystal", config: { objectType: "crystal", shaderStyle: "holographic", color: "#e0e7ff", secondaryColor: "#c084fc", bgColor: "#c7d2e0", noiseAmplitude: 0.3, noiseFrequency: 2, noiseSpeed: 0.4, particleDensity: 80, size: 1.6, glowIntensity: 1.2 } },
  { name: "Glass Blob", config: { objectType: "sphere", shaderStyle: "glass", color: "#ffffff", secondaryColor: "#e0e0e0", bgColor: "#b8c4cc", noiseAmplitude: 0.8, noiseFrequency: 1.5, noiseSpeed: 0.5, particleDensity: 120, size: 1.6, glowIntensity: 1.5 } },
  { name: "Toon Capsule", config: { objectType: "capsule", shaderStyle: "toon", color: "#ef4444", secondaryColor: "#fbbf24", bgColor: "#fef3c7", noiseAmplitude: 0.3, noiseFrequency: 2, noiseSpeed: 0.4, particleDensity: 80, size: 1.5, glowIntensity: 1 } },
  { name: "Neon Wire", config: { objectType: "torusknot", shaderStyle: "meshLines", color: "#06b6d4", secondaryColor: "#3b82f6", bgColor: "#050510", noiseAmplitude: 0.25, noiseFrequency: 2.5, noiseSpeed: 0.6, particleDensity: 60, size: 1.4, glowIntensity: 2 } },
  { name: "Chrome Future", config: { objectType: "torus", shaderStyle: "futuristic", color: "#ef4444", secondaryColor: "#22c55e", bgColor: "#0d0d0d", noiseAmplitude: 0.35, noiseFrequency: 2, noiseSpeed: 0.5, particleDensity: 100, size: 1.5, glowIntensity: 1.8 } },
  { name: "Lava Core", config: { objectType: "sphere", shaderStyle: "lava", color: "#f97316", secondaryColor: "#ef4444", bgColor: "#0a0000", noiseAmplitude: 0.5, noiseFrequency: 2, noiseSpeed: 0.8, particleDensity: 100, size: 1.8, glowIntensity: 2 } },
  { name: "Electric Knot", config: { objectType: "cinquefoil", shaderStyle: "electric", color: "#06b6d4", secondaryColor: "#a855f7", bgColor: "#000010", noiseAmplitude: 0.3, noiseFrequency: 3, noiseSpeed: 1, particleDensity: 80, size: 1.4, glowIntensity: 2.5 } },
  { name: "Aurora Ring", config: { objectType: "torus", shaderStyle: "aurora", color: "#22c55e", secondaryColor: "#3b82f6", bgColor: "#020810", noiseAmplitude: 0.4, noiseFrequency: 2, noiseSpeed: 0.5, particleDensity: 100, size: 1.6, glowIntensity: 1.5 } },
  { name: "X-Ray Scan", config: { objectType: "icosahedron", shaderStyle: "xray", color: "#22d3ee", secondaryColor: "#06b6d4", bgColor: "#000000", noiseAmplitude: 0.3, noiseFrequency: 2, noiseSpeed: 0.3, particleDensity: 80, size: 1.6, glowIntensity: 1.5 } },
  { name: "Marble Sphere", config: { objectType: "sphere", shaderStyle: "marble", color: "#f5f5f4", secondaryColor: "#57534e", bgColor: "#d6d3d1", noiseAmplitude: 0.2, noiseFrequency: 2, noiseSpeed: 0.2, particleDensity: 100, size: 1.8, glowIntensity: 0.5 } },
  { name: "Plasma Torus", config: { objectType: "torus", shaderStyle: "plasma", color: "#a855f7", secondaryColor: "#ec4899", bgColor: "#0a001a", noiseAmplitude: 0.4, noiseFrequency: 2, noiseSpeed: 1, particleDensity: 100, size: 1.5, glowIntensity: 1.5 } },
  { name: "Voronoi Shell", config: { objectType: "dodecahedron", shaderStyle: "voronoi", color: "#f97316", secondaryColor: "#0d0d0d", bgColor: "#1a1a2e", noiseAmplitude: 0.3, noiseFrequency: 2, noiseSpeed: 0.3, particleDensity: 80, size: 1.6, glowIntensity: 1 } },
  { name: "Retro Cube", config: { objectType: "cube", shaderStyle: "retro", color: "#22c55e", secondaryColor: "#000000", bgColor: "#1a1a1a", noiseAmplitude: 0.2, noiseFrequency: 2, noiseSpeed: 0.4, particleDensity: 60, size: 1.6, glowIntensity: 1 } },
  { name: "Fresnel Glow", config: { objectType: "sphere", shaderStyle: "fresnel", color: "#a855f7", secondaryColor: "#1e1b4b", bgColor: "#000000", noiseAmplitude: 0.5, noiseFrequency: 2, noiseSpeed: 0.5, particleDensity: 100, size: 1.8, glowIntensity: 2 } },
  { name: "Oil Slick", config: { objectType: "sphere", shaderStyle: "iridescent", color: "#1e293b", secondaryColor: "#334155", bgColor: "#f1f5f9", noiseAmplitude: 0.4, noiseFrequency: 2, noiseSpeed: 0.4, particleDensity: 120, size: 1.8, glowIntensity: 1.2 } },
  { name: "Topo Map", config: { objectType: "sphere", shaderStyle: "topographic", color: "#22c55e", secondaryColor: "#065f46", bgColor: "#f0fdf4", noiseAmplitude: 0.6, noiseFrequency: 2, noiseSpeed: 0.2, particleDensity: 120, size: 1.8, glowIntensity: 0.5 } },
  { name: "Emission Pulse", config: { objectType: "starknot", shaderStyle: "emission", color: "#f43f5e", secondaryColor: "#fb923c", bgColor: "#0a0000", noiseAmplitude: 0.3, noiseFrequency: 2, noiseSpeed: 0.6, particleDensity: 80, size: 1.4, glowIntensity: 2 } },
  { name: "Chromatic Möbius", config: { objectType: "mobius", shaderStyle: "chromatic", color: "#ffffff", secondaryColor: "#000000", bgColor: "#111111", noiseAmplitude: 0.2, noiseFrequency: 2, noiseSpeed: 0.5, particleDensity: 80, size: 1.6, glowIntensity: 1 } },
  { name: "Gradient Spring", config: { objectType: "spring", shaderStyle: "gradient", color: "#f97316", secondaryColor: "#a78bfa", bgColor: "#f5e6d3", noiseAmplitude: 0.3, noiseFrequency: 2, noiseSpeed: 0.3, particleDensity: 60, size: 1.4, glowIntensity: 0.8 } },
];

// ═══════════════════════════════════════════════
// PROMPT PARSER
// ═══════════════════════════════════════════════

function matchFromMap(text: string, map: Record<string, string>): string | undefined {
  const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (text.includes(key)) return map[key];
  }
  return undefined;
}

function parsePrompt(text: string): Partial<PatternConfig> {
  const lower = text.toLowerCase();
  const result: Partial<PatternConfig> = {};

  // Shapes
  const objectMap: Record<string, string> = {
    "torus knot": "torusknot", "star knot": "starknot", "mobius strip": "mobius",
    torusknot: "torusknot", sphere: "sphere", globe: "sphere", ball: "sphere", orb: "sphere",
    torus: "torus", donut: "torus", doughnut: "torus", ring: "torus",
    knot: "torusknot", twisted: "torusknot",
    cube: "cube", box: "cube", square: "cube", block: "cube",
    cone: "cone", pyramid: "cone", triangle: "cone",
    cylinder: "cylinder", tube: "cylinder", pipe: "cylinder", pillar: "cylinder",
    octahedron: "octahedron", diamond: "octahedron",
    icosahedron: "icosahedron", ico: "icosahedron", geodesic: "icosahedron",
    dodecahedron: "dodecahedron", dodeca: "dodecahedron", pentagon: "dodecahedron",
    tetrahedron: "tetrahedron",
    capsule: "capsule", pill: "capsule",
    cinquefoil: "cinquefoil",
    starknot: "starknot",
    crystal: "crystal", gem: "crystal", prism: "crystal",
    spring: "spring", helix: "spring", coil: "spring", spiral: "spring",
    mobius: "mobius",
  };
  const objMatch = matchFromMap(lower, objectMap);
  if (objMatch) result.objectType = objMatch;

  // Shaders
  const styleMap: Record<string, string> = {
    "mesh line": "meshLines", "mesh lines": "meshLines", "x-ray": "xray", "sci-fi": "futuristic",
    "oil slick": "iridescent", "thin film": "iridescent", "topo map": "topographic",
    particle: "particles", particles: "particles", dot: "particles", dots: "particles", points: "particles", cloud: "particles",
    holographic: "holographic", holo: "holographic", rainbow: "holographic",
    gradient: "gradient", pastel: "gradient", dreamy: "gradient",
    glass: "glass", liquid: "glass", transparent: "glass", water: "glass", ice: "glass", jelly: "glass", gel: "glass",
    wireframe: "meshLines", wire: "meshLines", outline: "meshLines", skeleton: "meshLines",
    futuristic: "futuristic", chrome: "futuristic", neon: "futuristic", metallic: "futuristic", metal: "futuristic", scifi: "futuristic", cyber: "futuristic",
    toon: "toon", cartoon: "toon", cel: "toon", comic: "toon",
    plasma: "plasma", psychedelic: "plasma",
    xray: "xray", blueprint: "xray", scan: "xray",
    fresnel: "fresnel", rim: "fresnel", edge: "fresnel",
    voronoi: "voronoi", cell: "voronoi", cellular: "voronoi",
    marble: "marble", stone: "marble", veins: "marble",
    aurora: "aurora", northern: "aurora", borealis: "aurora",
    lava: "lava", magma: "lava", molten: "lava", volcanic: "lava",
    electric: "electric", lightning: "electric", bolt: "electric", spark: "electric",
    chromatic: "chromatic", prismatic: "chromatic", dispersion: "chromatic",
    topographic: "topographic", contour: "topographic", topo: "topographic", terrain: "topographic",
    retro: "retro", pixel: "retro", "8-bit": "retro", crt: "retro", vintage: "retro",
    iridescent: "iridescent", opal: "iridescent", shimmer: "iridescent", pearlescent: "iridescent",
    emission: "emission", pulse: "emission", glow: "emission", pulsing: "emission", heartbeat: "emission",
  };
  const styleMatch = matchFromMap(lower, styleMap);
  if (styleMatch) result.shaderStyle = styleMatch;

  // Colors
  const colorMap: Record<string, string> = {
    "dark red": "#991b1b", "dark blue": "#1e3a8a", "dark green": "#14532d",
    "light blue": "#93c5fd", "light green": "#86efac", "light pink": "#fbcfe8", "hot pink": "#ec4899",
    red: "#ef4444", blue: "#3b82f6", green: "#22c55e", yellow: "#eab308",
    purple: "#a855f7", pink: "#ec4899", orange: "#f97316", cyan: "#06b6d4",
    teal: "#14b8a6", white: "#ffffff", black: "#111111",
    gold: "#d4a017", golden: "#d4a017", silver: "#94a3b8",
    indigo: "#6366f1", rose: "#f43f5e", emerald: "#10b981",
    amber: "#f59e0b", violet: "#8b5cf6", lime: "#84cc16",
    coral: "#f97171", magenta: "#d946ef", turquoise: "#2dd4bf",
    navy: "#1e3a8a", peach: "#fdba74", lavender: "#c4b5fd",
    mint: "#6ee7b7", salmon: "#fca5a5", cream: "#fef3c7", burgundy: "#881337",
  };
  const colorMatch = matchFromMap(lower, colorMap);
  if (colorMatch) result.color = colorMatch;

  const hexMatch = lower.match(/#[0-9a-f]{6}/);
  if (hexMatch) result.color = hexMatch[0];

  // Noise descriptors
  if (lower.includes("smooth") || lower.includes("calm")) { result.noiseAmplitude = 0.2; result.noiseFrequency = 1.5; result.noiseSpeed = 0.3; }
  if (lower.includes("wild") || lower.includes("chaotic") || lower.includes("crazy")) { result.noiseAmplitude = 1.5; result.noiseFrequency = 4; result.noiseSpeed = 1.5; }
  if (lower.includes("spiky") || lower.includes("sharp")) { result.noiseAmplitude = 1; result.noiseFrequency = 5; result.noiseSpeed = 0.8; }

  if (lower.includes("tiny") || lower.includes("small")) result.size = 0.8;
  if (lower.includes("large") || lower.includes("big")) result.size = 2.5;
  if (lower.includes("dense") || lower.includes("detailed")) result.particleDensity = 180;
  if (lower.includes("sparse") || lower.includes("low poly")) result.particleDensity = 30;
  if (lower.includes("dark background") || lower.includes("black background")) result.bgColor = "#000000";
  if (lower.includes("white background") || lower.includes("light background")) result.bgColor = "#e8e8e8";
  if (lower.includes("bright")) result.glowIntensity = 2.5;
  if (lower.includes("fast")) result.noiseSpeed = 2;
  if (lower.includes("slow")) result.noiseSpeed = 0.2;
  if (lower.includes("still") || lower.includes("static")) result.noiseSpeed = 0;

  return result;
}

// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════

export function PromptBar({ onApply }: PromptBarProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    const parsed = parsePrompt(prompt);
    onApply(parsed);
    setPrompt("");
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 p-3">
        <Sparkles className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" />
        <input
          type="text"
          placeholder="e.g. 'glass torus knot with glow' or 'lava sphere dark background'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1 bg-[var(--input-background)] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim()}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          Generate
        </button>
      </div>

      <div className="flex gap-2 px-3 pb-3 overflow-x-auto">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onApply(preset.config)}
            className="shrink-0 px-3 py-1.5 bg-[var(--muted)] text-[var(--foreground)] rounded-full text-[12px] hover:bg-[var(--accent)] transition-colors whitespace-nowrap border border-[var(--border)]"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
