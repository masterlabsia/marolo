import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Papel, Perfil } from "@/types/domain";

function isMissingTableError(error: unknown) {
  const err = error as { status?: number; code?: string; message?: string };
  return err?.status === 404 || err?.code === "42P01" || err?.message?.toLowerCase().includes("relation");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    retry: false,
    queryFn: async () => {
      if (!user) return null;
      const fallbackRole: Papel = user.role === "admin" ? "presidente" : "jogador";

      // Modo login fixo (admin/jogador): user.id nao e UUID.
      // Neste modo usamos o primeiro perfil como fallback para destravar a UI.
      if (!isUuid(user.id)) {
        const first = await supabase
          .from("perfis")
          .select("*")
          .limit(1)
          .maybeSingle<Perfil>();

        if (first.error) {
          if (isMissingTableError(first.error)) {
            return {
              perfil: null,
              role: fallbackRole,
              schemaMissing: true,
            };
          }
          throw first.error;
        }

        return {
          perfil: first.data ?? null,
          role: fallbackRole,
          schemaMissing: false,
        };
      }

      const own = await supabase
        .from("perfis")
        .select("*")
        .eq("usuario_id", user.id)
        .maybeSingle<Perfil>();

      if (own.error) {
        if (isMissingTableError(own.error)) {
          return {
            perfil: null,
            role: "presidente" as Papel,
            schemaMissing: true,
          };
        }
        throw own.error;
      }

      if (own.data) {
        return {
          perfil: own.data,
          role: "presidente" as Papel,
          schemaMissing: false,
        };
      }

      const member = await supabase
        .from("membros")
        .select("papel, perfis(*)")
        .eq("usuario_id", user.id)
        .limit(1)
        .maybeSingle<{ papel: Papel; perfis: Perfil }>();

      if (member.error) {
        if (isMissingTableError(member.error)) {
          return {
            perfil: null,
            role: "jogador" as Papel,
            schemaMissing: true,
          };
        }
        throw member.error;
      }

      if (!member.data) {
        return {
          perfil: null,
          role: "jogador" as Papel,
          schemaMissing: false,
        };
      }

      return {
        perfil: member.data.perfis,
        role: (member.data.papel ?? "jogador") as Papel,
        schemaMissing: false,
      };
    },
  });
}
