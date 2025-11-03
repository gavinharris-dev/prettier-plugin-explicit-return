// Manual test script to verify plugin functionality
const prettier = require("prettier");
const plugin = require("../src/index.js");
const fs = require("fs");

const testFile = "test/example.ts";
const code = fs.readFileSync(testFile, "utf8");

console.log("=== Original Code ===");
console.log(code);
console.log("\n=== Preprocessed (via plugin.preprocess) ===");
const preprocessed = plugin.preprocess(code, {});
console.log(preprocessed);

(async () => {
  console.log("\n=== Formatted with Prettier (with plugin) ===");
  const formatted = await prettier.format(code, {
    parser: "typescript",
    plugins: [plugin],
  });
  console.log(formatted);

  console.log("\n=== Direct Prettier formatting ===");
  const directFormatted = await prettier.format(code, {
    parser: "typescript",
  });
  console.log(directFormatted);

  // Verify differences
  if (preprocessed !== code) {
    console.log("\n✓ Preprocessing is working - types were added");
    
    // Check if specific types were added
    if (preprocessed.includes("sum(a: number, b: number): number")) {
      console.log("  ✓ Function declaration got return type");
    }
    if (preprocessed.includes("multiply = (a: number, b: number): number")) {
      console.log("  ✓ Arrow function got return type");
    }
    if (preprocessed.includes("add(a: number, b: number): number")) {
      console.log("  ✓ Method got return type");
    }
    if (preprocessed.includes("handler = function (event: string): number")) {
      console.log("  ✓ Function expression got return type");
    }
    if (preprocessed.includes("fetchData(url: string): Promise<Response>")) {
      console.log("  ✓ Async function got return type");
    }
    if (!preprocessed.match(/testVoid\(\): void.*: void/g)) {
      console.log("  ✓ Function with existing return type was skipped");
    }
  } else {
    console.log("\n✗ Preprocessing didn't add any types");
  }

  if (formatted !== directFormatted) {
    console.log("✓ Plugin is affecting Prettier output");
  } else {
    console.log("✗ Plugin is not affecting Prettier output");
  }
})();
