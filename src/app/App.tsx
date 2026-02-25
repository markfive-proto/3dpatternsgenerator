import { useState, useRef, useCallback } from "react";
import { ThreeCanvas, type PatternConfig } from "./components/ThreeCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { PromptBar } from "./components/PromptBar";
import { toast, Toaster } from "sonner";
import { PanelLeftClose, PanelLeft } from "lucide-react";

const DEFAULT_CONFIG: PatternConfig = {
  objectType: "sphere",
  shaderStyle: "holographic",
  color: "#e0e7ff",
  secondaryColor: "#c084fc",
  size: 1.8,
  noiseAmplitude: 0.4,
  noiseFrequency: 2.0,
  noiseSpeed: 0.5,
  pointSize: 3,
  particleDensity: 100,
  opacity: 1,
  bgColor: "#c7d2e0",
  glowIntensity: 1.2,
  rotationSpeed: 0.5,
};

export default function App() {
  const [config, setConfig] = useState<PatternConfig>(DEFAULT_CONFIG);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExportPNG = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `3d-pattern-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("PNG exported successfully!");
    } catch {
      toast.error("Failed to export PNG");
    }
  }, []);

  const handleExportSVG = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      const width = canvas.width;
      const height = canvas.height;

      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="none"/>
  <image xlink:href="${dataUrl}" width="${width}" height="${height}"/>
</svg>`;

      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `3d-pattern-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("SVG exported!");
    } catch {
      toast.error("Failed to export SVG");
    }
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    toast("Reset to default settings");
  }, []);

  const handlePromptApply = useCallback(
    (partial: Partial<PatternConfig>) => {
      setConfig((prev) => ({ ...prev, ...partial }));
      const changes = Object.keys(partial).length;
      toast.success(`Applied ${changes} change${changes !== 1 ? "s" : ""} from prompt`);
    },
    []
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--background)]">
      <Toaster position="bottom-center" richColors />

      {/* Prompt Bar */}
      <PromptBar onApply={handlePromptApply} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Toggle (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 bottom-3 z-10 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg hover:bg-[var(--accent)] transition-colors"
            title="Open panel"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-[320px] shrink-0 border-r border-[var(--border)] flex flex-col relative">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 z-10 p-1 hover:bg-[var(--muted)] rounded transition-colors"
              title="Close panel"
            >
              <PanelLeftClose className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
            <ControlPanel
              config={config}
              onChange={setConfig}
              onExportPNG={handleExportPNG}
              onExportSVG={handleExportSVG}
              onReset={handleReset}
            />
          </div>
        )}

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <ThreeCanvas config={config} canvasRef={canvasRef} />

          {/* Info overlay */}
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/50">
            Drag to orbit &bull; Scroll to zoom &bull; Right-click to pan
          </div>
        </div>
      </div>
    </div>
  );
}