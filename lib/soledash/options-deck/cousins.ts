export type OperatorCousinTarget =
  | "MAKER"
  | "DINK"
  | "ENDER"
  | "BEAN"
  | "THUFIR"
  | "SKYBRO";

export const COUSIN_TARGETS: { id: OperatorCousinTarget; label: string }[] = [
  { id: "MAKER", label: "Maker" },
  { id: "DINK", label: "Dink" },
  { id: "ENDER", label: "Ender" },
  { id: "BEAN", label: "Bean" },
  { id: "THUFIR", label: "Thufir" },
  { id: "SKYBRO", label: "Skybro" }
];
