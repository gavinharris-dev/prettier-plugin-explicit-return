const ts = require("typescript");

// Helper function to clone a type node to remove parent references
function cloneTypeNode(node) {
  if (!node) return node;
  
  if (ts.isUnionTypeNode(node)) {
    return ts.factory.createUnionTypeNode(node.types.map(cloneTypeNode));
  }
  
  if (ts.isIntersectionTypeNode(node)) {
    return ts.factory.createIntersectionTypeNode(node.types.map(cloneTypeNode));
  }
  
  if (ts.isLiteralTypeNode(node)) {
    if (ts.isNumericLiteral(node.literal)) {
      return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(node.literal.text));
    }
    if (ts.isStringLiteral(node.literal)) {
      return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(node.literal.text));
    }
    if (ts.isBooleanLiteral(node.literal)) {
      return ts.factory.createLiteralTypeNode(node.literal.kind === ts.SyntaxKind.TrueKeyword 
        ? ts.factory.createTrue()
        : ts.factory.createFalse());
    }
    return ts.factory.createLiteralTypeNode(node.literal);
  }
  
  if (ts.isTypeReferenceNode(node)) {
    return ts.factory.createTypeReferenceNode(
      node.typeName,
      node.typeArguments ? node.typeArguments.map(cloneTypeNode) : undefined
    );
  }
  
  if (ts.isKeywordTypeNode(node)) {
    return ts.factory.createKeywordTypeNode(node.kind);
  }
  
  if (ts.isArrayTypeNode(node)) {
    return ts.factory.createArrayTypeNode(cloneTypeNode(node.elementType));
  }
  
  if (ts.isTypeLiteralNode(node)) {
    return ts.factory.createTypeLiteralNode(node.members.map((member) => {
      if (ts.isPropertySignature(member)) {
        return ts.factory.createPropertySignature(
          member.modifiers,
          member.name,
          member.questionToken,
          cloneTypeNode(member.type)
        );
      }
      return member;
    }));
  }
  
  // Fallback: try to visit and clone recursively
  return ts.visitEachChild(node, cloneTypeNode, null);
}

// Helper function to parse a type string into a TypeScript type node
function parseTypeString(typeString) {
  try {
    // Parse the type string as a type expression
    const typeSource = `type _ = ${typeString};`;
    const typeFile = ts.createSourceFile(
      "temp-type.ts",
      typeSource,
      ts.ScriptTarget.Latest,
      true
    );
    const typeNode = typeFile.statements[0];
    if (ts.isTypeAliasDeclaration(typeNode) && typeNode.type) {
      // Clone the type node to remove parent references
      return cloneTypeNode(typeNode.type);
    }
  } catch (e) {
    // Fallback to type reference if parsing fails
    return ts.factory.createTypeReferenceNode(typeString);
  }
  // Fallback
  return ts.factory.createTypeReferenceNode(typeString);
}

// Helper function to add return type annotation to a function-like node
function addReturnType(node, returnTypeString, factory, context) {
  const typeNode = parseTypeString(returnTypeString);

  if (ts.isFunctionDeclaration(node)) {
    return factory.updateFunctionDeclaration(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      typeNode,
      node.body
    );
  }

  if (ts.isArrowFunction(node)) {
    return factory.updateArrowFunction(
      node,
      node.modifiers,
      node.typeParameters,
      node.parameters,
      typeNode,
      node.equalsGreaterThanToken,
      node.body
    );
  }

  if (ts.isMethodDeclaration(node)) {
    return factory.updateMethodDeclaration(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.questionToken,
      node.typeParameters,
      node.parameters,
      typeNode,
      node.body
    );
  }

  if (ts.isFunctionExpression(node)) {
    return factory.updateFunctionExpression(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      typeNode,
      node.body
    );
  }

  return node;
}

// Helper function to check if a function-like node has an explicit return type
function hasExplicitReturnType(node) {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || 
      ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    return !!node.type;
  }
  return false;
}

