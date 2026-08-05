import test from "node:test";
import assert from "node:assert/strict";
import { aiConfig, extractResponseText } from "../src/services/openai.js";

test("extractResponseText reads Responses API output content", () => {
  const text = extractResponseText({
    output: [{ content: [{ type: "output_text", text: "First" }, { type: "output_text", text: "Second" }] }]
  });
  assert.equal(text, "First\nSecond");
});

test("extractResponseText supports the output_text convenience property", () => {
  assert.equal(extractResponseText({ output_text: " Governed result " }), "Governed result");
});

test("AI configuration never exposes the API key", () => {
  assert.equal(Object.hasOwn(aiConfig(), "apiKey"), false);
});
