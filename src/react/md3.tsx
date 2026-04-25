import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

import {
  getMaterialChecked,
  getMaterialValue,
  type MaterialCheckboxElement,
  type MaterialDialogElement,
  type MaterialMenuElement,
  type MaterialSelectElement,
  type MaterialTextFieldElement,
} from "./material-types";

type ListenerMap = Record<string, EventListener | undefined>;
type MaterialBaseProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  quick?: boolean;
  label?: string;
  value?: string;
  placeholder?: string;
  type?: string;
  rows?: number;
  disabled?: boolean;
  positioning?: "fixed" | "popover";
  "has-overflow"?: boolean;
};

function useElementListeners<T extends HTMLElement>(ref: React.RefObject<T | null>, listeners: ListenerMap) {
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    for (const [name, listener] of Object.entries(listeners)) {
      if (listener) {
        element.addEventListener(name, listener);
      }
    }
    return () => {
      for (const [name, listener] of Object.entries(listeners)) {
        if (listener) {
          element.removeEventListener(name, listener);
        }
      }
    };
  }, [ref, listeners]);
}

function useForwardedRef<T>(forwardedRef: React.ForwardedRef<T>) {
  const innerRef = useRef<T | null>(null);
  useImperativeHandle(forwardedRef, () => innerRef.current as T, []);
  return innerRef;
}

function withProgrammaticSyncGuard<T extends Event>(
  syncingRef: React.MutableRefObject<boolean>,
  handler?: (event: T) => void
) {
  if (!handler) {
    return undefined;
  }
  return (event: T) => {
    if (syncingRef.current) {
      return;
    }
    handler(event);
  };
}

export const MdDialog = forwardRef<MaterialDialogElement, MaterialBaseProps & {
  open?: boolean;
  onClosed?: (event: Event) => void;
}>(({ open = false, onClosed, children, ...props }, forwardedRef) => {
  const ref = useForwardedRef<MaterialDialogElement>(forwardedRef);
  const listeners = useMemo(() => ({
    closed: onClosed,
  }), [onClosed]);

  useElementListeners(ref, listeners);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    if (open && !element.open) {
      element.show();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open, ref]);

  return React.createElement("md-dialog", { ref, ...props }, children);
});

export const MdMenu = forwardRef<MaterialMenuElement, MaterialBaseProps & {
  open?: boolean;
  anchorElement?: HTMLElement | null;
  onClosed?: (event: Event) => void;
  onCloseMenu?: (event: Event) => void;
}>(({ open = false, anchorElement, onClosed, onCloseMenu, children, ...props }, forwardedRef) => {
  const ref = useForwardedRef<MaterialMenuElement>(forwardedRef);
  const listeners = useMemo(() => ({
    closed: onClosed,
    "close-menu": onCloseMenu,
  }), [onClosed, onCloseMenu]);

  useElementListeners(ref, listeners);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    element.anchorElement = anchorElement ?? null;
    if (open && !element.open) {
      element.show();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open, anchorElement, ref]);

  return React.createElement("md-menu", { ref, ...props }, children);
});

type TextFieldProps = MaterialBaseProps & {
  id?: string;
  className?: string;
  onInputValue?: (value: string, event: Event) => void;
  onChangeValue?: (value: string, event: Event) => void;
};

export const MdOutlinedTextField = forwardRef<MaterialTextFieldElement, TextFieldProps>(({
  value = "",
  disabled,
  onInputValue,
  onChangeValue,
  children,
  ...props
}, forwardedRef) => {
  const ref = useForwardedRef<MaterialTextFieldElement>(forwardedRef);
  const syncingValueRef = useRef(false);
  const listeners = useMemo(() => ({
    input: withProgrammaticSyncGuard(syncingValueRef, onInputValue
      ? ((event: Event) => onInputValue(getMaterialValue(event), event))
      : undefined),
    change: withProgrammaticSyncGuard(syncingValueRef, onChangeValue
      ? ((event: Event) => onChangeValue(getMaterialValue(event), event))
      : undefined),
  }), [onInputValue, onChangeValue]);

  useElementListeners(ref, listeners);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    if (element.value !== value) {
      syncingValueRef.current = true;
      element.value = value;
      syncingValueRef.current = false;
    }
    element.disabled = Boolean(disabled);
  }, [value, disabled, ref]);

  return React.createElement("md-outlined-text-field", { ref, ...props }, children);
});

export const MdOutlinedSelect = forwardRef<MaterialSelectElement, MaterialBaseProps & {
  value?: string;
  onChangeValue?: (value: string, event: Event) => void;
}>(({ value = "", onChangeValue, children, ...props }, forwardedRef) => {
  const ref = useForwardedRef<MaterialSelectElement>(forwardedRef);
  const syncingValueRef = useRef(false);
  const listeners = useMemo(() => ({
    change: withProgrammaticSyncGuard(syncingValueRef, onChangeValue
      ? ((event: Event) => onChangeValue(getMaterialValue(event), event))
      : undefined),
  }), [onChangeValue]);

  useElementListeners(ref, listeners);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    if (element.value !== value) {
      syncingValueRef.current = true;
      element.value = value;
      syncingValueRef.current = false;
    }
  }, [value, ref]);

  return React.createElement("md-outlined-select", { ref, ...props }, children);
});

export const MdCheckbox = forwardRef<MaterialCheckboxElement, MaterialBaseProps & {
  checked?: boolean;
  onChangeChecked?: (checked: boolean, event: Event) => void;
}>(({ checked = false, onChangeChecked, ...props }, forwardedRef) => {
  const ref = useForwardedRef<MaterialCheckboxElement>(forwardedRef);
  const syncingCheckedRef = useRef(false);
  const listeners = useMemo(() => ({
    change: withProgrammaticSyncGuard(syncingCheckedRef, onChangeChecked
      ? ((event: Event) => onChangeChecked(getMaterialChecked(event), event))
      : undefined),
  }), [onChangeChecked]);

  useElementListeners(ref, listeners);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const nextChecked = Boolean(checked);
    if (element.checked !== nextChecked) {
      syncingCheckedRef.current = true;
      element.checked = nextChecked;
      syncingCheckedRef.current = false;
    }
  }, [checked, ref]);

  return React.createElement("md-checkbox", { ref, ...props });
});
