import "@material/web/all.js";
import "./styles.css";

import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { installHeadAssets } from "./react/head-assets";

installHeadAssets();

const mountNode = document.createElement("div");
mountNode.id = "novelist-root";
document.body.replaceChildren(mountNode);

createRoot(mountNode).render(<App />);
