import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type Props = {
  kind: "error" | "success" | "info";
  children: React.ReactNode;
};

const styles = {
  error: {
    wrap: "border-danger/30 bg-danger-soft text-danger",
    Icon: AlertCircle,
  },
  success: {
    wrap: "border-success/30 bg-success-soft text-success",
    Icon: CheckCircle2,
  },
  info: {
    wrap: "border-copper/30 bg-copper-soft text-copper",
    Icon: Info,
  },
} as const;

export function Alert({ kind, children }: Props) {
  const { wrap, Icon } = styles[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed ${wrap}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
