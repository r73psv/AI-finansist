export interface RawRecord {
  id: string; // generated client-side
  sum: number; // «Сумма, Р»
  category: string; // «Назначение»
  counterparty: string; // «Контрагент»
  comment: string; // «Комментарий»
  date: Date | null; // «Дата» parsed
  dateStr: string; // original raw date text
  rawIndex: number; // line number of source file
  serviceProduct?: string; // «Услуга/Товар»
}

export interface RevenueItemDetail {
  name: string; // Наименование из графы «Услуга/Товар»
  sum: number; // Просуммированная сумма совпадающих строк
  count: number; // Количество сгруппированных строк
  category: string; // Категория (Выручка с услуг, Выручка с товаров и т.д.)
  transactions: RawRecord[];
}

export interface MetricRow {
  index: number;
  label: string;
  type: 'header' | 'data' | 'formula' | 'section';
  value: number;
  isCustomOverride?: boolean;
  formula?: string;
  transactions?: RawRecord[];
  revenueDetails?: RevenueItemDetail[];
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

export interface RawServiceRecord {
  id: string;
  rawIndex: number;
  service: string; // «Услуга»
  discount: number; // «Скидка»
  points: number; // «Баллы»
  subscriptions: number; // «Абонементы»
  certificates: number; // «Сертификаты»
  clientAccounts: number; // «Оплачено со счетов клиентов, ₽»
  money: number; // «Оплачено деньгами, ₽»
  revenue: number; // Сумма выручки
}

export interface ServiceReportItem {
  service: string;
  count: number;
  discount: number;
  points: number;
  subscriptions: number;
  certificates: number;
  clientAccounts: number;
  money: number;
  revenue: number;
  revenueShare: number; // %
  variableCost: number;
  fixedCost: number;
  totalCost: number;
  profit: number;
  profitability: number; // %
  rawRows: RawServiceRecord[];
}

export interface ServicesReportSummary {
  totalCount: number;
  totalDiscount: number;
  totalPoints: number;
  totalSubscriptions: number;
  totalCertificates: number;
  totalClientAccounts: number;
  totalMoney: number;
  totalRevenue: number;
  totalVariableCost: number;
  totalFixedCost: number;
  totalCost: number;
  totalProfit: number;
  totalProfitability: number;
}

export interface ServicesPreprocessingStats {
  totalRows: number;
  validServiceRows: number;
  cleanedFieldsCount: number;
  recognizedColumns: {
    service: string;
    discount?: string;
    points?: string;
    subscriptions?: string;
    certificates?: string;
    clientAccounts?: string;
    money?: string;
    directRevenue?: string;
  };
}
