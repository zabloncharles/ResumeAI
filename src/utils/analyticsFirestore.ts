import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export type AnalyticsGlobal = {
  totalUsers: number;
  totalResumes: number;
  totalCoverLetters: number;
  totalApiCalls: number;
  totalTokens: number;
  usersFree: number;
  usersPremium: number;
  usersPro: number;
};

export type AnalyticsMonth = {
  monthKey: string;
  label: string;
  users: number;
  resumes: number;
  coverLetters: number;
  apiCalls: number;
  tokens: number;
  usersFree: number;
  usersPremium: number;
  usersPro: number;
};

const MONTH_LABELS: string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchAnalyticsGlobal(): Promise<AnalyticsGlobal> {
  const snap = await getDoc(doc(db, "analytics", "global"));
  const data = snap.exists() ? snap.data() : {};
  return {
    totalUsers: num(data.totalUsers),
    totalResumes: num(data.totalResumes),
    totalCoverLetters: num(data.totalCoverLetters),
    totalApiCalls: num(data.totalApiCalls),
    totalTokens: num(data.totalTokens),
    usersFree: num(data.usersFree),
    usersPremium: num(data.usersPremium),
    usersPro: num(data.usersPro),
  };
}

export async function fetchAnalyticsMonthsForYear(
  year: number
): Promise<AnalyticsMonth[]> {
  const snaps = await Promise.all(
    MONTH_LABELS.map((_, index) => {
      const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
      return getDoc(doc(db, "analytics", "monthly", "months", monthKey));
    })
  );

  return MONTH_LABELS.map((label, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
    const data = snaps[index].exists() ? snaps[index].data() : {};
    return {
      monthKey,
      label,
      users: num(data.users),
      resumes: num(data.resumes),
      coverLetters: num(data.coverLetters),
      apiCalls: num(data.apiCalls),
      tokens: num(data.tokens),
      usersFree: num(data.usersFree),
      usersPremium: num(data.usersPremium),
      usersPro: num(data.usersPro),
    };
  });
}

export function emptyMonthChart(year = new Date().getFullYear()) {
  return MONTH_LABELS.map((month, index) => ({
    month,
    monthKey: `${year}-${String(index + 1).padStart(2, "0")}`,
    coverLetter: 0,
    resume: 0,
    users: 0,
    applications: 0,
    apiCalls: 0,
    tokens: 0,
    free: 0,
    premium: 0,
    pro: 0,
  }));
}

export function emptyPlanRegistrationChart(
  year = new Date().getFullYear()
) {
  return MONTH_LABELS.map((month, index) => ({
    month,
    monthKey: `${year}-${String(index + 1).padStart(2, "0")}`,
    free: 0,
    premium: 0,
    pro: 0,
  }));
}
