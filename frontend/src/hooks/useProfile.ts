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

      const firstTeam = await supabase
        .from("perfis")
        .select("*")
        .limit(1)
        .maybeSingle<Perfil>();

      if (firstTeam.error) {
        if (isMissingTableError(firstTeam.error)) {
          return {
            perfil: null,
            role: "jogador" as Papel,
            schemaMissing: true,
          };
        }
        throw firstTeam.error;
      }

      if (!firstTeam.data) {
        return {
          perfil: null,
          role: "jogador" as Papel,
          schemaMissing: false,
        };
      }

      if (isUuid(user.id) && firstTeam.data.usuario_id === user.id) {
        return {
          perfil: firstTeam.data,
          role: "admin" as Papel,
          schemaMissing: false,
        };
      }

      const member = await supabase
        .from("membros")
        .select("papel")
        .eq("perfil_id", firstTeam.data.id)
        .eq("usuario_id", user.id)
        .limit(1)
        .maybeSingle<{ papel: Papel }>();

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
        perfil: firstTeam.data,
        role: (member.data.papel ?? "jogador") as Papel,
        schemaMissing: false,
      };
    },
  });
}
