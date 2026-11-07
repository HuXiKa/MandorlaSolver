import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { applyMove, getMoveDirection, getMoveSide, isSolved, LEFT_CYCLES, MAX_DEPTH, RIGHT_CYCLES } from "./solver-core.mjs";

function readSavedTheme() {
  try {
    return localStorage.getItem("mandorla-theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

const initialTheme = readSavedTheme();
document.documentElement.dataset.theme = initialTheme;

const COLORS = ["black", "red", "yellow"];
const EXPECTED_COUNTS = { black: 7, red: 5, yellow: 7 };
const SCRAMBLE_STEPS = 50;
const SOLUTION_TURN_DURATION = 650;
const SOLUTION_STEP_PAUSE = 500;
const COLOR_SCHEMES = [
  {
    name: "Red, white, green",
    labels: { black: "Red", red: "White", yellow: "Green" },
    colors: {
      black: { base: 0xe92735, groove: 0x9e1725, highlight: 0xffaab0 },
      red: { base: 0xf1f1ec, groove: 0x999e9b, highlight: 0xffffff },
      yellow: { base: 0x35b847, groove: 0x167b32, highlight: 0x9bf0a8 }
    }
  },
  {
    name: "Green, yellow, blue",
    labels: { black: "Green", red: "Yellow", yellow: "Blue" },
    colors: {
      black: { base: 0x28a84b, groove: 0x14753a, highlight: 0x9ae5ae },
      red: { base: 0xffdf00, groove: 0xaa8500, highlight: 0xfff39b },
      yellow: { base: 0x078fdf, groove: 0x075f9c, highlight: 0x88d4ff }
    }
  },
  {
    name: "Yellow, orange, blue",
    labels: { black: "Yellow", red: "Orange", yellow: "Blue" },
    colors: {
      black: { base: 0xf5d900, groove: 0xa88b00, highlight: 0xfff39a },
      red: { base: 0xff8500, groove: 0xc65300, highlight: 0xffc07a },
      yellow: { base: 0x087fe0, groove: 0x084f99, highlight: 0x8dcaff }
    }
  },
  {
    name: "Black, red, yellow",
    labels: { black: "Black", red: "Red", yellow: "Yellow" },
    colors: {
      black: { base: 0x121a27, groove: 0x506075, highlight: 0xa2b4c7 },
      red: { base: 0xea2637, groove: 0xa5182a, highlight: 0xffc7c1 },
      yellow: { base: 0xffd600, groove: 0xa77b00, highlight: 0xfff09a }
    }
  }
];
const LABELS = Object.fromEntries(Array.from({ length: 19 }, (_, index) => {
  const position = index + 1;
  return [position, position < 10 ? String(position) : String.fromCharCode(55 + position)];
}));
const CIRCLE_OUTLINES = [
  {
    center: { x: 330, y: 335 },
    pieces: [
      { position: 2, angle: 0 },
      { position: 12, angle: 60 },
      { position: 14, angle: 120 },
      { position: 7, angle: 180 },
      { position: 8, angle: 240 },
      { position: 1, angle: 300 }
    ]
  },
  {
    center: { x: 670, y: 335 },
    pieces: [
      { position: 3, angle: 0 },
      { position: 4, angle: 60 },
      { position: 5, angle: 120 },
      { position: 6, angle: 180 },
      { position: 13, angle: 240 },
      { position: 11, angle: 300 }
    ]
  }
];
const CIRCLE_RADIUS = 288;
const OUTLINE_OVAL = { rx: 140, ry: 42 };
const FOCUS_DIAMOND = { position: 15, x: 251, y: 191, rx: 135, ry: 220, angle: 60 };
const H_DIAMOND = { ...FOCUS_DIAMOND, position: 17, y: 479, angle: 300 };
const G_DIAMOND = { ...FOCUS_DIAMOND, position: 16, x: 749, angle: 120 };
const I_DIAMOND = { ...FOCUS_DIAMOND, position: 18, x: 749, y: 479, angle: 240 };
const J_DIAMOND = { ...FOCUS_DIAMOND, position: 19, x: 500, y: 335, angle: 0 };
const DIAMOND_PIECES = [FOCUS_DIAMOND, G_DIAMOND, H_DIAMOND, I_DIAMOND, J_DIAMOND];
const INTERIOR_OVALS = [
  { position: 9, x: 175, y: 335 },
  { position: 10, x: 825, y: 335 }
];

const pieces = new Map();
const slotTransforms = new Map();
const colorChoices = [...document.querySelectorAll(".color-choice")];
const schemePicker = document.querySelector("#scheme-picker");
const paintInfo = document.querySelector("#paint-info");
const paintHelp = document.querySelector("#paint-help");
const depthInfo = document.querySelector("#depth-info");
const maxDepthInput = document.querySelector("#max-depth");
maxDepthInput.max = String(MAX_DEPTH);
const boardOptions = document.querySelector("#board-options");
const searchOptions = document.querySelector("#search-options");
const mobileOptionsQuery = window.matchMedia("(max-width: 520px)");
const themeToggle = document.querySelector("#theme-toggle");
const board = document.querySelector("#board");
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-500, 500, 335, -335, 1, 3000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pieceMeshes = [];
let activePosition = 19;
let hoveredPosition = null;
const stateIndicator = document.querySelector("#state-indicator");
const compositionIndicator = document.querySelector("#composition-indicator");
const compositionText = document.querySelector("#composition-text");
const status = document.querySelector("#search-status");
const statusText = document.querySelector("#status-text");
const solveButton = document.querySelector("#solve-button");
const solveLabel = document.querySelector("#solve-label");
const cancelButton = document.querySelector("#cancel-button");
const route = document.querySelector("#route");
const emptyRoute = document.querySelector("#empty-route");
const moveList = document.querySelector("#move-list");
const stepSlider = document.querySelector("#step-slider");
const stepCount = document.querySelector("#step-count");
const routeLength = document.querySelector("#route-length");
const stepCaption = document.querySelector("#step-caption");
const previousButton = document.querySelector("#previous-step");
const nextButton = document.querySelector("#next-step");
const workspace = document.querySelector(".workspace");

let state = createSolvedState();
let selectedColor = "black";
let selectedScheme = 3;
let worker = null;
let solution = null;
let solutionStates = [];
let currentStep = 0;
let isAnimatingTurn = false;
let isPlayingSolution = false;
let playbackTimer = null;

function syncOptionDisclosures(query = mobileOptionsQuery) {
  boardOptions.open = true;
  searchOptions.open = !query.matches;
}
syncOptionDisclosures();
mobileOptionsQuery.addEventListener("change", syncOptionDisclosures);

function makePieceShape(position, scale = 1) {
  if (DIAMOND_PIECES.some((diamond) => diamond.position === position)) {
    const width = FOCUS_DIAMOND.rx * scale;
    const height = FOCUS_DIAMOND.ry * scale;
    const inset = 0.20;
    const shape = new THREE.Shape();
    shape.moveTo(0, -height);
    shape.quadraticCurveTo(width * inset, -height * inset, width, 0);
    shape.quadraticCurveTo(width * inset, height * inset, 0, height);
    shape.quadraticCurveTo(-width * inset, height * inset, -width, 0);
    shape.quadraticCurveTo(-width * inset, -height * inset, 0, -height);
    shape.closePath();
    return shape;
  }
  const { rx, ry } = OUTLINE_OVAL;
  const shape = new THREE.Shape();
  shape.moveTo(-rx * scale, 0);
  shape.quadraticCurveTo(0, ry * scale * 1.28, rx * scale, 0);
  shape.quadraticCurveTo(0, -ry * scale * 1.28, -rx * scale, 0);
  shape.closePath();
  return shape;
}

function makeContour(shape, z, material) {
  const points = shape.getPoints(96).map((point) => new THREE.Vector3(point.x, point.y, z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.LineLoop(geometry, material);
  return line;
}

function createPiece(position, x, y, angle, depth) {
  const group = new THREE.Group();
  group.position.set(x - 500, 335 - y, depth);
  group.rotation.z = THREE.MathUtils.degToRad(-angle);
  group.userData.position = position;
  slotTransforms.set(position, { position: group.position.clone(), rotationZ: group.rotation.z });

  const shape = makePieceShape(position);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 18,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 8,
    bevelThickness: 7,
    curveSegments: 48
  });
  geometry.computeVertexNormals();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.02,
    clearcoat: 0.75,
    clearcoatRoughness: 0.16
  });
  const surface = new THREE.Mesh(geometry, material);
  surface.castShadow = true;
  surface.receiveShadow = true;
  surface.userData.position = position;
  group.add(surface);

  const grooveMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, depthTest: true, depthWrite: true });
  const highlightMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1, depthTest: true, depthWrite: true });
  group.add(makeContour(makePieceShape(position, 0.78), 25.12, grooveMaterial));
  group.add(makeContour(makePieceShape(position, 0.81), 25.18, highlightMaterial));
  group.userData.material = material;
  group.userData.grooveMaterial = grooveMaterial;
  group.userData.highlightMaterial = highlightMaterial;
  group.userData.surface = surface;
  return group;
}

