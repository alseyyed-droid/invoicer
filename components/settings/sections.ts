export const settingsSections = [
  { id: 'profile', labelKey: 'sections.profile' },
  { id: 'preferences', labelKey: 'sections.preferences' },
  { id: 'customization', labelKey: 'sections.customization' }
] as const;

export type SettingsSectionId = (typeof settingsSections)[number]['id'];

export function isSettingsSection(value: string): value is SettingsSectionId {
  return settingsSections.some((section) => section.id === value);
}
