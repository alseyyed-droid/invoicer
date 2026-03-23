export const settingsSections = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'customization', label: 'Customization' },
  { id: 'tax-types', label: 'Tax Types' }
] as const;

export type SettingsSectionId = (typeof settingsSections)[number]['id'];

export function isSettingsSection(value: string): value is SettingsSectionId {
  return settingsSections.some((section) => section.id === value);
}
