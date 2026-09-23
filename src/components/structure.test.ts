// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ComponentsRoot = path.join(process.cwd(), 'src', 'components');
const CatalogueDocument = path.join(process.cwd(), 'docs', 'architecture', 'components.md');
const ValueExport = /^export \{([^}]*)\} from/gm;
const Modules = ['finance', 'shell', 'ui'];
const RootFiles = ['structure.test.ts'];
const KebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const ModuleRootFile = /^[a-z][a-z0-9-]*(\.test)?\.ts$/;
const StylesheetSuffix = '.scss';
const ModuleStylesheetSuffix = '.module.scss';

const entries = (directory: string) =>
  readdirSync(directory).sort((left, right) => left.localeCompare(right));

const isDirectory = (entry: string) => statSync(entry).isDirectory();

const componentFolders = (moduleName: string) =>
  entries(path.join(ComponentsRoot, moduleName)).filter(entry =>
    isDirectory(path.join(ComponentsRoot, moduleName, entry))
  );

const requiredFileProblems = (folder: string, files: string[]) =>
  [
    { missing: !KebabCase.test(folder), problem: 'folder name is not kebab-case' },
    { missing: !files.includes(`${folder}.tsx`), problem: `missing ${folder}.tsx` },
    { missing: !files.includes(`${folder}.test.tsx`), problem: `missing ${folder}.test.tsx` },
    { missing: !files.includes('index.ts'), problem: 'missing index.ts' },
  ]
    .filter(check => check.missing)
    .map(check => check.problem);

const fileProblem = (folderPath: string, file: string, files: string[]) => {
  if (isDirectory(path.join(folderPath, file))) return `nested folder ${file}`;

  if (file.endsWith(ModuleStylesheetSuffix) || file.endsWith('.css')) {
    return `${file}: use a plain <name>.scss stylesheet with BEM class strings`;
  }

  if (file.endsWith(StylesheetSuffix)) {
    const owner = `${file.slice(0, -StylesheetSuffix.length)}.tsx`;

    return files.includes(owner) ? null : `${file} has no ${owner}`;
  }

  return null;
};

const folderContentProblems = (folderPath: string) => {
  const files = entries(folderPath);

  return files.map(file => fileProblem(folderPath, file, files)).filter(Boolean);
};

describe('src/components layout', () => {
  it('holds only the component modules', () => {
    const unexpected = entries(ComponentsRoot).filter(
      entry => !Modules.includes(entry) && !RootFiles.includes(entry)
    );

    expect(unexpected).toEqual([]);
  });

  it('gives every stylesheet a block name that is unique across modules', () => {
    const stylesheets = Modules.flatMap(moduleName =>
      componentFolders(moduleName).flatMap(folder =>
        entries(path.join(ComponentsRoot, moduleName, folder)).filter(file =>
          file.endsWith(StylesheetSuffix)
        )
      )
    );

    const duplicates = stylesheets.filter((file, index) => stylesheets.indexOf(file) !== index);

    expect(duplicates).toEqual([]);
  });

  describe.each(Modules)('%s/', moduleName => {
    const moduleRoot = path.join(ComponentsRoot, moduleName);

    it('keeps only index.ts, plain .ts modules and component folders at its root', () => {
      const unexpected = entries(moduleRoot).filter(
        entry => !isDirectory(path.join(moduleRoot, entry)) && !ModuleRootFile.test(entry)
      );

      expect(unexpected).toEqual([]);
      expect(entries(moduleRoot)).toContain('index.ts');
    });

    it('re-exports every component folder from its barrel', () => {
      const barrel = readFileSync(path.join(moduleRoot, 'index.ts'), 'utf8');

      const missing = componentFolders(moduleName).filter(
        folder => !barrel.includes(`from './${folder}'`)
      );

      expect(missing).toEqual([]);
    });

    it.each(componentFolders(moduleName))('%s/ follows the component folder contract', folder => {
      const problems = [
        ...requiredFileProblems(folder, entries(path.join(moduleRoot, folder))),
        ...folderContentProblems(path.join(moduleRoot, folder)),
      ];

      expect(problems).toEqual([]);
    });
  });

  it('lists every ui component in the catalogue of docs/architecture/components.md', () => {
    const catalogue = readFileSync(CatalogueDocument, 'utf8');

    const missing = componentFolders('ui').filter(folder => {
      const barrel = readFileSync(path.join(ComponentsRoot, 'ui', folder, 'index.ts'), 'utf8');

      const names = [...barrel.matchAll(ValueExport)].flatMap(match =>
        match[1].split(',').map(name => name.trim())
      );

      return !names.some(name => catalogue.includes(`\`${name}`));
    });

    expect(missing).toEqual([]);
  });
});
