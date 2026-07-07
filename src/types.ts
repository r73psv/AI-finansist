export interface RawRecord {
  id: string; // generated client-side
  sum: number; // «Сумма, Р»
  category: string; // «Назначение»
  counterparty: string; // «Контрагент»
  comment: string; // «Комментарий»
  date: Date | null; // «Дата» parsed
  dateStr: string; // original raw date text
  rawIndex: number; // line number of source file
}

export interface MetricRow {
  index: number;
  label: string;
  type: 'header' | 'data' | 'formula' | 'section';
  value: number;
  isCustomOverride?: boolean;
  formula?: string;
  transactions?: RawRecord[];
}

export interface SalaryEmployee {
  fio: string; // FIO from "Контрагент"
  pastPeriodSum: number; // «Выплачено за прошлый период»
  reportPeriodSum: number; // «Выплачено за отчётный период»
  totalSum: number; // sum of both
}

export interface SalaryProcessingMetrics {
  totalCount: number;
  matchingSalaryCount: number;
  pastPeriodCount: number;
  reportPeriodCount: number;
}
