import { AppDataSource } from "../../shared/database";
import { CaixaMovimentacao } from "./CaixaMovimentacao.entity";

export const CaixaRepository = AppDataSource.getRepository(CaixaMovimentacao);
