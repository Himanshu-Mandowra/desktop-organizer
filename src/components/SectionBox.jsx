import { useEffect, useState, useRef } from "react";
import {
  Group,
  Shape,
  Rect,
  Text,
  Circle as KonvaCircle,
  Line,
} from "react-konva";
import { drawShapePath, drawFittedImage } from "../utils/shapeGeometry";
import {
  calculateAppsFit,
  getDesktopGridMetrics,
  getRowTopY,
  getRowSpanHeight,
  hexToRgba,
} from "../utils/gridMath";

const RESIZE_HANDLES = [
  { id: "nw", xFactor: 0, yFactor: 0, cursor: "nwse-resize" },
  { id: "n", xFactor: 0.5, yFactor: 0, cursor: "ns-resize" },
  { id: "ne", xFactor: 1, yFactor: 0, cursor: "nesw-resize" },
  { id: "e", xFactor: 1, yFactor: 0.5, cursor: "ew-resize" },
  { id: "se", xFactor: 1, yFactor: 1, cursor: "nwse-resize" },
  { id: "s", xFactor: 0.5, yFactor: 1, cursor: "ns-resize" },
  { id: "sw", xFactor: 0, yFactor: 1, cursor: "nesw-resize" },
  { id: "w", xFactor: 0, yFactor: 0.5, cursor: "ew-resize" },
];

