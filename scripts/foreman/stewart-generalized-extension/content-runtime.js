(() => {
  "use strict";
  const exactKeys = (value, keys) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const actual = Object.keys(value).sort(); const expected = [...keys].sort();
    return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
  };
  const descriptorValid = (descriptor) => {
    if (!exactKeys(descriptor, ["field_descriptors", "final_control_descriptor", "readback_descriptors", "schema"])
      || descriptor.schema !== "pookakind.stewart-provider-surface-descriptor/v1"
      || !Array.isArray(descriptor.field_descriptors) || descriptor.field_descriptors.length < 1 || descriptor.field_descriptors.length > 6
      || !Array.isArray(descriptor.readback_descriptors) || descriptor.readback_descriptors.length < 1 || descriptor.readback_descriptors.length > 7
      || !exactKeys(descriptor.final_control_descriptor, ["control_sha256", "selector"])) return false;
    for (const field of descriptor.field_descriptors) if (!exactKeys(field, ["control_sha256", "role", "selector"]) || typeof field.selector !== "string") return false;
    for (const item of descriptor.readback_descriptors) if (!exactKeys(item, ["response_class", "selector"]) || typeof item.selector !== "string") return false;
    return true;
  };
  const exactElement = (selector) => {
    let matches;
    try { matches = [...document.querySelectorAll(selector)]; } catch { throw new Error("STEWART_EXTENSION_SELECTOR_INVALID"); }
    if (matches.length !== 1) throw new Error("STEWART_EXTENSION_CONTROL_NOT_EXACT");
    return matches[0];
  };
  const inspect = (descriptor) => {
    if (!descriptorValid(descriptor)) throw new Error("STEWART_EXTENSION_DESCRIPTOR_INVALID");
    const fields = descriptor.field_descriptors.map((item) => ({ item, element: exactElement(item.selector) }));
    const finalControl = exactElement(descriptor.final_control_descriptor.selector);
    const credentialInputs = [...document.querySelectorAll('input:not([type]), input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="number"]')];
    if (credentialInputs.length !== fields.length || fields.some(({ element }) => !(element instanceof HTMLInputElement))) throw new Error("STEWART_EXTENSION_FIELD_SCOPE_NOT_EXACT");
    if (!(finalControl instanceof HTMLElement) || finalControl.matches(":disabled")) throw new Error("STEWART_EXTENSION_FINAL_CONTROL_NOT_AVAILABLE");
    return { fields, finalControl };
  };
  const observe = (descriptor) => {
    const current = inspect(descriptor);
    return {
      schema: "pookakind.stewart-extension-dom-observation/v1",
      field_controls: current.fields.map(({ item }) => ({ role: item.role, control_sha256: item.control_sha256 })),
      final_control_sha256: descriptor.final_control_descriptor.control_sha256,
      foreground_unchanged: true,
      unexpected_field_count: 0,
      secret_material_present: false
    };
  };
  const execute = (descriptor, fields) => {
    const suppliedFields = Array.isArray(fields) ? fields : null;
    let current = null; let setter = null; let originals = null;
    let finalControlInvoked = false;
    try {
      current = inspect(descriptor);
      if (!suppliedFields || suppliedFields.length !== current.fields.length) throw new Error("STEWART_EXTENSION_MATERIAL_SCOPE_INVALID");
      setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (typeof setter !== "function") throw new Error("STEWART_EXTENSION_VALUE_SETTER_UNAVAILABLE");
      originals = current.fields.map(({ element }) => element.value);
      for (let index = 0; index < suppliedFields.length; index++) {
        const supplied = suppliedFields[index]; const expected = current.fields[index];
        if (!exactKeys(supplied, ["material", "role"]) || supplied.role !== expected.item.role || typeof supplied.material !== "string" || supplied.material.length < 1 || supplied.material.length > 4096) throw new Error("STEWART_EXTENSION_MATERIAL_SCOPE_INVALID");
        if (/^EMAIL_OTP_DIGIT_[1-6]$/.test(supplied.role) && !/^\d$/.test(supplied.material)) throw new Error("STEWART_EXTENSION_MATERIAL_SCOPE_INVALID");
      }
      for (let index = 0; index < suppliedFields.length; index++) {
        setter.call(current.fields[index].element, suppliedFields[index].material);
        current.fields[index].element.dispatchEvent(new Event("input", { bubbles: true }));
        current.fields[index].element.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const rechecked = inspect(descriptor);
      rechecked.finalControl.click();
      finalControlInvoked = true;
      return {
        schema: "pookakind.stewart-extension-dom-execution/v1",
        field_count: suppliedFields.length,
        field_roles: descriptor.field_descriptors.map(({ role }) => role),
        final_control_invoked: true,
        foreground_changed: false,
        input_devices_touched: false,
        secret_material_exposed: false
      };
    } catch (error) {
      if (!finalControlInvoked && current && Array.isArray(originals) && typeof setter === "function") {
        for (let index = 0; index < current.fields.length; index++) {
          try { setter.call(current.fields[index].element, originals[index]); } catch { /* best-effort pre-submit rollback */ }
        }
      }
      throw error;
    } finally {
      if (suppliedFields) for (const supplied of suppliedFields) if (supplied && typeof supplied === "object" && Object.hasOwn(supplied, "material")) supplied.material = null;
    }
  };
  const readback = (descriptor) => {
    if (!descriptorValid(descriptor)) throw new Error("STEWART_EXTENSION_DESCRIPTOR_INVALID");
    const matches = [];
    for (const item of descriptor.readback_descriptors) {
      let count;
      try { count = document.querySelectorAll(item.selector).length; } catch { throw new Error("STEWART_EXTENSION_SELECTOR_INVALID"); }
      if (count > 1) throw new Error("STEWART_EXTENSION_READBACK_NOT_EXACT");
      if (count === 1) matches.push(item.response_class);
    }
    return {
      schema: "pookakind.stewart-extension-dom-readback/v1",
      response_class: matches.length === 1 ? matches[0] : "OUTCOME_UNKNOWN",
      secret_material_exposed: false
    };
  };
  Object.defineProperty(globalThis, "PookaKindStewartExtensionRuntime", { value: Object.freeze({ observe, execute, readback }), configurable: false, writable: false });
})();
