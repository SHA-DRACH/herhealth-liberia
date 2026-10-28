import { can, currentAdmin, type AdminUser, type Capability } from "./auth";
import { error } from "../http";

/** For admin JSON routes: returns the admin, or a 401/403 response. */
export async function apiAdmin(cap?: Capability): Promise<AdminUser | Response> {
  const admin = await currentAdmin();
  if (!admin) return error(401, "authentication required");
  if (cap && !can(admin.role, cap)) return error(403, "forbidden");
  return admin;
}
