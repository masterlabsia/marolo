import { AppDataSource } from "../../shared/database";
import { Jogador } from "./Jogador.entity";

export const JogadorRepository = AppDataSource.getRepository(Jogador);
