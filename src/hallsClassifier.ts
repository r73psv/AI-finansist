import { normalizeString } from './processingEngine';

export const HALL_NAMES = [
  'Зал колористики/парикмахеры',
  'Зал макияжей и укладок',
  'Зал ногтевого сервиса',
  'Зал бровей',
  'Мужской зал',
  'Прочие услуги'
] as const;

export type HallName = typeof HALL_NAMES[number];

// Explicit exact mappings based on provided salon schedule distribution
const EXACT_HALL_MAP: Record<string, HallName> = {
  // --- ЗАЛ МАКИЯЖЕЙ И УКЛАДОК ---
  'макияж невесты': 'Зал макияжей и укладок',
  'макияж вечерний': 'Зал макияжей и укладок',
  'макияж вечерний / никах': 'Зал макияжей и укладок',
  'макияж на выпускной': 'Зал макияжей и укладок',
  'макияж на выпускной школьный, новый год, грим': 'Зал макияжей и укладок',
  'экспресс-макияж / мужской макияж/ детский макияж': 'Зал макияжей и укладок',
  'макияж фото': 'Зал макияжей и укладок',
  'выезд на дом, в отель': 'Зал макияжей и укладок',
  'обучение внутри салона для мастеров': 'Зал макияжей и укладок',
  'разбор косметички': 'Зал макияжей и укладок',
  'выезд с клиентом для подбора косметики': 'Зал макияжей и укладок',
  'прическа невесты': 'Зал макияжей и укладок',
  'прическа': 'Зал макияжей и укладок',
  'укладка вечерняя': 'Зал макияжей и укладок',
  'укладка на выпускной вечер/новый год': 'Зал макияжей и укладок',
  'укладка афрокудри/плетение кос из канекалона': 'Зал макияжей и укладок',
  'укладка афрокудри/плетение из канеколона': 'Зал макияжей и укладок',
  'укладка на брашинг + спа g-prof': 'Зал макияжей и укладок',
  'укладка на dyson + спа g-prof': 'Зал макияжей и укладок',
  'укладка на брашинг + спа': 'Зал макияжей и укладок',
  'выпрямление волос stimpod': 'Зал макияжей и укладок',
  'выпрямление волос steampod': 'Зал макияжей и укладок',
  'выпрямление волос с steampod / стимпод': 'Зал макияжей и укладок',
  'выпрямление волос steampod / стимпод с мытьем': 'Зал макияжей и укладок',
  'индивидуальный курс сам себе стилист': 'Зал макияжей и укладок',

  // --- ЗАЛ НОГТЕВОГО СЕРВИСА ---
  'мужской маникюр': 'Зал ногтевого сервиса',
  'lux маникюр': 'Зал ногтевого сервиса',
  'японский маникюр': 'Зал ногтевого сервиса',
  'глянцевание': 'Зал ногтевого сервиса',
  'глянцевание (полировка ногтей)': 'Зал ногтевого сервиса',
  'комплексный спа уход для рук': 'Зал ногтевого сервиса',
  'ibx': 'Зал ногтевого сервиса',
  'ibx (ай би икс)': 'Зал ногтевого сервиса',
  'маникюр + покрытие прозрачным лаком': 'Зал ногтевого сервиса',
  'наращивание 1 ногтя': 'Зал ногтевого сервиса',
  'дизайн френч/втирка': 'Зал ногтевого сервиса',
  'дизайн френч': 'Зал ногтевого сервиса',
  'легкий дизайн одного ногтя': 'Зал ногтевого сервиса',
  'сложный дизайн одного ногтя': 'Зал ногтевого сервиса',
  'очень сложный дизайн одного ногтя': 'Зал ногтевого сервиса',
  'ремонт одного ногтя': 'Зал ногтевого сервиса',
  'снятие гель-лака': 'Зал ногтевого сервиса',
  'экспресс восстановление ногтей маслом монарды': 'Зал ногтевого сервиса',
  'детский европейский маникюр': 'Зал ногтевого сервиса',
  'педикюр пальцев': 'Зал ногтевого сервиса',
  'педикюр полный': 'Зал ногтевого сервиса',
  'мужской полный педикюр': 'Зал ногтевого сервиса',
  'японский педикюр': 'Зал ногтевого сервиса',
  'комбинированный/аппаратный маникюр': 'Зал ногтевого сервиса',
  'полный педикюр': 'Зал ногтевого сервиса',
  'снятие ногтей': 'Зал ногтевого сервиса',

  // --- ЗАЛ БРОВЕЙ ---
  'ботокс ресниц': 'Зал бровей',
  'депиляция верхней губы воском': 'Зал бровей',
  'долговременная укладка бровей': 'Зал бровей',
  'коррекция бровей пинцетом/воском': 'Зал бровей',
  'коррекция воском (нос)': 'Зал бровей',
  'окрашивание бровей краской': 'Зал бровей',
  'окрашивание бровей хной': 'Зал бровей',
  'окрашивание ресниц': 'Зал бровей',
  'окрашивание ресниц краской': 'Зал бровей',
  'оформление бровей': 'Зал бровей',
  'снятие нарощенных ресниц': 'Зал бровей',
  'счастье для бровей': 'Зал бровей',
  'ламинирование ресниц': 'Зал бровей',
  'brow set': 'Зал бровей',
  'осветление бровей': 'Зал бровей',

  // --- МУЖСКОЙ ЗАЛ ---
  'коррекция воском нос/уши/межбровье': 'Мужской зал',
  'детская стрижка (мальчики от 3,5 до 10 лет)': 'Мужской зал',
  'стрижка мужская американ крю (american crew)': 'Мужской зал',
  'стрижка детская (мальчики от 7 до 10 лет)': 'Мужской зал',
  'детская стрижка (мальчики от 3-х лет до 10 лет)': 'Мужской зал',
  'укладка для мужчин укладка без мытья головы': 'Мужской зал',
  'коррекция мужской стрижки': 'Мужской зал',
  'бритье головы': 'Мужской зал',
  'укладка для мужчин с мытьем и массажем головы': 'Мужской зал',
  'оформление бороды': 'Мужской зал',
  'контур/окантовка бороды/головы': 'Мужской зал',
  'детская стрижка (мальчики от 4 до 7 лет)': 'Мужской зал',
  'камуфляж бороды американ крю': 'Мужской зал',
  'камуфляж бороды american crew': 'Мужской зал',
  'light тонировка мужская американ крю': 'Мужской зал',
  'стрижка мужская мастер-универсал': 'Мужской зал',
  'стрижка мужская барберы': 'Мужской зал',
  'мужская спа - укладка': 'Мужской зал',
  'мужская укладка без мытья головы': 'Мужской зал',
  'мужское осветление (головы или бороды)': 'Мужской зал'
};

