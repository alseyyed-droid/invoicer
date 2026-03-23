export const settingsSections = [
  { id: 'profile', labelKey: 'sections.profile' },
  { id: 'company', labelKey: 'sections.company' },
  { id: 'preferences', labelKey: 'sections.preferences' },
  { id: 'customization', labelKey: 'sections.customization' },
  { id: 'tax-types', labelKey: 'sections.tax_types' }
] as const;

export type SettingsSectionId = (typeof settingsSections)[number]['id'];

export function isSettingsSection(value: string): value is SettingsSectionId {
  return settingsSections.some((section) => section.id === value);
}
