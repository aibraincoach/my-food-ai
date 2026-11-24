"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import {useLocale,useTranslations} from "next-intl";
import {formatNumber} from "@/i18n/format";
import { monthName } from "@/components/MonthGrid";

export default function GoToMonthSheet({ open, months, counts, loading, error, onClose, onMonth }: { open: boolean; months: string[]; counts: Record<string, number> | null; loading: boolean; error: string; onClose: () => void; onMonth: (month: string) => void }) {
  const t=useTranslations("days"),locale=useLocale();
  return <Sheet open={open} onClose={onClose} label={t("goToMonth")}>
    <header className="flex min-h-tap items-center justify-between"><h2 className="text-sheet-head">{t("goToMonth")}</h2><button type="button" aria-label={t("closeMonthList")} className="flex size-tap items-center justify-center" onClick={onClose}><Icon name="close" /></button></header>
    {loading ? <p role="status" className="text-meta text-muted">{t("loadingMonths")}</p> : null}
    {error ? <p role="alert" className="text-meta text-muted">{error}</p> : null}
    <div>{months.map(month => <button type="button" key={month} onClick={() => onMonth(month)} className="flex h-field-h w-full items-center justify-between text-body"><span>{monthName(locale,month, true)}</span><span className="text-meta text-muted tabular-nums">{counts ? t("postedCount",{count:counts[month]??0,amount:formatNumber(locale,counts[month]??0)}) : "…"}</span></button>)}</div>
  </Sheet>;
}
