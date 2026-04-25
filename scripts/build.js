const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const docsDir = path.join(root, "docs");
const assetsDir = path.join(docsDir, "assets");

async function bundleApp() {
  return await esbuild.build({
    entryPoints: [path.join(srcDir, "main.tsx")],
    bundle: true,
    outdir: assetsDir,
    entryNames: "novelist-[hash]",
    assetNames: "asset-[hash]",
    format: "iife",
    platform: "browser",
    target: ["es2022"],
    minify: true,
    write: false,
    legalComments: "none",
  });
}

function hashAsset(source) {
  return crypto.createHash("sha256").update(source).digest("hex").slice(0, 10);
}

function renderHtml(scriptFileName, styleFileName) {
  const stylesheet = styleFileName ? `  <link rel="stylesheet" href="./assets/${styleFileName}">\n` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Novelist is a local markdown editor for Chromium-based browsers.">
  <title>Novelist</title>
${stylesheet}  <script src="./assets/${scriptFileName}" defer></script>
</head>
<body>
  <div id="novelist-root"></div>
</body>
</html>
`;
}

async function main() {
  fs.mkdirSync(docsDir, { recursive: true });
  fs.rmSync(assetsDir, { recursive: true, force: true });
  fs.mkdirSync(assetsDir, { recursive: true });
  const result = await bundleApp();
  const writtenFiles = [];
  for (const outputFile of result.outputFiles) {
    const ext = path.extname(outputFile.path);
    const hash = hashAsset(outputFile.contents);
    const fileName = ext === ".css" ? `novelist-${hash}.css` : `novelist-${hash}${ext}`;
    fs.writeFileSync(path.join(assetsDir, fileName), outputFile.contents);
    writtenFiles.push(fileName);
  }
  const scriptFileName = writtenFiles.find((fileName) => fileName.endsWith(".js"));
  const styleFileName = writtenFiles.find((fileName) => fileName.endsWith(".css"));
  if (!scriptFileName) {
    throw new Error("Build did not produce a JavaScript asset.");
  }
  fs.writeFileSync(path.join(docsDir, "index.html"), renderHtml(scriptFileName, styleFileName), "utf8");
  console.log(`built docs\\index.html and ${writtenFiles.map((fileName) => `docs\\assets\\${fileName}`).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
