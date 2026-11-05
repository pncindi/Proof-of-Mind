// ==========================================
// PROOF OF MIND (POM) - MULTILINGUAL DATA ENGINE
// ==========================================

const TRANSLATIONS = {
  hi: {
    balance: "बैलेंस", level: "लेवल", energy: "एनर्जी",
    mineHeading: "वर्ड पज़ल माइनिंग", mineSubHeading: "ब्लॉक माइन करने के लिए सही अक्षरों का चयन करें",
    clear: "हटाएं", mineBlock: "माइन ब्लॉक",
    rechargeTitle: "माइंड ऊर्जा रिचार्ज करें", rechargeDesc: "1 ऐड = +2❤️ | 2 ऐड्स = फुल ❤️", refill: "रिफिल",
    tasksHeading: "कम्युनिटी टास्क", tasksSubHeading: "मिशन पूरा करें और POM टोकन प्राप्त करें",
    friendsHeading: "3-लेवल रेफरल सिस्टम", friendsSubHeading: "लेवल 1: 10% | लेवल 2: 3% | लेवल 3: 2% माइनिंग कमीशन",
    invite: "मित्रों को आमंत्रित करें", unclaimed: "अर्जित रेफरल कमीशन", claimRewards: "क्लेम",
    walletHeading: "विकेंद्रीकृत मल्टी-चेन वॉलेट", walletSubHeading: "POM रिवॉर्ड्स के लिए TON और Pi वॉलेट कनेक्ट करें",
    connectTon: "TON वॉलेट कनेक्ट करें", verifyTitle: "एंटी-सिबिल सुरक्षा एवं 2x बूस्ट",
    verifyDesc: "0.3 TON नेटवर्क शुल्क से खाता सत्यापित करें और स्थायी 2x रिवॉर्ड बूस्ट सक्रिय करें।",
    verifyBtn: "0.3 TON से वेरीफाई करें",
    navMine: "माइन", navQuiz: "क्विज़", navTasks: "टास्क", navFriends: "मित्र", navWallet: "वॉलेट", docs: "दस्तावेज़"
  },
  en: {
    balance: "Balance", level: "Level", energy: "Energy",
    mineHeading: "Word Puzzle Mining", mineSubHeading: "Select letters to solve the intellect block",
    clear: "Clear", mineBlock: "Mine Block",
    rechargeTitle: "Recharge Mind Energy", rechargeDesc: "Watch 1 Ad = +2❤️ | 2 Ads = Full ❤️", refill: "Refill",
    tasksHeading: "Official Ecosystem Tasks", tasksSubHeading: "Complete community missions & verify to claim POM",
    friendsHeading: "3-Tier Referral System", friendsSubHeading: "Level 1: 10% | Level 2: 3% | Level 3: 2% Mining Commission",
    invite: "Invite Friends via Telegram", unclaimed: "Unclaimed Commissions", claimRewards: "Claim",
    walletHeading: "Decentralized Multi-Chain Wallet", walletSubHeading: "Connect TON & Pi Network wallets for PoI token allocations",
    connectTon: "Connect TON Wallet", verifyTitle: "Sybil Protection & 2x Multiplier",
    verifyDesc: "Verify with 0.3 TON network fee to permanently activate the verified badge and unlock 2x mining & quiz rewards.",
    verifyBtn: "Verify 0.3 TON",
    navMine: "Mine", navQuiz: "Quiz", navTasks: "Tasks", navFriends: "Friends", navWallet: "Wallet", docs: "Docs"
  },
  ru: {
    balance: "Баланс", level: "Уровень", energy: "Энергия",
    mineHeading: "Интеллект Майнинг", mineSubHeading: "Соберите слово для подтверждения блока",
    clear: "Сброс", mineBlock: "Майнить Блок",
    rechargeTitle: "Восстановить Энергию", rechargeDesc: "1 реклама = +2❤️ | 2 = Полная ❤️", refill: "Пополнить",
    tasksHeading: "Официальные Задания", tasksSubHeading: "Выполняйте задания сообщества за POM",
    friendsHeading: "3-Уровневая Реферальная Система", friendsSubHeading: "Ур.1: 10% | Ур.2: 3% | Ур.3: 2%",
    invite: "Пригласить друзей", unclaimed: "Доступные Награды", claimRewards: "Забрать",
    walletHeading: "Децентрализованный Кошелек", walletSubHeading: "Подключите TON и Pi кошельки",
    connectTon: "Подключить TON", verifyTitle: "Защита от ботов и 2x Буст",
    verifyDesc: "Верификация за 0.3 TON дает постоянный 2x буст.", verifyBtn: "0.3 TON Верификация",
    navMine: "Майнинг", navQuiz: "Квиз", navTasks: "Задания", navFriends: "Друзья", navWallet: "Кошелек", docs: "Документы"
  },
  zh: {
    balance: "余额", level: "等级", energy: "体力",
    mineHeading: "智慧单词挖矿", mineSubHeading: "选择字母以验证智力区块",
    clear: "清除", mineBlock: "开采区块",
    rechargeTitle: "恢复脑力", rechargeDesc: "看1次广告 = +2❤️ | 2次 = 满格 ❤️", refill: "补充",
    tasksHeading: "官方生态任务", tasksSubHeading: "完成社区任务领取POM代币",
    friendsHeading: "三级推荐网络", friendsSubHeading: "1级: 10% | 2级: 3% | 3级: 2%",
    invite: "邀请好友", unclaimed: "未提取奖励", claimRewards: "领取",
    walletHeading: "去中心化多链钱包", walletSubHeading: "连接 TON 与 Pi 钱包",
    connectTon: "连接 TON 钱包", verifyTitle: "女巫防护与双倍加速",
    verifyDesc: "支付 0.3 TON 验证以永久激活 2x 挖矿奖励。", verifyBtn: "验证 0.3 TON",
    navMine: "挖矿", navQuiz: "答题", navTasks: "任务", navFriends: "好友", navWallet: "钱包", docs: "白皮书"
  },
  es: {
    balance: "Balance", level: "Nivel", energy: "Energía",
    mineHeading: "Minería de Palabras", mineSubHeading: "Selecciona letras para resolver el bloque",
    clear: "Borrar", mineBlock: "Minar Bloque",
    rechargeTitle: "Recargar Energía Mental", rechargeDesc: "1 Anuncio = +2❤️ | 2 Anuncios = Lleno ❤️", refill: "Recargar",
    tasksHeading: "Tareas de la Comunidad", tasksSubHeading: "Completa misiones y reclama POM",
    friendsHeading: "Sistema de 3 Niveles", friendsSubHeading: "Nivel 1: 10% | Nivel 2: 3% | Nivel 3: 2%",
    invite: "Invitar amigos", unclaimed: "Comisiones Pendientes", claimRewards: "Reclamar",
    walletHeading: "Billetera Multicadena", walletSubHeading: "Conecta billeteras TON y Pi",
    connectTon: "Conectar TON", verifyTitle: "Protección Sybil y 2x Multiplicador",
    verifyDesc: "Verifica con 0.3 TON para duplicar tus recompensas.", verifyBtn: "Verificar 0.3 TON",
    navMine: "Minar", navQuiz: "Quiz", navTasks: "Tareas", navFriends: "Amigos", navWallet: "Billetera", docs: "Docs"
  },
  ar: {
    balance: "الرصيد", level: "المستوى", energy: "الطاقة",
    mineHeading: "تعدين الألغاز الذهنية", mineSubHeading: "اختر الحروف لحل كتلة الذكاء",
    clear: "مسح", mineBlock: "تعدين الكتلة",
    rechargeTitle: "إعادة شحن الطاقة", rechargeDesc: "إعلان = +2❤️ | إعلانان = ممتلئ ❤️", refill: "شحن",
    tasksHeading: "مهام المجتمع الرسمية", tasksSubHeading: "أكمل المهام للمطالبة بـ POM",
    friendsHeading: "نظام الإحالة ثلاثي المستويات", friendsSubHeading: "المستوى 1: 10% | 2: 3% | 3: 2%",
    invite: "دعوة الأصدقاء", unclaimed: "العمولات غير المطالب بها", claimRewards: "مطالبة",
    walletHeading: "محفظة لا مركزية", walletSubHeading: "اربط محفظتي TON و Pi Network",
    connectTon: "ربط محفظة TON", verifyTitle: "حماية سيبيل ومضاعف 2x",
    verifyDesc: "توثيق بـ 0.3 TON لتفعيل المضاعف الدائم.", verifyBtn: "توثيق 0.3 TON",
    navMine: "تعدين", navQuiz: "اختبار", navTasks: "مهام", navFriends: "أصدقاء", navWallet: "محفظة", docs: "وثائق"
  },
  bn: {
    balance: "ব্যালেন্স", level: "লেভেল", energy: "শক্তি",
    mineHeading: "ওয়ার্ড পাজল মাইনিং", mineSubHeading: "ব্লক সমাধান করতে সঠিক অক্ষর নির্বাচন করুন",
    clear: "মুছুন", mineBlock: "ব্লক মাইন করুন",
    rechargeTitle: "শক্তি রিচার্জ করুন", rechargeDesc: "১টি বিজ্ঞাপন = +২❤️ | ২টি = পূর্ণ ❤️", refill: "রিফিল",
    tasksHeading: "অফিসিয়াল টাস্ক", tasksSubHeading: "মিশন সম্পন্ন করে POM দাবি করুন",
    friendsHeading: "৩-স্তর রেফারেল সিস্টেম", friendsSubHeading: "লেভেল ১: ১০% | ২: ৩% | ৩: ২%",
    invite: "বন্ধুদের আমন্ত্রণ জানান", unclaimed: "অদাবিকৃত কমিশন", claimRewards: "দাবি করুন",
    walletHeading: "মাল্টি-চেন ওয়ালেট", walletSubHeading: "TON এবং Pi ওয়ালেট সংযুক্ত করুন",
    connectTon: "TON ওয়ালেট সংযুক্ত করুন", verifyTitle: "সিবিল সুরক্ষা ও ২x গুণক",
    verifyDesc: "০.৩ TON ফি দিয়ে যাচাই করে দ্বিগুণ রিওয়ার্ড আনলক করুন।", verifyBtn: "০.৩ TON যাচাই",
    navMine: "মাইন", navQuiz: "কুইজ", navTasks: "টাস্ক", navFriends: "বন্ধু", navWallet: "ওয়ালেট", docs: "ডকুমেন্টস"
  },
  vi: {
    balance: "Số dư", level: "Cấp độ", energy: "Năng lượng",
    mineHeading: "Đào Khối Trí Tuệ", mineSubHeading: "Chọn các chữ cái để giải khối",
    clear: "Xóa", mineBlock: "Đào Khối",
    rechargeTitle: "Nạp Năng Lượng", rechargeDesc: "1 Quảng cáo = +2❤️ | 2 = Đầy ❤️", refill: "Nạp",
    tasksHeading: "Nhiệm Vụ Cộng Đồng", tasksSubHeading: "Hoàn thành nhiệm vụ nhận POM",
    friendsHeading: "Hệ Thống Giới Thiệu 3 Tầng", friendsSubHeading: "Tầng 1: 10% | Tầng 2: 3% | Tầng 3: 2%",
    invite: "Mời Bạn Bè", unclaimed: "Hoa Hồng Chưa Nhận", claimRewards: "Nhận",
    walletHeading: "Ví Đa Chuỗi", walletSubHeading: "Kết nối ví TON & Pi Network",
    connectTon: "Kết Nối TON", verifyTitle: "Bảo Vệ Sybil & Nhân Đôi 2x",
    verifyDesc: "Xác minh on-chain 0.3 TON kích hoạt nhân đôi phần thưởng vĩnh viễn.", verifyBtn: "Xác Minh 0.3 TON",
    navMine: "Đào", navQuiz: "Đố Vui", navTasks: "Nhiệm Vụ", navFriends: "Bạn Bè", navWallet: "Ví", docs: "Tài Liệu"
  },
  id: {
    balance: "Saldo", level: "Level", energy: "Energi",
    mineHeading: "Penambangan Kata", mineSubHeading: "Pilih huruf untuk menyelesaikan blok",
    clear: "Hapus", mineBlock: "Tambang Blok",
    rechargeTitle: "Isi Ulang Energi", rechargeDesc: "1 Iklan = +2❤️ | 2 Iklan = Penuh ❤️", refill: "Isi",
    tasksHeading: "Tugas Resmi", tasksSubHeading: "Selesaikan misi & klaim token POM",
    friendsHeading: "Sistem Rujukan 3 Tingkat", friendsSubHeading: "Level 1: 10% | Level 2: 3% | Level 3: 2%",
    invite: "Undang Teman", unclaimed: "Komisi Belum Diklaim", claimRewards: "Klaim",
    walletHeading: "Dompet Multi-Rantai", walletSubHeading: "Hubungkan dompet TON & Pi",
    connectTon: "Hubungkan TON", verifyTitle: "Perlindungan Sybil & Pengali 2x",
    verifyDesc: "Verifikasi biaya 0.3 TON untuk pengali 2x permanen.", verifyBtn: "Verifikasi 0.3 TON",
    navMine: "Tambang", navQuiz: "Kuis", navTasks: "Tugas", navFriends: "Teman", navWallet: "Dompet", docs: "Dokumen"
  },
  fa: {
    balance: "موجودی", level: "سطح", energy: "انرژی",
    mineHeading: "استخراج پازل کلمات", mineSubHeading: "حروف را برای حل بلوک انتخاب کنید",
    clear: "پاک کردن", mineBlock: "استخراج بلوک",
    rechargeTitle: "شارژ مجدد انرژی", rechargeDesc: "۱ تبلیغ = +۲❤️ | ۲ تبلیغ = پر ❤️", refill: "شارژ",
    tasksHeading: "ماموریت‌های رسمی", tasksSubHeading: "ماموریت‌ها را تکمیل و POM دریافت کنید",
    friendsHeading: "سیستم ارجاع ۳ سطحی", friendsSubHeading: "سطح ۱: ۱۰٪ | سطح ۲: ۳٪ | سطح ۳: ۲٪",
    invite: "دعوت از دوستان", unclaimed: "پاداش‌های مطالبه نشده", claimRewards: "دریافت",
    walletHeading: "کیف پول چند زنجیره‌ای", walletSubHeading: "اتصال کیف پول‌های TON و Pi",
    connectTon: "اتصال به TON", verifyTitle: "محافظت سیبیل و ضریب ۲ برابری",
    verifyDesc: "تایید با ۰.۳ TON برای ضریب ۲ برابری دائمی.", verifyBtn: "تایید ۰.۳ TON",
    navMine: "استخراج", navQuiz: "کوییز", navTasks: "ماموریت", navFriends: "دوستان", navWallet: "کیف پول", docs: "مستندات"
  }
};

