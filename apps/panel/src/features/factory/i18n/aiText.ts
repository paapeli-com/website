import { useCallback } from "react";
import type {
  AiAnomaly,
  AiAnomalyKind,
  AiFailureForecast,
  AiOpportunity,
  AiSignalCategory,
  AiTrend,
} from "@paapeli/api";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { formatDateTime } from "@/shared/lib/formatDate";

/* The AI pages' own vocabulary. The gateway sends codes (an action, an
   anomaly kind, an opportunity rule) and numbers; everything a reader sees
   is worded here, in their language. Kept apart from translations.ts because
   it is one closed catalog that only these pages read. */

type Dict = Record<string, string>;

const en: Dict = {
  // Labels
  analyzeNow: "Analyze now",
  analysisQueued: "Analysis queued",
  analysisQueuedDesc: "Results refresh within a few minutes.",
  model: "Model",
  modelTimesfm: "TimesFM 2.5",
  modelFallback: "Statistical fallback",
  modelFallbackHint: "The AI engine could not load TimesFM and is using a seasonal statistical forecaster.",
  lastAnalyzed: "Last analyzed",
  nextAnalysis: "Next analysis",
  devicesAnalyzed: "Devices analyzed",
  notAnalyzedYet: "Not analyzed yet. The first analysis runs within minutes once devices report at least three days of telemetry.",
  aiOff: "AI analysis is turned off for this product.",
  sensitivity: "Sensitivity",
  sens_LOW: "Low: only clear anomalies",
  sens_MEDIUM: "Medium",
  sens_HIGH: "High: flag subtle changes",
  enabled: "Analysis enabled",
  settings: "AI settings",
  saved: "Settings saved",
  lastError: "Last error",
  signal: "Signal",
  current: "Current",
  baseline: "Normal",
  threshold: "Limit",
  thresholdFromRule: "alarm rule",
  thresholdLearned: "learned",
  projectedHealth: "Projected",
  noFailureWithin90: "Not within 90 days",
  expectedBand: "Expected range",
  expectedValue: "Expected",
  zScore: "Deviation",
  zScoreValue: "{z}× normal spread",
  seasonality: "Daily cycle",
  pValue: "p-value",
  projected: "Projected",
  projectionBand: "Projection range",
  correlatedSignals: "Signals moving with it",
  noFactors: "No other signal of this device moves with it.",
  noActionsStable: "No action needed while the trend is stable.",
  affectedDevices: "Affected devices",
  opportunityInactive: "The latest trends no longer show this.",
  window_7d: "7 days",
  window_30d: "30 days",
  window_90d: "90 days",
  thresholdCrossed: "Alarm limit crossed",
  detectedBy: "Detected by",
  method_residual: "TimesFM forecast residuals",
  method_forest: "Isolation Forest",
  method_flatline: "Stuck-sensor check",
  trendMethod: "Mann-Kendall test with Theil-Sen slope",
  probabilityWithin: "Within {days} days",
  devicesCount: "{n} devices",

  // Anomaly kinds
  kind_SPIKE: "Spike",
  kind_DROP: "Sudden drop",
  kind_LEVEL_SHIFT: "Level shift",
  kind_DRIFT: "Drift",
  kind_NOISE: "Erratic readings",
  kind_FLATLINE: "Stuck sensor",
  kind_PATTERN: "Unusual combination",

  // Signal categories
  cat_VIBRATION: "Vibration",
  cat_TEMPERATURE: "Temperature",
  cat_PRESSURE: "Pressure",
  cat_CURRENT: "Current",
  cat_VOLTAGE: "Voltage",
  cat_POWER: "Energy",
  cat_FLOW: "Flow",
  cat_SPEED: "Speed",
  cat_LEVEL: "Level",
  cat_HUMIDITY: "Humidity",
  cat_EFFICIENCY: "Efficiency",
  cat_THROUGHPUT: "Throughput",
  cat_UTILIZATION: "Utilization",
  cat_OTHER: "Other",

  // Opportunity categories
  oppcat_Energy: "Energy",
  oppcat_Efficiency: "Efficiency",
  oppcat_Maintenance: "Maintenance",
  oppcat_Utilization: "Utilization",

  // Actions
  act_INSPECT_BEARINGS: "Inspect bearings for wear and play",
  act_CHECK_ALIGNMENT: "Check shaft and coupling alignment",
  act_CHECK_BALANCE: "Check rotor balance and mountings",
  act_CHECK_COOLING: "Check the cooling system and airflow",
  act_CHECK_LUBRICATION: "Check lubrication level and condition",
  act_CLEAN_HEAT_SURFACES: "Clean heat-exchange surfaces and fins",
  act_CHECK_SEALS_LEAKS: "Check seals and lines for leaks",
  act_CHECK_VALVES_FILTERS: "Check valves and clean filters",
  act_CHECK_ELECTRICAL_SUPPLY: "Check the electrical supply and connections",
  act_INSPECT_MOTOR_WINDINGS: "Inspect motor windings and insulation",
  act_CHECK_POWER_QUALITY: "Check power quality and phase balance",
  act_AUDIT_ENERGY_USE: "Audit energy use against output",
  act_CHECK_IDLE_RUNNING: "Look for idle running outside production",
  act_CHECK_BLOCKAGES: "Check for blockages and fouling",
  act_CHECK_PUMP_IMPELLER: "Inspect the pump impeller for wear",
  act_CHECK_DRIVE_BELTS: "Check drive belts and tension",
  act_CHECK_SPEED_CONTROL: "Check the speed controller settings",
  act_CHECK_LEVEL_SENSOR: "Check the level sensor",
  act_CHECK_INLET_OUTLET: "Check inlet and outlet valves",
  act_CHECK_ENCLOSURE_SEALING: "Check enclosure sealing",
  act_REVIEW_PROCESS_SETTINGS: "Review process settings against the best period",
  act_REVIEW_SCHEDULING: "Review production scheduling",
  act_INSPECT_ASSET: "Inspect the asset",
  act_SCHEDULE_PREVENTIVE_MAINTENANCE: "Schedule preventive maintenance",
  act_CHECK_SENSOR_CONNECTION: "Check the sensor's wiring and connection",
  act_CALIBRATE_SENSOR: "Recalibrate or replace the sensor",
  act_VERIFY_SENSOR_READING: "Verify the reading on site",
  act_SET_ALARM_RULE: "Set an alarm rule on this signal",
  act_SCHEDULE_ENERGY_AUDIT: "Schedule an energy audit",
  act_BENCHMARK_BEST_PERIOD: "Compare with the best-performing period",
  act_REBALANCE_LOAD: "Rebalance load across equipment",

  // Opportunity steps
  step_STEP_CONFIRM_BASELINE: "Confirm the trend against the baseline on site",
  step_STEP_FIND_CAUSE: "Find the cause with the recommended checks",
  step_STEP_APPLY_CHANGE: "Apply the fix or adjustment",
  step_STEP_VERIFY_RESULT: "Verify the signal returns towards its baseline",

  // Opportunity rules
  rule_ENERGY_RISING_title: "Rising energy use: {key}",
  rule_ENERGY_RISING_desc: "{key} rose {pct}% over 30 days on {n} device(s).",
  rule_ENERGY_RISING_impact: "Potential saving",
  rule_ENERGY_RISING_explain: "Over the last 30 days {key} climbed {pct}% on average across {n} device(s), a statistically significant trend (confidence {conf}%). Consumption rising without more output usually points to friction, leaks, idle running or control drift; returning to the earlier level would save about that share.",
  rule_EFFICIENCY_FALLING_title: "Falling {key}",
  rule_EFFICIENCY_FALLING_desc: "{key} fell {pct}% over 30 days on {n} device(s).",
  rule_EFFICIENCY_FALLING_impact: "Efficiency to recover",
  rule_EFFICIENCY_FALLING_explain: "{key} has fallen {pct}% on average across {n} device(s) over 30 days (confidence {conf}%). Comparing settings and conditions with the best recent period usually shows what changed.",
  rule_UTILIZATION_FALLING_title: "Falling utilization: {key}",
  rule_UTILIZATION_FALLING_desc: "{key} dropped {pct}% over 30 days on {n} device(s).",
  rule_UTILIZATION_FALLING_impact: "Capacity to recover",
  rule_UTILIZATION_FALLING_explain: "{key} dropped {pct}% on average across {n} device(s) over 30 days (confidence {conf}%). Equipment running below its usual load may be waiting on upstream steps, or work could be consolidated.",
  rule_WEAR_RISING_title: "Wear building up: {key}",
  rule_WEAR_RISING_desc: "{key} moved {pct}% over 30 days on {n} device(s).",
  rule_WEAR_RISING_impact: "Change to reverse",
  rule_WEAR_RISING_explain: "{key} has moved {pct}% on average across {n} device(s) over 30 days (confidence {conf}%). A steady climb in this kind of signal is a typical early sign of wear; servicing now costs less than a failure later.",
  savingsOf: "≈{pct}% of {key}",

  // Explanations
  anomaly_explain: "{kind} on {key}: it read {value} at {time}, where the forecast expected about {expected}.",
  anomaly_explain_noexp: "{kind} on {key}: it read {value} at {time}, well outside its usual range.",
  anomaly_explain_FLATLINE: "{key} has reported the same value ({value}) since {time}, although it normally varies. The sensor may be stuck or disconnected.",
  anomaly_explain_PATTERN: "At {time}, the combination of {keys} was unlike anything in this device's history, although no single reading was out of range on its own.",
  anomaly_summary_residual: "TimesFM forecast the last 24 hours from the device's earlier history; this reading fell {z} times its normal spread outside that forecast.",
  anomaly_summary_forest: "An Isolation Forest trained on this device's history scored these readings as more unusual than {z} spreads of its normal behaviour.",
  anomaly_summary_flatline: "The signal stopped changing for {hours} hours, after varying throughout its history.",
  anomaly_crossed: "It also crossed the alarm rule's limit.",
  forecast_why: "{key} is moving towards its limit of {threshold} ({source}). The median TimesFM forecast reaches it in about {days} days.",
  forecast_why_none: "No signal reaches its limit within the 90-day forecast. The risk reflects how far {key} has already moved from normal ({degradation}% of the way to its limit).",
  trend_line_change: "{key} {direction} {pct}% over {window} ({slope} per day).",
  trend_dir_up: "rose",
  trend_dir_down: "fell",
  trend_dir_flat: "changed",
  trend_line_significant: "The trend is statistically significant (Mann-Kendall p = {p}).",
  trend_line_not_significant: "The change is not statistically significant (p = {p}); treat it as noise.",
  trend_line_seasonal: "A daily cycle explains {pct}% of its variation.",
  trend_line_factors: "It moves together with {keys}.",
  trend_line_projection: "If it continues, the TimesFM projection puts it near {value} by {date}.",
};

