export const typeDefs = `#graphql
  type Jogador {
    id: Int!
    perfilId: Int!
    nome: String!
    posicao: String
    numeroCamisa: Int
    ativo: Boolean!
  }

  type JogadorStats {
    jogadorId: Int!
    nome: String!
    gols: Int!
    assistencias: Int!
    jogos: Int!
  }

  type Query {
    jogadores(perfilId: Int!): [Jogador!]!
    statsJogadores(perfilId: Int!): [JogadorStats!]!
  }
`;
