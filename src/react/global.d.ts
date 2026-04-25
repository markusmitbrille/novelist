import type React from "react";

import type {
  MaterialCheckboxElement,
  MaterialDialogElement,
  MaterialMenuElement,
  MaterialSelectElement,
  MaterialTextFieldElement,
} from "./material-types";

type MaterialElementProps<T extends HTMLElement = HTMLElement> = React.DetailedHTMLProps<React.HTMLAttributes<T>, T> & {
  children?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
  toggle?: boolean;
  open?: boolean;
  checked?: boolean;
  quick?: boolean;
  label?: string;
  value?: string;
  type?: string;
  placeholder?: string;
  rows?: number;
  "has-overflow"?: boolean;
  "trailing-supporting-text"?: string;
  "display-text"?: string;
  positioning?: string;
  anchor?: string;
  anchorElement?: HTMLElement | null;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "md-dialog": MaterialElementProps<MaterialDialogElement>;
      "md-menu": MaterialElementProps<MaterialMenuElement>;
      "md-menu-item": MaterialElementProps;
      "md-divider": MaterialElementProps;
      "md-icon-button": MaterialElementProps;
      "md-filled-icon-button": MaterialElementProps;
      "md-filled-tonal-icon-button": MaterialElementProps;
      "md-filled-tonal-button": MaterialElementProps;
      "md-filled-button": MaterialElementProps;
      "md-text-button": MaterialElementProps;
      "md-checkbox": MaterialElementProps<MaterialCheckboxElement>;
      "md-outlined-text-field": MaterialElementProps<MaterialTextFieldElement>;
      "md-outlined-select": MaterialElementProps<MaterialSelectElement>;
      "md-select-option": MaterialElementProps;
    }
  }
}

declare global {
  interface NavigatorUAData {
    platform: string;
  }

  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

export {};
