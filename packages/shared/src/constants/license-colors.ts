// packages/shared/src/constants/license-colors.ts

export const LICENSE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  MIT: { bg: "#22c55e20", text: "#22c55e", label: "MIT" },
  "Apache-2.0": { bg: "#3b82f620", text: "#3b82f6", label: "Apache 2.0" },
  "BSD-2-Clause": { bg: "#14b8a620", text: "#14b8a6", label: "BSD-2" },
  "BSD-3-Clause": { bg: "#14b8a620", text: "#14b8a6", label: "BSD-3" },
  "AGPL-3.0": { bg: "#f9731620", text: "#f97316", label: "AGPL-3" },
  "GPL-2.0": { bg: "#f59e0b20", text: "#f59e0b", label: "GPL-2" },
  "GPL-3.0": { bg: "#f59e0b20", text: "#f59e0b", label: "GPL-3" },
  "LGPL-2.1": { bg: "#f59e0b20", text: "#f59e0b", label: "LGPL-2.1" },
  "LGPL-3.0": { bg: "#f59e0b20", text: "#f59e0b", label: "LGPL-3" },
  "BSL-1.1": { bg: "#ef444420", text: "#ef4444", label: "BSL" },
  "SSPL-1.0": { bg: "#ef444420", text: "#ef4444", label: "SSPL" },
  UNLICENSED: { bg: "#6b728020", text: "#6b7280", label: "None" },
};

export function getLicenseColor(spdx: string | null): (typeof LICENSE_COLORS)[string] {
  if (!spdx) return { bg: "#6b728020", text: "#6b7280", label: "Unknown" };
  return LICENSE_COLORS[spdx] || { bg: "#6b728020", text: "#6b7280", label: spdx };
}
