import { AppDataSource } from "../../shared/database";
import { Membro } from "./Membro.entity";

export const MembroRepository = AppDataSource.getRepository(Membro);
