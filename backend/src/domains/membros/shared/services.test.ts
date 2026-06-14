import { listMembros, findMembro, createMembro, updateMembro, removeMembro } from "./services";
import { MembroRepository } from "../MembroRepository";

jest.mock("../MembroRepository", () => ({
  MembroRepository: {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("membros/services", () => {
  afterEach(() => jest.clearAllMocks());

  describe("listMembros", () => {
    it("retorna membros do perfil ordenados por data de criação", async () => {
      const mockData = [{ id: 1, perfilId: 10, usuarioId: "uuid-1", papel: "jogador" }];
      (MembroRepository.find as jest.Mock).mockResolvedValue(mockData);

      const result = await listMembros(10);

      expect(MembroRepository.find).toHaveBeenCalledWith({
        where: { perfilId: 10 },
        order: { createdAt: "ASC" },
      });
      expect(result).toBe(mockData);
    });
  });

  describe("findMembro", () => {
    it("retorna o membro quando encontrado", async () => {
      const mockMembro = { id: 1, usuarioId: "uuid-1", papel: "admin" };
      (MembroRepository.findOneBy as jest.Mock).mockResolvedValue(mockMembro);

      const result = await findMembro(1);

      expect(MembroRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(mockMembro);
    });

    it("retorna null quando não encontrado", async () => {
      (MembroRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await findMembro(999);

      expect(result).toBeNull();
    });
  });

  describe("createMembro", () => {
    it("cria e salva um novo membro com o perfilId correto", async () => {
      const payload = { usuarioId: "uuid-novo", papel: "jogador" as const };
      const created = { id: 3, perfilId: 10, ...payload };
      (MembroRepository.create as jest.Mock).mockReturnValue(created);
      (MembroRepository.save as jest.Mock).mockResolvedValue(created);

      const result = await createMembro(10, payload);

      expect(MembroRepository.create).toHaveBeenCalledWith({ ...payload, perfilId: 10 });
      expect(MembroRepository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });
  });

  describe("updateMembro", () => {
    it("atualiza o papel e retorna o membro atualizado", async () => {
      const updated = { id: 1, papel: "admin" };
      (MembroRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (MembroRepository.findOneByOrFail as jest.Mock).mockResolvedValue(updated);

      const result = await updateMembro(1, { papel: "admin" });

      expect(MembroRepository.update).toHaveBeenCalledWith(1, { papel: "admin" });
      expect(MembroRepository.findOneByOrFail).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(updated);
    });
  });

  describe("removeMembro", () => {
    it("chama delete com o id correto", async () => {
      (MembroRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await removeMembro(5);

      expect(MembroRepository.delete).toHaveBeenCalledWith(5);
    });
  });
});
