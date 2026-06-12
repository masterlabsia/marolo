import { AppDataSource } from "../../shared/database";
import { Jogo } from "./Jogo.entity";

export const JogoRepository = AppDataSource.getRepository(Jogo);
