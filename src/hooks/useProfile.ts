import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Papel, Perfil } from "@/types/domain";

function isMissingTableError(error: unknown) {
  const err = error as { status?: number; code?: string; message?: string };
  return err?.status === 404 || err?.code === "42P01" || err?.message?.toLowerCase().includes("relation");
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    retry: false,
    queryFn: async () => {
      if (!user) return null;

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
