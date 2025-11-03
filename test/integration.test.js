import { describe, it, expect } from "vitest";
import { format } from "prettier";
import plugin from "../src/index.js";

// Helper function to format code with the plugin
function formatWithPlugin(code) {
  return format(code, {
    parser: "typescript",
    plugins: [plugin],
  });
}

describe("Integration tests", () => {
  it("should add return type to FunctionDeclaration without return type", async () => {
    const input = `function sum(a: number, b: number) {
  return a + b;
}`;
    const result = await formatWithPlugin(input);
    expect(result).toContain(": number");
    expect(result).toMatch(/function sum\(a: number, b: number\): number/);
  });

  it("should skip FunctionDeclaration with existing return type", async () => {
    const input = `function test(): void {
  console.log("test");
}`;
    const result = await formatWithPlugin(input);
    const voidCount = (result.match(/: void/g) || []).length;
    expect(voidCount).toBe(1);
  });



  it("should detect multiple return types", async () => {
    const input = `function sum(a: string) {
  if (a == "number") {
    return 1;
  }
    return "string";
}`;

    const result = await formatWithPlugin(input);
    // Should contain a union type annotation: TypeScript infers literal types as "1 | \"string\""
    expect(result).toMatch(/:\s*1\s*\|\s*"string"/);
  });

  it("should add void as a return type", async () => {
    const input = `function test() {
  console.log("test");
}`;
    const result = await formatWithPlugin(input);
    const voidCount = (result.match(/: void/g) || []).length;
    expect(voidCount).toBe(1);
  });

  it("should add return type to ArrowFunction without return type", async () => {
    const input = `const multiply = (a: number, b: number) => {
  return a * b;
};`;
    const result = await formatWithPlugin(input);
    expect(result).toContain(": number");
    expect(result).toMatch(/const multiply = \(a: number, b: number\): number.*/);
  });

  it("should add return type to MethodDeclaration without return type", async () => {
    const input = `class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
}`;
    const result = await formatWithPlugin(input);
    expect(result).toContain("add(a: number, b: number): number");
  });

  it("should add return type to FunctionExpression without return type", async () => {
    const input = `const handler = function(event: string) {
  return event.length;
};`;
    const result = await formatWithPlugin(input);
    expect(result).toContain(": number");
  });

  it("should add return type to async function without return type", async () => {
    const input = `async function fetchData(url: string) {
  return fetch(url);
}`;
    const result = await formatWithPlugin(input);
    expect(result).toContain("async function fetchData");
    expect(result).toContain(": Promise<Response>");
  });
});