function initializeBoard() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "board-canvas";
  board.append(renderer.domElement);

  scene.background = new THREE.Color(document.documentElement.dataset.theme === "dark" ? 0x1b2220 : 0xf2f3ef);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7d817c, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
  keyLight.position.set(-420, 620, 900);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -650;
  keyLight.shadow.camera.right = 650;
  keyLight.shadow.camera.top = 500;
  keyLight.shadow.camera.bottom = -500;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xe4efff, 1.25);
  fillLight.position.set(550, -300, 600);
  scene.add(fillLight);

  let drawIndex = 0;
  for (const circle of CIRCLE_OUTLINES) {
    for (const { position, angle } of circle.pieces) {
      const radians = THREE.MathUtils.degToRad(angle);
      const x = circle.center.x + Math.sin(radians) * CIRCLE_RADIUS;
      const y = circle.center.y - Math.cos(radians) * CIRCLE_RADIUS;
      const piece = createPiece(position, x, y, angle, drawIndex * 0.05);
      piece.traverse((object) => {
        if (object.isMesh && object.userData.position === undefined) object.userData.position = position;
      });
      pieces.set(position, piece);
      pieceMeshes.push(piece.userData.surface);
      scene.add(piece);
      drawIndex += 1;
    }
  }
  for (const { position, x, y } of INTERIOR_OVALS) {
    const piece = createPiece(position, x, y, 0, drawIndex * 0.05);
    piece.traverse((object) => {
      if (object.isMesh && object.userData.position === undefined) object.userData.position = position;
    });
    pieces.set(position, piece);
    pieceMeshes.push(piece.userData.surface);
    scene.add(piece);
    drawIndex += 1;
  }
  for (const diamond of DIAMOND_PIECES) {
    const piece = createPiece(diamond.position, diamond.x, diamond.y, diamond.angle, drawIndex * 0.05);
    piece.traverse((object) => {
      if (object.isMesh && object.userData.position === undefined) object.userData.position = diamond.position;
    });
    pieces.set(diamond.position, piece);
    pieceMeshes.push(piece.userData.surface);
    scene.add(piece);
    drawIndex += 1;
  }

  const cameraTarget = new THREE.Vector3(0, 0, 0);
  camera.position.set(0, 145, 1500);
  camera.lookAt(cameraTarget);
  camera.updateProjectionMatrix();
  const boardResizeObserver = new ResizeObserver(resizeBoard);
  boardResizeObserver.observe(board);
  resizeBoard();
  window.addEventListener("resize", resizeBoard);
  board.addEventListener("pointermove", onBoardPointerMove);
  board.addEventListener("pointerleave", () => setHoveredPiece(null));
  board.addEventListener("pointerdown", onBoardPointerDown);
  board.addEventListener("keydown", onBoardKeyDown);
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}

