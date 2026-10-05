const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFParse } = require('pdf-parse');

const DOCS_DIR = path.join(__dirname, '../../storage/source-documents');
const TEXTS_DIR = path.join(__dirname, '../../storage/extracted-texts');
const CATALOG_DIR = path.join(__dirname, '../../storage/catalog');

fs.mkdirSync(TEXTS_DIR, { recursive: true });
fs.mkdirSync(CATALOG_DIR, { recursive: true });

// Load download index
const downloadIndex = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../storage/crawler/download-index.json'), 'utf8')
);

// Program category definitions discovered from source
const CATEGORIES = [
  { id: 'cat-muscle-building', name: 'Muscle Building', slug: 'muscle-building', displayOrder: 1, description: 'Programs focused on hypertrophy, muscle size, mass gain, and strength.' },
  { id: 'cat-fat-loss', name: 'Fat Loss', slug: 'fat-loss', displayOrder: 2, description: 'Programs engineered for fat reduction, definition, high metabolic conditioning, and shredding.' },
  { id: 'cat-single-muscle', name: 'Single Muscle Specialization', slug: 'single-muscle', displayOrder: 3, description: 'Targeted specialization programs for arms, chest, and specific muscle groups.' },
  { id: 'cat-bodyweight', name: 'Body Weight & Home Workouts', slug: 'bodyweight', displayOrder: 4, description: 'High-intensity bodyweight routines, home workouts, and calisthenics.' },
  { id: 'cat-medical', name: 'Medical Condition Diets', slug: 'medical-conditions', displayOrder: 5, description: 'Nutritional protocols tailored for cholesterol, diabetes, hypertension, and thyroid support.' },
  { id: 'cat-family', name: 'Kids & Family Nutrition', slug: 'kids-family', displayOrder: 6, description: 'Wholesome nutrition and foundational wellness protocols for children and families.' },
  { id: 'cat-specialized-nutrition', name: 'Specialized Nutrition Protocols', slug: 'specialized-nutrition', displayOrder: 7, description: 'Targeted diet plans including keto, intermittent job shift, carb cycling, and seasonal diets.' }
];

async function extractAllTexts() {
  console.log('Extracting raw text from all source documents...');
  const textMap = new Map();

  for (const entry of downloadIndex) {
    if (!entry.success) continue;
    const txtPath = path.join(TEXTS_DIR, `${entry.filename}.txt`);
    
    if (fs.existsSync(txtPath) && fs.statSync(txtPath).size > 10) {
      const text = fs.readFileSync(txtPath, 'utf8');
      textMap.set(entry.filename, { text, ...entry });
      continue;
    }

    try {
      const buf = fs.readFileSync(entry.dest);
      const parser = new PDFParse({ data: buf });
      await parser.load();
      const res = await parser.getText();
      const rawText = res.text || '';
      fs.writeFileSync(txtPath, rawText, 'utf8');
      textMap.set(entry.filename, { text: rawText, ...entry });
      console.log(`[Extracted] ${entry.filename} (${rawText.length} chars)`);
    } catch (err) {
      console.warn(`[Extraction Error] ${entry.filename}: ${err.message}`);
      textMap.set(entry.filename, { text: '', ...entry, error: err.message });
    }
  }

  return textMap;
}

