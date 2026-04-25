export type MaterialDialogElement = HTMLElement & {
  open: boolean;
  show: () => void;
  close: () => void;
};

export type MaterialMenuElement = MaterialDialogElement & {
  anchorElement: HTMLElement | null;
};

export type MaterialTextFieldElement = HTMLElement & {
  value: string;
  disabled: boolean;
  focus: () => void;
  select?: () => void;
};

export type MaterialSelectElement = HTMLElement & {
  value: string;
};

export type MaterialCheckboxElement = HTMLElement & {
  checked: boolean;
};

export function getMaterialValue(event: Event) {
  return String((event.currentTarget as MaterialTextFieldElement | MaterialSelectElement | null)?.value ?? "");
}

export function getMaterialChecked(event: Event) {
  return Boolean((event.currentTarget as MaterialCheckboxElement | null)?.checked);
}
