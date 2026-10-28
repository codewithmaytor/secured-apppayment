import assert from "node:assert/strict";
import { seed, balance, amountCents, risk, commit, csv } from "../src/model.js";
import { writeFile, mkdir } from "node:fs/promises";
const results = [];
function test(id, name, fn) {
  try {
    fn();
    results.push({ id, name, result: "PASS" });
  } catch (e) {
    results.push({ id, name, result: "FAIL", error: e.message });
    process.exitCode = 1;
  }
}
test("U01", "Seed ledger independently reconciles to KES 85000", () =>
  assert.equal(balance(seed()), 8500000),
);
test("U02", "Money input preserves cents and rejects invalid values", () => {
  assert.equal(amountCents("2500.25"), 250025);
  for (const v of [
    "-1",
    "0",
    "NaN",
    "1.001",
    "1e4",
    "Infinity",
    "90071992547409999",
  ])
    assert.equal(amountCents(v), null);
});
test("U03", "Risk boundaries and unfamiliar recipients", () => {
  assert.equal(risk(999999, true).level, "Low");
  assert.equal(risk(1000000, true).level, "Review");
  assert.equal(risk(4999999, true).level, "Review");
  assert.equal(risk(5000000, true).level, "Blocked");
  assert.equal(risk(1, false).level, "Review");
});
test("U04", "Completed payment changes balance exactly once", () => {
  const u = seed(),
    t = { id: "test", amount: 250000, status: "Completed", direction: "out" };
  assert.equal(commit(u, t), true);
  assert.equal(balance(u), 8250000);
  assert.equal(commit(u, t), false);
  assert.equal(balance(u), 8250000);
});
test("U05", "Blocked payment never debits wallet", () => {
  const u = seed();
  commit(u, {
    id: "blocked",
    amount: 6000000,
    status: "Blocked",
    direction: "out",
  });
  assert.equal(balance(u), 8500000);
});
test("U06", "Insufficient funds cannot be committed", () => {
  const u = seed();
  assert.throws(() =>
    commit(u, {
      id: "over",
      amount: 8500001,
      status: "Completed",
      direction: "out",
    }),
  );
  assert.equal(u.transactions.length, 4);
  assert.equal(balance(u), 8500000);
});
test("U07", "CSV escapes quotes and neutralizes formula prefixes", () => {
  const value = csv([
    { id: "a", name: "=1+1", handle: "@test", amount: 100, note: 'a,"b"' },
  ]);
  assert.ok(value.includes('"\'=1+1"'));
  assert.ok(value.includes('"\'@test"'));
  assert.ok(value.includes('"a,""b"""'));
});
await mkdir(new URL("../test-results/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../test-results/model-test-results.json", import.meta.url),
  JSON.stringify(
    { executedAt: new Date().toISOString(), runtime: process.version, results },
    null,
    2,
  ),
);
for (const r of results) console.log(`${r.id} ${r.result} ${r.name}`);
