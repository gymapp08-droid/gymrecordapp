const fs = require('fs');
const path = require('path');

const TEXTS_DIR = path.join(__dirname, '../../storage/extracted-texts');
const CATALOG_DIR = path.join(__dirname, '../../storage/catalog');

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

const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/Guru\s*Mann\s*(?:Fitness\s*Inc\.?)?/gi, 'GRAVITY Performance')
    .replace(/by\s*Guru\s*Mann/gi, '')
    .replace(/Designed\s*&\s*Created[^\n]*/gi, '')
    .replace(/California,\s*United\s*States/gi, '')
    .replace(/ISSA\/[^\n]*/gi, '')
    .replace(/--\s*\d+\s*of\s*\d+\s*--/g, '')
    .trim();
}

function normalizeRawText(raw) {
  if (!raw) return '';
  return raw
    .replace(/[\u00ad\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/ü|Ø/g, '•');
}

function getPrimaryMuscle(name, dayTitle) {
  const lower = (name + ' ' + (dayTitle || '')).toLowerCase();
  if (lower.includes('chest') || lower.includes('bench') || lower.includes('fly') || lower.includes('pushup') || lower.includes('pec')) return 'Chest';
  if (lower.includes('back') || lower.includes('row') || lower.includes('pull') || lower.includes('lat') || lower.includes('deadlift')) return 'Back & Lats';
  if (lower.includes('shoulder') || lower.includes('press') && lower.includes('overhead') || lower.includes('lateral') || lower.includes('delt') || lower.includes('raise') || lower.includes('shrug')) return 'Shoulders & Traps';
  if (lower.includes('bicep') || lower.includes('curl')) return 'Biceps';
  if (lower.includes('tricep') || lower.includes('pushdown') || lower.includes('dip') || lower.includes('skull')) return 'Triceps';
  if (lower.includes('squat') || lower.includes('leg') || lower.includes('quad') || lower.includes('lunge')) return 'Quads & Legs';
  if (lower.includes('ham') || lower.includes('rdl') || lower.includes('deadlift')) return 'Hamstrings';
  if (lower.includes('calf') || lower.includes('calves')) return 'Calves';
  if (lower.includes('abs') || lower.includes('core') || lower.includes('crunch') || lower.includes('plank')) return 'Abs & Core';
  if (lower.includes('cardio') || lower.includes('treadmill') || lower.includes('hiic') || lower.includes('sprint')) return 'Cardio & Conditioning';
  return 'Full Body Movement';
}

function parseNutritionMeals(rawText) {
  const meals = [];
  if (!rawText) return meals;
  const normalized = normalizeRawText(rawText);

  const mealSections = normalized.split(/(?=MEAL\s*\d+|Meal\s*\d+|Pre-[\s\S]*?Workout|Post-[\s\S]*?Workout)/i);
  let mealCounter = 1;

  for (const sec of mealSections) {
    const trimmed = sec.trim();
    if (!trimmed.toLowerCase().includes('meal') && !trimmed.toLowerCase().includes('workout')) continue;

    const firstLine = trimmed.split('\n')[0].trim();
    const nameMatch = firstLine.match(/(?:MEAL\s*\d+|Meal\s*\d+|Pre-[\w\s-]+|Post-[\w\s-]+)\s*[-–:]?\s*(.*)/i);
    let mealName = nameMatch ? (nameMatch[1].trim() || firstLine) : firstLine;
    mealName = cleanText(mealName).replace(/[-–]/g, '').trim() || `Meal ${mealCounter}`;

    const timeMatch = trimmed.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm|\s*-\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)))/i);
    const mealTime = timeMatch ? timeMatch[1].trim() : `${7 + (mealCounter - 1) * 3}:00`;

    const calMatch = trimmed.match(/Calories\s*=\s*(\d+)/i);
    const protMatch = trimmed.match(/Protein\s*[-–=:]\s*(\d+)\s*g/i);
    const carbMatch = trimmed.match(/Carbs?\s*[-–=:]\s*(\d+)\s*g/i);
    const fatMatch = trimmed.match(/Fat\s*[-–=:]\s*(\d+)\s*g/i);

    const itemLines = trimmed.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().startsWith('o '));
    const items = itemLines.map((line, idx) => {
      const cleanLine = cleanText(line.replace(/^[-•o\s]+/, '').trim());
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
        mealName,
        mealTime,
        calories: calMatch ? parseInt(calMatch[1], 10) : 480,
        proteinGrams: protMatch ? parseInt(protMatch[1], 10) : 35,
        carbGrams: carbMatch ? parseInt(carbMatch[1], 10) : 45,
        fatGrams: fatMatch ? parseInt(fatMatch[1], 10) : 12,
        items
      });
    }
  }

  return meals;
}

