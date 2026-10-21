export function studySetsCacheKey(userId: string): string {
  return `studySets_${userId}`;
}

export function invalidateStudySetsCache(userId: string): void {
  try {
    const key = studySetsCacheKey(userId);
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
  } catch (error) {
    console.error("Error clearing study sets cache:", error);
  }
}
