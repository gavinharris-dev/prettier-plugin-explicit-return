const prettier = require("prettier");
const plugin = require("../src/index.js");

// Helper function to format code with the plugin
function formatWithPlugin(code) {
  return prettier.format(code, {
    parser: "typescript",
    plugins: [plugin],
  });
}

describe("prettier-plugin-explicit-return", () => {
  describe("FunctionDeclaration", () => {
    it("should add return type to function without explicit return type", () => {
      const input = `function sum(a: number, b: number) {
  return a + b;
}`;
      const output = formatWithPlugin(input);
      expect(output).toContain(": number");
      expect(output).toMatch(/function sum\(a: number, b: number\): number/);
    });

    it("should skip function with existing explicit return type", () => {
      const input = `function testVoid(): void {
  console.log("testVoid");
}`;
      const output = formatWithPlugin(input);
      // Should still have : void, not duplicated
      const voidCount = (output.match(/: void/g) || []).length;
      expect(voidCount).toBe(1);
    });

    it("should handle async functions", () => {
      const input = `async function fetchData(url: string) {
  return fetch(url);
}`;
      const output = formatWithPlugin(input);
      expect(output).toContain("async function fetchData");
      expect(output).toContain(": Promise<Response>");
    });
  });

  describe("ArrowFunction", () => {
    it("should add return type to arrow function in variable declaration", () => {
      const input = `const multiply = (a: number, b: number) => {
  return a * b;
};`;
      const output = formatWithPlugin(input);
      expect(output).toContain(": number");
      expect(output).toMatch(/=>\s*:\s*number\s*{/);
    });

    it("should handle arrow function with implicit return", () => {
      const input = `const divide = (a: number, b: number) => a / b;`;
      const output = formatWithPlugin(input);
      expect(output).toContain(": number");
    });
  });

  describe("MethodDeclaration", () => {
    it("should add return type to class method", () => {
      const input = `class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
}`;
      const output = formatWithPlugin(input);
      expect(output).toContain("add(a: number, b: number): number");
    });
  });

  describe("FunctionExpression", () => {
    it("should add return type to function expression", () => {
      const input = `const handler = function(event: string) {
  return event.length;
};`;
      const output = formatWithPlugin(input);
      expect(output).toContain(": number");
    });
  });

  describe("Void return types", () => {
    it("should add void return type to function without return", () => {
      const input = `function logMessage(msg: string) {
  console.log(msg);
}`;
      const output = formatWithPlugin(input);
      expect(output).toContain(": void");
      expect(output).toMatch(/function logMessage\(msg: string\): void/);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle multiple functions", () => {
      const input = `function sum(a: number, b: number) {
  return a + b;
}
function multiply(a: number, b: number) {
  return a * b;
}`;
      const output = formatWithPlugin(input);
      expect(output).toContain("sum(a: number, b: number): number");
      expect(output).toContain("multiply(a: number, b: number): number");
    });

    it("should preserve code structure", () => {
      const input = `function sum(a: number, b: number) {
  return a + b;
}
function testVoid(): void {
  console.log("testVoid");
}
console.log(sum(1, 2));`;
      const output = formatWithPlugin(input);
      expect(output).toContain("sum(a: number, b: number): number");
      expect(output).toContain("testVoid(): void");
      expect(output).toContain("console.log(sum(1, 2));");
    });
  });
});