const MUSCLE_SPLIT_KEYWORDS = [
  { match: /CHEST\s*(&|\+|AND)\s*TRICEPS/i, title: 'Chest & Triceps', dow: 1 },
  { match: /BACK\s*(&|\+|AND)\s*BICEPS/i, title: 'Back & Biceps', dow: 2 },
  { match: /(ABS\s*(&|\+|AND)\s*CARDIO|CARDIO\s*(&|\+|AND)\s*ABS)/i, title: 'Abs & Cardio Protocol', dow: 3 },
  { match: /SHOULDERS\s*(&|\+|AND)\s*(TRAPS|DELTS)/i, title: 'Shoulders & Traps', dow: 4 },
  { match: /(LEGS|QUADS|QUADS,\s*HAMS|LOWER\s*BODY)/i, title: 'Legs & Calves Hypertrophy', dow: 5 },
  { match: /(ACTIVE\s*RECOVERY|CARDIO\s*FLOW)/i, title: 'Active Cardio & Abs', dow: 6 },
  { match: /REST/i, title: 'Rest & Recovery', dow: 7 }
];

function parseWorkoutDays(rawText, defaultGoal, programName) {
  if (!rawText) return [];
  const normalized = normalizeRawText(rawText);
  const lines = normalized.split('\n').map(l => cleanText(l)).filter(l => l.length > 0);

  // 1. Detect Weekly Split Schedule clusters (e.g. MONDAY Chest, TUESDAY Legs...)
  const dayLineIndices = [];
  lines.forEach((l, i) => {
    const u = l.toUpperCase();
    if (DAY_NAMES.some(d => u.startsWith(d + ' ') || u.startsWith(d + '\t') || u === d || u.startsWith(d + ' -'))) {
      dayLineIndices.push(i);
    }
  });

  const splitClusters = [];
  let curCluster = [dayLineIndices[0]];
  for (let i = 1; i < dayLineIndices.length; i++) {
    if (dayLineIndices[i] - dayLineIndices[i - 1] <= 4) {
      curCluster.push(dayLineIndices[i]);
    } else {
      if (curCluster.length >= 3) splitClusters.push({ start: curCluster[0], end: curCluster[curCluster.length - 1] });
      curCluster = [dayLineIndices[i]];
    }
  }
  if (curCluster.length >= 3) splitClusters.push({ start: curCluster[0], end: curCluster[curCluster.length - 1] });

  const weeklySchedule = {};
  splitClusters.forEach(cl => {
    for (let li = cl.start; li <= cl.end; li++) {
      const line = lines[li];
      const u = line.toUpperCase();
      const dm = DAY_NAMES.find(d => u.startsWith(d));
      if (dm) {
        const dow = DAY_NAMES.indexOf(dm) + 1;
        const rest = line.replace(new RegExp('^' + dm + '[\\t\\s-:]*', 'i'), '').trim();
        if (rest && !weeklySchedule[dow]) {
          weeklySchedule[dow] = rest;
        }
      }
    }
  });

  const isInsideSplitCluster = (lineIdx) => {
    return splitClusters.some(cl => lineIdx >= cl.start && lineIdx <= cl.end);
  };

  // 2. Identify Section Headers
  const sections = [];
  const COMMON_SECTION_KEYWORDS = [
    'CHEST', 'BACK', 'SHOULDER', 'LEGS', 'BICEPS', 'TRICEPS', 'ARMS', 'ABS', 'CARDIO',
    'UPPER BODY', 'LOWER BODY', 'PUSH', 'PULL', 'BLASTER', 'STRENGTH', 'ENDURANCE', 'QUADS', 'HAMS',
    'CIRCUIT'
  ];

  for (let i = 0; i < lines.length; i++) {
    if (isInsideSplitCluster(i)) continue;

    const line = lines[i];
    const upper = line.toUpperCase();

    // Skip non-section noise
    if (upper.includes('--') || upper.startsWith('GRAVITY') || upper.startsWith('DESIGNED') || upper.startsWith('POWERED BY') || upper.startsWith('CATAGORY') || upper.startsWith('CATEGORY') || upper.startsWith('AGE:')) continue;
    if (upper.startsWith('EXERCISE') || upper.startsWith('SETS') || upper.startsWith('REPS') || upper.startsWith('NOTE:') || upper.startsWith('WARM UP') || upper.startsWith('WARM-UP') || upper.startsWith('OPTIONAL')) continue;
    if (upper.includes('IS REST DAY') || upper.includes('REST IS') || upper.includes('AFTER EACH') || upper.includes('INCREASE WEIGHT') || upper.includes('USE SINGLE') || upper.includes('SPEED:')) continue;

    // A) Explicit Day Section: "MONDAY - ...", "MONDAY: ...", "DAY 1", "WORKOUT A", "MON/WED/FRI"
    const explicitDay = DAY_NAMES.find(d => upper.startsWith(d + ' -') || upper.startsWith(d + ':') || upper.startsWith(d + ' EXERCISE') || upper === d);
    const dayNumMatch = line.match(/^(?:DAY\s*(\d+)|WORKOUT\s*([A-F]))\s*[-–:]?\s*(.*)/i);
    const multiDayMatch = upper.startsWith('MON/WED/FRI') || upper.startsWith('TUES/THUR/SAT');

    // B) Muscle / Routine header
    const isNumbered = line.match(/^([0-9]+[a-zA-Z]?[\.\)]|[a-zA-Z][\.\)])\s+/);
    const isMuscleHeader = !isNumbered && COMMON_SECTION_KEYWORDS.some(k => upper.includes(k)) && 
      !upper.includes('EXERCISE') && !upper.includes('REPS') && !upper.includes('SETS') && line.length < 50 && !line.match(/\d+\s*x\s*\d+/i);

    if (explicitDay || dayNumMatch || multiDayMatch || isMuscleHeader) {
      if (upper.includes('REST') && upper.length < 20) continue;
      if (upper === 'OFF' || upper.endsWith('- OFF')) continue;

      // Verify exercise lines exist within next 1-25 lines
      let hasExercises = false;
      for (let j = i + 1; j <= Math.min(lines.length - 1, i + 25); j++) {
        const l = lines[j];
        if (l.match(/^([0-9]+[a-zA-Z]?[\.\)]?|[a-zA-Z][\.\)])\s+/) || 
            /SUPER\s*SET|GIANT\s*SET|REGULAR\s*SET|DROP\s*SET|\d+\s*x\s*[\d-]+/i.test(l)) {
          hasExercises = true;
          break;
        }
      }

      if (hasExercises) {
        if (sections.length === 0 || i - sections[sections.length - 1].lineIdx > 2) {
          let targetDow = null;
          if (explicitDay) targetDow = DAY_NAMES.indexOf(explicitDay) + 1;
          else if (dayNumMatch) targetDow = dayNumMatch[1] ? parseInt(dayNumMatch[1], 10) : (dayNumMatch[2].charCodeAt(0) - 64);
          else if (multiDayMatch) targetDow = upper.startsWith('MON/WED/FRI') ? [1, 3, 5] : [2, 4, 6];

          sections.push({
            lineIdx: i,
            header: line,
            targetDow
          });
        }
      }
    }
  }

  // 3. Extract exercises for each section
  const extractedSections = sections.map((sec, idx) => {
    const nextSec = sections[idx + 1];
    const sectionLines = lines.slice(sec.lineIdx + 1, nextSec ? nextSec.lineIdx : sec.lineIdx + 120);

    const exercises = [];
    let currentGroupType = 'Regular Set';
    let groupNum = 1;

    for (let li = 0; li < sectionLines.length; li++) {
      const sline = sectionLines[li];
      const supper = sline.toUpperCase();

      if (/SUPER\s*SET/i.test(supper)) { currentGroupType = 'Super Set'; groupNum++; continue; }
      if (/GIANT\s*SET|TRI\s*SET|TRIPLE/i.test(supper)) { currentGroupType = 'Giant Set'; groupNum++; continue; }
      if (/DROP\s*SET/i.test(supper)) { currentGroupType = 'Drop Set'; groupNum++; continue; }
      if (/REGULAR\s*SET|STRAIGHT\s*SET/i.test(supper)) { currentGroupType = 'Regular Set'; groupNum++; continue; }

      if (supper.startsWith('WARM') || supper.startsWith('NOTE') || supper.startsWith('REST') || supper.startsWith('GRAVITY') || supper.startsWith('EXERCISE') || supper.includes('--')) continue;

      const numMatch = sline.match(/^([0-9]+[a-zA-Z]?[\.\)]?|[a-zA-Z][\.\)])\s+(.*)/);
      if (numMatch || sline.match(/\d+\s*x\s*[\d-]+/i)) {
        let exName = numMatch ? numMatch[2].trim() : sline;
        let reps = '3 sets · 10–12 reps';

        const repMatch = exName.match(/(\d+\s*x\s*[\d-]+.*|\d+\s*reps.*|\d+-\d+.*|\d+\s*min.*)/i);
        if (repMatch) {
          reps = repMatch[1].trim();
          exName = exName.replace(repMatch[0], '').trim();
        }

        exName = exName.replace(/^[-–:\s]+|[-–:\s]+$/g, '').trim();
        if (exName.length > 3 && !DAY_NAMES.includes(exName.toUpperCase())) {
          const isSuper = currentGroupType === 'Super Set';
          const isGiant = currentGroupType === 'Giant Set';

          exercises.push({
            name: exName,
            exerciseName: exName,
            primaryMuscle: getPrimaryMuscle(exName, sec.header),
            orderIndex: exercises.length,
            setGroupType: currentGroupType,
            groupNumber: groupNum,
            targetSets: 3,
            targetReps: 10,
            prescribedReps: reps,
            restSeconds: isSuper ? 0 : isGiant ? 0 : 60,
            restInstructions: isSuper
              ? 'No rest between exercises. Rest 60s after superset round.'
              : isGiant
              ? 'No rest between exercises. Rest 90s after giant set round.'
              : '60–90 sec rest between sets.',
            notes: `${currentGroupType} execution with strict form.`
          });

          if (currentGroupType === 'Regular Set') groupNum++;
        }
      }
    }

    return {
      header: sec.header,
      targetDow: sec.targetDow,
      exercises
    };
  });

  // 4. Map sections to the 7 days of the week (1=Mon ... 7=Sun)
  const daysMap = {};
  for (let dow = 1; dow <= 7; dow++) {
    daysMap[dow] = {
      id: `day-${dow}`,
      dayOfWeek: dow,
      dayName: DAY_FULL[dow - 1],
      title: weeklySchedule[dow] || `${DAY_FULL[dow - 1]} Training`,
      isRest: false,
      workoutType: 'RESISTANCE',
      muscleGroup: weeklySchedule[dow] || 'Resistance Training',
      exercises: []
    };
  }

  // A) Match sections with explicit targetDow
  const unassignedSections = [];
  extractedSections.forEach(sec => {
    if (sec.exercises.length === 0) return;

    if (Array.isArray(sec.targetDow)) {
      sec.targetDow.forEach(dow => {
        if (daysMap[dow].exercises.length === 0) {
          daysMap[dow].exercises = JSON.parse(JSON.stringify(sec.exercises));
          daysMap[dow].title = sec.header;
          daysMap[dow].muscleGroup = sec.header;
        }
      });
    } else if (sec.targetDow && sec.targetDow >= 1 && sec.targetDow <= 7) {
      if (daysMap[sec.targetDow].exercises.length === 0) {
        daysMap[sec.targetDow].exercises = JSON.parse(JSON.stringify(sec.exercises));
        daysMap[sec.targetDow].title = sec.header;
        daysMap[sec.targetDow].muscleGroup = sec.header;
      }
    } else {
      unassignedSections.push(sec);
    }
  });

  // B) Match remaining sections with weeklySchedule keywords
  const remainingUnassigned = [];
  unassignedSections.forEach(sec => {
    let matchedDow = null;
    const secUpper = sec.header.toUpperCase();

    for (let dow = 1; dow <= 7; dow++) {
      if (daysMap[dow].exercises.length > 0) continue;
      const sched = (weeklySchedule[dow] || '').toUpperCase();
      if (!sched || sched.includes('REST') || sched.includes('OFF')) continue;

      if (sched.includes(secUpper) || secUpper.includes(sched)) {
        matchedDow = dow;
        break;
      }
      const secKeywords = secUpper.split(/[\s&,+/-]+/).filter(w => w.length > 3);
      if (secKeywords.some(k => sched.includes(k))) {
        matchedDow = dow;
        break;
      }
    }

    if (matchedDow) {
      daysMap[matchedDow].exercises = JSON.parse(JSON.stringify(sec.exercises));
      daysMap[matchedDow].title = sec.header;
      daysMap[matchedDow].muscleGroup = sec.header;
    } else {
      remainingUnassigned.push(sec);
    }
  });

  // C) Place any remaining unassigned sections sequentially into empty non-rest days
  remainingUnassigned.forEach(sec => {
    for (let dow = 1; dow <= 6; dow++) {
      if (daysMap[dow].exercises.length === 0) {
        const sched = (weeklySchedule[dow] || '').toUpperCase();
        if (!sched.includes('REST') && !sched.includes('OFF')) {
          daysMap[dow].exercises = JSON.parse(JSON.stringify(sec.exercises));
          daysMap[dow].title = sec.header;
          daysMap[dow].muscleGroup = sec.header;
          break;
        }
      }
    }
  });

  // Mark empty days as Rest/Recovery
  for (let dow = 1; dow <= 7; dow++) {
    if (daysMap[dow].exercises.length === 0) {
      daysMap[dow].isRest = true;
      daysMap[dow].workoutType = 'RECOVERY';
      daysMap[dow].title = weeklySchedule[dow] || 'Rest & Recovery';
      daysMap[dow].muscleGroup = 'Active Regeneration & Mobility';
    }
  }

  return Object.values(daysMap);
}

