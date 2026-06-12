import { AppDataSource } from "../../shared/database";
import { Pagamento } from "./Pagamento.entity";

export const PagamentoRepository = AppDataSource.getRepository(Pagamento);
