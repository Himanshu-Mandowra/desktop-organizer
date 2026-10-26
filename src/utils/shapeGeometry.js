// Custom 2D Canvas Path Generator for 4 Basic Shapes + N-sided Polygons with Rounded Corners (borderRadius)

/**
 * Computes vertices for a regular/stretched polygon inside [0..width, 0..height]
 */
export const getPolygonVertices = (width, height, sides) => {
  const n = Math.max(3, Math.min(20, Math.round(sides || 4)));
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;

  const points = [];

  if (n === 3) {
    return [
      { x: cx, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
  }

  const startAngle = n % 2 === 0 ? -Math.PI / 2 + Math.PI / n : -Math.PI / 2;

  for (let i = 0; i < n; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / n;
    points.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  return points.map((p) => ({
    x: ((p.x - minX) / spanX) * width,
    y: ((p.y - minY) / spanY) * height,
  }));
};

/**
 * Draws a closed path with rounded corners across a list of polygon vertices
 */
const traceRoundedPolygon = (ctx, points, radius) => {
  const len = points.length;
  if (len < 3) return;

  if (!radius || radius <= 0) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < len; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    return;
  }

  for (let i = 0; i < len; i++) {
    const prev = points[(i - 1 + len) % len];
    const curr = points[i];
    const next = points[(i + 1) % len];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;

    const maxR = Math.min(len1, len2) * 0.45;
    const r = Math.min(radius, maxR);

    const startX = curr.x + (v1x / len1) * r;
    const startY = curr.y + (v1y / len1) * r;
    const endX = curr.x + (v2x / len2) * r;
    const endY = curr.y + (v2y / len2) * r;

    if (i === 0) {
      ctx.moveTo(startX, startY);
    } else {
      ctx.lineTo(startX, startY);
    }

    ctx.quadraticCurveTo(curr.x, curr.y, endX, endY);
  }

  ctx.closePath();
};

/**
 * Traces the section shape path onto a 2D canvas or Konva context
 */
export const drawShapePath = (
  ctx,
  width,
  height,
  shape = "rect",
  sides = 4,
  borderRadius = 24
) => {
  ctx.beginPath();

  if (shape === "circle") {
    const rx = width / 2;
    const ry = height / 2;
    ctx.ellipse(rx, ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.closePath();
    return;
  }

  const effectiveSides =
    shape === "triangle"
      ? 3
      : shape === "rect" && (!sides || sides === 4)
      ? 4
      : Number(sides) || 4;

  if (shape === "rect" && effectiveSides === 4) {
    const r = Math.max(0, Math.min(borderRadius, width / 2, height / 2));
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.quadraticCurveTo(width, 0, width, r);
    ctx.lineTo(width, height - r);
    ctx.quadraticCurveTo(width, height, width - r, height);
    ctx.lineTo(r, height);
    ctx.quadraticCurveTo(0, height, 0, height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    return;
  }

  const vertices = getPolygonVertices(width, height, effectiveSides);
  traceRoundedPolygon(ctx, vertices, Math.max(0, Number(borderRadius) || 0));
};

/**
 * Draws an HTMLImageElement fitted inside [0..width, 0..height] with support for independent rotation
 */
export const drawFittedImage = (
  ctx,
  image,
  width,
  height,
  fit = "cover",
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  imageRotation = 0
) => {
  if (!image || !image.width || !image.height) return;

  const imgW = image.naturalWidth || image.width;
  const imgH = image.naturalHeight || image.height;

  // Swap aspect dimensions when rotated near 90° or 270° in cover mode so it still fills the box
  const rad = ((Number(imageRotation) || 0) * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));
  const boundW = width * absCos + height * absSin;
  const boundH = width * absSin + height * absCos;

  let drawW = boundW;
  let drawH = boundH;

  if (fit === "cover") {
    const ratio = Math.max(boundW / imgW, boundH / imgH);
    drawW = imgW * ratio;
    drawH = imgH * ratio;
  } else if (fit === "contain") {
    const ratio = Math.min(width / imgW, height / imgH);
    drawW = imgW * ratio;
    drawH = imgH * ratio;
  } else {
    drawW = width;
    drawH = height;
  }

  const zoom = Math.max(0.2, Number(scale) || 1);
  drawW *= zoom;
  drawH *= zoom;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(
    width / 2 + (Number(offsetX) || 0),
    height / 2 + (Number(offsetY) || 0)
  );
  if (rad !== 0) {
    ctx.rotate(rad);
  }
  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
};
