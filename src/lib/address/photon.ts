import type { AddressSuggestion } from "@/lib/address/types";

type PhotonFeature = {
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
};

export function parsePhotonFeatures(features: PhotonFeature[]): AddressSuggestion[] {
  const seen = new Set<string>();

  return features
    .map((feature, index) => toSuggestion(feature, index))
    .filter((s): s is AddressSuggestion => {
      if (!s) return false;
      if (!s.line1 && !s.city) return false;
      const key = `${s.line1}|${s.city}|${s.postalCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function toSuggestion(feature: PhotonFeature, index: number): AddressSuggestion | null {
  const p = feature.properties;
  const line1 = [p.housenumber, p.street].filter(Boolean).join(" ").trim() || p.name?.trim() || "";
  const city = (p.city ?? p.town ?? p.village ?? p.municipality ?? "").trim();
  const state = (p.state ?? "").trim();
  const postalCode = (p.postcode ?? "").trim();
  const country = (p.country ?? "").trim();

  const labelParts = [line1, city, state, postalCode, country].filter(Boolean);
  if (labelParts.length === 0) return null;

  return {
    id: String(p.osm_id ?? index),
    label: labelParts.join(", "),
    line1,
    line2: "",
    city,
    state,
    postalCode,
    country,
  };
}

export async function searchPhoton(query: string, limit = 6): Promise<AddressSuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "en");

  const res = await fetch(url, {
    headers: { "User-Agent": "Foundry/1.0 (address lookup)" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { features?: PhotonFeature[] };
  return parsePhotonFeatures(json.features ?? []);
}
