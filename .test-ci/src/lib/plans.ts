import type { Plan } from "@/lib/constants";

export type PlanDefinition = {
  id: Plan;
  name: string;
  blurb: string;
  monthlyCents: number;
  yearlyCents: number;
  limits: {
    stores: number | null; // null = unlimited
    products: number | null;
    teamSeats: number | null;
    storageMb: number;
  };
  features: string[];
};

export const PLAN_DEFS: Record<Plan, PlanDefinition> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    blurb: "For a first product launch.",
    monthlyCents: 0,
    yearlyCents: 0,
    limits: { stores: 1, products: 25, teamSeats: 2, storageMb: 250 },
    features: ["1 store", "Up to 25 products", "2 team seats", "250 MB media storage"],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    blurb: "For stores scaling past the first year.",
    monthlyCents: 3900,
    yearlyCents: 3100,
    limits: { stores: 5, products: null, teamSeats: 10, storageMb: 5120 },
    features: [
      "5 stores",
      "Unlimited products",
      "10 team seats",
      "5 GB media storage",
      "Automation rules",
    ],
  },
  SCALE: {
    id: "SCALE",
    name: "Scale",
    blurb: "For teams running commerce at volume.",
    monthlyCents: 12900,
    yearlyCents: 10300,
    limits: { stores: null, products: null, teamSeats: null, storageMb: 51200 },
    features: [
      "Unlimited stores",
      "Unlimited products",
      "Unlimited team seats",
      "50 GB media storage",
      "API access",
      "Audit logs (Phase 4)",
    ],
  },
};
