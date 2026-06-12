import { listJogadores, createJogador, removeJogador } from "./services";
import { JogadorRepository } from "../JogadorRepository";

jest.mock("../JogadorRepository", () => ({
  JogadorRepository: {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("jogadores/services", () => {
  afterEach(() => jest.clearAllMocks());

  it("listJogadores retorna jogadores ordenados por nome", async () => {
    const mockData = [{ id: 1, nome: "Ana" }];
    (JogadorRepository.find as jest.Mock).mockResolvedValue(mockData);

    const result = await listJogadores(1);

    expect(JogadorRepository.find).toHaveBeenCalledWith({
      where: { perfilId: 1 },
      order: { nome: "ASC" },
    });
    expect(result).toBe(mockData);
  });

  it("createJogador salva e retorna o novo jogador", async () => {
    const payload = { nome: "Bruno", posicao: "atacante", numeroCamisa: 9, telefone: null, email: null, tags: null };
    const created = { id: 2, perfilId: 1, ...payload };
    (JogadorRepository.create as jest.Mock).mockReturnValue(created);
    (JogadorRepository.save as jest.Mock).mockResolvedValue(created);

    const result = await createJogador(1, payload);

    expect(JogadorRepository.create).toHaveBeenCalledWith({ ...payload, perfilId: 1 });
    expect(result).toBe(created);
  });

  it("removeJogador chama delete com o id correto", async () => {
    (JogadorRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });
    await removeJogador(42);
    expect(JogadorRepository.delete).toHaveBeenCalledWith(42);
  });
});
