import React, { useState } from 'react';
import { Calendar, CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react';
import { parseDate, processSalaryPayments, parseNumber } from '../processingEngine';
import { RawRecord } from '../types';

interface TestScenario {
  id: string;
  sum: number;
  category: string;
  comment: string;
  dateStr: string;
  expectedCol: string;
  reason: string;
}

export default function TestPlayground() {
  const [cutoffStr, setCutoffStr] = useState('20.01.2024');
  const [customScenarios, setCustomScenarios] = useState<TestScenario[]>([
    {
      id: 'sc_1',
      sum: 50000,
      category: 'Зарплата',
      comment: '«Зарплата за январь»',
      dateStr: '15.01.2024',
      expectedCol: 'Выплачено за прошлый период',
      reason: 'Ключевое слово в комментарии ("зарплата") + дата (15.01) < даты отсечения (20.01)'
    },
    {
      id: 'sc_2',
      sum: 30000,
      category: 'Зарплата',
      comment: '«Аванс»',
      dateStr: '20.01.2024',
      expectedCol: 'Выплачено за отчётный период',
      reason: 'Нет ключевого слова в комментарии ("Аванс") -> идет в отчетный независимо от даты'
    },
    {
      id: 'sc_3',
      sum: 40000,
      category: 'Заработная плата',
      comment: '«Зарплата за февраль»',
      dateStr: '10.02.2024',
      expectedCol: 'Выплачено за отчётный период',
      reason: 'Дата (10.02) >= даты отсечения (20.01)'
    },
    {
      id: 'sc_4',
      sum: 25000,
      category: 'Зарплата',
      comment: '«Бонус»',
      dateStr: '25.01.2024',
      expectedCol: 'Выплачено за отчётный период',
      reason: 'Нет ключевого слова в комментарии ("Бонус") -> идет в отчетный'
    },
    {
      id: 'sc_5',
      sum: 35000,
      category: 'Оплата труда', // Note: Category doesn't contain "Зарплата"
      comment: '«Зарплата за декабрь»',
      dateStr: '10.12.2023',
      expectedCol: 'Выплачено за прошлый период',
      reason: 'Ключевое слово в комментарии ("Зарплата") + дата (10.12) < даты отсечения (20.01)'
    }
  ]);

  const parsedCutoff = parseDate(cutoffStr);

  const testResults = customScenarios.map((sc) => {
    // Pack into a RawRecord structure
    const fauxRecord: RawRecord = {
      id: sc.id,
      sum: sc.sum,
      category: sc.category,
      counterparty: 'Иван Иванов',
      comment: sc.comment,
      date: parseDate(sc.dateStr),
      dateStr: sc.dateStr,
      rawIndex: 1
    };

    // Run processing
    const { employees } = processSalaryPayments([fauxRecord], parsedCutoff);
    const emp = employees[0];

    const actualCol = emp 
      ? (emp.pastPeriodSum > 0 ? 'Выплачено за прошлый период' : 'Выплачено за отчётный период')
      : 'Не подходит под условия';

    const passed = actualCol === sc.expectedCol;

    return {
      ...sc,
      actualCol,
      passed,
      emp
    };
  });

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 p-6 shadow-sm overflow-hidden transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-5">
        <div>
          <h3 className="font-sans font-semibold text-lg text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Лаборатория Тестирования Логики Разделения
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Интерактивная визуализация правил распределения и зарплатных сценариев из ТЗ.
          </p>
        </div>
        
        {/* Cutoff controller */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Тестовое Отсечение:</span>
          <input
            type="text"
            value={cutoffStr}
            onChange={(e) => setCutoffStr(e.target.value)}
            className="w-24 text-xs font-mono font-medium text-gray-800 bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none text-center"
            placeholder="ДД.ММ.ГГГГ"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium select-none">
              <th className="p-3">Сумма</th>
              <th className="p-3">Назначение</th>
              <th className="p-3">Комментарий</th>
              <th className="p-3">Дата</th>
              <th className="p-3">Куда попадает (ТЗ)</th>
              <th className="p-3">Результат Системы</th>
              <th className="p-3">Статус Теста</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-sans">
            {testResults.map((tr) => (
              <tr 
                key={tr.id}
                className="hover:bg-gray-50/40 transition-colors"
                title={tr.reason}
              >
                <td className="p-3 font-mono font-semibold text-gray-800">
                  {tr.sum.toLocaleString('ru-RU')} ₽
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                    {tr.category}
                  </span>
                </td>
                <td className="p-3 text-gray-600 font-mono text-[11px] max-w-[150px] truncate">
                  {tr.comment}
                </td>
                <td className="p-3 text-gray-500 font-mono">
                  {tr.dateStr}
                </td>
                <td className="p-3 font-medium text-gray-500 text-[11px]">
                  {tr.expectedCol}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-md text-[11px] font-medium inline-block ${
                    tr.actualCol === 'Выплачено за прошлый период'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                  }`}>
                    {tr.actualCol}
                  </span>
                </td>
                <td className="p-3">
                  {tr.passed ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Успешно
                    </span>
                  ) : (
                    <span className="text-rose-500 font-semibold text-[11px]">Ошибка</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/30 flex gap-2.5 items-start">
        <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-gray-600 leading-relaxed text-[11px]">
          <span className="font-semibold text-indigo-900 block mb-0.5">Как работает алгоритм:</span>
          Записи анализируются сверху вниз. Сначала проверяется наличие ключевых слов в <strong>Комментарии</strong> 
          (<code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-700">зарплата</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-700">заработная</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-700">зп</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-700">з.п.</code> или <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-700">з п</code>).
          Если ключевые слова отсутствуют — сумма безоговорочно относится к <strong>«отчетному периоду»</strong>. Если ключевое слово обнаружено, 
          решение зависит от даты: выплаты до даты отсечения попадают в <strong>«прошлый период»</strong>, остальные — в <strong>«отчетный»</strong>.
        </div>
      </div>

      {/* Financial Pre-processing validation live preview list */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-sans font-semibold text-sm text-gray-950 tracking-tight flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Проверка предобработки «Сумма, Р» в финансовый вид
        </h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          В процессе импорта все строки финансовой графы <strong>«Сумма, Р»</strong> автоматически очищаются от лишних пробелов, знаков валют, а также корректно обрабатывают отрицательные значения (включая скобочную бухгалтерскую нотацию).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { raw: '1 250,50 р.', expected: 1250.50 },
            { raw: '(15 000,00 ₽)', expected: -15000.00 },
            { raw: '- 3.400,00 р.', expected: -3400.00 },
            { raw: '  1.050.000,55 руб  ', expected: 1050000.55 },
            { raw: '50 000', expected: 50000.00 },
            { raw: 'нет данных / empty', expected: 0.00 }
          ].map((item, idx) => {
            const parsed = parseNumber(item.raw);
            const isCorrect = parsed === item.expected;
            return (
              <div key={idx} className="p-3 bg-gray-50 hover:bg-gray-50/80 rounded-xl border border-gray-150 flex flex-col justify-between gap-1.5 transition-all">
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">В ячейке:</span>
                  <span className="text-[10.5px] font-mono text-gray-750 bg-gray-100 px-1.5 py-0.5 rounded font-semibold max-w-[150px] truncate" title={item.raw}>{item.raw}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100/60 pt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Распознано:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                    <span className={parsed < 0 ? 'text-amber-700' : parsed > 0 ? 'text-indigo-600' : 'text-gray-500'}>
                      {parsed.toLocaleString('ru-RU')} ₽
                    </span>
                    {isCorrect ? (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-1.5 py-0.5 rounded font-sans font-bold">OK</span>
                    ) : (
                      <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-100/50 px-1.5 py-0.5 rounded font-sans font-bold">Ошибка</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suffix Category Matching & Dynamic Contractors Preview */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-sans font-semibold text-sm text-gray-950 tracking-tight flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Проверка умного сопоставления категорий и динамических контрагентов
        </h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Проверка обратного сопоставления слов (с конца строки) и правила закупки сырья и материалов. Если контрагент отсутствует в базовом отчете, он будет добавлен автоматически в группу <strong>«Поставщики»</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <h5 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2.5">Пример сопоставления с конца (Суффиксное)</h5>
            <div className="space-y-2">
              {[
                { src: 'Оказание услуг', tgt: 'Выручка с услуг', matches: true },
                { src: '2026 Постоянные // Связь (интернет, моб.телефоны)', tgt: 'Связь (интернет, моб.телефон)', matches: true },
                { src: 'Закупка продуктов', tgt: 'Питание сотрудников', matches: false }
              ].map((test, index) => {
                const words = test.src.split(' ').slice(-2).join(' ');
                return (
                  <div key={index} className="flex flex-col gap-1 p-2.5 bg-white rounded-xl border border-gray-100/80">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-gray-500 font-medium font-mono">В исходном файле: "{test.src}"</span>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-gray-800 font-semibold font-mono">В отчете: "{test.tgt}"</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-800">Совпало (ОК)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between">
            <div>
              <h5 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2.5">Правило динамического добавления поставщиков</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Если импортирована операция с категорией <strong>«Закупка материалов»</strong> или <strong>«Закупка товаров»</strong> и контрагент отсутствует в стандартной таблице (строки 53–85):
              </p>
              <div className="mt-2.5 bg-white p-3 rounded-xl border border-gray-100/80 space-y-1.5 text-[11px] font-mono">
                <div className="text-gray-500">1. Транзакция: <span className="text-indigo-600 font-semibold">«Закупка материалов» на 150 000 ₽</span></div>
                <div className="text-gray-500">2. Контрагент: <span className="text-rose-600 font-semibold">«ООО Новые Системы» (Нет в шаблоне)</span></div>
                <div className="text-emerald-700 font-semibold">✓ Результат: Контрагент добавлен как Поставщик, сумма правильно посчитана в итогах.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
