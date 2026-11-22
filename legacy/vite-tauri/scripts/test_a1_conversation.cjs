// Validasi simulasi percakapan bercabang P5 A1: skenario, node, opsi,
// umpan balik, tujuan node yang valid, dan tidak ada siklus.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const file = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/practice/a1_conversation.json"), "utf8").replace(/^\uFEFF/, ""),
);

assert.equal(file.level, "A1");
assert.ok(Array.isArray(file.scenarios) && file.scenarios.length >= 4, "minimal 4 skenario");

const scenarioIds = new Set();
let totalNodes = 0;
let totalOptions = 0;

for (const scenario of file.scenarios) {
  assert.ok(scenario.id && !scenarioIds.has(scenario.id), `id skenario unik: ${scenario.id}`);
  scenarioIds.add(scenario.id);
  assert.ok(scenario.title.trim(), `${scenario.id} title`);
  assert.ok(scenario.context.trim(), `${scenario.id} context`);
  assert.ok(scenario.nodes && typeof scenario.nodes === "object", `${scenario.id} nodes`);
  assert.ok(scenario.nodes[scenario.start], `${scenario.id} start node ada`);

  const nodeIds = Object.keys(scenario.nodes);
  assert.ok(nodeIds.length >= 5, `${scenario.id} minimal 5 node`);

  // Semua node harus dapat dicapai dari start dan tidak membentuk siklus.
  const visited = new Set();
  const visiting = new Set();
  const visit = (nodeId) => {
    assert.ok(scenario.nodes[nodeId], `${scenario.id} next node tidak ada: ${nodeId}`);
    assert.ok(!visiting.has(nodeId), `${scenario.id} siklus pada node ${nodeId}`);
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    const node = scenario.nodes[nodeId];
    if (!node.end) {
      assert.ok(Array.isArray(node.options) && node.options.length >= 2, `${scenario.id}.${nodeId} minimal 2 opsi`);
      for (const option of node.options) {
        assert.ok(option.text.trim(), `${scenario.id}.${nodeId} teks opsi`);
        assert.ok(option.feedback.trim(), `${scenario.id}.${nodeId} feedback opsi`);
        visit(option.next);
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  visit(scenario.start);

  let ends = 0;
  for (const nodeId of nodeIds) {
    const node = scenario.nodes[nodeId];
    assert.ok(node.speaker.trim(), `${scenario.id}.${nodeId} speaker`);
    assert.ok(node.de.trim(), `${scenario.id}.${nodeId} teks Jerman`);
    assert.ok(node.id.trim(), `${scenario.id}.${nodeId} terjemahan`);
    if (node.end) {
      ends++;
      assert.ok(node.summary && node.summary.trim(), `${scenario.id}.${nodeId} summary`);
      assert.ok(!node.options || node.options.length === 0, `${scenario.id}.${nodeId} end tidak punya opsi`);
    } else {
      totalOptions += node.options.length;
    }
  }
  assert.ok(ends >= 1, `${scenario.id} minimal 1 ending`);
  assert.equal(visited.size, nodeIds.length, `${scenario.id} semua node terjangkau`);
  totalNodes += nodeIds.length;
}

console.log(
  `P5 A1 conversation OK: ${file.scenarios.length} skenario, ${totalNodes} node, ` +
    `${totalOptions} opsi bercabang, tanpa siklus.`,
);
