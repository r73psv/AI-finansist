import { Document, Packer, Paragraph, TextRun } from "docx";
import { MetricRow, RawRecord } from "./types";

// Helper function to format numeric values matching users spacing conventions
function formatNum(val: number, forceNegative: boolean = false, extraSpaces: string = ""): string {
  const rounded = Math.round(val);
  const isNeg = rounded < 0 || (rounded === 0 && forceNegative);
  const absVal = Math.abs(rounded);
  
  // Format with thousands separator space
  const formattedAbs = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  
  if (isNeg) {
    return `-${extraSpaces}${formattedAbs}`;
  } else {
    return formattedAbs;
  }
}

// Extract dynamic dates and format them for the document title
export function getReportPeriodString(records: RawRecord[]): string {
  let periodStr = "Май 2026 (25.04- 24.05)";
  if (records && records.length > 0) {
    const dates = records.map(r => r.date).filter((d): d is Date => d !== null);
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      const formatDDMM = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}.${month}`;
      };
      
      const monthsRu = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
      ];
      
      const monthName = monthsRu[maxDate.getMonth()];
      const year = maxDate.getFullYear();
      
      periodStr = `${monthName} ${year} (${formatDDMM(minDate)}- ${formatDDMM(maxDate)})`;
    }
  }
  return periodStr;
}

export async function downloadDocxReport(
  report: MetricRow[],
  records: RawRecord[],
  categoryMappings: Record<string, string>
) {
  const getVal = (label: string): number => {
    return report.find(r => r.label === label)?.value || 0;
  };

  // 1. Core Revenue Metrics
  const totalRevenue = getVal("Выручка общая");
  const services = getVal("Выручка с услуг");
  const goods = getVal("Выручка с товаров");
  const certificates = getVal("Выручка с сертификатов");
  const deposits = getVal("Пополнение счёта") || getVal("Пополнение счета");
  const subscriptions = getVal("Доход от продажи абонементов");
  const otherRevenue = getVal("Прочие доходы");

  // 2. Core Expenses Metrics
  const totalExpenses = getVal("Расходы");
  const varExpenses = getVal("Расходы переменные");
  const constExpenses = getVal("Расходы постоянные");
  const suppliers = getVal("Поставщики");
  const salaryExpenses = getVal("Расходы на заработную плату");
  const mastersSalary = getVal("Зарплата мастеров");
  const adminsSalary = getVal("Зарплата административного персонала");
  const otherExpenses = getVal("Прочие");
  const fundContributions = getVal("Отчисления в фонды");

  // 3. Profitability KPIs
  const netProfit = getVal("ЧИСТАЯ ПРИБЫЛЬ") || getVal("Прибыль");
  const profitability = getVal("Рентабельность");

  // Dynamic average checks calculation
  const servicesRow = report.find(r => r.label === "Выручка с услуг");
  const servicesCount = servicesRow ? (servicesRow.transactions?.length || 0) : 0;
  const avgCheckServices = servicesCount > 0 ? Math.round(services / servicesCount) : 0;

  const revenueLabels = ["Выручка с услуг", "Выручка с товаров", "Выручка с сертификатов", "Пополнение счёта", "Доход от продажи абонементов", "Прочие доходы"];
  let totalRevenueCount = 0;
  revenueLabels.forEach(lbl => {
    const row = report.find(r => r.label === lbl);
    if (row && row.transactions) {
      totalRevenueCount += row.transactions.length;
    }
  });
  const avgCheckTotal = totalRevenueCount > 0 ? Math.round(totalRevenue / totalRevenueCount) : 0;

  // 4. Fund Metrics
  const fundExpenses = getVal("Расходы за месяц") || getVal("Расходы за счёт фондов");
  const salonEquipment = getVal("Обустройство и оборудование салона");
  const corpActivities = getVal("Корпоративная деятельность");
  
  // Smart segregation of training vs extra premiums from 'Обучения и доп. премии' category
  const trainingRow = report.find(r => r.label === "Обучения и доп. премии");
  let trainingVal = 0;
  let premiumsVal = 0;
  if (trainingRow && trainingRow.transactions) {
    trainingRow.transactions.forEach(t => {
      const comm = (t.comment || "").toLowerCase();
      const cat = (t.category || "").toLowerCase();
      if (comm.includes("прем") || comm.includes("бонус") || cat.includes("прем") || cat.includes("бонус")) {
        premiumsVal += t.sum;
      } else {
        trainingVal += t.sum;
      }
    });
  } else {
    // fallback balance if row is single value
    const rawVal = getVal("Обучения и доп. премии");
    if (rawVal !== 0) {
      trainingVal = rawVal;
    }
  }

  const adsDevelopment = getVal("Реклама и развитие");
  const taxesPaid = getVal("Уплата налогов");

  // 5. Founders payout
  const foundersPayout = getVal("Выплаты учредителям");

  // Period header
  const periodHeader = getReportPeriodString(records);

  // Formatting strings
  const strRevenue = formatNum(totalRevenue);
  const strServices = formatNum(services);
  const strGoods = formatNum(goods);
  const strCertificates = formatNum(certificates);
  const strDeposits = formatNum(deposits);
  const strSubscriptions = formatNum(subscriptions);
  const strOtherRevenue = formatNum(otherRevenue);

  const strExpenses = formatNum(totalExpenses, true, "   ");
  const strVarExpenses = formatNum(varExpenses, true, "");
  const strConstExpenses = formatNum(constExpenses, true, "");
  const strSuppliers = formatNum(suppliers, true, "   ");
  const strSalaryExpenses = formatNum(salaryExpenses, true, " ");
  const strMastersSalary = formatNum(mastersSalary, true, " ");
  const strAdminsSalary = formatNum(adminsSalary, true, " ");
  const strOtherExpenses = formatNum(otherExpenses, true, "   ");
  const strFundContributions = formatNum(fundContributions, true, "   ");

  const strNetProfit = formatNum(netProfit, false, "   ");
  const strProfitability = profitability.toFixed(1).replace('.', ',');
  const strAvgCheckTotal = formatNum(avgCheckTotal);
  const strAvgCheckServices = formatNum(avgCheckServices);

  const strFundExpenses = formatNum(fundExpenses, true, "   ");
  const strSalonEquipment = formatNum(salonEquipment, true, "");
  const strCorpActivities = formatNum(corpActivities, true, "");
  const strTraining = formatNum(trainingVal, true, " ");
  const strPremiums = formatNum(premiumsVal, true, " ");
  const strAds = formatNum(adsDevelopment, true, " ");
  const strTaxes = formatNum(taxesPaid, true, "  ");

  const strFoundersPayout = formatNum(foundersPayout, true, " ");

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Period Header
          new Paragraph({
            children: [
              new TextRun({
                text: periodHeader,
                bold: true,
                size: 28, // 14pt
                font: "Calibri",
              })
            ],
            spacing: { after: 200 }
          }),

          // Total Revenue Header
          new Paragraph({
            children: [
              new TextRun({
                text: `Общая выручка: `,
                bold: true,
                size: 24, // 12pt
                font: "Calibri",
              }),
              new TextRun({
                text: strRevenue,
                bold: true,
                size: 24,
                font: "Calibri",
              })
            ],
            spacing: { after: 60 }
          }),
          // Revenue Bullet Points
          new Paragraph({
            children: [
              new TextRun({ text: `- Выручка с услуг :   ${strServices}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Выручка с товаров : ${strGoods}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Выручка с сертификатов : ${strCertificates}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Пополнение счета :   ${strDeposits}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Доход от продажи абонементов: ${strSubscriptions}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Прочие доходы : ${strOtherRevenue}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 200 }
          }),

          // Total Expenses Header
          new Paragraph({
            children: [
              new TextRun({
                text: `Расходы : `,
                bold: true,
                size: 24,
                font: "Calibri",
              }),
              new TextRun({
                text: strExpenses,
                bold: true,
                size: 24,
                font: "Calibri",
              })
            ],
            spacing: { after: 60 }
          }),
          // Expenses Bullet Points
          new Paragraph({
            children: [
              new TextRun({ text: `- Расходы переменные :   ${strVarExpenses}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Расходы постоянные :   ${strConstExpenses}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Поставщики : ${strSuppliers}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- Расходы на ЗП : ${strSalaryExpenses}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `( ${strMastersSalary} мастера и   ${strAdminsSalary}   административный персонал)`, size: 20, italics: true, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- прочие:   ${strOtherExpenses}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- фонды: ${strFundContributions}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 120 }
          }),

          // Seperator line
          new Paragraph({
            children: [
              new TextRun({ text: "__________________________________________", color: "CCCCCC", font: "Calibri" })
            ],
            spacing: { after: 120 }
          }),

          // KPIs Header
          new Paragraph({
            children: [
              new TextRun({ text: `Прибыль:   ${strNetProfit}`, bold: true, size: 24, font: "Calibri" })
            ],
            spacing: { after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Рентабельность    ${strProfitability}  %`, bold: true, size: 22, font: "Calibri" })
            ],
            spacing: { after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Средний чек :    ${strAvgCheckTotal}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Средний чек по услугам : ${strAvgCheckServices}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 120 }
          }),

          // Seperator line
          new Paragraph({
            children: [
              new TextRun({ text: "___________________________________________", color: "CCCCCC", font: "Calibri" })
            ],
            spacing: { after: 120 }
          }),

          // Fund Details Section
          new Paragraph({
            children: [
              new TextRun({ text: `Расходы за счет фондов: ${strFundExpenses}`, bold: true, size: 24, font: "Calibri" })
            ],
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- обустройство и оборудование салона: ${strSalonEquipment}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- корпоративная деятельность: ${strCorpActivities}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- обучение:${strTraining}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- доп.премии: ${strPremiums}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- реклама и развитие: ${strAds}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `- уплата налогов: ${strTaxes}`, size: 22, font: "Calibri" })
            ],
            spacing: { after: 120 }
          }),

          // Seperator line
          new Paragraph({
            children: [
              new TextRun({ text: "___________________________________________", color: "CCCCCC", font: "Calibri" })
            ],
            spacing: { after: 120 }
          }),

          // Founders payout
          new Paragraph({
            children: [
              new TextRun({ text: `Выплаты учредителям: ${strFoundersPayout}`, bold: true, size: 24, font: "Calibri" })
            ],
            spacing: { after: 120 }
          })
        ]
      }
    ]
  });

  // Pack and download standard client blob
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Финансовый_отчет_ведомость_${periodHeader.split(" ")[0]}_2026.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
