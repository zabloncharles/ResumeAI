export const ACCOUNT_PLANS = ["free", "premium", "pro"] as const;

export type AccountPlan = (typeof ACCOUNT_PLANS)[number];
export type AccountType = AccountPlan | "admin";

export const ACCOUNT_PLAN_LABELS: Record<AccountType, string> = {
  free: "Free",
  premium: "Premium",
  pro: "Pro",
  admin: "Admin",
};

export const ACCOUNT_PLAN_CHART_COLORS: Record<AccountPlan, string> = {
  free: "#94a3b8",
  premium: "#16aeac",
  pro: "#8b5cf6",
};

export function normalizeAccountPlan(type: unknown): AccountType {
  const value = String(type || "").toLowerCase();
  if (value === "premium" || value === "paid") return "premium";
  if (value === "pro") return "pro";
  if (value === "admin") return "admin";
  return "free";
}

export function isCustomerPlan(plan: AccountType): plan is AccountPlan {
  return plan === "free" || plan === "premium" || plan === "pro";
}
