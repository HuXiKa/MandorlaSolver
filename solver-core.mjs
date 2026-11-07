export const MAX_DEPTH = 25;

export const LEFT_CYCLES = [
  [1, 12, 7],
  [2, 14, 8],
  [15, 19, 17],
  [9, 11, 13]
];

export const RIGHT_CYCLES = [
  [4, 11, 6],
  [3, 13, 5],
  [16, 19, 18],
  [10, 12, 14]
];

export const SOLVER_MOVES = [
  "Left clockwise",
  "Left counterclockwise",
  "Right clockwise",
  "Right counterclockwise"
];

export function getMoveSide(move) {
  return move.startsWith("Left") ? "Left" : "Right";
}

export function getMoveDirection(move) {
  if (move === "Left" || move === "Right") return 1;
  const clockwise = move.includes("clockwise") && !move.includes("counterclockwise");
  return (getMoveSide(move) === "Left") === clockwise ? 1 : -1;
}

const LEFT_SIDE = [1, 2, 15, 9, 17, 8, 7];
const RIGHT_SIDE = [3, 4, 16, 10, 18, 6, 5];
const MIDDLE = [11, 12, 19, 13, 14];

export function applyMove(state, move) {
  const next = state.slice();
  const cycles = getMoveSide(move) === "Left" ? LEFT_CYCLES : RIGHT_CYCLES;
  const repeats = getMoveDirection(move) > 0 ? 1 : 2;
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    for (const [first, second, third] of cycles) {
      const saved = next[first];
      next[first] = next[third];
      next[third] = next[second];
      next[second] = saved;
    }
  }
  return next;
}

export function isSolved(state) {
  if (!MIDDLE.every((position) => state[position] === "red")) return false;
  const leftColor = state[LEFT_SIDE[0]];
  const rightColor = state[RIGHT_SIDE[0]];
  if (!LEFT_SIDE.every((position) => state[position] === leftColor)) return false;
  if (!RIGHT_SIDE.every((position) => state[position] === rightColor)) return false;
  return (leftColor === "black" && rightColor === "yellow") ||
    (leftColor === "yellow" && rightColor === "black");
}

export function solve(startState, maxDepth = MAX_DEPTH, onProgress = () => {}) {
  let nodeCount = 0;
  const path = [];

  for (let limit = 0; limit <= maxDepth; limit += 1) {
    onProgress({ type: "depth", depth: limit, nodes: nodeCount });

    function search(state, depth, lastSide) {
      nodeCount += 1;
      if (nodeCount % 50000 === 0) {
        onProgress({ type: "progress", depth: limit, nodes: nodeCount });
      }
      if (isSolved(state)) return true;
      if (depth === limit) return false;

      for (const move of SOLVER_MOVES) {
        const side = getMoveSide(move);
        // Two consecutive turns on one circle reduce to one turn or cancel.
        if (side === lastSide) continue;
        path.push(move);
        if (search(applyMove(state, move), depth + 1, side)) return true;
        path.pop();
      }
      return false;
    }

    if (search(startState, 0, "")) {
      return { moves: path.slice(), nodes: nodeCount, depth: limit };
    }
  }

  return { moves: null, nodes: nodeCount, depth: maxDepth };
}