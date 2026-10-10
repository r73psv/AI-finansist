import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  BookOpen, 
  Users, 
  Table, 
  FileText,
  Lock,
  Edit2,
  Trash2,
  HelpCircle,
  Undo,
  Play,
  Loader2,
  Check,
  ChevronDown,
  Layers,
  Package,
  Eye,
  EyeOff,
  Scissors,
  Calculator,
  PieChart,
  Percent,
  BarChart3,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  RawRecord, 
  MetricRow, 
  SalaryEmployee, 
  SalaryProcessingMetrics, 
  RevenueItemDetail,
  RawServiceRecord,
  ServiceReportItem,
  ServicesReportSummary,
  ServicesPreprocessingStats
} from './types';
import { 
  parseUploadedSpreadsheet, 
  generateFinancialReport, 
  processSalaryPayments,
  calculateReportFormulas,
  downloadFinancialSpreadsheet,
  downloadSalarySpreadsheet,
  downloadRevenueSpreadsheet,
  groupRevenueByServiceProduct,
  parseDate,
  parseServicesSpreadsheet,
  generateServicesReport,
  downloadServicesSpreadsheet
} from './processingEngine';
import { FINANCIAL_TEMPLATE } from './financialTemplate';
import TestPlayground from './components/TestPlayground';
import { downloadDocxReport } from './docxGenerator';

// Realistic mock data so users can test the dashboard instantly without preparing files.
const DEMO_RECORDS: Omit<RawRecord, 'id' | 'date'>[] = [
  // Revenue with "Услуга/Товар" detailing (matching rows grouped & summed)
  { sum: 140000, category: 'Выручка с услуг', counterparty: 'Клиенты салона', serviceProduct: 'Стрижка женская (модельная)', comment: 'Стрижки май 1 смена', dateStr: '10.05.2026', rawIndex: 2 },
  { sum: 110000, category: 'Выручка с услуг', counterparty: 'Клиенты салона', serviceProduct: 'Стрижка женская (модельная)', comment: 'Стрижки май 2 смена', dateStr: '14.05.2026', rawIndex: 3 },
  { sum: 90000, category: 'Выручка с услуг', counterparty: 'Клиенты салона', serviceProduct: 'Сложное окрашивание (Airtouch)', comment: 'Окрашивание волос сложные техники', dateStr: '15.05.2026', rawIndex: 4 },
  { sum: 65000, category: 'Выручка с товаров', counterparty: 'Розничные покупатели', serviceProduct: 'Шампунь Kerastase Nutritive 250ml', comment: 'Продажа косметики витрина', dateStr: '18.05.2026', rawIndex: 5 },
  { sum: 55000, category: 'Выручка с товаров', counterparty: 'Розничные покупатели', serviceProduct: 'Шампунь Kerastase Nutritive 250ml', comment: 'Продажа косметики витрина', dateStr: '19.05.2026', rawIndex: 6 },
  { sum: 30000, category: 'Пополнение счёта', counterparty: 'Абоненты', serviceProduct: 'Пополнение депозитного баланса', comment: 'Депозиты на баланс', dateStr: '20.05.2026', rawIndex: 7 },
  { sum: 45000, category: 'Выручка с сертификатов', counterparty: 'Подарочные продажи', serviceProduct: 'Подарочный сертификат 5000 ₽', comment: 'Сертификаты подарочные', dateStr: '22.05.2026', rawIndex: 8 },
  // Operating Variable Expenses
  { sum: 15400, category: '2026 Жизнеобеспечение салона', counterparty: 'Пекарня Сласть', comment: 'Вкусняшки для утренней смены', dateStr: '02.05.2026', rawIndex: 6 },
  { sum: 3400, category: 'Доставка', counterparty: 'Яндекс Доставка', comment: 'Доставка одноразовых простыней', dateStr: '05.05.2026', rawIndex: 7 },
  { sum: 12000, category: 'Кофе', counterparty: 'Спешелти Ростерс', comment: 'Кофе свежей обжарки', dateStr: '15.05.2026', rawIndex: 8 },
  // Suppliers Grouping Rules (Tested below)
  { sum: 45000, category: 'Закупка материалов', counterparty: 'ИП Щеголькова (ProfiLine)', comment: 'Краски для волос, оксиды', dateStr: '10.05.2026', rawIndex: 9 },
  { sum: 28000, category: 'Закупка товаров', counterparty: 'ООО Солком Регион (Лореаль витрина)', comment: 'Шампуни Лореаль на витрину', dateStr: '12.05.2026', rawIndex: 10 },
  { sum: 19500, category: 'Закупка материалов', counterparty: 'Калашникова (Matrix расходники)', comment: 'Расходники Матрикс красители', dateStr: '13.05.2026', rawIndex: 11 },
  // Overheads / Constants
  { sum: 120000, category: 'Аренда', counterparty: 'Бизнес-Центр Меридиан', comment: 'Арендная плата май', dateStr: '01.05.2026', rawIndex: 12 },
  { sum: 25000, category: 'Бухгалтер', counterparty: 'ИП Петрова Капитал', comment: 'Сдача отчетности и учет', dateStr: '05.05.2026', rawIndex: 13 },
  { sum: 18000, category: 'Коммунальные платежи', counterparty: 'Энергосбыт', comment: 'Оплата электричества', dateStr: '10.05.2026', rawIndex: 14 },
  { sum: 35000, category: 'Реклама, маркетинг, таргет', counterparty: 'ТаргетПро Агентство', comment: 'Кампания ВК и Яндекс Карты', dateStr: '11.05.2026', rawIndex: 15 },
  // Salary - Employee Payments (Various rules to showcase the split logic)
  { sum: 50000, category: 'Зарплата', counterparty: 'Ковалева Лариса (Мастер)', comment: 'Зарплата за апрель', dateStr: '10.05.2026', rawIndex: 16 },
  { sum: 35000, category: 'Зарплата masters', counterparty: 'Ковалева Лариса (Мастер)', comment: 'Аванс за май', dateStr: '25.05.2026', rawIndex: 17 }, // No comment keyword -> reporting
  { sum: 45000, category: 'Заработная плата', counterparty: 'Цветкова Анна (Администратор)', comment: 'з.п. остаток за апрель', dateStr: '15.05.2026', rawIndex: 18 },
  { sum: 20000, category: 'Зарплата', counterparty: 'Цветкова Анна (Администратор)', comment: 'Бонус за выполнение плана продаж', dateStr: '28.05.2026', rawIndex: 19 }, // No keyword -> reporting
  { sum: 55000, category: 'Зарплата', counterparty: 'Власов Сергей (Топ-Барбер)', comment: 'Зарплата за апрель по ведомости', dateStr: '14.05.2026', rawIndex: 20 },
  { sum: 40000, category: 'Зарплата', counterparty: 'Власов Сергей (Топ-Барбер)', comment: 'ЗП авансовая выплата май', dateStr: '26.05.2026', rawIndex: 21 },
  // Unmatched additional rows (tests appending extra lines automatically)
  { sum: 14200, category: 'Непредвиденный форс-мажор ураган', counterparty: 'ООО РемСтройВолга', comment: 'Срочный ремонт козырька входа', dateStr: '16.05.2026', rawIndex: 22 }
];

// Realistic mock services data for instant testing of Tab 2
const DEMO_SERVICES_RECORDS: Omit<RawServiceRecord, 'id' | 'revenue'>[] = [
  { rawIndex: 2, service: 'Стрижка женская (модельная)', discount: 500, points: 200, subscriptions: 0, certificates: 0, clientAccounts: 0, money: 2800 },
  { rawIndex: 3, service: 'Стрижка женская (модельная)', discount: 0, points: 0, subscriptions: 0, certificates: 1500, clientAccounts: 0, money: 2000 },
  { rawIndex: 4, service: 'Стрижка женская (модельная)', discount: 300, points: 100, subscriptions: 0, certificates: 0, clientAccounts: 1200, money: 1900 },
  { rawIndex: 5, service: 'Сложное окрашивание (Airtouch)', discount: 1500, points: 500, subscriptions: 0, certificates: 3000, clientAccounts: 2000, money: 8500 },
  { rawIndex: 6, service: 'Сложное окрашивание (Airtouch)', discount: 0, points: 0, subscriptions: 0, certificates: 0, clientAccounts: 0, money: 15000 },
  { rawIndex: 7, service: 'Маникюр аппаратный с покрытием гель-лак', discount: 200, points: 150, subscriptions: 2000, certificates: 0, clientAccounts: 0, money: 350 },
  { rawIndex: 8, service: 'Маникюр аппаратный с покрытием гель-лак', discount: 0, points: 0, subscriptions: 0, certificates: 1000, clientAccounts: 500, money: 1000 },
  { rawIndex: 9, service: 'Маникюр аппаратный с покрытием гель-лак', discount: 400, points: 200, subscriptions: 0, certificates: 0, clientAccounts: 0, money: 1900 },
  { rawIndex: 10, service: 'Педикюр Smart классический', discount: 0, points: 100, subscriptions: 0, certificates: 0, clientAccounts: 1000, money: 2100 },
  { rawIndex: 11, service: 'Педикюр Smart классический', discount: 300, points: 0, subscriptions: 2500, certificates: 0, clientAccounts: 0, money: 400 },
  { rawIndex: 12, service: 'Уход для волос глубокое восстановление Kerastase', discount: 500, points: 300, subscriptions: 0, certificates: 2000, clientAccounts: 0, money: 2700 },
  { rawIndex: 13, service: 'Стрижка мужская Fade / Кроп', discount: 0, points: 100, subscriptions: 0, certificates: 0, clientAccounts: 0, money: 1900 },
  { rawIndex: 14, service: 'Стрижка мужская Fade / Кроп', discount: 200, points: 0, subscriptions: 0, certificates: 0, clientAccounts: 500, money: 1300 },
  { rawIndex: 15, service: 'Окрашивание корней Matrix', discount: 0, points: 250, subscriptions: 0, certificates: 1500, clientAccounts: 0, money: 3250 },
  { rawIndex: 16, service: 'Архитектура и коррекция бровей', discount: 100, points: 50, subscriptions: 0, certificates: 0, clientAccounts: 0, money: 1050 }
];

