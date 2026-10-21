export const ACCOUNT_PLANS = ["free", "premium", "pro"];

export const ACCOUNT_PLAN_LABELS = {
  free: "Free",
  premium: "Premium",
  pro: "Pro",
  admin: "Admin",
};

export function normalizeAccountPlan(type) {
  const value = String(type || "").toLowerCase();
  if (value === "premium" || value === "paid") return "premium";
  if (value === "pro") return "pro";
  if (value === "admin") return "admin";
  return "free";
}

export function isCustomerPlan(plan) {
  return plan === "free" || plan === "premium" || plan === "pro";
}
