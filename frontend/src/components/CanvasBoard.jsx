import { Stage, Layer, Rect, Image as KonvaImage, Shape } from "react-konva";
import { useState, useRef, useEffect, useCallback } from "react";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Grid3X3 from "lucide-react/dist/esm/icons/grid-3x3";
import Download from "lucide-react/dist/esm/icons/download";

import TopNavbar from "./TopNavbar";
import Toolbar from "./Toolbar";
import SectionBox from "./SectionBox";
import EditorPanel from "./EditorPanel";
import TemplateLibraryModal from "./TemplateLibraryModal";
import AuthModal from "./AuthModal";
import SavedLayoutsModal from "./SavedLayoutsModal";

import { saveDesignState, loadDesignState } from "../utils/storage";
import useHistory from "../utils/useHistory";
import {
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  moveLayerTo,
} from "../utils/layers";
import {
  getDesktopGridMetrics,
  getRowTopY,
  getRowSpanHeight,
  snapBoxToFolderGrid,
} from "../utils/gridMath";
import {
  DEFAULT_TEMPLATES,
  authApi,
  templateApi,
  layoutApi,
  LAYOUTS_ARE_LOCAL,
} from "../services/api";

const BOA_DEFAULT_WALLPAPER = {
  type: "image",
  url: "/templates/boa-hancock.jpg",
  title: "Boa Hancock",
  templateId: "builtin-boa-hancock",
};

const MAX_WALLPAPER_BYTES = 20 * 1024 * 1024; // 20MB limit

