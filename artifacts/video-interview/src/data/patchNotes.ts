export interface PatchNote {
  version: string;
  date: string;
  title: { it: string; en: string; es: string; zh: string };
  changes: {
    type: "new" | "improved" | "fixed";
    text: { it: string; en: string; es: string; zh: string };
  }[];
}

export const patchNotes: PatchNote[] = [
  {
    version: "1.6.0",
    date: "2026-04-01",
    title: {
      it: "Annunci LinkedIn e Gestione HR Avanzata",
      en: "LinkedIn-style Listings & Advanced HR Management",
      es: "Anuncios estilo LinkedIn y Gestión HR Avanzada",
      zh: "LinkedIn风格职位列表与高级HR管理",
    },
    changes: [
      {
        type: "new",
        text: {
          it: "Annunci posizioni stile LinkedIn — azienda, sede, modalità lavoro, requisiti, stipendio e benefit",
          en: "LinkedIn-style position listings — company, location, work mode, requirements, salary and benefits",
          es: "Anuncios de posiciones estilo LinkedIn — empresa, ubicación, modalidad, requisitos, salario y beneficios",
          zh: "LinkedIn风格职位列表——公司、地点、工作模式、要求、薪资和福利",
        },
      },
      {
        type: "new",
        text: {
          it: "Pagina dettaglio posizione con tutte le informazioni e bottone candidatura",
          en: "Position detail page with full information and apply button",
          es: "Página de detalle de posición con toda la información y botón de candidatura",
          zh: "职位详情页面，包含完整信息和申请按钮",
        },
      },
      {
        type: "new",
        text: {
          it: "Modifica e eliminazione posizioni dalla dashboard HR",
          en: "Edit and delete positions from the HR dashboard",
          es: "Editar y eliminar posiciones desde el dashboard HR",
          zh: "从HR管理面板编辑和删除职位",
        },
      },
      {
        type: "improved",
        text: {
          it: "Contesto arricchito per Harid AI — azienda, sede, modalità lavoro e requisiti minimi nella valutazione",
          en: "Enriched context for Harid AI — company, location, work mode and minimum requirements in evaluation",
          es: "Contexto enriquecido para Harid AI — empresa, ubicación, modalidad y requisitos mínimos en la evaluación",
          zh: "Harid AI上下文增强——评估中包含公司、地点、工作模式和最低要求",
        },
      },
      {
        type: "improved",
        text: {
          it: "Gate di autenticazione per candidarsi — login richiesto prima della candidatura",
          en: "Authentication gate for applying — login required before application",
          es: "Verificación de autenticación para postularse — inicio de sesión requerido antes de la candidatura",
          zh: "申请认证门控——申请前需要登录",
        },
      },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-03-28",
    title: {
      it: "Avatar 3D e Analisi Audiovisiva",
      en: "3D Avatar & Audiovisual Analysis",
      es: "Avatar 3D y Análisis Audiovisual",
      zh: "3D虚拟形象与音视频分析",
    },
    changes: [
      {
        type: "new",
        text: {
          it: "Avatar 3D di Harid AI con React Three Fiber — lip-sync, animazioni di stato (parla, ascolta, pensa) e respiro",
          en: "Harid AI 3D avatar with React Three Fiber — lip-sync, state animations (speaking, listening, thinking) and breathing",
          es: "Avatar 3D de Harid AI con React Three Fiber — lip-sync, animaciones de estado (habla, escucha, piensa) y respiración",
          zh: "Harid AI 3D虚拟形象——唇语同步、状态动画（说话、聆听、思考）和呼吸",
        },
      },
      {
        type: "new",
        text: {
          it: "Analisi audiovisiva multimodale — audio + video inviati a Gemini per valutazione ambientale e tono vocale",
          en: "Multimodal audiovisual analysis — audio + video sent to Gemini for environmental and vocal tone assessment",
          es: "Análisis audiovisual multimodal — audio + video enviados a Gemini para evaluación ambiental y tono vocal",
          zh: "多模态音视频分析——音频+视频发送至Gemini进行环境和声调评估",
        },
      },
      {
        type: "new",
        text: {
          it: "Interruzione naturale — il candidato può interrompere Harid mentre parla, come in una conversazione reale",
          en: "Natural interruption — the candidate can interrupt Harid while speaking, like in a real conversation",
          es: "Interrupción natural — el candidato puede interrumpir a Harid mientras habla, como en una conversación real",
          zh: "自然打断——候选人可以像真实对话一样打断Harid",
        },
      },
      {
        type: "improved",
        text: {
          it: "Timer di silenzio adattivo — più tempo per pensare all'inizio, reattività dopo frasi lunghe",
          en: "Adaptive silence timer — more time to think at the start, quicker response after long phrases",
          es: "Temporizador de silencio adaptativo — más tiempo para pensar al inicio, reactividad después de frases largas",
          zh: "自适应静默计时器——开始时有更多思考时间，长句后响应更快",
        },
      },
      {
        type: "improved",
        text: {
          it: "Chiusura timeout con messaggio di saluto da Harid invece di terminare bruscamente",
          en: "Timeout closure with farewell message from Harid instead of abrupt termination",
          es: "Cierre de timeout con mensaje de despedida de Harid en lugar de terminación abrupta",
          zh: "超时关闭时Harid发送告别消息，而非突然终止",
        },
      },
      {
        type: "fixed",
        text: {
          it: "Punteggi più equi — niente più 0 punti per colloqui reali con risposte effettive",
          en: "Fairer scoring — no more 0 scores for real interviews with actual responses",
          es: "Puntuación más justa — no más 0 puntos para entrevistas reales con respuestas efectivas",
          zh: "更公平的评分——真实面试的有效回答不再出现0分",
        },
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-03-25",
    title: {
      it: "Supporto Multi-Lingua Completo",
      en: "Full Multi-Language Support",
      es: "Soporte Multi-Idioma Completo",
      zh: "完整多语言支持",
    },
    changes: [
      {
        type: "new",
        text: {
          it: "Supporto completo italiano, inglese e spagnolo per tutta la piattaforma",
          en: "Full Italian, English and Spanish support for the entire platform",
          es: "Soporte completo en italiano, inglés y español para toda la plataforma",
          zh: "平台全面支持意大利语、英语和西班牙语",
        },
      },
      {
        type: "new",
        text: {
          it: "Harid AI parla nella lingua selezionata dal candidato",
          en: "Harid AI speaks in the language selected by the candidate",
          es: "Harid AI habla en el idioma seleccionado por el candidato",
          zh: "Harid AI使用候选人选择的语言进行交流",
        },
      },
      {
        type: "new",
        text: {
          it: "Selettore lingua visibile in ogni pagina",
          en: "Language selector visible on every page",
          es: "Selector de idioma visible en cada página",
          zh: "每个页面都有可见的语言选择器",
        },
      },
      {
        type: "improved",
        text: {
          it: "Dashboard HR e report completamente tradotti",
          en: "HR Dashboard and reports fully translated",
          es: "Dashboard HR e informes completamente traducidos",
          zh: "HR管理面板和报告完全翻译",
        },
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-03-22",
    title: {
      it: "Analisi Visiva con Webcam",
      en: "Visual Analysis with Webcam",
      es: "Análisis Visual con Webcam",
      zh: "摄像头视觉分析",
    },
    changes: [
      {
        type: "new",
        text: {
          it: "Analisi visiva del candidato tramite webcam — espressione, gesti, abbigliamento, sfondo e postura",
          en: "Candidate visual analysis via webcam — expression, gestures, attire, background and posture",
          es: "Análisis visual del candidato por webcam — expresión, gestos, vestimenta, fondo y postura",
          zh: "通过摄像头进行候选人视觉分析——表情、手势、着装、背景和姿态",
        },
      },
      {
        type: "new",
        text: {
          it: "Screenshot automatici durante il colloquio visibili nel report HR",
          en: "Automatic screenshots during interview visible in the HR report",
          es: "Capturas automáticas durante la entrevista visibles en el informe HR",
          zh: "面试中自动截图，可在HR报告中查看",
        },
      },
      {
        type: "improved",
        text: {
          it: "Report HR arricchito con sezione analisi visiva e punteggi dettagliati",
          en: "HR report enriched with visual analysis section and detailed scores",
          es: "Informe HR enriquecido con sección de análisis visual y puntuaciones detalladas",
          zh: "HR报告增加视觉分析部分和详细评分",
        },
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-18",
    title: {
      it: "TTS Migliorato e Fix Microfono",
      en: "Improved TTS & Microphone Fix",
      es: "TTS Mejorado y Corrección de Micrófono",
      zh: "改进语音合成与麦克风修复",
    },
    changes: [
      {
        type: "new",
        text: {
          it: "Sintesi vocale server-side con voci neurali Microsoft Edge (nessuna chiave API richiesta)",
          en: "Server-side TTS with Microsoft Edge neural voices (no API key required)",
          es: "Síntesis de voz del lado del servidor con voces neurales de Microsoft Edge (sin clave API)",
          zh: "服务端语音合成，使用Microsoft Edge神经语音（无需API密钥）",
        },
      },
      {
        type: "fixed",
        text: {
          it: "Risolto conflitto microfono tra webcam e riconoscimento vocale",
          en: "Fixed microphone conflict between webcam and speech recognition",
          es: "Corregido conflicto de micrófono entre webcam y reconocimiento de voz",
          zh: "修复摄像头与语音识别之间的麦克风冲突",
        },
      },
      {
        type: "fixed",
        text: {
          it: "Migliorata gestione errori audio su iOS con sblocco manuale",
          en: "Improved audio error handling on iOS with manual unlock",
          es: "Mejora del manejo de errores de audio en iOS con desbloqueo manual",
          zh: "改进iOS上的音频错误处理，支持手动解锁",
        },
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-15",
    title: {
      it: "Area Candidato e Pipeline HR",
      en: "Candidate Area & HR Pipeline",
      es: "Área de Candidato y Pipeline HR",
      zh: "候选人区域与HR流程管线",
    },
    changes: [
      {
        type: "new",
        text: {
          it: "Area candidato con registrazione, login e storico candidature",
          en: "Candidate area with registration, login and application history",
          es: "Área de candidato con registro, login e historial de candidaturas",
          zh: "候选人区域，支持注册、登录和申请历史",
        },
      },
      {
        type: "new",
        text: {
          it: "Pipeline HR per gestire lo stato dei candidati (completato → assunto/rifiutato)",
          en: "HR pipeline to manage candidate status (completed → hired/rejected)",
          es: "Pipeline HR para gestionar el estado de los candidatos (completado → contratado/rechazado)",
          zh: "HR流程管线，管理候选人状态（已完成→录用/拒绝）",
        },
      },
      {
        type: "new",
        text: {
          it: "Upload e analisi CV (PDF) durante la candidatura",
          en: "CV upload and analysis (PDF) during application",
          es: "Carga y análisis de CV (PDF) durante la candidatura",
          zh: "申请时上传和分析简历（PDF）",
        },
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-10",
    title: {
      it: "Lancio Piattaforma AI Avengers",
      en: "AI Avengers Platform Launch",
      es: "Lanzamiento de la Plataforma AI Avengers",
      zh: "AI Avengers平台发布",
    },
    changes: [
      {
        type: "new",
        text: {
          it: "Colloquio video IA con Harid AI (Gemini 2.5 Flash) — 7 minuti, domande adattive",
          en: "AI video interview with Harid AI (Gemini 2.5 Flash) — 7 minutes, adaptive questions",
          es: "Entrevista de video IA con Harid AI (Gemini 2.5 Flash) — 7 minutos, preguntas adaptativas",
          zh: "AI视频面试，Harid AI（Gemini 2.5 Flash）——7分钟，自适应提问",
        },
      },
      {
        type: "new",
        text: {
          it: "Dashboard HR con report AI dettagliati per ogni candidato",
          en: "HR Dashboard with detailed AI reports for each candidate",
          es: "Dashboard HR con informes IA detallados para cada candidato",
          zh: "HR管理面板，为每位候选人提供详细AI报告",
        },
      },
      {
        type: "new",
        text: {
          it: "Tre modalità: camera+microfono, solo microfono, solo tastiera",
          en: "Three modes: camera+microphone, microphone only, keyboard only",
          es: "Tres modos: cámara+micrófono, solo micrófono, solo teclado",
          zh: "三种模式：摄像头+麦克风、仅麦克风、仅键盘",
        },
      },
      {
        type: "new",
        text: {
          it: "Creazione posizioni con domande personalizzate per il colloquio IA",
          en: "Position creation with custom questions for the AI interview",
          es: "Creación de posiciones con preguntas personalizadas para la entrevista IA",
          zh: "创建职位并自定义AI面试问题",
        },
      },
    ],
  },
];
