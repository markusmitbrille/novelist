export function ensureHeadAsset(id: string, tagName: string, attributes: Record<string, string>) {
  if (document.getElementById(id)) {
    return;
  }
  const element = document.createElement(tagName);
  element.id = id;
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  document.head.appendChild(element);
}

export function installHeadAssets() {
  ensureHeadAsset("novelist-google-fonts-preconnect", "link", {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  });
  ensureHeadAsset("novelist-google-fonts-preconnect-static", "link", {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossorigin: "",
  });
  ensureHeadAsset("novelist-google-fonts", "link", {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0&family=Noto+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Noto+Serif:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Lora:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap",
  });
}

export function icon(name: string) {
  return <span className="material-symbols-rounded" aria-hidden="true">{name}</span>;
}