/**
 * Classifies any given service name into its appropriate hall.
 * Uses exact match dictionary first, then intelligent keyword & contextual heuristics.
 */
export function classifyServiceHall(serviceName: string | null | undefined): HallName {
  if (!serviceName) return 'Прочие услуги';

  const norm = normalizeString(serviceName);
  if (!norm) return 'Прочие услуги';

  // 1. Exact match dictionary lookup
  if (EXACT_HALL_MAP[norm]) {
    return EXACT_HALL_MAP[norm];
  }

  // Check partial exact entries
  for (const [key, hall] of Object.entries(EXACT_HALL_MAP)) {
    if (norm === key || norm.startsWith(key) || key.startsWith(norm)) {
      return hall;
    }
  }

  // 2. Rule: Зал бровей (Brows, lashes, upper lip waxing)
  if (
    norm.includes('бров') ||
    norm.includes('ресниц') ||
    norm.includes('brow') ||
    norm.includes('депиляция верхней губы') ||
    norm.includes('губы воском') ||
    norm.includes('ламинирование ресниц') ||
    norm.includes('ботокс ресниц')
  ) {
    // If specifically men's brow correction from men's list
    if (norm.includes('мужская коррекция бровей') && (norm.includes('barber') || norm.includes('барбер'))) {
      return 'Мужской зал';
    }
    return 'Зал бровей';
  }

  // 3. Rule: Зал ногтевого сервиса (Nails, manicure, pedicure, podiatry)
  if (
    norm.includes('маникюр') ||
    norm.includes('педикюр') ||
    norm.includes('ногт') ||
    norm.includes('ногот') ||
    norm.includes('гель-лак') ||
    norm.includes('гель лак') ||
    norm.includes('ibx') ||
    norm.includes('втирк') ||
    norm.includes('френч') ||
    norm.includes('монарда') ||
    norm.includes('монарды') ||
    norm.includes('полировка ногтей') ||
    norm.includes('глянцевание') ||
    (norm.includes('la sultan de saba') && (norm.includes('рук') || norm.includes('ног'))) ||
    (norm.includes('спа уход') && (norm.includes('рук') || norm.includes('ног')))
  ) {
    return 'Зал ногтевого сервиса';
  }

  // 4. Rule: Мужской зал (Barbershop, men's beard, shaving, American Crew, boys haircuts)
  if (
    norm.includes('american crew') ||
    norm.includes('американ крю') ||
    norm.includes('бород') ||
    norm.includes('бритье') ||
    norm.includes('бритьё') ||
    norm.includes('барбер') ||
    norm.includes('окантовка') ||
    norm.includes('укладка для мужчин') ||
    norm.includes('мужская стрижка') ||
    norm.includes('стрижка мужская') ||
    norm.includes('мужское осветление') ||
    norm.includes('мужская укладка') ||
    norm.includes('мужская спа') ||
    norm.includes('камуфляж седины') ||
    (norm.includes('мальчик') && norm.includes('стрижка')) ||
    (norm.includes('детская стрижка') && norm.includes('мальчик')) ||
    norm.includes('нос/уши/межбровье') ||
    norm.includes('нос / уши / межбровье')
  ) {
    return 'Мужской зал';
  }

  // 5. Rule: Зал макияжей и укладок (Makeup, bride styling, evening hairstyles, courses, Steampod)
  if (
    norm.includes('макияж') ||
    norm.includes('мейкап') ||
    norm.includes('makeup') ||
    norm.includes('прическа') ||
    norm.includes('причёска') ||
    norm.includes('невест') ||
    norm.includes('никах') ||
    norm.includes('венчальн') ||
    norm.includes('грим') ||
    norm.includes('косметичк') ||
    norm.includes('сам себе стилист') ||
    norm.includes('steampod') ||
    norm.includes('стимпод') ||
    norm.includes('стим под') ||
    norm.includes('stimpod') ||
    norm.includes('dyson') ||
    norm.includes('дайсон') ||
    norm.includes('афрокудр') ||
    norm.includes('канекалон') ||
    norm.includes('канеколона') ||
    norm.includes('плетение кос') ||
    norm.includes('горячие инструменты') ||
    norm.includes('укладка вечерняя') ||
    norm.includes('укладка фото') ||
    norm.includes('детское фото конкурс') ||
    (norm.includes('укладка') && (norm.includes('детская') || norm.includes('выпускной') || norm.includes('локоны')))
  ) {
    return 'Зал макияжей и укладок';
  }

  // 6. Rule: Зал колористики/парикмахеры (All coloring, hair treatments, women's haircuts, salon hair care)
  if (
    norm.includes('окрашиван') ||
    norm.includes('тонирован') ||
    norm.includes('мелирован') ||
    norm.includes('осветлен') ||
    norm.includes('тотал блонд') ||
    norm.includes('total blond') ||
    norm.includes('airtouch') ||
    norm.includes('аэртач') ||
    norm.includes('эртач') ||
    norm.includes('шатуш') ||
    norm.includes('балаяж') ||
    norm.includes('смывка') ||
    norm.includes('color off') ||
    norm.includes('колорист') ||
    norm.includes('парикмахер') ||
    norm.includes('стрижка женск') ||
    norm.includes('стрижка для девочек') ||
    norm.includes('стрижка детям/для девочек') ||
    norm.includes('стрижка модельная') ||
    norm.includes('мытье головы') ||
    norm.includes('мытьё головы') ||
    norm.includes('кератин') ||
    norm.includes('ботокс для волос') ||
    norm.includes('tokio inkarami') ||
    norm.includes('токио инкарами') ||
    norm.includes('kerastase') ||
    norm.includes('керастаз') ||
    norm.includes('premiere') ||
    norm.includes('loreal') ||
    norm.includes('лореаль') ||
    norm.includes('davines') ||
    norm.includes('давинес') ||
    norm.includes('nashi') ||
    norm.includes('наши') ||
    norm.includes('matrix') ||
    norm.includes('матрикс') ||
    norm.includes('scalp') ||
    norm.includes('advamte') ||
    norm.includes('constant delight') ||
    norm.includes('g-prof') ||
    norm.includes('keune') ||
    norm.includes('кене') ||
    norm.includes('эстель') ||
    norm.includes('estel') ||
    norm.includes('уход для волос') ||
    norm.includes('уход спа') ||
    norm.includes('брашинг') ||
    norm.includes('челк') ||
    norm.includes('контурной линии') ||
    norm.includes('мастер') ||
    norm.includes('эксперт') ||
    norm.includes('премиум') ||
    norm.includes('топ-мастер') ||
    norm.includes('проф-мастер') ||
    norm.includes('базовый мастер')
  ) {
    return 'Зал колористики/парикмахеры';
  }

  // Default: if it's hair/salon service, assign to hairdressers/colorists; else other
  if (norm.includes('волос') || norm.includes('стрижк') || norm.includes('укладк')) {
    return 'Зал колористики/парикмахеры';
  }

  return 'Прочие услуги';
}