function resizeBoard() {
  const { width, height } = board.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  const aspect = width / height;
  const viewHeight = 700;
  camera.left = -viewHeight * aspect / 2;
  camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
}

function findPieceAtEvent(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pieceMeshes, false)[0];
  return hit?.object.userData.position ?? null;
}

function setHoveredPiece(position) {
  if (hoveredPosition === position) return;
  if (hoveredPosition !== null) pieces.get(hoveredPosition).userData.surface.material.emissive.setHex(0x000000);
  hoveredPosition = position;
  if (position !== null) pieces.get(position).userData.surface.material.emissive.setHex(0x242424);
  renderer.domElement.style.cursor = position === null ? "default" : "pointer";
  updateBoardLabel();
}

function updateBoardLabel() {
  if (hoveredPosition === null) {
    board.setAttribute("aria-label", "Mandorla game board. Use arrow keys to select a piece, then Enter to paint it.");
    return;
  }
  const color = state[hoveredPosition] ?? "uncolored";
  board.setAttribute("aria-label", `${LABELS[hoveredPosition]} selected, ${color} piece. Click or press Enter to paint ${selectedColor}.`);
}

function paintPiece(position) {
  if (!position) return;
  const next = state.slice();
  next[position] = selectedColor;
  setState(next);
}

function onBoardPointerMove(event) {
  if (isAnimatingTurn) return;
  setHoveredPiece(findPieceAtEvent(event));
}