function SectionBox({
  section,
  isSelected,
  isDropTarget,
  gridConfig,
  stageSize,
  scale,
  setSelectedId,
  deleteSection,
  updateSection,
}) {
  const [loadedImage, setLoadedImage] = useState(null);
  const groupRef = useRef(null);
  const resizeStartRef = useRef(null);

  useEffect(() => {
    if (!section.imageUrl) {
      setLoadedImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = section.imageUrl;
    img.onload = () => setLoadedImage(img);
  }, [section.imageUrl]);

  const w = section.width;
  const h = section.height;
  const rotation = Number(section.rotation) || 0;
  const imageRotation = Number(section.imageRotation) || 0;
  const shapeType = section.shape || "rect";
  const sides = section.sides || (shapeType === "triangle" ? 3 : 4);
  const borderRadius =
    section.borderRadius !== undefined ? Number(section.borderRadius) : 12;
  const strokeWidth =
    section.strokeWidth !== undefined ? Number(section.strokeWidth) : 2;

  const boxOpacity =
    section.boxOpacity !== undefined ? Number(section.boxOpacity) : 0.65;
  const titleBgOpacity =
    section.titleBgOpacity !== undefined
      ? Number(section.titleBgOpacity)
      : 0.45;
  const titleStyle = section.titlePosition || "attached-bar"; // "attached-bar", "attached-tab", "inside-bar", "hidden"

  const fillColor = `rgba(18, 18, 21, ${boxOpacity})`;
  const titleBgColor = hexToRgba(section.color || "#00ffff", titleBgOpacity);

  const isPcGrid = gridConfig?.showGrid && gridConfig?.mode === "pc";
  const metrics = getDesktopGridMetrics(stageSize, gridConfig);
  const { cellW, cellH, desktopCols, desktopRows, rowGapTrim, rowTopOffset } =
    metrics;
  const appFit = calculateAppsFit(section, gridConfig, stageSize);

  const snapColX = (val) => {
    if (!gridConfig?.showGrid) return Math.round(val);
    if (isPcGrid) {
      const col = Math.max(0, Math.min(desktopCols, Math.round(val / cellW)));
      return Math.round(col * cellW);
    }
    const step = Math.max(5, Number(gridConfig.customGridSize) || 20);
    return Math.round(val / step) * step;
  };

  const snapRowTop = (val) => {
    if (!gridConfig?.showGrid) return Math.round(val);
    if (isPcGrid) {
      const row = Math.max(
        0,
        Math.min(desktopRows - 1, Math.round((val + rowTopOffset) / cellH))
      );
      return getRowTopY(row, metrics);
    }
    const step = Math.max(5, Number(gridConfig.customGridSize) || 20);
    return Math.round(val / step) * step;
  };

  // Start resizing from any of the 8 handles (N, S, E, W, NW, NE, SW, SE)
  const handleResizeStart = (e, dir) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    resizeStartRef.current = {
      dir,
      startX: section.x,
      startY: section.y,
      startW: section.width,
      startH: section.height,
      pointerX: pointer.x / scale,
      pointerY: pointer.y / scale,
    };

    const onWindowMouseMove = (moveEvt) => {
      if (!resizeStartRef.current || !stage) return;
      const stageRect = stage.container().getBoundingClientRect();
      const curX = (moveEvt.clientX - stageRect.left) / scale;
      const curY = (moveEvt.clientY - stageRect.top) / scale;

      const {
        dir: activeDir,
        startX,
        startY,
        startW,
        startH,
        pointerX,
        pointerY,
      } = resizeStartRef.current;

      const dx = curX - pointerX;
      const dy = curY - pointerY;

      const minW = isPcGrid ? Math.round(cellW) : 75;
      const minH = isPcGrid ? Math.round(cellH - rowGapTrim) : 75;

      let nextX = startX;
      let nextY = startY;
      let nextW = startW;
      let nextH = startH;

      const rightEdge = startX + startW;
      const bottomEdge = startY + startH;

      // East / Right side
      if (activeDir.includes("e")) {
        const rawRight = Math.min(
          stageSize.width,
          Math.max(startX + minW, rightEdge + dx)
        );
        const snappedRight = snapColX(rawRight);
        nextW = Math.max(minW, snappedRight - startX);
      }

      // West / Left side
      if (activeDir.includes("w")) {
        const rawLeft = Math.max(0, Math.min(rightEdge - minW, startX + dx));
        const snappedLeft = snapColX(rawLeft);
        nextX = Math.min(rightEdge - minW, snappedLeft);
        nextW = Math.max(minW, rightEdge - nextX);
      }

      // South / Bottom side
      if (activeDir.includes("s")) {
        if (isPcGrid) {
          const curRowStart = Math.max(
            0,
            Math.round((nextY + rowTopOffset) / cellH)
          );
          const rawSpan = Math.max(
            1,
            Math.min(
              desktopRows - curRowStart,
              Math.round((startH + dy + rowGapTrim) / cellH)
            )
          );
          nextH = getRowSpanHeight(curRowStart, rawSpan, metrics);
        } else {
          const rawBottom = Math.min(
            stageSize.height,
            Math.max(startY + minH, bottomEdge + dy)
          );
          nextH = Math.max(minH, snapRowTop(rawBottom) - startY);
        }
      }

      // North / Top side
      if (activeDir.includes("n")) {
        if (isPcGrid) {
          const origRowStart = Math.max(
            0,
            Math.round((startY + rowTopOffset) / cellH)
          );
          const origSpan = Math.max(
            1,
            Math.round((startH + rowGapTrim) / cellH)
          );
          const endRowExclusive = origRowStart + origSpan;

          const newRowStart = Math.max(
            0,
            Math.min(
              endRowExclusive - 1,
              Math.round((startY + dy + rowTopOffset) / cellH)
            )
          );
          const newSpan = Math.max(1, endRowExclusive - newRowStart);
          nextY = getRowTopY(newRowStart, metrics);
          nextH = getRowSpanHeight(newRowStart, newSpan, metrics);
        } else {
          const rawTop = Math.max(0, Math.min(bottomEdge - minH, startY + dy));
          const snappedTop = snapRowTop(rawTop);
          nextY = Math.min(bottomEdge - minH, snappedTop);
          nextH = Math.max(minH, bottomEdge - nextY);
        }
      }

      updateSection(section.id, {
        x: Math.round(nextX),
        y: Math.round(nextY),
        width: Math.round(nextW),
        height: Math.round(nextH),
      });
    };

    const onWindowMouseUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
  };

  // Interactive Mouse Rotation Handle
  const handleRotateMouseDown = (e) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();

    const onWindowMouseMove = (moveEvt) => {
      if (!stage) return;
      const stageRect = stage.container().getBoundingClientRect();
      const curX = (moveEvt.clientX - stageRect.left) / scale;
      const curY = (moveEvt.clientY - stageRect.top) / scale;

      const centerX = section.x + w / 2;
      const centerY = section.y + h / 2;

      let angleDeg =
        (Math.atan2(curY - centerY, curX - centerX) * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;

      if (moveEvt.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      } else {
        [0, 90, 180, 270, 360].forEach((cardinal) => {
          if (Math.abs(angleDeg - cardinal) < 4) {
            angleDeg = cardinal % 360;
          }
        });
      }

      updateSection(section.id, {
        rotation: Math.round(angleDeg) % 360,
      });
    };

    const onWindowMouseUp = () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
  };

  const headerH = 26;
  const activeBorderColor = isDropTarget ? "#22c55e" : section.color;
  const activeStrokeW = isDropTarget
    ? Math.max(4, strokeWidth + 2)
    : isSelected
    ? Math.max(2.5, strokeWidth)
    : strokeWidth;

  return (
    <Group
      ref={groupRef}
      x={section.x + w / 2}
      y={section.y + h / 2}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={rotation}
      draggable
      dragBoundFunc={(pos) => {
        const logicalLeft = pos.x / scale - w / 2;
        const logicalTop = pos.y / scale - h / 2;

        const maxLeft = Math.max(0, stageSize.width - w);
        const maxTop = Math.max(
          0,
          isPcGrid
            ? getRowTopY(desktopRows - appFit.rows, metrics)
            : stageSize.height - h
        );

        const clampedLeft = Math.max(0, Math.min(maxLeft, logicalLeft));
        const clampedTop = Math.max(0, Math.min(maxTop, logicalTop));

        const snappedLeft = snapColX(clampedLeft);
        const snappedTop = snapRowTop(clampedTop);

        return {
          x: (snappedLeft + w / 2) * scale,
          y: (snappedTop + h / 2) * scale,
        };
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        setSelectedId(section.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setSelectedId(section.id);
      }}
      onDragEnd={(e) => {
        if (e.target === groupRef.current) {
          const newLeft = e.target.x() - w / 2;
          const newTop = e.target.y() - h / 2;
          const snappedLeft = snapColX(newLeft);
          const snappedTop = snapRowTop(newTop);

          if (isPcGrid) {
            const newRowIndex = Math.max(
              0,
              Math.round((snappedTop + rowTopOffset) / cellH)
            );
            updateSection(section.id, {
              x: snappedLeft,
              y: getRowTopY(newRowIndex, metrics),
              height: getRowSpanHeight(newRowIndex, appFit.rows, metrics),
            });
          } else {
            updateSection(section.id, {
              x: snappedLeft,
              y: snappedTop,
            });
          }
        }
      }}
    >
      {/* MAIN CUSTOM SHAPE WITH CLIPPED IMAGE & FULLY SYNCED ATTACHED TOP TITLE BAR */}
      <Shape
        width={w}
        height={h}
        sceneFunc={(ctx, shapeNode) => {
          ctx.save();

          // 1. Draw Main Box Interior & Clipped Image
          drawShapePath(ctx, w, h, shapeType, sides, borderRadius);
          ctx.fillStyle = fillColor;
          ctx.fill();

          if (loadedImage) {
            ctx.save();
            ctx.clip();
            drawFittedImage(
              ctx._context,
              loadedImage,
              w,
              h,
              section.imageFit || "cover",
              section.imageScale || 1,
              section.imageOffsetX || 0,
              section.imageOffsetY || 0,
              imageRotation
            );
            ctx.restore();
          }

          // 2. If "inside-bar" title mode is selected, draw attached header flush along inside top of the shape
          if (titleStyle === "inside-bar" && section.title) {
            ctx.save();
            drawShapePath(ctx, w, h, shapeType, sides, borderRadius);
            ctx.clip();
            ctx.fillStyle = "#09090b";
            ctx.fillRect(0, 0, w, headerH);
            ctx.fillStyle = titleBgColor;
            ctx.fillRect(0, 0, w, headerH);
            ctx.beginPath();
            ctx.moveTo(0, headerH);
            ctx.lineTo(w, headerH);
            ctx.strokeStyle = activeBorderColor;
            ctx.lineWidth = activeStrokeW;
            ctx.stroke();
            ctx.restore();
          }

          // 3. Re-trace Main Shape Border
          drawShapePath(ctx, w, h, shapeType, sides, borderRadius);
          ctx.strokeStyle = activeBorderColor;
          ctx.lineWidth = activeStrokeW;
          ctx.stroke();

          // 4. If "attached-bar" or "attached-tab" (Default: Attached to Top of Box, Fully Synced!)
          if (
            (titleStyle === "attached-bar" ||
              titleStyle === "attached-tab" ||
              titleStyle === "top-center" ||
              titleStyle === "top-tab") &&
            section.title
          ) {
            const isFullWidthBar =
              titleStyle === "attached-bar" || titleStyle === "top-center";
            const tabW = isFullWidthBar
              ? w
              : Math.min(w, Math.max(96, section.title.length * 9 + 36));
            const tabX = isFullWidthBar ? 0 : (w - tabW) / 2;
            const tabR = Math.min(10, borderRadius, headerH / 2);

            ctx.beginPath();
            ctx.moveTo(tabX, 0);
            ctx.lineTo(tabX, -headerH + tabR);
            ctx.quadraticCurveTo(tabX, -headerH, tabX + tabR, -headerH);
            ctx.lineTo(tabX + tabW - tabR, -headerH);
            ctx.quadraticCurveTo(
              tabX + tabW,
              -headerH,
              tabX + tabW,
              -headerH + tabR
            );
            ctx.lineTo(tabX + tabW, 0);
            ctx.closePath();

            // Dark matte underlayer so wallpaper doesn't bleed through + user's adjustable border-color bg opacity
            ctx.fillStyle = "rgba(9, 9, 11, 0.75)";
            ctx.fill();
            ctx.fillStyle = titleBgColor;
            ctx.fill();

            ctx.strokeStyle = activeBorderColor;
            ctx.lineWidth = activeStrokeW;
            ctx.stroke();
          }

          ctx.restore();

          // Register hit region (including attached top header bar)
          ctx.beginPath();
          ctx.rect(0, -headerH, w, h + headerH);
          ctx.closePath();
          ctx.fillStrokeShape(shapeNode);
        }}
      />

      {/* ATTACHED TOP TITLE TEXT (Fully synced with top bar) */}
      {titleStyle !== "hidden" && section.title && (
        <Text
          text={section.title}
          x={0}
          y={titleStyle === "inside-bar" ? 6 : -headerH + 6}
          width={w}
          align="center"
          fontSize={13}
          fill="#ffffff"
          fontStyle="bold"
          listening={false}
        />
      )}

      {/* PC GRID APP CAPACITY BADGE (Hidden during export) */}
      {isPcGrid && (
        <Group
          name="ui-helper"
          x={8}
          y={h - 24}
          listening={false}
        >
          <Rect
            width={Math.min(w - 16, 168)}
            height={18}
            fill="#121215"
            stroke={section.color}
            strokeWidth={1}
            cornerRadius={4}
          />
          <Text
            text={`${appFit.cols} in row × ${appFit.rows} (${appFit.total} folders)`}
            x={6}
            y={3}
            fontSize={10}
            fill="#f4f4f5"
            fontStyle="bold"
          />
        </Group>
      )}

      {/* DELETE BUTTON ON BOX */}
      <Group
        name="delete-btn"
        x={w - 28}
        y={titleStyle === "inside-bar" ? 3 : -headerH + 3}
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          deleteSection(section.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          deleteSection(section.id);
        }}
      >
        <Rect
          width={20}
          height={20}
          fill="#18181b"
          stroke="#ef4444"
          strokeWidth={1}
          cornerRadius={4}
        />
        <Text
          text="✕"
          x={4.5}
          y={3}
          fontSize={12}
          fill="#ef4444"
          fontStyle="bold"
        />
      </Group>

      {/* ROTATION HANDLE (Shown when box is selected) */}
      {isSelected && (
        <Group name="resize-handle">
          <Line
            points={[w / 2, -headerH, w / 2, -headerH - 22]}
            stroke={section.color}
            strokeWidth={2}
          />
          <KonvaCircle
            x={w / 2}
            y={-headerH - 22}
            radius={8}
            fill="#121215"
            stroke={section.color}
            strokeWidth={2}
            onMouseDown={handleRotateMouseDown}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "grab";
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "default";
            }}
          />
        </Group>
      )}

      {/* 8-WAY RESIZE HANDLES (ALL 4 SIDES + ALL 4 CORNERS) */}
      {RESIZE_HANDLES.map((hItem) => {
        const hx = hItem.xFactor * w - 6;
        const hy = hItem.yFactor * h - 6;
        const isCorner = hItem.id.length === 2;

        return (
          <Rect
            key={hItem.id}
            name="resize-handle"
            x={hx}
            y={hy}
            width={12}
            height={12}
            fill={isCorner ? section.color : "#121215"}
            stroke={section.color}
            strokeWidth={2}
            cornerRadius={3}
            onMouseDown={(e) => handleResizeStart(e, hItem.id)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = hItem.cursor;
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "default";
            }}
          />
        );
      })}
    </Group>
  );
}

export default SectionBox;
