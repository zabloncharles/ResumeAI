import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type User,
} from "firebase/auth";

export class ReauthPasswordRequiredError extends Error {
  constructor() {
    super("Password required to confirm this action.");
    this.name = "ReauthPasswordRequiredError";
  }
}

export function userNeedsPasswordReauth(user: User): boolean {
  const hasPassword = user.providerData.some(
    (p) => p.providerId === "password"
  );
  const hasGoogle = user.providerData.some(
    (p) => p.providerId === "google.com"
  );
  return hasPassword && !hasGoogle;
}

export async function reauthenticateForSensitiveAction(
  user: User,
  password?: string
): Promise<void> {
  const hasGoogle = user.providerData.some(
    (p) => p.providerId === "google.com"
  );
  const hasPassword = user.providerData.some(
    (p) => p.providerId === "password"
  );

  if (hasGoogle) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return;
  }

  if (hasPassword) {
    if (!user.email) {
      throw new Error("Missing email for password reauthentication.");
    }
    if (!password?.trim()) {
      throw new ReauthPasswordRequiredError();
    }
    const credential = EmailAuthProvider.credential(
      user.email,
      password.trim()
    );
    await reauthenticateWithCredential(user, credential);
    return;
  }

  throw new Error("No supported sign-in method for reauthentication.");
}