function onBoardPointerDown(event) {
  if (isAnimatingTurn) return;
  const position = findPieceAtEvent(event);
  if (position !== null) paintPiece(position);
}

function onBoardKeyDown(event) {
  if (isAnimatingTurn) return;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Enter" || event.key === " ") {
    paintPiece(activePosition);
    return;
  }
  const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
  activePosition = ((activePosition - 1 + direction + 19) % 19) + 1;
  setHoveredPiece(activePosition);
}

function createSolvedState() {
  const initial = Array(20).fill(null);
  for (const position of [1, 2, 15, 9, 17, 8, 7]) initial[position] = "black";
  for (const position of [3, 4, 16, 10, 18, 6, 5]) initial[position] = "yellow";
  for (const position of [11, 12, 19, 13, 14]) initial[position] = "red";
  return initial;
}

function validateComposition(gameState) {
  const counts = { black: 0, red: 0, yellow: 0 };
  for (let position = 1; position <= 19; position += 1) {
    const color = gameState[position];
    if (!COLORS.includes(color)) return { valid: false, counts };
    counts[color] += 1;
  }
  const valid = COLORS.every((color) => counts[color] === EXPECTED_COUNTS[color]);
  return { valid, counts };
}

function updateCompositionUI() {
  const composition = validateComposition(state);
  const labels = COLOR_SCHEMES[selectedScheme].labels;
  const requirements = `7 ${labels.black}, 5 ${labels.red}, and 7 ${labels.yellow}`;
  compositionIndicator.classList.toggle("is-invalid", !composition.valid);
  compositionText.textContent = composition.valid ? "Valid composition" : "Invalid composition";
  compositionIndicator.title = `${labels.black} ${composition.counts.black}/7 · ${labels.red} ${composition.counts.red}/5 · ${labels.yellow} ${composition.counts.yellow}/7`;
  refreshSolveControl(composition.valid, requirements);
  if (!composition.valid) setStatus(`Invalid composition: requires ${requirements} pieces`, "error");
  return composition.valid;
}

function refreshSolveControl(isValid = validateComposition(state).valid, requirements = "") {
  maxDepthInput.disabled = Boolean(worker);
  depthInfo.disabled = Boolean(worker);
  let label = "Find shortest solution";
  let icon = "⌕";
  if (!isValid) {
    label = "Fix piece counts";
  } else if (worker) {
    label = "Searching…";
  } else if (solution?.length === 0) {
    label = "Already solved";
  } else if (isPlayingSolution) {
    label = "Pause";
    icon = "Ⅱ";
  } else if (solution && currentStep === solution.length) {
    label = "Replay";
    icon = "↻";
  } else if (solution && currentStep > 0) {
    label = "Resume";
    icon = "▶";
  } else if (solution) {
    label = "Solve";
    icon = "▶";
  }
  solveLabel.textContent = label;
  solveButton.querySelector("span:first-child").textContent = icon;
  solveButton.setAttribute("aria-label", label);
  solveButton.title = !isValid
    ? `A valid composition requires ${requirements}`
    : label;
  solveButton.disabled = !isValid || Boolean(worker) || (isAnimatingTurn && !isPlayingSolution) || solution?.length === 0;
}

function renderBoard() {
  const scheme = COLOR_SCHEMES[selectedScheme];
  for (const [position, piece] of pieces) {
    const color = COLORS.includes(state[position]) ? state[position] : "black";
    const palette = scheme.colors[color];
    piece.userData.material.color.setHex(palette.base);
    piece.userData.grooveMaterial.color.setHex(palette.groove);
    piece.userData.highlightMaterial.color.setHex(palette.highlight);
    piece.userData.color = color;
  }
  const solved = isSolved(state);
  stateIndicator.classList.toggle("is-unsolved", !solved);
  stateIndicator.lastChild.textContent = solved ? " Solved" : " Unsolved";
  updateCompositionUI();
  updateBoardLabel();
}

function updateRouteStepUI() {
  if (!solution) {
    stepSlider.disabled = true;
    previousButton.disabled = true;
    nextButton.disabled = true;
    refreshSolveControl();
    return;
  }
  stepSlider.value = String(currentStep);
  stepCount.textContent = currentStep === 0 ? "Start" : `Step ${currentStep} of ${solution.length}`;
  stepCaption.textContent = currentStep === 0 ? "Starting position" : `${solution[currentStep - 1]} turn`;
  stepSlider.disabled = isAnimatingTurn;
  previousButton.disabled = isAnimatingTurn || currentStep === 0;
  nextButton.disabled = isAnimatingTurn || currentStep === solution.length;
  const selectedStep = currentStep === 0 ? 1 : currentStep;
  for (const row of moveList.children) {
    row.classList.toggle("is-current", Number(row.dataset.step) === selectedStep);
  }
  keepSelectedMoveInView(selectedStep);
  refreshSolveControl();
}

