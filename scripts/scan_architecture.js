import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const outputFile = path.join(__dirname, '../src/data/architecture_map.js');

const modules = {
  pages: { dir: 'pages', color: '#6366f1', icon: 'Layout' },
  components: { dir: 'components', color: '#0ea5e9', icon: 'Box' },
  services: { dir: 'services', color: '#16a34a', icon: 'Activity' },
  hooks: { dir: 'hooks', color: '#f59e0b', icon: 'Zap' },
  store: { dir: 'store', color: '#7c3aed', icon: 'Database' },
  layouts: { dir: 'layouts', color: '#ec4899', icon: 'Columns' },
};

function scan() {
  const data = {
    nodes: [],
    edges: []
  };

  const fileToId = {};

  Object.entries(modules).forEach(([key, config]) => {
    const dirPath = path.join(srcDir, config.dir);
    if (fs.existsSync(dirPath)) {
      const dirEntries = fs.readdirSync(dirPath);
      dirEntries.forEach(file => {
        if (!file.endsWith('.jsx') && !file.endsWith('.js')) return;
        
        const id = `${key}_${file.replace(/\.(jsx|js)$/, '').toLowerCase()}`;
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        fileToId[file] = id;
        fileToId[file.replace(/\.(jsx|js)$/, '')] = id;

        data.nodes.push({
          id,
          module: key,
          label: file.replace(/\.(jsx|js)$/, ''),
          sub: config.dir.toUpperCase(),
          icon: config.icon,
          color: config.color,
          imports: extractImports(content)
        });
      });
    }
  });

  // Second pass for edges
  data.nodes.forEach(node => {
    node.imports.forEach(imp => {
      // Find matching node ID by comparing the end of the path or the filename
      const match = data.nodes.find(n => n.label === imp || n.id.endsWith(imp.toLowerCase()));
      if (match && match.id !== node.id) {
        data.edges.push({
          id: `e-${node.id}-${match.id}`,
          source: node.id,
          target: match.id
        });
      }
    });
  });

  const outputContent = `export const architectureMap = ${JSON.stringify(data, null, 2)};`;
  
  const dataDir = path.dirname(outputFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(outputFile, outputContent);
  console.log('Architecture map generated successfully!');
}

function extractImports(content) {
  const importRegex = /import .* from ['"](.*)['"]/g;
  const matches = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const parts = match[1].split('/');
    const lastPart = parts[parts.length - 1].replace(/\.(jsx|js)$/, '');
    matches.push(lastPart);
  }
  return matches;
}

scan();
