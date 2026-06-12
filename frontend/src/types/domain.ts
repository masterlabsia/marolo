export type Papel = "admin" | "jogador" | "diarista";

export interface Perfil {
  id: number;
  usuario_id: string;
  nome_time: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  configuracao_tema: Record<string, unknown> | null;
}

export interface Jogador {
  id: number;
  perfil_id: number;
  nome: string;
  posicao: string | null;
  numero_camisa: number | null;
  telefone: string | null;
  email: string | null;
  tags: string[] | null;
  ativo: boolean;
  tipo: "mensalista" | "diarista";
}

export interface Jogo {
  id: number;
  perfil_id: number;
  data_hora: string;
  adversario: string;
  local: string | null;
  resultado: { gols_nossos: number; gols_adversario: number; vencido?: boolean } | null;
  formacao: string | null;
  notas: string | null;
  status: "agendado" | "realizado" | "cancelado";
}

export interface Presenca {
  id: number;
  jogo_id: number;
  jogador_id: number;
  presente: boolean;
  gols: number;
  assistencias: number;
  cartoes: { amarelo: number; vermelho: number } | null;
  notas: string | null;
  avaliacao: number | null;
  jogador?: Pick<Jogador, "id" | "nome">;
  jogo?: Pick<Jogo, "id" | "data_hora" | "adversario" | "status" | "resultado">;
}

export interface Pagamento {
  id: number;
  perfil_id: number;
  jogador_id: number;
  mes: number;
  ano: number;
  valor: number;
  status: "pendente" | "pago" | "vencido";
  data_vencimento: string | null;
  data_pagamento: string | null;
  jogador?: Pick<Jogador, "id" | "nome">;
}

export interface MovimentacaoCaixa {
  id: number;
  perfil_id: number;
  tipo: "entrada" | "saida";
  categoria: string | null;
  descricao: string;
  valor: number;
  data_movimento: string;
  metodo_pagamento: string | null;
}
