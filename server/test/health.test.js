import test from "node:test";
import assert from "node:assert/strict";

test('environment supports fetch and Node runtime', () => {
  assert.equal(typeof fetch, 'function');
  assert.ok(Number(process.versions.node.split('.')[0]) >= 20);
});
