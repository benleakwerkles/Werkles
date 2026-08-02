export type SiteIconId =
  | "lane-builder"
  | "lane-operator"
  | "lane-backer"
  | "lane-connector"
  | "lane-spark"
  | "nav-people"
  | "nav-how"
  | "nav-proof"
  | "nav-dues"
  | "nav-bellows"
  | "nav-deck"
  | "step-dossier"
  | "step-fit"
  | "step-knock"
  | "icon-armory"
  | "icon-blueprint"
  | "icon-deck"
  | "icon-dossier"
  | "icon-knock"
  | "icon-register"
  | "product-bellows"
  | "product-workshop"
  | "product-profile"
  | "product-intros"
  | "product-proof"
  | "product-membership"
  | "check-identity"
  | "check-funds"
  | "check-license"
  | "check-employment"
  | "check-reference";

export type SiteIconSize = "sm" | "md" | "lg";

type SiteIconRecord = {
  id: SiteIconId;
  filename: string;
  publicPath: string;
};

const iconRoot = "/assets/draft/icons";
const productIconRoot = "/assets/brand/product-icons/lady-jessica-v1";
/* clear-v1: the one-second-rule icon family (Ben + red-team, 2026-08-02).
   Every icon is an object a stranger names instantly. */
const clearIconRoot = "/assets/brand/product-icons/clear-v1";

export const siteIcons: Record<SiteIconId, SiteIconRecord> = {
  "lane-builder": { id: "lane-builder", filename: "icon-builder-hammer.png", publicPath: `${clearIconRoot}/icon-builder-hammer.png` },
  "lane-operator": { id: "lane-operator", filename: "icon-operator-clipboard.png", publicPath: `${clearIconRoot}/icon-operator-clipboard.png` },
  "lane-backer": { id: "lane-backer", filename: "icon-backer-coins.png", publicPath: `${clearIconRoot}/icon-backer-coins.png` },
  "lane-connector": { id: "lane-connector", filename: "icon-connector-plug.png", publicPath: `${clearIconRoot}/icon-connector-plug.png` },
  "lane-spark": { id: "lane-spark", filename: "icon-spark-match.png", publicPath: `${clearIconRoot}/icon-spark-match.png` },
  "nav-people": { id: "nav-people", filename: "icon-lane-builder-v0.1.png", publicPath: `${iconRoot}/icon-lane-builder-v0.1.png` },
  "nav-how": { id: "nav-how", filename: "icon-step-dossier-v0.1.png", publicPath: `${iconRoot}/icon-step-dossier-v0.1.png` },
  "nav-proof": { id: "nav-proof", filename: "icon-crucible-ribbon.png", publicPath: `${clearIconRoot}/icon-crucible-ribbon.png` },
  "nav-dues": { id: "nav-dues", filename: "icon-dues-v0.1.png", publicPath: `${iconRoot}/icon-dues-v0.1.png` },
  "nav-bellows": { id: "nav-bellows", filename: "icon-dossier-v0.1.png", publicPath: `${iconRoot}/icon-dossier-v0.1.png` },
  "nav-deck": { id: "nav-deck", filename: "icon-deck-v0.1.png", publicPath: `${iconRoot}/icon-deck-v0.1.png` },
  /* Step icons: clear-v1, matched to the card copy (red team 2026-08-02:
     stamp was landing on the "translate" card). State the need = pencil on a
     tag; Translate the bottleneck = itemized checklist; Check proof = stamp. */
  "step-dossier": { id: "step-dossier", filename: "icon-name-penciltag.png", publicPath: `${clearIconRoot}/icon-name-penciltag.png` },
  "step-fit": { id: "step-fit", filename: "icon-operator-clipboard.png", publicPath: `${clearIconRoot}/icon-operator-clipboard.png` },
  "step-knock": { id: "step-knock", filename: "icon-verify-stamp.png", publicPath: `${clearIconRoot}/icon-verify-stamp.png` },
  "check-identity": { id: "check-identity", filename: "werkles-check-identity-v1.png", publicPath: `${productIconRoot}/werkles-check-identity-v1.png` },
  "check-funds": { id: "check-funds", filename: "werkles-check-funds-v1.png", publicPath: `${productIconRoot}/werkles-check-funds-v1.png` },
  "check-license": { id: "check-license", filename: "werkles-check-license-v1.png", publicPath: `${productIconRoot}/werkles-check-license-v1.png` },
  "check-employment": { id: "check-employment", filename: "werkles-check-employment-v1.png", publicPath: `${productIconRoot}/werkles-check-employment-v1.png` },
  "check-reference": { id: "check-reference", filename: "werkles-check-reference-v1.png", publicPath: `${productIconRoot}/werkles-check-reference-v1.png` },
  "icon-armory": { id: "icon-armory", filename: "werkles-armory-v1.png", publicPath: `${productIconRoot}/werkles-armory-v1.png` },
  "icon-blueprint": { id: "icon-blueprint", filename: "icon-blueprint-v0.1.png", publicPath: `${iconRoot}/icon-blueprint-v0.1.png` },
  "icon-deck": { id: "icon-deck", filename: "icon-deck-v0.1.png", publicPath: `${iconRoot}/icon-deck-v0.1.png` },
  "icon-dossier": { id: "icon-dossier", filename: "werkles-dossier-folder-v1.png", publicPath: `${productIconRoot}/werkles-dossier-folder-v1.png` },
  "icon-knock": { id: "icon-knock", filename: "icon-knock-v0.1.png", publicPath: `${iconRoot}/icon-knock-v0.1.png` },
  "icon-register": { id: "icon-register", filename: "icon-register-v0.1.png", publicPath: `${iconRoot}/icon-register-v0.1.png` },
  "product-bellows": {
    id: "product-bellows",
    filename: "icon-bellows.png",
    publicPath: `${clearIconRoot}/icon-bellows.png`
  },
  "product-workshop": {
    id: "product-workshop",
    filename: "werkles-workshop-v1.png",
    publicPath: `${productIconRoot}/werkles-workshop-v1.png`
  },
  "product-profile": {
    id: "product-profile",
    filename: "werkles-profile-v1.png",
    publicPath: `${productIconRoot}/werkles-profile-v1.png`
  },
  "product-intros": {
    id: "product-intros",
    filename: "werkles-intros-v1.png",
    publicPath: `${productIconRoot}/werkles-intros-v1.png`
  },
  "product-proof": {
    id: "product-proof",
    filename: "werkles-proof-v1.png",
    publicPath: `${productIconRoot}/werkles-proof-v1.png`
  },
  "product-membership": {
    /* The OPEN sign — dues buy the runway to opening day. */
    id: "product-membership",
    filename: "icon-move-opensign.png",
    publicPath: `${clearIconRoot}/icon-move-opensign.png`
  }
};

