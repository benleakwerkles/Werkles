import { WERKLE_OPERATING_BRIEF_DEVICE_KEY } from "@/lib/werkle/operating-brief-device";

export const BELLOWS_DEVICE_ARTIFACTS = Object.freeze([
  { kind: "shared_work", key: WERKLE_OPERATING_BRIEF_DEVICE_KEY, title: "Werkle Operating Brief", href: "/dashboard/werkles/formation", personalHref: "/dashboard/werkles/formation" },
  { kind: "bellows_tool", key: "werkles:bellows:constraint-map:v1", title: "Constraint Map", href: "/bellows/library/pitch-is-not-the-plan", personalHref: "/bellows/personal/pitch-is-not-the-plan" },
  { kind: "bellows_tool", key: "werkles:bellows:company-starter-floor:v1", title: "Company Starter Floor", href: "/bellows/library/company-starter-floor", personalHref: "/bellows/personal/company-starter-floor" },
  { kind: "bellows_tool", key: "werkles:bellows:evidence-brief:v2", title: "Evidence Brief", href: "/bellows/library/proof-before-reliance", personalHref: "/bellows/personal/proof-before-reliance" },
  { kind: "bellows_tool", key: "werkles:bellows:partnership-alignment:v1", title: "Partnership Alignment Memo", href: "/bellows/library/partnership-alignment", personalHref: "/bellows/personal/partnership-alignment" },
  { kind: "bellows_tool", key: "werkles:bellows:assumption-test:v1", title: "Assumption Test", href: "/bellows/library/assumption-test-design", personalHref: "/bellows/personal/assumption-test-design" },
  { kind: "bellows_tool", key: "werkles:bellows:supplier-comparison:v1", title: "Supplier Comparison", href: "/bellows/library/supplier-comparison", personalHref: "/bellows/personal/supplier-comparison" }
] as const);

export function bellowsDeviceArtifactForHref(href: string) {
  return BELLOWS_DEVICE_ARTIFACTS.find((artifact) => artifact.href === href) ?? null;
}