const fa: Dict = {
  analyzeNow: "تحلیل اکنون",
  analysisQueued: "تحلیل در صف قرار گرفت",
  analysisQueuedDesc: "نتایج تا چند دقیقه دیگر به‌روز می‌شوند.",
  model: "مدل",
  modelTimesfm: "TimesFM 2.5",
  modelFallback: "جایگزین آماری",
  modelFallbackHint: "موتور هوش مصنوعی نتوانست TimesFM را بارگذاری کند و از پیش‌بین آماری فصلی استفاده می‌کند.",
  lastAnalyzed: "آخرین تحلیل",
  nextAnalysis: "تحلیل بعدی",
  devicesAnalyzed: "دستگاه‌های تحلیل‌شده",
  notAnalyzedYet: "هنوز تحلیلی انجام نشده است. نخستین تحلیل چند دقیقه پس از آنکه دستگاه‌ها دست‌کم سه روز داده ارسال کنند اجرا می‌شود.",
  aiOff: "تحلیل هوش مصنوعی برای این محصول خاموش است.",
  sensitivity: "حساسیت",
  sens_LOW: "کم: فقط ناهنجاری‌های آشکار",
  sens_MEDIUM: "متوسط",
  sens_HIGH: "زیاد: تغییرات جزئی هم گزارش شود",
  enabled: "تحلیل فعال است",
  settings: "تنظیمات هوش مصنوعی",
  saved: "تنظیمات ذخیره شد",
  lastError: "آخرین خطا",
  signal: "سیگنال",
  current: "فعلی",
  baseline: "عادی",
  threshold: "حد مجاز",
  thresholdFromRule: "قانون هشدار",
  thresholdLearned: "آموخته‌شده",
  projectedHealth: "پیش‌بینی‌شده",
  noFailureWithin90: "در ۹۰ روز آینده نه",
  expectedBand: "بازه مورد انتظار",
  expectedValue: "مورد انتظار",
  zScore: "انحراف",
  zScoreValue: "{z} برابر پراکندگی عادی",
  seasonality: "چرخه روزانه",
  pValue: "مقدار p",
  projected: "پیش‌بینی‌شده",
  projectionBand: "بازه پیش‌بینی",
  correlatedSignals: "سیگنال‌های هم‌روند",
  noFactors: "سیگنال دیگری از این دستگاه با آن هم‌روند نیست.",
  noActionsStable: "تا زمانی که روند پایدار است اقدامی لازم نیست.",
  affectedDevices: "دستگاه‌های درگیر",
  opportunityInactive: "روندهای اخیر دیگر این را نشان نمی‌دهند.",
  window_7d: "۷ روز",
  window_30d: "۳۰ روز",
  window_90d: "۹۰ روز",
  thresholdCrossed: "از حد هشدار عبور کرد",
  detectedBy: "روش تشخیص",
  method_residual: "باقیمانده پیش‌بینی TimesFM",
  method_forest: "جنگل ایزوله (Isolation Forest)",
  method_flatline: "بررسی گیرکردن حسگر",
  trendMethod: "آزمون من-کندال با شیب تایل-سن",
  probabilityWithin: "ظرف {days} روز",
  devicesCount: "{n} دستگاه",

  kind_SPIKE: "جهش ناگهانی",
  kind_DROP: "افت ناگهانی",
  kind_LEVEL_SHIFT: "تغییر سطح",
  kind_DRIFT: "رانش تدریجی",
  kind_NOISE: "خوانش‌های نامنظم",
  kind_FLATLINE: "حسگر گیرکرده",
  kind_PATTERN: "ترکیب غیرعادی سیگنال‌ها",

  cat_VIBRATION: "لرزش",
  cat_TEMPERATURE: "دما",
  cat_PRESSURE: "فشار",
  cat_CURRENT: "جریان",
  cat_VOLTAGE: "ولتاژ",
  cat_POWER: "انرژی",
  cat_FLOW: "دبی",
  cat_SPEED: "سرعت",
  cat_LEVEL: "سطح",
  cat_HUMIDITY: "رطوبت",
  cat_EFFICIENCY: "بازده",
  cat_THROUGHPUT: "توان تولید",
  cat_UTILIZATION: "بهره‌وری",
  cat_OTHER: "سایر",

  oppcat_Energy: "انرژی",
  oppcat_Efficiency: "بازده",
  oppcat_Maintenance: "نگهداری",
  oppcat_Utilization: "بهره‌وری",

  act_INSPECT_BEARINGS: "بررسی سایش و لقی یاتاقان‌ها",
  act_CHECK_ALIGNMENT: "بررسی هم‌راستایی شفت و کوپلینگ",
  act_CHECK_BALANCE: "بررسی بالانس روتور و پایه‌ها",
  act_CHECK_COOLING: "بررسی سیستم خنک‌کاری و جریان هوا",
  act_CHECK_LUBRICATION: "بررسی سطح و وضعیت روغن‌کاری",
  act_CLEAN_HEAT_SURFACES: "تمیزکاری سطوح تبادل حرارت و پره‌ها",
  act_CHECK_SEALS_LEAKS: "بررسی نشتی آب‌بندها و لوله‌ها",
  act_CHECK_VALVES_FILTERS: "بررسی شیرها و تمیزکاری فیلترها",
  act_CHECK_ELECTRICAL_SUPPLY: "بررسی تغذیه برق و اتصالات",
  act_INSPECT_MOTOR_WINDINGS: "بررسی سیم‌پیچ و عایق موتور",
  act_CHECK_POWER_QUALITY: "بررسی کیفیت برق و تعادل فازها",
  act_AUDIT_ENERGY_USE: "ممیزی مصرف انرژی نسبت به تولید",
  act_CHECK_IDLE_RUNNING: "بررسی کارکرد بی‌بار خارج از زمان تولید",
  act_CHECK_BLOCKAGES: "بررسی گرفتگی و رسوب",
  act_CHECK_PUMP_IMPELLER: "بررسی سایش پروانه پمپ",
  act_CHECK_DRIVE_BELTS: "بررسی تسمه‌ها و کشش آن‌ها",
  act_CHECK_SPEED_CONTROL: "بررسی تنظیمات کنترل‌کننده سرعت",
  act_CHECK_LEVEL_SENSOR: "بررسی حسگر سطح",
  act_CHECK_INLET_OUTLET: "بررسی شیرهای ورودی و خروجی",
  act_CHECK_ENCLOSURE_SEALING: "بررسی آب‌بندی محفظه",
  act_REVIEW_PROCESS_SETTINGS: "مقایسه تنظیمات فرایند با بهترین دوره",
  act_REVIEW_SCHEDULING: "بازبینی برنامه‌ریزی تولید",
  act_INSPECT_ASSET: "بازرسی تجهیز",
  act_SCHEDULE_PREVENTIVE_MAINTENANCE: "برنامه‌ریزی نگهداری پیشگیرانه",
  act_CHECK_SENSOR_CONNECTION: "بررسی سیم‌کشی و اتصال حسگر",
  act_CALIBRATE_SENSOR: "کالیبراسیون یا تعویض حسگر",
  act_VERIFY_SENSOR_READING: "تأیید خوانش در محل",
  act_SET_ALARM_RULE: "تعریف قانون هشدار برای این سیگنال",
  act_SCHEDULE_ENERGY_AUDIT: "برنامه‌ریزی ممیزی انرژی",
  act_BENCHMARK_BEST_PERIOD: "مقایسه با بهترین دوره عملکرد",
  act_REBALANCE_LOAD: "توزیع مجدد بار بین تجهیزات",

  step_STEP_CONFIRM_BASELINE: "تأیید روند نسبت به خط مبنا در محل",
  step_STEP_FIND_CAUSE: "یافتن علت با بررسی‌های پیشنهادی",
  step_STEP_APPLY_CHANGE: "اعمال اصلاح یا تنظیم",
  step_STEP_VERIFY_RESULT: "اطمینان از بازگشت سیگنال به خط مبنا",

  rule_ENERGY_RISING_title: "افزایش مصرف انرژی: {key}",
  rule_ENERGY_RISING_desc: "{key} در ۳۰ روز گذشته روی {n} دستگاه {pct}٪ افزایش یافته است.",
  rule_ENERGY_RISING_impact: "صرفه‌جویی بالقوه",
  rule_ENERGY_RISING_explain: "در ۳۰ روز گذشته {key} به‌طور میانگین {pct}٪ روی {n} دستگاه افزایش یافته که روندی معنادار از نظر آماری است (اطمینان {conf}٪). افزایش مصرف بدون افزایش تولید معمولاً نشانه اصطکاک، نشتی، کارکرد بی‌بار یا انحراف کنترل است؛ بازگشت به سطح قبلی تقریباً همین مقدار صرفه‌جویی دارد.",
  rule_EFFICIENCY_FALLING_title: "کاهش {key}",
  rule_EFFICIENCY_FALLING_desc: "{key} در ۳۰ روز گذشته روی {n} دستگاه {pct}٪ کاهش یافته است.",
  rule_EFFICIENCY_FALLING_impact: "بازده قابل بازیابی",
  rule_EFFICIENCY_FALLING_explain: "{key} در ۳۰ روز گذشته به‌طور میانگین {pct}٪ روی {n} دستگاه کاهش یافته است (اطمینان {conf}٪). مقایسه تنظیمات و شرایط با بهترین دوره اخیر معمولاً نشان می‌دهد چه چیزی تغییر کرده است.",
  rule_UTILIZATION_FALLING_title: "کاهش بهره‌وری: {key}",
  rule_UTILIZATION_FALLING_desc: "{key} در ۳۰ روز گذشته روی {n} دستگاه {pct}٪ افت کرده است.",
  rule_UTILIZATION_FALLING_impact: "ظرفیت قابل بازیابی",
  rule_UTILIZATION_FALLING_explain: "{key} در ۳۰ روز گذشته به‌طور میانگین {pct}٪ روی {n} دستگاه افت کرده است (اطمینان {conf}٪). تجهیزی که زیر بار معمول کار می‌کند ممکن است منتظر مراحل قبلی باشد یا بتوان کار را یکپارچه کرد.",
  rule_WEAR_RISING_title: "افزایش فرسایش: {key}",
  rule_WEAR_RISING_desc: "{key} در ۳۰ روز گذشته روی {n} دستگاه {pct}٪ تغییر کرده است.",
  rule_WEAR_RISING_impact: "تغییر قابل برگشت",
  rule_WEAR_RISING_explain: "{key} در ۳۰ روز گذشته به‌طور میانگین {pct}٪ روی {n} دستگاه تغییر کرده است (اطمینان {conf}٪). افزایش پیوسته این نوع سیگنال نشانه رایج فرسایش است؛ سرویس اکنون از خرابی بعدی کم‌هزینه‌تر است.",
  savingsOf: "≈{pct}٪ از {key}",

  anomaly_explain: "{kind} در {key}: مقدار {value} در {time} ثبت شد، در حالی که پیش‌بینی حدود {expected} بود.",
  anomaly_explain_noexp: "{kind} در {key}: مقدار {value} در {time} ثبت شد که بسیار خارج از بازه معمول آن است.",
  anomaly_explain_FLATLINE: "{key} از {time} همان مقدار ({value}) را گزارش می‌کند، در حالی که معمولاً تغییر می‌کند. ممکن است حسگر گیر کرده یا قطع شده باشد.",
  anomaly_explain_PATTERN: "در {time} ترکیب {keys} با هیچ زمانی در سابقه این دستگاه شباهت نداشت، هرچند هیچ خوانشی به‌تنهایی خارج از بازه نبود.",
  anomaly_summary_residual: "TimesFM بیست‌وچهار ساعت اخیر را از سابقه قبلی دستگاه پیش‌بینی کرد؛ این خوانش {z} برابر پراکندگی عادی خارج از آن پیش‌بینی بود.",
  anomaly_summary_forest: "جنگل ایزوله‌ای که روی سابقه این دستگاه آموزش دیده، این خوانش‌ها را بیش از {z} برابر پراکندگی رفتار عادی غیرعادی ارزیابی کرد.",
  anomaly_summary_flatline: "سیگنال پس از تغییرات پیوسته در سابقه‌اش، {hours} ساعت است که تغییر نکرده است.",
  anomaly_crossed: "از حد قانون هشدار نیز عبور کرد.",
  forecast_why: "{key} به سمت حد مجاز {threshold} ({source}) در حرکت است. میانه پیش‌بینی TimesFM حدود {days} روز دیگر به آن می‌رسد.",
  forecast_why_none: "در پیش‌بینی ۹۰ روزه هیچ سیگنالی به حد مجاز نمی‌رسد. ریسک نشان می‌دهد {key} تاکنون چقدر از حالت عادی فاصله گرفته است ({degradation}٪ از مسیر تا حد مجاز).",
  trend_line_change: "{key} در {window} {pct}٪ {direction} ({slope} در روز).",
  trend_dir_up: "افزایش یافت",
  trend_dir_down: "کاهش یافت",
  trend_dir_flat: "تغییر کرد",
  trend_line_significant: "این روند از نظر آماری معنادار است (من-کندال p = {p}).",
  trend_line_not_significant: "این تغییر از نظر آماری معنادار نیست (p = {p})؛ آن را نوسان در نظر بگیرید.",
  trend_line_seasonal: "یک چرخه روزانه {pct}٪ از تغییرات آن را توضیح می‌دهد.",
  trend_line_factors: "همراه با {keys} تغییر می‌کند.",
  trend_line_projection: "اگر ادامه یابد، پیش‌بینی TimesFM آن را تا {date} نزدیک {value} قرار می‌دهد.",
};

