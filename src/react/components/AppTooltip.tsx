import React, { useEffect, useRef, useState } from "react";

type TooltipState = {
  label: string;
  style: Record<string, string>;
  side: "top" | "bottom";
  visible: boolean;
};

function getTooltipTarget(node: EventTarget | null) {
  return (node instanceof HTMLElement ? node.closest("[data-tooltip]") : null) as HTMLElement | null;
}

function computeTooltipPosition(target: HTMLElement, tooltip: HTMLElement) {
  const targetRect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const margin = 12;
  const spacing = 10;
  const centeredLeft = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
  const left = Math.max(margin, Math.min(centeredLeft, window.innerWidth - tooltipRect.width - margin));
  let top = targetRect.top - tooltipRect.height - spacing;
  let side: "top" | "bottom" = "top";
  if (top < margin) {
    top = Math.min(targetRect.bottom + spacing, window.innerHeight - tooltipRect.height - margin);
    side = "bottom";
  }
  return {
    side,
    style: {
      left: `${left}px`,
      top: `${Math.max(margin, top)}px`,
    },
  };
}

export function AppTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const showTimerRef = useRef<number | null>(null);

  function clearShowTimer() {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }

  function hideTooltip() {
    clearShowTimer();
    activeTargetRef.current = null;
    setTooltip(null);
  }

  function showTooltip(target: HTMLElement) {
    const label = target.getAttribute("data-tooltip");
    const tooltipElement = tooltipRef.current;
    if (!label || !tooltipElement) {
      return;
    }
    activeTargetRef.current = target;
    setTooltip({
      label,
      style: { left: "0px", top: "0px" },
      side: "top",
      visible: false,
    });
    requestAnimationFrame(() => {
      if (!tooltipRef.current || activeTargetRef.current !== target) {
        return;
      }
      const positioned = computeTooltipPosition(target, tooltipRef.current);
      setTooltip({
        label,
        style: positioned.style,
        side: positioned.side,
        visible: true,
      });
    });
  }

  function scheduleTooltip(target: HTMLElement | null, delay = 550) {
    clearShowTimer();
    if (!target) {
      return;
    }
    showTimerRef.current = window.setTimeout(() => {
      showTooltip(target);
    }, delay);
  }

  useEffect(() => {
    const handlePointerOver = (event: PointerEvent) => {
      const target = getTooltipTarget(event.target);
      if (!target) {
        return;
      }
      if (activeTargetRef.current && activeTargetRef.current !== target && tooltip?.visible) {
        showTooltip(target);
        return;
      }
      scheduleTooltip(target, activeTargetRef.current === target ? 0 : 550);
    };

    const handlePointerOut = (event: PointerEvent) => {
      const target = getTooltipTarget(event.target);
      const nextTarget = getTooltipTarget(event.relatedTarget);
      if (!target) {
        return;
      }
      if (nextTarget && target !== nextTarget) {
        if (activeTargetRef.current === target && tooltip?.visible) {
          showTooltip(nextTarget);
        } else {
          scheduleTooltip(nextTarget, 550);
        }
        return;
      }
      if (target === nextTarget) {
        return;
      }
      if (activeTargetRef.current === target) {
        hideTooltip();
        return;
      }
      clearShowTimer();
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = getTooltipTarget(event.target);
      if (target) {
        showTooltip(target);
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = getTooltipTarget(event.target);
      const nextTarget = getTooltipTarget(event.relatedTarget);
      if (target && target !== nextTarget && activeTargetRef.current === target) {
        hideTooltip();
      }
    };

    const handleWindowChange = () => {
      if (!activeTargetRef.current || !tooltipRef.current || !tooltip) {
        return;
      }
      const positioned = computeTooltipPosition(activeTargetRef.current, tooltipRef.current);
      setTooltip((current) => current ? { ...current, style: positioned.style, side: positioned.side } : current);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideTooltip();
      }
    };

    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      clearShowTimer();
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("pointerout", handlePointerOut, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [tooltip]);

  return (
    <div
      id="appTooltip"
      ref={tooltipRef}
      className={`app-tooltip${tooltip?.visible ? " is-visible" : ""}`}
      data-side={tooltip?.side || "top"}
      role="tooltip"
      hidden={!tooltip}
      style={{
        ...(tooltip?.style || {}),
        visibility: tooltip?.visible ? "visible" : "hidden",
      }}
    >
      <div id="appTooltipLabel" className="app-tooltip__label">{tooltip?.label || ""}</div>
    </div>
  );
}