function keepSelectedMoveInView(selectedStep) {
  moveList.classList.toggle("is-final-step", selectedStep === solution.length);
  const selectedRow = moveList.querySelector(`[data-step="${selectedStep}"]`);
  if (!selectedRow) return;
  const followingRow = moveList.querySelector(`[data-step="${selectedStep + 1}"]`);
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  for (const row of moveList.children) {
    row.classList.toggle("is-following", row === followingRow);
  }

  if (isMobile) {
    const boardBounds = document.querySelector(".board-wrap").getBoundingClientRect();
    const rowBounds = selectedRow.getBoundingClientRect();
    const followingBounds = followingRow?.getBoundingClientRect();
    const visibleTop = Math.max(8, boardBounds.bottom + 8);
    const visibleBottom = window.innerHeight - 8;
    let scrollDelta = 0;
    if (rowBounds.top < visibleTop || rowBounds.top > visibleBottom || (followingBounds && followingBounds.bottom > visibleBottom)) {
      scrollDelta = rowBounds.top - visibleTop;
    }
    if (scrollDelta) window.scrollBy(0, scrollDelta);
    return;
  }

  const listBounds = moveList.getBoundingClientRect();
  const selectedBounds = selectedRow.getBoundingClientRect();
  const followingBounds = followingRow?.getBoundingClientRect();
  if (selectedBounds.top < listBounds.top) moveList.scrollTop -= listBounds.top - selectedBounds.top;
  else if (followingBounds && followingBounds.bottom > listBounds.bottom) {
    moveList.scrollTop += followingBounds.bottom - listBounds.bottom;
  } else if (selectedBounds.bottom > listBounds.bottom) {
    moveList.scrollTop += selectedBounds.bottom - listBounds.bottom;
  }
}

function animateTurn(move, direction, onComplete, duration = 300) {
  const cycles = move === "Left" ? LEFT_CYCLES : RIGHT_CYCLES;
  const angle = (move === "Left" ? -1 : 1) * direction * (2 * Math.PI / 3);
  const motions = [];
  const transfers = [];

  for (const cycle of cycles) {
    const groups = cycle.map((position) => pieces.get(position));
    const pivot = new THREE.Vector2(
      groups.reduce((sum, group) => sum + group.position.x, 0) / groups.length,
      groups.reduce((sum, group) => sum + group.position.y, 0) / groups.length
    );
    const destinations = cycle.map((_, index) => cycle[(index + (direction > 0 ? 1 : 2)) % cycle.length]);

    groups.forEach((group, index) => {
      const target = slotTransforms.get(destinations[index]);
      motions.push({
        group,
        pivot,
        startX: group.position.x,
        startY: group.position.y,
        startRotation: group.rotation.z,
        deltaAngle: angle,
        target
      });
    });
    transfers.push({ groups, destinations });
  }

  isAnimatingTurn = true;
  refreshSolveControl();
  for (const control of document.querySelectorAll(".color-choice, .scheme-choice, .board-actions button, .turn-button")) control.disabled = true;
  updateRouteStepUI();

  const startTime = performance.now();
  function frame(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    for (const motion of motions) {
      const angleAtFrame = motion.deltaAngle * eased;
      const dx = motion.startX - motion.pivot.x;
      const dy = motion.startY - motion.pivot.y;
      motion.group.position.x = motion.pivot.x + dx * Math.cos(angleAtFrame) - dy * Math.sin(angleAtFrame);
      motion.group.position.y = motion.pivot.y + dx * Math.sin(angleAtFrame) + dy * Math.cos(angleAtFrame);
      motion.group.rotation.z = motion.startRotation + angleAtFrame;
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    for (const motion of motions) {
      motion.group.position.copy(motion.target.position);
      motion.group.rotation.z = motion.target.rotationZ;
    }
    for (const { groups, destinations } of transfers) {
      groups.forEach((group, index) => {
        const destination = destinations[index];
        pieces.set(destination, group);
        group.userData.position = destination;
        group.traverse((object) => {
          if (object.isMesh) object.userData.position = destination;
        });
      });
    }

    isAnimatingTurn = false;
    refreshSolveControl();
    for (const control of document.querySelectorAll(".color-choice, .scheme-choice, .board-actions button, .turn-button")) control.disabled = false;
    onComplete();
  }
  requestAnimationFrame(frame);
}

function setSelectedColor(color) {
  selectedColor = color;
  for (const choice of colorChoices) {
    choice.setAttribute("aria-pressed", String(choice.dataset.color === color));
  }
  updateBoardLabel();
}

function setColorScheme(index) {
  selectedScheme = index;
  const scheme = COLOR_SCHEMES[index];
  const help = `Choose a color, then click pieces to paint. A valid composition has 7 ${scheme.labels.black}, 5 ${scheme.labels.red}, and 7 ${scheme.labels.yellow} pieces; it does not have to be solvable.`;
  paintInfo.dataset.tooltip = help;
  paintHelp.textContent = help;
  for (const button of schemePicker.children) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.scheme) === index));
  }
  for (const choice of colorChoices) {
    const color = choice.dataset.color;
    const label = scheme.labels[color];
    choice.querySelector(".swatch").style.backgroundColor = `#${scheme.colors[color].base.toString(16).padStart(6, "0")}`;
    choice.querySelector("span:last-child").textContent = label;
    choice.setAttribute("aria-label", `Paint ${label.toLowerCase()}`);
  }
  renderBoard();
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  themeToggle.title = `Switch to ${isDark ? "light" : "dark"} mode`;
  themeToggle.querySelector(".theme-label").textContent = isDark ? "Light mode" : "Dark mode";
  themeToggle.querySelector(".theme-icon").textContent = isDark ? "☼" : "◐";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#1b2220" : "#f2f3ef";
  if (scene.background) scene.background.set(isDark ? 0x1b2220 : 0xf2f3ef);
  try {
    localStorage.setItem("mandorla-theme", isDark ? "dark" : "light");
  } catch {
    // Theme switching remains available when storage is disabled.
  }
}

