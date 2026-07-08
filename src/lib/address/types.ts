export type AddressFieldValue = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AddressSuggestion = AddressFieldValue & {
  id: string;
  label: string;
};
