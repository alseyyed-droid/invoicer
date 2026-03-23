import { useTranslations } from 'next-intl';
import { requireAuth } from '@/auth';

const mockTaxes = [
  { id: '1', title: 'VAT 15%', percentage: 15, description: 'Standard Value Added Tax' },
  { id: '2', title: 'Zero Tax', percentage: 0, description: 'Zero rated tax' }
];

export default async function TaxTypesPage({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  await requireAuth(locale);
  const t = useTranslations('taxTypes');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle mt-2">
            Define the tax presets available when creating invoices and reusable items.
          </p>
        </div>
        <button className="btn btn-primary">
          <span className="material-symbols-outlined">add</span>
          {t('newTaxType')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mockTaxes.map((tax) => (
          <div key={tax.id} className="shell-card group p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="tone-emerald flex h-10 w-10 items-center justify-center rounded-xl">
                <span className="material-symbols-outlined">percent</span>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button className="text-soft rounded-lg p-2 hover:bg-[var(--bg)] hover:text-amber-600">
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button className="text-soft rounded-lg p-2 hover:bg-[var(--bg)] hover:text-rose-600">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
            <h3 className="mb-1 text-lg font-bold text-[color:var(--text)]">{tax.title}</h3>
            <p className="mb-2 text-3xl font-black text-emerald-500">{tax.percentage}%</p>
            <p className="text-muted text-sm">{tax.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