function createColorSchemePicker() {
  COLOR_SCHEMES.forEach((scheme, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scheme-choice";
    button.dataset.scheme = String(index);
    button.title = scheme.name;
    button.setAttribute("aria-label", `${scheme.name} color scheme`);
    button.setAttribute("aria-pressed", "false");
    for (const color of COLORS) {
      const swatch = document.createElement("span");
      swatch.className = "scheme-swatch";
      swatch.style.backgroundColor = `#${scheme.colors[color].base.toString(16).padStart(6, "0")}`;
      button.append(swatch);
    }
    button.addEventListener("click", () => setColorScheme(index));
    schemePicker.append(button);
  });
}

function clearSolution() {
  if (playbackTimer !== null) clearTimeout(playbackTimer);
  playbackTimer = null;
  isPlayingSolution = false;
  solution = null;
  solutionStates = [];
  currentStep = 0;
  workspace.classList.remove("has-solution");
  route.hidden = true;
  emptyRoute.hidden = false;
  moveList.replaceChildren();
  stepSlider.max = "0";
  stepSlider.value = "0";
  previousButton.disabled = true;
  nextButton.disabled = true;
  refreshSolveControl();
}

function setState(nextState) {
  if (isAnimatingTurn) return;
  if (worker) stopSearch("Search stopped because the board changed");
  state = nextState.slice();
  clearSolution();
  renderBoard();
  if (validateComposition(state).valid) setStatus("Ready to solve", "");
}

function setStatus(message, kind) {
  statusText.textContent = message;
  status.className = `search-status${kind ? ` is-${kind}` : ""}`;
}

function showSolution(moves) {
  solution = moves;
  workspace.classList.add("has-solution");
  solutionStates = [state.slice()];
  for (const move of moves) solutionStates.push(applyMove(solutionStates.at(-1), move));
  currentStep = 0;
  route.hidden = false;
  emptyRoute.hidden = true;
  routeLength.textContent = `${moves.length} ${moves.length === 1 ? "turn" : "turns"}`;
  stepSlider.max = String(moves.length);
  moveList.replaceChildren(...moves.map((move, index) => {
    const row = document.createElement("li");
    row.className = "move-row";
    row.dataset.step = String(index + 1);
    const button = document.createElement("button");
    const side = getMoveSide(move);
    const moveDirection = getMoveDirection(move);
    const clockwise = side === "Left" ? moveDirection > 0 : moveDirection < 0;
    const directionLabel = clockwise ? "clockwise" : "counterclockwise";
    button.type = "button";
    button.setAttribute("aria-label", `Go to step ${index + 1}, ${side} ${directionLabel}`);
    const number = document.createElement("span");
    number.className = "move-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const name = document.createElement("span");
    name.className = "move-name";
    name.textContent = `${side} turn`;
    const direction = document.createElement("span");
    direction.className = "move-direction";
    direction.textContent = `${clockwise ? "↻" : "↺"} ${directionLabel.toUpperCase()}`;
    button.append(number, name, direction);
    button.addEventListener("click", () => goToStep(index + 1));
    row.append(button);
    return row;
  }));
  updateRouteStepUI();
  renderBoard();
  setStatus(`Shortest route found in ${moves.length} ${moves.length === 1 ? "turn" : "turns"}`, "found");
}

