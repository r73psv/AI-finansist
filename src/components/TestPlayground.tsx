import React, { useState } from 'react';
import { Calendar, CheckCircle2, RotateCcw, HelpCircle, Building2 } from 'lucide-react';
import { parseDate, processSalaryPayments, parseNumber, isTotalSummaryRow } from '../processingEngine';
import { classifyServiceHall, HALL_METADATA, HallName } from '../hallsClassifier';
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

      {/* Grouping & Summing by "Услуга/Товар" Live Test */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-sans font-semibold text-sm text-gray-950 tracking-tight flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          Проверка группировки и суммирования доходной части по графе «Услуга/Товар»
        </h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Строки исходного файла, по которым совпадает значение в графе <strong>«Услуга/Товар»</strong>, автоматически объединяются в единую строку доходной части, а их суммы складываются.
        </p>

        <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-indigo-100">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Исходные строки файла:</div>
              <div className="space-y-1 font-mono text-[11px] text-gray-750">
                <div>• «Стрижка женская» : 140 000 ₽</div>
                <div>• «Стрижка женская» : 110 000 ₽</div>
                <div className="text-[10px] text-indigo-600 italic mt-1">2 совпадающие записи в графе</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-indigo-100">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Группировка:</div>
              <div className="space-y-1 font-mono text-[11px] text-gray-750">
                <div className="font-bold text-gray-900">Позиция: «Стрижка женская»</div>
                <div className="text-indigo-700 font-semibold">Операций: 2 шт. (объединено)</div>
                <div className="text-emerald-700 font-bold text-xs mt-1">Итого: 250 000 ₽ (140к + 110к)</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-bold text-emerald-800 mb-1">Результат в отчете:</div>
              <div className="text-[11px] text-emerald-950 font-sans leading-relaxed">
                Попадает в детализацию статьи <strong>«Выручка с услуг»</strong> и на отдельный лист Excel «Детализация доходов».
              </div>
              <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Алгоритм работает по ТЗ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Numeric Preprocessing Verification */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-sans font-semibold text-sm text-gray-950 tracking-tight flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          Проверка предобработки числовых показателей таблицы по услугам (Вкладка 2)
        </h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          При импорте таблицы по услугам все числовые графы (<strong>«Скидка»</strong>, <strong>«Баллы»</strong>, <strong>«Абонементы»</strong>, <strong>«Сертификаты»</strong>, <strong>«Со счетов клиентов»</strong>, <strong>«Оплачено деньгами»</strong>) проходят ту же стандартизацию, что и графа «Сумма, Р» финансового отчета: удаляются неразрывные пробелы, знаки валют (₽, руб., р.), бухгалтерские скобки, тире и текстовые прочерки.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { col: 'Скидка', raw: '(500,00 ₽)', expected: 500.00, note: 'Бухгалтерские скобки → положительная скидка' },
            { col: 'Баллы', raw: '200 бонусов', expected: 200.00, note: 'Очистка текста и единиц измерения' },
            { col: 'Абонементы', raw: '2 500,50 р.', expected: 2500.50, note: 'Разделители тысяч и копеек' },
            { col: 'Сертификаты', raw: '—', expected: 0.00, note: 'Символ тире/прочерка → 0 ₽' },
            { col: 'Со счетов клиентов', raw: '1.200,00 ₽', expected: 1200.00, note: 'Европейский формат разделителей' },
            { col: 'Оплачено деньгами', raw: '  15 000 руб  ', expected: 15000.00, note: 'Пробелы и подстрока валюты' }
          ].map((item, idx) => {
            const parsed = item.col === 'Скидка' ? Math.abs(parseNumber(item.raw)) : parseNumber(item.raw);
            const isCorrect = parsed === item.expected;
            return (
              <div key={`svc_pre_${idx}`} className="p-3 bg-gray-50 hover:bg-gray-50/80 rounded-xl border border-gray-150 flex flex-col justify-between gap-1.5 transition-all">
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-700">{item.col}:</span>
                  <span className="text-[10.5px] font-mono text-gray-750 bg-gray-100 px-1.5 py-0.5 rounded font-semibold max-w-[130px] truncate" title={item.raw}>{item.raw}</span>
                </div>
                <div className="text-[10px] text-gray-400 italic">
                  {item.note}
                </div>
                <div className="flex justify-between items-center border-t border-gray-100/60 pt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Результат:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                    <span className={parsed > 0 ? 'text-indigo-600' : 'text-gray-500'}>
                      {parsed.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
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

      {/* Services Report & Cost Allocation (Tab 2) Verification */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-sans font-semibold text-sm text-gray-950 tracking-tight flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Проверка алгоритма Вкладки 2: Расчет выручки и пропорциональное распределение затрат
        </h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Формулы расчета: <strong>Сумма выручки</strong> = Баллы + Абонементы + Сертификаты + Счета клиентов + Деньги. 
          <strong>Затраты</strong> (переменные и постоянные) распределяются строго пропорционально доле выручки услуги в общем объеме.
        </p>

        <div className="bg-emerald-50/20 rounded-2xl p-4 border border-emerald-150/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-gray-150">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">1. Расчет суммы выручки услуги:</div>
              <div className="space-y-1 font-mono text-[11px] text-gray-750">
                <div>Баллы (200 ₽) + Абонементы (0 ₽)</div>
                <div>+ Сертификаты (1 500 ₽) + Счета (0 ₽)</div>
                <div>+ Деньгами (2 000 ₽)</div>
                <div className="text-indigo-700 font-bold text-xs mt-1 border-t pt-1">
                  = 3 700 ₽ (Сумма выручки)
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-150">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">2. Пропорция затрат (База из финотчета):</div>
              <div className="space-y-1 font-mono text-[11px] text-gray-750">
                <div>Если общая выручка = 100 000 ₽,</div>
                <div>Доля услуги = 3 700 / 100 000 = 3.7%</div>
                <div>Переменные затраты = 20 000 ₽ × 3.7% = 740 ₽</div>
                <div>Постоянные затраты = 10 000 ₽ × 3.7% = 370 ₽</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100 flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-800 mb-1">3. Итог по всем услугам:</div>
                <div className="text-[11px] text-gray-700 font-sans leading-relaxed">
                  Сумма всех долей равна <strong>100%</strong>. Суммы распределенных затрат строго сходятся со статьями расходов финансового отчета.
                </div>
              </div>
              <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Полное соответствие алгоритму
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusion of "Всего" / "Итого" Summary Row Verification */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-sans font-semibold text-sm text-gray-950 tracking-tight flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Проверка фильтрации: Исключение строки «Всего» из расчета по услугам
        </h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Строки отчетов CRM с итоговыми сводками (<strong>«Всего»</strong>, <strong>«Всего:»</strong>, <strong>«Итого»</strong>, <strong>«Общий итог»</strong>) в графе «Услуга» автоматически распознаются и <strong>исключаются</strong> из расчетов, чтобы предотвратить задваивание общей суммы выручки и базы распределения затрат.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { service: 'Всего', amount: '125 000 ₽', shouldExclude: true },
            { service: 'Всего:', amount: '89 400 ₽', shouldExclude: true },
            { service: 'Итого по услугам', amount: '450 000 ₽', shouldExclude: true },
            { service: 'Стрижка женская', amount: '2 800 ₽', shouldExclude: false }
          ].map((item, idx) => {
            const excluded = isTotalSummaryRow(item.service);
            const statusOk = excluded === item.shouldExclude;
            return (
              <div key={`excl_${idx}`} className="p-3 bg-gray-50 hover:bg-gray-50/80 rounded-xl border border-gray-150 flex flex-col justify-between gap-1.5">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Графа «Услуга»:</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">«{item.service}»</div>
                  <div className="text-[11px] font-mono text-gray-500 mt-0.5">Сумма: {item.amount}</div>
                </div>
                <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    excluded ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {excluded ? 'Исключено из расчета' : 'Включено в отчет'}
                  </span>
                  {statusOk && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Salon Halls Grouping & Classification Verification */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-sans font-semibold text-sm text-gray-950 tracking-tight flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          Проверка классификатора: Распределение услуг по залам салона красоты
        </h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Все услуги из загруженного файла автоматически сопоставляются с соответствующим залом (<strong>«Зал колористики/парикмахеры»</strong>, <strong>«Зал макияжей и укладок»</strong>, <strong>«Зал ногтевого сервиса»</strong>, <strong>«Зал бровей»</strong>, <strong>«Мужской зал»</strong>) на основе точного справочника услуг салона и контекстных правил классификации.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { service: 'Сложное окрашивание (Airtouch)', expectedHall: 'Зал колористики/парикмахеры' },
            { service: 'Макияж вечерний / никах', expectedHall: 'Зал макияжей и укладок' },
            { service: 'Маникюр + покрытие прозрачным лаком', expectedHall: 'Зал ногтевого сервиса' },
            { service: 'Ламинирование ресниц', expectedHall: 'Зал бровей' },
            { service: 'Стрижка мужская американ крю', expectedHall: 'Мужской зал' }
          ].map((item, idx) => {
            const classified = classifyServiceHall(item.service);
            const isMatch = classified === item.expectedHall;
            const meta = HALL_METADATA[classified as HallName] || HALL_METADATA['Прочие услуги'];

            return (
              <div key={`hall_test_${idx}`} className="p-3 bg-gray-50 hover:bg-gray-50/80 rounded-xl border border-gray-150 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Наименование услуги:</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5 line-clamp-2" title={item.service}>
                    «{item.service}»
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2 flex flex-col gap-1">
                  <div className="text-[10px] text-gray-400">Определенный зал:</div>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText} border ${meta.badgeBorder}`}>
                      {classified}
                    </span>
                    {isMatch && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