// Hall color themes and icons metadata for UI display
export const HALL_METADATA: Record<HallName, {
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  accentBg: string;
  description: string;
}> = {
  'Зал колористики/парикмахеры': {
    label: 'Зал колористики/парикмахеры',
    shortLabel: 'Колористика',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    cardBorder: 'border-purple-200/80',
    accentBg: 'bg-purple-500',
    description: 'Окрашивания, стрижки женские, уходы за волосами, тонирование и осветление'
  },
  'Зал макияжей и укладок': {
    label: 'Зал макияжей и укладок',
    shortLabel: 'Макияж и укладки',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700',
    badgeBorder: 'border-pink-200',
    cardBorder: 'border-pink-200/80',
    accentBg: 'bg-pink-500',
    description: 'Макияжи, вечерние и свадебные прически, укладки SteamPod/Dyson, обучающие курсы'
  },
  'Зал ногтевого сервиса': {
    label: 'Зал ногтевого сервиса',
    shortLabel: 'Ногтевой сервис',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    cardBorder: 'border-emerald-200/80',
    accentBg: 'bg-emerald-500',
    description: 'Маникюр, педикюр, наращивание, покрытие гель-лаком, дизайн и уход за руками'
  },
  'Зал бровей': {
    label: 'Зал бровей',
    shortLabel: 'Брови и ресницы',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    cardBorder: 'border-amber-200/80',
    accentBg: 'bg-amber-500',
    description: 'Оформление, окрашивание и ламинирование бровей и ресниц, ботокс, депиляция'
  },
  'Мужской зал': {
    label: 'Мужской зал',
    shortLabel: 'Мужской зал',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    cardBorder: 'border-blue-200/80',
    accentBg: 'bg-blue-600',
    description: 'Мужские и детские стрижки, бритье и оформление бороды, камуфляж American Crew'
  },
  'Прочие услуги': {
    label: 'Прочие услуги',
    shortLabel: 'Прочие',
    badgeBg: 'bg-gray-50',
    badgeText: 'text-gray-700',
    badgeBorder: 'border-gray-200',
    cardBorder: 'border-gray-200/80',
    accentBg: 'bg-gray-500',
    description: 'Дополнительные услуги и сопутствующие операции'
  }
};
