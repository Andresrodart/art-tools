const fs = require('fs');
const path = require('path');

const isDryRun = !process.argv.includes('--execute');

function main() {
  console.log(isDryRun ? "DRY RUN MODE" : "EXECUTION MODE");
  
  const rootDir = __dirname;
  let movedCount = 0;
  let skippedCount = 0;

  for (const filePath of walkDir(rootDir)) {
    const filename = path.basename(filePath);
    
    // Skip script files and plans directory
    if (filename === 'organize_photos.js' || filename === 'test_organize.js' || filePath.includes('plans')) {
      continue;
    }

    // 1. Determine Date
    let date = parseDateFromFilename(filename);
    if (!date) {
      try {
        const stats = fs.statSync(filePath);
        date = stats.birthtime; // Creation time
        // If birthtime is invalid (some Linux systems return 0/invalid), fallback to mtime
        if (isNaN(date.getTime()) || date.getFullYear() <= 1970) {
            date = stats.mtime;
        }
      } catch (err) {
        console.error(`Error reading stats for ${filename}:`, err.message);
        skippedCount++;
        continue;
      }
    }

    if (!date || isNaN(date.getTime())) {
      console.warn(`Could not determine date for ${filename}, skipping.`);
      skippedCount++;
      continue;
    }

    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // 2. Determine Destination
    const destDir = path.join(rootDir, year, month);
    const destPath = path.join(destDir, filename);

    // Skip if already in place
    if (filePath === destPath) {
      continue;
    }

    // 3. Handle Collisions
    let uniquePath;
    try {
      // In dry run, we can't reliably check collision against *future* moves, 
      // but we can check against *existing* files.
      uniquePath = getUniquePath(destPath);
    } catch (err) {
        console.error(`Error checking path ${destPath}:`, err);
        continue;
    }

    // 4. Move
    const relSrc = path.relative(rootDir, filePath);
    const relDest = path.relative(rootDir, uniquePath);

    if (isDryRun) {
      console.log(`[DRY RUN] Move: ${relSrc} -> ${relDest}`);
    } else {
      try {
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.renameSync(filePath, uniquePath);
        console.log(`[OK] Moved: ${relSrc} -> ${relDest}`);
      } catch (err) {
        console.error(`[ERROR] Failed to move ${filename}:`, err.message);
        skippedCount++;
        continue;
      }
    }
    movedCount++;
  }

  console.log('---');
  console.log(`Total processed: ${movedCount}`);
  console.log(`Total skipped/errors: ${skippedCount}`);
}

function* walkDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
    return;
  }

  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    
    // Skip hidden files/folders
    if (entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      // Skip year folders (YYYY) to prevent re-scanning moved files
      if (/^\d{4}$/.test(entry.name)) {
        continue;
      }
      // Skip specific folders
      if (entry.name === 'plans' || entry.name === 'node_modules') {
        continue;
      }
      yield* walkDir(res);
    } else {
      yield res;
    }
  }
}

// Helpers
function parseDateFromFilename(filename) {
  // Pattern: DJI_YYYYMMDD_...
  const djiMatch = filename.match(/DJI_(\d{4})(\d{2})(\d{2})_/);
  if (djiMatch) {
    const [_, year, month, day] = djiMatch;
    return new Date(`${year}-${month}-${day}T12:00:00`);
  }
  
  // Pattern: YYYYMMDD_... or YYYY-MM-DD... (common variants)
  const genericMatch = filename.match(/^(\d{4})(\d{2})(\d{2})_/);
  if (genericMatch) {
    const [_, year, month, day] = genericMatch;
    return new Date(`${year}-${month}-${day}T12:00:00`);
  }

  return null;
}

function getUniquePath(destPath, checkExists = fs.existsSync) {
  if (!checkExists(destPath)) {
    return destPath;
  }

  const dir = path.dirname(destPath);
  const ext = path.extname(destPath);
  const name = path.basename(destPath, ext);

  let counter = 1;
  let newPath = destPath;

  while (checkExists(newPath)) {
    newPath = path.join(dir, `${name}_${counter}${ext}`);
    counter++;
  }

  return newPath;
}

// Export helpers for testing
module.exports = {
  parseDateFromFilename,
  getUniquePath,
};

if (require.main === module) {
  main();
}
