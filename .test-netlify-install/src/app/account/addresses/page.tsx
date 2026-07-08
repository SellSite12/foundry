import { AddressBook } from "@/components/account/AddressBook";

export const metadata = { title: "Addresses" };

export default function AddressesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Addresses</h1>
      <p className="mt-1 text-[13.5px] text-ink-dim">
        Saved addresses are offered at checkout on every Foundry store.
      </p>
      <AddressBook />
    </div>
  );
}
