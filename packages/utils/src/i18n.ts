export type SupportedLocale = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ar';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'hi', 'es', 'fr', 'de', 'ar'] as const;
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  defaultCurrency: string;
}

export const LOCALE_METADATA: Record<SupportedLocale, LocaleMetadata> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    defaultCurrency: 'USD',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    defaultCurrency: 'INR',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    defaultCurrency: 'EUR',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    defaultCurrency: 'EUR',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    defaultCurrency: 'EUR',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    defaultCurrency: 'AED',
  },
};

export type TranslationDictionary = Record<string, Record<string, string>>;

export const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    auth: {
      welcome: 'Welcome to ALPHA — Your Higher Self',
      login: 'Log In',
      register: 'Create Account',
      logout: 'Log Out',
      email: 'Email Address',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      unauthorized: 'Authentication required to access this resource',
      sessionExpired: 'Your session has expired. Please log in again.',
    },
    workout: {
      title: 'Workout Session',
      startWorkout: 'Start Workout',
      finishWorkout: 'Finish Workout',
      restTimer: 'Rest Timer: {seconds}s',
      setNumber: 'Set {set}',
      reps: '{count} reps',
      reps_one: '1 rep',
      reps_other: '{count} reps',
      weight: '{weight} kg',
      weightImperial: '{weight} lbs',
      targetMuscles: 'Target Muscle Groups: {muscles}',
      volumeTotal: 'Total Volume: {volume} {unit}',
    },
    nutrition: {
      title: 'Fuel & Nutrition',
      calories: 'Calories',
      caloriesRemaining: '{calories} kcal remaining',
      protein: 'Protein',
      carbs: 'Carbohydrates',
      fats: 'Fats',
      logMeal: 'Log Meal',
      waterIntake: 'Hydration: {liters} L',
      macroSplit: 'Macros: {protein}g P / {carbs}g C / {fats}g F',
    },
    activity: {
      title: 'Activity & Cardio',
      dailySteps: 'Daily Steps',
      stepGoal: '{current} / {goal} steps',
      distance: 'Distance: {distance} {unit}',
      pace: 'Pace: {pace} /km',
      heartRate: 'Heart Rate: {bpm} BPM',
      caloriesBurned: 'Active Burn: {calories} kcal',
    },
    progress: {
      title: 'Progress & Analytics',
      bodyWeight: 'Body Weight',
      currentWeight: 'Current: {weight} {unit}',
      weightChange: '{delta} {unit} this month',
      streak: '{count} Day Streak',
      streak_one: '1 Day Streak',
      streak_other: '{count} Day Streak',
      readiness: 'Readiness Score: {score}%',
      benchmark: 'Benchmark Progression',
    },
    ai: {
      title: 'AI Coach',
      coachGreeting: 'Hello {name}, ready for peak performance today?',
      adaptiveRecommendation: 'Based on your readiness score of {score}%, recovery intensity is advised.',
      generatePlan: 'Generate Optimized Protocol',
      analyzingTelemetry: 'Analyzing biometric telemetry...',
    },
    coach: {
      title: 'Coach Portal',
      roster: 'Athlete Roster ({count})',
      roster_one: '1 Athlete',
      roster_other: '{count} Athletes',
      prescribePlan: 'Prescribe Protocol',
      clientProgress: 'Client Telemetry for {client}',
    },
    organization: {
      title: 'Enterprise Management',
      orgName: 'Organization: {name}',
      tier: 'Enterprise Tier: {tier}',
      memberCount: '{count} Members',
      memberCount_one: '1 Member',
      memberCount_other: '{count} Members',
    },
    notifications: {
      title: 'Notifications',
      workoutReminder: 'Time for your scheduled {workout} session!',
      hydrationReminder: "Hydration check: drink a glass of water now.",
      restReminder: 'Rest interval complete. Begin next set.',
    },
    settings: {
      title: 'System Preferences',
      language: 'Language',
      timezone: 'Timezone',
      units: 'Units of Measurement',
      metric: 'Metric (kg, cm, km)',
      imperial: 'Imperial (lb, in, mi)',
      theme: 'Visual Theme',
      saveChanges: 'Save Preferences',
    },
    errors: {
      notFound: 'Resource not found',
      forbidden: 'Access denied: insufficient permissions',
      badRequest: 'Invalid input parameters provided',
      serverError: 'Internal server error. Telemetry incident logged.',
      networkError: 'Unable to connect to ALPHA telemetry cloud.',
    },
  },

  hi: {
    auth: {
      welcome: 'अल्फा (ALPHA) में आपका स्वागत है — आपका उच्चतर स्वरूप',
      login: 'लॉग इन करें',
      register: 'खाता बनाएं',
      logout: 'लॉग आउट',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      forgotPassword: 'पासवर्ड भूल गए?',
      resetPassword: 'पासवर्ड रीसेट करें',
      unauthorized: 'इस संसाधन तक पहुंचने के लिए प्रमाणीकरण आवश्यक है',
      sessionExpired: 'आपका सत्र समाप्त हो गया है। कृपया पुनः लॉग इन करें।',
    },
    workout: {
      title: 'व्यायाम सत्र',
      startWorkout: 'व्यायाम शुरू करें',
      finishWorkout: 'व्यायाम समाप्त करें',
      restTimer: 'विश्राम टाइमर: {seconds} सेकंड',
      setNumber: 'सेट {set}',
      reps: '{count} रेप्स',
      reps_one: '1 रेप',
      reps_other: '{count} रेप्स',
      weight: '{weight} किग्रा',
      weightImperial: '{weight} पाउंड',
      targetMuscles: 'लक्षित मांसपेशियां: {muscles}',
      volumeTotal: 'कुल वॉल्यूम: {volume} {unit}',
    },
    nutrition: {
      title: 'पोषण और आहार',
      calories: 'कैलोरी',
      caloriesRemaining: '{calories} किलोकैलोरी शेष',
      protein: 'प्रोटीन',
      carbs: 'कार्बोहाइड्रेट',
      fats: 'वसा',
      logMeal: 'भोजन दर्ज करें',
      waterIntake: 'जलयोजन: {liters} ली',
      macroSplit: 'मैक्रोज़: {protein}ग्रा प्रोटीन / {carbs}ग्रा कार्ब्स / {fats}ग्रा फैट',
    },
    activity: {
      title: 'सक्रियता और कार्डियो',
      dailySteps: 'दैनिक कदम',
      stepGoal: '{current} / {goal} कदम',
      distance: 'दूरी: {distance} {unit}',
      pace: 'गति: {pace} /किमी',
      heartRate: 'हृदय गति: {bpm} बीपीएम',
      caloriesBurned: 'सक्रिय कैलोरी: {calories} किलोकैलोरी',
    },
    progress: {
      title: 'प्रगति और विश्लेषण',
      bodyWeight: 'शरीर का वजन',
      currentWeight: 'वर्तमान: {weight} {unit}',
      weightChange: 'इस महीने {delta} {unit}',
      streak: '{count} दिनों का स्ट्रीक',
      streak_one: '1 दिन का स्ट्रीक',
      streak_other: '{count} दिनों का स्ट्रीक',
      readiness: 'तैयारी स्कोर: {score}%',
      benchmark: 'मानक प्रगति',
    },
    ai: {
      title: 'एआई कोच',
      coachGreeting: 'नमस्ते {name}, क्या आप आज सर्वश्रेष्ठ प्रदर्शन के लिए तैयार हैं?',
      adaptiveRecommendation: 'आपके {score}% तैयारी स्कोर के आधार पर, रिकवरी तीव्रता की सलाह दी जाती है।',
      generatePlan: 'अनुकूलित प्रोटोकॉल बनाएं',
      analyzingTelemetry: 'बायोमेट्रिक टेलीमेट्री का विश्लेषण हो रहा है...',
    },
    coach: {
      title: 'कोच पोर्टल',
      roster: 'एथलीट रोस्टर ({count})',
      roster_one: '1 एथलीट',
      roster_other: '{count} एथलीट',
      prescribePlan: 'प्रोटोकॉल निर्धारित करें',
      clientProgress: '{client} के लिए क्लाइंट टेलीमेट्री',
    },
    organization: {
      title: 'उद्यम प्रबंधन',
      orgName: 'संस्था: {name}',
      tier: 'एंटरप्राइज टियर: {tier}',
      memberCount: '{count} सदस्य',
      memberCount_one: '1 सदस्य',
      memberCount_other: '{count} सदस्य',
    },
    notifications: {
      title: 'सूचनाएं',
      workoutReminder: 'आपके निर्धारित {workout} सत्र का समय हो गया है!',
      hydrationReminder: 'पानी पीने का समय: कृपया एक गिलास पानी पिएं।',
      restReminder: 'विश्राम पूरा हुआ। अगला सेट शुरू करें।',
    },
    settings: {
      title: 'सिस्टम प्राथमिकताएं',
      language: 'भाषा',
      timezone: 'समय क्षेत्र',
      units: 'माप की इकाइयां',
      metric: 'मीट्रिक (किग्रा, सेमी, किमी)',
      imperial: 'इंपीरियल (पाउंड, इंच, मील)',
      theme: 'दृश्य थीम',
      saveChanges: 'प्राथमिकताएं सहेजें',
    },
    errors: {
      notFound: 'संसाधन नहीं मिला',
      forbidden: 'पहुंच अस्वीकृत: अपर्याप्त अनुमतियां',
      badRequest: 'अमान्य इनपुट पैरामीटर प्रदान किए गए',
      serverError: 'आंतरिक सर्वर त्रुटि। टेलीमेट्री लॉग की गई।',
      networkError: 'अल्फा टेलीमेट्री क्लाउड से कनेक्ट करने में असमर्थ।',
    },
  },

  es: {
    auth: {
      welcome: 'Bienvenido a ALPHA — Tu Yo Superior',
      login: 'Iniciar Sesión',
      register: 'Crear Cuenta',
      logout: 'Cerrar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer Contraseña',
      unauthorized: 'Se requiere autenticación para acceder a este recurso',
      sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
    },
    workout: {
      title: 'Sesión de Entrenamiento',
      startWorkout: 'Iniciar Entrenamiento',
      finishWorkout: 'Finalizar Entrenamiento',
      restTimer: 'Descanso: {seconds}s',
      setNumber: 'Serie {set}',
      reps: '{count} repeticiones',
      reps_one: '1 repetición',
      reps_other: '{count} repeticiones',
      weight: '{weight} kg',
      weightImperial: '{weight} lbs',
      targetMuscles: 'Grupos Musculares: {muscles}',
      volumeTotal: 'Volumen Total: {volume} {unit}',
    },
    nutrition: {
      title: 'Nutrición y Energía',
      calories: 'Calorías',
      caloriesRemaining: '{calories} kcal restantes',
      protein: 'Proteína',
      carbs: 'Carbohidratos',
      fats: 'Grasas',
      logMeal: 'Registrar Comida',
      waterIntake: 'Hidratación: {liters} L',
      macroSplit: 'Macros: {protein}g P / {carbs}g C / {fats}g G',
    },
    activity: {
      title: 'Actividad y Cardio',
      dailySteps: 'Pasos Diarios',
      stepGoal: '{current} / {goal} pasos',
      distance: 'Distancia: {distance} {unit}',
      pace: 'Ritmo: {pace} /km',
      heartRate: 'Frecuencia Cardíaca: {bpm} PPM',
      caloriesBurned: 'Calorías Activas: {calories} kcal',
    },
    progress: {
      title: 'Progreso y Analítica',
      bodyWeight: 'Peso Corporal',
      currentWeight: 'Actual: {weight} {unit}',
      weightChange: '{delta} {unit} este mes',
      streak: 'Racha de {count} Días',
      streak_one: 'Racha de 1 Día',
      streak_other: 'Racha de {count} Días',
      readiness: 'Nivel de Disposición: {score}%',
      benchmark: 'Progresión de Rendimiento',
    },
    ai: {
      title: 'Entrenador IA',
      coachGreeting: 'Hola {name}, ¿listo para alcanzar tu máximo rendimiento hoy?',
      adaptiveRecommendation: 'Con base en tu disposición del {score}%, recomendamos una sesión regenerativa.',
      generatePlan: 'Generar Protocolo Optimizado',
      analyzingTelemetry: 'Analizando telemetría biométrica...',
    },
    coach: {
      title: 'Portal del Entrenador',
      roster: 'Lista de Atletas ({count})',
      roster_one: '1 Atleta',
      roster_other: '{count} Atletas',
      prescribePlan: 'Prescribir Protocolo',
      clientProgress: 'Telemetría de cliente para {client}',
    },
    organization: {
      title: 'Gestión Empresarial',
      orgName: 'Organización: {name}',
      tier: 'Nivel Empresarial: {tier}',
      memberCount: '{count} Miembros',
      memberCount_one: '1 Miembro',
      memberCount_other: '{count} Miembros',
    },
    notifications: {
      title: 'Notificaciones',
      workoutReminder: '¡Hora de tu sesión programada de {workout}!',
      hydrationReminder: 'Control de hidratación: bebe un vaso de agua ahora.',
      restReminder: 'Intervalo de descanso completado. Comienza la siguiente serie.',
    },
    settings: {
      title: 'Preferencias del Sistema',
      language: 'Idioma',
      timezone: 'Zona Horaria',
      units: 'Unidades de Medida',
      metric: 'Métrico (kg, cm, km)',
      imperial: 'Imperial (lb, in, mi)',
      theme: 'Tema Visual',
      saveChanges: 'Guardar Preferencias',
    },
    errors: {
      notFound: 'Recurso no encontrado',
      forbidden: 'Acceso denegado: permisos insuficientes',
      badRequest: 'Parámetros de entrada inválidos',
      serverError: 'Error interno del servidor. Incidente de telemetría registrado.',
      networkError: 'No se pudo conectar a la nube de telemetría ALPHA.',
    },
  },

  fr: {
    auth: {
      welcome: 'Bienvenue sur ALPHA — Votre Moi Supérieur',
      login: 'Se connecter',
      register: 'Créer un compte',
      logout: 'Se déconnecter',
      email: 'Adresse e-mail',
      password: 'Mot de passe',
      forgotPassword: 'Mot de passe oublié ?',
      resetPassword: 'Réinitialiser le mot de passe',
      unauthorized: 'Authentification requise pour accéder à cette ressource',
      sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.',
    },
    workout: {
      title: "Séance d'entraînement",
      startWorkout: "Commencer l'entraînement",
      finishWorkout: "Terminer l'entraînement",
      restTimer: 'Repos : {seconds}s',
      setNumber: 'Série {set}',
      reps: '{count} répétitions',
      reps_one: '1 répétition',
      reps_other: '{count} répétitions',
      weight: '{weight} kg',
      weightImperial: '{weight} lbs',
      targetMuscles: 'Groupes musculaires ciblés : {muscles}',
      volumeTotal: 'Volume total : {volume} {unit}',
    },
    nutrition: {
      title: 'Nutrition et Énergie',
      calories: 'Calories',
      caloriesRemaining: '{calories} kcal restantes',
      protein: 'Protéines',
      carbs: 'Glucides',
      fats: 'Lipides',
      logMeal: 'Enregistrer un repas',
      waterIntake: 'Hydratation : {liters} L',
      macroSplit: 'Macros : {protein}g P / {carbs}g G / {fats}g L',
    },
    activity: {
      title: 'Activité et Cardio',
      dailySteps: 'Pas quotidiens',
      stepGoal: '{current} / {goal} pas',
      distance: 'Distance : {distance} {unit}',
      pace: 'Allure : {pace} /km',
      heartRate: 'Fréquence cardiaque : {bpm} BPM',
      caloriesBurned: 'Dépense active : {calories} kcal',
    },
    progress: {
      title: 'Progrès et Analyses',
      bodyWeight: 'Poids corporel',
      currentWeight: 'Actuel : {weight} {unit}',
      weightChange: '{delta} {unit} ce mois-ci',
      streak: 'Série de {count} Jours',
      streak_one: 'Série de 1 Jour',
      streak_other: 'Série de {count} Jours',
      readiness: 'Score de préparation : {score}%',
      benchmark: 'Progression de référence',
    },
    ai: {
      title: 'Coach IA',
      coachGreeting: 'Bonjour {name}, prêt pour une performance optimale aujourd’hui ?',
      adaptiveRecommendation: 'Selon votre score de préparation de {score}%, une intensité de récupération est conseillée.',
      generatePlan: 'Générer le protocole optimisé',
      analyzingTelemetry: 'Analyse de la télémétrie biométrique...',
    },
    coach: {
      title: 'Portail Entraîneur',
      roster: 'Liste des athlètes ({count})',
      roster_one: '1 Athlète',
      roster_other: '{count} Athlètes',
      prescribePlan: 'Prescrire un protocole',
      clientProgress: 'Télémétrie client pour {client}',
    },
    organization: {
      title: 'Gestion d’Entreprise',
      orgName: 'Organisation : {name}',
      tier: 'Niveau Entreprise : {tier}',
      memberCount: '{count} Membres',
      memberCount_one: '1 Membre',
      memberCount_other: '{count} Membres',
    },
    notifications: {
      title: 'Notifications',
      workoutReminder: 'C’est l’heure de votre séance de {workout} !',
      hydrationReminder: 'Rappel hydratation : buvez un verre d’eau maintenant.',
      restReminder: 'Intervalle de repos terminé. Commencez la série suivante.',
    },
    settings: {
      title: 'Préférences Système',
      language: 'Langue',
      timezone: 'Fuseau horaire',
      units: 'Unités de mesure',
      metric: 'Métrique (kg, cm, km)',
      imperial: 'Impérial (lb, in, mi)',
      theme: 'Thème visuel',
      saveChanges: 'Enregistrer les préférences',
    },
    errors: {
      notFound: 'Ressource introuvable',
      forbidden: 'Accès refusé : autorisations insuffisantes',
      badRequest: 'Paramètres d’entrée non valides',
      serverError: 'Erreur interne du serveur. Incident de télémétrie consigné.',
      networkError: 'Connexion impossible au cloud télémétrique ALPHA.',
    },
  },

  de: {
    auth: {
      welcome: 'Willkommen bei ALPHA — Dein Höheres Selbst',
      login: 'Anmelden',
      register: 'Konto erstellen',
      logout: 'Abmelden',
      email: 'E-Mail-Adresse',
      password: 'Passwort',
      forgotPassword: 'Passwort vergessen?',
      resetPassword: 'Passwort zurücksetzen',
      unauthorized: 'Authentifizierung erforderlich, um auf diese Ressource zuzugreifen',
      sessionExpired: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
    },
    workout: {
      title: 'Trainingseinheit',
      startWorkout: 'Training starten',
      finishWorkout: 'Training beenden',
      restTimer: 'Pause: {seconds}s',
      setNumber: 'Satz {set}',
      reps: '{count} Wdh.',
      reps_one: '1 Wdh.',
      reps_other: '{count} Wdh.',
      weight: '{weight} kg',
      weightImperial: '{weight} lbs',
      targetMuscles: 'Zielmuskelgruppen: {muscles}',
      volumeTotal: 'Gesamtvolumen: {volume} {unit}',
    },
    nutrition: {
      title: 'Ernährung & Energie',
      calories: 'Kalorien',
      caloriesRemaining: '{calories} kcal verbleibend',
      protein: 'Protein',
      carbs: 'Kohlenhydrate',
      fats: 'Fette',
      logMeal: 'Mahlzeit erfassen',
      waterIntake: 'Hydratation: {liters} L',
      macroSplit: 'Makros: {protein}g P / {carbs}g K / {fats}g F',
    },
    activity: {
      title: 'Aktivität & Cardio',
      dailySteps: 'Tägliche Schritte',
      stepGoal: '{current} / {goal} Schritte',
      distance: 'Distanz: {distance} {unit}',
      pace: 'Pace: {pace} /km',
      heartRate: 'Herzfrequenz: {bpm} BPM',
      caloriesBurned: 'Aktiv verbrannt: {calories} kcal',
    },
    progress: {
      title: 'Fortschritt & Analytik',
      bodyWeight: 'Körpergewicht',
      currentWeight: 'Aktuell: {weight} {unit}',
      weightChange: '{delta} {unit} diesen Monat',
      streak: '{count}-Tage-Serie',
      streak_one: '1-Tag-Serie',
      streak_other: '{count}-Tage-Serie',
      readiness: 'Bereitschaftswert: {score}%',
      benchmark: 'Leistungsprogression',
    },
    ai: {
      title: 'KI-Coach',
      coachGreeting: 'Hallo {name}, bereit für Höchstleistungen heute?',
      adaptiveRecommendation: 'Basierend auf deinem Bereitschaftswert von {score}% wird regenerative Intensität empfohlen.',
      generatePlan: 'Optimiertes Protokoll erstellen',
      analyzingTelemetry: 'Biometrische Telemetrie wird analysiert...',
    },
    coach: {
      title: 'Trainer-Portal',
      roster: 'Athleten-Kader ({count})',
      roster_one: '1 Athlet',
      roster_other: '{count} Athleten',
      prescribePlan: 'Protokoll verordnen',
      clientProgress: 'Kunden-Telemetrie für {client}',
    },
    organization: {
      title: 'Unternehmensverwaltung',
      orgName: 'Organisation: {name}',
      tier: 'Unternehmensstufe: {tier}',
      memberCount: '{count} Mitglieder',
      memberCount_one: '1 Mitglied',
      memberCount_other: '{count} Mitglieder',
    },
    notifications: {
      title: 'Benachrichtigungen',
      workoutReminder: 'Zeit für dein geplantes Training: {workout}!',
      hydrationReminder: 'Flüssigkeitserinnerung: Trinke jetzt ein Glas Wasser.',
      restReminder: 'Pausenintervall abgeschlossen. Starte den nächsten Satz.',
    },
    settings: {
      title: 'Systemeinstellungen',
      language: 'Sprache',
      timezone: 'Zeitzone',
      units: 'Maßeinheiten',
      metric: 'Metrisch (kg, cm, km)',
      imperial: 'Imperial (lb, in, mi)',
      theme: 'Visuelles Thema',
      saveChanges: 'Einstellungen speichern',
    },
    errors: {
      notFound: 'Ressource nicht gefunden',
      forbidden: 'Zugriff verweigert: Unzureichende Berechtigungen',
      badRequest: 'Ungültige Eingabeparameter übergeben',
      serverError: 'Interner Serverfehler. Telemetrie-Vorfall protokolliert.',
      networkError: 'Verbindung zur ALPHA Telemetrie-Cloud fehlgeschlagen.',
    },
  },

  ar: {
    auth: {
      welcome: 'مرحبًا بك في ألفا (ALPHA) — ذاتك الأسمى',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      forgotPassword: 'هل نسيت كلمة المرور؟',
      resetPassword: 'إعادة تعيين كلمة المرور',
      unauthorized: 'المصادقة مطلوبة للوصول إلى هذا المورد',
      sessionExpired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
    },
    workout: {
      title: 'جلسة التمرين',
      startWorkout: 'بدء التمرين',
      finishWorkout: 'إنهاء التمرين',
      restTimer: 'مؤقت الراحة: {seconds} ثانية',
      setNumber: 'الجولة {set}',
      reps: '{count} تكرارات',
      reps_one: 'تكرار واحد',
      reps_other: '{count} تكرارات',
      weight: '{weight} كجم',
      weightImperial: '{weight} رطل',
      targetMuscles: 'المجموعات العضلية المستهدفة: {muscles}',
      volumeTotal: 'إجمالي الحجم التدريبي: {volume} {unit}',
    },
    nutrition: {
      title: 'التغذية والطاقة',
      calories: 'السعرات الحرارية',
      caloriesRemaining: '{calories} سعرة حرارية متبقية',
      protein: 'البروتين',
      carbs: 'الكربوهيدرات',
      fats: 'الدهون',
      logMeal: 'تسجيل وجبة',
      waterIntake: 'الترطيب: {liters} لتر',
      macroSplit: 'المغذيات: {protein}غ ب / {carbs}غ ك / {fats}غ د',
    },
    activity: {
      title: 'النشاط واللياقة القلبية',
      dailySteps: 'الخطوات اليومية',
      stepGoal: '{current} / {goal} خطوة',
      distance: 'المسافة: {distance} {unit}',
      pace: 'السرعة: {pace} /كم',
      heartRate: 'معدل نبضات القلب: {bpm} نبضة/دقيقة',
      caloriesBurned: 'الحرق النشط: {calories} سعرة حرارية',
    },
    progress: {
      title: 'التقدم والتحليلات',
      bodyWeight: 'وزن الجسم',
      currentWeight: 'الحالي: {weight} {unit}',
      weightChange: '{delta} {unit} هذا الشهر',
      streak: 'سلسلة متواصلة لمدة {count} أيام',
      streak_one: 'يوم واحد متواصل',
      streak_other: 'سلسلة متواصلة لمدة {count} أيام',
      readiness: 'مستوى الجاهزية: {score}%',
      benchmark: 'تطور الأداء القياسي',
    },
    ai: {
      title: 'المدرب الذكي',
      coachGreeting: 'أهلاً {name}، هل أنت جاهز للوصول إلى أقصى أداء اليوم؟',
      adaptiveRecommendation: 'بناءً على درجة جاهزيتك البالغة {score}%، نوصي بجلسة تعافي معتدلة.',
      generatePlan: 'توليد البروتوكول المخصص',
      analyzingTelemetry: 'جارٍ تحليل القياسات الحيوية...',
    },
    coach: {
      title: 'بوابة المدرب',
      roster: 'قائمة الرياضيين ({count})',
      roster_one: 'رياضي واحد',
      roster_other: '{count} رياضيين',
      prescribePlan: 'تحديد بروتوكول تدريبي',
      clientProgress: 'القياسات الحيوية للعميل {client}',
    },
    organization: {
      title: 'إدارة المؤسسات',
      orgName: 'المؤسسة: {name}',
      tier: 'فئة المؤسسة: {tier}',
      memberCount: '{count} أعضاء',
      memberCount_one: 'عضو واحد',
      memberCount_other: '{count} أعضاء',
    },
    notifications: {
      title: 'الإشعارات',
      workoutReminder: 'حان وقت جلسة {workout} المجدولة!',
      hydrationReminder: 'تذكير بالترطيب: اشرب كوبًا من الماء الآن.',
      restReminder: 'اكتمل وقت الراحة. ابدأ الجولة التالية.',
    },
    settings: {
      title: 'تفضيلات النظام',
      language: 'اللغة',
      timezone: 'المنطقة الزمنية',
      units: 'وحدات القياس',
      metric: 'متري (كجم، سم، كم)',
      imperial: 'إمبراطوري (رطل، بوصة، ميل)',
      theme: 'المظهر البصري',
      saveChanges: 'حفظ التفضيلات',
    },
    errors: {
      notFound: 'المورد غير موجود',
      forbidden: 'تم رفض الوصول: أذونات غير كافية',
      badRequest: 'المعلمات المدخلة غير صالحة',
      serverError: 'خطأ داخلي في الخادم. تم تسجيل الحادث في القياسات.',
      networkError: 'تعذر الاتصال بسحابة القياسات الحيوية لـ ALPHA.',
    },
  },
};

