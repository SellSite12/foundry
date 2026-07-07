import { Wallet } from "@/components/account/Wallet";

export const metadata = { title: "Payment methods" };

export default function WalletPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Payment methods</h1>
      <p className="mt-1 text-[13.5px] text-ink-dim">
        Cards are tokenized by the payment provider — Foundry never stores card numbers.
      </p>
      <Wallet />
    </div>
  );
}
