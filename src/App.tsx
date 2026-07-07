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
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { RawRecord, MetricRow, SalaryEmployee, SalaryProcessingMetrics } from './types';
import { 
  parseUploadedSpreadsheet, 
  generateFinancialReport, 
  processSalaryPayments,
  calculateReportFormulas,
  downloadFinancialSpreadsheet,
  downloadSalarySpreadsheet,
  parseDate
} from './processingEngine';
import { FINANCIAL_TEMPLATE } from './financialTemplate';
import TestPlayground from './components/TestPlayground';
import { downloadDocxReport } from './docxGenerator';

// Realistic mock data so users can test the dashboard instantly without preparing files.
const DEMO_RECORDS: Omit<RawRecord, 'id' | 'date'>[] = [
  // Revenue
  { sum: 250000, category: 'Выручка с услуг', counterparty: 'Клиенты салона', comment: 'Выручка услуги за май', dateStr: '15.05.2026', rawIndex: 2 },
  { sum: 120000, category: 'Выручка с товаров', counterparty: 'Розничные покупатели', comment: 'Продажа косметики витрина', dateStr: '18.05.2026', rawIndex: 3 },
  { sum: 30000, category: 'Пополнение счёта', counterparty: 'Абоненты', comment: 'Депозиты на баланс', dateStr: '20.05.2026', rawIndex: 4 },
  { sum: 45000, category: 'Выручка с сертификатов', counterparty: 'Подарочные продажи', comment: 'Сертификаты подарочные', dateStr: '22.05.2026', rawIndex: 5 },
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

export default function App() {
  // Application State
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
  const [activeTab, setActiveTab] = useState<'financial' | 'salary' | 'raw' | 'faq'>('financial');
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editingRowValue, setEditingRowValue] = useState<string>('');
  const [expandedExtraRows, setExpandedExtraRows] = useState<Record<number, boolean>>({});
  const [expandedReportRows, setExpandedReportRows] = useState<Record<number, boolean>>({});
  const [notification, setNotification] = useState<{ status: 'success' | 'error', message: string } | null>(null);

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
      const { report: financialReport, extraRows } = financialResults;
      const salaryResults = processSalaryPayments(finalRecords, parsedCutoffDate);
      const { employees: salaryEmployees } = salaryResults;

      // 1. Download Financial Spreadsheet
      downloadFinancialSpreadsheet(financialReport, extraRows);
      
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
    handleDataParsed(structured, 'Реалистичный_Демо_Отчет_Студии_Красоты.xlsx');
  };

  // Processing results: Financial Report
  const financialResults = useMemo(() => {
    return generateFinancialReport(rawRecords, userOverrides, categoryMappings, transactionMappings, fileName);
  }, [rawRecords, userOverrides, categoryMappings, transactionMappings, fileName]);

  const { report: financialReport, extraRows } = financialResults;

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

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
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
              <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full md:w-auto">
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
                  onClick={() => downloadFinancialSpreadsheet(financialReport, extraRows)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Скачать полный финансовый отчет"
                >
                  <Download className="w-3.5 h-3.5" />
                  Метрики (XLSX)
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
                  onClick={() => downloadDocxReport(financialReport, rawRecords, categoryMappings)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  title="Скачать финансовый отчет в формате .docx"
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

                  {/* Dropdown filters */}
                  <div className="flex group items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-150 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Показывать:</span>
                    <select
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value as any)}
                      className="bg-transparent border-none text-xs text-gray-700 outline-none pr-6 focus:ring-0 font-medium cursor-pointer"
                    >
                      <option value="all">Все 139 строк</option>
                      <option value="data">Только вводимые статьи</option>
                      <option value="formulas">Только формулы</option>
                      <option value="nonzero">Только ненулевые</option>
                    </select>
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
                                  if (isDataRow) {
                                    setExpandedReportRows(prev => ({ ...prev, [row.index]: !prev[row.index] }));
                                  }
                                }}
                              >
                                <td className="p-3 text-center font-mono text-[11px] text-gray-400 border-r border-gray-50">
                                  {row.index + 1}
                                </td>
                                <td className="p-3 pl-4 font-sans font-medium text-gray-800">
                                  <div className="flex items-center gap-2">
                                    {isDataRow && (
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
                              {isExpanded && isDataRow && (
                                <tr className="bg-indigo-50-[0.02]">
                                  <td colSpan={4} className="p-4 pl-12 bg-indigo-50/20 border-b border-gray-100">
                                    {hasTransactions ? (
                                      <div className="overflow-x-auto rounded-xl border border-gray-200/60 shadow-sm bg-white">
                                        <table className="min-w-full divide-y divide-gray-150 text-left text-[11px]">
                                          <thead className="bg-indigo-50/50 font-semibold text-indigo-950 uppercase tracking-wider text-[9px] select-none">
                                            <tr>
                                              <th className="p-2.5 pl-4 w-28">Дата</th>
                                              <th className="p-2.5 w-48">Контрагент</th>
                                              <th className="p-2.5 font-bold text-indigo-950">Назначение</th>
                                              <th className="p-2.5">Комментарий</th>
                                              <th className="p-2.5 text-right pr-4 w-36">Сумма</th>
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
                                                 <td className="p-2.5 text-gray-700 max-w-[240px] truncate" title={t.category}>
                                                   {t.category || <span className="text-gray-300">—</span>}
                                                 </td>
                                                 <td className="p-2.5 text-gray-500 max-w-[240px] truncate" title={t.comment}>
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
      </main>
    </div>
  );
}
