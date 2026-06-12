import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface FinancialWidgetProps {
  total: number;
  entradas: number;
  saidas: number;
}

const FinancialWidget = ({ total, entradas, saidas }: FinancialWidgetProps) => {
  return (
    <motion.div
      className="glass-card col-span-1 md:col-span-2 min-h-[160px] flex flex-col justify-between"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={20} strokeWidth={1.5} className="text-primary" />
        <h3 className="text-lg font-display font-bold text-foreground">Caixa</h3>
      </div>

      <p className="stat-number text-3xl">
        R$ {total.toLocaleString("pt-BR")}
      </p>

      <div className="flex gap-6 mt-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} strokeWidth={1.5} className="text-success" />
          <span className="text-sm text-success font-medium">+R$ {entradas}</span>
          <span className="text-xs text-muted-foreground">Entradas</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown size={14} strokeWidth={1.5} className="text-destructive" />
          <span className="text-sm text-destructive font-medium">-R$ {saidas}</span>
          <span className="text-xs text-muted-foreground">Saídas</span>
        </div>
      </div>
    </motion.div>
  );
};

export default FinancialWidget;
