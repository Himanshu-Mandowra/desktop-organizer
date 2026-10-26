import Square from "lucide-react/dist/esm/icons/square";
import Circle from "lucide-react/dist/esm/icons/circle";
import Triangle from "lucide-react/dist/esm/icons/triangle";
import Hexagon from "lucide-react/dist/esm/icons/hexagon";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import Plus from "lucide-react/dist/esm/icons/plus";
import RotateCw from "lucide-react/dist/esm/icons/rotate-cw";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import {
  calculateAppsFit,
  getBoxSizeForAppGrid,
} from "../utils/gridMath";

const BASIC_SHAPES = [
  { id: "rect", label: "Rect", defaultSides: 4, Icon: Square },
  { id: "circle", label: "Circle", defaultSides: 4, Icon: Circle },
  { id: "triangle", label: "Triangle", defaultSides: 3, Icon: Triangle },
  { id: "polygon", label: "Polygon", defaultSides: 6, Icon: Hexagon },
];

const TITLE_STYLES = [
  { id: "attached-bar", label: "Top Bar" },
  { id: "attached-tab", label: "Top Tab" },
  { id: "inside-bar", label: "Inside" },
  { id: "hidden", label: "Hidden" },
];

function EditorPanel({
  isOpen,
  selectedSection,
  sections,
  setSelectedId,
  addSection,
  updateSection,
  deleteSection,
  gridConfig,
  stageSize,
  onImageFileForSection,
}) {
  if (!isOpen) return null;

  if (!selectedSection) {
    return (
      <aside className="w-[320px] shrink-0 h-full bg-[#121215] border-l border-[#27272a] flex flex-col overflow-y-auto p-4 text-xs text-white select-none">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Box Editor
        </div>

        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-center space-y-3">
          <p className="text-xs text-zinc-400">
            Click any section box on the preview canvas to edit its attached top title bar, opacity, shape, rotation, or image fill.
          </p>
          <button
            onClick={() => addSection()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
          >
            <Plus size={14} />
            <span>Create Section Box</span>
          </button>
        </div>

        {sections.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              All Boxes on Canvas ({sections.length})
            </div>
            <div className="space-y-1.5">
              {sections.map((sec) => {
                const fit = calculateAppsFit(sec, gridConfig, stageSize);
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedId(sec.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-left transition hover:border-zinc-500"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: sec.color }}
                      />
                      <span className="font-semibold text-zinc-200">
                        {sec.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {fit.cols}×{fit.rows} folders
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    );
  }

  const appFit = calculateAppsFit(selectedSection, gridConfig, stageSize);
  const currentShape = selectedSection.shape || "rect";
  const currentSides =
    selectedSection.sides || (currentShape === "triangle" ? 3 : 4);
  const currentRadius =
    selectedSection.borderRadius !== undefined
      ? selectedSection.borderRadius
      : 12;
  const currentRotation = Number(selectedSection.rotation) || 0;
  const currentImageRotation = Number(selectedSection.imageRotation) || 0;
  const currentTitleStyle =
    selectedSection.titlePosition === "top-center"
      ? "attached-bar"
      : selectedSection.titlePosition === "top-tab"
      ? "attached-tab"
      : selectedSection.titlePosition || "attached-bar";

  const titleBgOpacity =
    selectedSection.titleBgOpacity !== undefined
      ? Number(selectedSection.titleBgOpacity)
      : 0.45;
  const boxOpacity =
    selectedSection.boxOpacity !== undefined
      ? Number(selectedSection.boxOpacity)
      : 0.65;

  const handleSidesChange = (newSides) => {
    const clamped = Math.max(3, Math.min(12, Number(newSides) || 3));
    let nextShape = selectedSection.shape || "polygon";
    if (clamped === 3) {
      nextShape = "triangle";
    } else if (clamped === 4 && currentShape === "rect") {
      nextShape = "rect";
    } else {
      nextShape = "polygon";
    }
    updateSection(selectedSection.id, {
      sides: clamped,
      shape: nextShape,
    });
  };

  const applyAppGridPreset = (cols, rows) => {
    const newDims = getBoxSizeForAppGrid(
      cols,
      rows,
      gridConfig,
      stageSize,
      selectedSection.y
    );
    updateSection(selectedSection.id, newDims);
  };

  return (
    <aside className="w-[320px] shrink-0 h-full bg-[#121215] border-l border-[#27272a] flex flex-col overflow-y-auto text-xs text-white select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#27272a] px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-white">Box Editor</h2>
          <p className="text-[11px] text-zinc-400">
            Arrow keys move 1 folder slot
          </p>
        </div>

        <button
          onClick={() => deleteSection(selectedSection.id)}
          title="Delete Box (or press Delete key)"
          className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-500"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>

      {/* CONTROLS BODY */}
      <div className="p-4 space-y-5">
        {/* 1. ATTACHED TOP TITLE BAR, BORDER COLOR & OPACITY */}
        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-semibold text-zinc-400">
                Top Attached Title
              </label>
              <input
                type="text"
                value={selectedSection.title}
                onChange={(e) =>
                  updateSection(selectedSection.id, { title: e.target.value })
                }
                className="w-full rounded-lg border border-[#27272a] bg-[#121215] px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-400">
                Color
              </label>
              <input
                type="color"
                value={selectedSection.color}
                onChange={(e) =>
                  updateSection(selectedSection.id, { color: e.target.value })
                }
                className="h-[32px] w-full cursor-pointer rounded-lg border border-[#27272a] bg-[#121215] p-1"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Attached Title Bar Style
            </label>
            <div className="grid grid-cols-4 gap-1">
              {TITLE_STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() =>
                    updateSection(selectedSection.id, { titlePosition: st.id })
                  }
                  className={`rounded-md border py-1.5 text-[10px] font-semibold transition ${
                    currentTitleStyle === st.id
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-[#121215] border-[#27272a] text-zinc-400 hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Bar Background Opacity (Same color as border!) */}
          <div>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-zinc-400">Title Bar BG Opacity</span>
              <span className="font-bold text-white">
                {Math.round(titleBgOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={titleBgOpacity}
              onChange={(e) =>
                updateSection(selectedSection.id, {
                  titleBgOpacity: Number(e.target.value),
                })
              }
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Box Fill Opacity */}
          <div>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-zinc-400">Box Interior Opacity</span>
              <span className="font-bold text-white">
                {Math.round(boxOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={boxOpacity}
              onChange={(e) =>
                updateSection(selectedSection.id, {
                  boxOpacity: Number(e.target.value),
                })
              }
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* 2. PC DESKTOP FOLDER FIT CALCULATOR & PRESETS (2, 3, 4 in a row) */}
        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200">
              <LayoutGrid size={14} className="text-indigo-400" />
              <span>PC Folder Grid Fit</span>
            </div>
            <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {appFit.cols} × {appFit.rows} ({appFit.total} Folders)
            </span>
          </div>

          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Folders in a Row (Width):
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[2, 3, 4, 5].map((cols) => (
                <button
                  key={cols}
                  onClick={() => applyAppGridPreset(cols, appFit.rows)}
                  className={`rounded-md py-1.5 text-[11px] font-bold border transition ${
                    appFit.cols === cols
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-[#121215] border-[#27272a] text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {cols} / row
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Folder Rows (Height):
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((rows) => (
                <button
                  key={rows}
                  onClick={() => applyAppGridPreset(appFit.cols, rows)}
                  className={`rounded-md py-1.5 text-[11px] font-bold border transition ${
                    appFit.rows === rows
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-[#121215] border-[#27272a] text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {rows} {rows === 1 ? "row" : "rows"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 4 BASIC SHAPES + SIDES + ROUNDNESS + SECTION ROTATION */}
        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Shape, Sides & Rotation
            </span>
            <span className="text-[11px] font-semibold text-indigo-400">
              {currentShape === "circle"
                ? "Circle"
                : `${currentSides} Sides`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {BASIC_SHAPES.map(({ id, label, defaultSides, Icon }) => {
              const active = currentShape === id;
              return (
                <button
                  key={id}
                  onClick={() =>
                    updateSection(selectedSection.id, {
                      shape: id,
                      sides:
                        id === "polygon" && currentSides < 5
                          ? 6
                          : defaultSides,
                    })
                  }
                  className={`flex flex-col items-center justify-center gap-1 rounded-md border py-2 transition ${
                    active
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-[#121215] border-[#27272a] text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Editable Sides (3 to 12) */}
          {currentShape !== "circle" && (
            <div>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-zinc-400">Sides (Convert Shape)</span>
                <span className="font-bold text-white">{currentSides}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={currentSides}
                  onChange={(e) => handleSidesChange(e.target.value)}
                  className="w-full accent-indigo-600"
                />
                <input
                  type="number"
                  min="3"
                  max="12"
                  value={currentSides}
                  onChange={(e) => handleSidesChange(e.target.value)}
                  className="w-12 rounded-md border border-[#27272a] bg-[#121215] px-2 py-1 text-center text-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Border Radius / Corner Roundness */}
          {currentShape !== "circle" && (
            <div>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-zinc-400">Border Radius (Roundness)</span>
                <span className="font-bold text-white">{currentRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentRadius}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    borderRadius: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          )}

          {/* Section Box Rotation (0° to 360°) */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Section Box Rotation</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateSection(selectedSection.id, {
                      rotation: (currentRotation - 90 + 360) % 360,
                    })
                  }
                  title="Rotate -90°"
                  className="rounded bg-[#121215] border border-[#27272a] p-1 text-zinc-300 hover:text-white"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() =>
                    updateSection(selectedSection.id, { rotation: 0 })
                  }
                  className="rounded bg-[#121215] border border-[#27272a] px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 hover:text-white"
                >
                  {currentRotation}°
                </button>
                <button
                  onClick={() =>
                    updateSection(selectedSection.id, {
                      rotation: (currentRotation + 90) % 360,
                    })
                  }
                  title="Rotate +90°"
                  className="rounded bg-[#121215] border border-[#27272a] p-1 text-zinc-300 hover:text-white"
                >
                  <RotateCw size={12} />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={currentRotation}
              onChange={(e) =>
                updateSection(selectedSection.id, {
                  rotation: Number(e.target.value),
                })
              }
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* 4. DRAG & DROP IMAGE INTO SHAPE + IMAGE ROTATION */}
        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Image Inside Shape
            </span>
            {selectedSection.imageUrl && (
              <button
                onClick={() =>
                  updateSection(selectedSection.id, { imageUrl: null })
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>

          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer?.files?.[0];
              if (file) onImageFileForSection(selectedSection.id, file);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#3f3f46] bg-[#121215] py-3 text-center transition hover:border-indigo-500"
          >
            <ImagePlus size={18} className="text-indigo-400" />
            <span className="text-[11px] text-zinc-300">
              Drop image here or onto shape, or{" "}
              <span className="text-indigo-400 underline">browse</span>
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageFileForSection(selectedSection.id, file);
              }}
            />
          </label>

          {selectedSection.imageUrl && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-3 gap-1.5">
                {["cover", "contain", "stretch"].map((fitMode) => (
                  <button
                    key={fitMode}
                    onClick={() =>
                      updateSection(selectedSection.id, { imageFit: fitMode })
                    }
                    className={`rounded-md border py-1 text-[11px] font-semibold capitalize ${
                      (selectedSection.imageFit || "cover") === fitMode
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-[#121215] border-[#27272a] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {fitMode}
                  </button>
                ))}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Rotate Image Inside</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateSection(selectedSection.id, {
                          imageRotation: (currentImageRotation - 90 + 360) % 360,
                        })
                      }
                      title="Rotate Image -90°"
                      className="rounded bg-[#121215] border border-[#27272a] p-1 text-zinc-300 hover:text-white"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button
                      onClick={() =>
                        updateSection(selectedSection.id, { imageRotation: 0 })
                      }
                      className="rounded bg-[#121215] border border-[#27272a] px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 hover:text-white"
                    >
                      {currentImageRotation}°
                    </button>
                    <button
                      onClick={() =>
                        updateSection(selectedSection.id, {
                          imageRotation: (currentImageRotation + 90) % 360,
                        })
                      }
                      title="Rotate Image +90°"
                      className="rounded bg-[#121215] border border-[#27272a] p-1 text-zinc-300 hover:text-white"
                    >
                      <RotateCw size={12} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={currentImageRotation}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      imageRotation: Number(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Image Zoom</span>
                  <span>
                    {Math.round((selectedSection.imageScale || 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={selectedSection.imageScale || 1}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      imageScale: Number(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. EXACT BOX DIMENSIONS (WIDTH & HEIGHT) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-zinc-400">
              Width (px)
            </label>
            <input
              type="number"
              min="60"
              value={selectedSection.width}
              onChange={(e) =>
                updateSection(selectedSection.id, {
                  width: Math.max(60, Number(e.target.value)),
                })
              }
              className="w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-zinc-400">
              Height (px)
            </label>
            <input
              type="number"
              min="60"
              value={selectedSection.height}
              onChange={(e) =>
                updateSection(selectedSection.id, {
                  height: Math.max(60, Number(e.target.value)),
                })
              }
              className="w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-white outline-none"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default EditorPanel;
