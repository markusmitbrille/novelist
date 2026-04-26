import React, { useRef, useState } from "react";

import { MENU_ORDER } from "../../constants";
import { getMenuItems, getMenuShortcut } from "../../menu";
import { icon } from "../head-assets";
import { MdMenu } from "../md3";

type MenubarProps = {
  displayName: string;
  saveStatus: string;
  caret: { offset: number; line: number; column: number };
  wordCount: number;
  onAppLogoClick: () => void;
  onMenuAction: (action: string) => void | Promise<void>;
};

function menuLabel(name: string) {
  return name[0].toUpperCase() + name.slice(1);
}

export function Menubar(props: MenubarProps) {
  const { displayName, saveStatus, caret, wordCount, onAppLogoClick, onMenuAction } = props;
  const menuAnchorsRef = useRef<Record<string, HTMLElement | null>>({});
  const [openMenuName, setOpenMenuName] = useState<string | null>(null);

  function closeAllMenus() {
    setOpenMenuName(null);
  }

  return (
    <header className="menubar">
      <div className="menubar__brand">
        <md-icon-button id="appLogoButton" aria-label="About Novelist" data-tooltip="About Novelist" onClick={onAppLogoClick}>{icon("edit_document")}</md-icon-button>
      </div>
      <div className="menubar__menus" id="menubarMenus">
        {MENU_ORDER.map((name) => (
          <button
            key={name}
            type="button"
            id={`${name}MenuButton`}
            className="menubar__menu-trigger"
            data-menu-trigger={name}
            ref={(element) => { menuAnchorsRef.current[name] = element; }}
            onPointerDown={(event) => {
              event.preventDefault();
              setOpenMenuName(openMenuName === name ? null : name);
            }}
            onMouseEnter={() => {
              if (openMenuName && openMenuName !== name) {
                setOpenMenuName(name);
              }
            }}
          >
            {menuLabel(name)}
          </button>
        ))}
      </div>
      <div className="menubar__status">
        <span id="toolbarStatus" className="menubar__status-text">{saveStatus}</span>
        <span className="menubar__caret-text">{`${displayName} | Line ${caret.line}, Col ${caret.column} | ${wordCount.toLocaleString()} words`}</span>
      </div>
      {MENU_ORDER.map((menuName) => (
        <MdMenu
          key={menuName}
          id={`${menuName}Menu`}
          anchorElement={menuAnchorsRef.current[menuName]}
          open={openMenuName === menuName}
          positioning="popover"
          quick
          onClosed={() => setOpenMenuName((current) => current === menuName ? null : current)}
        >
          {getMenuItems(menuName).map((item) => {
            if (item.divider) {
              return <md-divider key={item.action}></md-divider>;
            }
            return (
              <md-menu-item
                key={item.action}
                data-menu-action={item.action}
                disabled={item.disabled}
                onClick={async () => {
                  if (item.disabled) {
                    return;
                  }
                  await onMenuAction(item.action);
                  closeAllMenus();
                }}
              >
                {item.label}
                {getMenuShortcut(item.action) ? <span className="menu-shortcut" slot="trailing-supporting-text">{getMenuShortcut(item.action)}</span> : null}
              </md-menu-item>
            );
          })}
        </MdMenu>
      ))}
    </header>
  );
}
