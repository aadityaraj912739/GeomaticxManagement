import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProgress } from "../src/routes/tasks.js";

test("partial progress does not become 100 percent", () => {
  assert.deepEqual(normalizeProgress({ progress: 25 }, "IN_PROGRESS"), { progress: 25 });
});

test("100 percent progress completes a task", () => {
  assert.deepEqual(normalizeProgress({ progress: 100 }, "IN_PROGRESS"), { progress: 100, status: "DONE" });
});

test("reducing completed task progress reopens it", () => {
  assert.deepEqual(normalizeProgress({ progress: 50 }, "DONE"), { progress: 50, status: "IN_PROGRESS" });
});

test("explicit done status sets progress to 100 percent", () => {
  assert.deepEqual(normalizeProgress({ status: "DONE" }, "IN_PROGRESS"), { status: "DONE", progress: 100 });
});
