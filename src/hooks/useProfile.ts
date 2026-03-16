import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Papel, Perfil } from "@/types/domain";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user) return null;

      const own = await supabase
        .from("perfis")
        .select("*")
        .eq("usuario_id", user.id)
        .maybeSingle<Perfil>();

      if (own.error) throw own.error;
      if (own.data) {
        return { perfil: own.data, role: "presidente" as Papel };
      }

      const member = await supabase
        .from("membros")
        .select("papel, perfis(*)")
        .eq("usuario_id", user.id)
        .limit(1)
        .maybeSingle<{ papel: Papel; perfis: Perfil }>();

      if (member.error) throw member.error;
      if (!member.data) return null;

      return { perfil: member.data.perfis, role: (member.data.papel ?? "jogador") as Papel };
    },
  });
}