function pauseSolutionPlayback() {
  if (!isPlayingSolution) return;
  isPlayingSolution = false;
  if (playbackTimer !== null) clearTimeout(playbackTimer);
  playbackTimer = null;
  refreshSolveControl();
  if (!isAnimatingTurn) setStatus(`Paused at step ${currentStep} of ${solution.length}`, "found");
}

function playNextSolutionStep() {
  if (!isPlayingSolution || !solution) return;
  if (currentStep >= solution.length) {
    isPlayingSolution = false;
    playbackTimer = null;
    refreshSolveControl();
    setStatus("Solution complete", "found");
    return;
  }

  const move = solution[currentStep];
  setStatus(`Solving step ${currentStep + 1} of ${solution.length}`, "searching");
  setHoveredPiece(null);
  animateTurn(getMoveSide(move), getMoveDirection(move), () => {
    currentStep += 1;
    state = solutionStates[currentStep].slice();
    updateRouteStepUI();
    renderBoard();
    if (isPlayingSolution && currentStep < solution.length) {
      playbackTimer = setTimeout(playNextSolutionStep, SOLUTION_STEP_PAUSE);
    } else if (isPlayingSolution) {
      isPlayingSolution = false;
      refreshSolveControl();
      setStatus("Solution complete", "found");
    } else {
      setStatus(`Paused at step ${currentStep} of ${solution.length}`, "found");
    }
  }, SOLUTION_TURN_DURATION);
}

function toggleSolutionPlayback() {
  if (!solution || solution.length === 0) return;
  if (isPlayingSolution) {
    pauseSolutionPlayback();
    return;
  }
  if (currentStep === solution.length) {
    currentStep = 0;
    state = solutionStates[0].slice();
    updateRouteStepUI();
    renderBoard();
  }
  isPlayingSolution = true;
  refreshSolveControl();
  playNextSolutionStep();
}

function goToStep(step) {
  if (!solution || isAnimatingTurn) return;
  pauseSolutionPlayback();
  const nextStep = Math.max(0, Math.min(step, solution.length));
  if (nextStep === currentStep) return;

  const commitStep = () => {
    currentStep = nextStep;
    state = solutionStates[currentStep].slice();
    updateRouteStepUI();
    renderBoard();
  };

  if (Math.abs(nextStep - currentStep) === 1) {
    const traversalDirection = nextStep > currentStep ? 1 : -1;
    const move = traversalDirection > 0 ? solution[currentStep] : solution[currentStep - 1];
    const animationDirection = getMoveDirection(move) * traversalDirection;
    setHoveredPiece(null);
    animateTurn(getMoveSide(move), animationDirection, commitStep);
    return;
  }

  commitStep();
}

function stopSearch(message = "Search canceled") {
  if (worker) worker.terminate();
  worker = null;
  refreshSolveControl();
  cancelButton.hidden = true;
  setStatus(message, "");
}

function startSearch() {
  if (!updateCompositionUI()) return;
  if (!maxDepthInput.reportValidity()) return;
  const maxDepth = Number(maxDepthInput.value);
  clearSolution();
  worker = new Worker("./solver-worker.js", { type: "module" });
  refreshSolveControl();
  cancelButton.hidden = false;
  setStatus("Searching from depth 0…", "searching");
  worker.onmessage = ({ data }) => {
    if (data.type === "progress") {
      setStatus(`Searching depth ${data.depth} · ${data.nodes.toLocaleString()} positions checked`, "searching");
      return;
    }
    const finishedWorker = worker;
    worker = null;
    finishedWorker.terminate();
    updateCompositionUI();
    cancelButton.hidden = true;
    if (data.moves) showSolution(data.moves);
    else setStatus(`No solution found within ${data.depth} turns (${data.nodes.toLocaleString()} positions checked)`, "error");
  };
  worker.onerror = (error) => {
    stopSearch("Search failed to start");
    console.error(error);
  };
  worker.postMessage({ state: state.slice(), maxDepth });
}

