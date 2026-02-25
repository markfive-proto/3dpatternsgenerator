import { useState } from "react";
import {
  Box,
  Palette,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Waves,
  Circle,
  Sun,
  Layers,
} from "lucide-react";
import type { PatternConfig } from "./ThreeCanvas";

interface ControlPanelProps {
  config: PatternConfig;
  onChange: (config: PatternConfig) => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onReset: () => void;
}

// ═══════════════════════════════════════════════
// 16 SHAPES
// ═══════════════════════════════════════════════

const OBJECTS = [
  { value: "sphere", label: "Sphere" },
  { value: "torus", label: "Torus" },
  { value: "torusknot", label: "Torus Knot" },
  { value: "cube", label: "Cube" },
  { value: "cone", label: "Cone" },
  { value: "cylinder", label: "Cylinder" },
  { value: "octahedron", label: "Octahedron" },
  { value: "icosahedron", label: "Icosahedron" },
  { value: "dodecahedron", label: "Dodecahedron" },
  { value: "tetrahedron", label: "Tetrahedron" },
  { value: "capsule", label: "Capsule" },
  { value: "cinquefoil", label: "Cinquefoil" },
  { value: "starknot", label: "Star Knot" },
  { value: "crystal", label: "Crystal" },
  { value: "spring", label: "Spring" },
  { value: "mobius", label: "Möbius" },
];

// ═══════════════════════════════════════════════
// 20 SHADERS — grouped by category
// ═══════════════════════════════════════════════

interface ShaderGroup {
  label: string;
  items: { value: string; label: string }[];
}

const SHADER_GROUPS: ShaderGroup[] = [
  {
    label: "Artistic",
    items: [
      { value: "particles", label: "Particles" },
      { value: "gradient", label: "Gradient" },
      { value: "toon", label: "Toon" },
      { value: "retro", label: "Retro" },
    ],
  },
  {
    label: "Metallic / Reflective",
    items: [
      { value: "holographic", label: "Holographic" },
      { value: "iridescent", label: "Iridescent" },
      { value: "chromatic", label: "Chromatic" },
      { value: "futuristic", label: "Futuristic" },
    ],
  },
  {
    label: "Glass / Organic",
    items: [
      { value: "glass", label: "Glass" },
      { value: "marble", label: "Marble" },
      { value: "plasma", label: "Plasma" },
      { value: "lava", label: "Lava" },
    ],
  },
  {
    label: "Light / Energy",
    items: [
      { value: "fresnel", label: "Fresnel" },
      { value: "emission", label: "Emission" },
      { value: "electric", label: "Electric" },
      { value: "aurora", label: "Aurora" },
    ],
  },
  {
    label: "Structure / Technical",
    items: [
      { value: "meshLines", label: "Wireframe" },
      { value: "topographic", label: "Topographic" },
      { value: "voronoi", label: "Voronoi" },
      { value: "xray", label: "X-Ray" },
    ],
  },
];

