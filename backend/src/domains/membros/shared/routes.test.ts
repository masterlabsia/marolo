import request from "supertest";
import express from "express";
import membrosRouter from "./routes";
import * as services from "./services";

jest.mock("./services");

const app = express();
app.use(express.json());
app.use("/membros", membrosRouter);

const mockedServices = services as jest.Mocked<typeof services>;

describe("GET /membros", () => {
  it("retorna 400 quando perfilId não é enviado", async () => {
    const res = await request(app).get("/membros");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("perfilId é obrigatório");
  });

  it("retorna 200 com a lista de membros", async () => {
    const mockMembros = [{ id: 1, perfilId: 10, usuarioId: "uuid-1", papel: "jogador" }];
    mockedServices.listMembros.mockResolvedValue(mockMembros as any);

    const res = await request(app).get("/membros?perfilId=10");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockMembros);
    expect(mockedServices.listMembros).toHaveBeenCalledWith(10);
  });
});

describe("POST /membros", () => {
  it("retorna 400 quando perfilId não é enviado", async () => {
    const res = await request(app).post("/membros").send({ usuarioId: "uuid-1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/perfilId/);
  });

  it("retorna 400 quando usuarioId não é enviado", async () => {
    const res = await request(app).post("/membros").send({ perfilId: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/usuarioId/);
  });

  it("retorna 201 com o membro criado", async () => {
    const novo = { id: 3, perfilId: 10, usuarioId: "uuid-novo", papel: "jogador" };
    mockedServices.createMembro.mockResolvedValue(novo as any);

    const res = await request(app)
      .post("/membros")
      .send({ perfilId: 10, usuarioId: "uuid-novo", papel: "jogador" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(novo);
    expect(mockedServices.createMembro).toHaveBeenCalledWith(10, {
      usuarioId: "uuid-novo",
      papel: "jogador",
    });
  });

  it("usa papel 'jogador' como padrão quando não enviado", async () => {
    const novo = { id: 4, perfilId: 10, usuarioId: "uuid-x", papel: "jogador" };
    mockedServices.createMembro.mockResolvedValue(novo as any);

    await request(app).post("/membros").send({ perfilId: 10, usuarioId: "uuid-x" });

    expect(mockedServices.createMembro).toHaveBeenCalledWith(10, {
      usuarioId: "uuid-x",
      papel: "jogador",
    });
  });
});

describe("PUT /membros/:id", () => {
  it("retorna 400 quando papel não é enviado", async () => {
    const res = await request(app).put("/membros/1").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/papel/);
  });

  it("retorna 200 com o membro atualizado", async () => {
    const atualizado = { id: 1, papel: "admin" };
    mockedServices.updateMembro.mockResolvedValue(atualizado as any);

    const res = await request(app).put("/membros/1").send({ papel: "admin" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(atualizado);
    expect(mockedServices.updateMembro).toHaveBeenCalledWith(1, { papel: "admin" });
  });
});

describe("DELETE /membros/:id", () => {
  it("retorna 204 ao remover o membro", async () => {
    mockedServices.removeMembro.mockResolvedValue({ affected: 1 } as any);

    const res = await request(app).delete("/membros/5");

    expect(res.status).toBe(204);
    expect(mockedServices.removeMembro).toHaveBeenCalledWith(5);
  });
});