function turnBoard(move, direction) {
  if (isAnimatingTurn || worker) return;
  clearSolution();
  setHoveredPiece(null);
  const clockwise = move === "Left" ? direction > 0 : direction < 0;
  setStatus(`Turning ${move.toLowerCase()} circle ${clockwise ? "clockwise" : "counterclockwise"}…`, "searching");
  animateTurn(move, direction, () => {
    state = direction > 0 ? applyMove(state, move) : applyMove(applyMove(state, move), move);
    renderBoard();
    if (validateComposition(state).valid) setStatus("Ready to solve", "");
  });
}

for (const choice of colorChoices) {
  choice.addEventListener("click", () => setSelectedColor(choice.dataset.color));
}

const infoButtons = [paintInfo, depthInfo];
for (const infoButton of infoButtons) {
  infoButton.addEventListener("click", () => {
    const shouldOpen = !infoButton.classList.contains("is-open");
    for (const button of infoButtons) {
      button.classList.remove("is-open", "is-dismissed");
      button.setAttribute("aria-expanded", "false");
    }
    if (shouldOpen) {
      infoButton.classList.add("is-open");
      infoButton.setAttribute("aria-expanded", "true");
    } else {
      infoButton.classList.add("is-dismissed");
    }
  });
  infoButton.addEventListener("focus", () => infoButton.classList.remove("is-dismissed"));
  infoButton.addEventListener("pointerenter", () => infoButton.classList.remove("is-dismissed"));
}
document.addEventListener("click", (event) => {
  for (const infoButton of infoButtons) {
    if (infoButton.contains(event.target)) continue;
    infoButton.classList.remove("is-open");
    infoButton.classList.add("is-dismissed");
    infoButton.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  for (const infoButton of infoButtons) {
    infoButton.classList.remove("is-open");
    infoButton.classList.add("is-dismissed");
    infoButton.setAttribute("aria-expanded", "false");
  }
});
themeToggle.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

document.querySelector("#reset-board").addEventListener("click", () => setState(createSolvedState()));
document.querySelector("#scramble-board").addEventListener("click", () => {
  if (worker || isAnimatingTurn) return;
  const moves = [];
  let lastMove = "";
  let repeatedMoves = 0;
  for (let index = 0; index < SCRAMBLE_STEPS; index += 1) {
    const options = ["Left", "Right"].filter((move) => move !== lastMove || repeatedMoves < 2);
    const move = options[Math.floor(Math.random() * options.length)];
    moves.push(move);
    repeatedMoves = move === lastMove ? repeatedMoves + 1 : 1;
    lastMove = move;
  }

  clearSolution();
  setHoveredPiece(null);
  state = createSolvedState();
  renderBoard();

  let step = 0;
  const animateNextScrambleMove = () => {
    const move = moves[step];
    setStatus(`Scrambling ${step + 1}/${moves.length} · ${move.toLowerCase()}`, "searching");
    animateTurn(move, 1, () => {
      state = applyMove(state, move);
      renderBoard();
      step += 1;
      if (step < moves.length) {
        animateNextScrambleMove();
      } else {
        setStatus("Ready to solve", "");
      }
    }, 65);
  };
  animateNextScrambleMove();
});
document.querySelector("#turn-left-clockwise").addEventListener("click", () => turnBoard("Left", 1));
document.querySelector("#turn-left-counterclockwise").addEventListener("click", () => turnBoard("Left", -1));
document.querySelector("#turn-right-clockwise").addEventListener("click", () => turnBoard("Right", -1));
document.querySelector("#turn-right-counterclockwise").addEventListener("click", () => turnBoard("Right", 1));
solveButton.addEventListener("click", () => {
  if (solution) toggleSolutionPlayback();
  else startSearch();
});
cancelButton.addEventListener("click", () => stopSearch());
stepSlider.addEventListener("input", () => goToStep(Number(stepSlider.value)));
previousButton.addEventListener("click", () => goToStep(currentStep - 1));
nextButton.addEventListener("click", () => goToStep(currentStep + 1));

createColorSchemePicker();
setColorScheme(selectedScheme);
setSelectedColor("black");
setTheme(initialTheme);
initializeBoard();
renderBoard();