import Cookies from "js-cookie";

const PRESERVED_LOCAL_KEYS = new Set(["theme"]);
const LEGACY_STUDY_COOKIE = "study_set_draft";

export function clearDeviceStoredData(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!PRESERVED_LOCAL_KEYS.has(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }

  try {
    Cookies.remove(LEGACY_STUDY_COOKIE);
  } catch (error) {
    console.error("Error clearing legacy cookie:", error);
  }
}