function CanvasBoard() {
  const stageRef = useRef(null);
  const bgLayerRef = useRef(null);
  const centerWorkspaceRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const videoElementRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("✓ Auto-saved locally");

  // Docked Sidebars & Full-Viewport Preview Mode
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isFullPreview, setIsFullPreview] = useState(false);

  // Target Screen Resolution (Full 1:1 Logical Coordinates)
  // stageSize, gridConfig, wallpaper and sections live in ONE history document so
  // Ctrl+Z / Ctrl+Shift+Z undo and redo every kind of edit.
  const {
    doc,
    set: setDoc,
    undo,
    redo,
    reset: resetDoc,
    canUndo,
    canRedo,
  } = useHistory({
    stageSize: {
      width: typeof window !== "undefined" ? window.screen.width : 1920,
      height: typeof window !== "undefined" ? window.screen.height : 1080,
    },
    // Grid Configuration: "pc" (Exact 75×87 Windows Desktop Folder Grid) or "custom"
    gridConfig: {
      showGrid: true,
      mode: "pc",
      customGridSize: 20,
      pcCellWidth: 75,
      pcCellHeight: 87,
    },
    activeWallpaper: BOA_DEFAULT_WALLPAPER,
    sections: [],
  });

  const { stageSize, gridConfig, activeWallpaper, sections } = doc;

  const applyUpdate = (current, updater) =>
    typeof updater === "function" ? updater(current) : updater;

  const setStageSize = useCallback(
    (u, opts) =>
      setDoc((d) => ({ ...d, stageSize: applyUpdate(d.stageSize, u) }), {
        key: "stage",
        ...opts,
      }),
    [setDoc]
  );
  const setGridConfig = useCallback(
    (u, opts) =>
      setDoc((d) => ({ ...d, gridConfig: applyUpdate(d.gridConfig, u) }), {
        key: "grid",
        ...opts,
      }),
    [setDoc]
  );
  const setActiveWallpaper = useCallback(
    (u, opts) =>
      setDoc(
        (d) => ({ ...d, activeWallpaper: applyUpdate(d.activeWallpaper, u) }),
        opts
      ),
    [setDoc]
  );
  const setSections = useCallback(
    (u, opts) =>
      setDoc((d) => ({ ...d, sections: applyUpdate(d.sections, u) }), opts),
    [setDoc]
  );

  const [sizeInputs, setSizeInputs] = useState({
    width: typeof window !== "undefined" ? window.screen.width : 1920,
    height: typeof window !== "undefined" ? window.screen.height : 1080,
  });

  // Keep the W/H inputs in sync after undo / redo of a screen size change
  useEffect(() => {
    setSizeInputs({ width: stageSize.width, height: stageSize.height });
  }, [stageSize.width, stageSize.height]);

  // Measured Center Workspace Bounds to Scale Preview Canvas Proportionally (No Scroll)
  const [workspaceBounds, setWorkspaceBounds] = useState({
    width: 960,
    height: 540,
  });

  // Active Wallpaper Loaded Media Element
  const [bgMediaElement, setBgMediaElement] = useState(null);

  // Selection (supports multi-select + groups). Section order in `sections` = layer order.
  const [selectedIds, setSelectedIds] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const marqueeRef = useRef(null);
  const dragRef = useRef(null);
  const gestureSeq = useRef(0);
  const [dropTargetId, setDropTargetId] = useState(null);

  // Templates & Auth Modals
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState("");
  const [isSavedLayoutsOpen, setIsSavedLayoutsOpen] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("dc_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const WIDTH = stageSize.width;
  const HEIGHT = stageSize.height;
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedSection = sections.find((s) => s.id === selectedId);
  const metrics = getDesktopGridMetrics(stageSize, gridConfig);
  const {
    taskbarHeight,
    usableHeight,
    desktopCols,
    desktopRows,
    cellW,
    cellH,
    rowTopOffset,
    rowGapTrim,
    scaleY,
  } = metrics;

  // Keep selectedIds valid if Undo/Redo removes any selected box
  useEffect(() => {
    const validSet = new Set(sections.map((s) => s.id));
    setSelectedIds((prev) => {
      const filtered = prev.filter((id) => validSet.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [sections]);

  // Expand any selection ID list to include all members of the same groupId
  const expandWithGroupMembers = useCallback((ids, secList) => {
    const idSet = new Set(ids);
    const groupIds = new Set();
    secList.forEach((s) => {
      if (idSet.has(s.id) && s.groupId) {
        groupIds.add(s.groupId);
      }
    });
    if (groupIds.size === 0) return Array.from(idSet);
    secList.forEach((s) => {
      if (s.groupId && groupIds.has(s.groupId)) {
        idSet.add(s.id);
      }
    });
    return Array.from(idSet);
  }, []);

  // Select a box (or toggle in multi-selection when Shift+Click is used)
  const handleSelectSection = useCallback(
    (id, shiftKey = false) => {
      if (!id) {
        setSelectedIds([]);
        return;
      }
      const targetSec = sections.find((s) => s.id === id);
      const unitIds = targetSec?.groupId
        ? sections
            .filter((s) => s.groupId === targetSec.groupId)
            .map((s) => s.id)
        : [id];

      setSelectedIds((prev) => {
        if (shiftKey) {
          const allSelected = unitIds.every((uid) => prev.includes(uid));
          if (allSelected) {
            return prev.filter((pid) => !unitIds.includes(pid));
          }
          return Array.from(new Set([...prev, ...unitIds]));
        }
        return unitIds;
      });
      if (!isFullPreview) setIsRightOpen(true);
    },
    [sections, isFullPreview]
  );

  // Group / Ungroup actions (Ctrl+G / Ctrl+Shift+G + Sidebar buttons)
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const newGroupId = `grp-${Date.now()}`;
    const selSet = new Set(selectedIds);
    setSections((prev) =>
      prev.map((s) => (selSet.has(s.id) ? { ...s, groupId: newGroupId } : s))
    );
  }, [selectedIds, setSections]);

  const ungroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selSet = new Set(selectedIds);
    const targetGroups = new Set(
      sections
        .filter((s) => selSet.has(s.id) && s.groupId)
        .map((s) => s.groupId)
    );
    if (targetGroups.size === 0) return;
    setSections((prev) =>
      prev.map((s) =>
        selSet.has(s.id) || (s.groupId && targetGroups.has(s.groupId))
          ? { ...s, groupId: null }
          : s
      )
    );
  }, [selectedIds, sections, setSections]);

  // Layer Ordering Actions (Buttons + Drag List + Keyboard Shortcuts)
  const handleBringToFront = useCallback(
    (targetIds = selectedIds) => {
      if (!targetIds.length) return;
      const expanded = expandWithGroupMembers(targetIds, sections);
      setSections((prev) => bringToFront(prev, expanded));
    },
    [selectedIds, sections, expandWithGroupMembers, setSections]
  );

  const handleSendToBack = useCallback(
    (targetIds = selectedIds) => {
      if (!targetIds.length) return;
      const expanded = expandWithGroupMembers(targetIds, sections);
      setSections((prev) => sendToBack(prev, expanded));
    },
    [selectedIds, sections, expandWithGroupMembers, setSections]
  );

  const handleBringForward = useCallback(
    (targetIds = selectedIds) => {
      if (!targetIds.length) return;
      const expanded = expandWithGroupMembers(targetIds, sections);
      setSections((prev) => bringForward(prev, expanded));
    },
    [selectedIds, sections, expandWithGroupMembers, setSections]
  );

  const handleSendBackward = useCallback(
    (targetIds = selectedIds) => {
      if (!targetIds.length) return;
      const expanded = expandWithGroupMembers(targetIds, sections);
      setSections((prev) => sendBackward(prev, expanded));
    },
    [selectedIds, sections, expandWithGroupMembers, setSections]
  );

  const handleReorderLayer = useCallback(
    (dragId, targetId) => {
      setSections((prev) => moveLayerTo(prev, dragId, targetId));
    },
    [setSections]
  );

  // Measure Center Workspace Available Area (ResizeObserver)
  useEffect(() => {
    const el = centerWorkspaceRef.current;
    if (!el) return;

    const updateBounds = () => {
      const rect = el.getBoundingClientRect();
      const pad = isFullPreview ? 12 : 36;
      setWorkspaceBounds({
        width: Math.max(240, rect.width - pad),
        height: Math.max(180, rect.height - pad),
      });
    };

    updateBounds();
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateBounds);
      observer.observe(el);
    }
    window.addEventListener("resize", updateBounds);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, [isLeftOpen, isRightOpen, isFullPreview]);

  // Uniform Scale Factor to Keep Exact Screen Aspect Ratio Inside Center Preview
  const scale = Math.min(
    workspaceBounds.width / WIDTH,
    workspaceBounds.height / HEIGHT,
    1
  );
  const previewWidth = Math.round(WIDTH * scale);
  const previewHeight = Math.round(HEIGHT * scale);

  // Keyboard Controls:
  // - Ctrl+Z: Undo
  // - Ctrl+Shift+Z / Ctrl+Y: Redo
  // - Ctrl+A: Select all section boxes
  // - Ctrl+G / Ctrl+Shift+G: Group / Ungroup selected boxes
  // - Ctrl+] / Ctrl+[: Bring Forward / Send Backward (with Shift: To Front / To Back)
  // - Delete / Backspace: Delete all selected section boxes
  // - ArrowUp / ArrowDown / ArrowLeft / ArrowRight: Move all selected/grouped boxes together
  // - Escape: Exit Full Preview mode or clear multi-selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const isMod = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();

      // Undo / Redo
      if (isMod && keyLower === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if (isMod && keyLower === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Select All (Ctrl+A)
      if (isMod && keyLower === "a") {
        e.preventDefault();
        setSelectedIds(sections.map((s) => s.id));
        if (!isFullPreview && sections.length > 0) setIsRightOpen(true);
        return;
      }

      // Group / Ungroup (Ctrl+G / Ctrl+Shift+G)
      if (isMod && keyLower === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else {
          groupSelected();
        }
        return;
      }

      // Layer Ordering Shortcuts (Ctrl+] / Ctrl+[)
      if (isMod && (e.key === "]" || e.key === "}" || e.code === "BracketRight")) {
        e.preventDefault();
        if (e.shiftKey) {
          handleBringToFront();
        } else {
          handleBringForward();
        }
        return;
      }
      if (isMod && (e.key === "[" || e.key === "{" || e.code === "BracketLeft")) {
        e.preventDefault();
        if (e.shiftKey) {
          handleSendToBack();
        } else {
          handleSendBackward();
        }
        return;
      }

      if (e.key === "Escape") {
        if (isFullPreview) {
          setIsFullPreview(false);
        } else if (selectedIds.length > 0) {
          setSelectedIds([]);
        }
        return;
      }

      if (selectedIds.length === 0) return;
      const activeSet = new Set(expandWithGroupMembers(selectedIds, sections));

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setSections((prev) => prev.filter((s) => !activeSet.has(s.id)));
        setSelectedIds([]);
        return;
      }

      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        const isPcMode = gridConfig.showGrid && gridConfig.mode === "pc";

        setSections(
          (prev) =>
            prev.map((s) => {
              if (!activeSet.has(s.id)) return s;

              if (isPcMode) {
                const curCol = Math.round((s.x || 0) / cellW);
                const curRow = Math.round(((s.y || 0) + rowTopOffset) / cellH);
                const spanCols = Math.max(
                  1,
                  Math.round((s.width || cellW) / cellW)
                );
                const spanRows = Math.max(
                  1,
                  Math.round(((s.height || cellH) + rowGapTrim) / cellH)
                );

                let nextCol = curCol;
                let nextRow = curRow;
                if (e.key === "ArrowLeft") nextCol -= 1;
                if (e.key === "ArrowRight") nextCol += 1;
                if (e.key === "ArrowUp") nextRow -= 1;
                if (e.key === "ArrowDown") nextRow += 1;

                nextCol = Math.max(0, Math.min(desktopCols - spanCols, nextCol));
                nextRow = Math.max(0, Math.min(desktopRows - spanRows, nextRow));

                return {
                  ...s,
                  x: Math.round(nextCol * cellW),
                  y: getRowTopY(nextRow, metrics),
                  width: Math.round(spanCols * cellW),
                  height: getRowSpanHeight(nextRow, spanRows, metrics),
                };
              }

              const step = e.shiftKey
                ? 1
                : Math.max(5, Number(gridConfig.customGridSize) || 20);
              let nextX = s.x;
              let nextY = s.y;
              if (e.key === "ArrowLeft") nextX -= step;
              if (e.key === "ArrowRight") nextX += step;
              if (e.key === "ArrowUp") nextY -= step;
              if (e.key === "ArrowDown") nextY += step;

              return {
                ...s,
                x: Math.max(0, Math.min(WIDTH - s.width, Math.round(nextX))),
                y: Math.max(0, Math.min(HEIGHT - s.height, Math.round(nextY))),
              };
            }),
          { key: "arrow-move", window: 600 }
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedIds,
    sections,
    isFullPreview,
    gridConfig,
    metrics,
    cellW,
    cellH,
    rowTopOffset,
    rowGapTrim,
    desktopCols,
    desktopRows,
    WIDTH,
    HEIGHT,
    undo,
    redo,
    groupSelected,
    ungroupSelected,
    handleBringToFront,
    handleSendToBack,
    handleBringForward,
    handleSendBackward,
    expandWithGroupMembers,
    setSections,
  ]);

  // Snap all boxes onto exact folder borders whenever PC App Grid is active & grid metrics change
  useEffect(() => {
    if (!isHydrated) return;
    if (gridConfig.showGrid && gridConfig.mode === "pc") {
      setSections(
        (prev) =>
          prev.map((s) => ({
            ...s,
            ...snapBoxToFolderGrid(s, gridConfig, stageSize),
          })),
        { replace: true }
      );
    }
  }, [isHydrated, gridConfig, stageSize, setSections]);

  // 1. Load Templates & Verify User Session on Mount
  useEffect(() => {
    templateApi.getAll().then((list) => {
      if (list && list.length) {
        setTemplates(list);
      }
    });

    const token = localStorage.getItem("dc_token");
    if (token) {
      authApi
        .getMe()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem("dc_user", JSON.stringify(res.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  // 2. Restore Latest Auto-Saved Design from IndexedDB / localStorage on Mount
  useEffect(() => {
    let mounted = true;
    loadDesignState().then((saved) => {
      if (!mounted) return;
      const defaultStage = {
        width: typeof window !== "undefined" ? window.screen.width : 1920,
        height: typeof window !== "undefined" ? window.screen.height : 1080,
      };
      const defaultGrid = {
        showGrid: true,
        mode: "pc",
        customGridSize: 20,
        pcCellWidth: 75,
        pcCellHeight: 87,
      };

      if (saved) {
        const nextStageSize =
          saved.stageSize?.width && saved.stageSize?.height
            ? saved.stageSize
            : defaultStage;
        setSizeInputs(nextStageSize);

        const cw =
          saved.gridConfig?.pcCellWidth === 76
            ? 75
            : saved.gridConfig?.pcCellWidth || 75;
        const ch =
          saved.gridConfig?.pcCellHeight === 100
            ? 87
            : saved.gridConfig?.pcCellHeight || 87;
        const nextGridConfig = saved.gridConfig
          ? {
              ...defaultGrid,
              ...saved.gridConfig,
              pcCellWidth: cw,
              pcCellHeight: ch,
            }
          : defaultGrid;

        const nextSections = Array.isArray(saved.sections) ? saved.sections : [];
        const nextWallpaper = saved.wallpaper?.url
          ? saved.wallpaper.title === "Luffy"
            ? {
                ...saved.wallpaper,
                title: "Toji Fushiguro",
                url: "/templates/toji.jpg",
                templateId: "builtin-toji",
              }
            : saved.wallpaper
          : BOA_DEFAULT_WALLPAPER;

        resetDoc({
          stageSize: nextStageSize,
          gridConfig: nextGridConfig,
          activeWallpaper: nextWallpaper,
          sections: nextSections,
        });
      } else {
        resetDoc({
          stageSize: defaultStage,
          gridConfig: defaultGrid,
          activeWallpaper: BOA_DEFAULT_WALLPAPER,
          sections: [],
        });
      }
      setIsHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, [resetDoc]);

  // 3. Load Active Wallpaper (Static Image OR Live Video Wallpaper)
  useEffect(() => {
    if (!activeWallpaper?.url) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = "";
      videoElementRef.current = null;
    }

    const isLiveVideo =
      activeWallpaper.type === "live" &&
      (activeWallpaper.url.startsWith("data:video/") ||
        activeWallpaper.url.endsWith(".mp4") ||
        activeWallpaper.url.endsWith(".webm") ||
        activeWallpaper.mimeType?.startsWith("video/"));

    if (isLiveVideo) {
      const video = document.createElement("video");
      video.src = activeWallpaper.url;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      video.onloadeddata = () => {
        videoElementRef.current = video;
        setBgMediaElement(video);
        video.play().catch(() => {});

        const tick = () => {
          if (bgLayerRef.current) {
            bgLayerRef.current.batchDraw();
          }
          animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
      };
    } else {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = activeWallpaper.url;
      img.onload = () => {
        setBgMediaElement(img);
      };
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeWallpaper]);

  // 4. Auto-Save Design on Every Change & Before Tab Close / Reload
  const triggerAutoSave = useCallback(() => {
    if (!isHydrated) return;
    setAutoSaveStatus("Saving...");
    saveDesignState({
      stageSize,
      gridConfig,
      sections,
      wallpaper: activeWallpaper,
    }).then(() => {
      setAutoSaveStatus("✓ Auto-saved locally");
    });
  }, [isHydrated, stageSize, gridConfig, sections, activeWallpaper]);

  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => {
      triggerAutoSave();
    }, 250);
    return () => clearTimeout(timer);
  }, [triggerAutoSave, isHydrated]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isHydrated) return;
      saveDesignState({
        stageSize,
        gridConfig,
        sections,
        wallpaper: activeWallpaper,
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isHydrated, stageSize, gridConfig, sections, activeWallpaper]);

  // Stage Size Helpers
  const updateStageSize = (width, height) => {
    const newWidth = Math.max(200, Number(width));
    const newHeight = Math.max(200, Number(height));
    const newSize = { width: newWidth, height: newHeight };
    setStageSize(newSize);
    setSizeInputs(newSize);
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
    const width = typeof window !== "undefined" ? window.screen.width : 1920;
    const height = typeof window !== "undefined" ? window.screen.height : 1080;
    updateStageSize(width, height);
  };

  // Hide/Restore UI Helpers for Clean Export
  const getUiNodes = (stage) => [
    ...stage.find(".delete-btn"),
    ...stage.find(".resize-handle"),
    ...stage.find(".grid1"),
    ...stage.find(".grid2"),
    ...stage.find(".bottombar"),
    ...stage.find(".ui-helper"),
  ];

  // Lossless High-Resolution PNG Export
  const exportWallpaper = () => {
    setIsExporting(true);

    setTimeout(() => {
      const stage = stageRef.current;
      if (!stage) {
        setIsExporting(false);
        return;
      }

      const nodesToHide = getUiNodes(stage);
      nodesToHide.forEach((node) => node.hide());

      const wpNode = stage.findOne(".wallpaper-node");
      const prevWpOpacity = wpNode ? wpNode.opacity() : 1;
      if (wpNode) wpNode.opacity(1);

      let targetNativeRatio = window.devicePixelRatio || 1;
      if (bgMediaElement) {
        const nativeW =
          bgMediaElement.naturalWidth || bgMediaElement.videoWidth || WIDTH;
        const nativeH =
          bgMediaElement.naturalHeight || bgMediaElement.videoHeight || HEIGHT;
        const sourceRatio = Math.max(nativeW / WIDTH, nativeH / HEIGHT);
        targetNativeRatio = Math.min(
          4,
          Math.max(targetNativeRatio, sourceRatio, 1.5)
        );
      }

      const exportPixelRatio = targetNativeRatio / scale;

      stage.draw();

      const uri = stage.toDataURL({
        mimeType: "image/png",
        quality: 1,
        pixelRatio: exportPixelRatio,
      });

      if (wpNode) wpNode.opacity(prevWpOpacity);
      nodesToHide.forEach((node) => node.show());
      stage.batchDraw();

      const link = document.createElement("a");
      link.download = `${(activeWallpaper?.title || "desktop-organizer")
        .toLowerCase()
        .replace(/\s+/g, "-")}-hd.png`;
      link.href = uri;
      link.click();

      setIsExporting(false);
    }, 80);
  };

  // Live Wallpaper Video Export (.webm at Full Target Resolution)
  const exportLiveVideo = () => {
    const stage = stageRef.current;
    if (!stage) return;

    setIsExporting(true);
    const nodesToHide = getUiNodes(stage);
    nodesToHide.forEach((node) => node.hide());
    const wpNode = stage.findOne(".wallpaper-node");
    const prevWpOpacity = wpNode ? wpNode.opacity() : 1;
    if (wpNode) wpNode.opacity(1);
    stage.draw();

    try {
      const recordCanvas = document.createElement("canvas");
      recordCanvas.width = WIDTH;
      recordCanvas.height = HEIGHT;
      const rCtx = recordCanvas.getContext("2d");
      rCtx.imageSmoothingEnabled = true;
      rCtx.imageSmoothingQuality = "high";

      const stageCanvases = stage.container().querySelectorAll("canvas");

      let recording = true;
      const renderLoop = () => {
        if (!recording) return;
        rCtx.clearRect(0, 0, WIDTH, HEIGHT);
        stageCanvases.forEach((c) => {
          rCtx.drawImage(c, 0, 0, WIDTH, HEIGHT);
        });
        requestAnimationFrame(renderLoop);
      };
      requestAnimationFrame(renderLoop);

      const stream = recordCanvas.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 25000000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        recording = false;
        if (wpNode) wpNode.opacity(prevWpOpacity);
        nodesToHide.forEach((node) => node.show());
        stage.batchDraw();

        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${(activeWallpaper?.title || "live-wallpaper")
          .toLowerCase()
          .replace(/\s+/g, "-")}.webm`;
        link.href = url;
        link.click();
        setIsExporting(false);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, 5000);
    } catch (err) {
      if (wpNode) wpNode.opacity(prevWpOpacity);
      nodesToHide.forEach((node) => node.show());
      stage.batchDraw();
      setIsExporting(false);
      exportWallpaper();
    }
  };

  // Handle Local Wallpaper / Live Wallpaper File Upload (<= 20MB)
  const applyLocalWallpaperFile = (file, customTitle) => {
    if (!file) return;
    if (file.size > MAX_WALLPAPER_BYTES) {
      alert("Wallpaper file exceeds the 20MB maximum size limit.");
      return;
    }

    const isVideoOrGif =
      file.type.startsWith("video/") || file.type === "image/gif";
    const reader = new FileReader();
    reader.onloadend = () => {
      setActiveWallpaper({
        type: isVideoOrGif ? "live" : "image",
        url: reader.result,
        mimeType: file.type,
        title: customTitle || file.name.replace(/\.[^/.]+$/, ""),
        templateId: `local-${Date.now()}`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleWallpaperUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) applyLocalWallpaperFile(file);
  };

  // Section CRUD (Snaps initial box strictly to folder borders in PC mode)
  const addSection = (overrides = {}) => {
    const startCol = Math.min(desktopCols - 4, 4 + (sections.length % 5));
    const startRow = Math.min(desktopRows - 3, 1 + (sections.length % 3));

    const defaultW = overrides.width || Math.round(4 * cellW);
    const defaultH =
      overrides.height || getRowSpanHeight(startRow, 3, metrics);
    const defaultX = Math.round(startCol * cellW);
    const defaultY = getRowTopY(startRow, metrics);

    const newSection = {
      id: Date.now(),
      title: overrides.title || "Apps",
      titlePosition: "attached-bar",
      titleBgOpacity: 0.45,
      boxOpacity: 0.65,
      color: "#00ffff",
      fillColor: "rgba(18, 18, 21, 0.65)",
      x: defaultX,
      y: defaultY,
      width: defaultW,
      height: defaultH,
      rotation: 0,
      shape: "rect",
      sides: 4,
      borderRadius: 12,
      strokeWidth: 2,
      imageUrl: null,
      imageFit: "cover",
      imageScale: 1,
      imageRotation: 0,
      imageOffsetX: 0,
      imageOffsetY: 0,
    };

    const snapped =
      gridConfig.showGrid && gridConfig.mode === "pc"
        ? {
            ...newSection,
            ...snapBoxToFolderGrid(newSection, gridConfig, stageSize),
          }
        : newSection;

    setSections((prev) => [...prev, snapped]);
    setSelectedIds([snapped.id]);
    if (!isFullPreview) setIsRightOpen(true);
  };

  const updateSection = (id, patch, opts = {}) => {
    setSections(
      (prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      { key: opts.key || `edit-${id}`, window: opts.window || 600, ...opts }
    );
  };

  // Batch update multiple selected sections (e.g., color, opacity, shape)
  const updateSelectedSections = (patch, opts = {}) => {
    const activeSet = new Set(expandWithGroupMembers(selectedIds, sections));
    if (activeSet.size === 0) return;
    setSections(
      (prev) => prev.map((s) => (activeSet.has(s.id) ? { ...s, ...patch } : s)),
      { key: opts.key || "batch-edit", window: opts.window || 600, ...opts }
    );
  };

  const deleteSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const deleteSelectedSections = () => {
    const activeSet = new Set(expandWithGroupMembers(selectedIds, sections));
    if (activeSet.size === 0) return;
    setSections((prev) => prev.filter((s) => !activeSet.has(s.id)));
    setSelectedIds([]);
  };

  // Synchronized Multi-Box / Group Mouse Dragging
  const handleMultiDragStart = (draggedId) => {
    const draggedSec = sections.find((s) => s.id === draggedId);
    const isAlreadyInSelection = selectedIds.includes(draggedId);
    let movingIds;
    if (isAlreadyInSelection) {
      movingIds = expandWithGroupMembers(selectedIds, sections);
    } else {
      movingIds = draggedSec?.groupId
        ? sections
            .filter((s) => s.groupId === draggedSec.groupId)
            .map((s) => s.id)
        : [draggedId];
      setSelectedIds(movingIds);
    }

    const startPositions = {};
    sections.forEach((s) => {
      if (movingIds.includes(s.id)) {
        startPositions[s.id] = {
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
        };
      }
    });

    gestureSeq.current += 1;
    dragRef.current = {
      draggedId,
      movingIds: new Set(movingIds),
      startPositions,
      historyKey: `multi-drag-${gestureSeq.current}`,
    };
  };

  const applyMultiDragDelta = (dx, dy) => {
    if (!dragRef.current) return;
    const { movingIds, startPositions, historyKey } = dragRef.current;
    const isPcMode = gridConfig.showGrid && gridConfig.mode === "pc";

    setSections(
      (prev) =>
        prev.map((s) => {
          if (!movingIds.has(s.id) || !startPositions[s.id]) return s;
          const orig = startPositions[s.id];
          const rawX = Math.max(0, Math.min(WIDTH - orig.width, orig.x + dx));
          const rawY = Math.max(0, Math.min(HEIGHT - orig.height, orig.y + dy));

          if (isPcMode) {
            const col = Math.max(
              0,
              Math.min(
                desktopCols - Math.max(1, Math.round(orig.width / cellW)),
                Math.round(rawX / cellW)
              )
            );
            const spanRows = Math.max(
              1,
              Math.round((orig.height + rowGapTrim) / cellH)
            );
            const row = Math.max(
              0,
              Math.min(
                desktopRows - spanRows,
                Math.round((rawY + rowTopOffset) / cellH)
              )
            );
            return {
              ...s,
              x: Math.round(col * cellW),
              y: getRowTopY(row, metrics),
              height: getRowSpanHeight(row, spanRows, metrics),
            };
          }

          if (gridConfig.showGrid) {
            const step = Math.max(5, Number(gridConfig.customGridSize) || 20);
            return {
              ...s,
              x: Math.round(rawX / step) * step,
              y: Math.round(rawY / step) * step,
            };
          }

          return {
            ...s,
            x: Math.round(rawX),
            y: Math.round(rawY),
          };
        }),
      { key: historyKey, window: 5000 }
    );
  };

  const handleMultiDragMove = (_draggedId, dx, dy) => {
    if (!dragRef.current || dragRef.current.movingIds.size <= 1) return;
    applyMultiDragDelta(dx, dy);
  };

  const handleMultiDragEnd = (_draggedId, dx, dy) => {
    applyMultiDragDelta(dx, dy);
    dragRef.current = null;
  };

  // Marquee Selection Rectangle on Empty Canvas Background
  const handleStageMouseDown = (e) => {
    const stage = e.target.getStage();
    if (e.target !== stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const startX = pointer.x / scale;
    const startY = pointer.y / scale;
    const shiftHeld = Boolean(e.evt?.shiftKey);

    marqueeRef.current = {
      startX,
      startY,
      curX: startX,
      curY: startY,
      shiftHeld,
      initialSelected: shiftHeld ? [...selectedIds] : [],
    };
    setMarquee({ x: startX, y: startY, width: 0, height: 0 });

    if (!shiftHeld) {
      setSelectedIds([]);
    }

    const onWindowMouseMove = (moveEvt) => {
      if (!marqueeRef.current || !stage) return;
      const stageRect = stage.container().getBoundingClientRect();
      const curX = Math.max(
        0,
        Math.min(WIDTH, (moveEvt.clientX - stageRect.left) / scale)
      );
      const curY = Math.max(
        0,
        Math.min(HEIGHT, (moveEvt.clientY - stageRect.top) / scale)
      );

      marqueeRef.current.curX = curX;
      marqueeRef.current.curY = curY;

      const x = Math.min(marqueeRef.current.startX, curX);
      const y = Math.min(marqueeRef.current.startY, curY);
      const width = Math.abs(curX - marqueeRef.current.startX);
      const height = Math.abs(curY - marqueeRef.current.startY);
      setMarquee({ x, y, width, height });

      if (width > 4 || height > 4) {
        const hitIds = sections
          .filter((sec) => {
            const boxRight = sec.x + sec.width;
            const boxBottom = sec.y + sec.height;
            const boxTop = sec.y - 26;
            return (
              sec.x < x + width &&
              boxRight > x &&
              boxTop < y + height &&
              boxBottom > y
            );
          })
          .map((sec) => sec.id);

        const combined = expandWithGroupMembers(
          [...marqueeRef.current.initialSelected, ...hitIds],
          sections
        );
        setSelectedIds(combined);
      }
    };

    const onWindowMouseUp = () => {
      marqueeRef.current = null;
      setMarquee(null);
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
  };

  // Assign an Image File to a Section Shape
  const handleImageFileForSection = (sectionId, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateSection(sectionId, {
        imageUrl: reader.result,
        imageFit: "cover",
        imageScale: 1,
      });
    };
    reader.readAsDataURL(file);
  };

  // HTML5 Drag & Drop Image Directly onto Any Shape on the Scaled Preview Canvas
  const findSectionAtCoords = (clientX, clientY) => {
    if (!stageWrapperRef.current) return null;
    const rect = stageWrapperRef.current.getBoundingClientRect();
    const logicalX = (clientX - rect.left) / scale;
    const logicalY = (clientY - rect.top) / scale;

    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if (
        logicalX >= s.x &&
        logicalX <= s.x + s.width &&
        logicalY >= s.y - 26 &&
        logicalY <= s.y + s.height
      ) {
        return s;
      }
    }
    return null;
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    const target = findSectionAtCoords(e.clientX, e.clientY);
    setDropTargetId(target ? target.id : null);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    const target = findSectionAtCoords(e.clientX, e.clientY);
    setDropTargetId(null);

    if (!file) return;

    if (target && file.type.startsWith("image/")) {
      handleImageFileForSection(target.id, file);
      setSelectedIds([target.id]);
    } else if (
      file.type.startsWith("image/") ||
      file.type.startsWith("video/")
    ) {
      applyLocalWallpaperFile(file);
    }
  };

  // Auth & Template Library Actions
  const requireAuth = (message) => {
    setAuthPromptMessage(message);
    setIsAuthModalOpen(true);
  };

  const handleToggleLikeTemplate = async (tpl) => {
    if (!user) {
      requireAuth(
        `Please sign up or log in first to like "${tpl.title}" and save favorite templates!`
      );
      return;
    }

    try {
      const res = await templateApi.toggleLike(tpl._id);
      setTemplates((prev) =>
        prev.map((item) =>
          String(item._id) === String(tpl._id) ||
          item.title === res.template?.title
            ? { ...item, likesCount: res.likesCount, _id: res.template._id }
            : item
        )
      );
      const updatedUser = { ...user, likedTemplates: res.likedTemplates };
      setUser(updatedUser);
      localStorage.setItem("dc_user", JSON.stringify(updatedUser));
    } catch (err) {
      if (err.requiresAuth) {
        requireAuth(err.message);
      }
    }
  };

  const handleUploadTemplateToLibrary = async ({ file, title, category }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", category);
    formData.append(
      "type",
      file.type.startsWith("video/") || file.type === "image/gif"
        ? "live"
        : "image"
    );

    const res = await templateApi.upload(formData);
    if (res.template) {
      setTemplates((prev) => [res.template, ...prev]);
      setActiveWallpaper({
        type: res.template.type,
        url: res.template.url,
        title: res.template.title,
        templateId: String(res.template._id),
      });
    }
  };

  const handleOpenSavedLayouts = () => {
    if (!LAYOUTS_ARE_LOCAL && !user) {
      requireAuth(
        "Please sign up or log in first to save your desktop layout to your account!"
      );
      return;
    }
    setIsSavedLayoutsOpen(true);
  };

  const handleLoadSavedLayout = (layout) => {
    if (layout.stageSize) {
      setStageSize(layout.stageSize);
      setSizeInputs(layout.stageSize);
    }
    if (layout.gridConfig) {
      setGridConfig((prev) => ({ ...prev, ...layout.gridConfig }));
    }
    if (layout.wallpaper?.url) {
      setActiveWallpaper(layout.wallpaper);
    }
    if (Array.isArray(layout.sections)) {
      setSections(layout.sections);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("dc_token");
    localStorage.removeItem("dc_user");
    setUser(null);
  };

  const isLiveWallpaper = activeWallpaper?.type === "live";

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#09090b] text-white">
      {/* 1. FIXED TOP NAVBAR (Hidden in Full Preview Mode) */}
      {!isFullPreview && (
        <TopNavbar
          isLeftOpen={isLeftOpen}
          setIsLeftOpen={setIsLeftOpen}
          isRightOpen={isRightOpen}
          setIsRightOpen={setIsRightOpen}
          onEnterFullPreview={() => setIsFullPreview(true)}
          stageSize={stageSize}
          scale={scale}
          autoSaveStatus={autoSaveStatus}
          showGrid={gridConfig.showGrid}
          onToggleGrid={() =>
            setGridConfig((prev) => ({ ...prev, showGrid: !prev.showGrid }))
          }
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenSavedLayouts={handleOpenSavedLayouts}
          exportWallpaper={exportWallpaper}
          exportLiveVideo={exportLiveVideo}
          isLiveWallpaper={isLiveWallpaper}
          isExporting={isExporting}
          user={user}
          onOpenAuth={requireAuth}
          onLogout={handleLogout}
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DOCKED LEFT SIDEBAR */}
        {!isFullPreview && (
          <Toolbar
            isOpen={isLeftOpen}
            handleWallpaperUpload={handleWallpaperUpload}
            activeWallpaper={activeWallpaper}
            addSection={addSection}
            gridConfig={gridConfig}
            setGridConfig={setGridConfig}
            stageSize={stageSize}
            sizeInputs={sizeInputs}
            onSizeInputChange={handleStageSizeInputChange}
            applyStageSize={applyStageSize}
            handleScreenNoTaskbar={handleScreenNoTaskbar}
            onOpenTemplates={() => setIsTemplateModalOpen(true)}
          />
        )}

        {/* COMPACT SOLID CONTROL BAR WHEN IN FULL PREVIEW MODE */}
        {isFullPreview && (
          <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#121215] p-1.5 shadow-2xl">
            <button
              onClick={() => addSection()}
              className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
            >
              <Plus size={14} /> Add Box
            </button>
            <button
              onClick={() =>
                setGridConfig((prev) => ({ ...prev, showGrid: !prev.showGrid }))
              }
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold ${
                gridConfig.showGrid
                  ? "bg-emerald-600 text-white"
                  : "bg-[#18181b] border border-[#27272a] text-zinc-400"
              }`}
            >
              <Grid3X3 size={14} /> Grid
            </button>
            <button
              onClick={exportWallpaper}
              className="flex items-center gap-1 rounded-md bg-[#18181b] border border-[#27272a] px-2.5 py-1.5 text-xs font-bold text-zinc-200 hover:text-white"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={() => setIsFullPreview(false)}
              className="flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-500"
            >
              <Minimize2 size={14} /> Exit Full Preview (Esc)
            </button>
          </div>
        )}

        {/* CENTER WORKSPACE: PROPORTIONALLY SCALED DESKTOP PREVIEW (NO SCROLL) */}
        <main
          ref={centerWorkspaceRef}
          onDragOver={handleCanvasDragOver}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={handleCanvasDrop}
          className={`flex-1 flex flex-col items-center justify-center bg-[#09090b] overflow-hidden select-none ${
            isFullPreview ? "p-1.5" : "p-4"
          }`}
        >
          {/* MONITOR PREVIEW FRAME */}
          <div
            ref={stageWrapperRef}
            style={{
              width: previewWidth,
              height: previewHeight,
            }}
            className="relative overflow-hidden rounded-md border-2 border-[#27272a] bg-[#09090b] shadow-2xl"
          >
            <Stage
              ref={stageRef}
              width={previewWidth}
              height={previewHeight}
              scaleX={scale}
              scaleY={scale}
              onMouseDown={handleStageMouseDown}
            >
              {/* LAYER 1 (LOWEST Z-INDEX): WALLPAPER (Dimmed when PC App Grid is ON) */}
              <Layer ref={bgLayerRef} listening={false}>
                {bgMediaElement && (
                  <KonvaImage
                    name="wallpaper-node"
                    image={bgMediaElement}
                    width={WIDTH}
                    height={HEIGHT}
                    opacity={
                      gridConfig.showGrid && gridConfig.mode === "pc"
                        ? 0.32
                        : 1
                    }
                  />
                )}
              </Layer>

              {/* LAYER 2 (MIDDLE Z-INDEX): INTERACTIVE SECTION BOXES */}
              <Layer>
                {sections.map((section) => {
                  const isBoxSelected = selectedIds.includes(section.id);
                  return (
                    <SectionBox
                      key={section.id}
                      section={section}
                      isSelected={isBoxSelected}
                      isSingleSelected={
                        isBoxSelected && selectedIds.length === 1
                      }
                      isDropTarget={dropTargetId === section.id}
                      gridConfig={gridConfig}
                      stageSize={stageSize}
                      scale={scale}
                      onSelect={handleSelectSection}
                      onMultiDragStart={handleMultiDragStart}
                      onMultiDragMove={handleMultiDragMove}
                      onMultiDragEnd={handleMultiDragEnd}
                      deleteSection={deleteSection}
                      updateSection={updateSection}
                    />
                  );
                })}
              </Layer>

              {/* LAYER 3 (HIGHEST Z-INDEX, NON-BLOCKING): EXACT 75×87 WINDOWS FOLDERS SHADOW GRID & TASKBAR */}
              <Layer listening={false}>
                {gridConfig.showGrid && (
                  <Shape
                    name="grid1"
                    sceneFunc={(context) => {
                      if (gridConfig.mode === "pc") {
                        context.save();
                        context.lineWidth = Math.max(1, 1.1 / scale);

                        // Exact 75×87 Windows Desktop Folders Shadow Grid
                        for (let r = 0; r < desktopRows; r++) {
                          const slotTopY = getRowTopY(r, metrics);
                          const slotBoxH = getRowSpanHeight(r, 1, metrics);

                          for (let c = 0; c < desktopCols; c++) {
                            const slotX = Math.round(c * cellW);

                            // Exact snap boundary box for this folder slot
                            context.fillStyle = "rgba(9, 9, 11, 0.42)";
                            context.fillRect(
                              slotX + 2,
                              slotTopY + 2,
                              cellW - 4,
                              slotBoxH - 4
                            );
                            context.strokeStyle = "rgba(255, 255, 255, 0.28)";
                            context.strokeRect(
                              slotX,
                              slotTopY,
                              cellW,
                              slotBoxH
                            );

                            // Folder icon at exact Windows coordinate: r * cellH + 4px
                            const iconW = Math.round(32 * scaleY);
                            const iconH = Math.round(25 * scaleY);
                            const iconX = Math.round(slotX + (cellW - iconW) / 2);
                            const iconY = Math.round(r * cellH + 4 * scaleY);

                            // Folder top tab
                            context.fillStyle = "rgba(250, 204, 21, 0.9)";
                            context.fillRect(
                              iconX,
                              iconY,
                              Math.round(iconW * 0.44),
                              Math.max(3, Math.round(4 * scaleY))
                            );

                            // Folder body
                            const tabH = Math.max(3, Math.round(4 * scaleY));
                            context.fillStyle = "rgba(234, 179, 8, 0.72)";
                            context.strokeStyle = "rgba(255, 255, 255, 0.85)";
                            context.fillRect(
                              iconX,
                              iconY + tabH,
                              iconW,
                              iconH - tabH
                            );
                            context.strokeRect(
                              iconX,
                              iconY + tabH,
                              iconW,
                              iconH - tabH
                            );

                            // 2-line Windows shortcut label bars ending at r * cellH + 57px
                            const labelW1 = Math.round(cellW * 0.72);
                            const labelW2 = Math.round(cellW * 0.52);
                            const labelY1 = iconY + iconH + Math.round(6 * scaleY);
                            const labelY2 = labelY1 + Math.round(9 * scaleY);

                            context.fillStyle = "rgba(255, 255, 255, 0.8)";
                            context.fillRect(
                              slotX + (cellW - labelW1) / 2,
                              labelY1,
                              labelW1,
                              Math.max(4, Math.round(5 * scaleY))
                            );
                            context.fillStyle = "rgba(255, 255, 255, 0.55)";
                            context.fillRect(
                              slotX + (cellW - labelW2) / 2,
                              labelY2,
                              labelW2,
                              Math.max(3, Math.round(4 * scaleY))
                            );
                          }
                        }

                        context.restore();
                      } else {
                        // Classic Custom Grid View
                        const step = Math.max(
                          5,
                          Number(gridConfig.customGridSize) || 20
                        );
                        context.beginPath();
                        for (let x = 0; x <= WIDTH; x += step) {
                          context.moveTo(x + 0.5, 0);
                          context.lineTo(x + 0.5, usableHeight);
                        }
                        for (let y = 0; y <= usableHeight; y += step) {
                          context.moveTo(0, y + 0.5);
                          context.lineTo(WIDTH, y + 0.5);
                        }
                        context.strokeStyle = "rgba(255, 255, 255, 0.14)";
                        context.lineWidth = 1 / scale;
                        context.stroke();
                      }
                    }}
                  />
                )}

                {/* WINDOWS TASKBAR GUIDE AREA */}
                <Rect
                  x={0}
                  name="bottombar"
                  y={usableHeight}
                  width={WIDTH}
                  height={taskbarHeight}
                  fill="rgba(24, 24, 27, 0.88)"
                  stroke="#3f3f46"
                  strokeWidth={1}
                />

                {/* MARQUEE SELECTION RECTANGLE (Hidden during export) */}
                {marquee && (marquee.width > 2 || marquee.height > 2) && (
                  <Rect
                    name="ui-helper"
                    x={marquee.x}
                    y={marquee.y}
                    width={marquee.width}
                    height={marquee.height}
                    fill="rgba(99, 102, 241, 0.14)"
                    stroke="#6366f1"
                    strokeWidth={Math.max(1.5, 1.5 / scale)}
                    dash={[6, 4]}
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </main>

        {/* DOCKED RIGHT SIDEBAR (Section Box Editor) */}
        {!isFullPreview && (
          <EditorPanel
            isOpen={isRightOpen}
            selectedSection={selectedSection}
            selectedIds={selectedIds}
            sections={sections}
            onSelectSection={handleSelectSection}
            setSelectedIds={setSelectedIds}
            addSection={addSection}
            updateSection={updateSection}
            updateSelectedSections={updateSelectedSections}
            deleteSection={deleteSection}
            deleteSelectedSections={deleteSelectedSections}
            groupSelected={groupSelected}
            ungroupSelected={ungroupSelected}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onReorderLayer={handleReorderLayer}
            gridConfig={gridConfig}
            stageSize={stageSize}
            onImageFileForSection={handleImageFileForSection}
          />
        )}
      </div>

      {/* MODALS */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        activeWallpaper={activeWallpaper}
        onSelectTemplate={(tpl) =>
          setActiveWallpaper({
            type: tpl.type || "image",
            url: tpl.url,
            mimeType: tpl.mimeType,
            title: tpl.title,
            templateId: String(tpl._id),
          })
        }
        onToggleLike={handleToggleLikeTemplate}
        onUploadTemplateToLibrary={handleUploadTemplateToLibrary}
        onLocalWallpaperFile={applyLocalWallpaperFile}
        user={user}
        onRequireAuth={requireAuth}
      />

      <SavedLayoutsModal
        isOpen={isSavedLayoutsOpen}
        onClose={() => setIsSavedLayoutsOpen(false)}
        layoutApi={layoutApi}
        currentLayoutPayload={{
          stageSize,
          gridConfig,
          wallpaper: activeWallpaper,
          sections,
        }}
        onLoadLayout={handleLoadSavedLayout}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authPromptMessage}
        onAuthSuccess={(loggedInUser) => setUser(loggedInUser)}
        authApi={authApi}
      />
    </div>
  );
}

export default CanvasBoard;
