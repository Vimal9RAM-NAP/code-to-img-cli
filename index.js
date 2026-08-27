#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const inputFile = args[0];

if (!inputFile || args.includes('--help') || args.includes('-h')) {
  console.log(`
  \x1b[36mcode-to-img-vimal\x1b[0m - Convert source code to beautiful visual cards

  \x1b[33mUsage:\x1b[0m
    $ npx code-to-img-vimal <file-path> [output-path]

  \x1b[33mExample:\x1b[0m
    $ npx code-to-img-vimal server.js output.html
  `);
  process.exit(0);
}

const resolveInput = path.resolve(process.cwd(), inputFile);
const outputFile = args[1] || `${path.parse(inputFile).name}-card.html`;
const resolveOutput = path.resolve(process.cwd(), outputFile);

if (!fs.existsSync(resolveInput)) {
  console.error(`\x1b[31mError:\x1b[0m File "${inputFile}" not found.`);
  process.exit(1);
}

const rawCode = fs.readFileSync(resolveInput, 'utf-8');

// Safe Syntax Highlighting Tokenizer using Placeholders
function highlightCode(code) {
  // 1. Escape HTML special characters
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Extract comments into placeholders
  const comments = [];
  escaped = escaped.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g, (match) => {
    comments.push(`<span class="tok-comment">${match}</span>`);
    return `___COMMENT_${comments.length - 1}___`;
  });

  // 3. Extract strings into placeholders
  const strings = [];
  escaped = escaped.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, (match) => {
    strings.push(`<span class="tok-string">${match}</span>`);
    return `___STRING_${strings.length - 1}___`;
  });

  // 4. Highlight keywords, numbers, and functions on remaining plain text
  escaped = escaped
    .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|default|class|async|await|try|catch|new|include|int|void|def|typedef|struct|char|float|double)\b/g, '<span class="tok-keyword">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="tok-number">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="tok-fn">$1</span>');

  // 5. Reinsert protected strings and comments
  escaped = escaped.replace(/___STRING_(\d+)___/g, (_, id) => strings[id]);
  escaped = escaped.replace(/___COMMENT_(\d+)___/g, (_, id) => comments[id]);

  return escaped;
}

const highlightedCode = highlightCode(rawCode);
const filename = path.basename(resolveInput);

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Snapshot - ${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Fira Code', Consolas, Monaco, 'Andale Mono', monospace;
      padding: 40px 20px;
    }
    .window {
      background: #1e1e2e;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
      width: 100%;
      max-width: 800px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .header {
      background: #181825;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      position: relative;
    }
    .buttons {
      display: flex;
      gap: 8px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .close { background: #ff5f56; }
    .minimize { background: #ffbd2e; }
    .maximize { background: #27c93f; }
    .title {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      color: #a6adc8;
      font-size: 13px;
    }
    .code-body {
      padding: 24px;
      color: #cdd6f4;
      font-size: 14px;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
    }
    /* Syntax Highlighting Colors (Catppuccin Macchiato Palette) */
    .tok-keyword { color: #cba6f7; font-weight: bold; }
    .tok-string  { color: #a6e3a1; }
    .tok-comment { color: #6c7086; font-style: italic; }
    .tok-number  { color: #fab387; }
    .tok-fn      { color: #89b4fa; }
  </style>
</head>
<body>
  <div class="window">
    <div class="header">
      <div class="buttons">
        <div class="dot close"></div>
        <div class="dot minimize"></div>
        <div class="dot maximize"></div>
      </div>
      <div class="title">${filename}</div>
    </div>
    <div class="code-body"><code>${highlightedCode}</code></div>
  </div>
</body>
</html>`;

try {
  fs.writeFileSync(resolveOutput, htmlTemplate, 'utf-8');
  console.log(`\n\x1b[32m✔ Success!\x1b[0m Generated code snapshot card: \x1b[36m${outputFile}\x1b[0m\n`);
} catch (err) {
  console.error(`\x1b[31mError writing file:\x1b[0m`, err.message);
  process.exit(1);
}