const ar: Dict = {
  analyzeNow: "حلّل الآن",
  analysisQueued: "تمت جدولة التحليل",
  analysisQueuedDesc: "تتحدث النتائج خلال بضع دقائق.",
  model: "النموذج",
  modelTimesfm: "TimesFM 2.5",
  modelFallback: "بديل إحصائي",
  modelFallbackHint: "تعذّر على محرك الذكاء الاصطناعي تحميل TimesFM ويستخدم متنبئًا إحصائيًا موسميًا.",
  lastAnalyzed: "آخر تحليل",
  nextAnalysis: "التحليل التالي",
  devicesAnalyzed: "الأجهزة المحللة",
  notAnalyzedYet: "لم يُجرَ أي تحليل بعد. يبدأ التحليل الأول خلال دقائق بعد أن ترسل الأجهزة بيانات ثلاثة أيام على الأقل.",
  aiOff: "تحليل الذكاء الاصطناعي متوقف لهذا المنتج.",
  sensitivity: "الحساسية",
  sens_LOW: "منخفضة: الشذوذ الواضح فقط",
  sens_MEDIUM: "متوسطة",
  sens_HIGH: "عالية: رصد التغيرات الطفيفة",
  enabled: "التحليل مفعّل",
  settings: "إعدادات الذكاء الاصطناعي",
  saved: "تم حفظ الإعدادات",
  lastError: "آخر خطأ",
  signal: "الإشارة",
  current: "الحالي",
  baseline: "الطبيعي",
  threshold: "الحد",
  thresholdFromRule: "قاعدة إنذار",
  thresholdLearned: "مُتعلَّم",
  projectedHealth: "المتوقع",
  noFailureWithin90: "ليس خلال 90 يومًا",
  expectedBand: "النطاق المتوقع",
  expectedValue: "المتوقع",
  zScore: "الانحراف",
  zScoreValue: "{z} ضعف التشتت الطبيعي",
  seasonality: "الدورة اليومية",
  pValue: "قيمة p",
  projected: "المتوقع",
  projectionBand: "نطاق التوقع",
  correlatedSignals: "إشارات تتحرك معها",
  noFactors: "لا تتحرك معها أي إشارة أخرى من هذا الجهاز.",
  noActionsStable: "لا حاجة لإجراء ما دام الاتجاه مستقرًا.",
  affectedDevices: "الأجهزة المتأثرة",
  opportunityInactive: "لم تعد الاتجاهات الأخيرة تُظهر ذلك.",
  window_7d: "7 أيام",
  window_30d: "30 يومًا",
  window_90d: "90 يومًا",
  thresholdCrossed: "تجاوز حد الإنذار",
  detectedBy: "طريقة الرصد",
  method_residual: "بواقي تنبؤ TimesFM",
  method_forest: "غابة العزل (Isolation Forest)",
  method_flatline: "فحص توقف المستشعر",
  trendMethod: "اختبار مان-كندال مع ميل ثيل-سين",
  probabilityWithin: "خلال {days} يومًا",
  devicesCount: "{n} أجهزة",

  kind_SPIKE: "ارتفاع مفاجئ",
  kind_DROP: "انخفاض مفاجئ",
  kind_LEVEL_SHIFT: "تحول في المستوى",
  kind_DRIFT: "انجراف",
  kind_NOISE: "قراءات مضطربة",
  kind_FLATLINE: "مستشعر متوقف",
  kind_PATTERN: "تركيبة غير معتادة",

  cat_VIBRATION: "الاهتزاز",
  cat_TEMPERATURE: "الحرارة",
  cat_PRESSURE: "الضغط",
  cat_CURRENT: "التيار",
  cat_VOLTAGE: "الجهد",
  cat_POWER: "الطاقة",
  cat_FLOW: "التدفق",
  cat_SPEED: "السرعة",
  cat_LEVEL: "المستوى",
  cat_HUMIDITY: "الرطوبة",
  cat_EFFICIENCY: "الكفاءة",
  cat_THROUGHPUT: "الإنتاجية",
  cat_UTILIZATION: "الاستغلال",
  cat_OTHER: "أخرى",

  oppcat_Energy: "الطاقة",
  oppcat_Efficiency: "الكفاءة",
  oppcat_Maintenance: "الصيانة",
  oppcat_Utilization: "الاستغلال",

  act_INSPECT_BEARINGS: "افحص المحامل بحثًا عن التآكل والخلوص",
  act_CHECK_ALIGNMENT: "افحص محاذاة العمود والوصلة",
  act_CHECK_BALANCE: "افحص اتزان الدوّار والقواعد",
  act_CHECK_COOLING: "افحص نظام التبريد وتدفق الهواء",
  act_CHECK_LUBRICATION: "افحص مستوى التزييت وحالته",
  act_CLEAN_HEAT_SURFACES: "نظّف أسطح التبادل الحراري والزعانف",
  act_CHECK_SEALS_LEAKS: "افحص الحشوات والخطوط بحثًا عن التسرب",
  act_CHECK_VALVES_FILTERS: "افحص الصمامات ونظّف المرشحات",
  act_CHECK_ELECTRICAL_SUPPLY: "افحص التغذية الكهربائية والتوصيلات",
  act_INSPECT_MOTOR_WINDINGS: "افحص ملفات المحرك وعزلها",
  act_CHECK_POWER_QUALITY: "افحص جودة الكهرباء وتوازن الأطوار",
  act_AUDIT_ENERGY_USE: "دقّق استهلاك الطاقة مقابل الإنتاج",
  act_CHECK_IDLE_RUNNING: "ابحث عن التشغيل دون حمل خارج الإنتاج",
  act_CHECK_BLOCKAGES: "افحص الانسدادات والترسبات",
  act_CHECK_PUMP_IMPELLER: "افحص دافع المضخة بحثًا عن التآكل",
  act_CHECK_DRIVE_BELTS: "افحص سيور الإدارة وشدّها",
  act_CHECK_SPEED_CONTROL: "افحص إعدادات متحكم السرعة",
  act_CHECK_LEVEL_SENSOR: "افحص مستشعر المستوى",
  act_CHECK_INLET_OUTLET: "افحص صمامات الدخول والخروج",
  act_CHECK_ENCLOSURE_SEALING: "افحص إحكام الغلاف",
  act_REVIEW_PROCESS_SETTINGS: "قارن إعدادات العملية بأفضل فترة",
  act_REVIEW_SCHEDULING: "راجع جدولة الإنتاج",
  act_INSPECT_ASSET: "افحص المعدة",
  act_SCHEDULE_PREVENTIVE_MAINTENANCE: "جدولة صيانة وقائية",
  act_CHECK_SENSOR_CONNECTION: "افحص أسلاك المستشعر وتوصيله",
  act_CALIBRATE_SENSOR: "أعد معايرة المستشعر أو استبدله",
  act_VERIFY_SENSOR_READING: "تحقق من القراءة في الموقع",
  act_SET_ALARM_RULE: "أنشئ قاعدة إنذار لهذه الإشارة",
  act_SCHEDULE_ENERGY_AUDIT: "جدولة تدقيق للطاقة",
  act_BENCHMARK_BEST_PERIOD: "قارن بأفضل فترة أداء",
  act_REBALANCE_LOAD: "أعد توزيع الحمل بين المعدات",

  step_STEP_CONFIRM_BASELINE: "تأكد من الاتجاه مقارنة بخط الأساس في الموقع",
  step_STEP_FIND_CAUSE: "حدد السبب بالفحوص الموصى بها",
  step_STEP_APPLY_CHANGE: "طبّق الإصلاح أو التعديل",
  step_STEP_VERIFY_RESULT: "تحقق من عودة الإشارة نحو خط الأساس",

  rule_ENERGY_RISING_title: "ارتفاع استهلاك الطاقة: {key}",
  rule_ENERGY_RISING_desc: "ارتفع {key} بنسبة {pct}٪ خلال 30 يومًا على {n} جهاز.",
  rule_ENERGY_RISING_impact: "وفر محتمل",
  rule_ENERGY_RISING_explain: "خلال آخر 30 يومًا ارتفع {key} بمتوسط {pct}٪ على {n} جهاز، وهو اتجاه دال إحصائيًا (ثقة {conf}٪). ارتفاع الاستهلاك دون زيادة الإنتاج يشير عادة إلى احتكاك أو تسرب أو تشغيل دون حمل أو انحراف في التحكم؛ والعودة إلى المستوى السابق توفر نحو هذه النسبة.",
  rule_EFFICIENCY_FALLING_title: "تراجع {key}",
  rule_EFFICIENCY_FALLING_desc: "انخفض {key} بنسبة {pct}٪ خلال 30 يومًا على {n} جهاز.",
  rule_EFFICIENCY_FALLING_impact: "كفاءة قابلة للاسترداد",
  rule_EFFICIENCY_FALLING_explain: "انخفض {key} بمتوسط {pct}٪ على {n} جهاز خلال 30 يومًا (ثقة {conf}٪). مقارنة الإعدادات والظروف بأفضل فترة حديثة تكشف عادة ما الذي تغير.",
  rule_UTILIZATION_FALLING_title: "تراجع الاستغلال: {key}",
  rule_UTILIZATION_FALLING_desc: "هبط {key} بنسبة {pct}٪ خلال 30 يومًا على {n} جهاز.",
  rule_UTILIZATION_FALLING_impact: "سعة قابلة للاسترداد",
  rule_UTILIZATION_FALLING_explain: "هبط {key} بمتوسط {pct}٪ على {n} جهاز خلال 30 يومًا (ثقة {conf}٪). قد تكون المعدات العاملة دون حملها المعتاد بانتظار مراحل سابقة، أو يمكن دمج العمل.",
  rule_WEAR_RISING_title: "تزايد التآكل: {key}",
  rule_WEAR_RISING_desc: "تغير {key} بنسبة {pct}٪ خلال 30 يومًا على {n} جهاز.",
  rule_WEAR_RISING_impact: "تغير قابل للعكس",
  rule_WEAR_RISING_explain: "تغير {key} بمتوسط {pct}٪ على {n} جهاز خلال 30 يومًا (ثقة {conf}٪). الارتفاع المطّرد في هذا النوع من الإشارات علامة مبكرة شائعة على التآكل؛ والصيانة الآن أقل كلفة من عطل لاحق.",
  savingsOf: "≈{pct}٪ من {key}",

  anomaly_explain: "{kind} في {key}: سُجلت القيمة {value} في {time}، بينما كان التنبؤ نحو {expected}.",
  anomaly_explain_noexp: "{kind} في {key}: سُجلت القيمة {value} في {time}، خارج نطاقها المعتاد بكثير.",
  anomaly_explain_FLATLINE: "يُبلغ {key} القيمة نفسها ({value}) منذ {time}، رغم أنه يتغير عادة. قد يكون المستشعر متوقفًا أو مفصولًا.",
  anomaly_explain_PATTERN: "في {time} كانت تركيبة {keys} مختلفة عن أي وقت في سجل هذا الجهاز، مع أن أي قراءة بمفردها لم تكن خارج النطاق.",
  anomaly_summary_residual: "تنبأ TimesFM بآخر 24 ساعة من سجل الجهاز السابق؛ وجاءت هذه القراءة خارج التنبؤ بمقدار {z} ضعف التشتت الطبيعي.",
  anomaly_summary_forest: "قيّمت غابة عزل مدرّبة على سجل هذا الجهاز هذه القراءات بأنها أكثر غرابة من {z} ضعف تشتت السلوك الطبيعي.",
  anomaly_summary_flatline: "توقفت الإشارة عن التغير منذ {hours} ساعة بعد أن كانت متغيرة طوال سجلها.",
  anomaly_crossed: "وقد تجاوزت أيضًا حد قاعدة الإنذار.",
  forecast_why: "يتجه {key} نحو حده {threshold} ({source}). يصل إليه وسيط تنبؤ TimesFM خلال نحو {days} يومًا.",
  forecast_why_none: "لا تصل أي إشارة إلى حدها ضمن تنبؤ 90 يومًا. يعكس الخطر مدى ابتعاد {key} عن الطبيعي حتى الآن ({degradation}٪ من الطريق إلى حده).",
  trend_line_change: "{direction} {key} بنسبة {pct}٪ خلال {window} ({slope} يوميًا).",
  trend_dir_up: "ارتفع",
  trend_dir_down: "انخفض",
  trend_dir_flat: "تغير",
  trend_line_significant: "الاتجاه دال إحصائيًا (مان-كندال p = {p}).",
  trend_line_not_significant: "التغير غير دال إحصائيًا (p = {p})؛ اعتبره تذبذبًا.",
  trend_line_seasonal: "تفسر دورة يومية {pct}٪ من تغيره.",
  trend_line_factors: "يتحرك مع {keys}.",
  trend_line_projection: "إذا استمر، يضعه توقع TimesFM قرب {value} بحلول {date}.",
};