// Read 6-Week Shredded days from exported split json
const CANONICAL_6_WEEK_SPLIT = JSON.parse(fs.readFileSync(path.join(__dirname, 'shredded-split.json'), 'utf8'));

async function build() {
  console.log('Generating complete GRAVITY Program Catalog from source files...');

  const content = fs.readFileSync(path.join(__dirname, 'extract-and-build-catalog.js'), 'utf8');
  const pDefsMatch = content.match(/const programDefinitions = (\[[\s\S]*?\n  \];)/);
  if (!pDefsMatch) throw new Error('Could not read programDefinitions');
  const programDefs = eval(pDefsMatch[1]);

  const structuredPrograms = [];
  let totalEx = 0;
  let totalMeals = 0;

  for (const def of programDefs) {
    const category = CATEGORIES.find(c => c.id === def.categoryId) || CATEGORIES[0];
    const sourceDocs = [];
    const nutritionPlans = [];
    let workoutDays = [];

    // Check special case for 6-Week Shredded
    if (def.slug === '6-week-shredded') {
      workoutDays = CANONICAL_6_WEEK_SPLIT.map(d => ({
        id: `day-${d.dayOfWeek}`,
        dayOfWeek: d.dayOfWeek,
        dayName: d.dayName,
        title: d.title,
        isRest: d.workoutType === 'RECOVERY',
        workoutType: d.workoutType,
        muscleGroup: Array.isArray(d.muscleGroups) ? d.muscleGroups.join(', ') : (d.title || 'Resistance Training'),
        exercises: d.prescriptions.map((p, pIdx) => ({
          id: `ex-${d.dayOfWeek}-${pIdx + 1}`,
          name: p.exerciseName,
          exerciseName: p.exerciseName,
          primaryMuscle: p.primaryMuscle,
          orderIndex: pIdx,
          setGroupType: p.setGroupType,
          groupNumber: p.groupNumber,
          targetSets: p.targetSets,
          targetReps: p.targetReps,
          prescribedReps: p.prescribedReps,
          restSeconds: p.restSeconds,
          restInstructions: p.restInstructions || (p.restSeconds > 0 ? `${p.restSeconds}s rest` : 'No rest between exercises'),
          notes: p.notes || p.workoutInstructions || 'Execute with strict technique.'
        }))
      }));
    }

    for (const filename of def.files) {
      const txtPath = path.join(TEXTS_DIR, `${filename}.txt`);
      if (!fs.existsSync(txtPath)) continue;
      const rawText = fs.readFileSync(txtPath, 'utf8');

      const isWorkout = filename.toLowerCase().includes('workout') || filename.toLowerCase().includes('exercise') || filename.toLowerCase().includes('ebook');
      const isNutrition = filename.toLowerCase().includes('nutrition') || filename.toLowerCase().includes('diet') || filename.toLowerCase().includes('ebook');

      sourceDocs.push({
        id: `doc-${filename.slice(0, 10)}`,
        title: cleanText(filename.replace(/_/g, ' ').replace(/\.pdf$/i, '')),
        documentType: isWorkout ? 'WORKOUT' : 'NUTRITION'
      });

      if (isNutrition || rawText.includes('MEAL') || rawText.includes('Meal')) {
        const meals = parseNutritionMeals(rawText);
        if (meals.length > 0) {
          nutritionPlans.push({
            id: `nutr-${def.slug}-${nutritionPlans.length + 1}`,
            planName: `${def.name} Targeted Nutrition Protocol`,
            targetAudience: filename.toLowerCase().includes('women') ? 'Female' : 'All',
            totalCalories: meals.reduce((acc, m) => acc + (m.calories || 0), 0) || 2400,
            proteinGrams: meals.reduce((acc, m) => acc + (m.proteinGrams || 0), 0) || 180,
            carbGrams: meals.reduce((acc, m) => acc + (m.carbGrams || 0), 0) || 240,
            fatGrams: meals.reduce((acc, m) => acc + (m.fatGrams || 0), 0) || 60,
            meals
          });
          totalMeals += meals.length;
        }
      }

      if (workoutDays.length === 0 && (isWorkout || def.workoutDaysPerWeek > 0)) {
        const parsed = parseWorkoutDays(rawText, def.goal, def.name);
        const nonRest = parsed.filter(d => !d.isRest && d.exercises.length > 0);
        if (nonRest.length > 0) {
          workoutDays = parsed;
        }
      }
    }

    // Default 7 days if purely nutrition program
    if (workoutDays.length === 0) {
      for (let dow = 1; dow <= 7; dow++) {
        workoutDays.push({
          id: `day-${dow}`,
          dayOfWeek: dow,
          dayName: DAY_FULL[dow - 1],
          title: 'Rest & Recovery',
          isRest: true,
          workoutType: 'RECOVERY',
          muscleGroup: 'Active Regeneration',
          exercises: []
        });
      }
    }

    const exCount = workoutDays.reduce((acc, d) => acc + d.exercises.length, 0);
    totalEx += exCount;

    const weeksCount = def.name === '6 Week Shredded' ? 12 : (parseInt(def.duration, 10) || 8);

    const programObj = {
      id: `prog-${def.slug}`,
      name: def.name,
      slug: def.slug,
      categoryId: def.categoryId,
      categoryName: category.name,
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
    console.log(`[${category.name}] ${def.name}: ${workoutDays.filter(d => !d.isRest && d.exercises.length > 0).length} training days, ${exCount} exercises, ${nutritionPlans.length} nutrition plans`);
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    totalCategories: CATEGORIES.length,
    totalPrograms: structuredPrograms.length,
    categories: CATEGORIES,
    programs: structuredPrograms
  };

  const catalogJson = JSON.stringify(catalog, null, 2);
  fs.writeFileSync(path.join(CATALOG_DIR, 'program-catalog.json'), catalogJson, 'utf8');
  fs.writeFileSync(path.join(__dirname, '../../apps/mobile/src/data/program-catalog.json'), catalogJson, 'utf8');
  fs.writeFileSync(path.join(__dirname, '../../apps/web/src/data/program-catalog.json'), catalogJson, 'utf8');

  console.log(`\n🎉 SUCCESS! Generated ${structuredPrograms.length} programs with ${totalEx} exercises and ${totalMeals} meals!`);
}

build().catch(console.error);
