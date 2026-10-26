// Pixel-Perfect Windows 10/11 Desktop Folder Grid Geometry
// Verified directly against actual Windows desktop screenshot measurements:
// - Horizontal column pitch (cellW): 75px (in Windows logical screen pixels)
// - Vertical row pitch (cellH): 87px (in Windows logical screen pixels)
// - Within each 87px row (r * 87):
//   - Folder icon top is at: r * 87 + 4px
//   - 2-line shortcut text bottom is at: r * 87 + 57px
//   - Inter-row vertical gap is: 30px (from r * 87 + 57 to (r + 1) * 87)
// - Therefore, a box spanning `spanRows` starting at `rowIndex` has:
//   - Top border at: Math.max(0, rowIndex * cellH - 6)  (10px above folder icon)
//   - Height: spanRows * cellH - 12                     (12px below last row's 2-line text)

export const PC_GRID_PRESETS = [
  {
    id: "standard",
    label: "Windows Medium (75×87)",
    baseCellW: 75,
    baseCellH: 87,
  },
  {
    id: "compact",
    label: "Windows Small (68×75)",
    baseCellW: 68,
    baseCellH: 75,
  },
  {
    id: "large",
    label: "Windows Large (96×106)",
    baseCellW: 96,
    baseCellH: 106,
  },
];

/**
 * Converts a hex color (#rrggbb) and opacity (0..1) into an rgba() string
 */
export const hexToRgba = (hex = "#00ffff", alpha = 0.45) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16
  );
  if (Number.isNaN(bigint)) {
    return `rgba(0, 255, 255, ${alpha})`;
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, Number(alpha)))})`;
};

/**
 * Computes exact desktop folder slot metrics for the current canvas stageSize
 */
export const getDesktopGridMetrics = (stageSize, gridConfig) => {
  const screenW = Math.max(200, Number(stageSize?.width) || 1920);
  const screenH = Math.max(200, Number(stageSize?.height) || 1080);

  // Scale proportional to the user's native logical screen resolution if stageSize was changed
  const nativeW =
    typeof window !== "undefined" && window.screen?.width
      ? window.screen.width
      : screenW;
  const nativeH =
    typeof window !== "undefined" && window.screen?.height
      ? window.screen.height
      : screenH;

  const scaleX = screenW / nativeW;
  const scaleY = screenH / nativeH;

  const baseCellW = Math.max(48, Number(gridConfig?.pcCellWidth) || 75);
  const baseCellH = Math.max(60, Number(gridConfig?.pcCellHeight) || 87);

  const cellW = baseCellW * scaleX;
  const cellH = baseCellH * scaleY;

  // Windows taskbar is 48px in standard logical pixels
  const taskbarHeight = Math.round(48 * scaleY);
  const usableHeight = screenH - taskbarHeight;

  const desktopCols = Math.max(1, Math.floor(screenW / cellW));
  const desktopRows = Math.max(1, Math.floor(usableHeight / cellH));

  // Trim bottom inter-row dead gap so the box bottom hugs the last folder's text with 12px margin
  const rowGapTrim = Math.round(12 * scaleY);
  const rowTopOffset = Math.round(6 * scaleY);

  return {
    screenW,
    screenH,
    taskbarHeight,
    usableHeight,
    desktopCols,
    desktopRows,
    cellW,
    cellH,
    baseCellW,
    baseCellH,
    rowGapTrim,
    rowTopOffset,
    scaleX,
    scaleY,
  };
};

/**
 * Returns the exact Y coordinate for the top border of a box starting at `rowIndex`
 */
export const getRowTopY = (rowIndex, metrics) => {
  const { cellH, rowTopOffset } = metrics;
  if (rowIndex <= 0) return 0;
  return Math.round(rowIndex * cellH - rowTopOffset);
};

/**
 * Returns the exact Height for a box spanning `spanRows` starting at `rowIndex`
 */
export const getRowSpanHeight = (rowIndex, spanRows, metrics) => {
  const { cellH, rowGapTrim, rowTopOffset } = metrics;
  const topY = getRowTopY(rowIndex, metrics);
  const lastRowEnd = (rowIndex + spanRows) * cellH - rowGapTrim - rowTopOffset;
  return Math.max(Math.round(cellH - rowGapTrim), Math.round(lastRowEnd - topY));
};

/**
 * Calculates how many desktop folder slots fit inside a section box
 */
export const calculateAppsFit = (section, gridConfig, stageSize) => {
  const metrics = getDesktopGridMetrics(stageSize, gridConfig);
  const { cellW, cellH, rowGapTrim } = metrics;

  const cols = Math.max(1, Math.round((section?.width || cellW) / cellW));
  const rows = Math.max(
    1,
    Math.round(((section?.height || cellH) + rowGapTrim) / cellH)
  );

  return {
    cols,
    rows,
    total: cols * rows,
    cellW: Math.round(cellW),
    cellH: Math.round(cellH),
    rawCellW: cellW,
    rawCellH: cellH,
  };
};

/**
 * Returns the exact { width, height } on folder borders to fit `cols` folders in a row and `rows` vertically
 */
export const getBoxSizeForAppGrid = (
  cols,
  rows,
  gridConfig,
  stageSize,
  currentY = 81
) => {
  const metrics = getDesktopGridMetrics(stageSize, gridConfig);
  const { cellW, cellH } = metrics;
  const rowIndex = Math.max(0, Math.round(currentY / cellH));

  return {
    width: Math.round(cols * cellW),
    height: getRowSpanHeight(rowIndex, rows, metrics),
  };
};

/**
 * Snaps a box's { x, y, width, height } strictly onto folder slot borders
 */
export const snapBoxToFolderGrid = (box, gridConfig, stageSize) => {
  const metrics = getDesktopGridMetrics(stageSize, gridConfig);
  const { cellW, cellH, desktopCols, desktopRows, rowGapTrim, rowTopOffset } =
    metrics;

  const colIndex = Math.max(
    0,
    Math.min(desktopCols - 1, Math.round((box.x || 0) / cellW))
  );
  const rowIndex = Math.max(
    0,
    Math.min(
      desktopRows - 1,
      Math.round(((box.y || 0) + rowTopOffset) / cellH)
    )
  );

  const spanCols = Math.max(
    1,
    Math.min(desktopCols - colIndex, Math.round((box.width || cellW) / cellW))
  );
  const spanRows = Math.max(
    1,
    Math.min(
      desktopRows - rowIndex,
      Math.round(((box.height || cellH) + rowGapTrim) / cellH)
    )
  );

  return {
    x: Math.round(colIndex * cellW),
    y: getRowTopY(rowIndex, metrics),
    width: Math.round(spanCols * cellW),
    height: getRowSpanHeight(rowIndex, spanRows, metrics),
  };
};
