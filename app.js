const MAX_VALUE = 500;
const paletteValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const colors = [
  ["#f45b69", "#b93f4d"],
  ["#42b883", "#257d59"],
  ["#3f8efc", "#2660b4"],
  ["#ffd166", "#b88a24"],
  ["#8e6be8", "#5a42a8"],
  ["#ff8a3d", "#b95b20"],
  ["#1fb7b6", "#137b7a"],
  ["#ff73a6", "#bd4577"],
  ["#7bd65b", "#4a9a34"],
  ["#5b6ee1", "#34449e"],
];

const stage = document.querySelector("#stage");
const palette = document.querySelector("#palette");
const template = document.querySelector("#blockTemplate");
const clearButton = document.querySelector("#clearStage");
const lastMerge = document.querySelector("#lastMerge");
const trashZone = document.querySelector("#trashZone");
const playHint = document.querySelector("#playHint");
const coarsePointer = window.matchMedia("(pointer: coarse)");

let nextId = 1;
let activeDrag = null;
let activeSlice = null;

function layoutFor(value) {
  if (value <= 3) return { cols: 1, rows: value };
  if (value === 4) return { cols: 2, rows: 2 };
  if (value <= 6) return { cols: 2, rows: Math.ceil(value / 2) };
  if (value <= 9) return { cols: 3, rows: Math.ceil(value / 3) };
  if (value <= 25) return { cols: 5, rows: Math.ceil(value / 5) };
  if (value <= 100) return { cols: 10, rows: Math.ceil(value / 10) };
  if (value <= 200) return { cols: 20, rows: Math.ceil(value / 20) };
  return { cols: 25, rows: Math.ceil(value / 25) };
}

function baseCellSizeFor(value) {
  if (value <= 9) return "4.1rem";
  if (value <= 20) return "3rem";
  if (value <= 50) return "2.45rem";
  if (value <= 100) return "1.95rem";
  if (value <= 200) return "1.38rem";
  return "0.95rem";
}

function cellSizeFor(value, cols) {
  const baseSize = baseCellSizeFor(value);

  if (cols < 10) return baseSize;
  return `min(${baseSize}, calc((100vw - 2rem) / ${cols}))`;
}

function colorForDigit(digit) {
  return colors[(digit - 1 + colors.length) % colors.length][0];
}

function createBlock(value, mode = "stage") {
  const block = template.content.firstElementChild.cloneNode(true);
  const [base, dark] = colors[(value - 1) % colors.length];
  const { cols, rows } = layoutFor(value);
  const grid = block.querySelector(".block-grid");
  const hundredsDigit = Math.floor(value / 100);
  const tensDigit = Math.floor((value % 100) / 10);
  const onesDigit = value % 10;
  const hundredsCount = Math.floor(value / 100) * 100;
  const tensCount = Math.floor((value % 100) / 10) * 10;

  block.dataset.value = String(value);
  block.dataset.id = String(nextId++);
  block.style.setProperty("--block-color", base);
  block.style.setProperty("--block-dark", dark);
  block.style.setProperty("--hundreds-color", colorForDigit(hundredsDigit || 1));
  block.style.setProperty("--tens-color", colorForDigit(tensDigit || 1));
  block.style.setProperty("--ones-color", colorForDigit(onesDigit || 10));
  block.style.setProperty("--cols", String(cols));
  block.style.setProperty("--rows", String(rows));
  block.style.setProperty("--cell-size", cellSizeFor(value, cols));
  grid.replaceChildren(
    ...Array.from({ length: value }, (_, index) => {
      const cell = document.createElement("span");
      if (index < hundredsCount) {
        cell.className = "cell hundred-cell";
      } else if (index < hundredsCount + tensCount) {
        cell.className = "cell ten-cell";
      } else {
        cell.className = "cell one-cell";
      }
      return cell;
    }),
  );
  block.querySelector(".number-label").textContent = value;
  block.setAttribute("aria-label", `${value} 숫자 친구`);

  if (mode === "palette") {
    block.addEventListener("pointerdown", rememberPaletteTouchStart);
    block.addEventListener("click", addFromPalette);
    if (!coarsePointer.matches) {
      block.addEventListener("pointerdown", startFromPalette);
    }
  } else {
    block.addEventListener("pointerdown", startDrag);
  }

  return block;
}

