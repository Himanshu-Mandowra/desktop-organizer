// Layer ordering helpers.
// The `sections` array order IS the stacking order: index 0 = bottom layer, last index = top layer.

const toSet = (ids) => new Set(ids);

export const bringToFront = (list, ids) => {
  const sel = toSet(ids);
  return [...list.filter((s) => !sel.has(s.id)), ...list.filter((s) => sel.has(s.id))];
};

export const sendToBack = (list, ids) => {
  const sel = toSet(ids);
  return [...list.filter((s) => sel.has(s.id)), ...list.filter((s) => !sel.has(s.id))];
};

// Move the selected layers up one step (swap each with the unselected layer above it)
export const bringForward = (list, ids) => {
  const sel = toSet(ids);
  const out = [...list];
  for (let i = out.length - 2; i >= 0; i--) {
    if (sel.has(out[i].id) && !sel.has(out[i + 1].id)) {
      [out[i], out[i + 1]] = [out[i + 1], out[i]];
    }
  }
  return out;
};

// Move the selected layers down one step
export const sendBackward = (list, ids) => {
  const sel = toSet(ids);
  const out = [...list];
  for (let i = 1; i < out.length; i++) {
    if (sel.has(out[i].id) && !sel.has(out[i - 1].id)) {
      [out[i], out[i - 1]] = [out[i - 1], out[i]];
    }
  }
  return out;
};

// Drag-and-drop in the layer list: place `dragId` at the position currently held by `targetId`
export const moveLayerTo = (list, dragId, targetId) => {
  if (dragId === targetId) return list;
  const from = list.findIndex((s) => s.id === dragId);
  const to = list.findIndex((s) => s.id === targetId);
  if (from < 0 || to < 0) return list;
  const out = [...list];
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
};