function inferAndAnnotateReturnTypes(sourceText) {
  const fileName = "temp.ts";
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const host = ts.createCompilerHost({});
  // Add the source file to the host's file system
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileNameToCheck, languageVersion, onError) => {
    if (fileNameToCheck === fileName) {
      return sourceFile;
    }
    return originalGetSourceFile(fileNameToCheck, languageVersion, onError);
  };

  const options = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    lib: ["ES2022", "DOM"],
  };
  const program = ts.createProgram([fileName], options, host);
  const checker = program.getTypeChecker();

  // Helper function to get return type for any function-like node
  function getReturnTypeForNode(node) {
    try {
      // For function declarations and method declarations, use getSignatureFromDeclaration
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        const signature = checker.getSignatureFromDeclaration(node);
        if (signature) {
          return checker.getReturnTypeOfSignature(signature);
        }
      }

      // For arrow functions and function expressions, get type at location
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        const type = checker.getTypeAtLocation(node);
        const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
        if (signatures && signatures.length > 0) {
          return checker.getReturnTypeOfSignature(signatures[0]);
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  const transformer = (context) => {
    function visit(node) {
      // Handle FunctionDeclaration
      if (ts.isFunctionDeclaration(node) && node.name) {
        if (!hasExplicitReturnType(node)) {
          const returnType = getReturnTypeForNode(node);
          if (returnType) {
            const returnTypeString = checker.typeToString(
              returnType,
              undefined,
              ts.TypeFormatFlags.NoTruncation
            );

            const updatedNode = addReturnType(
              node,
              returnTypeString,
              context.factory,
              context
            );
            return ts.visitEachChild(updatedNode, visit, context);
          }
        }
      }

      // Handle ArrowFunction (standalone or in variable declaration)
      if (ts.isArrowFunction(node)) {
        if (!hasExplicitReturnType(node)) {
          const returnType = getReturnTypeForNode(node);
          if (returnType) {
            const returnTypeString = checker.typeToString(
              returnType,
              undefined,
              ts.TypeFormatFlags.NoTruncation
            );

            const updatedNode = addReturnType(
              node,
              returnTypeString,
              context.factory,
              context
            );
            return ts.visitEachChild(updatedNode, visit, context);
          }
        }
      }

      // Handle MethodDeclaration (class methods)
      if (ts.isMethodDeclaration(node)) {
        if (!hasExplicitReturnType(node)) {
          const returnType = getReturnTypeForNode(node);
          if (returnType) {
            const returnTypeString = checker.typeToString(
              returnType,
              undefined,
              ts.TypeFormatFlags.NoTruncation
            );

            const updatedNode = addReturnType(
              node,
              returnTypeString,
              context.factory,
              context
            );
            return ts.visitEachChild(updatedNode, visit, context);
          }
        }
      }

      // Handle FunctionExpression (anonymous functions)
      if (ts.isFunctionExpression(node)) {
        if (!hasExplicitReturnType(node)) {
          const returnType = getReturnTypeForNode(node);
          if (returnType) {
            const returnTypeString = checker.typeToString(
              returnType,
              undefined,
              ts.TypeFormatFlags.NoTruncation
            );

            const updatedNode = addReturnType(
              node,
              returnTypeString,
              context.factory,
              context
            );
            return ts.visitEachChild(updatedNode, visit, context);
          }
        }
      }

      return ts.visitEachChild(node, visit, context);
    }

    return (root) => ts.visitNode(root, visit);
  };
  const result = ts.transform(sourceFile, [transformer]);
  const printer = ts.createPrinter({
    removeComments: false,
    newLine: ts.NewLineKind.LineFeed,
  });
  const transformed = printer.printFile(result.transformed[0]);

  return transformed;
}

module.exports = {
    languages: [
      {
        name: "TypeScript",
        parsers: ["typescript"],
        extensions: [".ts", ".tsx"],
      },
    ],
    parsers: {
      typescript: {
        ...require("prettier/parser-typescript").parsers.typescript,
        preprocess(text, options) {
          try {
            const result = inferAndAnnotateReturnTypes(text);
            return result;
          } catch (e) {
            console.error("Failed to infer types:", e);
            console.error("Stack:", e.stack);
            return text;
          }
        },
      },
    },
    printers: {
      explicitReturnPrinter: {
        print(path, options, print) {
          return options.printer(path, options, print);
        },
      },
    },
  };