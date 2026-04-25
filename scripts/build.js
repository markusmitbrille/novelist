const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const docsDir = path.join(root, "docs");

async function bundleApp() {
  const result = await esbuild.build({
    entryPoints: [path.join(srcDir, "main.tsx")],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["es2022"],
    minify: true,
    write: false,
    legalComments: "none",
  });

  return result.outputFiles[0].text;
}

function escapeInlineScript(source) {
  return String(source)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}

function renderHtml(bundle) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Novelist is a local markdown editor for Chromium-based browsers.">
  <title>Novelist</title>
</head>
<body>
  <script>${escapeInlineScript(bundle)}</script>
</body>
</html>
`;
}

async function main() {
  fs.mkdirSync(docsDir, { recursive: true });
  const appBundle = await bundleApp();
  fs.writeFileSync(path.join(docsDir, "index.html"), renderHtml(appBundle), "utf8");
  console.log("built docs\\index.html");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
