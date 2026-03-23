export const itemUnitTypes = ['piece', 'hour', 'kg', 'day', 'service'] as const;

export type ItemUnitType = (typeof itemUnitTypes)[number];

export type ItemTaxType = {
  id: string;
  title: string;
  percentage: number;
};

export type ItemRecord = {
  id: string;
  name: string;
  price: number;
  unitType: ItemUnitType;
  description: string;
  taxTypeId: string | null;
  taxType: ItemTaxType | null;
};

export type ItemFormValues = {
  name: string;
  price: number;
  unitType: ItemUnitType;
  description: string;
  taxTypeId: string;
};

export function getIntlLocale(locale: string) {
  return locale === 'ar' ? 'ar-JO-u-nu-latn' : 'en-US-u-nu-latn';
}
