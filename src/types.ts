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
  hall?: string; // Название зала салона
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
  hall: string; // Название зала
  count: number;
  discount: number;
  points: number;
  subscriptions: number;
  certificates: number;
  clientAccounts: number;
  money: number;
  revenue: number;
  revenueShare: number; // %
  supplierCost: number; // Расходы на поставщиков данного зала (пропорционально выручке услуги)
  masterSalary: number; // Зарплата мастеров зала (пропорционально выручке услуги внутри зала)
  adminSalary: number; // Зарплата административного персонала (распределенная между всеми залами)
  salaryCost: number; // Всего зарплатные расходы (мастера + админы)
  variableCost: number;
  fixedCost: number;
  totalCost: number;
  profit: number;
  profitability: number; // %
  rawRows: RawServiceRecord[];
}

export interface HallReportGroup {
  hallName: string;
  items: ServiceReportItem[];
  summary: {
    totalCount: number;
    totalDiscount: number;
    totalPoints: number;
    totalSubscriptions: number;
    totalCertificates: number;
    totalClientAccounts: number;
    totalMoney: number;
    totalRevenue: number;
    totalRevenueShare: number; // %
    area: number; // Площадь зала в м²
    areaShare: number; // Доля площади зала в салоне (%)
    revenuePerSqM: number; // Выручка на 1 м² (₽/м²)
    profitPerSqM: number; // Прибыль на 1 м² (₽/м²)
    directSupplierCost: number; // Прямые поставщики зала
    sharedSupplierCost: number; // Доля общих поставщиков
    totalSupplierCost: number; // Всего расходы на поставщиков зала
    masterSalary: number; // Зарплата мастеров в сумме, введенной для данного зала
    adminSalary: number; // Зарплата администраторов, распределенная на данный зал
    totalSalaryCost: number; // Всего ФОТ зала (мастера + админы)
    totalVariableCost: number;
    totalFixedCost: number;
    totalCost: number;
    totalProfit: number;
    totalProfitability: number;
  };
}

export interface ServicesReportResult {
  items: ServiceReportItem[];
  halls: HallReportGroup[];
  summary: ServicesReportSummary;
}

export type ExpenseAllocationMethod = 'revenue' | 'area';

export interface ServicesReportSummary {
  totalCount: number;
  totalDiscount: number;
  totalPoints: number;
  totalSubscriptions: number;
  totalCertificates: number;
  totalClientAccounts: number;
  totalMoney: number;
  totalRevenue: number;
  totalArea: number; // Общая площадь всех залов (м²)
  totalSupplierCost: number; // Всего расходы на поставщиков по всем залам
  totalMasterSalary: number; // Всего зарплата мастеров по всем залам
  totalAdminSalary: number; // Всего зарплата административного персонала
  totalSalaryCost: number; // Общий фонд оплаты труда (мастера + администраторы)
  totalVariableCost: number;
  totalFixedCost: number;
  totalCost: number;
  totalProfit: number;
  totalProfitability: number;
  expenseAllocationMethod?: ExpenseAllocationMethod;
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