function stagePoint(event) {
  const rect = stage.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function clampBlock(block, x, y) {
  const maxX = Math.max(0, stage.clientWidth - block.offsetWidth);
  const maxY = Math.max(0, stage.clientHeight - block.offsetHeight);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

function positionBlock(block, x, y) {
  const next = clampBlock(block, x, y);
  block.style.left = `${next.x}px`;
  block.style.top = `${next.y}px`;
}

function updatePlayHint() {
  const hasBlocks = stage.querySelectorAll(".number-block").length > 0;

  playHint.classList.toggle("is-hidden", hasBlocks);
}

function rememberPaletteTouchStart(event) {
  event.currentTarget.dataset.startX = String(event.clientX);
  event.currentTarget.dataset.startY = String(event.clientY);
}

function addFromPalette(event) {
  if (event.currentTarget.dataset.wasDragged === "true") {
    event.currentTarget.dataset.wasDragged = "false";
    return;
  }

  const startX = Number(event.currentTarget.dataset.startX || event.clientX);
  const startY = Number(event.currentTarget.dataset.startY || event.clientY);
  const moved = Math.hypot(event.clientX - startX, event.clientY - startY);

  if (moved > 12) return;

  const value = Number(event.currentTarget.dataset.value);
  const block = createBlock(value);

  stage.append(block);
  stage.classList.add("has-blocks");
  updatePlayHint();
  positionBlock(
    block,
    stage.clientWidth / 2 - block.offsetWidth / 2,
    stage.clientHeight * 0.72 - block.offsetHeight / 2,
  );
}

function startFromPalette(event) {
  event.currentTarget.dataset.wasDragged = "true";
  const value = Number(event.currentTarget.dataset.value);
  const block = createBlock(value);
  const point = stagePoint(event);

  stage.append(block);
  stage.classList.add("has-blocks");
  updatePlayHint();
  positionBlock(block, point.x - block.offsetWidth / 2, point.y - block.offsetHeight / 2);
  beginDrag(event, block, { deletable: false });
}

function startDrag(event) {
  if (activeSlice) {
    event.preventDefault();
    return;
  }

  beginDrag(event, event.currentTarget, { deletable: true });
}

function beginDrag(event, block, options = {}) {
  event.preventDefault();
  const point = stagePoint(event);
  const left = Number.parseFloat(block.style.left || "0");
  const top = Number.parseFloat(block.style.top || "0");

  activeDrag = {
    block,
    deletable: options.deletable ?? true,
    offsetX: point.x - left,
    offsetY: point.y - top,
    pointerX: event.clientX,
    pointerY: event.clientY,
  };

  if (activeDrag.deletable) {
    trashZone.classList.add("is-visible");
  }

  block.classList.add("dragging");
  block.setPointerCapture(event.pointerId);
  block.addEventListener("pointermove", onPointerMove);
  block.addEventListener("pointerup", onPointerUp);
  block.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(event) {
  if (!activeDrag) return;

  const point = stagePoint(event);
  activeDrag.pointerX = event.clientX;
  activeDrag.pointerY = event.clientY;
  positionBlock(
    activeDrag.block,
    point.x - activeDrag.offsetX,
    point.y - activeDrag.offsetY,
  );
  updateDeleteFeedback(activeDrag.block, activeDrag);
}

function onPointerUp(event) {
  if (!activeDrag) return;

  const block = activeDrag.block;
  const dragState = activeDrag;
  block.classList.remove("dragging");
  block.releasePointerCapture(event.pointerId);
  block.removeEventListener("pointermove", onPointerMove);
  block.removeEventListener("pointerup", onPointerUp);
  block.removeEventListener("pointercancel", onPointerUp);
  activeDrag = null;
  trashZone.classList.remove("is-visible", "is-hot");

  if (isDeleteDrop(block, dragState)) {
    deleteBlock(block);
    return;
  }

  mergeIfOverlapping(block);
}

function isDeleteDrop(block, dragState) {
  if (!dragState.deletable) return false;

  const blockRect = block.getBoundingClientRect();
  const trashRect = trashZone.getBoundingClientRect();
  const paletteRect = document.querySelector(".palette-panel").getBoundingClientRect();
  const blockCenter = {
    x: blockRect.left + blockRect.width / 2,
    y: blockRect.top + blockRect.height / 2,
  };
  const pointer = {
    x: dragState.pointerX,
    y: dragState.pointerY,
  };

  return (
    pointInRect(blockCenter, trashRect) ||
    pointInRect(pointer, trashRect) ||
    pointInRect(pointer, paletteRect)
  );
}

function updateDeleteFeedback(block, dragState) {
  if (!dragState.deletable) return;

  trashZone.classList.toggle("is-hot", isDeleteDrop(block, dragState));
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

function deleteBlock(block) {
  const value = Number(block.dataset.value);

  block.remove();
  stage.classList.toggle("has-blocks", stage.querySelectorAll(".number-block").length > 0);
  updatePlayHint();
  lastMerge.textContent = `${value} 삭제`;
}

function startSlice(event) {
  if (!activeSlice && event.target !== stage) return;

  const point = stagePoint(event);
  if (!activeSlice) {
    activeSlice = {
      pointers: new Map(),
      endedPointers: new Set(),
      maxPointerCount: 0,
      startedAt: performance.now(),
    };

    stage.addEventListener("pointermove", onSliceMove);
    stage.addEventListener("pointerup", onSliceEnd);
    stage.addEventListener("pointercancel", onSliceEnd);
  }

  activeSlice.pointers.set(event.pointerId, {
    startX: point.x,
    startY: point.y,
    lastX: point.x,
    lastY: point.y,
  });
  activeSlice.maxPointerCount = Math.max(activeSlice.maxPointerCount, activeSlice.pointers.size);

  stage.setPointerCapture(event.pointerId);
}

function onSliceMove(event) {
  if (!activeSlice) return;

  const pointer = activeSlice.pointers.get(event.pointerId);
  if (!pointer) return;

  const point = stagePoint(event);
  pointer.lastX = point.x;
  pointer.lastY = point.y;
}

function onSliceEnd(event) {
  if (!activeSlice) return;
  if (!activeSlice.pointers.has(event.pointerId)) return;

  activeSlice.endedPointers.add(event.pointerId);
  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
  }

  if (activeSlice.endedPointers.size < activeSlice.pointers.size) return;

  const sliceState = {
    paths: [...activeSlice.pointers.values()],
    partCount: Math.min(activeSlice.maxPointerCount + 1, MAX_VALUE),
    startedAt: activeSlice.startedAt,
  };

  activeSlice = null;
  stage.removeEventListener("pointermove", onSliceMove);
  stage.removeEventListener("pointerup", onSliceEnd);
  stage.removeEventListener("pointercancel", onSliceEnd);
  trySliceStageBlock(sliceState);
}

function isSliceGesture(sliceState) {
  const longestDistance = Math.max(
    ...sliceState.paths.map((path) => Math.hypot(path.lastX - path.startX, path.lastY - path.startY)),
  );
  const duration = performance.now() - sliceState.startedAt;

  return longestDistance > 85 && duration < 900;
}

function lineIntersectsRect(path, rect) {
  const minX = Math.min(path.startX, path.lastX);
  const maxX = Math.max(path.startX, path.lastX);
  const minY = Math.min(path.startY, path.lastY);
  const maxY = Math.max(path.startY, path.lastY);

  if (maxX < rect.left || minX > rect.right || maxY < rect.top || minY > rect.bottom) {
    return false;
  }

  for (let index = 0; index <= 18; index += 1) {
    const t = index / 18;
    const x = path.startX + (path.lastX - path.startX) * t;
    const y = path.startY + (path.lastY - path.startY) * t;

    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return true;
    }
  }

  return false;
}

function splitValues(value, requestedPartCount) {
  const partCount = Math.min(value, requestedPartCount);
  const baseValue = Math.floor(value / partCount);
  const remainder = value % partCount;

  return Array.from({ length: partCount }, (_, index) => baseValue + (index < remainder ? 1 : 0));
}

function splitBlock(block, sliceState) {
  const value = Number(block.dataset.value);
  if (value <= 1) return false;

  const left = Number.parseFloat(block.style.left || "0");
  const top = Number.parseFloat(block.style.top || "0");
  const values = splitValues(value, sliceState.partCount);
  const blocks = values.map((partValue) => createBlock(partValue));
  const gap = 12;

  block.remove();
  stage.append(...blocks);
  updatePlayHint();

  let nextX = left;
  let nextY = top;
  let rowHeight = 0;
  blocks.forEach((partBlock) => {
    if (nextX > left && nextX + partBlock.offsetWidth > stage.clientWidth) {
      nextX = left;
      nextY += rowHeight + gap;
      rowHeight = 0;
    }

    positionBlock(partBlock, nextX, nextY);
    nextX += partBlock.offsetWidth + gap;
    rowHeight = Math.max(rowHeight, partBlock.offsetHeight);
  });

  blocks.forEach((partBlock) => partBlock.classList.add("merge-pop"));
  lastMerge.textContent = `${value} = ${values.join(" + ")}`;
  setTimeout(() => {
    blocks.forEach((partBlock) => partBlock.classList.remove("merge-pop"));
  }, 280);
  return true;
}

function trySliceStageBlock(sliceState) {
  if (!isSliceGesture(sliceState)) return false;

  const target = [...stage.querySelectorAll(".number-block")].find((block) => {
    const left = Number.parseFloat(block.style.left || "0");
    const top = Number.parseFloat(block.style.top || "0");

    const rect = {
      left,
      top,
      right: left + block.offsetWidth,
      bottom: top + block.offsetHeight,
    };

    return sliceState.paths.some((path) => lineIntersectsRect(path, rect));
  });

  if (!target) return false;
  return splitBlock(target, sliceState);
}

function overlapRatio(a, b) {
  const first = a.getBoundingClientRect();
  const second = b.getBoundingClientRect();
  const left = Math.max(first.left, second.left);
  const right = Math.min(first.right, second.right);
  const top = Math.max(first.top, second.top);
  const bottom = Math.min(first.bottom, second.bottom);

  if (right <= left || bottom <= top) return 0;

  const overlapArea = (right - left) * (bottom - top);
  const smallerArea = Math.min(first.width * first.height, second.width * second.height);
  return overlapArea / smallerArea;
}

function rectCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function pointInsideRect(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

function expandRect(rect, amount) {
  return {
    left: rect.left - amount,
    right: rect.right + amount,
    top: rect.top - amount,
    bottom: rect.bottom + amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  };
}

function isMergeCandidate(a, b) {
  const first = a.getBoundingClientRect();
  const second = b.getBoundingClientRect();
  const relaxedFirst = expandRect(first, 18);
  const relaxedSecond = expandRect(second, 18);
  const firstCenter = rectCenter(first);
  const secondCenter = rectCenter(second);

  return (
    overlapRatio(a, b) > 0.18 ||
    pointInsideRect(firstCenter, relaxedSecond) ||
    pointInsideRect(secondCenter, relaxedFirst)
  );
}

function mergeIfOverlapping(block) {
  const candidates = [...stage.querySelectorAll(".number-block")].filter((item) => item !== block);
  const target = candidates
    .filter((item) => isMergeCandidate(block, item))
    .sort((a, b) => overlapRatio(block, b) - overlapRatio(block, a))[0];

  if (!target) return;

  const a = Number(block.dataset.value);
  const b = Number(target.dataset.value);
  const sum = a + b;

  if (sum > MAX_VALUE) {
    lastMerge.textContent = `${a} + ${b}는 ${MAX_VALUE}보다 커요`;
    return;
  }

  const blockRect = block.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const centerX = (blockRect.left + blockRect.width / 2 + targetRect.left + targetRect.width / 2) / 2;
  const centerY = (blockRect.top + blockRect.height / 2 + targetRect.top + targetRect.height / 2) / 2;
  const merged = createBlock(sum);

  block.remove();
  target.remove();
  stage.append(merged);
  updatePlayHint();
  positionBlock(
    merged,
    centerX - stageRect.left - merged.offsetWidth / 2,
    centerY - stageRect.top - merged.offsetHeight / 2,
  );
  merged.classList.add("merge-pop");
  lastMerge.textContent = `${a} + ${b} = ${sum}`;

  setTimeout(() => merged.classList.remove("merge-pop"), 280);
}

function clearStage() {
  stage.querySelectorAll(".number-block").forEach((block) => block.remove());
  stage.classList.remove("has-blocks");
  updatePlayHint();
  lastMerge.textContent = "준비 완료";
}

function seedPalette() {
  paletteValues.forEach((value) => palette.append(createBlock(value, "palette")));
}

clearButton.addEventListener("click", clearStage);
stage.addEventListener("pointerdown", startSlice);
seedPalette();
