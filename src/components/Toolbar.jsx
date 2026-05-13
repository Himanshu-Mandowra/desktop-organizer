import { 
  Plus, 
  Download, 
  Grid3X3,
  Grid3x3 as Grid3X3Off,
  Image as ImageIcon, 
  Monitor, 
  Check 
} from "lucide-react";

function Toolbar({
  handleWallpaperUpload,
  addSection,
  exportWallpaper,
  showGrid,
  setShowGrid,
  sizeInputs,
  onSizeInputChange,
  applyStageSize,
  handleScreenNoTaskbar,
}) {
  return (
    <div className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-2 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20">
      {/* WALLPAPER UPLOAD */}
      <label className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-zinc-900 transition-all hover:bg-zinc-800">
        <ImageIcon size={18} className="text-zinc-400 group-hover:text-white" />
        <input
          type="file"
          accept="image/*"
          onChange={handleWallpaperUpload}
          className="hidden"
        />
        <span className="absolute -bottom-10 scale-0 rounded bg-zinc-800 px-2 py-1 text-xs text-white transition-all group-hover:scale-100">Wallpaper</span>
      </label>

      <div className="h-6 w-[1px] bg-white/10" />

      {/* CANVAS CONTROLS */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-zinc-900/50 p-1 border border-white/5">
          <div className="flex items-center px-2">
            <span className="text-[10px] font-bold text-zinc-500 mr-2">W</span>
            <input
              type="number"
              value={sizeInputs.width}
              onChange={(e) => onSizeInputChange("width", e.target.value)}
              className="w-16 bg-transparent text-sm text-white outline-none"
            />
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center px-2">
            <span className="text-[10px] font-bold text-zinc-500 mr-2">H</span>
            <input
              type="number"
              value={sizeInputs.height}
              onChange={(e) => onSizeInputChange("height", e.target.value)}
              className="w-16 bg-transparent text-sm text-white outline-none"
            />
          </div>
        </div>

        <button
          onClick={applyStageSize}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.4)]"
        >
          <Check size={18} />
        </button>

        <button
          onClick={handleScreenNoTaskbar}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
        >
          <Monitor size={18} />
          <span className="absolute -bottom-10 scale-0 rounded bg-zinc-800 px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">Screen Size</span>
        </button>
      </div>

      <div className="h-6 w-[1px] bg-white/10" />

      {/* ACTIONS */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
          showGrid ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-500"
        } hover:bg-zinc-700`}
      >
        {showGrid ? <Grid3X3 size={18} /> : <Grid3X3Off size={18} />}
      </button>

      <button
        onClick={addSection}
        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition-all hover:bg-zinc-200 active:scale-95"
      >
        <Plus size={18} />
        Section
      </button>

      <button
        onClick={exportWallpaper}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
      >
        <Download size={18} />
      </button>
    </div>
  );
}

export default Toolbar;