const TASK_TRANSLATIONS = {
  hi: {
    tg_ch: "आधिकारिक घोषणा चैनल से जुड़ें",
    tg_grp: "पब्लिक कम्युनिटी ग्रुप में शामिल हों",
    x_com: "Proof of Mind को X पर फॉलो करें",
    yt_sub: "यूट्यूब चैनल सब्सक्राइब करें",
    fb_page: "फेसबुक पेज को फॉलो करें"
  },
  en: {
    tg_ch: "Join POM Announcement Channel",
    tg_grp: "Join POM Public Community Group",
    x_com: "Follow Proof of Mind on X",
    yt_sub: "Subscribe Official YouTube Channel",
    fb_page: "Follow Official Facebook Page"
  },
  ru: {
    tg_ch: "Подписаться на канал анонсов",
    tg_grp: "Вступить в группу сообщества",
    x_com: "Подписаться на X (Twitter)",
    yt_sub: "Подписаться на YouTube канал",
    fb_page: "Подписаться на страницу Facebook"
  },
  zh: {
    tg_ch: "加入官方公告频道",
    tg_grp: "加入官方社区讨论群",
    x_com: "在 X 上关注 Proof of Mind",
    yt_sub: "订阅官方 YouTube 频道",
    fb_page: "关注官方 Facebook 页面"
  },
  es: {
    tg_ch: "Unirse al canal de anuncios oficial",
    tg_grp: "Unirse al grupo de la comunidad",
    x_com: "Seguir Proof of Mind en X",
    yt_sub: "Suscribirse al canal de YouTube",
    fb_page: "Seguir la página de Facebook"
  },
  ar: {
    tg_ch: "الانضمام إلى قناة الإعلانات الرسمية",
    tg_grp: "الانضمام إلى مجموعة المجتمع العامة",
    x_com: "متابعة Proof of Mind على X",
    yt_sub: "الاشتراك في قناة يوتيوب الرسمية",
    fb_page: "متابعة صفحة فيسبوك الرسمية"
  },
  bn: {
    tg_ch: "অফিসিয়াল ঘোষণা চ্যানেলে যোগ দিন",
    tg_grp: "পাবলিক কমিউনিটি গ্রুপে যোগ দিন",
    x_com: "X-এ Proof of Mind অনুসরণ করুন",
    yt_sub: "অফিসিয়াল ইউটিউব চ্যানেল সাবস্ক্রাইব করুন",
    fb_page: "অফিসিয়াল ফেসবুক পেজ ফলো করুন"
  },
  vi: {
    tg_ch: "Tham gia Kênh thông báo chính thức",
    tg_grp: "Tham gia Nhóm cộng đồng công khai",
    x_com: "Theo dõi Proof of Mind trên X",
    yt_sub: "Đăng ký Kênh YouTube chính thức",
    fb_page: "Theo dõi Trang Facebook chính thức"
  },
  id: {
    tg_ch: "Gabung Saluran Pengumuman Resmi",
    tg_grp: "Gabung Grup Komunitas Publik",
    x_com: "Ikuti Proof of Mind di X",
    yt_sub: "Langganan Saluran YouTube Resmi",
    fb_page: "Ikuti Halaman Facebook Resmi"
  },
  fa: {
    tg_ch: "عضویت در کانال رسمی اطلاعیه‌ها",
    tg_grp: "عضویت در گروه عمومی جامعه",
    x_com: "دنبال کردن Proof of Mind در X",
    yt_sub: "اشتراک در کانال رسمی یوتیوب",
    fb_page: "دنبال کردن صفحه رسمی فیس‌بوک"
  }
};

