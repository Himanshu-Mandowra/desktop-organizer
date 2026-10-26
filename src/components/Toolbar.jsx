import Plus from "lucide-react/dist/esm/icons/plus";
import Grid3X3 from "lucide-react/dist/esm/icons/grid-3x3";
import ImageIcon from "lucide-react/dist/esm/icons/image";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Check from "lucide-react/dist/esm/icons/check";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Video from "lucide-react/dist/esm/icons/video";
import { PC_GRID_PRESETS, getBoxSizeForAppGrid } from "../utils/gridMath";

function Toolbar({
  isOpen,
  handleWallpaperUpload,
  activeWallpaper,
  addSection,
  gridConfig,
  setGridConfig,
  stageSize,
  sizeInputs,
  onSizeInputChange,
  applyStageSize,
  handleScreenNoTaskbar,
  onOpenTemplates,
}) {
  if (!isOpen) return null;

  const updateGrid = (patch) => {
    setGridConfig((prev) => ({ ...prev, ...patch }));
  };

  return (
    <aside className="w-[300px] shrink-0 h-full bg-[#121215] border-r border-[#27272a] flex flex-col overflow-y-auto text-xs text-white select-none">
      <div className="p-4 space-y-6">
        {/* 1. ADD SECTION BOXES */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Create Section Box
          </div>

          <button
            onClick={() => addSection()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500"
          >
            <Plus size={16} />
            <span>Add New Section Box</span>
          </button>

          {/* Quick Add Box by App Row Capacity */}
          <div className="rounded-lg bg-[#18181b] border border-[#27272a] p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-zinc-300">
              Quick Add by Folder Fit (3 Rows):
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[2, 3, 4].map((cols) => {
                const dims = getBoxSizeForAppGrid(
                  cols,
                  3,
                  gridConfig,
                  stageSize
                );
                return (
                  <button
                    key={cols}
                    onClick={() =>
                      addSection({
                        title: `${cols}×3 Apps`,
                        width: dims.width,
                        height: dims.height,
                      })
                    }
                    className="rounded-md bg-[#121215] border border-[#27272a] py-1.5 px-1 text-center font-semibold text-zinc-200 transition hover:border-indigo-500 hover:text-white"
                  >
                    <div>{cols} in row</div>
                    <div className="text-[10px] font-normal text-zinc-500">
                      {dims.width}×{dims.height}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-[#27272a]" />

        {/* 2. WALLPAPER & TEMPLATE LIBRARY */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Wallpaper & Live Media
            </span>
            <span className="text-[10px] text-zinc-500">Max 20MB</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#27272a] bg-[#18181b]">
            <div className="relative aspect-video w-full bg-[#09090b]">
              {activeWallpaper?.type === "live" &&
              (activeWallpaper.url?.startsWith("data:video/") ||
                activeWallpaper.url?.endsWith(".mp4") ||
                activeWallpaper.url?.endsWith(".webm")) ? (
                <video
                  src={activeWallpaper.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={activeWallpaper?.url || "/templates/boa-hancock.jpg"}
                  alt={activeWallpaper?.title || "Wallpaper"}
                  className="h-full w-full object-cover"
                />
              )}
              {activeWallpaper?.type === "live" && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  <Video size={10} /> LIVE
                </span>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="truncate font-semibold text-zinc-200">
                {activeWallpaper?.title || "Boa Hancock"}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase">
                {activeWallpaper?.type === "live" ? "Live Video" : "Static HD"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenTemplates}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#18181b] border border-[#27272a] py-2.5 font-semibold text-zinc-200 transition hover:bg-[#27272a] hover:text-white"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span>Library</span>
            </button>

            <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#18181b] border border-[#27272a] py-2.5 font-semibold text-zinc-200 transition hover:bg-[#27272a] hover:text-white">
              <ImageIcon size={14} className="text-emerald-400" />
              <span>Upload File</span>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleWallpaperUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="h-[1px] w-full bg-[#27272a]" />

        {/* 3. SCREEN / CANVAS RESOLUTION */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Screen Resolution
            </span>
            <button
              onClick={handleScreenNoTaskbar}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:underline"
            >
              <Monitor size={12} />
              <span>Use My Screen</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-2 flex items-center rounded-lg bg-[#18181b] border border-[#27272a] px-2.5 py-2">
              <span className="mr-2 text-[10px] font-bold text-zinc-500">W</span>
              <input
                type="number"
                value={sizeInputs.width}
                onChange={(e) => onSizeInputChange("width", e.target.value)}
                className="w-full bg-transparent text-xs text-white outline-none"
              />
            </div>

            <div className="col-span-2 flex items-center rounded-lg bg-[#18181b] border border-[#27272a] px-2.5 py-2">
              <span className="mr-2 text-[10px] font-bold text-zinc-500">H</span>
              <input
                type="number"
                value={sizeInputs.height}
                onChange={(e) => onSizeInputChange("height", e.target.value)}
                className="w-full bg-transparent text-xs text-white outline-none"
              />
            </div>

            <button
              onClick={applyStageSize}
              title="Apply Resolution"
              className="flex items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500"
            >
              <Check size={16} />
            </button>
          </div>
        </div>

        <div className="h-[1px] w-full bg-[#27272a]" />

        {/* 4. DESKTOP GRID VIEW & PC FIXED FOLDER GRID SETTINGS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Grid3X3 size={14} className="text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Desktop Grid
              </span>
            </div>

            <button
              onClick={() => updateGrid({ showGrid: !gridConfig.showGrid })}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                gridConfig.showGrid
                  ? "bg-emerald-600 text-white"
                  : "bg-[#18181b] border border-[#27272a] text-zinc-400"
              }`}
            >
              {gridConfig.showGrid ? "Enabled" : "Hidden"}
            </button>
          </div>

          {gridConfig.showGrid && (
            <div className="space-y-3 rounded-lg bg-[#18181b] border border-[#27272a] p-3">
              {/* Grid Mode Tabs */}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#121215] p-1 border border-[#27272a]">
                <button
                  onClick={() => updateGrid({ mode: "pc" })}
                  className={`rounded-md py-1.5 font-semibold transition ${
                    gridConfig.mode === "pc"
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  PC App Grid
                </button>
                <button
                  onClick={() => updateGrid({ mode: "custom" })}
                  className={`rounded-md py-1.5 font-semibold transition ${
                    gridConfig.mode === "custom"
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Custom Grid
                </button>
              </div>

              {gridConfig.mode === "pc" ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] text-zinc-400">
                      Windows Icon Spacing Preset
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PC_GRID_PRESETS.map((preset) => {
                        const active =
                          (gridConfig.pcCellWidth || 75) ===
                            preset.baseCellW &&
                          (gridConfig.pcCellHeight || 87) ===
                            preset.baseCellH;
                        return (
                          <button
                            key={preset.id}
                            onClick={() =>
                              updateGrid({
                                pcCellWidth: preset.baseCellW,
                                pcCellHeight: preset.baseCellH,
                              })
                            }
                            className={`rounded-md py-1.5 px-1 text-center border transition ${
                              active
                                ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                                : "bg-[#121215] border-[#27272a] text-zinc-300 hover:border-zinc-500"
                            }`}
                          >
                            <div className="text-[10px] capitalize">
                              {preset.id}
                            </div>
                            <div className="text-[10px] opacity-80">
                              {preset.baseCellW}×{preset.baseCellH}px
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] text-zinc-400">
                        Folder Pitch W (px)
                      </label>
                      <input
                        type="number"
                        min="48"
                        max="200"
                        value={gridConfig.pcCellWidth || 75}
                        onChange={(e) =>
                          updateGrid({
                            pcCellWidth: Math.max(48, Number(e.target.value)),
                          })
                        }
                        className="w-full rounded-md border border-[#27272a] bg-[#121215] px-2.5 py-1.5 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-zinc-400">
                        Folder Pitch H (px)
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="220"
                        value={gridConfig.pcCellHeight || 87}
                        onChange={(e) =>
                          updateGrid({
                            pcCellHeight: Math.max(60, Number(e.target.value)),
                          })
                        }
                        className="w-full rounded-md border border-[#27272a] bg-[#121215] px-2.5 py-1.5 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">
                    Custom Grid Step (px)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={gridConfig.customGridSize}
                    onChange={(e) =>
                      updateGrid({
                        customGridSize: Math.max(5, Number(e.target.value)),
                      })
                    }
                    className="w-full rounded-md border border-[#27272a] bg-[#121215] px-2.5 py-1.5 text-white outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Toolbar;
