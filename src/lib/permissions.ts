import type { Papel } from "@/types/domain";

export function canManageRole(role?: Papel | null) {
  return role === "admin";
}