/** Tier 3 micro icons — PNG slots in `public/assets/draft/icons/` (SVG fallback until landed). */
export const tier3IconManifest = [
  "lane-builder",
  "lane-operator",
  "lane-backer",
  "lane-connector",
  "lane-spark",
  "nav-proof",
  "nav-dues",
  "icon-armory",
  "icon-deck",
  "icon-dossier",
  "icon-knock",
  "icon-register",
  "icon-blueprint",
  "step-dossier",
  "step-fit",
  "step-knock",
  "check-identity",
  "check-funds",
  "check-license",
  "check-employment",
  "check-reference"
] as const satisfies readonly SiteIconId[];

export const homeStepIcons: SiteIconId[] = ["step-dossier", "step-fit", "step-knock"];

export const laneIconIds: Record<"builder" | "operator" | "backer" | "connector" | "spark", SiteIconId> = {
  builder: "lane-builder",
  operator: "lane-operator",
  backer: "lane-backer",
  connector: "lane-connector",
  spark: "lane-spark"
};

export function crucibleIconId(checkKey: string): SiteIconId {
  if (checkKey.startsWith("identity") || checkKey === "phone") return "check-identity";
  if (checkKey.startsWith("funds")) return "check-funds";
  if (checkKey === "license") return "check-license";
  if (checkKey === "employment") return "check-employment";
  if (checkKey === "reference") return "check-reference";
  return "nav-proof";
}

export const iconDropFolder = "public/assets/draft/icons";