// ═══════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[var(--accent)] transition-colors"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[13px] text-[var(--muted-foreground)]">{label}</span>
        <span className="text-[13px] text-[var(--muted-foreground)] tabular-nums">
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
        style={{
          background: `linear-gradient(to right, var(--primary) ${((value - min) / (max - min)) * 100}%, var(--muted) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
    </div>
  );
}

function SelectGrid({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1.5 rounded-md text-[12px] transition-all ${
            value === opt.value
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
              : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

export function ControlPanel({ config, onChange, onExportPNG, onExportSVG, onReset }: ControlPanelProps) {
  const update = (partial: Partial<PatternConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--card)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-[15px]">3D Pattern Generator</h2>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto">
        {/* Shader Style — grouped */}
        <Section title="Shader Style" icon={<Layers className="w-4 h-4 text-[var(--muted-foreground)]" />}>
          <div className="space-y-2">
            {SHADER_GROUPS.map((group) => (
              <div key={group.label}>
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">
                  {group.label}
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {group.items.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => update({ shaderStyle: s.value })}
                      className={`px-1.5 py-1.5 rounded-md text-[11px] transition-all ${
                        config.shaderStyle === s.value
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                          : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Object Selection */}
        <Section title="Base Shape" icon={<Box className="w-4 h-4 text-[var(--muted-foreground)]" />}>
          <SelectGrid
            options={OBJECTS}
            value={config.objectType}
            onChange={(v) => update({ objectType: v })}
            cols={4}
          />
        </Section>

        {/* Size & Particles */}
        <Section title="Size & Detail" icon={<Circle className="w-4 h-4 text-[var(--muted-foreground)]" />}>
          <SliderControl label="Object Size" value={config.size} min={0.5} max={3} step={0.05} onChange={(v) => update({ size: v })} />
          {config.shaderStyle === "particles" && (
            <SliderControl label="Point Size" value={config.pointSize} min={1} max={10} step={0.5} onChange={(v) => update({ pointSize: v })} />
          )}
          <SliderControl label="Detail Level" value={config.particleDensity} min={16} max={200} step={1} onChange={(v) => update({ particleDensity: v })} />
          <SliderControl label="Rotation Speed" value={config.rotationSpeed} min={0} max={5} step={0.1} onChange={(v) => update({ rotationSpeed: v })} />
        </Section>

        {/* Noise / Distortion */}
        <Section title="Noise & Distortion" icon={<Waves className="w-4 h-4 text-[var(--muted-foreground)]" />}>
          <SliderControl label="Amplitude" value={config.noiseAmplitude} min={0} max={2} step={0.01} onChange={(v) => update({ noiseAmplitude: v })} />
          <SliderControl label="Frequency" value={config.noiseFrequency} min={0.5} max={6} step={0.1} onChange={(v) => update({ noiseFrequency: v })} />
          <SliderControl label="Speed" value={config.noiseSpeed} min={0} max={3} step={0.05} onChange={(v) => update({ noiseSpeed: v })} />
        </Section>

        {/* Colors */}
        <Section title="Colors" icon={<Palette className="w-4 h-4 text-[var(--muted-foreground)]" />}>
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[var(--muted-foreground)] w-20">Primary</label>
            <div className="relative flex-1">
              <input type="color" value={config.color} onChange={(e) => update({ color: e.target.value })} className="w-full h-8 rounded-md cursor-pointer border border-[var(--border)]" />
            </div>
            <span className="text-[12px] text-[var(--muted-foreground)] uppercase tabular-nums">{config.color}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[var(--muted-foreground)] w-20">Secondary</label>
            <div className="relative flex-1">
              <input type="color" value={config.secondaryColor} onChange={(e) => update({ secondaryColor: e.target.value })} className="w-full h-8 rounded-md cursor-pointer border border-[var(--border)]" />
            </div>
            <span className="text-[12px] text-[var(--muted-foreground)] uppercase tabular-nums">{config.secondaryColor}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[var(--muted-foreground)] w-20">Background</label>
            <div className="relative flex-1">
              <input type="color" value={config.bgColor} onChange={(e) => update({ bgColor: e.target.value })} className="w-full h-8 rounded-md cursor-pointer border border-[var(--border)]" />
            </div>
            <span className="text-[12px] text-[var(--muted-foreground)] uppercase tabular-nums">{config.bgColor}</span>
          </div>
          <SliderControl label="Opacity" value={config.opacity} min={0.1} max={1} step={0.05} onChange={(v) => update({ opacity: v })} />

          {/* Quick palettes */}
          <div>
            <span className="text-[12px] text-[var(--muted-foreground)] mb-1 block">Quick Palettes</span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { primary: "#f97316", secondary: "#7c3aed", bg: "#000000" },
                { primary: "#06b6d4", secondary: "#3b82f6", bg: "#0a0a1a" },
                { primary: "#22c55e", secondary: "#10b981", bg: "#050d09" },
                { primary: "#f43f5e", secondary: "#ec4899", bg: "#0f0008" },
                { primary: "#eab308", secondary: "#f97316", bg: "#0a0800" },
                { primary: "#a855f7", secondary: "#6366f1", bg: "#08001a" },
                { primary: "#ffffff", secondary: "#94a3b8", bg: "#000000" },
                { primary: "#f97316", secondary: "#06b6d4", bg: "#0d0d0d" },
                { primary: "#c084fc", secondary: "#f9a8d4", bg: "#c7d2e0" },
                { primary: "#ef4444", secondary: "#22c55e", bg: "#d4d4d4" },
                { primary: "#fbbf24", secondary: "#f59e0b", bg: "#fef3c7" },
                { primary: "#14b8a6", secondary: "#06b6d4", bg: "#042f2e" },
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => update({ color: p.primary, secondaryColor: p.secondary, bgColor: p.bg })}
                  className="w-7 h-7 rounded-md border border-white/10 overflow-hidden flex flex-col"
                >
                  <div className="w-full h-1/3" style={{ background: p.primary }} />
                  <div className="w-full h-1/3" style={{ background: p.secondary }} />
                  <div className="w-full h-1/3" style={{ background: p.bg }} />
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Glow */}
        <Section title="Glow & Lighting" icon={<Sun className="w-4 h-4 text-[var(--muted-foreground)]" />} defaultOpen={false}>
          <SliderControl label="Glow Intensity" value={config.glowIntensity} min={0} max={3} step={0.1} onChange={(v) => update({ glowIntensity: v })} />
        </Section>
      </div>

      {/* Export Footer */}
      <div className="border-t border-[var(--border)] p-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onExportPNG}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={onExportSVG}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
          >
            <Download className="w-4 h-4" />
            SVG
          </button>
        </div>
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors text-[13px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
