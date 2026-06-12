import { AppDataSource } from "../../shared/database";
import { Presenca } from "./Presenca.entity";

export const PresencaRepository = AppDataSource.getRepository(Presenca);
