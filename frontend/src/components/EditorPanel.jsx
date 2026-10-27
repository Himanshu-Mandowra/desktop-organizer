import { useState } from "react";
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
import Layers from "lucide-react/dist/esm/icons/layers";
import GroupIcon from "lucide-react/dist/esm/icons/group";
import UngroupIcon from "lucide-react/dist/esm/icons/ungroup";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import ChevronsUp from "lucide-react/dist/esm/icons/chevrons-up";
import ChevronsDown from "lucide-react/dist/esm/icons/chevrons-down";
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical";
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

const MIN_RIGHT_WIDTH = 260;
const MAX_RIGHT_WIDTH = 440;

function EditorPanel({
  isOpen,
  width = 320,
  onWidthChange,
  selectedSection,
  selectedIds = [],
  sections = [],
  onSelectSection,
  setSelectedIds,
  addSection,
  updateSection,
  updateSelectedSections,
  deleteSection,
  deleteSelectedSections,
  groupSelected,
  ungroupSelected,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onReorderLayer,
  gridConfig,
  stageSize,
  onImageFileForSection,
}) {
  const [draggedLayerId, setDraggedLayerId] = useState(null);
  const [dragOverLayerId, setDragOverLayerId] = useState(null);

  if (!isOpen) return null;

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;

    const onMouseMove = (moveEvt) => {
      // Dragging left edge leftwards increases right sidebar width
      const nextW = Math.max(
        MIN_RIGHT_WIDTH,
        Math.min(MAX_RIGHT_WIDTH, startW + (startX - moveEvt.clientX))
      );
      if (onWidthChange) onWidthChange(nextW);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const renderResizeHandle = () => (
    <div
      onMouseDown={handleResizeMouseDown}
      title="Drag to resize right sidebar"
      className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent transition hover:bg-indigo-600/70 z-20"
    />
  );

  const isMultiSelected = selectedIds.length > 1;
  const selectedSet = new Set(selectedIds);
  const selectedObjects = sections.filter((s) => selectedSet.has(s.id));
  const hasGroupedSelection = selectedObjects.some((s) => Boolean(s.groupId));
  const uniqueGroups = new Set(
    selectedObjects.map((s) => s.groupId).filter(Boolean)
  );
  const isSingleGroupSelected =
    hasGroupedSelection &&
    uniqueGroups.size === 1 &&
    selectedObjects.every((s) => Boolean(s.groupId));

  // Reusable Layer Order + Draggable Layer Stack Panel
  const renderLayersManager = () => (
    <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
          <Layers size={13} className="text-indigo-400" />
          <span>Layers ({sections.length})</span>
        </div>
        {sections.length > 0 && (
          <button
            onClick={() =>
              selectedIds.length === sections.length
                ? setSelectedIds([])
                : setSelectedIds(sections.map((s) => s.id))
            }
            className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
          >
            {selectedIds.length === sections.length
              ? "Deselect All"
              : "Select All (Ctrl+A)"}
          </button>
        )}
      </div>

      {/* LAYER ORDERING ACTION BUTTONS */}
      <div className="grid grid-cols-4 gap-1">
        <button
          disabled={selectedIds.length === 0}
          onClick={() => onBringToFront()}
          title="Bring to Front (Ctrl+Shift+])"
          className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-[#27272a] bg-[#121215] py-1.5 text-[10px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronsUp size={13} />
          <span>To Front</span>
        </button>
        <button
          disabled={selectedIds.length === 0}
          onClick={() => onBringForward()}
          title="Bring Forward (Ctrl+])"
          className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-[#27272a] bg-[#121215] py-1.5 text-[10px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowUp size={13} />
          <span>Forward</span>
        </button>
        <button
          disabled={selectedIds.length === 0}
          onClick={() => onSendBackward()}
          title="Send Backward (Ctrl+[)"
          className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-[#27272a] bg-[#121215] py-1.5 text-[10px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowDown size={13} />
          <span>Backward</span>
        </button>
        <button
          disabled={selectedIds.length === 0}
          onClick={() => onSendToBack()}
          title="Send to Back (Ctrl+Shift+[)"
          className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-[#27272a] bg-[#121215] py-1.5 text-[10px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronsDown size={13} />
          <span>To Back</span>
        </button>
      </div>

      {/* GROUP / UNGROUP BUTTONS */}
      {(selectedIds.length >= 2 || hasGroupedSelection) && (
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            disabled={selectedIds.length < 2 || isSingleGroupSelected}
            onClick={groupSelected}
            title="Group Selected Boxes (Ctrl+G)"
            className="flex items-center justify-center gap-1.5 rounded-md border border-indigo-500/60 bg-indigo-600/20 py-1.5 text-[11px] font-bold text-indigo-200 transition hover:bg-indigo-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <GroupIcon size={13} />
            <span>Group (Ctrl+G)</span>
          </button>
          <button
            disabled={!hasGroupedSelection}
            onClick={ungroupSelected}
            title="Ungroup Selected Boxes (Ctrl+Shift+G)"
            className="flex items-center justify-center gap-1.5 rounded-md border border-[#27272a] bg-[#121215] py-1.5 text-[11px] font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <UngroupIcon size={13} />
            <span>Ungroup</span>
          </button>
        </div>
      )}

      {/* DRAGGABLE LAYER LIST (Top of list = Front-most layer) */}
      {sections.length > 0 ? (
        <div className="space-y-1 max-h-52 overflow-y-auto no-scrollbar pr-0.5">
          {[...sections].reverse().map((sec, revIdx) => {
            const actualIndex = sections.length - 1 - revIdx;
            const isSel = selectedSet.has(sec.id);
            const fit = calculateAppsFit(sec, gridConfig, stageSize);
            const isDragOver = dragOverLayerId === sec.id;

            return (
              <div
                key={sec.id}
                draggable
                onDragStart={(e) => {
                  setDraggedLayerId(sec.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedLayerId && draggedLayerId !== sec.id) {
                    setDragOverLayerId(sec.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverLayerId === sec.id) {
                    setDragOverLayerId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedLayerId && draggedLayerId !== sec.id) {
                    onReorderLayer(draggedLayerId, sec.id);
                  }
                  setDraggedLayerId(null);
                  setDragOverLayerId(null);
                }}
                onDragEnd={() => {
                  setDraggedLayerId(null);
                  setDragOverLayerId(null);
                }}
                onClick={(e) => onSelectSection(sec.id, e.shiftKey)}
                className={`flex items-center justify-between rounded-md border px-2 py-1.5 cursor-pointer transition ${
                  isDragOver
                    ? "border-emerald-500 bg-[#27272a]"
                    : isSel
                    ? "border-indigo-500 bg-[#27272a] text-white"
                    : "border-[#27272a] bg-[#121215] text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <GripVertical
                    size={12}
                    className="shrink-0 cursor-grab text-zinc-500"
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: sec.color }}
                  />
                  <span className="truncate font-semibold text-[11px]">
                    {sec.title || "Untitled"}
                  </span>
                  {sec.groupId && (
                    <span className="rounded bg-purple-950 border border-purple-700 px-1 py-0.2 text-[9px] font-bold text-purple-300">
                      GRP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-zinc-400">
                    {fit.cols}×{fit.rows}
                  </span>
                  <span className="rounded bg-[#18181b] border border-[#27272a] px-1 text-[9px] font-mono text-zinc-400">
                    #{actualIndex + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[11px] text-zinc-500 text-center py-2">
          No section boxes on canvas yet.
        </div>
      )}
    </div>
  );

  // 1. EMPTY SELECTION VIEW
  if (selectedIds.length === 0) {
    return (
      <aside
        style={{ width }}
        className="relative shrink-0 h-full bg-[#121215] border-l border-[#27272a] flex flex-col overflow-y-auto no-scrollbar p-4 text-xs text-white select-none space-y-4"
      >
        {renderResizeHandle()}
        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Box & Layer Editor
        </div>

        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-center space-y-3">
          <p className="text-xs text-zinc-400">
            Click a box, <span className="text-zinc-200 font-semibold">Shift+Click</span> multiple boxes, or drag a selection rectangle on the empty canvas to group or reorder layers.
          </p>
          <button
            onClick={() => addSection()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
          >
            <Plus size={14} />
            <span>Create Section Box</span>
          </button>
        </div>

        {renderLayersManager()}
      </aside>
    );
  }

  // 2. MULTI-SELECTION / GROUP VIEW (2+ boxes selected)
  if (isMultiSelected || !selectedSection) {
    const primaryBox = selectedObjects[0] || {};
    const batchColor = primaryBox.color || "#00ffff";
    const batchTitleBgOpacity =
      primaryBox.titleBgOpacity !== undefined
        ? Number(primaryBox.titleBgOpacity)
        : 0.45;
    const batchBoxOpacity =
      primaryBox.boxOpacity !== undefined
        ? Number(primaryBox.boxOpacity)
        : 0.65;

    return (
      <aside
        style={{ width }}
        className="relative shrink-0 h-full bg-[#121215] border-l border-[#27272a] flex flex-col overflow-y-auto no-scrollbar text-xs text-white select-none"
      >
        {renderResizeHandle()}
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#27272a] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-white">
              {isSingleGroupSelected
                ? `Group (${selectedIds.length} Boxes)`
                : `${selectedIds.length} Boxes Selected`}
            </h2>
            <p className="text-[11px] text-zinc-400">
              Move together with mouse or arrow keys
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => addSection()}
              title="Create Section Box"
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500"
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
            <button
              onClick={deleteSelectedSections}
              title="Delete Selected Boxes (Delete)"
              className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-500"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* GROUP / UNGROUP CARD */}
          <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Selection Grouping
              </span>
              <span className="text-[10px] font-semibold text-indigo-400">
                {isSingleGroupSelected ? "Grouped Unit" : "Multi-Selection"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isSingleGroupSelected}
                onClick={groupSelected}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <GroupIcon size={14} />
                <span>Group (Ctrl+G)</span>
              </button>
              <button
                disabled={!hasGroupedSelection}
                onClick={ungroupSelected}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#27272a] bg-[#121215] px-3 py-2 text-xs font-bold text-zinc-200 transition hover:bg-[#27272a] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UngroupIcon size={14} />
                <span>Ungroup</span>
              </button>
            </div>
          </div>

          {/* BATCH APPEARANCE CONTROLS FOR ALL SELECTED BOXES */}
          <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Batch Style ({selectedIds.length} Boxes)
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-300 font-semibold">
                Border & Title Bar Color
              </span>
              <input
                type="color"
                value={batchColor}
                onChange={(e) =>
                  updateSelectedSections(
                    { color: e.target.value },
                    { key: "batch-color" }
                  )
                }
                className="h-8 w-16 cursor-pointer rounded-lg border border-[#27272a] bg-[#121215] p-1"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-zinc-400">Title Bar BG Opacity</span>
                <span className="font-bold text-white">
                  {Math.round(batchTitleBgOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={batchTitleBgOpacity}
                onChange={(e) =>
                  updateSelectedSections(
                    { titleBgOpacity: Number(e.target.value) },
                    { key: "batch-title-opacity" }
                  )
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-zinc-400">Box Interior Opacity</span>
                <span className="font-bold text-white">
                  {Math.round(batchBoxOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={batchBoxOpacity}
                onChange={(e) =>
                  updateSelectedSections(
                    { boxOpacity: Number(e.target.value) },
                    { key: "batch-box-opacity" }
                  )
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* LAYER ORDER & DRAGGABLE LAYER STACK */}
          {renderLayersManager()}
        </div>
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
    <aside
      style={{ width }}
      className="relative shrink-0 h-full bg-[#121215] border-l border-[#27272a] flex flex-col overflow-y-auto no-scrollbar text-xs text-white select-none"
    >
      {renderResizeHandle()}
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#27272a] px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-white">Box Editor</h2>
          <p className="text-[11px] text-zinc-400">
            Arrow keys move 1 folder slot
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addSection()}
            title="Create New Section Box"
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500"
          >
            <Plus size={13} />
            <span>Add Box</span>
          </button>
          <button
            onClick={() => deleteSection(selectedSection.id)}
            title="Delete Box (or press Delete key)"
            className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-500"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
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

        {/* 6. LAYER ORDER & DRAGGABLE LAYER STACK */}
        {renderLayersManager()}
      </div>
    </aside>
  );
}

export default EditorPanel;
