#!/usr/bin/env node
// unity-inventory.mjs (global)
// Quick read-only inventory of a Unity project. No npm deps — pure Node.
// Resolves the Unity project root from the current working directory (process.cwd()),
// so it works when invoked from any Unity project root via:
//   node ~/.claude/tools/unity-inventory.mjs --pretty
//
// Usage:
//   node ~/.claude/tools/unity-inventory.mjs                 # print JSON to stdout
//   node ~/.claude/tools/unity-inventory.mjs out.json        # write JSON to file
//   node ~/.claude/tools/unity-inventory.mjs --pretty        # human-readable summary

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'Assets');
const PROJECT_VERSION = path.join(ROOT, 'ProjectSettings', 'ProjectVersion.txt');
const SKIP_DIRS = new Set(['Library', 'Temp', 'obj', 'bin', 'Logs', 'UserSettings', 'Build', 'Builds']);

// Guard: refuse to run unless cwd looks like a Unity project root.
if (!fs.existsSync(ASSETS) || !fs.existsSync(PROJECT_VERSION)) {
    console.error('unity-inventory: not a Unity project root.');
    console.error(`  cwd: ${ROOT}`);
    console.error('  Expected to find both Assets/ and ProjectSettings/ProjectVersion.txt here.');
    console.error('  Run from the directory that contains them (the Unity project root).');
    process.exit(1);
}

const readText = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const readJson = (p) => { const t = readText(p); return t ? JSON.parse(t) : null; };
const rel = (p) => path.relative(ROOT, p).replaceAll('\\', '/');

function walk(dir, predicate, results = []) {
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(path.join(dir, entry.name), predicate, results);
        } else if (predicate(entry.name, path.join(dir, entry.name))) {
            results.push(path.join(dir, entry.name));
        }
    }
    return results;
}

function unityVersion() {
    const text = readText(PROJECT_VERSION);
    return text?.match(/m_EditorVersion:\s*(\S+)/)?.[1] ?? 'unknown';
}

function packageList() {
    const m = readJson(path.join(ROOT, 'Packages', 'manifest.json'));
    if (!m?.dependencies) return [];
    return Object.entries(m.dependencies).map(([name, version]) => ({ name, version }));
}

function detectRenderPipeline(pkgs) {
    if (pkgs.some(p => p.name === 'com.unity.render-pipelines.universal')) return 'URP';
    if (pkgs.some(p => p.name === 'com.unity.render-pipelines.high-definition')) return 'HDRP';
    return 'Built-in';
}

function detectPlatforms() {
    const text = readText(path.join(ROOT, 'ProjectSettings', 'EditorBuildSettings.asset')) ?? '';
    const projSettings = readText(path.join(ROOT, 'ProjectSettings', 'ProjectSettings.asset')) ?? '';
    const all = text + '\n' + projSettings;
    const detected = new Set();
    if (/iOS|iPhone/i.test(all)) detected.add('iOS');
    if (/Android/i.test(all)) detected.add('Android');
    if (/Standalone|Windows|OSX|Linux/i.test(all)) detected.add('Standalone');
    if (/WebGL/i.test(all)) detected.add('WebGL');
    return [...detected];
}

function listScenes() {
    return walk(ASSETS, (n) => n.endsWith('.unity')).map(rel).sort();
}

function listAsmdefs() {
    return walk(ASSETS, (n) => n.endsWith('.asmdef'))
        .map(p => readJson(p)?.name ?? rel(p))
        .filter(Boolean)
        .sort();
}

function scriptStats() {
    const all = walk(ASSETS, (n) => n.endsWith('.cs'));
    let runtimeCount = 0, runtimeLoc = 0, editorCount = 0, editorLoc = 0;
    for (const f of all) {
        const isEditor = f.includes(`${path.sep}Editor${path.sep}`);
        const lines = (readText(f) ?? '').split('\n').length;
        if (isEditor) { editorCount++; editorLoc += lines; }
        else { runtimeCount++; runtimeLoc += lines; }
    }
    return {
        total: all.length,
        runtime: { count: runtimeCount, loc: runtimeLoc },
        editor: { count: editorCount, loc: editorLoc }
    };
}

function countByExt(ext) {
    return walk(ASSETS, (n) => n.endsWith(ext)).length;
}

const pkgs = packageList();
const result = {
    generatedAt: new Date().toISOString(),
    projectRoot: ROOT,
    unityVersion: unityVersion(),
    renderPipeline: detectRenderPipeline(pkgs),
    platforms: detectPlatforms(),
    packages: {
        total: pkgs.length,
        list: pkgs.map(p => `${p.name}@${p.version}`).sort()
    },
    scenes: listScenes(),
    asmdefs: listAsmdefs(),
    counts: {
        prefab: countByExt('.prefab'),
        scriptableObjectAsset: countByExt('.asset'),
        material: countByExt('.mat'),
        shader: countByExt('.shader'),
        animation: countByExt('.anim'),
        animatorController: countByExt('.controller')
    },
    scripts: scriptStats()
};

const args = process.argv.slice(2);
const pretty = args.includes('--pretty');
const outPath = args.find(a => !a.startsWith('--'));

if (pretty) {
    const r = result;
    console.log(`Unity Project Inventory`);
    console.log(`=======================`);
    console.log(`Unity:        ${r.unityVersion}`);
    console.log(`Pipeline:     ${r.renderPipeline}`);
    console.log(`Platforms:    ${r.platforms.join(', ') || '(none detected)'}`);
    console.log(`Packages:     ${r.packages.total}`);
    console.log(`Scenes:       ${r.scenes.length}`);
    r.scenes.forEach(s => console.log(`  - ${s}`));
    console.log(`Asmdefs:      ${r.asmdefs.length}`);
    r.asmdefs.slice(0, 20).forEach(a => console.log(`  - ${a}`));
    if (r.asmdefs.length > 20) console.log(`  … +${r.asmdefs.length - 20} more`);
    console.log(`Prefabs:      ${r.counts.prefab}`);
    console.log(`Materials:    ${r.counts.material}`);
    console.log(`Shaders:      ${r.counts.shader}`);
    console.log(`Animations:   ${r.counts.animation}`);
    console.log(`.asset files: ${r.counts.scriptableObjectAsset}  (rough SO count)`);
    console.log(`Scripts:      ${r.scripts.total} files, ${r.scripts.runtime.loc + r.scripts.editor.loc} LOC`);
    console.log(`  runtime:    ${r.scripts.runtime.count} files, ${r.scripts.runtime.loc} LOC`);
    console.log(`  editor:     ${r.scripts.editor.count} files, ${r.scripts.editor.loc} LOC`);
} else {
    const out = JSON.stringify(result, null, 2);
    if (outPath) {
        fs.writeFileSync(outPath, out);
        console.error(`Written: ${outPath}`);
    } else {
        console.log(out);
    }
}
