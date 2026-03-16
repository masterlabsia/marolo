import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Papel, Perfil } from "@/types/domain";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id, user?.role],
    enabled: Boolean(user?.id),
    retry: (failureCount, error: unknown) => {
      const err = error as { status?: number; code?: string };
      if (err?.status === 404 || err?.code === "42P01" || (err as any)?.message?.includes("relation") || failureCount >= 2) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      if (!user) return null;

      // Login fixo: usar primeiro perfil do Supabase e role do auth
      const first = await supabase
        .from("perfis")
        .select("*")
        .limit(1)
        .maybeSingle<Perfil>();

      if (first.error) throw first.error;
      if (!first.data) return null;

      const role: Papel = user.role === "admin" ? "presidente" : "jogador";
      return { perfil: first.data, role };
    },
  });
}
