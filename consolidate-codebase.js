const fs = require('fs');
const path = require('path');

// Define file extensions to include
const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yaml', '.yml',
  '.html', '.css', '.scss', '.less', '.vue', '.svelte'
];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.vscode',
  '.idea',
  'coverage',
  '.replit-artifact'
];

// File patterns to exclude
const EXCLUDE_PATTERNS = [
  '*.lock',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '*.tmp',
  '*.temp'
];

function shouldExcludeDirectory(dirPath) {
  const dirName = path.basename(dirPath);
  return EXCLUDE_DIRS.includes(dirName) || dirName.startsWith('.');
}

function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath);
  return EXCLUDE_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(fileName);
  });
}

function isCodeFile(filePath) {
  const ext = path.extname(filePath);
  return CODE_EXTENSIONS.includes(ext);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldExcludeDirectory(filePath)) {
        getAllFiles(filePath, arrayOfFiles);
      }
    } else if (stat.isFile() && isCodeFile(filePath) && !shouldExcludeFile(filePath)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateTableOfContents(files, rootDir) {
  let toc = '\n## Table of Contents\n\n';
  
  const directoryMap = new Map();
  
  files.forEach(file => {
    const relativePath = path.relative(rootDir, file);
    const dir = path.dirname(relativePath);
    
    if (!directoryMap.has(dir)) {
      directoryMap.set(dir, []);
    }
    directoryMap.get(dir).push({
      name: path.basename(file),
      path: relativePath,
      fullPath: file
    });
  });
  
  const sortedDirs = Array.from(directoryMap.keys()).sort();
  
  sortedDirs.forEach(dir => {
    const dirName = dir === '.' ? 'Root' : dir;
    toc += `### ${dirName}\n\n`;
    
    directoryMap.get(dir).forEach(file => {
      const anchor = file.path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      toc += `- [${file.name}](#${anchor})\n`;
    });
    
    toc += '\n';
  });
  
  return toc;
}

function consolidateCodebase() {
  const rootDir = process.cwd();
  const outputFile = path.join(rootDir, 'CODEBASE.md');
  
  console.log('Scanning codebase...');
  const allFiles = getAllFiles(rootDir);
  
  console.log(`Found ${allFiles.length} code files to consolidate`);
  
  let content = `# Codebase Consolidation\n\n`;
  content += `Generated on: ${new Date().toISOString()}\n`;
  content += `Total files: ${allFiles.length}\n\n`;
  
  // Add table of contents
  content += generateTableOfContents(allFiles, rootDir);
  
  // Add file contents
  content += '## File Contents\n\n';
  
  allFiles.forEach(file => {
    const relativePath = path.relative(rootDir, file);
    const stats = fs.statSync(file);
    
    content += `---\n\n`;
    content += `### ${relativePath}\n\n`;
    content += `**Path:** \`${relativePath}\`\n`;
    content += `**Size:** ${formatFileSize(stats.size)}\n`;
    content += `**Modified:** ${stats.mtime.toISOString()}\n\n`;
    
    try {
      const fileContent = fs.readFileSync(file, 'utf8');
      const ext = path.extname(file);
      
      // Add language identifier for syntax highlighting
      const langMap = {
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.json': 'json',
        '.md': 'markdown',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.less': 'less',
        '.vue': 'vue',
        '.svelte': 'svelte'
      };
      
      const lang = langMap[ext] || '';
      
      content += `\`\`\`${lang}\n`;
      content += fileContent;
      content += '\n```\n\n';
    } catch (error) {
      content += `**Error reading file:** ${error.message}\n\n`;
    }
  });
  
  // Write the consolidated file
  fs.writeFileSync(outputFile, content);
  
  console.log(`✅ Codebase consolidated to: ${outputFile}`);
  console.log(`📊 Total size: ${formatFileSize(fs.statSync(outputFile).size)}`);
  
  // Print summary
  console.log('\n📋 Summary:');
  console.log(`- Total files processed: ${allFiles.length}`);
  
  const extCounts = {};
  allFiles.forEach(file => {
    const ext = path.extname(file);
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  });
  
  Object.entries(extCounts).sort((a, b) => b[1] - a[1]).forEach(([ext, count]) => {
    console.log(`- ${ext || 'no extension'}: ${count} files`);
  });
}

// Run the consolidation
if (require.main === module) {
  try {
    consolidateCodebase();
  } catch (error) {
    console.error('❌ Error consolidating codebase:', error.message);
    process.exit(1);
  }
}

module.exports = { consolidateCodebase, getAllFiles };