// ==========================================
// 100+ वर्ड पज़ल माइनिंग डिक्शनरी (Never-Ending Words)
// ==========================================
const MINE_DICTIONARY = {
  hi: [
    "मन", "ज्ञान", "बुद्धि", "सोच", "चेतना", "प्रमाण", "सत्य", "मस्तिष्क", "सिक्का", "नेटवर्क",
    "ब्लॉक", "चेन", "टोकन", "माइन", "नोड", "वॉलेट", "वेब", "स्मार्ट", "डेटा", "पाई",
    "हैश", "गैस", "कार्ड", "कोड", "बॉट", "कॉइन", "लिंक", "बैंक", "सुरक्षा", "खाता",
    "सत्यापन", "कुंजी", "रुपया", "डिजिटल", "सर्वर", "प्रूफ", "माइंड", "तर्क", "ध्यान", "शक्ति",
    "लक्ष्य", "ऊर्जा", "मित्र", "टास्क", "संसार", "संज्ञान", "विचार", "विद्या", "मेधा", "मनीषा",
    "दिशा", "समय", "गति", "नियम", "यंत्र", "तंत्र", "मंत्र", "सिद्धि", "साधना", "कर्म",
    "मार्ग", "दृष्टि", "सृष्टि", "अक्षर", "शब्द", "अर्थ", "भाव", "अनुभव", "बोध", "प्रज्ञा",
    "धारण", "स्मृति", "विवेक", "संवाद", "क्रांति", "विकास", "परिवर्तन", "सहयोग", "समुदाय", "सम्पत्ति",
    "मूल्य", "संचय", "वितरण", "विनिमय", "व्यापार", "प्रणाली", "प्रक्रिया", "संरचना", "प्रौद्योगिकी", "भविष्य"
  ],
  en: [
    "MIND", "TON", "NODE", "COIN", "HASH", "BLOCK", "PROOF", "BRAIN", "CHAIN", "TOKEN",
    "SMART", "DATA", "GAS", "CODE", "BOT", "LINK", "BANK", "USER", "KEY", "LOGIC",
    "INTEL", "CYBER", "WEB", "PEER", "VAULT", "DEFI", "MINT", "STAKE", "LEDGER", "VALID",
    "SPEED", "TASK", "FRIEND", "POWER", "ENERGY", "FUTURE", "SECURE", "ENGINE", "SYSTEM", "ASSET",
    "MERIT", "GLOBAL", "SCALE", "QUEST", "LEARN", "THINK", "MEMORY", "REWARD", "COMMUNITY", "NETWORK"
  ],
  ru: ["РАЗУМ", "МОЗГ", "БЛОК", "УЗЕЛ", "ТОКЕН", "СЕТЬ", "МЫСЛЬ", "КЛЮЧ", "ХЭШ", "ДАННЫЕ", "СИЛА", "ЦЕЛЬ", "СВЯЗЬ"],
  zh: ["思维", "大脑", "区块", "节点", "代币", "共识", "网络", "证明", "智慧", "数据", "哈希", "智能", "资产"],
  es: ["MENTE", "NODO", "BLOQUE", "TOKEN", "RED", "PRUEBA", "CEREBRO", "DATOS", "CLAVE", "VALOR", "SISTEMA", "LOGICA"],
  ar: ["عقل", "دماغ", "كتلة", "عقدة", "رمز", "شبكة", "إثبات", "فكر", "بيانات", "أمان", "نظام", "مفتاح"],
  bn: ["মন", "জ্ঞান", "বুদ্ধি", "টোকেন", "ব্লক", "প্রমাণ", "জাল", "চিন্তা", "শক্তি", "ডাটা", "স্মার্ট", "মুদ্রা"],
  vi: ["TRI", "NAO", "KHOI", "NUT", "TOKEN", "MANG", "CHUNG", "MINDA", "DU LIEU", "KHOA", "TRI TUE"],
  id: ["AKAL", "OTAK", "PIKIR", "KOIN", "BLOK", "BUKTI", "SIMPUL", "JARINGAN", "DATA", "KUNCI", "CERDAS"],
  fa: ["ذهن", "مغز", "بلاک", "گره", "توکن", "اثبات", "دانش", "هوش", "داده", "سامانه", "کلید"]
};