const DICTS = { en, fa, ar } as const;

const fill = (text: string, params: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, name) => (name in params ? String(params[name]) : `{${name}}`));

/** Words the AI pages' codes and numbers in the current language. */
export const useAiText = () => {
  const { language, formatNumber } = useLanguage();
  const dict = DICTS[language as keyof typeof DICTS] ?? en;
  const sep = language === "en" ? ", " : "، ";

  const tr = useCallback(
    (key: string, params: Record<string, string | number> = {}) => fill(dict[key] ?? en[key] ?? key, params),
    [dict],
  );

  const num = useCallback(
    (value: number | null | undefined, digits = 2) => {
      if (value === null || value === undefined || !Number.isFinite(value)) return "—";
      const rounded = Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(digits));
      return formatNumber(rounded);
    },
    [formatNumber],
  );

  const action = useCallback((code: string) => tr(`act_${code}`), [tr]);
  const step = useCallback((code: string) => tr(`step_${code}`), [tr]);
  const kind = useCallback((k: AiAnomalyKind) => tr(`kind_${k}`), [tr]);
  const category = useCallback((c: AiSignalCategory | string) => tr(`cat_${c}`), [tr]);
  const windowLabel = useCallback((w: string) => tr(`window_${w}`), [tr]);
  const modelLabel = useCallback(
    (model?: string | null) =>
      !model ? "—" : model.startsWith("timesfm") ? tr("modelTimesfm") : tr("modelFallback"),
    [tr],
  );

  const opportunity = useCallback(
    (o: AiOpportunity) => {
      const params = {
        key: o.key,
        pct: num(Math.abs(o.impactPct), 1),
        n: formatNumber(o.devices.length),
        conf: formatNumber(o.confidence),
      };
      return {
        title: tr(`rule_${o.rule}_title`, params),
        description: tr(`rule_${o.rule}_desc`, params),
        impactLabel: tr(`rule_${o.rule}_impact`),
        impactValue: `${num(Math.abs(o.impactPct), 1)}%`,
        explanation: tr(`rule_${o.rule}_explain`, params),
        estimatedSavings: tr("savingsOf", params),
        category: tr(`oppcat_${o.category}`),
      };
    },
    [tr, num, formatNumber],
  );

  /** What happened, in a sentence, and how it was found. */
  const anomalyText = useCallback(
    (a: AiAnomaly) => {
      const time = formatDateTime(a.peakAt, language);
      const base = { key: a.key, value: num(a.peakValue), time, kind: kind(a.kind) };
      let explanation: string;
      if (a.kind === "FLATLINE") {
        explanation = tr("anomaly_explain_FLATLINE", { ...base, time: formatDateTime(a.startedAt, language) });
      } else if (a.kind === "PATTERN") {
        explanation = tr("anomaly_explain_PATTERN", { ...base, keys: a.causes.slice(0, 3).map((c) => c.key).join(sep) });
      } else if (a.expectedValue !== null && a.expectedValue !== undefined) {
        explanation = tr("anomaly_explain", { ...base, expected: num(a.expectedValue) });
      } else {
        explanation = tr("anomaly_explain_noexp", base);
      }
      const z = num(Math.abs(a.zScore), 1);
      const hours = Math.max(1, Math.round((Date.parse(a.endedAt) - Date.parse(a.startedAt)) / 3_600_000) + 1);
      const method = a.kind === "PATTERN" ? "forest" : a.kind === "FLATLINE" ? "flatline" : "residual";
      let summary = tr(`anomaly_summary_${method}`, { z, hours: formatNumber(hours) });
      if (a.thresholdCrossed) summary += ` ${tr("anomaly_crossed")}`;
      return { explanation, summary, method: tr(`method_${method}`), windowHours: hours };
    },
    [tr, num, kind, formatNumber, sep, language],
  );

  const forecastText = useCallback(
    (f: AiFailureForecast) => {
      const signal = f.signals.find((s) => s.key === f.causeKey) ?? f.signals[0];
      if (f.rulDays !== null && f.rulDays !== undefined && signal) {
        return tr("forecast_why", {
          key: f.causeKey,
          threshold: num(signal.threshold),
          source: tr(signal.thresholdSource === "ALARM_RULE" ? "thresholdFromRule" : "thresholdLearned"),
          days: num(f.rulDays, 1),
        });
      }
      return tr("forecast_why_none", {
        key: f.causeKey,
        degradation: formatNumber(Math.round((signal?.degradation ?? 0) * 100)),
      });
    },
    [tr, num, formatNumber],
  );

  /** The trend, read out line by line. */
  const trendLines = useCallback(
    (t: AiTrend) => {
      const lines: string[] = [];
      const direction =
        t.direction === "Increasing" ? tr("trend_dir_up") : t.direction === "Decreasing" ? tr("trend_dir_down") : tr("trend_dir_flat");
      lines.push(
        tr("trend_line_change", {
          key: t.key,
          direction,
          pct: num(Math.abs(t.changePct), 1),
          window: windowLabel(t.window),
          slope: num(t.slopePerDay, 3),
        }),
      );
      const p = t.pValue < 0.001 ? "< 0.001" : num(t.pValue, 3);
      lines.push(tr(t.direction === "Stable" ? "trend_line_not_significant" : "trend_line_significant", { p }));
      if (t.seasonality >= 0.3) lines.push(tr("trend_line_seasonal", { pct: formatNumber(Math.round(t.seasonality * 100)) }));
      if (t.factors.length > 0) lines.push(tr("trend_line_factors", { keys: t.factors.map((f) => f.key).join(sep) }));
      const last = [...t.series].reverse().find((s) => s.projected !== null && s.projected !== undefined && s.actual == null);
      if (last && t.direction !== "Stable") {
        lines.push(tr("trend_line_projection", { value: num(last.projected), date: formatDateTime(last.ts, language) }));
      }
      return lines;
    },
    [tr, num, windowLabel, formatNumber, sep, language],
  );

  return { tr, num, action, step, kind, category, windowLabel, modelLabel, opportunity, anomalyText, forecastText, trendLines };
};