/**
 * Universal Translation & Localization Engine
 */
export class I18nEngine {
  private currentLocale: SupportedLocale = DEFAULT_LOCALE;

  constructor(initialLocale: SupportedLocale = DEFAULT_LOCALE) {
    this.setLocale(initialLocale);
  }

  setLocale(locale: string): void {
    const normalized = I18nEngine.normalizeLocale(locale);
    this.currentLocale = normalized;
  }

  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  static normalizeLocale(locale?: string): SupportedLocale {
    if (!locale) return DEFAULT_LOCALE;
    const clean = locale.toLowerCase().split(/[-_]/)[0] as SupportedLocale;
    if (SUPPORTED_LOCALES.includes(clean)) {
      return clean;
    }
    return DEFAULT_LOCALE;
  }

  static isRTL(locale?: string): boolean {
    const norm = I18nEngine.normalizeLocale(locale);
    return LOCALE_METADATA[norm]?.direction === 'rtl';
  }

  static getTextDirection(locale?: string): 'rtl' | 'ltr' {
    return I18nEngine.isRTL(locale) ? 'rtl' : 'ltr';
  }

  /**
   * Translate key with fallback chain:
   * 1. Requested Locale -> key
   * 2. Default English -> key
   * 3. Raw Key as safe fallback
   */
  t(
    keyPath: string,
    params?: Record<string, string | number>,
    localeOverride?: string,
  ): string {
    const locale = localeOverride
      ? I18nEngine.normalizeLocale(localeOverride)
      : this.currentLocale;

    const [namespace, key] = keyPath.split('.');
    if (!namespace || !key) {
      return keyPath;
    }

    // Check pluralization variant if params?.count is provided
    let lookupKey = key;
    if (params && typeof params.count === 'number') {
      const pluralSuffix = params.count === 1 ? '_one' : '_other';
      const candidateKey = `${key}${pluralSuffix}`;
      if (
        TRANSLATIONS[locale]?.[namespace]?.[candidateKey] ||
        TRANSLATIONS[DEFAULT_LOCALE]?.[namespace]?.[candidateKey]
      ) {
        lookupKey = candidateKey;
      }
    }

    // Lookup with fallback
    let template = TRANSLATIONS[locale]?.[namespace]?.[lookupKey];
    if (!template && locale !== DEFAULT_LOCALE) {
      template = TRANSLATIONS[DEFAULT_LOCALE]?.[namespace]?.[lookupKey];
    }
    if (!template) {
      // Try un-pluralized key if plural wasn't found
      template = TRANSLATIONS[locale]?.[namespace]?.[key] ||
                 TRANSLATIONS[DEFAULT_LOCALE]?.[namespace]?.[key] ||
                 keyPath;
    }

    // Interpolation
    if (params) {
      return template.replace(/\{(\w+)\}/g, (_, token) => {
        return params[token] !== undefined ? String(params[token]) : `{${token}}`;
      });
    }

    return template;
  }
}

export const i18n = new I18nEngine(DEFAULT_LOCALE);
