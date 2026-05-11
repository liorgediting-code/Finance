import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const RATES: Record<string, { rate: number; name: string; flag: string }> = {
  USD: { rate: 3.70,  name: 'דולר אמריקאי',   flag: '🇺🇸' },
  EUR: { rate: 4.05,  name: 'אירו',             flag: '🇪🇺' },
  GBP: { rate: 4.80,  name: 'פאונד בריטי',     flag: '🇬🇧' },
  CHF: { rate: 4.20,  name: 'פרנק שוויצרי',    flag: '🇨🇭' },
  CAD: { rate: 2.70,  name: 'דולר קנדי',        flag: '🇨🇦' },
  AUD: { rate: 2.40,  name: 'דולר אוסטרלי',    flag: '🇦🇺' },
  JPY: { rate: 0.025, name: 'ין יפני',          flag: '🇯🇵' },
  AED: { rate: 1.00,  name: 'דירהם אמירתי',    flag: '🇦🇪' },
  DKK: { rate: 0.54,  name: 'כתר דני',          flag: '🇩🇰' },
  NOK: { rate: 0.35,  name: 'כתר נורווגי',      flag: '🇳🇴' },
  SEK: { rate: 0.35,  name: 'כתר שוודי',        flag: '🇸🇪' },
};

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#9090A8]';

export default function CurrencyConverterPage() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('ILS');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const from = RATES[fromCurrency];
  const to = toCurrency === 'ILS' ? { rate: 1, name: 'שקל חדש', flag: '🇮🇱' } : RATES[toCurrency];

  const fromRateInILS = from?.rate ?? 1;
  const toRateInILS = to?.rate ?? 1;

  const amountNum = Number(amount) || 0;
  const converted = amountNum > 0 ? (amountNum * fromRateInILS) / toRateInILS : 0;
  const reverseRate = fromRateInILS / toRateInILS;

  const handleSwap = () => {
    setFromCurrency(toCurrency === 'ILS' ? 'ILS' : toCurrency);
    setToCurrency(fromCurrency === 'ILS' ? 'ILS' : fromCurrency);
  };

  const handleCopy = () => {
    if (converted > 0) {
      navigator.clipboard.writeText(converted.toFixed(2)).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const allCurrencies = ['ILS', ...Object.keys(RATES)];
  const currencyLabel = (code: string) => {
    if (code === 'ILS') return { flag: '🇮🇱', name: 'שקל חדש' };
    return { flag: RATES[code]?.flag ?? '💱', name: RATES[code]?.name ?? code };
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1E1E2E]">ממיר מטבעות</h1>
        <p className="text-sm text-[#9090A8] mt-0.5">המר בין מטבעות בינלאומיים לשקל ובחזרה</p>
      </div>

      {/* Converter card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-5">
        {/* From */}
        <div>
          <label className="text-xs text-[#6B6B8A] mb-1 block">מסכום</label>
          <div className="flex gap-3">
            <select
              className={`${inputCls} w-40 flex-shrink-0`}
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              dir="rtl"
            >
              {allCurrencies.map((c) => {
                const { flag, name } = currencyLabel(c);
                return <option key={c} value={c}>{flag} {c} — {name}</option>;
              })}
            </select>
            <input
              className={`${inputCls} flex-1`}
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              dir="ltr"
            />
          </div>
        </div>

        {/* Swap button */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleSwap}
            className="w-10 h-10 rounded-full bg-lavender/10 hover:bg-lavender/20 text-lavender-dark flex items-center justify-center transition-colors cursor-pointer"
            title="החלף"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </button>
        </div>

        {/* To */}
        <div>
          <label className="text-xs text-[#6B6B8A] mb-1 block">למטבע</label>
          <div className="flex gap-3">
            <select
              className={`${inputCls} w-40 flex-shrink-0`}
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              dir="rtl"
            >
              {allCurrencies.map((c) => {
                const { flag, name } = currencyLabel(c);
                return <option key={c} value={c}>{flag} {c} — {name}</option>;
              })}
            </select>
            <div className="flex-1 relative">
              <div className={`${inputCls} bg-gray-50 font-bold text-lg text-[#1E1E2E] cursor-default flex items-center`} dir="ltr">
                {converted > 0
                  ? toCurrency === 'ILS'
                    ? formatCurrency(converted)
                    : `${converted.toFixed(2)} ${toCurrency}`
                  : <span className="text-[#9090A8] font-normal text-sm">התוצאה תופיע כאן</span>
                }
              </div>
              {converted > 0 && (
                <button
                  onClick={handleCopy}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-lavender-dark hover:text-[#5B52A0] cursor-pointer"
                >
                  {copied ? '✓ הועתק' : 'העתק'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rate info */}
        {amountNum > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-[#9090A8]">
              1 {fromCurrency} = {reverseRate.toFixed(4)} {toCurrency}
            </p>
          </div>
        )}
      </div>

      {/* Quick amounts */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm font-semibold text-[#1E1E2E] mb-3">המרות מהירות — {fromCurrency} → {toCurrency}</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {QUICK_AMOUNTS.map((qty) => {
            const result = (qty * fromRateInILS) / toRateInILS;
            return (
              <button
                key={qty}
                onClick={() => setAmount(String(qty))}
                className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-lavender/10 transition-colors cursor-pointer"
              >
                <span className="text-xs text-[#9090A8]">{qty.toLocaleString()} {fromCurrency}</span>
                <span className="text-sm font-bold text-[#1E1E2E] mt-0.5">
                  {toCurrency === 'ILS'
                    ? `₪${Math.round(result).toLocaleString()}`
                    : `${result.toFixed(0)} ${toCurrency}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* All currencies vs ILS */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm font-semibold text-[#1E1E2E] mb-3">שערים כלפי ₪ (משוערים)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(RATES).map(([code, { rate, name, flag }]) => (
            <button
              key={code}
              onClick={() => { setFromCurrency(code); setToCurrency('ILS'); }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-lavender/5 transition-colors text-right cursor-pointer"
            >
              <span className="text-xl">{flag}</span>
              <div>
                <p className="text-xs font-semibold text-[#1E1E2E]">{code}</p>
                <p className="text-xs text-[#9090A8]">₪{rate.toFixed(rate < 1 ? 3 : 2)}</p>
              </div>
              <p className="text-xs text-[#9090A8] mr-auto truncate hidden md:block">{name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 text-center">
        שערים משוערים בלבד · בדוק שער עדכני בבנק או בבורסה לפני ביצוע עסקא
      </div>
    </div>
  );
}
