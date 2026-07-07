import * as XLSX from 'xlsx';
import { RawRecord, MetricRow, SalaryEmployee, SalaryProcessingMetrics } from './types';
import { FINANCIAL_TEMPLATE } from './financialTemplate';

// String cleaning for fuzzy matching
export function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»„“"'\`’‘]/g, '') // remove quotation marks, backticks and typographical single quotes
    .replace(/\s+/g, ' ') // compress whitespace
    .trim();
}

// Canonicalize brand synonyms to unify different spellings
export function canonicalizeString(str: string | null | undefined): string {
  let norm = normalizeString(str);
  if (!norm) return '';

  const substringReplacements: { pattern: string; canonical: string }[] = [
    { pattern: "constant delight", canonical: "constant_delight" },
    { pattern: "констант делайт", canonical: "constant_delight" },
    { pattern: "constantdelight", canonical: "constant_delight" },
    { pattern: "константделайт", canonical: "constant_delight" },
    { pattern: "american crew", canonical: "american_crew" },
    { pattern: "американ крю", canonical: "american_crew" },
    { pattern: "americancrew", canonical: "american_crew" },
    { pattern: "bleskservis", canonical: "blesk_servis" },
    { pattern: "блесксервис", canonical: "blesk_servis" },
    { pattern: "блеск сервис", canonical: "blesk_servis" },
    { pattern: "блеск-сервис", canonical: "blesk_servis" },
    { pattern: "geragroup", canonical: "gera_group" },
    { pattern: "герагруп", canonical: "gera_group" },
    { pattern: "гера груп", canonical: "gera_group" },
    { pattern: "gera group", canonical: "gera_group" },
    { pattern: "лореаль", canonical: "loreal" },
    { pattern: "лореал", canonical: "loreal" },
    { pattern: "loreal", canonical: "loreal" },
    { pattern: "матрикс", canonical: "matrix" },
    { pattern: "matrix", canonical: "matrix" },
    { pattern: "дайвинес", canonical: "davines" },
    { pattern: "давинес", canonical: "davines" },
    { pattern: "davines", canonical: "davines" },
    { pattern: "керастаз", canonical: "kerastase" },
    { pattern: "керастас", canonical: "kerastase" },
    { pattern: "kerastase", canonical: "kerastase" },
    { pattern: "эстель кутюр", canonical: "estel" },
    { pattern: "эстель", canonical: "estel" },
    { pattern: "estel", canonical: "estel" },
    { pattern: "локситан", canonical: "loccitane" },
    { pattern: "loccitane", canonical: "loccitane" },
    { pattern: "профилайн", canonical: "profiline" },
    { pattern: "профи лайн", canonical: "profiline" },
    { pattern: "profiline", canonical: "profiline" },
    { pattern: "худорожков", canonical: "hudorozhkov" },
    { pattern: "hudorozhkov", canonical: "hudorozhkov" },
    { pattern: "демин", canonical: "demin" },
    { pattern: "demin", canonical: "demin" },
    { pattern: "калашникова", canonical: "kalashnikova" },
    { pattern: "kalashnikova", canonical: "kalashnikova" },
    { pattern: "коротков", canonical: "korotkov" },
    { pattern: "korotkov", canonical: "korotkov" },
    { pattern: "солком регион", canonical: "solkom" },
    { pattern: "солком", canonical: "solkom" },
    { pattern: "solkom", canonical: "solkom" },
    { pattern: "wildberries", canonical: "wildberries" },
    { pattern: "вайлдберриз", canonical: "wildberries" },
    { pattern: "вайлдберис", canonical: "wildberries" },
    { pattern: "яндекс маркет", canonical: "yandex" },
    { pattern: "яндексмаркет", canonical: "yandex" },
    { pattern: "яндекс", canonical: "yandex" },
    { pattern: "yandex", canonical: "yandex" },
    { pattern: "чавга полина", canonical: "chavga" },
    { pattern: "чавга", canonical: "chavga" },
    { pattern: "chavga", canonical: "chavga" },
    { pattern: "щеголькова", canonical: "schegolkova" },
    { pattern: "schegolkova", canonical: "schegolkova" },
    { pattern: "keune", canonical: "keune" },
    { pattern: "кене", canonical: "keune" },
    { pattern: "кёне", canonical: "keune" },
    { pattern: "кюне", canonical: "keune" }
  ];

  const wholeWordReplacements: { pattern: string; canonical: string }[] = [
    { pattern: "вб", canonical: "wildberries" },
    { pattern: "wb", canonical: "wildberries" },
    { pattern: "сд", canonical: "constant_delight" },
    { pattern: "cd", canonical: "constant_delight" },
    { pattern: "гера", canonical: "gera_group" },
    { pattern: "gera", canonical: "gera_group" },
    { pattern: "блеск", canonical: "blesk_servis" },
    { pattern: "blesk", canonical: "blesk_servis" },
    { pattern: "озон", canonical: "ozon" },
    { pattern: "ozon", canonical: "ozon" },
    { pattern: "tork", canonical: "tork" },
    { pattern: "торк", canonical: "tork" },
    { pattern: "я маркет", canonical: "yandex" },
    { pattern: "я.маркет", canonical: "yandex" },
    { pattern: "констант", canonical: "constant_delight" }
  ];

  // Helper for whole word replacement
  const replaceWord = (source: string, word: string, replacement: string): string => {
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zа-яё0-9_])${escaped}($|[^a-zа-яё0-9_])`, 'gi');
    return source.replace(regex, (match, p1, p2) => p1 + replacement + p2);
  };

  // 1. Sort whole-word patterns by length descending and replace
  const sortedWholeWord = [...wholeWordReplacements].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const repl of sortedWholeWord) {
    norm = replaceWord(norm, repl.pattern, repl.canonical);
  }

  // 2. Sort substring patterns by length descending and replace
  const sortedSubstring = [...substringReplacements].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const repl of sortedSubstring) {
    const escapedPattern = repl.pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedPattern, 'gi');
    norm = norm.replace(regex, repl.canonical);
  }

  return norm;
}

// Compute deep match score between transaction attributes and a candidate supplier label
export function getCounterpartyMatchScore(
  candidateLabel: string,
  txCounterparty: string,
  txCategory: string,
  txComment: string
): number {
  const canLabel = canonicalizeString(candidateLabel);
  const canCont = canonicalizeString(txCounterparty);
  const canCat = canonicalizeString(txCategory);
  const canComm = canonicalizeString(txComment);

  if (!canCont) return 0;

  // Verify exclusive brand mismatch first
  const exclusiveBrands = [
    "loreal", "matrix", "constant_delight", "davines", "keune", "kerastase", 
    "estel", "loccitane", "tork", "profiline", "american_crew"
  ];

  const txExclusive = exclusiveBrands.filter(b => canCont.includes(b) || canComm.includes(b) || canCat.includes(b));
  const labelExclusive = exclusiveBrands.filter(b => canLabel.includes(b));

  if (txExclusive.length > 0 && labelExclusive.length > 0) {
    const hasSharedExclusive = txExclusive.some(b => labelExclusive.includes(b));
    if (!hasSharedExclusive) {
      return 0; // Direct exclusive brand mismatch!
    }
  }

  // Find all known brand/distributor tags
  const brands = [
    "loreal", "matrix", "constant_delight", "davines", "keune", "kerastase", 
    "estel", "loccitane", "tork", "profiline", "american_crew", "hudorozhkov", 
    "demin", "blesk_servis", "kalashnikova", "korotkov", "gera_group", "solkom", 
    "ozon", "wildberries", "yandex", "chavga", "schegolkova"
  ];

  const txBrands = brands.filter(b => canCont.includes(b));
  if (txBrands.length === 0) {
    const commentBrands = brands.filter(b => canComm.includes(b));
    txBrands.push(...commentBrands);
  }
  if (txBrands.length === 0) {
    const catBrands = brands.filter(b => canCat.includes(b));
    txBrands.push(...catBrands);
  }

  const labelBrands = brands.filter(b => canLabel.includes(b));

  let hasOverlap = false;
  if (canLabel.includes(canCont) || canCont.includes(canLabel)) {
    hasOverlap = true;
  } else {
    const w1 = canCont.split(/[^a-zа-я0-9_]+/i).filter(w => w.length >= 4);
    const w2 = canLabel.split(/[^a-zа-я0-9_]+/i).filter(w => w.length >= 4);
    hasOverlap = w1.some(w => w2.includes(w));
  }

  if (!hasOverlap && txBrands.length > 0) {
    // If no text overlap, but they share a brand, we might still match
    const hasSharedBrand = txBrands.some(b => labelBrands.includes(b));
    if (hasSharedBrand) {
      hasOverlap = true;
    }
  }

  if (!hasOverlap) {
    return 0; // No overlap or brand connection, reject
  }

  // Base score for overlap
  let score = 50;

  // Add specific matching bonuses per brand shared
  txBrands.forEach(b => {
    if (labelBrands.includes(b)) {
      score += 150; // Massively boost score when they share a specific brand/distributor tag!
    }
  });

  const entities = ["kalashnikova", "solkom", "schegolkova", "hudorozhkov", "demin", "blesk_servis", "gera_group", "korotkov", "chavga"];
  entities.forEach(ent => {
    if (canCont.includes(ent) && canLabel.includes(ent)) {
      score += 50; // Legal entity match
    }
  });

  const isVitrinaTx = 
    canCat.includes("витрин") || 
    canCat.includes("товар") || 
    canComm.includes("витрин") || 
    canComm.includes("продаж") || 
    canCont.includes("витрин");

  const isRashodnikiTx = 
    canCat.includes("материал") || 
    canCat.includes("расходник") || 
    canCat.includes("мастер") || 
    canComm.includes("материал") || 
    canComm.includes("расходник") || 
    canComm.includes("мастер") || 
    canCont.includes("расходник") || 
    canCont.includes("материал");

  const labelHasVitrina = canLabel.includes("витрин") || canLabel.includes("продаж");
  const labelHasRashodniki = canLabel.includes("расходник") || canLabel.includes("материал");

  if (isVitrinaTx) {
    if (labelHasVitrina) {
      score += 30;
    } else if (labelHasRashodniki) {
      score -= 30;
    }
  }

  if (isRashodnikiTx) {
    if (labelHasRashodniki) {
      score += 30;
    } else if (labelHasVitrina) {
      score -= 30;
    }
  }

  if (canLabel.includes(canCont)) {
    score += canCont.length * 2;
  } else if (canCont.includes(canLabel)) {
    score += canLabel.length * 2;
  }

  return score;
}

// Custom Russian and ISO date parser
export function parseDate(value: any): Date | null {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value;
  }
  if (!value) return null;
  const str = String(value).trim();
  
  // Try DD.MM.YYYY
  const parts = str.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    let year = parseInt(parts[2], 10);
    if (year < 100) {
      year += 2000; // handle 2-digit years like 24 -> 2024
    }
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  
  // Try YYYY-MM-DD
  const partsIso = str.split('-');
  if (partsIso.length === 3) {
    const year = parseInt(partsIso[0], 10);
    const month = parseInt(partsIso[1], 10) - 1;
    const day = parseInt(partsIso[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Try parsing with native JS Date
  const native = new Date(str);
  if (!isNaN(native.getTime())) return native;
  
  return null;
}

// Convert cell to number safely and bring it to a standardized clean financial value
export function parseNumber(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : parseFloat(val.toFixed(2));
  }
  if (val === null || val === undefined) return 0;

  let str = String(val).trim();
  if (!str) return 0;

  // 1. Check for accounting negative notation: (123.45) or (1 500,00 ₽) -> -123.45
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  }

  // 2. Normalize and strip spaces (ordinary space, non-breaking space, etc.)
  str = str.replace(/[\s\u00A0\u2007\u200F\u202F]/g, '');

  // 3. Keep track of negative sign if it exists outside or inside
  if (str.startsWith('-')) {
    isNegative = !isNegative;
    str = str.slice(1);
  } else if (str.startsWith('+')) {
    str = str.slice(1);
  }

  if (str.endsWith('-')) {
    isNegative = !isNegative;
    str = str.slice(0, -1);
  }

  // 4. Keep only digits, comma, dot, minus, plus by stripping other characters
  // This removes currency labels such as руб., руб, р., ₽, $, €, limits alphabets etc.
  str = str.replace(/[^0-9,\.\-\+]/g, '');

  // 5. Convert decimal separators
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    const commaIndex = str.lastIndexOf(',');
    const dotIndex = str.lastIndexOf('.');
    if (commaIndex > dotIndex) {
      // Comma is decimal separator (e.g. 1.234,56), so delete dots, replace comma with dot
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // Dot is decimal separator (e.g. 1,234.56), so delete commas
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    const firstCommaIdx = str.indexOf(',');
    const lastCommaIdx = str.lastIndexOf(',');
    if (firstCommaIdx === lastCommaIdx) {
      // Single comma -> replace with dot
      str = str.replace(/,/g, '.');
    } else {
      // Multiple commas -> treat all except the last as thousands separators
      str = str.slice(0, lastCommaIdx).replace(/,/g, '') + '.' + str.slice(lastCommaIdx + 1);
    }
  } else if (hasDot) {
    const firstDotIdx = str.indexOf('.');
    const lastDotIdx = str.lastIndexOf('.');
    if (firstDotIdx !== lastDotIdx) {
      // Multiple dots -> delete all except the last
      str = str.slice(0, lastDotIdx).replace(/\./g, '') + '.' + str.slice(lastDotIdx + 1);
    }
  }

  // Parse to float
  const num = parseFloat(str);
  if (isNaN(num)) return 0;

  const finalValue = isNegative ? -num : num;
  return parseFloat(finalValue.toFixed(2));
}

// Main logic to parse CSV or Excel data
export function parseUploadedSpreadsheet(
  workbook: XLSX.WorkBook
): { records: RawRecord[]; errors: string[] } {
  const errors: string[] = [];
  const records: RawRecord[] = [];
  
  // Read first sheet
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to JSON array
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
  
  if (rawRows.length === 0) {
    return { records: [], errors: ['Файл пуст или содержит некорректные данные.'] };
  }

  // Determine headers
  const sampleRow = rawRows[0];
  const keys = Object.keys(sampleRow);
  
  // Target columns: «Сумма, Р», «Назначение», «Контрагент», «Комментарий», «Дата»
  const columnMapping: Record<string, string> = {
    sum: '',
    category: '',
    counterparty: '',
    comment: '',
    date: ''
  };

  keys.forEach((k) => {
    let lowerKey = k.toLowerCase().trim();
    // Normalize both ruble sign '₽' and English 'p' to Russian 'р'
    lowerKey = lowerKey.replace(/₽/g, 'р').replace(/p/g, 'р');
    if (lowerKey === 'сумма, р' || lowerKey === 'сумма р' || lowerKey === 'сумма,р' || lowerKey === 'сумма') {
      columnMapping.sum = k;
    } else if (lowerKey === 'назначение' || lowerKey === 'категория') {
      columnMapping.category = k;
    } else if (lowerKey === 'контрагент' || lowerKey === 'клиент' || lowerKey === 'фио') {
      columnMapping.counterparty = k;
    } else if (lowerKey === 'комментарий' || lowerKey === 'инфо' || lowerKey === 'примечание') {
      columnMapping.comment = k;
    } else if (lowerKey === 'дата' || lowerKey === 'время') {
      columnMapping.date = k;
    }
  });

  // Check required columns exactly as per checklist
  const missingColumns: string[] = [];
  if (!columnMapping.sum) missingColumns.push('Сумма, Р');
  if (!columnMapping.category) missingColumns.push('Назначение');
  if (!columnMapping.counterparty) missingColumns.push('Контрагент');
  if (!columnMapping.comment) missingColumns.push('Комментарий');
  if (!columnMapping.date) missingColumns.push('Дата');

  if (missingColumns.length > 0) {
    return {
      records: [],
      errors: [
        `Проверьте названия колонок. Не найдены обязательные колонки: ${missingColumns.join(', ')}.`
      ]
    };
  }

  // Parse lines
  rawRows.forEach((row, index) => {
    const sumVal = parseNumber(row[columnMapping.sum]);
    const catVal = String(row[columnMapping.category] || '').trim();
    const contVal = String(row[columnMapping.counterparty] || '').trim();
    const commVal = String(row[columnMapping.comment] || '').trim();
    const dateRaw = row[columnMapping.date];
    const parsedDate = parseDate(dateRaw);

    // If all essential fields are blank, skip this row
    if (!catVal && !contVal && sumVal === 0) {
      return;
    }

    records.push({
      id: `record_${index}_${Date.now()}`,
      sum: sumVal,
      category: catVal,
      counterparty: contVal,
      comment: commVal,
      date: parsedDate,
      dateStr: String(dateRaw || '').trim(),
      rawIndex: index + 2 // 1-based index + excel header row offset
    });
  });

  return { records, errors };
}

// Smart word-based matching starting from the end of the strings
export function getReverseMatchingScore(srcCategory: string, tgtLabel: string): number {
  const src = normalizeString(srcCategory);
  const tgt = normalizeString(tgtLabel);
  
  if (!src || !tgt) return 0;
  
  // Extract words of length >= 2
  const srcWords = src.split(/[^a-zа-я0-9]+/i).filter(w => w.length >= 2);
  const tgtWords = tgt.split(/[^a-zа-я0-9]+/i).filter(w => w.length >= 2);
  
  if (srcWords.length === 0 || tgtWords.length === 0) return 0;
  
  const revSrc = [...srcWords].reverse();
  const revTgt = [...tgtWords].reverse();
  
  let score = 0;
  let matchesCount = 0;
  
  // Compare right-to-left word alignment
  const minLen = Math.min(revSrc.length, revTgt.length);
  for (let i = 0; i < minLen; i++) {
    const wSrc = revSrc[i];
    const wTgt = revTgt[i];
    
    // Check if close or same
    if (wSrc === wTgt) {
      score += 15; // Perfect aligned match from end
      matchesCount++;
    } else if (wSrc.startsWith(wTgt) || wTgt.startsWith(wSrc) || wSrc.includes(wTgt) || wTgt.includes(wSrc)) {
      if (Math.min(wSrc.length, wTgt.length) >= 3) {
        score += 10; // High-quality aligned match from end
        matchesCount++;
      }
    } else {
      break; // stop counting consecutive aligned suffix match
    }
  }
  
  // Also add weight for word containment (unaligned) from the end of src inside tgt
  for (let i = 0; i < revSrc.length; i++) {
    const wSrc = revSrc[i];
    if (i < minLen && matchesCount > i) {
      // already matched by consecutive suffix comparison
      continue;
    }
    
    // Search if wSrc exists in any of tgtWords
    const found = tgtWords.some(wTgt => {
      if (wSrc === wTgt) return true;
      if (wSrc.startsWith(wTgt) || wTgt.startsWith(wSrc) || wSrc.includes(wTgt) || wTgt.includes(wSrc)) {
        return Math.min(wSrc.length, wTgt.length) >= 3;
      }
      return false;
    });
    
    if (found) {
      score += 4; // general word match
      matchesCount++;
    }
  }
  
  // Also check if the entire tgt is contained in src or vice-versa
  if (src.includes(tgt)) {
    score += 50;
  } else if (tgt.includes(src)) {
    score += 40;
  }
  
  return score;
}

// Find predefined supplier index from original config
export function findPredefinedSupplierIndex(counterparty: string, templateLabels: string[]): number {
  const normCounterparty = normalizeString(counterparty);
  if (!normCounterparty) return -1;
  
  let bestSupplierIdx = -1;
  let maxScore = 0;
  
  for (let idx = 54; idx <= 86; idx++) {
    const label = templateLabels[idx];
    if (!label) continue;
    
    const score = getCounterpartyMatchScore(label, counterparty, "", "");
    if (score > maxScore && score >= 50) {
      maxScore = score;
      bestSupplierIdx = idx;
    }
  }
  return bestSupplierIdx;
}

// Smart logic for categories matching (internal implementation)
function findMatchingRowIndexInternal(
  srcCategory: string,
  srcCounterparty: string,
  report: MetricRow[],
  N: number = 0,
  srcComment: string = "",
  fileName?: string | null
): number {
  // Special file override rule:
  // "Если имя загружаемого файла начинается с "Финансовые_операции_(25", тогда записи у которых в графе "Назначение" стоят слова "Налоги и сборы" учитывать в показателе "Налоги" раздела "Расходы за счёт фондов"
  if (fileName) {
    const fn = fileName.toLowerCase().trim();
    // Normalize spaces/underscores for checking prefix
    const matchesFilePrefix = fn.startsWith("финансовые_операции_(25") || fn.startsWith("финансовые операции (25");
    if (matchesFilePrefix) {
      const normCat = normalizeString(srcCategory);
      if (normCat === "налоги и сборы" || normCat.includes("налоги и сборы")) {
        const taxesIndex = report.findIndex(r => r.label === "Налоги" && r.index === 111 + N);
        if (taxesIndex !== -1) return taxesIndex;

        const fallbackIndex = report.findIndex(r => r.label === "Налоги" && r.index >= 105 + N && r.index <= 111 + N);
        if (fallbackIndex !== -1) return fallbackIndex;
      }
    }
  }

  const normCat = normalizeString(srcCategory);

  // Explicit match for Investors
  if (normCat === "инвесторы" || normCat.includes("инвесторы")) {
    const idx = report.findIndex(r => r.label === "ИНВЕСТОРЫ");
    if (idx !== -1) return idx;
  }

  // Check if category has the word "Фонды" or "ФОНДЫ"
  if (/фонды/i.test(srcCategory)) {
    const parts = srcCategory.split(/фонды/i);
    const afterFunds = parts.slice(1).join('фонды').trim().replace(/^[^a-zа-я0-9]+/i, '').trim();
    if (afterFunds) {
      // Find best match in the range 105 + N to 111 + N
      let bestIdx = -1;
      let maxScore = 0;
      const startIndex = 105 + N;
      const endIndex = 111 + N;
      for (let idx = startIndex; idx <= endIndex; idx++) {
        if (report[idx]) {
          const score = getReverseMatchingScore(afterFunds, report[idx].label);
          if (score > maxScore) {
            maxScore = score;
            bestIdx = idx;
          }
        }
      }
      // Fallback word overlap check
      if (bestIdx === -1 || maxScore === 0) {
        const afterWords = normalizeString(afterFunds).split(/[^a-zа-я0-9]+/i).filter(w => w.length >= 3);
        if (afterWords.length > 0) {
          for (let idx = startIndex; idx <= endIndex; idx++) {
            if (report[idx]) {
              const labelNorm = normalizeString(report[idx].label);
              const matches = afterWords.filter(w => labelNorm.includes(w));
              if (matches.length > maxScore) {
                maxScore = matches.length;
                bestIdx = idx;
              }
            }
          }
        }
      }
      if (bestIdx !== -1 && maxScore > 0) {
        return bestIdx;
      }
    }
  }

  // EXPLICIT SOURCE MATCHES:
  // 0. "2026 Заработная плата персоналу" -> "Зарплата выплаченная"
  if (
    normCat === normalizeString("2026 Заработная плата персоналу") ||
    normCat.includes("2026 заработная плата персоналу") ||
    normCat === normalizeString("2026 Заработная плата // Уборщицы") ||
    normCat.includes("2026 заработная плата // уборщицы") ||
    normCat === normalizeString("2026 Заработная плата // SMM-менеджеры") ||
    normCat.includes("2026 заработная плата // smm-менеджеры") ||
    normCat === normalizeString("2026 Заработная плата // Помощники администратора") ||
    normCat.includes("2026 заработная плата // помощники администратора")
  ) {
    const idx = report.findIndex(r => r.label === "Зарплата выплаченная");
    if (idx !== -1) return idx;
  }

  // 1. "2026 Переменные //Для мастеров..." -> "Для мастеров"
  if (
    normCat === normalizeString("2026 Переменные //Для мастеров (Косметические средства для мастеров - мицеллярная вода/салфетки/ ват диски, палочки и т.д.)") ||
    normCat.includes("для мастеров (косметические средства") ||
    normCat.includes("для мастеров (косметические") ||
    normCat === normalizeString("Для мастеров")
  ) {
    const idx = report.findIndex(r => r.label === "Для мастеров");
    if (idx !== -1) return idx;
  }

  // 2. "2026 Переменные //Сервис для гостей (Вода)" -> "Вода волжанка"
  if (
    normCat === normalizeString("2026 Переменные //Сервис для гостей (Вода)") ||
    normCat.includes("сервис для гостей (вода)") ||
    normCat.includes("вода волжанка")
  ) {
    const idx = report.findIndex(r => r.label === "Вода волжанка");
    if (idx !== -1) return idx;
  }

  // 3. "Прочие расходы" or "Прочие" -> "Прочие" (replaces variables: "Прочие" index 90)
  if (
    normCat === normalizeString("Прочие расходы") ||
    normCat.includes("прочие расходы") ||
    normCat === normalizeString("Прочие")
  ) {
    const idx = report.findIndex(r => r.label === "Прочие");
    if (idx !== -1) return idx;
  }

  // 4. "2026 Жизнеобеспечение салона // Аптечка" -> "Аптечка, лекарства"
  if (
    normCat === normalizeString("2026 Жизнеобеспечение салона // Аптечка") ||
    normCat.includes("2026 жизнеобеспечение салона // аптечка") ||
    normCat.includes("жизнеобеспечение салона // аптечка")
  ) {
    const idx = report.findIndex(r => r.label === "Аптечка, лекарства");
    if (idx !== -1) return idx;
  }

  // NEW RULES FOR SPECIFIC MATCHING:
  // 0. "заработная плата", "аванс" and their abbreviations/typos in Comment -> "Зарплата выплаченная"
  const adminSalaryIndex = report.findIndex(r => r.label === "Зарплата выплаченная");
  if (adminSalaryIndex !== -1) {
    const isRaznorabochiy = (text: string): boolean => {
      if (!text) return false;
      const t = text.toLowerCase();
      return t.includes("разнорабоч");
    };

    const hasRaznorabochiy =
      isRaznorabochiy(srcCategory) ||
      isRaznorabochiy(srcCounterparty) ||
      isRaznorabochiy(srcComment);

    if (!hasRaznorabochiy) {
      const isSalaryAndAdvanceComment = (text: string): boolean => {
        if (!text) return false;
        const t = text.toLowerCase().trim();
        
        // Split text on non-alphanumeric (including Cyrillic) to extract clean words
        const words = t.split(/[^а-яёa-z0-9-]+/iu).filter(w => w.length > 0);

        // Check for words starting with salary variations/abbreviations
        const hasSalaryKeyword = words.some(w => 
          w.startsWith("заработная") || 
          w.startsWith("заработн") || 
          w.startsWith("зараб") || 
          w.startsWith("зарплата") || 
          w.startsWith("зарплат") || 
          w.startsWith("зарпл") || 
          w.startsWith("аванс")
        );

        // Check for "зп" word or standard written abbreviations
        const hasZpAbbreviation = 
          words.includes("зп") ||
          t.includes("з/п") ||
          t.includes("з.п.") ||
          t.includes("з-п") ||
          /(\s|^)з\s+п(\s|$)/iu.test(t);

        if (
          hasSalaryKeyword ||
          hasZpAbbreviation ||
          t.includes("оплата труда")
        ) {
          return true;
        }

        // Shorthand/typo support: "за [Имя/Фамилия] [месяц]" which represents "зп [Фамилия] [месяц]"
        if (/\bза\s+/ui.test(t)) {
          const nonSalaryKeywords = [
            "связь", "интернет", "аренд", "воду", "электро", "свет", "коммунал",
            "продвижен", "реклам", "авито", "лиценз", "доставк", "поставк", "товар",
            "материал", "кофе", "молок", "сахар", "сироп", "вывоз", "мусор", "охрану", "хостинг"
          ];
          if (nonSalaryKeywords.some(kw => t.includes(kw))) {
            return false;
          }

          const months = [
            "январ", "феврал", "март", "апрел", "ма", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"
          ];
          const hasMonth = months.some(m => t.includes(m));

          const words = t.split(/[^a-zа-яё0-9-]+/ui).filter(w => w.length > 0);
          const zaIndex = words.indexOf("за");
          if (zaIndex !== -1 && zaIndex < words.length - 1) {
            const nextWord = words[zaIndex + 1];
            const commonExclusions = [
              "весь", "прошлый", "тот", "этот", "один", "два", "три", "день", "две", "всех", "все", "какой-то"
            ];
            
            const looksLikeSurnameOrName = 
              nextWord.length >= 3 &&
              !commonExclusions.includes(nextWord) &&
              (
                /[а-яё]+(ова|ева|ина|ову|еву|ину|ов|ев|ин|ой|ым|их|ых|юк|ко)$/iu.test(nextWord) ||
                hasMonth
              );

            if (looksLikeSurnameOrName) {
              return true;
            }
          }

          if (hasMonth && t.includes("за ")) {
            return true;
          }
        }
        return false;
      };

      if (isSalaryAndAdvanceComment(srcComment)) {
        return adminSalaryIndex;
      }
    }
  }

  // 1. "молоко" in category, counterparty or comment -> Milk index
  const milkIndex = report.findIndex(r => r.label === "Молоко (обычное/альтернативное)");
  if (milkIndex !== -1) {
    const isMilk = (text: string) => {
      if (!text) return false;
      const t = text.toLowerCase();
      return t.includes("молоко") || t.includes("молок");
    };
    if (
      isMilk(srcCategory) || 
      isMilk(srcCounterparty) || 
      isMilk(srcComment)
    ) {
      return milkIndex;
    }
  }

  // 2. "сахар" or "сироп" in category, counterparty or comment -> Sugar / Syrups index
  const sugarIndex = report.findIndex(r => r.label === "Сахар / Сиропы");
  if (sugarIndex !== -1) {
    const isSugar = (text: string) => {
      if (!text) return false;
      const t = text.toLowerCase();
      return t.includes("сахар") || t.includes("сироп");
    };
    if (
      isSugar(srcCategory) || 
      isSugar(srcCounterparty) || 
      isSugar(srcComment)
    ) {
      return sugarIndex;
    }
  }

  // 3. Recruitment keywords check
  const recruitmentIndex = report.findIndex(r => r.label === "Привлечения новых сотрудников (оплата объявлений и др. расходы)");

  const hasRecruitmentSpecificKeywords = (text: string) => {
    if (!text) return false;
    const t = text.toLowerCase();
    return (
      t.includes("объявл") ||
      t.includes("ваканс") ||
      t.includes("headhunter") ||
      /\bhh\b/i.test(t) ||
      /\bхх\b/i.test(t)
    );
  };

  const hasAvito = (text: string) => {
    if (!text) return false;
    const t = text.toLowerCase();
    return t.includes("авито") || t.includes("avito");
  };

  const recordHasRecruitmentKeywords = 
    hasRecruitmentSpecificKeywords(srcCategory) || 
    hasRecruitmentSpecificKeywords(srcCounterparty) || 
    hasRecruitmentSpecificKeywords(srcComment) ||
    hasAvito(srcCategory) ||
    hasAvito(srcCounterparty) ||
    hasAvito(srcComment);

  const isExplicitRecruitment = 
    hasRecruitmentSpecificKeywords(srcCategory) || 
    hasRecruitmentSpecificKeywords(srcCounterparty) || 
    hasRecruitmentSpecificKeywords(srcComment) ||
    ((hasAvito(srcCategory) || hasAvito(srcCounterparty) || hasAvito(srcComment)) && 
     !(srcCategory.toLowerCase().includes("материал") || srcCategory.toLowerCase().includes("товар") || srcCategory.toLowerCase().includes("оборудован") || srcCategory.toLowerCase().includes("мебель")));

  if (recruitmentIndex !== -1 && isExplicitRecruitment) {
    return recruitmentIndex;
  }

  // 00. Force match to "Выплаты учредителям" if it contains "Учредители" or "ФО"
  const foundersIndex = report.findIndex(r => r.label === "Выплаты учредителям");
  if (foundersIndex !== -1) {
    const isFoundersPayment = (text: string) => {
      if (!text) return false;
      const t = text.toLowerCase();
      return (
        t.includes("учредител") ||
        /\bфо\b/iu.test(t) ||
        /\bfo\b/iu.test(t) ||
        text.includes("ФО")
      );
    };
    if (
      isFoundersPayment(srcCategory) || 
      isFoundersPayment(srcCounterparty) || 
      isFoundersPayment(srcComment)
    ) {
      return foundersIndex;
    }
  }

  // 0. Force match to "Коммунальные услуги" or "Коммунальные платежи" if it contains utility-related labels or abbreviations
  const commIndex = report.findIndex(r => r.label === "Коммунальные услуги" || r.label === "Коммунальные платежи");
  if (commIndex !== -1) {
    const isCommUtility = (text: string) => {
      if (!text) return false;
      const t = text.toLowerCase();
      return (
        t.includes("электроэнерг") ||
        t.includes("электроэн") ||
        t.includes("эл.энерг") ||
        t.includes("эл-энерг") ||
        t.includes("жкх") ||
        t.includes("жку") ||
        t.includes("энергосбыт") ||
        t.includes("жк-услуг") ||
        t.includes("коммунал") ||
        t.includes("отоплен") ||
        t.includes("водоснабж") ||
        t.includes("водоканал") ||
        t.includes("горкомхоз") ||
        /\bжкх\b/i.test(t) ||
        /\bжку\b/i.test(t) ||
        /\bэл\.?\s*эн\.?\b/i.test(t) ||
        /\bэл-эн\b/i.test(t)
      );
    };
    
    if (
      isCommUtility(srcCategory) || 
      isCommUtility(srcCounterparty) || 
      isCommUtility(srcComment)
    ) {
      return commIndex;
    }
  }

  const normCategory = normalizeString(srcCategory);
  if (!normCategory) return -1;
  
  // Rule: "для категорий «Закупка материалов» и «Закупка товаров» — дополнительная группировка по «Контрагенту»."
  const isProcurement = 
    normCategory.includes("закупка материалов") || 
    normCategory.includes("закупка товаров") ||
    normCategory.includes("закупка") ||
    normCategory.includes("материалы") ||
    normCategory.includes("товары");
    
  if (isProcurement) {
    const normCounterparty = normalizeString(srcCounterparty);
    if (normCounterparty) {
      // Keep supplier rows matching using our deep scoring engine
      let bestSupplierIdx = -1;
      let maxScore = 0;
      
      const supplierEndIndex = 86 + N;
      for (let idx = 54; idx <= supplierEndIndex; idx++) {
        const label = report[idx]?.label;
        if (!label) continue;
        
        const score = getCounterpartyMatchScore(label, srcCounterparty, srcCategory, srcComment);
        if (score > maxScore && score >= 50) {
          maxScore = score;
          bestSupplierIdx = idx;
        }
      }
      
      if (bestSupplierIdx !== -1) {
        return bestSupplierIdx;
      }
    }
  }
  
  // Standard matching: match row that scores highest using word-by-word reverse matcher
  let bestIdx = -1;
  let maxScore = 0;
  
  for (let idx = 0; idx < report.length; idx++) {
    const r = report[idx];
    if (r.type === 'header' || r.type === 'formula' || r.type === 'section') {
      continue;
    }
    
    const score = getReverseMatchingScore(srcCategory, r.label);
    if (score > maxScore) {
      maxScore = score;
      bestIdx = idx;
    }
  }
  
  if (bestIdx !== -1 && maxScore >= 4) {
    if (bestIdx === recruitmentIndex && !recordHasRecruitmentKeywords) {
      return -1;
    }
    return bestIdx;
  }
  
  return -1;
}

// Public wrapper implementing two-pass mapping:
// 1. First analyze only based on "Назначение" column (srcCategory) and "Контрагент" (srcCounterparty).
// 2. Content of "Комментарий" (srcComment) is used ONLY if it's impossible to uniquely map based on "Назначение".
export function findMatchingRowIndex(
  srcCategory: string,
  srcCounterparty: string,
  report: MetricRow[],
  N: number = 0,
  srcComment: string = "",
  fileName?: string | null
): number {
  // First pass: match with no comment
  let firstPassIdx = findMatchingRowIndexInternal(srcCategory, srcCounterparty, report, N, "", fileName);
  if (firstPassIdx !== -1) {
    if (report[firstPassIdx]?.label === "Зарплата административного персонала") {
      const backupIdx = report.findIndex(r => r.label === "Зарплата выплаченная");
      if (backupIdx !== -1) return backupIdx;
    }
    return firstPassIdx;
  }
  
  // Second pass: fallback to checking "Комментарий"
  const secondPassIdx = findMatchingRowIndexInternal(srcCategory, srcCounterparty, report, N, srcComment, fileName);
  if (secondPassIdx !== -1 && report[secondPassIdx]?.label === "Зарплата административного персонала") {
    const backupIdx = report.findIndex(r => r.label === "Зарплата выплаченная");
    if (backupIdx !== -1) return backupIdx;
  }
  return secondPassIdx;
}

// Compute all formulas on rows
export function calculateReportFormulas(rows: MetricRow[], N: number = 0): MetricRow[] {
  const result = [...rows];
  
  const getNewIndex = (origIdx: number) => {
    return origIdx < 87 ? origIdx : origIdx + N;
  };

  const getValue = (origIdx: number) => {
    const idx = getNewIndex(origIdx);
    return result[idx]?.value || 0;
  };

  const setValue = (origIdx: number, val: number) => {
    const idx = getNewIndex(origIdx);
    if (result[idx]) {
      result[idx].value = parseFloat(val.toFixed(2));
    }
  };

  // Helper: sum elements between indexes (inclusive) using original index mapping
  const sumRangeOrig = (origStart: number, origEnd: number) => {
    let sum = 0;
    const start = getNewIndex(origStart);
    const end = getNewIndex(origEnd);
    for (let i = start; i <= end; i++) {
      if (result[i] && result[i].type === 'data') {
        sum += result[i].value;
      }
    }
    return sum;
  };

  // Helper: sum all suppliers (including dynamic ones)
  const sumAllSuppliers = () => {
    let sum = 0;
    const start = 54;
    const end = 86 + N;
    for (let i = start; i <= end; i++) {
      if (result[i] && result[i].type === 'data') {
        sum += result[i].value;
      }
    }
    return sum;
  };

  // 1. Выручка общая (index 0) = sum of 1..6 (excluding index 7 ИНВЕСТОРЫ)
  setValue(0, sumRangeOrig(1, 6));

  // 1.1 Группировочные показатели под Переменными расходами
  setValue(11, sumRangeOrig(12, 20)); // 2026 Жизнеобеспечение салона
  setValue(23, sumRangeOrig(24, 33)); // Сервис для гостей

  // 2. Расходы переменные (index 9) = sum of 10..35 (“Переменные// Возвраты”)
  setValue(9, sumRangeOrig(10, 35));

  // 3. Расходы постоянные (index 36) = sum of 37..52
  setValue(36, sumRangeOrig(37, 52));

  // 4. Поставщики (index 53) = sum of 54..86 + dynamic ones
  setValue(53, sumAllSuppliers());

  // 5. Расходы на заработную плату (index 87) = sum of 88..89 (administrative + masters salaries)
  setValue(87, sumRangeOrig(88, 89));

  // 6. Расходы (index 8) = Переменные(9) + Постоянные(36) + Поставщики(53) + ЗП(87) + Прочие(91) + Налоги(92)
  setValue(8, getValue(9) + getValue(36) + getValue(53) + getValue(87) + getValue(91) + getValue(92));

  // 7. Прибыль теоретическая (index 93) = Выручка общая(0) + Расходы(8)
  setValue(93, getValue(0) + getValue(8));

  // 7.1 Отчисления в фонды (index 103) = (Прибыль теоретическая(93) * 0.2 + 70000) * -1 (только при положительной Прибыли теоретической)
  const theoreticalProfitVal = getValue(93);
  if (theoreticalProfitVal > 0) {
    setValue(103, (theoreticalProfitVal * 0.2 + 70000) * -1);
  } else {
    setValue(103, 0);
  }

  // 8. Дополнительные расходы (index 94) = sum of 95..103
  setValue(94, sumRangeOrig(95, 103));

  // 9. Расходы за счёт фондов (index 104) = sum of 105..111
  setValue(104, sumRangeOrig(105, 111));

  // 10. ЧИСТАЯ ПРИБЫЛЬ (index 112) = Теоретическая(93) + Отчисления в фонды(103)
  setValue(112, getValue(93) + getValue(103));

  // 11. Рентабельность (index 113) = Чистая прибыль / Расходы
  const expenses = Math.abs(getValue(8));
  const netProfit = getValue(112);
  setValue(113, expenses > 0 ? (netProfit / expenses) * 100 : 0);

  // 12. ПРИБЫЛЬ — доп. расходы (index 114) = 112 + 94
  setValue(114, getValue(112) + getValue(94));

  // 12.5 ФОНДЫ section dynamic calculations as per user alignment rules:
  // - "Поступления за месяц" (118) равен показателю "Отчисления в фонды" (103)
  setValue(118, Math.abs(getValue(103)));

  // - "Уплата налогов" (119) равен показателю "Налоги" (111)
  setValue(119, getValue(111));

  // - "Обустройство и оборудование салона" (120) равен сумме показателей "Жизнеобеспечение (Оборудование, электроника и обустройство зон мастеров)" (109) и "Жизнеобеспечение (Оборудование, электроника и обустройство салона)" (110)
  setValue(120, getValue(109) + getValue(110));

  // - "Корпоративная деятельность" (121) равен показателю "Корпоративная деятельность (списания по кассе фонда)" (105)
  setValue(121, getValue(105));

  // - "Обучения и доп. премии" (122) равен сумме показателей "Обучения персонала (оплаты с фондов)" (108) и "Корпоративные премии (списание по кассе фонда)" (106)
  setValue(122, getValue(108) + getValue(106));

  // - "Реклама и развитие" (124) равен показателю "Реклама, маркетинг, таргет" (107)
  setValue(124, getValue(107));

  // 13. ФОНДЫ - Расходы за месяц (index 126) = sum of 119..125
  setValue(126, sumRangeOrig(119, 125));

  // 14. ФОНДЫ - Сальдо на конец периода (index 127) = Сальдо на начало(117) + Поступления(118) - Расходы за месяц(126)
  // We subtract the absolute value of expenses to guarantee correct sign operations regardless of how sumRangeOrig is computed
  setValue(127, getValue(117) + getValue(118) - Math.abs(getValue(126)));

  // 15. Синхронизация фондовой прибыли (index 128, 129) with core profit
  setValue(128, getValue(112)); // Прибыль
  setValue(129, getValue(113)); // Рентабельность

  // 16. Распределение прибыли - сумма (index 134) = Ренат(131) + Надежда(132) + L.I.Q(133)
  setValue(134, getValue(131) + getValue(132) + getValue(133));

  return result;
}

// Compiles financial report from raw records
export function generateFinancialReport(
  records: RawRecord[],
  userOverrides: Record<number, number> = {},
  categoryMappings: Record<string, string> = {},
  transactionMappings: Record<string, string> = {},
  fileName?: string | null
): { report: MetricRow[]; extraRows: { label: string; value: number; transactions: RawRecord[] }[] } {
  const unmatchedCategoriesMap: Record<string, number> = {};

  // Filter out transfers ("Перевод средств") which do not participate in report generation
  const filteredRecords = records.filter(rec => {
    const catLower = (rec.category || '').trim().toLowerCase();
    return catLower !== 'перевод средств';
  });

  // Find dynamic suppliers from raw records (procurements with non-matching suppliers)
  const templateSupplierLabels = FINANCIAL_TEMPLATE.slice(54, 87).map(r => r.label);
  const dynamicSuppliersSet = new Set<string>();

  filteredRecords.forEach((rec) => {
    const normCategory = normalizeString(rec.category);
    const isProcurement = 
      normCategory.includes("закупка материалов") || 
      normCategory.includes("закупка товаров") ||
      normCategory.includes("закупка") ||
      normCategory.includes("материалы") ||
      normCategory.includes("товары");
      
    if (isProcurement && rec.counterparty && rec.counterparty.trim()) {
      const parentMatchedIdx = findPredefinedSupplierIndex(rec.counterparty, FINANCIAL_TEMPLATE.map(r => r.label));
      if (parentMatchedIdx === -1) {
        // Double check already added list
        const normNew = normalizeString(rec.counterparty);
        let alreadyAdded = false;
        for (const existing of dynamicSuppliersSet) {
          const normExt = normalizeString(existing);
          if (normNew === normExt || (normNew.length >= 3 && normExt.includes(normNew)) || (normExt.length >= 3 && normNew.includes(normExt))) {
            alreadyAdded = true;
            break;
          }
        }
        if (!alreadyAdded) {
          dynamicSuppliersSet.add(rec.counterparty.trim());
        }
      }
    }
  });

  const dynamicSuppliers = Array.from(dynamicSuppliersSet).sort((a, b) => a.localeCompare(b));
  const N = dynamicSuppliers.length;

  // 1. Build dynamic template rows
  const report: MetricRow[] = [];
  
  // Rows 0 to 86 remain unchanged
  for (let idx = 0; idx <= 86; idx++) {
    report.push({
      ...FINANCIAL_TEMPLATE[idx],
      value: 0,
      transactions: []
    });
  }
  
  // Dynamic new suppliers inserted at 87 to 87 + N - 1
  dynamicSuppliers.forEach((name, i) => {
    report.push({
      index: 87 + i,
      label: name,
      type: 'data',
      value: 0,
      transactions: []
    });
  });
  
  // Remaining rows shifted by N
  for (let idx = 87; idx < FINANCIAL_TEMPLATE.length; idx++) {
    report.push({
      ...FINANCIAL_TEMPLATE[idx],
      index: idx + N,
      value: 0,
      transactions: []
    });
  }

  // 2. Loop through records and aggregate data
  const unmatchedCategoriesEntries: Record<string, { value: number; transactions: RawRecord[] }> = {};

  filteredRecords.forEach((rec) => {
    let matchedIdx = -1;

    // 1. Check individual transaction manual mappings from user
    if (rec.id && transactionMappings && transactionMappings[rec.id]) {
      const targetLabel = transactionMappings[rec.id];
      matchedIdx = report.findIndex(r => r.label === targetLabel);
    }

    // 2. Check category manual mappings from user
    const cleanCat = rec.category ? rec.category.trim() : 'Прочие (Нераспознанные)';
    if (matchedIdx === -1 && categoryMappings && categoryMappings[cleanCat]) {
      const targetLabel = categoryMappings[cleanCat];
      matchedIdx = report.findIndex(r => r.label === targetLabel);
    }

    // 3. Fallback to automatic heuristic rules matcher
    if (matchedIdx === -1) {
      matchedIdx = findMatchingRowIndex(rec.category, rec.counterparty, report, N, rec.comment, fileName);
    }

    if (matchedIdx !== -1) {
      if (report[matchedIdx].type === 'data') {
        report[matchedIdx].value += rec.sum;
      }
      if (!report[matchedIdx].transactions) {
        report[matchedIdx].transactions = [];
      }
      report[matchedIdx].transactions.push(rec);
    } else {
      // Collect unmatched entries
      if (!unmatchedCategoriesEntries[cleanCat]) {
        unmatchedCategoriesEntries[cleanCat] = { value: 0, transactions: [] };
      }
      unmatchedCategoriesEntries[cleanCat].value += rec.sum;
      unmatchedCategoriesEntries[cleanCat].transactions.push(rec);
    }
  });

  // 3. Apply custom user overrides if any BEFORE formula calculations
  Object.keys(userOverrides).forEach((key) => {
    // First try to match by exact label name (extremely robust against shift sizing N)
    const rowByLabel = report.find(r => r.label === key);
    if (rowByLabel) {
      let val = userOverrides[key as any];
      if (key === "Зарплата административного персонала" || key === "Зарплата мастеров") {
        val = -Math.abs(val);
      }
      rowByLabel.value = val;
      rowByLabel.isCustomOverride = true;
      return;
    }

    // Fallback to match by numeric index
    const idx = parseInt(key, 10);
    if (!isNaN(idx) && report[idx]) {
      let val = userOverrides[idx];
      const label = report[idx].label;
      if (label === "Зарплата административного персонала" || label === "Зарплата мастеров") {
        val = -Math.abs(val);
      }
      report[idx].value = val;
      report[idx].isCustomOverride = true;
    }
  });

  // 4. Calculate formulas
  const finalReport = calculateReportFormulas(report, N);

  // 5. Format extra categories to return
  const extraRows = Object.entries(unmatchedCategoriesEntries).map(([label, entry]) => ({
    label,
    value: parseFloat(entry.value.toFixed(2)),
    transactions: entry.transactions
  }));

  return { report: finalReport, extraRows };
}

// Core salary period splitting logic
export function processSalaryPayments(
  records: RawRecord[],
  cutoffDate: Date | null
): { employees: SalaryEmployee[]; metrics: SalaryProcessingMetrics } {
  const resultEmployees: Record<string, { past: number; current: number }> = {};
  
  let totalCount = records.length;
  let matchingSalaryCount = 0;
  let pastPeriodCount = 0;
  let reportPeriodCount = 0;

  // Keywords for "Комментарий" column filter
  const salaryKeywords = ['зарплата', 'заработная', 'зп', 'з.п.', 'з п'];

  records.forEach((rec) => {
    const normCategory = rec.category.toLowerCase();
    
    // Condition to qualify: "Зарплата" or "Заработная" in Назначение
    const isSalaryCategory = normCategory.includes('зарплата') || normCategory.includes('заработная');
    
    if (!isSalaryCategory) {
      return; // Skip non-salary records
    }
    
    matchingSalaryCount++;
    const normComment = rec.comment.toLowerCase();
    
    // Check if commentator contains keywords
    const hasSalaryKeyword = salaryKeywords.some((keyword) => normComment.includes(keyword));
    
    let empName = 'Неизвестный сотрудник';
    if (rec.counterparty && rec.counterparty.trim()) {
      empName = rec.counterparty.trim();
    } else if (rec.category && rec.category.trim()) {
      const cat = rec.category;
      if (cat.includes('//')) {
        const parts = cat.split('//');
        if (parts[1] && parts[1].trim()) {
          empName = parts[1].trim();
        } else {
          empName = parts[0].trim();
        }
      } else if (cat.includes('/')) {
        const parts = cat.split('/');
        if (parts[1] && parts[1].trim()) {
          empName = parts[1].trim();
        } else {
          empName = cat.trim();
        }
      } else {
        empName = cat.trim();
      }
    }
    
    if (!resultEmployees[empName]) {
      resultEmployees[empName] = { past: 0, current: 0 };
    }

    if (!hasSalaryKeyword) {
      // Step 1: No keywords -> goes straight into the current (reporting) period
      resultEmployees[empName].current += rec.sum;
      reportPeriodCount++;
    } else {
      // Step 2: Date breakdown based on cutoff Date
      if (cutoffDate && rec.date) {
        if (rec.date < cutoffDate) {
          resultEmployees[empName].past += rec.sum;
          pastPeriodCount++;
        } else {
          resultEmployees[empName].current += rec.sum;
          reportPeriodCount++;
        }
      } else {
        // Fallback: If no cutoff date is provided yet (or no date found on row), assume current period
        resultEmployees[empName].current += rec.sum;
        reportPeriodCount++;
      }
    }
  });

  // Map to sorted SalaryEmployee structures
  const employees: SalaryEmployee[] = Object.entries(resultEmployees).map(([fio, sums]) => ({
    fio,
    pastPeriodSum: parseFloat(sums.past.toFixed(2)),
    reportPeriodSum: parseFloat(sums.current.toFixed(2)),
    totalSum: parseFloat((sums.past + sums.current).toFixed(2))
  })).sort((a, b) => a.fio.localeCompare(b.fio));

  return {
    employees,
    metrics: {
      totalCount,
      matchingSalaryCount,
      pastPeriodCount,
      reportPeriodCount
    }
  };
}

// Generate Financial Report Spreadsheet
export function downloadFinancialSpreadsheet(
  report: MetricRow[],
  extraRows: { label: string; value: number }[]
): void {
  const wb = XLSX.utils.book_new();
  
  // Format rows data
  const data = report.map((r) => ({
    'Показатели': r.label,
    'Сумма': r.value
  }));

  // Append unmatched additional rows at the bottom
  if (extraRows.length > 0) {
    data.push({ 'Показатели': '--- ДОПОЛНИТЕЛЬНЫЕ НЕРАСПРЕДЕЛЕННЫЕ СТРОКИ ---', 'Сумма': 0 });
    extraRows.forEach((row) => {
      data.push({
        'Показатели': row.label,
        'Сумма': row.value
      });
    });
  }

  const ws = XLSX.utils.json_to_sheet(data);

  // Set widths for neat display
  const colWidths = [{ wch: 70 }, { wch: 15 }];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Финансовый Отчет");
  
  // Generate download
  XLSX.writeFile(wb, "Финансовый отчет.xlsx");
}

// Generate Salary Payments Spreadsheet
export function downloadSalarySpreadsheet(employees: SalaryEmployee[]): void {
  const wb = XLSX.utils.book_new();

  const data = employees.map((emp) => ({
    'ФИО': emp.fio,
    'Выплачено за прошлый период': emp.pastPeriodSum,
    'Выплачено за отчётный период': emp.reportPeriodSum,
    'Итого выплат': emp.totalSum
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Set widths for neat display
  const colWidths = [{ wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 20 }];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Зарплатные выплаты");

  XLSX.writeFile(wb, "Зарплатные выплаты.xlsx");
}
