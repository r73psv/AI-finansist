import { normalizeString } from './processingEngine';
import { RawRecord } from './types';
import { HALL_NAMES, HallName } from './hallsClassifier';

export type SupplierHallTarget = 
  | HallName
  | 'распределяются между всеми'
  | 'товары';

export interface SupplierItemDefinition {
  name: string;
  target: SupplierHallTarget;
  description?: string;
}

// Регламент распределения расходов на поставщиков согласно таблице
export const SUPPLIER_HALL_RULES: SupplierItemDefinition[] = [
  // 1. Зал ногтевого сервиса
  { name: 'Материалы для ногтевиков', target: 'Зал ногтевого сервиса' },
  { name: 'ООО "ВЕЛЛНЕС БЬЮТИ" (La Sultane de Saba)', target: 'Зал ногтевого сервиса' },
  { name: 'Материалы для эпиляции', target: 'Зал эпиляции' },

  // 2. Зал бровей и ресниц
  { name: 'Материалы для бровистов', target: 'Зал бровей' },
  { name: 'Материалы для ресниц', target: 'Зал ресниц' },

  // 3. Зал колористики, стрижек, уходов (Зал колористики/парикмахеры)
  { name: 'ИП Щеголькова (Ипатова/Власов) (Constant Delight расходники)', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Щеголькова (Ипатова/Власов) (Constant Delight расходн', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Щеголькова (Ипатова/Власов) (Constant Delight витрина)', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Щеголькова (Ипатова/Власов) (Constant Delight витрина', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Худорожков/Демин (расходники)', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Калашникова (Matrix расходники)', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Калашникова (L`Oreal расходники)', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Калашникова (Matrix витрина)', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Калашникова(L\'Oreal витрина)', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Коротков (Дайвинес)', target: 'Зал колористики/парикмахеры' },
  { name: 'Керастас', target: 'Зал колористики/парикмахеры' },
  { name: 'ООО "ГЕРА ГРУП"', target: 'Зал колористики/парикмахеры' },
  { name: 'ООО «ГЕРА ГРУП»', target: 'Зал колористики/парикмахеры' },
  { name: 'Эстель, Кутюр', target: 'Зал колористики/парикмахеры' },
  { name: 'Уходы без поставщика ( бикси/хим и т д)', target: 'Зал колористики/парикмахеры' },
  { name: 'Уходы без поставщика (бикси/хим и т. д.)', target: 'Зал колористики/парикмахеры' },
  { name: 'ООО "Кэвиар Групп" (бренд NASHI)', target: 'Зал колористики/парикмахеры' },
  { name: 'TOKIO', target: 'Зал колористики/парикмахеры' },
  { name: 'TOKIO INKARAMI', target: 'Зал колористики/парикмахеры' },
  { name: 'ИП Щеголькова (KEUNE)', target: 'Зал колористики/парикмахеры' },
  { name: 'ООО «Солком Регион» (Лореаль витрина)', target: 'Зал колористики/парикмахеры' },
  { name: 'ООО «Солком Регион» (Лореаль расходники)', target: 'Зал колористики/парикмахеры' },
  { name: 'ООО «Солком Регион» (Матрикс расходники)', target: 'Зал колористики/парикмахеры' },
  { name: 'ООО «Эстель Сервис Поволжье»', target: 'Зал колористики/парикмахеры' },
  { name: 'Чавга Полина(KEUNE)', target: 'Зал колористики/парикмахеры' },
  { name: 'DR.HURTINA', target: 'Зал колористики/парикмахеры' },
  { name: 'Organic Works', target: 'Зал колористики/парикмахеры' },

  // 4. Мужской зал
  { name: 'ИП Щеголькова (Ипатова/Власов) (American CREW)', target: 'Мужской зал' },
  { name: 'Расходники для барберов', target: 'Мужской зал' },

  // 5. Распределяются между всеми
  { name: 'неопределен', target: 'распределяются между всеми' },
  { name: 'Прочие закупки', target: 'распределяются между всеми' },
  { name: 'ООО "Торговый Дом "БлескСервис" (TORK) (Расходники)', target: 'распределяются между всеми' },
  { name: 'OOO «Торговый Дом „БлескСервис“» (TORK) (Расходники)', target: 'распределяются между всеми' },
  { name: 'Заказ с маркетплейсов (Ozon, WB, Яндекс Маркет)', target: 'распределяются между всеми' },

  // 6. Зал макияжей и укладок
  { name: 'ИП Щеголькова (Ипатова/Власов) (ProfiLine)', target: 'Зал макияжей и укладок' },

  // 7. Товары (на продажу / витрина)
  { name: 'Товары на продажу (Украшения на витрину)', target: 'товары' },
  { name: 'Косметика на продажу', target: 'товары' },
  { name: 'L’Occitane (Локситан)', target: 'товары' }
];

// Map canonical names to their targets
const EXACT_SUPPLIER_MAP: Record<string, SupplierHallTarget> = {};
SUPPLIER_HALL_RULES.forEach((rule) => {
  EXACT_SUPPLIER_MAP[normalizeString(rule.name)] = rule.target;
});

/**
 * Классифицирует статью поставщика по залу на основе регламента и ключевых слов
 */
export function classifySupplierHall(supplierName: string): SupplierHallTarget {
  if (!supplierName) return 'распределяются между всеми';

  const norm = normalizeString(supplierName);

  // 1. Точное совпадение
  if (EXACT_SUPPLIER_MAP[norm]) {
    return EXACT_SUPPLIER_MAP[norm];
  }

  // 2. Правила по ключевым словам из регламента

  // Зал ногтевого сервиса
  if (
    norm.includes('ногтев') ||
    norm.includes('ногт') ||
    norm.includes('маникюр') ||
    norm.includes('педикюр') ||
    norm.includes('веллнес бьюти') ||
    norm.includes('веллнес') ||
    norm.includes('sultane de saba') ||
    norm.includes('султан де саба')
  ) {
    return 'Зал ногтевого сервиса';
  }

  // Зал ресниц
  if (
    norm.includes('реснич') ||
    norm.includes('ресниц') ||
    norm.includes('ламинирование ресниц') ||
    norm.includes('наращивание ресниц')
  ) {
    return 'Зал ресниц';
  }

  // Зал эпиляции
  if (
    norm.includes('эпиляц') ||
    norm.includes('шугаринг') ||
    norm.includes('фитосмол') ||
    norm.includes('сахарное моделирование')
  ) {
    return 'Зал эпиляции';
  }

  // Зал массажный
  if (
    norm.includes('массаж') ||
    norm.includes('лимфодренаж')
  ) {
    return 'Зал массажный';
  }

  // Фотостудия
  if (
    norm.includes('фотостуди') ||
    norm.includes('фотограф')
  ) {
    return 'Фотостудия';
  }

  // Зал бровей
  if (
    norm.includes('бровист') ||
    norm.includes('бров')
  ) {
    return 'Зал бровей';
  }

  // Зал макияжей и укладок
  if (
    norm.includes('profiline') ||
    norm.includes('профилайн') ||
    norm.includes('макияж') ||
    norm.includes('укладк')
  ) {
    return 'Зал макияжей и укладок';
  }

  // Мужской зал
  if (
    norm.includes('american crew') ||
    norm.includes('америкэн крю') ||
    norm.includes('барбер') ||
    norm.includes('мужской зал')
  ) {
    return 'Мужской зал';
  }

  // Товары на продажу
  if (
    norm.includes('украшения') ||
    norm.includes('украшения на витрину') ||
    norm.includes('товары на продажу') ||
    norm.includes('косметика на продажу')
  ) {
    return 'товары';
  }

  // Зал колористики, стрижек, уходов
  if (
    norm.includes('constant delight') ||
    norm.includes('констант делайт') ||
    norm.includes('худорожков') ||
    norm.includes('демин') ||
    norm.includes('калашникова') ||
    norm.includes('matrix') ||
    norm.includes('матрикс') ||
    norm.includes('l`oreal') ||
    norm.includes('l\'oreal') ||
    norm.includes('лореаль') ||
    norm.includes('loreal') ||
    norm.includes('коротков') ||
    norm.includes('дайвинес') ||
    norm.includes('davines') ||
    norm.includes('керастас') ||
    norm.includes('kerastase') ||
    norm.includes('гера груп') ||
    norm.includes('эстель') ||
    norm.includes('estel') ||
    norm.includes('уходы без поставщика') ||
    norm.includes('бикси') ||
    norm.includes('кэвиар') ||
    norm.includes('caviar') ||
    norm.includes('nashi') ||
    norm.includes('наши') ||
    norm.includes('tokio') ||
    norm.includes('токио') ||
    norm.includes('keune') ||
    norm.includes('кене') ||
    norm.includes('чавга') ||
    norm.includes('солком') ||
    norm.includes('hurtina') ||
    norm.includes('organic works')
  ) {
    return 'Зал колористики/парикмахеры';
  }

  // Распределяемые между всеми (по умолчанию)
  if (
    norm.includes('блесксервис') ||
    norm.includes('блеск сервис') ||
    norm.includes('tork') ||
    norm.includes('торк') ||
    norm.includes('прочие закупки') ||
    norm.includes('неопределен') ||
    norm.includes('маркетплейс') ||
    norm.includes('ozon') ||
    norm.includes('wb')
  ) {
    return 'распределяются между всеми';
  }

  // По умолчанию общие расходы
  return 'распределяются между всеми';
}

export interface SupplierItemRecord {
  supplierName: string;
  targetHall: SupplierHallTarget;
  amount: number;
  transactionsCount?: number;
  transactions?: RawRecord[];
}

export interface SuppliersAllocationBreakdown {
  totalSuppliersCost: number;
  directByHall: Record<string, number>;
  sharedTotal: number;
  goodsTotal: number;
  items: SupplierItemRecord[];
  hallSuppliersSummary: {
    hallName: string;
    directCost: number;
    allocatedSharedCost: number;
    totalSupplierCost: number;
    items: SupplierItemRecord[];
  }[];
}

/**
 * Рассчитывает распределение расходов на поставщиков по залам салона:
 * - Прямые поставщики зала относяться к конкретному залу
 * - Общие расходы ("распределяются между всеми") распределяются пропорционально выручке залов
 */
export function calculateSuppliersAllocation(
  supplierRows: { label: string; value: number; transactions?: RawRecord[] }[],
  hallRevenues: Record<string, number> = {}
): SuppliersAllocationBreakdown {
  const directByHall: Record<string, number> = {
    'Зал ногтевого сервиса': 0,
    'Зал бровей': 0,
    'Зал колористики/парикмахеры': 0,
    'Мужской зал': 0,
    'Зал макияжей и укладок': 0,
    'Прочие услуги': 0
  };

  let sharedTotal = 0;
  let goodsTotal = 0;
  let totalSuppliersCost = 0;

  const items: SupplierItemRecord[] = [];

  supplierRows.forEach((row) => {
    const amount = Math.abs(row.value);
    if (amount <= 0 && (!row.transactions || row.transactions.length === 0)) return;

    totalSuppliersCost += amount;
    const target = classifySupplierHall(row.label);

    items.push({
      supplierName: row.label,
      targetHall: target,
      amount,
      transactionsCount: row.transactions?.length || 0,
      transactions: row.transactions
    });

    if (target === 'распределяются между всеми') {
      sharedTotal += amount;
    } else if (target === 'товары') {
      goodsTotal += amount;
    } else {
      directByHall[target] = (directByHall[target] || 0) + amount;
    }
  });

  // Общая выручка по залам (для пропорционального распределения общих расходов)
  let totalSalonRevenue = 0;
  Object.values(hallRevenues).forEach((rev) => {
    totalSalonRevenue += rev;
  });

  const activeHalls = [
    'Зал колористики/парикмахеры',
    'Зал макияжей и укладок',
    'Зал ногтевого сервиса',
    'Зал бровей',
    'Мужской зал',
    'Прочие услуги'
  ];

  const hallSuppliersSummary = activeHalls.map((hName) => {
    const directCost = directByHall[hName] || 0;
    const hRev = hallRevenues[hName] || 0;
    
    // Доля в общей выручке
    const share = totalSalonRevenue > 0 ? (hRev / totalSalonRevenue) : (1 / 5);
    const allocatedSharedCost = parseFloat((sharedTotal * share).toFixed(2));
    const totalSupplierCost = parseFloat((directCost + allocatedSharedCost).toFixed(2));

    const hallItems = items.filter((it) => it.targetHall === hName);

    return {
      hallName: hName,
      directCost: parseFloat(directCost.toFixed(2)),
      allocatedSharedCost,
      totalSupplierCost,
      items: hallItems
    };
  });

  return {
    totalSuppliersCost: parseFloat(totalSuppliersCost.toFixed(2)),
    directByHall,
    sharedTotal: parseFloat(sharedTotal.toFixed(2)),
    goodsTotal: parseFloat(goodsTotal.toFixed(2)),
    items,
    hallSuppliersSummary
  };
}
