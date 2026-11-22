import { showUnauthorizedAlert } from "../components/sweetAlertMessage";

let unauthorizedRedirect: Promise<void> | null = null;

export function hasValidTokenExpiration(token: string): boolean {
  try {
    const segments = token.split(".");
    if (segments.length !== 3 || !segments[1]) {
      return false;
    }

    const payload = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = window.atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="));
    const claims: unknown = JSON.parse(decodedPayload);
    if (
      typeof claims !== "object"
      || claims === null
      || !("exp" in claims)
      || typeof claims.exp !== "number"
      || !Number.isFinite(claims.exp)
    ) {
      return false;
    }

    return claims.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function redirectUnauthorizedUser(): void {
  if (unauthorizedRedirect) {
    return;
  }

  window.localStorage.removeItem("token");
  window.sessionStorage.removeItem("lotusUserName");
  window.sessionStorage.removeItem("lotusUserId");

  unauthorizedRedirect = showUnauthorizedAlert()
    .then(() => {
      window.location.replace("/");
    })
    .finally(() => {
      unauthorizedRedirect = null;
    });
}
