const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'client/src/pages'),
  path.join(__dirname, 'client/src/components')
];

const excludeDirs = ['shared', 'ui']; // avoid breaking layout headers and raw UI components

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!excludeDirs.includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (fullPath.endsWith('.tsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function processGrid(content) {
  let newContent = content;
  // Use regex with negative lookbehind to avoid replacing already responsive grids
  newContent = newContent.replace(/(?<!(?:md:|sm:|lg:|xl:))\bgrid-cols-2\b/g, 'grid-cols-1 md:grid-cols-2');
  newContent = newContent.replace(/(?<!(?:md:|sm:|lg:|xl:))\bgrid-cols-3\b/g, 'grid-cols-1 md:grid-cols-3');
  newContent = newContent.replace(/(?<!(?:md:|sm:|lg:|xl:))\bgrid-cols-4\b/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  newContent = newContent.replace(/(?<!(?:md:|sm:|lg:|xl:))\bgrid-cols-5\b/g, 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-5');
  newContent = newContent.replace(/(?<!(?:md:|sm:|lg:|xl:))\bgrid-cols-6\b/g, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6');
  return newContent;
}

function processTables(content) {
  // We'll do a simple regex for tables that aren't already wrapped in overflow-x-auto.
  // A table might span multiple lines, so a basic AST or carefully crafted regex is needed.
  // Actually, we can just replace `<table` with `<div className="w-full overflow-x-auto max-w-[100vw] pb-2"><table`
  // and `</table>` with `</table></div>`.
  // Wait, if it's already wrapped, this duplicates wrappers.
  // Let's first check if `<div className="w-full overflow-x-auto` exists right before.
  // It's safer to use a state machine parser.

  const result = [];
  let i = 0;
  
  const isTableTag = (idx) => {
    // match `<table ` or `<table>` or `<table\n`
    const str = content.substring(idx, idx + 7);
    return str.match(/^<table[\s>]/);
  };
  
  const isShadcnTableTag = (idx) => {
    const str = content.substring(idx, idx + 7);
    return str.match(/^<Table[\s>]/) && !content.substring(idx, idx + 12).match(/^<Table[A-Z]/); 
    // ensures it doesn't match <TableHeader>, <TableRow> etc.
  };

  const isTableEnd = (idx) => content.substring(idx, idx + 8) === '</table>';
  const isShadcnTableEnd = (idx) => content.substring(idx, idx + 8) === '</Table>';

  // We need to apply backwards to not mess up indices, so let's find all pairs.
  const tags = [];
  while (i < content.length) {
    if (content[i] === '<') {
      if (isTableTag(i)) {
        tags.push({ type: 'table-start', idx: i, isShadcn: false });
      } else if (isShadcnTableTag(i)) {
        tags.push({ type: 'table-start', idx: i, isShadcn: true });
      } else if (isTableEnd(i)) {
        tags.push({ type: 'table-end', idx: i + 8, isShadcn: false });
      } else if (isShadcnTableEnd(i)) {
        tags.push({ type: 'table-end', idx: i + 8, isShadcn: true });
      }
    }
    i++;
  }

  // Build tree of tables
  const root = { children: [] };
  const stack = [root];
  for (const tag of tags) {
    if (tag.type === 'table-start') {
      const node = { start: tag.idx, isShadcn: tag.isShadcn, children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    } else if (tag.type === 'table-end') {
      if (stack.length > 1) {
        const top = stack.pop();
        top.end = tag.idx; // end is after the closing tag
      }
    }
  }

  // Flatten the top level tables (we don't wrap nested tables separately, or we could, but top level is enough)
  const topLevelTables = root.children.filter(n => n.end);

  let modifiedContent = content;
  // Apply from back to front
  for (let t = topLevelTables.length - 1; t >= 0; t--) {
    const table = topLevelTables[t];
    const beforeStr = modifiedContent.substring(0, table.start);
    // Check if it's already wrapped recently
    const recentBefore = beforeStr.substring(Math.max(0, beforeStr.length - 100));
    if (recentBefore.includes('overflow-x-auto')) {
      continue; // already wrapped
    }

    const startIdx = table.start;
    const endIdx = table.end;

    const wrapperStart = `<div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin">`;
    const wrapperEnd = `</div>`;

    modifiedContent = 
      modifiedContent.substring(0, startIdx) + 
      wrapperStart + 
      modifiedContent.substring(startIdx, endIdx) + 
      wrapperEnd + 
      modifiedContent.substring(endIdx);
  }

  return modifiedContent;
}

function processFlexWrap(content) {
  // Convert `className="flex gap-2"` to `className="flex flex-wrap gap-2"`
  // Look for className strings that have `flex` and `gap-X` but not `flex-wrap` and not `flex-col`
  return content.replace(/className=(['"{`])([^'"{`}]*)\bflex\b([^'"{`}]*)\bgap-\d+([^'"{`}]*)\1/g, (match, quote, p1, p2, p3) => {
    const fullClass = `${p1}flex${p2}gap-${match.match(/gap-(\d+)/)[1]}${p3}`;
    if (fullClass.includes('flex-wrap') || fullClass.includes('flex-col')) {
      return match;
    }
    return `className=${quote}${fullClass.replace(/\bflex\b/, 'flex flex-wrap')}${quote}`;
  });
}

const files = [];
targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    getAllFiles(dir, files);
  }
});

let updatedCount = 0;

files.forEach(file => {
  const original = fs.readFileSync(file, 'utf8');
  let updated = original;

  updated = processGrid(updated);
  updated = processTables(updated);
  updated = processFlexWrap(updated);

  if (updated !== original) {
    fs.writeFileSync(file, updated);
    updatedCount++;
    console.log(`Updated: ${file.replace(__dirname, '')}`);
  }
});

console.log(`\nSuccessfully refactored ${updatedCount} files.`);