// Map files to programs
function assignDocumentsToPrograms(textMap) {
  // Define known programs and their associated documents
  const programDefinitions = [
    // Muscle Building
    {
      name: '6 Week Shredded',
      slug: '6-week-shredded',
      categoryId: 'cat-fat-loss',
      goal: 'Fat Loss & Muscle Definition',
      duration: '12 Weeks (6 Weeks x 2 Cycles)',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 6,
      files: ['6_PACK_Workout_and_Nutrition_Plan_E-Book_by_Guru_Mann.pdf']
    },
    {
      name: 'Gainer & Pure Mass',
      slug: 'gainer-pure-mass',
      categoryId: 'cat-muscle-building',
      goal: 'Muscle Mass Gain',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 2,
      files: ['GAINER_Workout_Plan_by_Guru_Mann.pdf', 'Pure_Mass_Nutrition_Plan_by_Guru_Mann_.pdf']
    },
    {
      name: 'Mass-Up',
      slug: 'mass-up',
      categoryId: 'cat-muscle-building',
      goal: 'Clean Mass & Hypertrophy',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['MASS-UP_eBook.pdf']
    },
    {
      name: 'Size 8',
      slug: 'size-8',
      categoryId: 'cat-muscle-building',
      goal: 'Muscle Size & Volume',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['SIZE_8_WORKOUT_PLAN_by_Guru_Mann.pdf', 'SIZE_8_VEG_NUTRITION_PLAN_By_Guru_Mann.pdf']
    },
    {
      name: 'Bulk Up',
      slug: 'bulk-up',
      categoryId: 'cat-muscle-building',
      goal: 'Bulking & Power Building',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 2,
      files: ['BULK_Workout_and_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Mass XL',
      slug: 'mass-xl',
      categoryId: 'cat-muscle-building',
      goal: 'Extreme Mass Building',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 2,
      files: ['Mass_XL_Workout_Plan_by_Guru_Mann.pdf', 'Mass_XL_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Desi Diet',
      slug: 'desi-diet',
      categoryId: 'cat-muscle-building',
      goal: 'Indian Whole Food Muscle Gain',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['DESI_DIET_eBook_by_Guru_Mann.pdf']
    },
    {
      name: 'Barbell 55',
      slug: 'barbell-55',
      categoryId: 'cat-muscle-building',
      goal: 'Compound Strength & Density',
      duration: '6 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['Barbell_55_Workout_plan_by_Guru_Mann.pdf', 'Barbell_55_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Clean Muscle Gain',
      slug: 'clean-muscle-gain',
      categoryId: 'cat-muscle-building',
      goal: 'Lean Bulking & No Fat Spill',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['CLEAN_MUSCLE_GAIN_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Muscle Size 5x5',
      slug: 'muscle-size-5x5',
      categoryId: 'cat-muscle-building',
      goal: 'Heavy 5x5 Strength & Hypertrophy',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 2,
      files: ['MUSCLE_SIZE_5x5_-_WORKOUT_PLAN.pdf', 'MUSCLE_SIZE_5x5_-_NUTRITION_PLAN.pdf']
    },
    {
      name: 'Gains with Guru Mann',
      slug: 'gains-with-guru-mann',
      categoryId: 'cat-muscle-building',
      goal: 'Hypertrophy Mastery',
      duration: '6 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['GAINS_WITH_GURU_MANN.pdf']
    },
    {
      name: 'Lean Mode',
      slug: 'lean-mode',
      categoryId: 'cat-muscle-building',
      goal: 'Lean Muscle & Conditioning',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['LEAN_MODE_Workout_Plan_by_Guru_Mann.pdf', 'LEAN_MODE_Nutrition_Plan_MORNING___EVENING_by_Guru_Mann.pdf']
    },
    {
      name: 'Strength Mode',
      slug: 'strength-mode',
      categoryId: 'cat-muscle-building',
      goal: 'Pure Strength & Density',
      duration: '6 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['STRENGTH_MODE_Workout_Plan_by_Guru_Mann.pdf', 'STRENGTH_MODE_Diet_Plan_by_Guru_Mann.pdf']
    },
    // Fat Loss
    {
      name: 'Muscular 8',
      slug: 'muscular-8',
      categoryId: 'cat-fat-loss',
      goal: '8-Week Shred & Athleticism',
      duration: '8 Weeks',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['Muscular_8_WORKOUT_PLAN.pdf', 'Muscular_8_eBook.pdf']
    },
    {
      name: 'Muscle Mode',
      slug: 'muscle-mode',
      categoryId: 'cat-fat-loss',
      goal: 'Metabolic Fat Incineration',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['MuscleMode_WorkoutPlan_by_Guru_Mann.pdf', 'MuscleMode_NutritionPlan_by_Guru_Mann.pdf']
    },
    {
      name: 'Muscle Mann',
      slug: 'muscle-mann',
      categoryId: 'cat-fat-loss',
      goal: 'Lean Conditioning',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['MuscleMann_Workout_Plan_Guru_Mann.pdf', 'MuscleMann_Nutrition_Plan_Guru_Mann.pdf']
    },
    {
      name: 'Sharp',
      slug: 'sharp',
      categoryId: 'cat-fat-loss',
      goal: 'Ultra High Definition',
      duration: '6 Weeks',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['SHARP_Workout_and_Nutrition_Plan_by_Guru_Mann.pdf', 'SHARP_Progress_Tracker_by_Guru_Mann.pdf']
    },
    {
      name: 'Shred-X',
      slug: 'shred-x',
      categoryId: 'cat-fat-loss',
      goal: 'Rapid Fat Loss & Core Sculpting',
      duration: '6 Weeks',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['SHRED_X_Workout_Plan_by_Guru_Mann.pdf', 'SHRED_X_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Shredded Next Level',
      slug: 'shredded-next-level',
      categoryId: 'cat-fat-loss',
      goal: 'Advanced Contest Conditioning',
      duration: '8 Weeks',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['SHREDDED_NEXT_LEVEL_Workout_Plan_by_Guru_Mann.pdf', 'SHREDDED_NEXT_LEVEL_Nutrition_Plan_MORNING___EVENING_by_Guru_Mann.pdf']
    },
    {
      name: 'Get Ripped',
      slug: 'get-ripped',
      categoryId: 'cat-fat-loss',
      goal: 'Vascularity & Deep Striations',
      duration: '6 Weeks',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['GET_RIPPED_Workout_Plan_by_Guru_Mann.pdf', 'GET_RIPPED_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    // Single Muscle
    {
      name: 'Ultimate Arms',
      slug: 'ultimate-arms',
      categoryId: 'cat-single-muscle',
      goal: 'Arm Peak & Triceps Thickness',
      duration: '4 Weeks',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 0,
      files: ['ULTIMATE_ARMS_-_WORKOUT_PLAN_by_Guru_Mann.pdf']
    },
    {
      name: 'Ultimate Chest',
      slug: 'ultimate-chest',
      categoryId: 'cat-single-muscle',
      goal: 'Pectoral Upper/Lower Plate Depth',
      duration: '4 Weeks',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 0,
      files: ['ULTIMATE_CHEST_Workout_Plan_by_Guru_Mann.pdf', 'ULTIMATE_CHEST_nutrition_plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Ultimate Workout & Nutrition',
      slug: 'ultimate-workout-nutrition',
      categoryId: 'cat-single-muscle',
      goal: 'Comprehensive Conditioning',
      duration: '6 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['ULTIMATE_Workout_and_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: '17 Inches Arms',
      slug: '17-inches-arms',
      categoryId: 'cat-single-muscle',
      goal: 'Massive Biceps & Triceps Mass',
      duration: '6 Weeks',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 0,
      files: ['17_INCHES_Workout_Plan_by_Guru_Mann.pdf', '17inches_Nutrition_plan_by_Guru_Mann.pdf']
    },
    // Bodyweight
    {
      name: 'T-30 Bodyweight',
      slug: 't-30-bodyweight',
      categoryId: 'cat-bodyweight',
      goal: 'Home Calisthenics & Functional Power',
      duration: '30 Days',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 3,
      files: ['T-30_Workout_Plan.pdf', 'T-30_Nutrition_Plan_for_MEN_by_Guru_Mann.pdf', 'T-30_Nutrition_Plan_for_WOMEN_by_Guru_Mann.pdf']
    },
    {
      name: 'Home Gains',
      slug: 'home-gains',
      categoryId: 'cat-bodyweight',
      goal: 'Zero Equipment Home Muscle Building',
      duration: '6 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['HOME_GAINS_HOME_WORKOUT_BY_GURU_MANN.pdf', 'HOME_GAINS_NUTRITION_PLAN_by_Guru_Mann.pdf']
    },
    {
      name: 'Obese 60',
      slug: 'obese-60',
      categoryId: 'cat-bodyweight',
      goal: 'Morbid Obesity Recovery & Safe Fat Loss',
      duration: '60 Days',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 4,
      absDaysPerWeek: 2,
      files: ['OBESE_60_WORKOUT_PLAN_by_Guru_Mann.pdf', 'OBESE_60_NUTRITION_PLAN_by_Guru_Mann.pdf']
    },
    {
      name: 'Weight Loss X Blueprint',
      slug: 'weight-loss-x',
      categoryId: 'cat-bodyweight',
      goal: 'Accelerated Fat Loss System',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 3,
      files: ['WEIGHT_LOSS_X_Bluprint_by_Guru_Mann.pdf']
    },
    {
      name: 'Fit Zone Protocol',
      slug: 'fit-zone',
      categoryId: 'cat-bodyweight',
      goal: 'Functional Dynamic Fitness',
      duration: '6 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 3,
      files: ['FIT_ZONE_Nutrition_Plan_for_MEN_by_Guru_Mann.pdf', 'FIT_ZONE_Nutrition_Plan_for_WOMEN_by_Guru_Mann.pdf']
    },
    // Medical Condition Programs
    {
      name: 'Cholesterol Diet Protocol',
      slug: 'cholesterol-diet',
      categoryId: 'cat-medical',
      goal: 'Lipid Profile & Heart Health',
      duration: '8 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 4,
      absDaysPerWeek: 0,
      files: ['CHOLESTEROL_DIET_eBook_by_Guru_Mann.pdf']
    },
    {
      name: 'Control Diabetes Protocol',
      slug: 'control-diabetes',
      categoryId: 'cat-medical',
      goal: 'Insulin Sensitivity & Blood Sugar Control',
      duration: '8 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 4,
      absDaysPerWeek: 0,
      files: ['CONTROL_DIABETES_eBook_BY_Guru_Mann.pdf']
    },
    {
      name: 'High Blood Pressure Diet Protocol',
      slug: 'high-bp-diet',
      categoryId: 'cat-medical',
      goal: 'Hypertension Management & Sodium Balance',
      duration: '8 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 4,
      absDaysPerWeek: 0,
      files: ['High-BP_DIET_eBook_by_Guru_Mann.pdf']
    },
    {
      name: 'Drug Rehab Nutrition',
      slug: 'drug-rehab-nutrition',
      categoryId: 'cat-medical',
      goal: 'Detoxification & Nervous System Recovery',
      duration: '12 Weeks',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 0,
      files: ['DRUG_REHAB_NUTITION_PLAN_by_Guru_Mann.pdf']
    },
    {
      name: 'Fight Cancer Nutrition Support',
      slug: 'fight-cancer',
      categoryId: 'cat-medical',
      goal: 'Immune Augmentation & Cellular Nutrition',
      duration: '12 Weeks',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 0,
      files: ['FIGHT_CANCER_PDF.pdf']
    },
    {
      name: 'Thyroid Diet Protocol',
      slug: 'thyroid-diet',
      categoryId: 'cat-medical',
      goal: 'Thyroid Metabolism & Hormonal Balance',
      duration: '8 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 0,
      files: ['THYROID_DIET_eBook_by_Guru_Mann.pdf']
    },
    // Kids & Family
    {
      name: 'Kids Nutrition & Growth Diet',
      slug: 'kids-diet-plan',
      categoryId: 'cat-family',
      goal: 'Youth Cognitive & Physical Growth',
      duration: 'Ongoing',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 0,
      files: ['KIDS_DIET_PLAN_BY_Guru_Mann.pdf']
    },
    {
      name: 'Baby & Toddler Nutrition',
      slug: 'baby-nutrition',
      categoryId: 'cat-family',
      goal: 'Early Childhood Nourishment',
      duration: 'Ongoing',
      workoutDaysPerWeek: 0,
      restDaysPerWeek: 7,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 0,
      files: ['BABY_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Diet 40: Longevity Over 40',
      slug: 'diet-40',
      categoryId: 'cat-family',
      goal: 'Longevity & Vitality Over 40',
      duration: '8 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 2,
      files: ['DIET40_eBook_BY_Guru_Mann.pdf']
    },
    // Specialized Nutrition
    {
      name: 'PCOS / PCOD Nutrition Plan',
      slug: 'pcos-pcod-diet',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Hormonal Balance & Insulin Regulation for Women',
      duration: '8 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 3,
      absDaysPerWeek: 0,
      files: ['Nutrition_Plan_for_PCOS_PCOD.pdf']
    },
    {
      name: 'Keto Diet Protocol',
      slug: 'keto-diet',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Ketogenic Fat Adaptation',
      duration: '6 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 0,
      files: ['KETO_DIET_OVERVIEW_by_Guru_Mann.pdf']
    },
    {
      name: 'Diet For Eyes',
      slug: 'diet-for-eyes',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Vision Health & Antioxidant Protection',
      duration: '4 Weeks',
      workoutDaysPerWeek: 0,
      restDaysPerWeek: 7,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 0,
      files: ['DIET_for_EYES_by_GuruMann.pdf']
    },
    {
      name: 'Liver Health Diet',
      slug: 'diet-for-liver',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Hepatic Recovery & Fatty Liver Detox',
      duration: '6 Weeks',
      workoutDaysPerWeek: 0,
      restDaysPerWeek: 7,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 0,
      files: ['DIET_FOR_LIVER.pdf']
    },
    {
      name: 'Height Growth Diet Protocol',
      slug: 'diet-for-height',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Bone Density & Adolescent Growth Support',
      duration: '12 Weeks',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 0,
      files: ['DIET_for_HEIGHT_Nutrition_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Pregnancy & Post-Natal Diet',
      slug: 'pregnancy-nutrition',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Maternal & Fetal Health',
      duration: 'Ongoing',
      workoutDaysPerWeek: 0,
      restDaysPerWeek: 7,
      cardioDaysPerWeek: 0,
      absDaysPerWeek: 0,
      files: ['Nutrion_Plan_for_Pregnant_Woman_by_Guru_Mann.pdf']
    },
    {
      name: 'Job Shift & Night Shift Meal Plan',
      slug: 'job-shift-meal-plan',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Circadian Rhythm Adaptation & Shift Workers',
      duration: 'Ongoing',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 0,
      files: ['Job_Shift_Meal_Plan_by_Guru_Mann.pdf']
    },
    {
      name: 'Diet for Competitive Bodybuilder',
      slug: 'diet-for-bodybuilder',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Macro-Targeted Off-Season & Prep Nutrition',
      duration: '12 Weeks',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 2,
      files: ['DIET_FOR_BODYBUILDER_by_Guru_Mann.pdf']
    },
    {
      name: 'Monthly Budget 5000 Diet Plan',
      slug: 'budget-5000-diet',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Cost-Effective High Protein Indian Diet',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 2,
      files: ['MONTHLY_BUDGET_5000_DIET_PLAN_BY_GURU_MANN.pdf']
    },
    {
      name: 'Ramadan Fasting Diet Protocol',
      slug: 'ramadan-fasting-diet',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Fasting Hydration & Muscle Preservation During Ramadan',
      duration: '4 Weeks',
      workoutDaysPerWeek: 4,
      restDaysPerWeek: 3,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 0,
      files: ['DIET_FOR_RAMADAN_by_Guru_Mann.pdf']
    },
    {
      name: 'Carb Cycling Blueprint',
      slug: 'carb-cycling-blueprint',
      categoryId: 'cat-specialized-nutrition',
      goal: 'High/Low/No Carb Cycling for Stubborn Fat',
      duration: '6 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 2,
      files: ['CARB_CYCLE.pdf']
    },
    {
      name: 'Peak Week Contest Prep Diet',
      slug: 'peak-week-diet',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Sodium/Water Manipulation & Glycogen Depletion/Load',
      duration: '7 Days',
      workoutDaysPerWeek: 6,
      restDaysPerWeek: 1,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 0,
      files: ['Peak_Week_Diet_by_Guru_Mann.pdf']
    },
    {
      name: 'Navratri Vegetarian Fasting Diet',
      slug: 'navratri-fasting-diet',
      categoryId: 'cat-specialized-nutrition',
      goal: 'Sattvic Pure Vegetarian Fasting Nutrition',
      duration: '9 Days',
      workoutDaysPerWeek: 3,
      restDaysPerWeek: 4,
      cardioDaysPerWeek: 2,
      absDaysPerWeek: 0,
      files: ['DIET_FOR_NAVRATRI.pdf']
    },
    {
      name: '3300 Calories Clean Bulk Diet',
      slug: '3300-calories-diet',
      categoryId: 'cat-specialized-nutrition',
      goal: 'High Calorie Anabolic Nutrient Dense Meal Plan',
      duration: '8 Weeks',
      workoutDaysPerWeek: 5,
      restDaysPerWeek: 2,
      cardioDaysPerWeek: 1,
      absDaysPerWeek: 2,
      files: ['3300_Calories_Diet_Plan_by_Guru_Mann.pdf']
    }
  ];

  return programDefinitions;
}

// Parse meals from text
function parseNutritionMeals(rawText) {
  const meals = [];
  if (!rawText) return meals;

  // Find occurrences of "MEAL X" or "Meal X" or "Pre-Workout" or "Post-Workout"
  const mealSections = rawText.split(/(?=MEAL\s*\d+|Meal\s*\d+|Pre-[\s\S]*?Workout|Post-[\s\S]*?Workout)/i);

  let mealCounter = 1;
  for (const sec of mealSections) {
    const trimmed = sec.trim();
    if (!trimmed.toLowerCase().includes('meal') && !trimmed.toLowerCase().includes('workout')) continue;

    const firstLine = trimmed.split('\n')[0].trim();
    const nameMatch = firstLine.match(/(?:MEAL\s*\d+|Meal\s*\d+|Pre-[\w\s-]+|Post-[\w\s-]+)\s*[-–:]?\s*(.*)/i);
    const mealName = nameMatch ? (nameMatch[1].trim() || firstLine) : firstLine;

    // Time pattern e.g. "8-9 AM" or "8:00 AM" or "5:30 PM"
    const timeMatch = trimmed.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm|\s*-\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)))/i);
    const mealTime = timeMatch ? timeMatch[1].trim() : null;

    // Macro line e.g. "Calories = 500 | Protein – 40g | Carbs – 60g | Fat – 11g"
    const calMatch = trimmed.match(/Calories\s*=\s*(\d+)/i);
    const protMatch = trimmed.match(/Protein\s*[-–=:]\s*(\d+)\s*g/i);
    const carbMatch = trimmed.match(/Carbs?\s*[-–=:]\s*(\d+)\s*g/i);
    const fatMatch = trimmed.match(/Fat\s*[-–=:]\s*(\d+)\s*g/i);

    // Items list (lines starting with - or bullet)
    const itemLines = trimmed.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().startsWith('o '));
    const items = itemLines.map((line, idx) => {
      const cleanLine = line.replace(/^[-•o\s]+/, '').trim();
      // Try to parse quantity + unit + foodName e.g. "1cup Oat", "1sp Whey", "15g Peanuts"
      const qtyMatch = cleanLine.match(/^(\d+(?:\/\d+|\.\d+)?)\s*([a-zA-Z]+)?\s+(.*)/);
      if (qtyMatch) {
        return {
          id: `item-${mealCounter}-${idx+1}`,
          foodName: qtyMatch[3].trim(),
          quantity: qtyMatch[1],
          unit: qtyMatch[2] || null,
          notes: cleanLine
        };
      }
      return {
        id: `item-${mealCounter}-${idx+1}`,
        foodName: cleanLine,
        quantity: null,
        unit: null,
        notes: cleanLine
      };
    });

    if (items.length > 0 || mealName.length > 3) {
      meals.push({
        id: `meal-${mealCounter}`,
        mealNumber: mealCounter++,
        mealName: mealName.replace(/[-–]/g, '').trim() || `Meal ${mealCounter-1}`,
        mealTime,
        calories: calMatch ? parseInt(calMatch[1], 10) : null,
        proteinGrams: protMatch ? parseInt(protMatch[1], 10) : null,
        carbGrams: carbMatch ? parseInt(carbMatch[1], 10) : null,
        fatGrams: fatMatch ? parseInt(fatMatch[1], 10) : null,
        items
      });
    }
  }

  return meals;
}

// Parse workout days and exercises
function parseWorkoutDays(rawText, programName) {
  const days = [];
  if (!rawText) return days;

  const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  
  // Split into Day blocks
  const dayRegex = /(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s*[-–:]\s*([^\n]+)/gi;
  let match;
  const matches = [];

  while ((match = dayRegex.exec(rawText)) !== null) {
    matches.push({
      full: match[0],
      dayName: match[0].split(/[-–:]/)[0].trim().toUpperCase(),
      title: match[1].trim(),
      index: match.index
    });
  }

  if (matches.length === 0) {
    // Check for "DAY 1", "DAY 2", etc.
    const dayNumRegex = /(?:DAY\s*(\d+))\s*[-–:]?\s*([^\n]*)/gi;
    while ((match = dayNumRegex.exec(rawText)) !== null) {
      matches.push({
        full: match[0],
        dayName: `Day ${match[1]}`,
        title: match[2].trim() || `Workout ${match[1]}`,
        index: match.index
      });
    }
  }

  // Deduplicate consecutive identical day blocks if any
  const uniqueDayMatches = [];
  matches.forEach(m => {
    if (!uniqueDayMatches.some(u => u.dayName === m.dayName && Math.abs(u.index - m.index) < 100)) {
      uniqueDayMatches.push(m);
    }
  });

  uniqueDayMatches.forEach((dMatch, i) => {
    const nextMatch = uniqueDayMatches[i+1];
    const dayText = rawText.slice(dMatch.index, nextMatch ? nextMatch.index : dMatch.index + 3000);

    // Extract exercises
    // Look for Super Set, Giant Set, Regular Set
    const lines = dayText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const exercises = [];

    let currentGroupType = 'STRAIGHT_SET';
    let groupNumber = 1;
    let exerciseIndex = 1;

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];

      if (/Super\s*Set/i.test(line)) {
        currentGroupType = 'SUPERSET';
        groupNumber++;
        continue;
      }
      if (/Giant\s*Set|Tri\s*Set/i.test(line)) {
        currentGroupType = 'GIANT_SET';
        groupNumber++;
        continue;
      }
      if (/Drop\s*Set/i.test(line)) {
        currentGroupType = 'DROP_SET';
        groupNumber++;
        continue;
      }
      if (/Straight\s*Set|Regular\s*Set/i.test(line)) {
        currentGroupType = 'STRAIGHT_SET';
        groupNumber++;
        continue;
      }

      // Check if line looks like exercise name e.g. "DB Shoulder Press" or "Barbell Smith Bench Press" or "Chest 1 Barbell..."
      const exMatch = line.match(/^(?:Exercise\s*\d+[:.]?\s*)?(?:(?:Chest|Shoulders|Back|Arms|Biceps|Triceps|Legs|Quads|Abs)\s*\d+[:.]?\s*)?([A-Za-z0-9\s()/-]{4,40})(?:\s+(\d+)\s+(\d+-\d+|\d+))?$/);
      if (exMatch && !line.includes('Designed & Created') && !line.includes('NOTE:') && !line.includes('Calories') && !line.includes('Reps/set')) {
        const exName = exMatch[1].trim();
        if (exName.length > 3 && !dayNames.includes(exName.toUpperCase())) {
          exercises.push({
            id: `ex-${i+1}-${exerciseIndex++}`,
            name: exName,
            setGroupType: currentGroupType,
            groupNumber,
            prescribedReps: exMatch[2] ? `${exMatch[2]} reps` : '10-12 reps',
            targetSets: 3,
            targetReps: exMatch[2] ? parseInt(exMatch[2], 10) : 10,
            restSeconds: currentGroupType === 'STRAIGHT_SET' ? 90 : (currentGroupType === 'SUPERSET' ? 0 : 0),
            restInstructions: currentGroupType === 'SUPERSET' 
              ? 'No rest between exercises. Rest 60s after superset round.' 
              : (currentGroupType === 'GIANT_SET' ? 'No rest between exercises. Rest 90s after giant set round.' : 'Rest 90s between sets.')
          });
        }
      }
    }

    const dayOfWeekIndex = dayNames.indexOf(dMatch.dayName.toUpperCase());
    days.push({
      id: `day-${i+1}`,
      dayOfWeek: dayOfWeekIndex !== -1 ? dayOfWeekIndex + 1 : i + 1,
      title: `${dMatch.dayName}: ${dMatch.title || 'Workout'}`,
      muscleGroup: dMatch.title,
      exercises
    });
  });

  return days;
}

async function buildCatalog() {
  const textMap = await extractAllTexts();
  const programDefs = assignDocumentsToPrograms(textMap);

  console.log(`\nStructuring ${programDefs.length} programs across ${CATEGORIES.length} categories...`);

  const structuredPrograms = [];
  const reportRows = [];

  for (const def of programDefs) {
    const category = CATEGORIES.find(c => c.id === def.categoryId);
    const sourceDocs = [];
    const nutritionPlans = [];
    let workoutDays = [];

    for (const filename of def.files) {
      const doc = textMap.get(filename);
      if (!doc) continue;

      const isWorkout = filename.toLowerCase().includes('workout') || filename.toLowerCase().includes('exercise');
      const isNutrition = filename.toLowerCase().includes('nutrition') || filename.toLowerCase().includes('diet') || filename.toLowerCase().includes('ebook');

      sourceDocs.push({
        id: `doc-${doc.sha256.slice(0, 10)}`,
        documentType: isWorkout ? 'WORKOUT' : (isNutrition ? 'NUTRITION' : 'EBOOK'),
        title: filename.replace(/_/g, ' ').replace(/\.pdf$/i, ''),
        sourceUrl: doc.url,
        localPath: doc.dest,
        sha256: doc.sha256,
        sizeBytes: doc.size,
        extractedTextLength: doc.text.length,
        importedAt: new Date().toISOString()
      });

      if (isNutrition || doc.text.includes('MEAL') || doc.text.includes('Meal')) {
        const meals = parseNutritionMeals(doc.text);
        if (meals.length > 0) {
          nutritionPlans.push({
            id: `nutr-${def.slug}-${nutritionPlans.length + 1}`,
            planName: filename.replace(/_/g, ' ').replace(/\.pdf$/i, ''),
            targetAudience: filename.toLowerCase().includes('women') ? 'Female' : (filename.toLowerCase().includes('men') ? 'Male' : 'All'),
            totalCalories: meals.reduce((acc, m) => acc + (m.calories || 0), 0) || null,
            proteinGrams: meals.reduce((acc, m) => acc + (m.proteinGrams || 0), 0) || null,
            carbGrams: meals.reduce((acc, m) => acc + (m.carbGrams || 0), 0) || null,
            fatGrams: meals.reduce((acc, m) => acc + (m.fatGrams || 0), 0) || null,
            sourceDocumentHash: doc.sha256,
            meals
          });
        }
      }

      if (isWorkout || workoutDays.length === 0) {
        const parsed = parseWorkoutDays(doc.text, def.name);
        if (parsed.length > 0) {
          workoutDays = parsed;
        }
      }
    }

    // If 6 Week Shredded: strictly enforce 12 Weeks (Weeks 1-6 + repeated Weeks 7-12)
    const weeksCount = def.name === '6 Week Shredded' ? 12 : (parseInt(def.duration, 10) || 8);

    const programObj = {
      id: `prog-${def.slug}`,
      name: def.name,
      slug: def.slug,
      categoryId: def.categoryId,
      categoryName: category ? category.name : 'General',
      goal: def.goal,
      duration: def.duration,
      displayDuration: def.duration,
      sourceDuration: def.name === '6 Week Shredded' ? '6 Weeks' : def.duration,
      sourceAttribution: 'Program fitted by Gravity',
      weeksCount,
      workoutDaysPerWeek: def.workoutDaysPerWeek,
      restDaysPerWeek: def.restDaysPerWeek,
      cardioDaysPerWeek: def.cardioDaysPerWeek,
      absDaysPerWeek: def.absDaysPerWeek,
      isActive: true,
      status: 'PUBLISHED',
      days: workoutDays,
      nutritionPlans,
      sourceDocuments: sourceDocs
    };

    structuredPrograms.push(programObj);

    reportRows.push({
      programName: def.name,
      category: category ? category.name : 'Unknown',
      duration: def.duration,
      documentsCount: sourceDocs.length,
      workoutDaysCount: workoutDays.length,
      totalExercisesCount: workoutDays.reduce((acc, d) => acc + d.exercises.length, 0),
      nutritionPlansCount: nutritionPlans.length,
      totalMealsCount: nutritionPlans.reduce((acc, np) => acc + np.meals.length, 0),
      sha256Hashes: sourceDocs.map(d => d.sha256).join(';')
    });
  }

  // Build complete catalog object
  const catalog = {
    generatedAt: new Date().toISOString(),
    totalCategories: CATEGORIES.length,
    totalPrograms: structuredPrograms.length,
    categories: CATEGORIES,
    programs: structuredPrograms
  };

  // Write program-catalog.json
  fs.writeFileSync(
    path.join(CATALOG_DIR, 'program-catalog.json'),
    JSON.stringify(catalog, null, 2),
    'utf8'
  );
  console.log(`[Success] Written program-catalog.json (${(fs.statSync(path.join(CATALOG_DIR, 'program-catalog.json')).size / 1024).toFixed(1)} KB)`);

  // Write import-report.json
  fs.writeFileSync(
    path.join(CATALOG_DIR, 'import-report.json'),
    JSON.stringify(reportRows, null, 2),
    'utf8'
  );
  console.log(`[Success] Written import-report.json (${reportRows.length} rows)`);

  // Write import-report.csv
  const csvHeaders = ['Program Name', 'Category', 'Duration', 'Docs Count', 'Workout Days', 'Total Exercises', 'Nutrition Plans', 'Total Meals', 'SHA-256 Hashes'];
  const csvLines = [csvHeaders.join(',')];
  reportRows.forEach(r => {
    csvLines.push([
      `"${r.programName.replace(/"/g, '""')}"`,
      `"${r.category.replace(/"/g, '""')}"`,
      `"${r.duration.replace(/"/g, '""')}"`,
      r.documentsCount,
      r.workoutDaysCount,
      r.totalExercisesCount,
      r.nutritionPlansCount,
      r.totalMealsCount,
      `"${r.sha256Hashes}"`
    ].join(','));
  });
  fs.writeFileSync(path.join(CATALOG_DIR, 'import-report.csv'), csvLines.join('\n'), 'utf8');
  console.log(`[Success] Written import-report.csv`);
}

buildCatalog().catch(console.error);
