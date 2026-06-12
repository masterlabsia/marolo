import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { PaymentSummary } from "@/types";

interface PaymentStatusProps {
  payments: PaymentSummary;
}

const PaymentStatus = ({ payments }: PaymentStatusProps) => {
  return (
    <motion.div
      className="glass-card col-span-1 md:col-span-2 min-h-[160px]"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <CreditCard size={20} strokeWidth={1.5} className="text-primary" />
        <h3 className="text-lg font-display font-bold text-foreground">Pagamentos</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-2xl bg-success/10">
          <CheckCircle2 size={18} strokeWidth={1.5} className="text-success mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-success tabular-nums">{payments.paid}</p>
          <p className="text-xs text-muted-foreground mt-1">Pagos</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-warning/10">
          <AlertTriangle size={18} strokeWidth={1.5} className="text-warning mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-warning tabular-nums">{payments.pending}</p>
          <p className="text-xs text-muted-foreground mt-1">Vencendo</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-destructive/10">
          <XCircle size={18} strokeWidth={1.5} className="text-destructive mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-destructive tabular-nums">{payments.overdue}</p>
          <p className="text-xs text-muted-foreground mt-1">Vencido</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStatus;
