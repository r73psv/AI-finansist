import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  FileSpreadsheet, 
  Calculator, 
  SlidersHorizontal, 
  Users, 
  Building2, 
  Package, 
  Download, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  Percent
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDemo?: () => void;
}

type GuideSectionId = 
  | 'quickstart'
  | 'input_files'
  | 'financial_report'
  | 'services_halls'
  | 'expense_allocation'
  | 'payroll_and_fot'
  | 'classifier_and_other'
  | 'suppliers'
  | 'exports'
  | 'faq';

interface GuideSection {
  id: GuideSectionId;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  content: React.ReactNode;
}

export default function UserGuideModal({ isOpen, onClose, onOpenDemo }: UserGuideModalProps) {
  const [activeSection, setActiveSection] = useState<GuideSectionId>('quickstart');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const sections: GuideSection[] = [
    {
      id: 'quickstart',
      title: '1. Быстрый старт и структура программы',
      shortTitle: 'Быстрый старт',
      icon: Sparkles,
      badge: 'Основы',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4.5 rounded-2xl border border-indigo-150">
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Добро пожаловать в AI‑Помощник Финансовых Отчетов салона красоты!
            </h4>
            <p className="text-gray-600 text-xs leading-relaxed">
              Система разработана для комплексной управленческой аналитики салона красоты. Она объединяет две важнейшие сферы учета:
              <strong>общую финансовую модель (ДДС / ОПУ)</strong> и <strong>юнит-экономику в разрезе залов и услуг</strong>.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-gray-900 mb-2">Два основных отчета системы:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-indigo-300 transition-all">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1.5">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span>Вкладка «Финансовый отчет» (Таб 1)</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Полноценный управленческий отчет из 135 строк (статьи 0–134) со сквозными формулами: выручка, себестоимость, переменные, постоянные затраты, налоги, кредиты, чистая прибыль и распределение дивидендов между владельцами.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-purple-300 transition-all">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Вкладка «Отчет по услугам и залам» (Таб 2)</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Детальный анализ доходности каждого рабочего направления (Колористика, Макияж, Ногти, Брови, Мужской зал): выручка, оплата деньгами/счетами/абонементами, расходы на косметику, ФОТ мастеров и админов, чистая прибыль и маржинальность каждой услуги.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-700" />
              <span>Главная особенность сквозной синхронизации:</span>
            </div>
            <p className="leading-relaxed">
              Вам не нужно вводить зарплату дважды! Данные по зарплатам мастеров и администраторов, настроенные во вкладке услуг, 
              <strong>автоматически переносятся</strong> в строки «Зарплата мастеров» и «Зарплата административного персонала» Финансового отчета.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'input_files',
      title: '2. Требования к входным файлам и загрузка данных',
      shortTitle: 'Входные файлы',
      icon: FileSpreadsheet,
      badge: 'Форматы',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            Система принимает стандартные выгрузки Excel (<code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">.xlsx</code>, <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">.xls</code>) и текстовые таблицы (<code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">.csv</code>) из CRM-систем (Yclients, 1С, МойСклад, банковские выписки).
          </p>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 font-bold text-xs text-gray-700 border-b border-gray-200 uppercase tracking-wide">
              Структура файла «Финансовый отчет» (ДДС / Выписка операций)
            </div>
            <div className="p-4 space-y-3 text-xs">
              <p>Алгоритм гибко распознает заголовки столбцов даже при разном регистре:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
                <li className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Сумма, Р» / «Сумма»</strong> — числовое значение операции</li>
                <li className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Назначение» / «Статья»</strong> — категория движения</li>
                <li className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Контрагент»</strong> — ФИО сотрудника или поставщик</li>
                <li className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Дата»</strong> — дата операции (ДД.ММ.ГГГГ)</li>
                <li className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Комментарий»</strong> — примечание к транзакции</li>
                <li className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Услуга/Товар»</strong> — наименование (для детализации)</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 font-bold text-xs text-gray-700 border-b border-gray-200 uppercase tracking-wide">
              Структура файла «Отчет по услугам» (Выгрузка услуг CRM)
            </div>
            <div className="p-4 space-y-3 text-xs">
              <p>Для корректного построения отчета по залам требуются графы:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11.5px]">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Услуга»</strong>: полное название процедуры</div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Оплачено деньгами»</strong>: наличные + терминал (₽)</div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Оплачено со счетов клиентов»</strong>: с личного счета клиента (₽)</div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-150"><strong>«Скидка», «Баллы», «Сертификаты», «Абонементы»</strong></div>
              </div>
              <p className="text-gray-500 italic mt-1">
                * Итоговая сумма выручки услуги рассчитывается автоматически как сумма денежных оплат и списаний со счетов клиентов.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'financial_report',
      title: '3. Финансовый отчет и формулы (Таб 1)',
      shortTitle: 'Финансовый отчет',
      icon: Calculator,
      badge: 'Аналитика',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            Шаблон отчета строго регламентирован и состоит из ключевых финансовых блоков, рассчитываемых автоматически по формулам:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="font-bold text-emerald-950 flex items-center justify-between mb-1">
                <span>1. Выручка общая (строка 0)</span>
                <span className="font-mono bg-emerald-150 text-emerald-800 px-2 py-0.5 rounded text-[11px]">∑ строк 1–7</span>
              </div>
              <p className="text-emerald-800">
                Суммирует выручку с услуг, товаров, пополнений счетов, сертификатов, абонементов и прочих доходов.
              </p>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              <div className="font-bold text-rose-950 flex items-center justify-between mb-1">
                <span>2. Себестоимость общая (строка 8)</span>
                <span className="font-mono bg-rose-150 text-rose-800 px-2 py-0.5 rounded text-[11px]">∑ строк 9 + 48</span>
              </div>
              <p className="text-rose-800">
                Включает совокупную себестоимость услуг (ЗП мастеров + расходные материалы + стирка + эквайринг) и себестоимость проданных товаров.
              </p>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <div className="font-bold text-indigo-950 flex items-center justify-between mb-1">
                <span>3. Валовая прибыль (строка 53)</span>
                <span className="font-mono bg-indigo-150 text-indigo-800 px-2 py-0.5 rounded text-[11px]">строка 0 + строка 8</span>
              </div>
              <p className="text-indigo-800">
                Маржинальная прибыль салона до вычета постоянных и общехозяйственных расходов.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div className="font-bold text-amber-950 flex items-center justify-between mb-1">
                <span>4. Чистая прибыль (строка 130)</span>
                <span className="font-mono bg-amber-150 text-amber-800 px-2 py-0.5 rounded text-[11px]">Формула ОПУ</span>
              </div>
              <p className="text-amber-800">
                Валовая прибыль минус переменные затраты (строка 88) и постоянные затраты (строка 119) минус налоги и кредиты.
              </p>
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
              <div className="font-bold text-purple-950 flex items-center justify-between mb-1">
                <span>5. Распределение прибыли (строка 134)</span>
                <span className="font-mono bg-purple-150 text-purple-800 px-2 py-0.5 rounded text-[11px]">Ренат + Надежда + LIQ</span>
              </div>
              <p className="text-purple-800">
                Фактическое распределение дивидендов между учредителями и развитием бренда.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs space-y-1.5">
            <span className="font-bold text-gray-800">✏️ Ручное редактирование значений:</span>
            <p className="text-gray-600">
              Вы можете кликнуть дважды по любому значению строки и отредактировать его. Измененная строка помечается бейджем 
              <strong>«Изменено»</strong>, а все зависимые формулы мгновенно пересчитываются. При необходимости нажмите кнопку <strong>«Сбросить»</strong> для возврата к авто-расчету.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'services_halls',
      title: '4. Отчет по услугам и залам (Таб 2)',
      shortTitle: 'Услуги и Залы',
      icon: Building2,
      badge: 'Юнит-экономика',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            Вкладка <strong>«Отчет по услугам и залам»</strong> распределяет весь ассортимент салона по 10 специализированным залам (плюс категория «Прочие услуги» для сопутствующих позиций):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50">
              <div className="font-bold text-purple-900 mb-1">1. Зал колористики/парикмахеры</div>
              <p className="text-purple-800">Окрашивания Matrix, Loreal, Keune, тонирование, женские стрижки, контурные линии, акции месяца на стрижки.</p>
            </div>
            <div className="p-3 rounded-xl border border-pink-200 bg-pink-50/50">
              <div className="font-bold text-pink-900 mb-1">2. Зал макияжей и укладок</div>
              <p className="text-pink-800">Дневной, вечерний, свадебный макияж, укладки на брашинг, прически, афро-кудри, укладка SteamPod, выезд на дом/в отель.</p>
            </div>
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="font-bold text-emerald-900 mb-1">3. Зал ногтевого сервиса</div>
              <p className="text-emerald-800">Аппаратный и японский маникюр/педикюр, гель-лак, наращивание ногтей, френч, втирки, ремонт ногтей, укрепление, SPA-уход.</p>
            </div>
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="font-bold text-amber-900 mb-1">4. Зал бровей</div>
              <p className="text-amber-800">Оформление и коррекция бровей (воск/пинцет), окрашивание краской/хной, долговременная укладка, осветление, депиляция верхней губы воском.</p>
            </div>
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
              <div className="font-bold text-blue-900 mb-1">5. Мужской зал</div>
              <p className="text-blue-800">Мужские стрижки American Crew, бритье головы, моделирование бороды, камуфляж седины, спа-укладки, восковая депиляция нос/уши/межбровье.</p>
            </div>
            <div className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/50">
              <div className="font-bold text-cyan-900 mb-1">6. Зал ресниц</div>
              <p className="text-cyan-800">Наращивание ресниц (классика, 1.5D, 2D, 2.5D, 3D, адаптивное), мокрый эффект, ламинирование ресниц + ботокс, окрашивание, снятие.</p>
            </div>
            <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/50">
              <div className="font-bold text-violet-900 mb-1">7. Фотостудия</div>
              <p className="text-violet-800">Штатный фотограф (съемка 30 мин / 1 час), аренда фотостудии, съемка контента салона, ТФП съемка и сопутствующие доп. услуги.</p>
            </div>
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
              <div className="font-bold text-rose-900 mb-1">8. Зал эпиляции</div>
              <p className="text-rose-800">Лазерная эпиляция (пакеты макси/мини/средний/все тело, зоны бикини, ноги, голени, подмышки), шугаринг, воск, фитосмола, сахарное моделирование.</p>
            </div>
            <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50">
              <div className="font-bold text-teal-900 mb-1">9. ЗАЛ SPA</div>
              <p className="text-teal-800">Ритуалы Kerastase Fusio Dose (с маской/без), уходы Tokio Inkarami, L'Oreal Peptide Molecular, Metal Detox, уходы Davines, пилинг кожи головы, мытье головы.</p>
            </div>
            <div className="p-3 rounded-xl border border-orange-200 bg-orange-50/50">
              <div className="font-bold text-orange-900 mb-1">10. Зал массажный</div>
              <p className="text-orange-800">Классический, расслабляющий, восстановительный массаж, лимфодренажный массаж лица, массаж ШВЗ, головы, аппаратный массаж зон.</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3">
            <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
              Формула себестоимости и маржинальности услуги:
            </h5>
            <div className="bg-gray-900 text-gray-150 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
              Затраты услуги = Материалы (Поставщики) + ЗП мастеров + Доля ЗП админов + Переменные затраты + Постоянные затраты
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <strong className="text-gray-900 block mb-0.5">Прибыль услуги:</strong>
                <span className="font-mono text-emerald-700 font-semibold">Выручка услуги − Всего затрат услуги</span>
              </div>
              <div>
                <strong className="text-gray-900 block mb-0.5">Рентабельность услуги:</strong>
                <span className="font-mono text-indigo-700 font-semibold">(Прибыль / Выручка) × 100%</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'expense_allocation',
      title: '5. Выбор способа распределения затрат',
      shortTitle: 'Распределение затрат',
      icon: SlidersHorizontal,
      badge: 'Новое правило',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            В верхней панели вкладки услуг расположен переключатель <strong>«Способ распределения затрат по залам»</strong>. 
            Он управляет распределением переменных затрат, постоянных затрат и зарплаты администраторов:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border-2 border-indigo-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-indigo-950 text-sm">Вариант А: «Пропорционально выручке»</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">По выручке</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Каждый зал получает долю общих расходов строго пропорционально его фактической доле в общей выручке услуг:
                <br />
                <code className="mt-1 inline-block bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-[11px]">
                  Доля затрат зала = Выручка зала / Общая выручка всех залов
                </code>
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-purple-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-950 text-sm">Вариант Б: «Пропорционально площади залов»</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">По площади (м²)</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Каждый зал получает долю общих расходов согласно своей физической площади (м²).
              </p>
              
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Строгое правило нулевой выручки:</span>
                </div>
                <p>
                  <strong>При способе распределения по площади при отсутствии выручки по данному залу затраты на него НЕ распределяются (0 ₽).</strong>
                </p>
                <p className="text-[11px] text-amber-800">
                  Если в отчетном месяце зал не работал или не принес выручки, его площадь исключается из расчетной базы, и 100% расходов распределяются только между фактически работавшими залами!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'payroll_and_fot',
      title: '6. Зарплатный блок, ФОТ и ведомость выплат',
      shortTitle: 'Зарплаты и ФОТ',
      icon: Users,
      badge: 'Сотрудники',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            Система разделяет фонд оплаты труда на две независимые категории:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs">
              <div className="font-bold text-sky-950 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Зарплата мастеров (строго по залам)</span>
              </div>
              <p className="text-gray-600 leading-relaxed mb-2">
                Задается индивидуально для каждого из 5 залов в карточке зала. Эта сумма относится строго на себестоимость услуг данного зала.
              </p>
              <div className="bg-sky-50 text-sky-900 p-2.5 rounded-xl font-mono text-[11px]">
                Итого ЗП мастеров = Сумма ЗП мастеров всех залов
              </div>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs">
              <div className="font-bold text-teal-950 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span>Зарплата администраторов (общая)</span>
              </div>
              <p className="text-gray-600 leading-relaxed mb-2">
                Общий фонд администраторов вводится в отдельном поле баннера. Распределяется между залами согласно выбранному методу (по выручке или по площади).
              </p>
              <div className="bg-teal-50 text-teal-900 p-2.5 rounded-xl font-mono text-[11px]">
                Передается в статью «Зарплата адм. персонала»
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/70 space-y-2 text-xs">
            <h5 className="font-bold text-gray-900">Вкладка «Ведомость зарплат» и дата отсечения:</h5>
            <p className="text-gray-600">
              В шапке системы расположено поле <strong>«Дата Отсечения ЗП»</strong> (по умолчанию ДД.ММ.ГГГГ). 
              Все выплаты сотрудникам с датой строго до этой границы относятся к <strong>«Прошлому периоду»</strong>, а после — к <strong>«Отчетному периоду»</strong>. 
              Это позволяет корректно отделить расчет за прошлый месяц от авансов текущего месяца.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'classifier_and_other',
      title: '7. Классификатор залов и отнесение «Прочих услуг»',
      shortTitle: 'Прочие услуги',
      icon: Layers,
      badge: 'Память выбора',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            В систему встроен двухуровневый классификатор, распределяющий более 150 услуг салона по залам.
            Если услуга не соответствует ни одному залу (например, чаевые, консультация, бронирование или спец-процедура), она помещается в секцию <strong>«Прочие услуги»</strong>.
          </p>

          <div className="bg-white border-2 border-amber-200 rounded-2xl p-4.5 shadow-2xs space-y-3">
            <h5 className="font-bold text-amber-950 text-sm flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-600" />
              Как отнести услугу из «Прочих» к нужному залу с сохранением выбора:
            </h5>
            <ol className="list-decimal list-inside space-y-2 text-xs text-gray-700 leading-relaxed">
              <li>
                <strong>В желтом баннере «Услуги, требующие распределения»</strong>: у каждой нераспределенной услуги есть выпадающий список залов. Выберите нужный зал в 1 клик.
              </li>
              <li>
                <strong>Прямо в таблице услуг</strong>: у любой строки в графе зала доступен быстрый выбор зала.
              </li>
              <li>
                <strong>Запоминание выбора</strong>: ваш выбор мгновенно сохраняется в локальной памяти браузера (<code className="px-1 bg-gray-100 rounded font-mono">localStorage</code>).
              </li>
              <li>
                <strong>Использование в других отчетах</strong>: при загрузке новых файлов, формировании Excel-выгрузки и Детализации доходов переопределенная услуга уже будет автоматически числиться в выбранном вами зале!
              </li>
            </ol>
          </div>

          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs flex items-center justify-between gap-3 text-indigo-900">
            <div>
              <strong>Управление назначениями:</strong> нажмите кнопку <strong>«Назначения залов»</strong> в панели инструментов, чтобы просмотреть все ваши ручные соответствия, отредактировать их или сбросить.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'suppliers',
      title: '8. Регламентное распределение расходов на поставщиков',
      shortTitle: 'Поставщики',
      icon: Package,
      badge: 'Материалы',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            Расходы на закупку материалов распределяются по залам строго по регламентной матрице салона:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <strong className="text-gray-900 block mb-1">1. Прямые закупки зала (Direct):</strong>
              <p className="text-gray-600">
                Красители и уходы (Matrix, Loreal, Keune) — относятся на 100% на <strong>Зал колористики</strong>.
                Материалы для ногтей — на 100% на <strong>Зал ногтевого сервиса</strong>.
                Косметика и ресницы — на <strong>Зал макияжей</strong> и <strong>Зал бровей</strong>.
              </p>
            </div>

            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <strong className="text-gray-900 block mb-1">2. Общие материалы салона (Shared):</strong>
              <p className="text-gray-600">
                Расходники общего назначения (одноразовые полотенца, перчатки, дезинфекция, чай/кофе) распределяются между всеми залами пропорционально выручке.
              </p>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900">
              <strong className="block mb-1">💡 Ручной ввод расходов на поставщиков:</strong>
              <p>
                Если в файле ДДС закупки не детализированы, вы можете активировать переключатель <strong>«Ручной ввод суммы поставщиков»</strong> и ввести общую сумму материалов за месяц — система сама разделит её по залам.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'exports',
      title: '9. Экспорт отчетов, сводок и аналитических записок',
      shortTitle: 'Экспорт отчетов',
      icon: Download,
      badge: 'Excel / Word',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      content: (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p>
            Все отчеты можно выгрузить в удобном формате для печати, согласования с бухгалтерией и презентации учредителям:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-2xs">
              <div className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Excel: Залы и Услуги</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Включает 2 листа: лист <strong>«Отчет по залам и услугам»</strong> с группировкой по залам и лист <strong>«Сводка по залам»</strong> со сравнением площадей, ФОТ и выручки на 1 м².
              </p>
            </div>

            <div className="p-4 bg-white border border-blue-200 rounded-2xl shadow-2xs">
              <div className="font-bold text-blue-950 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Excel: Финансовый отчет</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Содержит лист полного отчета ОПУ со всеми строками и формулами, лист ведомости зарплат и лист детализации доходов по видам услуг.
              </p>
            </div>

            <div className="p-4 bg-white border border-indigo-200 rounded-2xl shadow-2xs">
              <div className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Word: Аналитическая записка</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Генерирует официальный документ <code className="font-mono">.docx</code> с резюме периода, графиками прибыльности, ТОП-услугами и выводами для собственников.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: '10. Часто задаваемые вопросы (FAQ)',
      shortTitle: 'Частые вопросы (FAQ)',
      icon: HelpCircle,
      badge: 'Помощь',
      badgeColor: 'bg-gray-150 text-gray-800 border-gray-300',
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed text-xs">
          <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
            <strong className="text-gray-900 block">Q: Почему в отчете по залам у услуги нулевая прибыль или отрицательная?</strong>
            <p className="text-gray-600">
              A: Это происходит, если на услугу отнесена высокая доля постоянных/переменных затрат или закупка материалов превышает стоимость услуги. Проверьте способ распределения затрат и корректность введенных площадей залов.
            </p>
          </div>

          <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
            <strong className="text-gray-900 block">Q: Как сбросить ручные назначения услуг и вернуться к авто-определению?</strong>
            <p className="text-gray-600">
              A: Во вкладке «Отчет по услугам и залам» нажмите кнопку «Назначения залов» в панели фильтров, и в открывшемся окне нажмите «Сбросить все назначения».
            </p>
          </div>

          <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
            <strong className="text-gray-900 block">Q: Сохраняются ли изменения в браузере при перезагрузке страницы?</strong>
            <p className="text-gray-600">
              A: Да, все ручные соответствия залов («Прочие услуги» → нужный зал) сохраняются в хранилище вашего браузера и действуют бессрочно до ручного сброса.
            </p>
          </div>

          <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
            <strong className="text-gray-900 block">Q: Где посмотреть пример работы перед загрузкой реального файла?</strong>
            <p className="text-gray-600">
              A: Нажмите кнопку «Загрузить Демо» в шапке (для финотчета) или «Загрузить Демо Услуг» во второй вкладке — система мгновенно заполнит все таблицы демонстрационными данными салона.
            </p>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(sec => 
      sec.title.toLowerCase().includes(q) || 
      sec.shortTitle.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-5xl h-[90vh] max-h-[820px] rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 bg-gray-50 border-b border-gray-150 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-150 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base text-gray-900">
                  Подробное руководство пользователя
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Версия 1.2
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Справочник формул, регламентов залов, распределения затрат и работы с отчетами
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDemo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDemo();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Открыть демо</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              title="Закрыть руководство (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-150 flex items-center gap-2.5 shrink-0">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Быстрый поиск по темам руководства (например: площадь, прочие услуги, зарплата, формулы)..."
            className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Очистить
            </button>
          )}
        </div>

        {/* Body (Sidebar + Content) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation */}
          <div className="w-64 sm:w-72 bg-gray-50/70 border-r border-gray-150 flex flex-col shrink-0 overflow-y-auto p-3 space-y-1">
            <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Разделы документации
            </div>

            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-gray-700 hover:bg-gray-150/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="truncate">{sec.shortTitle}</span>
                  </div>
                  {sec.badge && (
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : `${sec.badgeColor} border`
                    }`}>
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400">
                Ничего не найдено по запросу «{searchQuery}»
              </div>
            )}
          </div>

          {/* Right Main Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white">
            <div className="max-w-3xl space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Раздел {sections.findIndex(s => s.id === currentSection.id) + 1} из {sections.length}
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-xl text-gray-900">
                  {currentSection.title}
                </h2>
              </div>

              {currentSection.content}

              {/* Navigation buttons between sections */}
              <div className="pt-8 border-t border-gray-150 flex items-center justify-between gap-4">
                {(() => {
                  const currIdx = sections.findIndex(s => s.id === currentSection.id);
                  const prevSec = sections[currIdx - 1];
                  const nextSec = sections[currIdx + 1];

                  return (
                    <>
                      {prevSec ? (
                        <button
                          type="button"
                          onClick={() => setActiveSection(prevSec.id)}
                          className="px-3.5 py-1.5 rounded-xl border border-gray-250 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          ← {prevSec.shortTitle}
                        </button>
                      ) : <div />}

                      {nextSec && (
                        <button
                          type="button"
                          onClick={() => setActiveSection(nextSec.id)}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{nextSec.shortTitle}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 bg-gray-50 border-t border-gray-150 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Все расчеты производятся локально в браузере в реальном времени</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
