import { solve } from "./solver-core.mjs";

self.onmessage = ({ data }) => {
  const result = solve(data.state, data.maxDepth, (progress) => {
    self.postMessage({ ...progress, type: "progress" });
  });
  self.postMessage({ type: "result", ...result });
};