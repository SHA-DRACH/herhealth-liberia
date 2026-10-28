import { cookies } from "next/headers";

export const ENVIRONMENTS = ["development", "testing", "pilot", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

/** Cookie set on a device by a facilitator (Admin → Testing) for the duration of a usability session. */
export const TEST_MODE_COOKIE = "hh_test_mode";

const isEnv = (v: unknown): v is Environment => ENVIRONMENTS.includes(v as Environment);

/** The environment of this deployment: ANALYTICS_ENVIRONMENT, else development outside production builds. */
export function deploymentEnvironment(): Environment {
  const v = process.env.ANALYTICS_ENVIRONMENT;
  if (isEnv(v)) return v;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** Environments counted on the public /impact page (PUBLIC_IMPACT_ENVIRONMENTS, comma-separated). */
export function publicImpactEnvironments(): Environment[] {
  const list = (process.env.PUBLIC_IMPACT_ENVIRONMENTS ?? "testing,pilot,production").split(",").map((s) => s.trim());
  return list.filter(isEnv);
}

/**
 * Environment for the current request:
 *  - a browser signed in to the admin (team member)          → "development" (internal)
 *  - a device in facilitator-started participant test mode → "testing"
 *  - otherwise                                               → the deployment environment
 * Starting participant mode signs the facilitator out on that device, so the two never overlap.
 */
export async function requestEnvironment(): Promise<Environment> {
  const jar = await cookies();
  if (jar.get("hh_admin")?.value) return "development";
  if (jar.get(TEST_MODE_COOKIE)?.value === "1") return "testing";
  return deploymentEnvironment();
}