export default function App() {
  // Primary top-level navigation: Tab 1 (Финансовый отчет) vs Tab 2 (Отчет по услугам)
  const [primaryTab, setPrimaryTab] = useState<'finance' | 'services'>('finance');

  // Application State - Tab 1 (Finance)
  const [cutoffDateStr, setCutoffDateStr] = useState('20.05.2026'); // June 2026 is current. June starts on 1st. Let's make cutoff May 20th, 2026
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawRecords, setRawRecords] = useState<RawRecord[]>([]);
  const [userOverrides, setUserOverrides] = useState<Record<string | number, number>>({});
  const [manualMastersSalary, setManualMastersSalary] = useState<string>('');
  const [manualAdminsSalary, setManualAdminsSalary] = useState<string>('');
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [transactionMappings, setTransactionMappings] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'data' | 'formulas' | 'nonzero'>('all');
  const [activeTab, setActiveTab] = useState<'financial' | 'salary' | 'revenue-details' | 'raw' | 'faq'>('financial');
  const [showRevenueDetailInline, setShowRevenueDetailInline] = useState(true);
  const [revenueSearch, setRevenueSearch] = useState('');
  const [revenueCategoryFilter, setRevenueCategoryFilter] = useState<'all' | 'services' | 'goods' | 'other'>('all');
  const [expandedRevenueItems, setExpandedRevenueItems] = useState<Record<string, boolean>>({});
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editingRowValue, setEditingRowValue] = useState<string>('');
  const [expandedExtraRows, setExpandedExtraRows] = useState<Record<number, boolean>>({});
  const [expandedReportRows, setExpandedReportRows] = useState<Record<number, boolean>>({});
  const [notification, setNotification] = useState<{ status: 'success' | 'error', message: string } | null>(null);

  // Application State - Tab 2 (Services Report)
  const [servicesRecords, setServicesRecords] = useState<RawServiceRecord[]>([]);
  const [servicesFileName, setServicesFileName] = useState<string | null>(null);
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesDragActive, setServicesDragActive] = useState(false);
  const [expandedServiceItems, setExpandedServiceItems] = useState<Record<string, boolean>>({});
  const [customVariableExpenses, setCustomVariableExpenses] = useState<string>('');
  const [customFixedExpenses, setCustomFixedExpenses] = useState<string>('');
  const [isServicesCustomExpensesActive, setIsServicesCustomExpensesActive] = useState(false);
  const [servicesStats, setServicesStats] = useState<ServicesPreprocessingStats | null>(null);
  const servicesFileInputRef = useRef<HTMLInputElement>(null);

  // Staging and processing states
  const [stagedRecords, setStagedRecords] = useState<RawRecord[]>([]);
  const [stagedFileName, setStagedFileName] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse cutoff date. Re-computes whenever cutoff string changes.
  const parsedCutoffDate = useMemo(() => {
    return parseDate(cutoffDateStr);
  }, [cutoffDateStr]);

  // Validates if input matches standard DD.MM.YYYY
  const isCutoffDateValid = useMemo(() => {
    if (!cutoffDateStr) return false;
    const regex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!regex.test(cutoffDateStr)) return false;
    const d = parsedCutoffDate;
    return d !== null && !isNaN(d.getTime());
  }, [cutoffDateStr, parsedCutoffDate]);

  // Handle uploaded data
  const handleDataParsed = (recordsList: RawRecord[], name: string) => {
    setStagedRecords(recordsList);
    setStagedFileName(name);
    setIsProcessed(false);
    setUserOverrides({});
    setCategoryMappings({});
    setTransactionMappings({});
    setNotification({
      status: 'success',
      message: `Файл "${name}" (${recordsList.length} транзакций) успешно загружен и подготовлен к обработке. Нажмите кнопку «Запустить программу» ниже.`
    });
  };

  // Run the processing engine & trigger automatic download of both reports
  const handleRunProgram = async () => {
    if (stagedRecords.length === 0) {
      setNotification({
        status: 'error',
        message: 'Пожалуйста, сначала выберите или загрузите файл данных.'
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep(1);

    // Step 1: Parsing entries
    await new Promise((resolve) => setTimeout(resolve, 500));
    setProcessingStep(2);

    // Step 2: Extracting contractor groupings & materials
    await new Promise((resolve) => setTimeout(resolve, 500));
    setProcessingStep(3);

    // Step 3: Performing math & formulas validation
    await new Promise((resolve) => setTimeout(resolve, 500));
    setProcessingStep(4);

    // Final state sync
    const finalRecords = [...stagedRecords];
    const finalName = stagedFileName || 'Обработанные_Данные.xlsx';

    // Parse manual salaries if entered
    const newOverrides = { ...userOverrides };
    if (manualMastersSalary.trim() !== '') {
      const parsedMasters = parseFloat(manualMastersSalary.replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(parsedMasters)) {
        newOverrides["Зарплата мастеров"] = -Math.abs(parsedMasters);
      }
    }
    if (manualAdminsSalary.trim() !== '') {
      const parsedAdmins = parseFloat(manualAdminsSalary.replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(parsedAdmins)) {
        newOverrides["Зарплата административного персонала"] = -Math.abs(parsedAdmins);
      }
    }
    setUserOverrides(newOverrides);

    // Set records so that useMemo automatically generates report & salary rows
    setRawRecords(finalRecords);
    setFileName(finalName);
    setIsProcessed(true);
    setIsProcessing(false);
    setProcessingStep(0);

    // Automatically trigger downloads for both reports
    try {
      const financialResults = generateFinancialReport(finalRecords, newOverrides, categoryMappings, transactionMappings, finalName);
      const { report: financialReport, extraRows, revenueDetails } = financialResults;
      const salaryResults = processSalaryPayments(finalRecords, parsedCutoffDate);
      const { employees: salaryEmployees } = salaryResults;

      // 1. Download Financial Spreadsheet
      downloadFinancialSpreadsheet(financialReport, extraRows, revenueDetails);
      
      // 2. Download Salary Spreadsheet with 500ms delay to avoid browser blocking multiple downloads
      setTimeout(() => {
        downloadSalarySpreadsheet(salaryEmployees);
      }, 500);

      setNotification({
        status: 'success',
        message: 'Программа успешно запущена! Финансовый отчет и зарплатная ведомость были обработаны и автоматически скачаны.'
      });
    } catch (err: any) {
      setNotification({
        status: 'error',
        message: `Ошибка автоматического скачивания отчётов: ${err.message || err}`
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rawData = evt.target?.result;
        if (!rawData) throw new Error('Не удалось прочитать файл');
        
        const dataArray = new Uint8Array(rawData as ArrayBuffer);
        const workbook = XLSX.read(dataArray, { type: 'array', cellDates: true });
        
        const { records, errors } = parseUploadedSpreadsheet(workbook);
        
        if (errors.length > 0) {
          setNotification({ status: 'error', message: errors.join(' ') });
          return;
        }

        handleDataParsed(records, selectedFile.name);
      } catch (err: any) {
        setNotification({
          status: 'error',
          message: `Ошибка чтения документа: ${err.message || 'неподдерживаемый формат'}`
        });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
        setNotification({
          status: 'error',
          message: 'Недопустимый формат файла. Пожалуйста, загрузите файл .xlsx, .xls или .csv'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const rawData = evt.target?.result;
          if (!rawData) throw new Error('Не удалось прочитать файл');
          const dataArray = new Uint8Array(rawData as ArrayBuffer);
          const workbook = XLSX.read(dataArray, { type: 'array', cellDates: true });
          const { records, errors } = parseUploadedSpreadsheet(workbook);

          if (errors.length > 0) {
            setNotification({ status: 'error', message: errors.join(' ') });
            return;
          }

          handleDataParsed(records, selectedFile.name);
        } catch (err: any) {
          setNotification({
            status: 'error',
            message: `Ошибка парсинга: ${err.message}`
          });
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  // Load realistic demo data
  const loadDemoData = () => {
    const structured = DEMO_RECORDS.map((dem, idx) => ({
      ...dem,
      id: `demo_rec_${idx}_${Date.now()}`,
      date: parseDate(dem.dateStr),
    }));
    handleDataParsed(structured, 'Финансовые_операции_(25.01.2026_-_31.01.2026).xlsx');
  };

  // Processing results: Financial Report
  const financialResults = useMemo(() => {
    return generateFinancialReport(rawRecords, userOverrides, categoryMappings, transactionMappings, fileName);
  }, [rawRecords, userOverrides, categoryMappings, transactionMappings, fileName]);

  const { report: financialReport, extraRows, revenueDetails } = financialResults;

  // Filtered revenue details for the dedicated revenue tab
  const filteredRevenueDetails = useMemo(() => {
    if (!revenueDetails) return [];
    return revenueDetails.filter((item) => {
      const matchesSearch = !revenueSearch || 
        item.name.toLowerCase().includes(revenueSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(revenueSearch.toLowerCase());
      
      let matchesCat = true;
      if (revenueCategoryFilter === 'services') {
        matchesCat = item.category.toLowerCase().includes('услуг');
      } else if (revenueCategoryFilter === 'goods') {
        matchesCat = item.category.toLowerCase().includes('товар');
      } else if (revenueCategoryFilter === 'other') {
        matchesCat = !item.category.toLowerCase().includes('услуг') && !item.category.toLowerCase().includes('товар');
      }

      return matchesSearch && matchesCat;
    });
  }, [revenueDetails, revenueSearch, revenueCategoryFilter]);

  // Aggregate stats for revenue detailing
  const revenueStats = useMemo(() => {
    if (!revenueDetails || revenueDetails.length === 0) {
      return { totalSum: 0, totalCount: 0, servicesSum: 0, goodsSum: 0 };
    }
    let totalSum = 0;
    let totalCount = 0;
    let servicesSum = 0;
    let goodsSum = 0;
    revenueDetails.forEach(item => {
      totalSum += item.sum;
      totalCount += item.count;
      if (item.category.toLowerCase().includes('услуг')) {
        servicesSum += item.sum;
      } else if (item.category.toLowerCase().includes('товар')) {
        goodsSum += item.sum;
      }
    });
    return {
      totalSum,
      totalCount,
      servicesSum,
      goodsSum
    };
  }, [revenueDetails]);

  // Processing results: Salary Payments
  const salaryResults = useMemo(() => {
    return processSalaryPayments(rawRecords, parsedCutoffDate);
  }, [rawRecords, parsedCutoffDate]);

  const { employees: salaryEmployees, metrics: salaryMetrics } = salaryResults;

  // KPIs
  const totalRevenue = useMemo(() => {
    return financialReport.find(r => r.label === "Выручка общая")?.value || 0;
  }, [financialReport]);

  const rawExpensesRow = financialReport.find(r => r.label === "Расходы");
  const totalExpenses = rawExpensesRow ? rawExpensesRow.value : 0;

  const rawNetProfitRow = financialReport.find(r => r.label === "ЧИСТАЯ ПРИБЫЛЬ");
  const netProfit = rawNetProfitRow ? rawNetProfitRow.value : 0;

  const rawProfitabilityRow = financialReport.find(r => r.label === "Рентабельность");
  const profitability = rawProfitabilityRow ? rawProfitabilityRow.value : 0;

  // Edit cell value actions
  const startEditingRow = (idx: number, currentVal: number) => {
    setEditingRowIdx(idx);
    setEditingRowValue(String(currentVal));
  };

  const saveRowOverride = (idx: number) => {
    let num = parseFloat(editingRowValue);
    if (isNaN(num)) {
      setNotification({ status: 'error', message: 'Введите корректное числовое значение' });
      return;
    }
    const label = financialReport[idx]?.label;
    if (label === "Зарплата административного персонала" || label === "Зарплата мастеров") {
      num = -Math.abs(num);
    }
    const updated = { ...userOverrides, [idx]: num };
    setUserOverrides(updated);
    setEditingRowIdx(null);
    setNotification({
      status: 'success',
      message: `Показатель "${financialReport[idx].label}" изменен вручную.`
    });
  };

  const resetRowOverride = (idx: number) => {
    const updated = { ...userOverrides };
    delete updated[idx];
    setUserOverrides(updated);
    setNotification({
      status: 'success',
      message: `Сброшено ручное изменение для "${financialReport[idx].label}"`
    });
  };

  // Header quick statistics
  const fileLoaded = rawRecords.length > 0;

  // Filtered target list of indicators to display
  const filteredReportRows = useMemo(() => {
    return financialReport.filter((row) => {
      // 1. Label matches search query
      const matchesSearch = row.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Type matches filters
      let matchesFilter = true;
      if (tableFilter === 'data') {
        matchesFilter = row.type === 'data';
      } else if (tableFilter === 'formulas') {
        matchesFilter = row.type === 'formula';
      } else if (tableFilter === 'nonzero') {
        matchesFilter = row.value !== 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [financialReport, searchQuery, tableFilter]);

  // -------------------------------------------------------------
  // TAB 2 (SERVICES REPORT) LOGIC & COST ALLOCATION
  // -------------------------------------------------------------
  // Variable and Fixed expenses extracted from Financial Report (Tab 1)
  const variableExpensesFromReport = useMemo(() => {
    const row = financialReport.find(r => r.label === "Расходы переменные");
    return row ? Math.abs(row.value) : 0;
  }, [financialReport]);

  const fixedExpensesFromReport = useMemo(() => {
    const row = financialReport.find(r => r.label === "Расходы постоянные");
    return row ? Math.abs(row.value) : 0;
  }, [financialReport]);

  const activeVariableExpenses = useMemo(() => {
    if (isServicesCustomExpensesActive && customVariableExpenses !== '') {
      return parseFloat(customVariableExpenses) || 0;
    }
    return variableExpensesFromReport;
  }, [isServicesCustomExpensesActive, customVariableExpenses, variableExpensesFromReport]);

  const activeFixedExpenses = useMemo(() => {
    if (isServicesCustomExpensesActive && customFixedExpenses !== '') {
      return parseFloat(customFixedExpenses) || 0;
    }
    return fixedExpensesFromReport;
  }, [isServicesCustomExpensesActive, customFixedExpenses, fixedExpensesFromReport]);

  // Main Services Report Generation
  const servicesReport = useMemo(() => {
    return generateServicesReport(servicesRecords, activeVariableExpenses, activeFixedExpenses);
  }, [servicesRecords, activeVariableExpenses, activeFixedExpenses]);

  // Filtered Services List for Search
  const filteredServiceItems = useMemo(() => {
    if (!servicesSearchQuery.trim()) return servicesReport.items;
    const q = servicesSearchQuery.toLowerCase().trim();
    return servicesReport.items.filter(item => item.service.toLowerCase().includes(q));
  }, [servicesReport.items, servicesSearchQuery]);

  // Handle uploaded services file with numeric preprocessing
  const processServicesFile = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rawData = evt.target?.result;
        if (!rawData) throw new Error('Не удалось прочитать файл');
        const dataArray = new Uint8Array(rawData as ArrayBuffer);
        const workbook = XLSX.read(dataArray, { type: 'array', cellDates: true });
        const { records, errors, stats } = parseServicesSpreadsheet(workbook);

        if (errors.length > 0) {
          setNotification({ status: 'error', message: errors.join(' ') });
          return;
        }

        setServicesRecords(records);
        setServicesFileName(selectedFile.name);
        setServicesStats(stats);
        setNotification({
          status: 'success',
          message: `Файл по услугам «${selectedFile.name}» (${records.length} строк) успешно загружен! Выполнена предобработка числовых показателей: очищено и нормализовано ${stats.cleanedFieldsCount} значений (валюты, пробелы, скобки, разделители). Выручка рассчитана.`
        });
      } catch (err: any) {
        setNotification({
          status: 'error',
          message: `Ошибка чтения файла по услугам: ${err.message || 'неподдерживаемый формат'}`
        });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleServicesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processServicesFile(selectedFile);
  };

  const handleServicesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setServicesDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
        setNotification({
          status: 'error',
          message: 'Недопустимый формат файла. Пожалуйста, загрузите файл .xlsx, .xls или .csv'
        });
        return;
      }
      processServicesFile(selectedFile);
    }
  };

  const loadDemoServicesData = () => {
    const structured: RawServiceRecord[] = DEMO_SERVICES_RECORDS.map((dem, idx) => {
      const rev = dem.points + dem.subscriptions + dem.certificates + dem.clientAccounts + dem.money;
      return {
        ...dem,
        id: `demo_svc_${idx}_${Date.now()}`,
        revenue: parseFloat(rev.toFixed(2))
      };
    });
    setServicesRecords(structured);
    setServicesFileName('Услуги_салона_(25.01.2026_-_31.01.2026).xlsx');
    setServicesStats({
      totalRows: DEMO_SERVICES_RECORDS.length,
      validServiceRows: DEMO_SERVICES_RECORDS.length,
      cleanedFieldsCount: DEMO_SERVICES_RECORDS.length * 6,
      recognizedColumns: {
        service: 'Услуга',
        discount: 'Скидка',
        points: 'Баллы',
        subscriptions: 'Абонементы',
        certificates: 'Сертификаты',
        clientAccounts: 'Оплачено со счетов клиентов, ₽',
        money: 'Оплачено деньгами, ₽'
      }
    });
    if (rawRecords.length === 0) {
      loadDemoData();
    }
    setNotification({
      status: 'success',
      message: 'Демо-данные по услугам успешно загружены! Предобработка числовых показателей выполнена, затраты распределены пропорционально выручке.'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={servicesFileInputRef}
        onChange={handleServicesFileUpload}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      
      {/* Upper Brand Premium Bar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-150">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight flex items-center gap-2">
                AI‑Помощник Финансовых Отчетов
                <span className="text-[10px] px-2 py-0.5 rounded-full font-sans font-medium bg-indigo-50 text-indigo-700 tracking-normal border border-indigo-100">v1.2</span>
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Автоматизированный разбор статей доходов, расходов и умных зарплатных периодов
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Cutoff Date Input with Visual Validation */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2.5 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-150 relative">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <div className="flex flex-col text-left">
                <label className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Дата Отсечения ЗП</label>
                <input
                  type="text"
                  value={cutoffDateStr}
                  onChange={(e) => setCutoffDateStr(e.target.value)}
                  className="bg-transparent font-mono text-xs font-semibold text-gray-800 border-none outline-none focus:ring-0 p-0 w-24"
                  placeholder="ДД.ММ.ГГГГ"
                  title="Укажите дату отсечения для разделения периодов выплат (все выплаты до этой даты попадут в прошлый период)"
                />
              </div>
              
              {isCutoffDateValid ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Дата верна" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Невалидный формат даты. Ожидается ДД.ММ.ГГГГ" />
              )}
            </div>

            {/* Quick Demo Loader */}
            {stagedRecords.length === 0 && (
              <button
                onClick={loadDemoData}
                className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100/70 transition-all rounded-xl cursor-pointer"
              >
                Загрузить Демо
              </button>
            )}

            {stagedRecords.length > 0 && !isProcessed && (
              <button
                onClick={handleRunProgram}
                disabled={isProcessing || !isCutoffDateValid}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-100 disabled:opacity-55 disabled:cursor-not-allowed animate-pulse"
                title="Запустить расчет и скачать отчеты"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Запуск</span>
              </button>
            )}

            {isProcessed && (
              <button
                onClick={handleRunProgram}
                disabled={isProcessing || !isCutoffDateValid}
                className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 transition-all rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                title="Перезапустить обработку программы и повторно скачать отчеты"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Запустить повторно</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Dynamic Alerts/Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 mb-6 rounded-xl border flex items-start gap-3 justify-between ${
                notification.status === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-150' 
                  : 'bg-rose-50 text-rose-800 border-rose-150'
              }`}
            >
              <div className="flex gap-2.5 items-start">
                {notification.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-xs font-medium leading-relaxed">{notification.message}</span>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-[10px] uppercase font-semibold text-gray-400 hover:text-gray-600 px-1"
              >
                Закрыть
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Tabs Switcher: Вкладка 1 (Финансовый отчет) | Вкладка 2 (Отчет по услугам) */}
        <div className="bg-white p-2 rounded-2xl border border-gray-200/80 shadow-xs mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrimaryTab('finance')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                primaryTab === 'finance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Вкладка 1: Финансовый отчет</span>
              {isProcessed && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Данные обработаны"></span>
              )}
            </button>

            <button
              onClick={() => setPrimaryTab('services')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                primaryTab === 'services'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Вкладка 2: Отчет по услугам</span>
              {servicesRecords.length > 0 ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  primaryTab === 'services' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                }`}>
                  {servicesReport.items.length} услуг
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-150">
                  Загрузить файл
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl self-end sm:self-auto border border-gray-100">
            {primaryTab === 'finance' ? (
              <span>Основной финансовый отчет, зарплаты и детализация</span>
            ) : (
              <span>Группировка услуг, расчет выручки и распределение затрат</span>
            )}
          </div>
        </div>

        {/* TAB 1: ФИНАНСОВЫЙ ОТЧЕТ */}
        {primaryTab === 'finance' && (
          <div>
            {/* If no file uploaded, show Upload Prompt Jumbotron */}
            {!isProcessed ? (
          <div>
            {isProcessing ? (
              /* Premium Step-by-Step Processing Loader */
              <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-150 p-10 shadow-xl my-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1.5 bg-indigo-600 transition-all duration-500" style={{ width: `${(processingStep / 4) * 100}%` }}></div>
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                  <h2 className="font-display font-extrabold text-2xl text-gray-900 tracking-tight">Обработка финансовых данных</h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Пожалуйста, подождите. Алгоритм структурирует статьи доходов и расходов в реальном времени</p>
                </div>

                <div className="space-y-6 max-w-lg mx-auto">
                  <div className="flex items-start gap-4 p-3.5 rounded-2xl transition-all duration-300 border border-gray-100 bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-600 text-white">1</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">Нормализация и разбор транзакций</span>
                        {processingStep > 1 ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]"><Check className="w-3 h-3" /></div>
                        ) : processingStep === 1 ? (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Чтение исходных Excel-строк: сумм, дат, категорий и примечаний.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3.5 rounded-2xl transition-all duration-300 border border-gray-100 bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-600 text-white">2</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">Фильтрация поставщиков косметики и материалов</span>
                        {processingStep > 2 ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]"><Check className="w-3 h-3" /></div>
                        ) : processingStep === 2 ? (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Поиск вхождений контрагентов (Loreal, Matrix, ProfiLine) в статьи расходов.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3.5 rounded-2xl transition-all duration-300 border border-gray-100 bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-600 text-white">3</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">Умный расчет зарплатных периодов</span>
                        {processingStep > 3 ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]"><Check className="w-3 h-3" /></div>
                        ) : processingStep === 3 ? (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Разделение на прошлые и отчетные выплаты по дате отсечения {cutoffDateStr}.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3.5 rounded-2xl transition-all duration-300 border border-gray-100 bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-600 text-white">4</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">Автоматическая выгрузка XLSX-файлов</span>
                        {processingStep > 4 ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]"><Check className="w-3 h-3" /></div>
                        ) : processingStep === 4 ? (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Генерация двух сводных таблиц (Финансовый отчет и Зарплатная ведомость).</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : stagedRecords.length > 0 ? (
              /* Gorgeous Staging Preparation View */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
                
                {/* Left Card: Staging Info & Parameters */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm flex flex-col justify-between flex-grow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-indigo-900">
                      <FileText className="w-48 h-48 pointer-events-none" />
                    </div>

                    <div>
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] rounded-lg uppercase tracking-wider font-bold">Файлы готовы</span>
                      <h2 className="font-display font-extrabold text-2xl text-gray-900 tracking-tight mt-3">Файл успешно загружен в память</h2>
                      <p className="text-xs text-gray-500 mt-1">Доступ к данным полностью защищен и готов к запуску программы обработки.</p>
                      
                      {/* File metadata badges */}
                      <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Table className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-gray-800 truncate max-w-[220px]" title={stagedFileName || ''}>{stagedFileName}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{stagedRecords.length} транзакций распознано</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/50 text-indigo-700 px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Проверка валидности: ОК</span>
                        </div>
                      </div>

                      {/* Setup Cutoff Parameter right here */}
                      <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 block">Укажите или проверьте дату отсечения зарплат</h3>
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2.5 bg-gray-55 px-4 py-2.5 rounded-xl border border-gray-150 relative">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <div className="flex flex-col text-left">
                              <label className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Дата отрезка ЗП</label>
                              <input
                                type="text"
                                value={cutoffDateStr}
                                onChange={(e) => setCutoffDateStr(e.target.value)}
                                className="bg-transparent font-mono text-sm font-semibold text-gray-800 border-none outline-none focus:ring-0 p-0 w-28"
                                placeholder="ДД.ММ.ГГГГ"
                                title="Укажите дату отсечения"
                              />
                            </div>
                            
                            {isCutoffDateValid ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Дата верна" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Невалидный формат даты. Ожидается ДД.ММ.ГГГГ" />
                            )}
                          </div>

                          <p className="text-[11px] text-gray-500 leading-relaxed pt-1.5">
                            Все транзакции со словом «Зарплата» в категории и ключевыми словами в комментарии с датой <strong>строго до</strong> указанной будут отнесены к прошлому периоду. Остальные — к отчетному.
                          </p>
                        </div>
                      </div>

                      {/* Manual Salaries Input right here */}
                      <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 block">Ручной ввод финансовых показателей</h3>
                        <p className="text-[11px] text-gray-500 mb-4">
                          Заполните эти поля, если хотите дополнить или переопределить суммы выплат зарплаты напрямую при загрузке документа:
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2.5 bg-gray-55 px-4 py-2.5 rounded-xl border border-gray-150 relative">
                            <div className="flex flex-col text-left w-full">
                              <label className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Зарплата административного персонала (₽)</label>
                              <input
                                type="text"
                                id="manual_admins_salary_input"
                                value={manualAdminsSalary}
                                onChange={(e) => setManualAdminsSalary(e.target.value)}
                                className="bg-transparent font-mono text-sm font-semibold text-gray-800 border-none outline-none focus:ring-0 p-0 w-full"
                                placeholder="Например: 125000"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 bg-gray-55 px-4 py-2.5 rounded-xl border border-gray-150 relative">
                            <div className="flex flex-col text-left w-full">
                              <label className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Зарплата мастеров (₽)</label>
                              <input
                                type="text"
                                id="manual_masters_salary_input"
                                value={manualMastersSalary}
                                onChange={(e) => setManualMastersSalary(e.target.value)}
                                className="bg-transparent font-mono text-sm font-semibold text-gray-800 border-none outline-none focus:ring-0 p-0 w-full"
                                placeholder="Например: 340000"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleRunProgram}
                        disabled={!isCutoffDateValid}
                        className={`flex-1 py-3.5 px-6 rounded-xl font-display font-bold text-xs text-center flex items-center justify-center gap-2.5 shadow-md shadow-indigo-100 transition-all duration-300 ${
                          isCutoffDateValid 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Запустить обработку и скачать отчеты
                      </button>
                      <button
                        onClick={() => {
                          setStagedRecords([]);
                          setStagedFileName(null);
                        }}
                        className="py-3.5 px-5 rounded-xl border border-gray-250 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
                      >
                        Сбросить файл
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Card: Guide Sidebar info summary */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm flex-grow">
                    <h3 className="font-display font-semibold text-gray-900 text-md flex items-center gap-2 mb-4">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Что произойдет при запуске?
                    </h3>
                    
                    <ul className="space-y-4 text-xs text-gray-600 leading-relaxed font-sans">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
                        <div>
                          <strong className="text-gray-800 block">Разделение заработной платы:</strong> 
                          Ведомости по каждому сотруднику будут разбиты на периоды и собраны с остатками.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
                        <div>
                          <strong className="text-gray-800 block">Группировка Salon-Suppliers:</strong> 
                          Программа сама найдет расходы на Matrix красители, Loreal витрину и Profiline.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] mt-0.5">3</span>
                        <div>
                          <strong className="text-gray-800 block">Автоматический экспорт:</strong> 
                          Готовые файлы <span className="font-semibold text-indigo-750">«Финансовый_отчет.xlsx»</span> и <span className="font-semibold text-emerald-800">«Зарплатная_ведомость.xlsx»</span> автоматически скачаются на компьютер.
                        </div>
                      </li>
                    </ul>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/30">
                        <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>Система полностью готова. Нажмите кнопку <strong>«Запустить обработку»</strong> слева или кнопку <strong>«Запуск»</strong> в верхнем меню.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-12">
                  <TestPlayground />
                </div>
              </div>
            ) : (
              /* Original File Upload dropzone */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
                
                {/* Left Big Upload Box */}
                <div className="lg:col-span-7">
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[420px] transition-all duration-300 ${
                      dragActive 
                        ? 'border-indigo-600 bg-indigo-50/40 scale-[0.99] shadow-inner' 
                        : 'border-gray-250 bg-white hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 transition-transform hover:scale-105">
                      <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    
                    <h2 className="font-display font-bold text-xl text-gray-900 tracking-tight">
                      Перетащите файл финансового отчета
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                      Рекомендуемые форматы: <code className="font-mono bg-gray-50 px-1 py-0.5 text-xs text-indigo-600">.xlsx</code> или <code className="font-mono bg-gray-50 px-1 py-0.5 text-xs text-indigo-600">.csv</code>. 
                      Минимальные требуемые колонки: «Сумма, Р», «Назначение», «Контрагент», «Комментарий», «Дата».
                    </p>

                    <div className="mt-8 flex gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        Выбрать файл на устройстве
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Guide & FAQ Sidebar */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                  <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm flex-1">
                    <h3 className="font-display font-semibold text-gray-900 text-md flex items-center gap-2 mb-4">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Руководство по обработке данных
                    </h3>
                    
                    <ul className="space-y-4 text-xs text-gray-600 leading-relaxed font-sans">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
                        <div>
                          <strong className="text-gray-800">Умное объединение:</strong> 
                          Система ищет вхождение строк отчёта в исходные данные (например, исходная <code className="px-1 bg-gray-100 rounded">2026 Аренда</code> запишется в строке <code className="px-1 bg-gray-100 rounded">Аренда</code>).
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
                        <div>
                          <strong className="text-gray-800">Фильтрация Поставщиков:</strong> 
                          Закупки материалов/товаров автоматически распределяются по соответствующим контрагентам (из строк 54–86).
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] mt-0.5">3</span>
                        <div>
                          <strong className="text-gray-800">Разделение зарплат:</strong> 
                          Формируется отдельная зарплатная ведомость, группируемая по ФИО, с разделением на «прошлый период» на основе указанной вверху даты отсечения.
                        </div>
                      </li>
                    </ul>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/30">
                        <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>Для быстрого ознакомления нажмите <strong>«Загрузить Демо»</strong> в верхнем меню.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-12">
                  <TestPlayground />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Main Dashboard with Tabs on data loaded */
          <div className="space-y-6">
            
            {/* KPI Summary Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Loaded stats card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Файл Распознан</div>
                <div className="font-display font-extrabold text-lg text-gray-900 mt-2 truncate max-w-[220px]" title={fileName || ''}>
                  {fileName}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{rawRecords.length} записей импортировано</span>
                </div>
              </div>

              {/* Total revenues card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Выручка Общая</div>
                <div className="font-display font-extrabold text-2xl text-emerald-600 mt-2">
                  {totalRevenue.toLocaleString('ru-RU')} ₽
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  На основе исходных статей
                </div>
              </div>

              {/* Expenses card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Всего Расходов</div>
                <div className="font-display font-extrabold text-2xl text-rose-500 mt-2">
                  {totalExpenses.toLocaleString('ru-RU')} ₽
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Автоматический расчет
                </div>
              </div>

              {/* Theoretical Profit card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Чистая Прибыль / Рентабельность</div>
                <div className="font-display font-extrabold text-2xl text-indigo-700 mt-2">
                  {netProfit.toLocaleString('ru-RU')} ₽
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                  <span className="font-mono bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {profitability.toFixed(1)}% р-сть
                  </span>
                  <span>теоретический итог</span>
                </div>
              </div>

            </div>

            {/* Crucial Custom Message block for salary counts metrics */}
            <div className="bg-indigo-50/50 rounded-2xl p-4.5 border border-indigo-100/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <Users className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">Статистика по Зарплатным Выплатам</h4>
                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 md:line-clamp-none">
                    «Из <strong className="text-indigo-900">{salaryMetrics.totalCount}</strong> записей <strong className="text-indigo-900">{salaryMetrics.matchingSalaryCount}</strong> соответствуют критериям зарплатных выплат, из них <strong className="text-indigo-900">{salaryMetrics.pastPeriodCount}</strong> отнесены к прошлому периоду».
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[9px] uppercase font-bold bg-amber-50 text-amber-700 border border-amber-100/70 p-1.5 rounded-lg">
                  Прошлый период: {salaryMetrics.pastPeriodCount} выплат
                </span>
                <span className="text-[9px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/70 p-1.5 rounded-lg">
                  Отчетный период: {salaryMetrics.reportPeriodCount} выплат
                </span>
              </div>
            </div>

            {/* Download and Tabs control block */}
            <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Tab selector */}
              <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full md:w-auto overflow-x-auto">
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'financial' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Финансовый отчет
                </button>
                <button
                  onClick={() => setActiveTab('revenue-details')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'revenue-details' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Детализация доходов</span>
                  {revenueDetails && revenueDetails.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                      {revenueDetails.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'salary' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Зарплатные выплаты
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'raw' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Исходная таблица
                </button>
                <button
                  onClick={() => setPrimaryTab('services')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-150 ml-1"
                  title="Перейти во 2-ю вкладку: Отчет по услугам с распределением затрат"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Вкладка 2: Отчет по услугам →</span>
                </button>
              </div>

              {/* Downloads Actions */}
              <div className="flex gap-2 flex-wrap w-full md:w-auto">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
                  title="Выбрать новый исходный файл для расчета нового отчета"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Рассчитать новый отчет</span>
                </button>
                <button
                  onClick={() => downloadFinancialSpreadsheet(financialReport, extraRows, revenueDetails)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Скачать полный финансовый отчет со сводным и подробным листом"
                >
                  <Download className="w-3.5 h-3.5" />
                  Метрики (XLSX)
                </button>
                <button
                  onClick={() => downloadRevenueSpreadsheet(revenueDetails, totalRevenue)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Скачать отдельную ведомость по графе Услуга/Товар"
                >
                  <Download className="w-3.5 h-3.5" />
                  Услуги/Товары (XLSX)
                </button>
                <button
                  onClick={() => downloadSalarySpreadsheet(salaryEmployees)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  title="Скачать сформированную зарплатную таблицу"
                >
                  <Download className="w-3.5 h-3.5" />
                  Зарплатная ведомость (XLSX)
                </button>
                <button
                  onClick={() => downloadDocxReport(financialReport, rawRecords, categoryMappings, revenueDetails)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  title="Скачать финансовый отчет в формате .docx с детализацией доходов"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Отчет-ведомость (DOCX)
                </button>
                <button
                  onClick={() => {
                    setRawRecords([]);
                    setStagedRecords([]);
                    setFileName(null);
                    setStagedFileName(null);
                    setUserOverrides({});
                    setCategoryMappings({});
                    setTransactionMappings({});
                    setIsProcessed(false);
                    setNotification({
                      status: 'success',
                      message: 'Все очищено. Вы можете загрузить новые данные.'
                    });
                  }}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Очистить и сбросить все данные"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Financial tab content */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                
                {/* Filters Row */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4.5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                  {/* Search query input */}
                  <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-150 w-full sm:max-w-sm">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по показателям..."
                      className="bg-transparent text-xs w-full outline-none text-gray-700 border-none inline-block focus:ring-0"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs text-[11px] select-none font-medium">Очистить</button>
                    )}
                  </div>

                  {/* Toggle and Dropdown filters */}
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                    <button
                      onClick={() => setShowRevenueDetailInline(!showRevenueDetailInline)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        showRevenueDetailInline
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                          : 'bg-gray-50 border-gray-150 text-gray-500 hover:text-gray-700'
                      }`}
                      title="Показывать детализацию по графе Услуга/Товар прямо в строках отчета"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Детализация по «Услуга/Товар»: {showRevenueDetailInline ? 'Вкл' : 'Выкл'}</span>
                    </button>

                    <div className="flex group items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-150">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Показывать:</span>
                      <select
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value as any)}
                        className="bg-transparent border-none text-xs text-gray-700 outline-none pr-6 focus:ring-0 font-medium cursor-pointer"
                      >
                        <option value="all">Все строки</option>
                        <option value="data">Только вводимые статьи</option>
                        <option value="formulas">Только формулы</option>
                        <option value="nonzero">Только ненулевые</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Main spreadsheet card */}
                <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-600 font-bold select-none h-11">
                          <th className="p-3.5 pl-6 w-16 text-center font-mono text-[10px] text-gray-400">№</th>
                          <th className="p-3.5">Показатели</th>
                          <th className="p-3.5 w-40">Тип статьи</th>
                          <th className="p-3.5 text-right w-64 pr-6">Сумма (Руб)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-sans">
                        {filteredReportRows.map((row) => {
                          const isFormula = row.type === 'formula';
                          const isHeaderSection = row.type === 'section';
                          const isDataRow = !isFormula && !isHeaderSection;
                          const hasTransactions = row.transactions && row.transactions.length > 0;
                          const isExpanded = !!expandedReportRows[row.index];
                          
                          // Style based on type
                          let bgStyle = "bg-white hover:bg-gray-50/50";
                          if (isHeaderSection) {
                            bgStyle = "bg-gray-50/90 font-bold text-gray-900";
                          } else if (isFormula) {
                            bgStyle = "bg-indigo-50/10 font-medium hover:bg-indigo-50/25";
                          } else if (isDataRow) {
                            bgStyle = "bg-white hover:bg-indigo-50/10 cursor-pointer";
                          }

                          return (
                            <React.Fragment key={row.index}>
                              <tr 
                                className={`transition-colors h-11 ${bgStyle}`}
                                onClick={() => {
                                  if (isDataRow || (row.revenueDetails && row.revenueDetails.length > 0)) {
                                    setExpandedReportRows(prev => ({ ...prev, [row.index]: !prev[row.index] }));
                                  }
                                }}
                              >
                                <td className="p-3 text-center font-mono text-[11px] text-gray-400 border-r border-gray-50">
                                  {row.index + 1}
                                </td>
                                <td className="p-3 pl-4 font-sans font-medium text-gray-800">
                                  <div className="flex items-center gap-2">
                                    {(isDataRow || (row.revenueDetails && row.revenueDetails.length > 0)) && (
                                      <ChevronDown className={`w-3.5 h-3.5 text-indigo-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                    )}
                                    <span className={isHeaderSection ? "uppercase tracking-wide text-indigo-950 font-bold text-[11px]" : isFormula ? "text-indigo-900 font-semibold" : "text-gray-750 font-semibold"}>
                                      {row.label}
                                    </span>
                                    {isDataRow && (
                                      <span className="text-[10px] text-gray-400 font-normal font-mono" title={`${row.transactions ? row.transactions.length : 0} транзакций из исходного файла`}>
                                        ({row.transactions ? row.transactions.length : 0})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  {isHeaderSection ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50">Раздел</span>
                                  ) : isFormula ? (
                                    <div className="flex flex-col">
                                      <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-indigo-50/50 text-indigo-600 border border-indigo-100/30 inline-block w-max">Формула</span>
                                      {row.formula && <span className="text-[9px] text-gray-400 mt-0.5">{row.formula}</span>}
                                    </div>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-gray-100 text-gray-600 border border-gray-150/40">Статья ввода</span>
                                  )}
                                </td>
                                
                                <td className="p-3 text-right pr-6">
                                  <div className="flex items-center justify-end gap-2.5">
                                    {row.isCustomOverride && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          resetRowOverride(row.index);
                                        }}
                                        className="text-amber-600 hover:text-amber-700 flex items-center gap-0.5 text-[9px] font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-100"
                                        title="Сбросить ручную коррекцию"
                                      >
                                        <Undo className="w-3 h-3" /> Коррекция
                                      </button>
                                    )}

                                    {editingRowIdx === row.index ? (
                                      // Live edit cell input
                                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="number"
                                          value={editingRowValue}
                                          onChange={(e) => setEditingRowValue(e.target.value)}
                                          className="w-28 text-right px-2 py-1 text-xs font-mono border border-indigo-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 text-gray-800"
                                          title="Введите сумму в рублях"
                                          autoFocus
                                        />
                                        <button 
                                          onClick={() => saveRowOverride(row.index)}
                                          className="px-2 py-1 bg-emerald-600 text-white text-[10px] uppercase font-bold rounded-md hover:bg-emerald-700"
                                        >
                                          Сохр
                                        </button>
                                        <button 
                                          onClick={() => setEditingRowIdx(null)}
                                          className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold rounded-md hover:bg-gray-200"
                                        >
                                          Отмена
                                        </button>
                                      </div>
                                    ) : (
                                      // Row value display
                                      <div className="flex items-center gap-2 group-hover:bg-transparent">
                                        <span className={`font-mono font-semibold text-[13px] ${
                                          isFormula 
                                            ? 'text-indigo-800' 
                                            : isHeaderSection 
                                            ? 'text-indigo-950 font-bold' 
                                            : row.value > 0 
                                            ? 'text-gray-900' 
                                            : 'text-gray-400'
                                        }`}>
                                          {row.type === 'formula' && row.label.includes('Рентабельность') 
                                            ? `${row.value.toFixed(1)} %` 
                                            : `${row.value.toLocaleString('ru-RU')} ₽`
                                          }
                                        </span>
                                        
                                        {!isHeaderSection && !isFormula && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingRow(row.index, row.value);
                                            }}
                                            className="text-gray-400 hover:text-indigo-600 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                            title="Ручная коррекция показателя"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {showRevenueDetailInline && row.revenueDetails && row.revenueDetails.length > 0 && row.index >= 1 && row.index <= 7 && (
                                row.revenueDetails.map((detail, dIdx) => (
                                  <tr 
                                    key={`rev_inline_${row.index}_${dIdx}`}
                                    className="bg-indigo-50/15 hover:bg-indigo-50/35 transition-colors border-l-4 border-l-indigo-400 h-9"
                                  >
                                    <td className="p-2 text-center font-mono text-[10px] text-indigo-400 border-r border-gray-50">
                                      ↳
                                    </td>
                                    <td className="p-2 pl-8 font-sans text-gray-800">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400 font-mono text-xs">↳</span>
                                        <span className="font-medium text-gray-850 text-[11.5px]">{detail.name}</span>
                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-1.5 py-0.2 rounded border border-indigo-100/60" title="Количество сгруппированных строк">
                                          {detail.count} оп.
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-2">
                                      <span className="px-1.5 py-0.5 rounded text-[8.5px] uppercase font-bold bg-indigo-50/80 text-indigo-650 border border-indigo-100/50">
                                        Услуга/Товар
                                      </span>
                                    </td>
                                    <td className="p-2 text-right pr-6 font-mono font-bold text-gray-850 text-[12px]">
                                      {detail.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                    </td>
                                  </tr>
                                ))
                              )}
                              {isExpanded && (isDataRow || (row.revenueDetails && row.revenueDetails.length > 0)) && (
                                <tr className="bg-indigo-50-[0.02]">
                                  <td colSpan={4} className="p-4 pl-12 bg-indigo-50/20 border-b border-gray-100">
                                    {/* Grouped Revenue Detailing Card if present */}
                                    {row.revenueDetails && row.revenueDetails.length > 0 && (
                                      <div className="mb-4 bg-white p-3.5 rounded-xl border border-indigo-150 shadow-sm">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                          <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Детализация по графе «Услуга/Товар» (совпадающие строки сгруппированы и просуммированы):</span>
                                          </div>
                                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-semibold px-2 py-0.5 rounded border border-indigo-100">
                                            {row.revenueDetails.length} уникальных позиций
                                          </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-left text-[11px] divide-y divide-gray-100">
                                            <thead>
                                              <tr className="bg-indigo-50/30 text-indigo-900 font-bold text-[9px] uppercase select-none">
                                                <th className="p-2 pl-3">№</th>
                                                <th className="p-2">Наименование услуги/товара</th>
                                                <th className="p-2 text-center">Кол-во операций</th>
                                                <th className="p-2 text-center">Доля в статье</th>
                                                <th className="p-2 text-right pr-3">Итоговая сумма</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                              {row.revenueDetails.map((item, itIdx) => (
                                                <tr key={itIdx} className="hover:bg-gray-50/60">
                                                  <td className="p-2 pl-3 text-gray-400 font-mono">{itIdx + 1}</td>
                                                  <td className="p-2 font-medium text-gray-800">{item.name}</td>
                                                  <td className="p-2 text-center font-mono font-semibold text-indigo-700">{item.count}</td>
                                                  <td className="p-2 text-center font-mono text-gray-500">
                                                    {row.value > 0 ? `${((item.sum / row.value) * 100).toFixed(1)}%` : '—'}
                                                  </td>
                                                  <td className="p-2 text-right pr-3 font-mono font-bold text-gray-900">
                                                    {item.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {hasTransactions ? (
                                      <div className="overflow-x-auto rounded-xl border border-gray-200/60 shadow-sm bg-white">
                                        <table className="min-w-full divide-y divide-gray-150 text-left text-[11px]">
                                          <thead className="bg-indigo-50/50 font-semibold text-indigo-950 uppercase tracking-wider text-[9px] select-none">
                                            <tr>
                                              <th className="p-2.5 pl-4 w-24">Дата</th>
                                              <th className="p-2.5 w-40">Контрагент</th>
                                              <th className="p-2.5 w-44 font-bold text-indigo-950">Услуга/Товар</th>
                                              <th className="p-2.5">Назначение</th>
                                              <th className="p-2.5">Комментарий</th>
                                              <th className="p-2.5 text-right pr-4 w-32">Сумма</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 font-sans text-gray-650">
                                            {row.transactions!.map((t, tIdx) => (
                                              <tr key={tIdx} className="hover:bg-gray-50/40 transition-colors">
                                                <td className="p-2.5 pl-4 font-mono text-[10.5px]">
                                                  {t.date ? new Date(t.date).toLocaleDateString('ru-RU') : t.dateStr || '—'}
                                                </td>
                                                <td className="p-2.5 font-medium text-gray-800">
                                                   {t.counterparty || <span className="text-gray-400 italic">Не указан</span>}
                                                 </td>
                                                <td className="p-2.5 font-medium text-indigo-950 max-w-[200px] truncate" title={t.serviceProduct}>
                                                  {t.serviceProduct || <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="p-2.5 text-gray-700 max-w-[200px] truncate" title={t.category}>
                                                  {t.category || <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="p-2.5 text-gray-500 max-w-[200px] truncate" title={t.comment}>
                                                  {t.comment || <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="p-2.5 text-right pr-4 font-mono font-semibold text-gray-800">
                                                  {t.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="p-4 text-center text-gray-400 italic bg-white rounded-xl border border-gray-200/60 shadow-sm text-xs">
                                        Нет связанных транзакций в импортированном периоде
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Display unmatched додатковые (unexpected) rows if found */}
                        {(extraRows.length > 0 || Object.keys(categoryMappings).length > 0 || Object.keys(transactionMappings).length > 0) && (
                          <>
                            <tr className="bg-amber-50/50 font-bold text-amber-950 h-11 select-none">
                              <td className="p-3 text-center text-amber-400 border-r border-amber-100">+</td>
                              <td className="p-3 pl-4 uppercase tracking-wide text-[10px]" colSpan={3}>
                                Дополнительные нераспределенные показатели и ручные привязки
                              </td>
                            </tr>

                            {/* Active mappings summary view */}
                            {(Object.keys(categoryMappings).length > 0 || Object.keys(transactionMappings).length > 0) && (
                              <tr>
                                <td className="p-4" colSpan={4}>
                                  <div className="bg-indigo-50/30 p-4.5 rounded-2xl border border-indigo-100/40 space-y-3 text-left">
                                    {Object.keys(categoryMappings).length > 0 && (
                                      <div>
                                        <div className="text-[10px] uppercase font-bold text-indigo-950 tracking-wider mb-2">
                                          Активные привязки по категориям (Смена по умолчанию):
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 justify-start">
                                          {Object.entries(categoryMappings).map(([unmatchedCat, targetLabel]) => (
                                            <div key={unmatchedCat} className="flex items-center gap-1.5 bg-white border border-indigo-150 px-2.5 py-1 rounded-lg text-[11px] font-sans">
                                              <span className="font-semibold text-gray-750 truncate max-w-[150px]">{unmatchedCat}</span>
                                              <span className="text-gray-400">→</span>
                                              <span className="font-bold text-indigo-700">{targetLabel}</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const d = { ...categoryMappings };
                                                  delete d[unmatchedCat];
                                                  setCategoryMappings(d);
                                                }}
                                                className="text-gray-400 hover:text-rose-500 ml-1 font-bold text-xs cursor-pointer px-0.5"
                                                title="Сбросить привязку"
                                              >
                                                &times;
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {Object.keys(transactionMappings).length > 0 && (
                                      <div>
                                        <div className="text-[10px] uppercase font-bold text-emerald-950 tracking-wider mb-1.5 mt-2">
                                          Активные перенаправления транзакций:
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 justify-start">
                                          {Object.entries(transactionMappings).map(([tid, targetLabel]) => {
                                            const transaction = rawRecords.find(r => r.id === tid);
                                            const desc = transaction 
                                              ? `${transaction.sum.toLocaleString('ru-RU')} ₽ (${transaction.comment || transaction.category})` 
                                              : tid;
                                            return (
                                              <div key={tid} className="flex items-center gap-1.5 bg-white border border-emerald-150 px-2.5 py-1 rounded-lg text-[11px] font-sans">
                                                <span className="font-semibold text-gray-750 truncate max-w-[180px]">{desc}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-bold text-emerald-700">{targetLabel}</span>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const d = { ...transactionMappings };
                                                    delete d[tid];
                                                    setTransactionMappings(d);
                                                  }}
                                                  className="text-gray-400 hover:text-rose-500 ml-1 font-bold text-xs cursor-pointer px-0.5"
                                                  title="Сбросить перенаправление"
                                                >
                                                  &times;
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}

                            {extraRows.map((row, idx) => (
                              <React.Fragment key={`extra_${idx}`}>
                                <tr 
                                  className="bg-white hover:bg-amber-50/20 transition-colors h-11 cursor-pointer border-b border-gray-100 table-row text-left"
                                  onClick={() => setExpandedExtraRows(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                >
                                  <td className="p-3 text-center font-mono text-[11px] text-amber-400/80 border-r border-amber-50">
                                    {idx + 1 + financialReport.length}
                                  </td>
                                  <td className="p-3 pl-4 font-sans text-gray-750 font-medium flex items-center gap-2">
                                    <ChevronDown className={`w-3.5 h-3.5 text-amber-500 transition-transform ${expandedExtraRows[idx] ? 'rotate-180' : ''}`} />
                                    <span>{row.label}</span>
                                    {row.transactions && (
                                      <span className="text-[10px] text-gray-400 font-normal font-mono">
                                        ({row.transactions.length})
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                      <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                                        НЕТ В ТЕМПЛЕЙТЕ
                                      </span>
                                      <div className="inline-flex items-center gap-1.5">
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Связать всё:</span>
                                        <select
                                          value={categoryMappings[row.label] || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const updated = { ...categoryMappings };
                                            if (val) {
                                              updated[row.label] = val;
                                              setNotification({
                                                status: 'success',
                                                message: `Категория "${row.label}" перенаправлена на показатель "${val}". Финансовые показатели пересчитаны мгновенно!`
                                              });
                                            } else {
                                              delete updated[row.label];
                                            }
                                            setCategoryMappings(updated);
                                          }}
                                          className="bg-gray-55 hover:bg-gray-100 border border-gray-250 text-gray-700 rounded-lg text-[10.5px] px-2 py-1 font-sans focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
                                        >
                                          <option value="">-- выбрать --</option>
                                          {FINANCIAL_TEMPLATE.filter(r => r.type === 'data').sort((a,b) => a.label.localeCompare(b.label)).map((tRow) => (
                                            <option key={tRow.index} value={tRow.label}>
                                              {tRow.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right pr-6">
                                    <span className="font-mono font-semibold text-gray-900 text-[13px]">
                                      {row.value.toLocaleString('ru-RU')} ₽
                                    </span>
                                  </td>
                                </tr>
                                {expandedExtraRows[idx] && row.transactions && (
                                  <tr className="bg-amber-50/10">
                                    <td colSpan={4} className="p-4 pl-12 bg-gray-55/65 border-b border-gray-100">
                                      <div className="overflow-x-auto rounded-xl border border-gray-200/60 shadow-sm bg-white">
                                        <table className="min-w-full divide-y divide-gray-150 text-left text-[11px]">
                                          <thead className="bg-gray-50/85 font-semibold text-gray-600 uppercase tracking-wider text-[9px] select-none">
                                            <tr>
                                              <th className="p-2.5 pl-4 w-28">Дата</th>
                                              <th className="p-2.5 w-48">Контрагент</th>
                                              <th className="p-2.5 font-bold text-indigo-950">Назначение</th>
                                              <th className="p-2.5">Комментарий</th>
                                              <th className="p-2.5 text-right w-36">Сумма</th>
                                              <th className="p-2.5 text-center pr-4 w-48">Определить показатель</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-150 font-sans text-gray-650">
                                            {row.transactions.map((t, tIdx) => (
                                              <tr key={tIdx} className="hover:bg-gray-50/40 transition-colors">
                                                <td className="p-2.5 pl-4 font-mono text-[10.5px]">
                                                  {t.date ? new Date(t.date).toLocaleDateString('ru-RU') : t.dateStr || '—'}
                                                </td>
                                                <td className="p-2.5 font-medium text-gray-800">
                                                   {t.counterparty || <span className="text-gray-400 italic">Не указан</span>}
                                                 </td>
                                                 <td className="p-2.5 text-gray-700 max-w-[200px] truncate" title={t.category}>
                                                   {t.category || <span className="text-gray-300">—</span>}
                                                 </td>
                                                 <td className="p-2.5 text-gray-500 max-w-[200px] truncate" title={t.comment}>
                                                  {t.comment || <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="p-2.5 text-right font-mono font-semibold text-gray-800">
                                                  {t.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                                </td>
                                                <td className="p-2 text-center pr-4">
                                                  <select
                                                    value={transactionMappings[t.id] || ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      const updated = { ...transactionMappings };
                                                      if (val) {
                                                        updated[t.id] = val;
                                                        setNotification({
                                                          status: 'success',
                                                          message: `Транзакция на ${t.sum} ₽ перенаправлена на "${val}". Финансовые показатели пересчитаны мгновенно!`
                                                        });
                                                      } else {
                                                        delete updated[t.id];
                                                      }
                                                      setTransactionMappings(updated);
                                                    }}
                                                    className="bg-gray-50 hover:bg-gray-100 border border-gray-250 text-gray-600 rounded-lg px-2 py-1 text-[10px] font-sans focus:outline-none cursor-pointer max-w-[150px] truncate"
                                                  >
                                                    <option value="">-- авто --</option>
                                                    {FINANCIAL_TEMPLATE.filter(r => r.type === 'data').sort((a,b) => a.label.localeCompare(b.label)).map((tRow) => (
                                                      <option key={tRow.index} value={tRow.label}>
                                                        {tRow.label}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Details by Service/Product Tab Content */}
            {activeTab === 'revenue-details' && (
              <div className="space-y-6">
                
                {/* Header Information Banner */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-6 text-white shadow-md">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-white/10 rounded-xl">
                          <Layers className="w-5 h-5 text-indigo-200" />
                        </span>
                        <h3 className="font-display font-bold text-lg text-white">
                          Детализация доходной части (графа «Услуга/Товар»)
                        </h3>
                      </div>
                      <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                        Строки отчета, по которым записи в графе «Услуга/Товар» совпадают, автоматически сгруппированы и просуммированы. 
                        Вы можете просмотреть как итоговую сумму по каждой услуге или товару, так и раскрыть все связанные транзакции.
                      </p>
                    </div>

                    <button
                      onClick={() => downloadRevenueSpreadsheet(revenueDetails || [], totalRevenue)}
                      className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
                      title="Выгрузить отдельный Excel файл с детализацией по Услугам/Товарам"
                    >
                      <Download className="w-4 h-4 text-indigo-700" />
                      <span>Экспорт в Excel (XLSX)</span>
                    </button>
                  </div>

                  {/* Summary KPI Counters inside Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-700/60">
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Всего доходов</div>
                      <div className="text-xl font-bold font-mono mt-1 text-white">
                        {revenueStats.totalSum.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Позиций (Услуг/Товаров)</div>
                      <div className="text-xl font-bold font-mono mt-1 text-white">
                        {filteredRevenueDetails.length} <span className="text-xs text-indigo-300 font-normal">из {revenueDetails?.length || 0}</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Всего операций</div>
                      <div className="text-xl font-bold font-mono mt-1 text-white">
                        {revenueStats.totalCount} <span className="text-xs text-indigo-300 font-normal">строк</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Услуги / Товары</div>
                      <div className="text-xs font-mono mt-1 text-white flex flex-col gap-0.5">
                        <span className="truncate">Услуги: {revenueStats.servicesSum.toLocaleString('ru-RU')} ₽</span>
                        <span className="truncate">Товары: {revenueStats.goodsSum.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search & Category Filter Toolbar */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                  {/* Search query input */}
                  <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-150 w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={revenueSearch}
                      onChange={(e) => setRevenueSearch(e.target.value)}
                      placeholder="Поиск по названию услуги, товара или категории..."
                      className="bg-transparent text-xs w-full outline-none text-gray-700 border-none inline-block focus:ring-0"
                    />
                    {revenueSearch && (
                      <button onClick={() => setRevenueSearch('')} className="text-gray-400 hover:text-gray-600 text-xs select-none font-medium">
                        Очистить
                      </button>
                    )}
                  </div>

                  {/* Filter category pills */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setRevenueCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        revenueCategoryFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Все ({revenueDetails?.length || 0})
                    </button>
                    <button
                      onClick={() => setRevenueCategoryFilter('services')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        revenueCategoryFilter === 'services'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Только услуги
                    </button>
                    <button
                      onClick={() => setRevenueCategoryFilter('goods')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        revenueCategoryFilter === 'goods'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Только товары
                    </button>
                    <button
                      onClick={() => setRevenueCategoryFilter('other')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        revenueCategoryFilter === 'other'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Прочие / Сертификаты
                    </button>
                  </div>
                </div>

                {/* Main Detailing Table */}
                <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50/70 border-b border-gray-150 flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-700">
                        Сгруппированные записи по графе «Услуга/Товар»
                      </h3>
                    </div>
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-md font-semibold">
                      Показано строк: {filteredRevenueDetails.length}
                    </span>
                  </div>

                  {filteredRevenueDetails.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-xs">
                      {revenueSearch 
                        ? `По запросу «${revenueSearch}» ничего не найдено.` 
                        : 'Нет данных о доходах или в загруженном файле не заполнена графа «Услуга/Товар».'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 font-bold select-none h-11 border-b border-gray-150">
                            <th className="p-3.5 pl-6 w-16 text-center font-mono text-[10px] text-gray-400">№</th>
                            <th className="p-3.5">Наименование из графы «Услуга/Товар»</th>
                            <th className="p-3.5 w-48">Категория отчета</th>
                            <th className="p-3.5 text-center w-36">Кол-во операций</th>
                            <th className="p-3.5 text-center w-32">Доля в выручке</th>
                            <th className="p-3.5 text-right pr-6 w-44">Итоговая сумма</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                          {filteredRevenueDetails.map((item, idx) => {
                            const isExpanded = !!expandedRevenueItems[item.name];
                            const share = totalRevenue > 0 ? (item.sum / totalRevenue) * 100 : 0;
                            const isService = item.category.toLowerCase().includes('услуг');
                            const isGoods = item.category.toLowerCase().includes('товар');

                            return (
                              <React.Fragment key={`rev_group_${idx}`}>
                                <tr
                                  className="hover:bg-indigo-50/20 transition-colors h-12 cursor-pointer"
                                  onClick={() => setExpandedRevenueItems(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                                >
                                  <td className="p-3 text-center font-mono text-[11px] text-gray-400 border-r border-gray-50 pl-6">
                                    {idx + 1}
                                  </td>
                                  <td className="p-3 font-medium text-gray-850">
                                    <div className="flex items-center gap-2">
                                      <ChevronDown className={`w-3.5 h-3.5 text-indigo-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                      <span className="font-semibold text-gray-900">{item.name}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      isService 
                                        ? 'bg-blue-50 text-blue-700 border-blue-150'
                                        : isGoods
                                        ? 'bg-amber-50 text-amber-700 border-amber-150'
                                        : 'bg-purple-50 text-purple-700 border-purple-150'
                                    }`}>
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded text-[11px]">
                                      {item.count} {item.count === 1 ? 'операция' : item.count < 5 ? 'операции' : 'операций'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono text-gray-600 font-semibold text-[11px]">
                                    {share.toFixed(1)}%
                                  </td>
                                  <td className="p-3 text-right pr-6 font-mono font-bold text-[13px] text-gray-900">
                                    {item.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                  </td>
                                </tr>

                                {/* Expanded Drawer: All underlying transactions for this grouped service/product */}
                                {isExpanded && item.transactions && item.transactions.length > 0 && (
                                  <tr className="bg-indigo-50/15">
                                    <td colSpan={6} className="p-4 pl-12 bg-indigo-50/25 border-b border-gray-150">
                                      <div className="bg-white rounded-2xl border border-indigo-150 shadow-sm overflow-hidden">
                                        <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-950">
                                          <span>Все входящие операции по позиции «{item.name}» ({item.transactions.length} шт.):</span>
                                          <span className="font-mono text-indigo-700 font-bold">
                                            Сумма: {item.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                          </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-left text-[11px] divide-y divide-gray-150">
                                            <thead className="bg-gray-50/80 font-bold text-gray-600 uppercase text-[9px] select-none">
                                              <tr>
                                                <th className="p-2.5 pl-4 w-28">Дата</th>
                                                <th className="p-2.5 w-44">Контрагент / Клиент</th>
                                                <th className="p-2.5">Назначение платежа</th>
                                                <th className="p-2.5">Комментарий</th>
                                                <th className="p-2.5 text-right pr-4 w-36">Сумма операции</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-sans text-gray-700">
                                              {item.transactions.map((t, tIdx) => (
                                                <tr key={`tx_${idx}_${tIdx}`} className="hover:bg-gray-50/60 transition-colors">
                                                  <td className="p-2.5 pl-4 font-mono text-gray-500">
                                                    {t.date ? new Date(t.date).toLocaleDateString('ru-RU') : t.dateStr || '—'}
                                                  </td>
                                                  <td className="p-2.5 font-medium text-gray-850">
                                                    {t.counterparty || <span className="text-gray-400 italic">Не указан</span>}
                                                  </td>
                                                  <td className="p-2.5 text-gray-700">
                                                    {t.category || '—'}
                                                  </td>
                                                  <td className="p-2.5 text-gray-500 italic max-w-xs truncate" title={t.comment}>
                                                    {t.comment || '—'}
                                                  </td>
                                                  <td className="p-2.5 text-right pr-4 font-mono font-bold text-gray-900">
                                                    {t.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                        {/* Table Footer with totals */}
                        <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                          <tr className="h-11">
                            <td className="p-3 pl-6 text-center text-gray-400" colSpan={3}>
                              Итого по сгруппированным строкам
                            </td>
                            <td className="p-3 text-center font-mono text-indigo-700">
                              {filteredRevenueDetails.reduce((sum, d) => sum + d.count, 0)} оп.
                            </td>
                            <td className="p-3 text-center font-mono text-gray-600">
                              {totalRevenue > 0 
                                ? `${((filteredRevenueDetails.reduce((sum, d) => sum + d.sum, 0) / totalRevenue) * 100).toFixed(1)}%`
                                : '—'}
                            </td>
                            <td className="p-3 text-right pr-6 font-mono text-gray-900 text-[13px]">
                              {filteredRevenueDetails.reduce((sum, d) => sum + d.sum, 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Salary Payments tab content */}
            {activeTab === 'salary' && (
              <div className="space-y-6">
                
                {/* Visual Indicator rules callout */}
                <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
                  <h3 className="font-display font-semibold text-md text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                    Алгоритм проверки зарплатной ведомости
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-gray-600">
                    <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-150/20">
                      <strong className="text-amber-900 block mb-1">Выплачено за прошлый период:</strong>
                      Попадают записи, в назначении которых есть «Зарплата»/«Заработная», 
                      в комментарии содержится ключевое слово (<code className="font-mono bg-white px-1">зп</code>, <code className="font-mono bg-white px-1">з.п.</code>, <code className="font-mono bg-white px-1">з п</code>, <code className="font-mono bg-white px-1">зарплата</code>, <code className="font-mono bg-white px-1">заработная</code>) 
                      и дата операции меньше заданной даты отсечения (<strong className="font-mono text-indigo-900">{cutoffDateStr}</strong>).
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-150/20">
                      <strong className="text-emerald-900 block mb-1">Выплачено за отчетный период:</strong>
                      Остальные выплаты, включая: 
                      1) записи без ключевых слов в комментарии; 
                      2) записи с датой позже или равной дате отсечения.
                    </div>
                  </div>
                </div>

                {/* Salary report table */}
                <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gray-500">
                      Зарплатная таблица (Группировка по сотрудникам)
                    </h3>
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md font-medium border border-indigo-100/50">
                      Сотрудников: {salaryEmployees.length}
                    </span>
                  </div>

                  {salaryEmployees.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      Нет сотрудников, подходящих под критерии начислений зарплат (Проверьте, содержит ли "Назначение" слова "Зарплата" или "Заработная").
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 font-bold select-none h-11 border-b border-gray-100">
                            <th className="p-3.5 pl-6">ФИО (Контрагент)</th>
                            <th className="p-3.5 text-right">Выплачено за прошлый период</th>
                            <th className="p-3.5 text-right">Выплачено за отчётный период</th>
                            <th className="p-3.5 text-right pr-6">Итого выплат</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                          {salaryEmployees.map((emp, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors h-11">
                              <td className="p-3 pl-6 font-medium text-gray-800">
                                {emp.fio}
                              </td>
                              <td className="p-3 text-right font-mono font-semibold text-amber-700">
                                {emp.pastPeriodSum > 0 ? `${emp.pastPeriodSum.toLocaleString('ru-RU')} ₽` : '—'}
                              </td>
                              <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                                {emp.reportPeriodSum > 0 ? `${emp.reportPeriodSum.toLocaleString('ru-RU')} ₽` : '—'}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-gray-900 pr-6">
                                {emp.totalSum.toLocaleString('ru-RU')} ₽
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw records list tab */}
            {activeTab === 'raw' && (
              <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between select-none">
                  <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-gray-500">
                    Распознанные транзакции из файла
                  </h3>
                  <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-md font-medium">
                    Всего строк: {rawRecords.length}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 font-medium h-10 border-b border-gray-100 font-mono text-[10px]">
                        <th className="p-3 text-center pl-6 w-16">№</th>
                        <th className="p-3">Дата</th>
                        <th className="p-3">Назначение</th>
                        <th className="p-3">Контрагент</th>
                        <th className="p-3">Комментарий</th>
                        <th className="p-3 text-right pr-6">Сумма (Руб)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {rawRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/40 transition-colors text-gray-600">
                          <td className="p-3 text-center font-mono text-[11px] text-gray-400 border-r border-gray-50 pl-6">
                            {r.rawIndex}
                          </td>
                          <td className="p-3 font-mono text-gray-500">
                            {r.dateStr || '—'}
                          </td>
                          <td className="p-3 text-gray-800 font-medium">
                            {r.category}
                          </td>
                          <td className="p-3 text-gray-700">
                            {r.counterparty || '—'}
                          </td>
                          <td className="p-3 text-gray-500 italic max-w-xs truncate">
                            {r.comment || '—'}
                          </td>
                          <td className="p-3 text-right pr-6 font-mono font-medium text-gray-900">
                            {r.sum.toLocaleString('ru-RU')} ₽
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Embed test verification sandbox always at the of loaded state as well to let them easily test and verify */}
            <div className="pt-6 border-t border-gray-100">
              <TestPlayground />
            </div>

          </div>
        )}
      </div>
    )}

    {/* ========================================================================= */}
    {/* TAB 2: ОТЧЕТ ПО УСЛУГАМ С РАСПРЕДЕЛЕНИЕМ ЗАТРАТ                          */}
    {/* ========================================================================= */}
    {primaryTab === 'services' && (
      <div className="space-y-6">
        
        {/* Header Information Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-indigo-800 rounded-3xl p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-white/10 rounded-xl">
                  <Scissors className="w-5 h-5 text-indigo-200" />
                </span>
                <h2 className="font-display font-extrabold text-xl text-white">
                  Отчет по услугам и распределению затрат (Вкладка 2)
                </h2>
              </div>
              <p className="text-xs text-indigo-200 max-w-3xl leading-relaxed">
                Отчет формируется на основе загружаемого файла по услугам и финансового отчета из 1-й вкладки:
                графа <strong>«Услуга»</strong> группирует одинаковые записи, графа <strong>«Скидка»</strong> суммирует скидки, 
                графа <strong>«Сумма выручки»</strong> складывает «Баллы» + «Абонементы» + «Сертификаты» + «Оплачено со счетов клиентов» + «Оплачено деньгами». 
                Графы <strong>«Переменные затраты»</strong> и <strong>«Постоянные затраты»</strong> заполняются путем распределения затрат из финансового отчета пропорционально выручке.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap self-stretch md:self-auto justify-end">
              {servicesRecords.length === 0 && (
                <button
                  onClick={loadDemoServicesData}
                  className="px-4 py-2.5 bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-500/50 transition-all cursor-pointer"
                  title="Загрузить тестовые услуги салона красоты"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Загрузить Демо Услуг</span>
                </button>
              )}
              {servicesRecords.length > 0 && (
                <button
                  onClick={() => downloadServicesSpreadsheet(servicesReport.items, servicesReport.summary, servicesFileName ? `Отчет_${servicesFileName}` : 'Отчет_по_услугам.xlsx')}
                  className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  title="Скачать сформированный отчет по услугам в Excel"
                >
                  <Download className="w-4 h-4 text-indigo-700" />
                  <span>Экспорт в Excel (XLSX)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload Box or Active File Summary */}
        {servicesRecords.length === 0 ? (
          <div 
            onDragEnter={(e) => { e.preventDefault(); setServicesDragActive(true); }}
            onDragOver={(e) => { e.preventDefault(); setServicesDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setServicesDragActive(false); }}
            onDrop={handleServicesDrop}
            className={`bg-white rounded-3xl border-2 border-dashed p-8 text-center transition-all shadow-sm ${
              servicesDragActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-gray-200 hover:border-indigo-300'
            }`}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">
                  Загрузите файл с данными по услугам
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Перетащите файл сюда или нажмите кнопку ниже. Поддерживаются форматы Excel <strong>.xlsx, .xls</strong> и <strong>.csv</strong>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <button
                  onClick={() => servicesFileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-150 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Выбрать файл по услугам</span>
                </button>
                <button
                  onClick={loadDemoServicesData}
                  className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Загрузить Демо-данные услуг</span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
                <div>Ожидаемые колонки: <span className="font-mono text-gray-600">«Услуга», «Скидка», «Баллы», «Абонементы», «Сертификаты», «Оплачено со счетов клиентов, ₽», «Оплачено деньгами, ₽»</span></div>
                <div className="text-indigo-600 font-medium flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Включена автоматическая предобработка числовых показателей (удаление пробелов, валют ₽/$, бухгалтерских скобок)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900">{servicesFileName || 'Файл_по_услугам.xlsx'}</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-150">
                    Загружен
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                    <span>Числовая предобработка активна</span>
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>Исходных строк: <strong className="text-gray-700">{servicesRecords.length}</strong></span>
                  <span>•</span>
                  <span>Сгруппировано услуг: <strong className="text-indigo-700">{servicesReport.items.length}</strong></span>
                  <span>•</span>
                  <span>Очищено числовых ячеек: <strong className="text-emerald-700">{servicesStats?.cleanedFieldsCount || (servicesRecords.length * 6)}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => servicesFileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                title="Загрузить другой файл по услугам"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Сменить файл</span>
              </button>
              <button
                onClick={() => {
                  setServicesRecords([]);
                  setServicesFileName(null);
                  setNotification({
                    status: 'success',
                    message: 'Данные по услугам сброшены. Вы можете загрузить новый файл.'
                  });
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                title="Очистить загруженные услуги"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить</span>
              </button>
            </div>
          </div>
        )}

        {/* Financial Report Costs Allocation Linkage Panel */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="font-display font-bold text-sm text-gray-900">
                Распределение затрат из финансового отчета (1-я вкладка)
              </h3>
            </div>
            
            {/* Status indicator badge */}
            <div className="flex items-center gap-2">
              {(variableExpensesFromReport > 0 || fixedExpensesFromReport > 0) ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Затраты подгружены из финансового отчета</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-150 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>В 1-й вкладке финотчет еще не рассчитан (можно ввести вручную)</span>
                </span>
              )}

              <button
                onClick={() => {
                  if (!isServicesCustomExpensesActive) {
                    setCustomVariableExpenses(String(activeVariableExpenses));
                    setCustomFixedExpenses(String(activeFixedExpenses));
                  }
                  setIsServicesCustomExpensesActive(!isServicesCustomExpensesActive);
                }}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-xl cursor-pointer transition-all"
              >
                {isServicesCustomExpensesActive ? 'Вернуть авто-связку' : 'Ручная корректировка'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Variable Costs Card */}
            <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-150/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Переменные затраты</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.2 rounded font-bold">Статья 9</span>
              </div>

              {isServicesCustomExpensesActive ? (
                <div className="mt-2">
                  <input
                    type="number"
                    value={customVariableExpenses}
                    onChange={(e) => setCustomVariableExpenses(e.target.value)}
                    placeholder="Сумма в рублях"
                    className="w-full text-lg font-mono font-bold bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">Ручной ввод переменных затрат</span>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="font-display font-extrabold text-2xl text-amber-900">
                    {activeVariableExpenses.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-[11px] text-amber-700/90 mt-1 leading-relaxed">
                    Сумма строки «Расходы переменные» из финансового отчета. Распределяется пропорционально выручке.
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Costs Card */}
            <div className="bg-purple-50/40 rounded-2xl p-4 border border-purple-150/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">Постоянные затраты</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-mono px-1.5 py-0.2 rounded font-bold">Статья 36</span>
              </div>

              {isServicesCustomExpensesActive ? (
                <div className="mt-2">
                  <input
                    type="number"
                    value={customFixedExpenses}
                    onChange={(e) => setCustomFixedExpenses(e.target.value)}
                    placeholder="Сумма в рублях"
                    className="w-full text-lg font-mono font-bold bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <span className="text-[10px] text-purple-700 mt-1 block">Ручной ввод постоянных затрат</span>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="font-display font-extrabold text-2xl text-purple-900">
                    {activeFixedExpenses.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-[11px] text-purple-700/90 mt-1 leading-relaxed">
                    Сумма строки «Расходы постоянные» из финансового отчета. Распределяется пропорционально выручке.
                  </div>
                </div>
              )}
            </div>

            {/* Total Cost to Allocate Card */}
            <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-150/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Всего затрат к распределению</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-1.5 py-0.2 rounded font-bold">100% базы</span>
                </div>
                <div className="font-display font-extrabold text-2xl text-indigo-950 mt-2">
                  {(activeVariableExpenses + activeFixedExpenses).toLocaleString('ru-RU')} ₽
                </div>
                <div className="text-[11px] text-indigo-700/90 mt-1 leading-relaxed">
                  Полная сумма затрат, распределяемая по всем услугам согласно их доле в выручке.
                </div>
              </div>

              {rawRecords.length === 0 && (
                <button
                  onClick={loadDemoData}
                  className="mt-3 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Загрузить Демо-финансовый отчет для связки →</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Bento Grid for Services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Сумма выручки по услугам</div>
            <div className="font-display font-extrabold text-2xl text-emerald-600 mt-2">
              {servicesReport.summary.totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Баллы + Абонементы + Сертификаты + Счета + Деньги
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Предоставлено скидок</div>
            <div className="font-display font-extrabold text-2xl text-amber-600 mt-2">
              {servicesReport.summary.totalDiscount.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Суммарно из графы «Скидка»
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Всего затрат по услугам</div>
            <div className="font-display font-extrabold text-2xl text-rose-500 mt-2">
              {servicesReport.summary.totalCost.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
              <span>Пер: {servicesReport.summary.totalVariableCost.toLocaleString('ru-RU')} ₽</span>
              <span>Пост: {servicesReport.summary.totalFixedCost.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Прибыль / Рентабельность</div>
            <div className="font-display font-extrabold text-2xl text-indigo-700 mt-2">
              {servicesReport.summary.totalProfit.toLocaleString('ru-RU')} ₽
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <span className="font-mono bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                {servicesReport.summary.totalProfitability.toFixed(1)}% рентабельность
              </span>
              <span>по всем услугам</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters and Download */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-150 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={servicesSearchQuery}
              onChange={(e) => setServicesSearchQuery(e.target.value)}
              placeholder="Поиск по наименованию услуги..."
              className="bg-transparent text-xs w-full outline-none text-gray-700 border-none inline-block focus:ring-0"
            />
            {servicesSearchQuery && (
              <button 
                onClick={() => setServicesSearchQuery('')} 
                className="text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                Очистить
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-gray-500">
              Показано позиций: <strong className="text-gray-900">{filteredServiceItems.length}</strong> из {servicesReport.items.length}
            </span>

            {servicesReport.items.length > 0 && (
              <button
                onClick={() => downloadServicesSpreadsheet(servicesReport.items, servicesReport.summary, servicesFileName ? `Отчет_${servicesFileName}` : 'Отчет_по_услугам.xlsx')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                title="Скачать Excel-таблицу отчета по услугам со всеми столбцами и общим итогом"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать XLSX</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Services Report Table */}
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-150 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-600" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-700">
                Отчет по услугам (Группировка и пропорциональное распределение затрат)
              </h3>
            </div>
            <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-md font-semibold">
              Уникальных услуг: {servicesReport.items.length}
            </span>
          </div>

          {filteredServiceItems.length === 0 ? (
            <div className="p-16 text-center text-gray-400 text-xs">
              {servicesSearchQuery 
                ? `По запросу «${servicesSearchQuery}» ничего не найдено.` 
                : 'Нет данных для отображения. Загрузите файл с данными по услугам выше или нажмите «Загрузить Демо Услуг».'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold select-none h-11 border-b border-gray-150 text-[10.5px]">
                    <th className="p-3 text-center w-12 font-mono text-[10px] text-gray-400">№</th>
                    <th className="p-3 min-w-[220px]">Услуга</th>
                    <th className="p-3 text-center w-16">Кол-во</th>
                    <th className="p-3 text-right w-24">Скидка</th>
                    <th className="p-3 text-right w-20">Баллы</th>
                    <th className="p-3 text-right w-24">Абонементы</th>
                    <th className="p-3 text-right w-24">Сертификаты</th>
                    <th className="p-3 text-right w-28">Со счетов, ₽</th>
                    <th className="p-3 text-right w-28">Деньгами, ₽</th>
                    <th className="p-3 text-right w-32 font-bold text-indigo-950 bg-indigo-50/30">Сумма выручки</th>
                    <th className="p-3 text-center w-20 bg-indigo-50/20">Доля</th>
                    <th className="p-3 text-right w-32 text-amber-800 bg-amber-50/20">Переменные затраты</th>
                    <th className="p-3 text-right w-32 text-purple-800 bg-purple-50/20">Постоянные затраты</th>
                    <th className="p-3 text-right w-32 text-rose-800 bg-rose-50/20">Всего затрат</th>
                    <th className="p-3 text-right w-32 text-emerald-800 bg-emerald-50/20 font-bold">Прибыль</th>
                    <th className="p-3 text-center w-24 pr-4">Рентабельность</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-gray-800">
                  {filteredServiceItems.map((item, idx) => {
                    const isExpanded = !!expandedServiceItems[item.service];

                    return (
                      <React.Fragment key={`svc_row_${idx}`}>
                        <tr 
                          className="hover:bg-indigo-50/25 transition-colors h-11 cursor-pointer select-none"
                          onClick={() => setExpandedServiceItems(prev => ({ ...prev, [item.service]: !prev[item.service] }))}
                        >
                          <td className="p-3 text-center font-mono text-[11px] text-gray-400 border-r border-gray-50">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-medium text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <ChevronDown className={`w-3.5 h-3.5 text-indigo-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                              <span className="font-semibold text-gray-900">{item.service}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-indigo-700">
                            {item.count}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-600">
                            {item.discount > 0 ? `${item.discount.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-600">
                            {item.points > 0 ? `${item.points.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-600">
                            {item.subscriptions > 0 ? `${item.subscriptions.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-600">
                            {item.certificates > 0 ? `${item.certificates.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-600">
                            {item.clientAccounts > 0 ? `${item.clientAccounts.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-600">
                            {item.money > 0 ? `${item.money.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-950 bg-indigo-50/30">
                            {item.revenue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                          </td>
                          <td className="p-3 text-center font-mono text-gray-600 bg-indigo-50/20 text-[11px]">
                            {item.revenueShare.toFixed(1)}%
                          </td>
                          <td className="p-3 text-right font-mono text-amber-900 bg-amber-50/20 font-medium">
                            {item.variableCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                          </td>
                          <td className="p-3 text-right font-mono text-purple-900 bg-purple-50/20 font-medium">
                            {item.fixedCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                          </td>
                          <td className="p-3 text-right font-mono text-rose-700 bg-rose-50/20 font-semibold">
                            {item.totalCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                          </td>
                          <td className={`p-3 text-right font-mono font-bold bg-emerald-50/20 ${item.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {item.profit.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                          </td>
                          <td className="p-3 text-center pr-4 font-mono text-[11px] font-semibold">
                            <span className={`px-1.5 py-0.5 rounded ${item.profitability >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                              {item.profitability.toFixed(1)}%
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Drawer: All raw records for this grouped service */}
                        {isExpanded && item.rawRows && (
                          <tr className="bg-indigo-50/15">
                            <td colSpan={16} className="p-4 pl-12 bg-indigo-50/25 border-b border-gray-150">
                              <div className="bg-white rounded-2xl border border-indigo-150 shadow-sm overflow-hidden">
                                <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-950">
                                  <span>Все сгруппированные строки по услуге «{item.service}» ({item.rawRows.length} оп.):</span>
                                  <span className="font-mono text-indigo-700 font-bold">
                                    Итого выручка: {item.revenue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[11px] divide-y divide-gray-150">
                                    <thead className="bg-gray-50/80 font-bold text-gray-600 uppercase text-[9px] select-none">
                                      <tr>
                                        <th className="p-2.5 pl-4 w-16">Строка</th>
                                        <th className="p-2.5 text-right w-24">Скидка</th>
                                        <th className="p-2.5 text-right w-20">Баллы</th>
                                        <th className="p-2.5 text-right w-24">Абонементы</th>
                                        <th className="p-2.5 text-right w-24">Сертификаты</th>
                                        <th className="p-2.5 text-right w-28">Со счетов, ₽</th>
                                        <th className="p-2.5 text-right w-28">Деньгами, ₽</th>
                                        <th className="p-2.5 text-right pr-4 w-32 font-bold text-indigo-950">Сумма выручки</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-sans text-gray-700 font-mono">
                                      {item.rawRows.map((r, rIdx) => (
                                        <tr key={`raw_svc_${idx}_${rIdx}`} className="hover:bg-gray-50/60 transition-colors">
                                          <td className="p-2.5 pl-4 text-gray-400">
                                            #{r.rawIndex}
                                          </td>
                                          <td className="p-2.5 text-right text-gray-600">
                                            {r.discount > 0 ? `${r.discount.toLocaleString('ru-RU')} ₽` : '—'}
                                          </td>
                                          <td className="p-2.5 text-right text-gray-600">
                                            {r.points > 0 ? `${r.points.toLocaleString('ru-RU')} ₽` : '—'}
                                          </td>
                                          <td className="p-2.5 text-right text-gray-600">
                                            {r.subscriptions > 0 ? `${r.subscriptions.toLocaleString('ru-RU')} ₽` : '—'}
                                          </td>
                                          <td className="p-2.5 text-right text-gray-600">
                                            {r.certificates > 0 ? `${r.certificates.toLocaleString('ru-RU')} ₽` : '—'}
                                          </td>
                                          <td className="p-2.5 text-right text-gray-600">
                                            {r.clientAccounts > 0 ? `${r.clientAccounts.toLocaleString('ru-RU')} ₽` : '—'}
                                          </td>
                                          <td className="p-2.5 text-right text-gray-600">
                                            {r.money > 0 ? `${r.money.toLocaleString('ru-RU')} ₽` : '—'}
                                          </td>
                                          <td className="p-2.5 text-right pr-4 font-bold text-indigo-950">
                                            {r.revenue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {/* Grand Total Row (Общий итог по всем услугам) */}
                <tfoot className="bg-gray-100 font-bold border-t-2 border-indigo-400 text-[11px] text-gray-900 select-none">
                  <tr className="h-12">
                    <td className="p-3 text-center font-mono text-gray-500">∑</td>
                    <td className="p-3 font-extrabold uppercase text-indigo-950">
                      ИТОГО ПО ВСЕМ УСЛУГАМ
                    </td>
                    <td className="p-3 text-center font-mono font-extrabold text-indigo-700">
                      {servicesReport.summary.totalCount}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {servicesReport.summary.totalDiscount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono">
                      {servicesReport.summary.totalPoints.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono">
                      {servicesReport.summary.totalSubscriptions.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono">
                      {servicesReport.summary.totalCertificates.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono">
                      {servicesReport.summary.totalClientAccounts.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono">
                      {servicesReport.summary.totalMoney.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-indigo-950 bg-indigo-150/40 text-xs">
                      {servicesReport.summary.totalRevenue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-center font-mono font-bold bg-indigo-150/30">
                      100.0%
                    </td>
                    <td className="p-3 text-right font-mono text-amber-900 bg-amber-100/40 font-bold">
                      {servicesReport.summary.totalVariableCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono text-purple-900 bg-purple-100/40 font-bold">
                      {servicesReport.summary.totalFixedCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-right font-mono text-rose-800 bg-rose-100/40 font-bold">
                      {servicesReport.summary.totalCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className={`p-3 text-right font-mono font-extrabold bg-emerald-100/40 text-xs ${servicesReport.summary.totalProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {servicesReport.summary.totalProfit.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </td>
                    <td className="p-3 text-center pr-4 font-mono font-extrabold">
                      <span className={`px-2 py-0.5 rounded ${servicesReport.summary.totalProfitability >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                        {servicesReport.summary.totalProfitability.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    )}
      </main>
    </div>
  );
}
