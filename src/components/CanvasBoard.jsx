import { Stage, Layer, Rect, Image } from "react-konva";

import { useState, useRef, useEffect } from "react";

import Toolbar from "./Toolbar";
import SectionBox from "./SectionBox";

function CanvasBoard() {
  const GRID_SIZE = 20;

  const stageRef = useRef();
  const [isExporting, setIsExporting] = useState(false);

  const [stageSize, setStageSize] = useState({
    width: typeof window !== "undefined" ? window.screen.width : 1920,

    height: typeof window !== "undefined" ? window.screen.height : 1080,
  });

  const [sizeInputs, setSizeInputs] = useState({
    width: typeof window !== "undefined" ? window.screen.width : 1920,

    height: typeof window !== "undefined" ? window.screen.height : 1080,
  });

  const [bgImage, setBgImage] = useState(null);

  const [selectedId, setSelectedId] = useState(null);

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem("sections");

    return saved ? JSON.parse(saved) : [];
  });

  const [showGrid, setShowGrid] = useState(true);

  const selectedSection = sections.find((section) => section.id === selectedId);

  const WIDTH = stageSize.width;
  const HEIGHT = stageSize.height;

  const updateStageSize = (width, height) => {
    const newWidth = Math.max(200, Number(width));
    const newHeight = Math.max(200, Number(height));

    const newSize = {
      width: newWidth,
      height: newHeight,
    };

    setStageSize(newSize);
    setSizeInputs(newSize);
    localStorage.setItem("stageSize", JSON.stringify(newSize));
  };

  const getScreenSize = () => {
    const width = typeof window !== "undefined" ? window.screen.width : 1920;
    const height = typeof window !== "undefined" ? window.screen.height : 1080;

    return { width, height };
  };

  const handleStageSizeInputChange = (name, value) => {
    setSizeInputs((current) => ({
      ...current,
      [name]: Number(value),
    }));
  };

  const applyStageSize = () => {
    updateStageSize(sizeInputs.width, sizeInputs.height);
  };

  const handleScreenNoTaskbar = () => {
    const { width, height } = getScreenSize();
    updateStageSize(width, height);
  };

  // SNAP
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // EXPORT
  const exportWallpaper = () => {
    setIsExporting(true);

    setTimeout(() => {
      const stage = stageRef.current;

      // HIDE DELETE BUTTONS
      stage.find(".delete-btn").forEach((node) => node.hide());

      // HIDE RESIZE HANDLES
      stage.find(".resize-handle").forEach((node) => node.hide());

      // HIDE grid
      stage.find(".grid1").forEach((node) => node.hide());
      stage.find(".grid2").forEach((node) => node.hide());

      //HIDE Bottom bar
      stage.find(".bottombar").forEach((node) => node.hide());

      // REDRAW
      stage.draw();

      const uri = stage.toDataURL({
        pixelRatio: window.devicePixelRatio,
      });

      const link = document.createElement("a");

      link.download = "desktop-organizer.png";

      link.href = uri;

      link.click();
      setIsExporting(false);
    }, 100);
  };

  // UPLOAD
  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      localStorage.setItem("wallpaper", reader.result);

      const image = new window.Image();

      image.src = reader.result;

      image.onload = () => {
        setBgImage(image);
      };
    };

    reader.readAsDataURL(file);
  };

  // LOAD WALLPAPER
  useEffect(() => {
    const savedWallpaper = localStorage.getItem("wallpaper");

    if (savedWallpaper) {
      const image = new window.Image();

      image.src = savedWallpaper;

      image.onload = () => {
        setBgImage(image);
      };
    }
  }, []);

  useEffect(() => {
    const savedStageSize = localStorage.getItem("stageSize");

    if (savedStageSize) {
      const parsed = JSON.parse(savedStageSize);

      if (parsed?.width && parsed?.height) {
        setStageSize(parsed);
        setSizeInputs(parsed);
      }
    }
  }, []);

  // SAVE SECTIONS
  useEffect(() => {
    localStorage.setItem("sections", JSON.stringify(sections));
  }, [sections]);

  // DRAG
  const handleDragEnd = (e, id) => {
    const updated = sections.map((section) => {
      if (section.id === id) {
        return {
          ...section,

          x: snapToGrid(e.x()),

          y: snapToGrid(e.y()),
        };
      }

      return section;
    });

    setSections(updated);
  };

  // ADD
  const addSection = () => {
    const newSection = {
      id: Date.now(),

      title: "New Section",

      color: "#00ffff",

      x: 100,
      y: 100,

      width: 250,
      height: 300,
    };

    setSections([...sections, newSection]);
  };

  // DELETE
  const deleteSection = (id) => {
    const updated = sections.filter((section) => section.id !== id);

    setSections(updated);

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  return (
    <div
      className="relative overflow-auto bg-[#050816]"
      style={{
        width: WIDTH,
        height: HEIGHT,
      }}
    >
      {/* TOOLBAR */}
      <Toolbar
        handleWallpaperUpload={handleWallpaperUpload}
        addSection={addSection}
        exportWallpaper={exportWallpaper}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        sizeInputs={sizeInputs}
        onSizeInputChange={handleStageSizeInputChange}
        applyStageSize={applyStageSize}
        handleScreenNoTaskbar={handleScreenNoTaskbar}
      />

      {/* SIDEBAR */}
      {selectedSection && (
        <div className="absolute right-0 top-0 z-50 h-screen w-[320px] border-l border-white/10 bg-black/40 p-6 text-white backdrop-blur-2xl shadow-2xl">
          {/* HEADER */}
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Section Editor</h2>

            <button
              onClick={() => setSelectedId(null)}
              className="rounded-lg bg-red-500 px-3 py-1"
            >
              ✕
            </button>
          </div>

          {/* TITLE */}
          <div className="mb-5">
            <label className="mb-2 block text-sm text-zinc-400">Title</label>

            <input
              type="text"
              value={selectedSection.title}
              onChange={(e) => {
                const updated = sections.map((section) => {
                  if (section.id === selectedId) {
                    return {
                      ...section,

                      title: e.target.value,
                    };
                  }

                  return section;
                });

                setSections(updated);
              }}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 outline-none"
            />
          </div>

          {/* COLOR */}
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Border Color
            </label>

            <input
              type="color"
              value={selectedSection.color}
              onChange={(e) => {
                const updated = sections.map((section) => {
                  if (section.id === selectedId) {
                    return {
                      ...section,

                      color: e.target.value,
                    };
                  }

                  return section;
                });

                setSections(updated);
              }}
              className="h-14 w-full cursor-pointer rounded-xl border border-white/10 bg-zinc-900 p-2"
            />
          </div>

          <div className="mt-6 grid gap-5">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Width (L)
              </label>
              <input
                type="number"
                min="120"
                value={selectedSection.width}
                onChange={(e) => {
                  const updated = sections.map((section) => {
                    if (section.id === selectedId) {
                      return {
                        ...section,
                        width: Math.max(120, Number(e.target.value)),
                      };
                    }
                    return section;
                  });
                  setSections(updated);
                }}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Height (B)
              </label>
              <input
                type="number"
                min="120"
                value={selectedSection.height}
                onChange={(e) => {
                  const updated = sections.map((section) => {
                    if (section.id === selectedId) {
                      return {
                        ...section,
                        height: Math.max(120, Number(e.target.value)),
                      };
                    }
                    return section;
                  });
                  setSections(updated);
                }}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STAGE */}
      <Stage ref={stageRef} width={WIDTH} height={HEIGHT}>
        <Layer>
          {/* WALLPAPER */}
          {bgImage && <Image image={bgImage} width={WIDTH} height={HEIGHT} />}

          {/* GRID */}
          {showGrid && (
            <>
              {Array.from({
                length: WIDTH / GRID_SIZE,
              }).map((_, i) => (
                <Rect
                  name="grid1"
                  key={`v-${i}`}
                  x={i * GRID_SIZE}
                  y={0}
                  width={1}
                  height={HEIGHT}
                  fill="rgba(255,255,255,0.04)"
                />
              ))}

              {Array.from({
                length: HEIGHT / GRID_SIZE,
              }).map((_, i) => (
                <Rect
                  name="grid2"
                  key={`h-${i}`}
                  x={0}
                  y={i * GRID_SIZE}
                  width={WIDTH}
                  height={1}
                  fill="rgba(255,255,255,0.04)"
                />
              ))}
            </>
          )}

          {/* TASKBAR AREA - 48px from bottom */}
          <Rect
            x={0}
            name="bottombar"
            y={HEIGHT - 48}
            width={WIDTH}
            height={48}
            fill="rgba(255, 165, 0, 0.2)"
            stroke="rgba(255, 165, 0, 0.5)"
            strokeWidth={1}
          />

          {/* SECTIONS */}
          {sections.map((section) => (
            <SectionBox
              key={section.id}
              isExporting={isExporting}
              section={section}
              handleDragEnd={handleDragEnd}
              setSelectedId={setSelectedId}
              deleteSection={deleteSection}
              sections={sections}
              setSections={setSections}
              snapToGrid={snapToGrid}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default CanvasBoard;
