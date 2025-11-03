# Prettier Plugin Explicit Return

A Prettier plugin that automatically adds explicit return type annotations to TypeScript functions using type inference.

## Installation

```bash
npm install --save-dev prettier-plugin-explicit-return
```

## Usage

Add the plugin to your Prettier configuration:

**`.prettierrc.json`:**
```json
{
  "plugins": ["prettier-plugin-explicit-return"]
}
```

**`package.json`:**
```json
{
  "prettier": {
    "plugins": ["prettier-plugin-explicit-return"]
  }
}
```

Then format your TypeScript files as usual:

```bash
npx prettier --write "**/*.{ts,tsx}"
```

## Features

This plugin automatically adds explicit return type annotations to:

- ✅ Function declarations
- ✅ Arrow functions
- ✅ Class methods
- ✅ Function expressions
- ✅ Async functions (including `Promise` return types)

Functions that already have explicit return types are **skipped** to avoid duplication.

## Examples

### Function Declaration

**Before:**
```typescript
function sum(a: number, b: number) {
  return a + b;
}
```

**After:**
```typescript
function sum(a: number, b: number): number {
  return a + b;
}
```

### Arrow Function

**Before:**
```typescript
const multiply = (a: number, b: number) => {
  return a * b;
};
```

**After:**
```typescript
const multiply = (a: number, b: number): number => {
  return a * b;
};
```

### Class Method

**Before:**
```typescript
class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
}
```

**After:**
```typescript
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
```

### Function Expression

**Before:**
```typescript
const handler = function (event: string) {
  return event.length;
};
```

**After:**
```typescript
const handler = function (event: string): number {
  return event.length;
};
```

### Async Function

**Before:**
```typescript
async function fetchData(url: string) {
  return fetch(url);
}
```

**After:**
```typescript
async function fetchData(url: string): Promise<Response> {
  return fetch(url);
}
```

### Existing Return Types (Skipped)

Functions with existing return types are left unchanged:

**Before & After:**
```typescript
function testVoid(): void {
  console.log("testVoid");
}
```

## How It Works

The plugin uses TypeScript's type checker to infer return types for functions that don't have explicit return type annotations. It:

1. Parses your TypeScript code using TypeScript's compiler API
2. Uses the type checker to infer return types
3. Adds explicit return type annotations to functions that don't have them
4. Preserves all formatting and existing code structure
5. Works seamlessly with Prettier's formatting pipeline

## Requirements

- Node.js 14+
- Prettier 3.6+
- TypeScript 5.9+

## License

ISC

