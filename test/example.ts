// Function declaration without return type
function sum(a: number, b: number) { // Expect : number as return type
  return a + b;
}

// Function with explicit return type (should be skipped)
function testVoid(): void { // Expect : void as return type
  console.log("testVoid");
}

// Arrow function without return type
const multiply = (a: number, b: number) => { // Expect : number as return type
  return a * b;
};

// Async function
async function fetchData(url: string) { // Expect : Promise<Response> as return type
  return fetch(url);
}

// Class with method
class Calculator {
  add(a: number, b: number) { // Expect : number as return type
    return a + b;
  }
}

// Function expression
const handler = function (event: string) { // Expect : number as return type
  return event.length;
};

console.log(sum(1, 2));