const LOCAL_WORDS = MINE_DICTIONARY;

// ==========================================
// व्हाइटपेपर डेटा (10 भाषाएँ)
// ==========================================
const WHITEPAPER_DATA = {
  hi: {
    s1: "१. विज़न एवं प्रूफ ऑफ इंटेलेक्ट (PoI)",
    p1: "प्रूफ ऑफ माइंड (POM) बिजली और हार्डवेयर की अनावश्यक बर्बादी के स्थान पर मानव बौद्धिक सर्वसम्मति को ऑन-चेन लागू करता है। उपयोगकर्ता शब्द पहेलियां और सत्यापित क्विज़ हल करके अपनी सक्रिय बौद्धिक क्षमता प्रमाणित करते हैं और विकेंद्रीकृत टोकन माइन करते हैं।",
    s2: "२. १ अरब POM टोकनॉमिक्स",
    s3: "३. विकेंद्रीकृत मेरिट कोर टीम (धारा 3.1)",
    p3: "१०% कोर टीम आवंटन किसी निजी फाउंडर लॉबी के लिए आरक्षित नहीं है। यह पूरी तरह योग्यता (Merit) पर आधारित है। वैश्विक माइनिंग लीडरबोर्ड पर शीर्ष बौद्धिक प्रदर्शन करने वाले और सक्रिय समुदायिक डेवलपर्स को सीधे कोर टीम आवंटन में शामिल किया जाएगा।",
    s4: "४. TON एवं Pi Network ट्विन आर्किटेक्चर",
    p4: "POM एक साथ टेलीग्राम नेटिव ब्लॉकचेन (TON) और Pi Network के 60+ मिलियन पायनियर इकोसिस्टम को जोड़ता है। उपयोगकर्ता दोनों नेटवर्क्स के वॉलेट कनेक्ट करके दोनों इकोसिस्टम्स से टोकन क्लेम करने के पात्र बनते हैं।",
    s5: "५. 0.3 TON ऑन-चेन सिबिल सुरक्षा एवं 2x बूस्ट",
    p5: "स्वचालित बॉट्स और फेक एकाउंट्स से वास्तविक माइनर्स के रिवॉर्ड्स की रक्षा के लिए 0.3 TON का ऑन-चेन माइक्रोट्रांजैक्शन लागू किया गया है। यह सत्यापित पायनियर्स को स्थायी 2x माइनिंग और क्विज़ मल्टीप्लायर प्रदान करता है।",
    s6: "६. रोडमैप एवं TGE लिस्टिंग",
    p6: "फेज 1: टेलीग्राम मिनी ऐप लॉन्च एवं टास्क इकोसिस्टम। फेज 2: ऑन-चेन PoI सत्यापन और Pi ब्राउज़र सिंकिंग। फेज 3: TGE (टोकन जेनरेशन इवेंट) और प्रमुख DEX/CEX पर POM लिस्टिंग।"
  },
  en: {
    s1: "1. Abstract & Proof of Intellect (PoI)",
    p1: "Proof of Mind (POM) replaces hardware electrical waste with decentralized human cognitive consensus. Pioneers solve on-chain intellect blocks and verified quizzes to validate genuine human intelligence and mint POM tokens.",
    s2: "2. 1 Billion POM Hard-Cap Tokenomics",
    s3: "3. Decentralized Merit Core Team (Section 3.1)",
    p3: "The 10% Core Team allocation is strictly non-custodial and meritocratic. Pioneers holding top positions on global intellect leaderboards are directly onboarded into decentralized governance and core rewards.",
    s4: "4. Dual TON & Pi Network Architecture",
    p4: "POM bridges Telegram's native TON blockchain with Pi Network's 60M+ verified web3 pioneer community. Dual-chain connectivity enables seamless verification and multi-chain liquidity.",
    s5: "5. 0.3 TON Sybil Defense & 2x Multiplier",
    p5: "To eliminate automated bot farms, 0.3 TON micro-verification confirms authentic human identity on-chain and grants verified pioneers a lifetime 2x reward boost on all mining and quiz activities.",
    s6: "6. Roadmap & TGE DEX Listing",
    p6: "Phase 1: Mini App Launch & Ecosystem Tasks. Phase 2: On-chain PoI Engine and Pi Browser Integration. Phase 3: Token Generation Event (TGE) and decentralized exchange liquidity pool deployment."
  },
  ru: {
    s1: "1. Концепция и Proof of Intellect (PoI)",
    p1: "Proof of Mind заменяет затраты электроэнергии на децентрализованный человеческий интеллект.",
    s2: "2. Токеномика 1 Миллиард POM",
    s3: "3. Меритократическая Команда",
    p3: "10% для Core Team распределяются исключительно за заслуги среди лидеров майнинга.",
    s4: "4. Архитектура TON и Pi Network",
    p4: "Интеграция блокчейна TON и экосистемы Pi Network для 60М+ пользователей.",
    s5: "5. Защита от ботов 0.3 TON",
    p5: "Микротранзакция 0.3 TON подтверждает реального человека и дает вечный 2x буст.",
    s6: "6. Дорожная карта и Листинг",
    p6: "Запуск бота -> Интеграция Pi -> TGE и листинг на DEX биржах."
  },
  zh: {
    s1: "1. 智力证明共识 (PoI)",
    p1: "Proof of Mind 用人类认知共识取代高能耗硬件挖矿。",
    s2: "2. 10 亿 POM 代币经济学",
    s3: "3. 绩效核心团队机制",
    p3: "10% 的团队份额严格基于智力贡献排行榜选拔，非私人预留。",
    s4: "4. TON 与 Pi Network 双架构",
    p4: "连接 Telegram 原生 TON 链与拥有 6000 万先锋的 Pi Network 生态。",
    s5: "5. 0.3 TON 女巫防护与 2 倍加速",
    p5: "通过 0.3 TON 链上验证杜绝假账号并永久激活 2 倍挖矿加速。",
    s6: "6. 路线图与 TGE 上市",
    p6: "Mini App 发布 -> 链上 PoI 引擎 -> 代币生成事件与 DEX 交易对部署。"
  },
  es: {
    s1: "1. Resumen y Prueba de Intelecto (PoI)",
    p1: "POM reemplaza el desperdicio de energía con consenso cognitivo humano en TON y Pi Network.",
    s2: "2. Tokenomics de 1 Mil Millones POM",
    s3: "3. Equipo Central Meritocrático",
    p3: "El 10% del Core Team se asigna por mérito a los mineros líderes.",
    s4: "4. Arquitectura Dual TON y Pi Network",
    p4: "Puente entre TON Telegram y los 60 millones de pioneros de Pi Network.",
    s5: "5. Defensa Sybil con 0.3 TON",
    p5: "La verificación on-chain otorga un bono permanente de 2x.",
    s6: "6. Hoja de Ruta y TGE",
    p6: "Mini App -> Integración PoI -> Listado DEX y TGE oficial."
  },
  ar: {
    s1: "١. إثبات الذكاء (PoI)",
    p1: "يستبدل POM إهدار الطاقة بتعدين الذكاء البشري الموثق عبر بلوكتشين TON وشبكة Pi.",
    s2: "٢. اقتصاديات التوكن (1 مليار POM)",
    s3: "٣. فريق الجدارة اللامركزي",
    p3: "توزيع حصة 10% بناءً على أداء لوحة الصدارة الفعلي فقط.",
    s4: "٤. الربط بين TON و Pi Network",
    p4: "دمج بين مستخدمي تيليجرام وشبكة Pi الرائدة.",
    s5: "٥. حماية سيبيل بـ 0.3 TON",
    p5: "توثيق الحساب بـ 0.3 TON يمنح مضاعف أرباح دائم.",
    s6: "٦. خريطة الطريق والإدراج",
    p6: "إطلاق التطبيق المصغر -> محرك PoI -> الإدراج في البورصات."
  },
  bn: {
    s1: "১. প্রমাণ বুদ্ধিমত্তা (PoI)",
    p1: "বিদ্যুৎ অপচয়ের পরিবর্তে মানুষের বুদ্ধিভিত্তিক ঐক্যমত্য অন-চেইনে প্রমাণ করে POM টোকেন মাইন করা হয়।",
    s2: "২. ১ বিলিয়ন POM টোকেনমিক্স",
    s3: "৩. মেধাভিত্তিক কোর টিম",
    p3: "১০% কোর টিম বরাদ্দ সেরা মাইনারদের মেধার ভিত্তিতে বণ্টিত হয়।",
    s4: "৪. TON ও Pi Network যুগ্ম নেটওয়ার্ক",
    p4: "টেলিগ্রামের TON এবং Pi নেটওয়ার্কের ৬০ মিলিয়ন পাইওনিয়ারদের সংযোগ।",
    s5: "৫. ০.৩ TON সিবিল সুরক্ষা",
    p5: "অন-চেন ভেরিফিকেশনের মাধ্যমে আজীবন দ্বিগুণ রিওয়ার্ড সক্রিয় হয়।",
    s6: "৬. রোডম্যাপ ও TGE লিস্টিং",
    p6: "মিনি অ্যাপ লঞ্চ -> PoI ইঞ্জিন -> TGE ও DEX এক্সচেঞ্জ লিস্টিং।"
  },
  vi: {
    s1: "1. Bằng Chứng Trí Tuệ (PoI)",
    p1: "Proof of Mind thay thế việc lãng phí điện năng bằng sự đồng thuận nhận thức của con người.",
    s2: "2. Tokenomics 1 Tỷ POM",
    s3: "3. Đội Ngũ Cốt Lõi",
    p3: "Phân bổ 10% được trao dựa trên bảng xếp hạng đóng góp trí tuệ thực tế.",
    s4: "4. Kiến Trúc Kép TON & Pi Network",
    p4: "Kết nối hệ sinh thái TON Telegram và 60M+ người tiên phong Pi Network.",
    s5: "5. Bảo Vệ Sybil 0.3 TON",
    p5: "Xác minh on-chain 0.3 TON kích hoạt nhân đôi phần thưởng vĩnh viễn.",
    s6: "6. Lộ Trình & Niêm Yết TGE",
    p6: "Mini App -> Tích hợp PoI -> TGE và niêm yết trên các sàn DEX."
  },
  id: {
    s1: "1. Bukti Intelek (Proof of Intellect)",
    p1: "Proof of Mind menggantikan pemborosan energi dengan konsensus kognitif manusia.",
    s2: "2. Tokenomics 1 Miliar POM",
    s3: "3. Tim Inti Berbasis Prestasi",
    p3: "Alokasi 10% diberikan murni berdasarkan performa papan peringkat.",
    s4: "4. Arsitektur Ganda TON & Pi Network",
    p4: "Menghubungkan ekosistem TON Telegram dengan 60 juta pionir Pi Network.",
    s5: "5. Perlindungan Sybil 0.3 TON",
    p5: "Verifikasi on-chain mengaktifkan pengali hadiah 2x permanen seumur hidup.",
    s6: "6. Peta Jalan & Peluncuran TGE",
    p6: "Peluncuran Mini App -> Mesin PoI -> TGE dan pencatatan bursa DEX."
  },
  fa: {
    s1: "۱. اثبات هوش و ذهن (PoI)",
    p1: "اثبات ذهن (POM) اتلاف برق سخت‌افزاری را با اجماع شناختی انسان جایگزین می‌کند.",
    s2: "۲. توکنومیکس ۱ میلیارد POM",
    s3: "۳. تیم اصلی شایسته‌سالار",
    p3: "تخصیص ۱۰٪ تیم بر اساس شایستگی به رتبه‌های برتر لیدربورد تعلق می‌گیرد.",
    s4: "۴. معماری دوگانه TON و Pi Network",
    p4: "پل میان TON تلگرام و جامعه ۶۰ میلیونی پیشگامان پای نتورک.",
    s5: "۵. دفاع سیبیل ۰.۳ TON",
    p5: "تایید آن‌چین ضریب پاداش استخراج ۲ برابری دائمی را فعال می‌کند.",
    s6: "۶. نقشه راه و لیست شدن",
    p6: "مینی‌اپلیکیشن تلگرام -> موتور PoI -> رویداد TGE و عرضه در DEX."
  }
};
