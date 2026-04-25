function cloneWithJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export function cloneValue(value) {
  if (value == null) {
    return value;
  }
  if (typeof globalThis.structuredClone === "function") {
    try {
      return globalThis.structuredClone(value);
    } catch {
      return cloneWithJson(value);
    }
  }
  return cloneWithJson(value);
}
