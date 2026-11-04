// ==========================================
// PROOF OF MIND (POM) - MAIN GAMEPLAY & WALLET ENGINE
// ==========================================

const CONFIG = {
  BACKEND_API_URL: "https://proof-of-mind-api.onrender.com",
  ADMIN_TON_WALLET: "UQD5ZiNy8-eV7l6Ny46c-f98USLg-JXPTRRIPMV-0YiadqJV",
  BOT_USERNAME: "proo_fo_fmind_bot",
  ADSGRAM_BLOCK_ID: "57910"
};

let tonConnectUI = null;

let state = {
  telegram_id: "pioneer",
  balance: 130,
  mineLevel: 1,
  quizLevel: 1,
  energy: 5,
  isVerified: false,
  selectedLetters: [],
  tier1Users: 0,
  tier2Users: 0,
  tier3Users: 0,
  unclaimedCommission: 0,
  tonConnected: false,
  tonAddress: null,
  lang: "hi",
  tasks: [
    { id: "tg_ch", title: "Join POM Announcement Channel", link: "https://t.me/+JpUnewC5FPEyMzNl", reward: 50, started: false, completed: false, icon: "fa-brands fa-telegram" },
    { id: "tg_grp", title: "Join POM Public Community Group", link: "https://t.me/ProofOfMindPublicGroup", reward: 50, started: false, completed: false, icon: "fa-solid fa-users" },
    { id: "x_com", title: "Follow Proof of Mind on X", link: "https://x.com/kuku56309", reward: 50, started: false, completed: false, icon: "fa-brands fa-x-twitter" },
    { id: "yt_sub", title: "Subscribe Official YouTube Channel", link: "https://www.youtube.com/@proof-of-mind_bot", reward: 50, started: false, completed: false, icon: "fa-brands fa-youtube" },
    { id: "fb_page", title: "Follow Official Facebook Page", link: "https://www.facebook.com/share/19nMDW2gSJ/", reward: 50, started: false, completed: false, icon: "fa-brands fa-facebook" }
  ]
};

let currentTargetTiles = ["म", "न"];
let currentScrambledTiles = ["म", "न", "क", "ल", "र", "स"];
let quizTimer = null;
let quizRemainingTime = 25;

// --- STORAGE PERSISTENCE ---
function loadSavedState() {
  try {
    const saved = localStorage.getItem('POM_USER_STATE');
    if (saved) {
      const parsed = JSON.parse(saved);
      state = Object.assign(state, parsed);
    }
  } catch(e) {}
}

function saveActiveState() {
  try {
    localStorage.setItem('POM_USER_STATE', JSON.stringify({
      balance: state.balance,
      mineLevel: state.mineLevel,
      quizLevel: state.quizLevel,
      energy: state.energy,
      isVerified: state.isVerified,
      lang: state.lang,
      tonConnected: state.tonConnected,
      tonAddress: state.tonAddress,
      tasks: state.tasks,
      tier1Users: state.tier1Users,
      tier2Users: state.tier2Users,
      tier3Users: state.tier3Users,
      unclaimedCommission: state.unclaimedCommission
    }));
  } catch(e) {}
}

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function showToast(message, icon = "ℹ️") {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');
  if (!toast || !toastMsg) return;

  toastMsg.innerText = message;
  if (toastIcon) toastIcon.innerText = icon;

  toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
  }, 2500);
}

// --- LANGUAGE SWITCHER ---
function changeLanguage(lang) {
  state.lang = lang;
  saveActiveState();
  applyCurrentLanguage();
  initCurrentPuzzle();
  renderTasks();
  if (!document.getElementById('tabQuiz').classList.contains('hidden')) {
    startQuizRound();
  }
  showToast(`Language: ${document.getElementById('languageSelect')?.selectedOptions[0]?.text || lang}`, "🌐");
}

function applyCurrentLanguage() {
  const dict = TRANSLATIONS[state.lang] || TRANSLATIONS.en;
  safeSetText('labelBalance', dict.balance);
  safeSetText('labelEnergy', dict.energy);
  safeSetText('mineHeading', dict.mineHeading);
  safeSetText('mineSubHeading', dict.mineSubHeading);
  safeSetText('btnClear', dict.clear);
  safeSetText('btnMine', dict.mineBlock);
  safeSetText('energyRefillTitle', dict.rechargeTitle);
  safeSetText('energyRefillDesc', dict.rechargeDesc);
  safeSetText('btnRefill', dict.refill);
  safeSetText('tasksHeading', dict.tasksHeading);
  safeSetText('tasksSubHeading', dict.tasksSubHeading);
  safeSetText('friendsHeading', dict.friendsHeading);
  safeSetText('friendsSubHeading', dict.friendsSubHeading);
  safeSetText('btnInvite', dict.invite);
  safeSetText('lblUnclaimed', dict.unclaimed);
  safeSetText('btnClaimRewards', dict.claimRewards);
  safeSetText('walletHeading', dict.walletHeading);
  safeSetText('walletSubHeading', dict.walletSubHeading);
  safeSetText('btnConnectTonText', dict.connectTon);
  safeSetText('verifyTitle', dict.verifyTitle);
  safeSetText('verifyDesc', dict.verifyDesc);
  safeSetText('btnVerifyText', dict.verifyBtn);
  safeSetText('navTextMine', dict.navMine);
  safeSetText('navTextQuiz', dict.navQuiz);
  safeSetText('navTextTasks', dict.navTasks);
  safeSetText('navTextFriends', dict.navFriends);
  safeSetText('navTextWallet', dict.navWallet);
  safeSetText('navDocsLabel', dict.docs);

  const langSelect = document.getElementById('languageSelect');
  if (langSelect && langSelect.value !== state.lang) {
    langSelect.value = state.lang;
  }

  renderDocsContent();
}

function stopQuizTimer() {
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
}

// --- TAB SWITCHING ---
function switchTab(tabId) {
  if (tabId !== 'tabQuiz') {
    stopQuizTimer();
  }

  ['tabMine', 'tabQuiz', 'tabTasks', 'tabFriends', 'tabWallet'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.remove('hidden');

  ['navMine', 'navQuiz', 'navTasks', 'navFriends', 'navWallet'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('text-sky-400');
      el.classList.add('text-slate-400');
    }
  });

  const navMap = { tabMine: 'navMine', tabQuiz: 'navQuiz', tabTasks: 'navTasks', tabFriends: 'navFriends', tabWallet: 'navWallet' };
  const currentNav = document.getElementById(navMap[tabId]);
  if (currentNav) {
    currentNav.classList.remove('text-slate-400');
    currentNav.classList.add('text-sky-400');
  }

  updateHUD();
  if (tabId === 'tabQuiz') {
    startQuizRound();
  }
}

// --- WORD PUZZLE MINING ENGINE (CORRECTED: NO ENERGY CUT ON WIN) ---
function initCurrentPuzzle() {
  const activeDict = (typeof MINE_DICTIONARY !== 'undefined') ? MINE_DICTIONARY : (typeof LOCAL_WORDS !== 'undefined' ? LOCAL_WORDS : {});
  const langWords = (activeDict && activeDict[state.lang]) ? activeDict[state.lang] : (activeDict ? (activeDict.en || activeDict.hi) : []);

  if (!langWords || langWords.length === 0) return;

  const rawItem = langWords[(state.mineLevel - 1) % langWords.length];
  const targetWord = (typeof rawItem === 'object' && rawItem.word) ? rawItem.word : rawItem;
  
  // मात्राओं को अक्षर के साथ जोड़कर रखना (जैसे 'कि', 'ता' एक साथ रहे, अलग न टूटे)
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(state.lang || 'en', { granularity: 'grapheme' });
    currentTargetTiles = Array.from(segmenter.segment(targetWord), s => s.segment);
  } else {
    currentTargetTiles = Array.from(targetWord);
  }
  state.selectedLetters = [];

  // उसी भाषा से 2-3 आसान और साफ़ अक्षर चुनना
  let allChars = [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(state.lang || 'en', { granularity: 'grapheme' });
    langWords.forEach(w => {
      const str = (typeof w === 'object' && w.word) ? w.word : w;
      for (const seg of segmenter.segment(str)) {
        if (!/^[\u0901-\u0903\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963]/.test(seg.segment)) {
          allChars.push(seg.segment);
        }
      }
    });
  } else {
    allChars = ["क", "म", "न", "स", "र", "ल", "प", "द", "त"];
  }

  const cleanFillers = [...new Set(allChars)].filter(c => !currentTargetTiles.includes(c));
  const randomFillers = cleanFillers.sort(() => Math.random() - 0.5).slice(0, 3);

  const pool = [...currentTargetTiles, ...randomFillers];
  currentScrambledTiles = pool.sort(() => Math.random() - 0.5);

  renderPuzzleBoard();
  updateHUD();
}

function renderPuzzleBoard() {
  const boxesContainer = document.getElementById('boxesContainer');
  const lettersContainer = document.getElementById('lettersContainer');
  if (!boxesContainer || !lettersContainer) return;

  boxesContainer.innerHTML = '';
  for (let i = 0; i < currentTargetTiles.length; i++) {
    const char = state.selectedLetters[i] || '';
    const box = document.createElement('div');
    box.className = `w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all shadow ${
      char ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-900 border-slate-700 text-slate-500'
    }`;
    box.innerText = char;
    boxesContainer.appendChild(box);
  }

  lettersContainer.innerHTML = '';
  currentScrambledTiles.forEach((letter, idx) => {
    const btn = document.createElement('button');
    btn.className = "w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 text-white font-bold text-sm transition-all shadow";
    btn.innerText = letter;
    btn.onclick = () => selectLetter(letter, idx, btn);
    lettersContainer.appendChild(btn);
  });

  safeSetText('mineBadgeLevelInfo', `Level ${state.mineLevel} • ${currentTargetTiles.length} Boxes`);
  const baseReward = 3;
  const finalReward = state.isVerified ? baseReward * 2 : baseReward;
  safeSetText('mineRewardBadge', `+${finalReward} POM`);
}

function selectLetter(letter, idx, element) {
  if (state.selectedLetters.length < currentTargetTiles.length) {
    state.selectedLetters.push(letter);
    element.style.visibility = 'hidden';
    renderPuzzleBoxesOnly();
  }
}

function renderPuzzleBoxesOnly() {
  const boxesContainer = document.getElementById('boxesContainer');
  if (!boxesContainer) return;
  Array.from(boxesContainer.children).forEach((box, i) => {
    const char = state.selectedLetters[i] || '';
    box.className = `w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all shadow ${
      char ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-900 border-slate-700 text-slate-500'
    }`;
    box.innerText = char;
  });
}

function clearSelectedLetters() {
  state.selectedLetters = [];
  renderPuzzleBoard();
}

function submitMiningBlock() {
  if (state.energy <= 0) {
    openEnergyModal();
    return;
  }

  const isCorrect = state.selectedLetters.length === currentTargetTiles.length &&
    state.selectedLetters.every((val, index) => val === currentTargetTiles[index]);

  if (isCorrect) {
    let baseMineReward = 3;
    if (state.mineLevel >= 81) {
      baseMineReward = 30;
    } else if (state.mineLevel >= 51) {
      baseMineReward = 15;
    } else if (state.mineLevel >= 21) {
      baseMineReward = 8;
    }
    const reward = state.isVerified ? (baseMineReward * 2) : baseMineReward;
    state.balance += reward;
    state.mineLevel++;
    // सही उत्तर पर एनर्जी (❤️) नहीं कटेगी
    creditReferralCommission(reward);
    saveActiveState();
    showToast(`Block Mined! +${reward} POM credited`, "🎉");

    if (CONFIG.BACKEND_API_URL) {
      fetch(`${CONFIG.BACKEND_API_URL}/api/game/mine-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: state.telegram_id })
      }).catch(e => console.log(e));
    }

    initCurrentPuzzle();
  } else {
    state.energy--; // केवल गलत शब्द बनाने पर 1 हार्ट कटेगा
    saveActiveState();
    updateHUD();
    showToast("Incorrect word! -1 ❤️ lost", "❌");
    clearSelectedLetters();
  }

  if (state.energy <= 0) {
    openEnergyModal();
  }
}

// --- DYNAMIC NEVER-ENDING QUIZ GENERATOR ---
let playedQuestionIds = new Set();

function generateDynamicQuestion(lang = 'hi') {
  const isHi = lang === 'hi';
  const modes = ['math_add', 'math_mul', 'iq_series', 'crypto_calc', 'static_pool'];
  const mode = modes[Math.floor(Math.random() * modes.length)];

  if (mode === 'math_add') {
    const a = Math.floor(Math.random() * 85) + 12;
    const b = Math.floor(Math.random() * 85) + 15;
    const ans = a + b;
    const opts = [ans, ans + 2, ans - 3, ans + 10].sort(() => Math.random() - 0.5);
    return {
      q: isHi ? `त्वरित गणना: ${a} + ${b} का मान क्या होगा?` : `Speed Math: What is ${a} + ${b}?`,
      options: opts.map(String),
      correct: opts.indexOf(ans)
    };
  }

  if (mode === 'math_mul') {
    const a = Math.floor(Math.random() * 14) + 3;
    const b = Math.floor(Math.random() * 11) + 4;
    const ans = a * b;
    const opts = [ans, ans + 4, ans - 5, ans + 12].sort(() => Math.random() - 0.5);
    return {
      q: isHi ? `माइंड लॉजिक: ${a} × ${b} = ?` : `Mental Logic: ${a} × ${b} = ?`,
      options: opts.map(String),
      correct: opts.indexOf(ans)
    };
  }

  if (mode === 'iq_series') {
    const start = Math.floor(Math.random() * 15) + 2;
    const step = Math.floor(Math.random() * 6) + 3;
    const s1 = start, s2 = start + step, s3 = start + step * 2, s4 = start + step * 3;
    const ans = start + step * 4;
    const opts = [ans, ans + step, ans - 2, ans + 4].sort(() => Math.random() - 0.5);
    return {
      q: isHi ? `पैटर्न पहचानें: ${s1}, ${s2}, ${s3}, ${s4}, [ ? ]` : `Complete the series: ${s1}, ${s2}, ${s3}, ${s4}, [ ? ]`,
      options: opts.map(String),
      correct: opts.indexOf(ans)
    };
  }

  if (mode === 'crypto_calc') {
    const tonVal = Math.floor(Math.random() * 8) + 2;
    const rate = 150;
    const ans = tonVal * rate;
    const opts = [ans, ans + rate, ans - 50, ans * 2].sort(() => Math.random() - 0.5);
    return {
      q: isHi ? `यदि 1 TON = ${rate} POM है, तो ${tonVal} TON में कितने POM बनेंगे?` : `If 1 TON = ${rate} POM, how many POM in ${tonVal} TON?`,
      options: opts.map(String),
      correct: opts.indexOf(ans)
    };
  }

  const dictList = (typeof QUIZ_QUESTIONS !== 'undefined' && QUIZ_QUESTIONS[lang]) 
    ? QUIZ_QUESTIONS[lang] 
    : (typeof QUIZ_QUESTIONS !== 'undefined' && QUIZ_QUESTIONS.hi ? QUIZ_QUESTIONS.hi : []);

  if (dictList && dictList.length > 0) {
    let unplayed = dictList.filter((_, idx) => !playedQuestionIds.has(`${lang}_${idx}`));
    if (unplayed.length === 0) {
      playedQuestionIds.clear();
      unplayed = dictList;
    }
    const chosen = unplayed[Math.floor(Math.random() * unplayed.length)];
    const chosenIdx = dictList.indexOf(chosen);
    playedQuestionIds.add(`${lang}_${chosenIdx}`);
    return chosen;
  }

  return {
    q: isHi ? "Web3 में विकेंद्रीकरण (Decentralization) का क्या अर्थ है?" : "What does Decentralization mean in Web3?",
    options: isHi ? ["उपयोगकर्ता का स्वामित्त्व", "एकल सर्वर नियंत्रण", "सरकारी एकाधिकार", "सीमित उपयोग"] : ["User Ownership", "Single Server", "Centralized", "Closed Source"],
    correct: 0
  };
}

function startQuizRound() {
  stopQuizTimer();

  const currentQ = generateDynamicQuestion(state.lang || 'hi');
  if (!currentQ) return;

  const questionEl = document.getElementById('quizQuestionText');
  const optsContainer = document.getElementById('quizOptionsContainer');
  if (questionEl) questionEl.innerText = currentQ.q;
  if (!optsContainer) return;

  optsContainer.innerHTML = '';
  currentQ.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'w-full py-3.5 px-4 rounded-xl bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500 font-semibold text-slate-100 transition-all text-center active:scale-95 text-sm sm:text-base';
    btn.innerText = opt;
    btn.onclick = () => submitQuizAnswer(idx, currentQ.correct);
    optsContainer.appendChild(btn);
  });

  quizRemainingTime = 25;
  updateQuizTimerBar();
  quizTimer = setInterval(() => {
    quizRemainingTime--;
    updateQuizTimerBar();
    if (quizRemainingTime <= 0) {
      stopQuizTimer();
      state.energy--;
      saveActiveState();
      updateHUD();
      showToast("Time up! -1 ❤️ lost", "⌛");
      if (state.energy <= 0) openEnergyModal();
      state.quizLevel++;
      startQuizRound();
    }
  }, 1000);
}

function updateQuizTimerBar() {
  const bar = document.getElementById('quizTimerBar');
  if (bar) bar.style.width = `${(quizRemainingTime / 25) * 100}%`;
}

function submitQuizAnswer(selectedIdx, correctIdx) {
  stopQuizTimer();
  if (state.energy <= 0) {
    openEnergyModal();
    return;
  }

  if (selectedIdx === correctIdx) {
    let baseReward = 2;
    if (state.quizLevel >= 81) {
      baseReward = 20;
    } else if (state.quizLevel >= 51) {
      baseReward = 10;
    } else if (state.quizLevel >= 21) {
      baseReward = 5;
    }
    const reward = state.isVerified ? (baseReward * 2) : baseReward;
    state.balance += reward;
    state.quizLevel++;
    // सही उत्तर पर एनर्जी (❤️) नहीं कटेगी
    creditReferralCommission(reward);
    saveActiveState();
    showToast(`Correct Answer! +${reward} POM`, "🌟");
  } else {
    state.energy--;
    saveActiveState();
    showToast("Incorrect answer! -1 ❤️ lost", "❌");
    state.quizLevel++;
  }

  updateHUD();
  if (state.energy <= 0) openEnergyModal();
  startQuizRound();
}

// --- AUTOMATIC OUT-OF-ENERGY POPUP ---
function openEnergyModal() {
  document.getElementById('energyModal')?.classList.remove('hidden');
}

function closeEnergyModal() {
  document.getElementById('energyModal')?.classList.add('hidden');
}

function watchAdAndRefill(amount) {
  const blockId = (typeof CONFIG !== 'undefined' && CONFIG.ADSGRAM_BLOCK_ID) ? CONFIG.ADSGRAM_BLOCK_ID : "57910";

  if (window.Adsgram) {
    showToast("Loading Ad...", "⏳");
    const AdController = window.Adsgram.init({ blockId: blockId, debug: true });
    
    AdController.show().then((result) => {
      state.energy = 5;
      saveActiveState();
      closeEnergyModal();
      updateHUD();
      showToast("Energy Recharged (Full ❤️)!", "⚡");
    }).catch((result) => {
      // टेस्टिंग फ़ॉलबैक: ब्लॉक एक्टिव न होने पर भी टेस्ट के लिए एनर्जी दे देगा
      console.warn("Adsgram inactive, granting test refill:", result);
      state.energy = 5;
      saveActiveState();
      closeEnergyModal();
      updateHUD();
      showToast("Test Refill: Full Energy Restored!", "⚡");
    });
  } else {
    state.energy = 5;
    saveActiveState();
    closeEnergyModal();
    updateHUD();
    showToast("Test Refill: Full Energy Restored!", "⚡");
  }
}

// --- COMMUNITY TASKS ---
function renderTasks() {
  const container = document.getElementById('tasksListContainer');
  if (!container) return;
  container.innerHTML = '';

  const activeLangTasks = TASK_TRANSLATIONS[state.lang] || TASK_TRANSLATIONS.en;

  state.tasks.forEach((task, idx) => {
    const card = document.createElement('div');
    card.className = "bg-brand-card border border-brand-cardBorder rounded-xl p-3 flex items-center justify-between shadow";

    const localizedTitle = activeLangTasks[task.id] || task.title;

    let actionBtnHtml = '';
    if (task.completed) {
      actionBtnHtml = `<span class="text-emerald-400 font-bold text-xs bg-emerald-950/80 px-2.5 py-1 rounded-lg">✔ Done</span>`;
    } else if (task.started) {
      actionBtnHtml = `<button onclick="claimTaskReward(${idx})" class="bg-gradient-to-r from-amber-500 to-amber-600 active:scale-95 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow">Claim ✨</button>`;
    } else {
      actionBtnHtml = `<button onclick="startTask(${idx})" class="bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow">Start ↗</button>`;
    }

    card.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
          <i class="${task.icon} text-sm"></i>
        </div>
        <div>
          <h4 class="text-xs font-bold text-white truncate max-w-[190px]">${localizedTitle}</h4>
          <span class="text-[9px] text-amber-400 font-bold">+${task.reward} POM</span>
        </div>
      </div>
      <div>${actionBtnHtml}</div>
    `;
    container.appendChild(card);
  });
}

function startTask(idx) {
  const link = state.tasks[idx].link;
  if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(link);
  } else {
    window.open(link, '_blank');
  }
  state.tasks[idx].started = true;
  saveActiveState();
  renderTasks();
}

function claimTaskReward(idx) {
  state.balance += state.tasks[idx].reward;
  state.tasks[idx].completed = true;
  saveActiveState();
  updateHUD();
  renderTasks();
  showToast(`+${state.tasks[idx].reward} POM Claimed!`, "🎁");
}

// --- REFERRALS ---
function getReferralLink() {
  return `https://t.me/${CONFIG.BOT_USERNAME}?startapp=ref_${state.telegram_id}`;
}

function creditReferralCommission(amount) {
  state.unclaimedCommission += (amount * 0.10) + (amount * 0.03) + (amount * 0.02);
  saveActiveState();
  safeSetText('unclaimedCommissionDisplay', `${state.unclaimedCommission.toFixed(1)} POM`);
}

function claimReferralRewards() {
  if (state.unclaimedCommission <= 0) {
    showToast("No unclaimed commissions right now.", "ℹ️");
    return;
  }
  state.balance += Math.floor(state.unclaimedCommission);
  state.unclaimedCommission = 0;
  saveActiveState();
  safeSetText('unclaimedCommissionDisplay', `0.0 POM`);
  updateHUD();
  showToast("Commissions claimed to balance!", "💰");
}

function copyReferralLink() {
  const link = getReferralLink();
  navigator.clipboard.writeText(link);
  showToast("Referral link copied!", "📋");
}

function shareReferralToTelegram() {
  const url = encodeURIComponent(getReferralLink());
  const text = encodeURIComponent("🧠 Join Proof of Mind! Mine POM tokens with your intellect on TON & Pi Network.");
  const shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}

// --- TONCONNECT 2.0 INITIALIZATION & REAL WALLET POPUP ---
function initRealTonConnect() {
  try {
    if (window.TON_CONNECT_UI) {
      const manifestUrl = window.location.origin.includes('http')
        ? `${window.location.origin}/tonconnect-manifest.json`
        : 'https://proof-of-mind-vvnd.vercel.app/tonconnect-manifest.json';

      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: manifestUrl
      });

      tonConnectUI.onStatusChange(wallet => {
        if (wallet && wallet.account) {
          state.tonConnected = true;
          state.tonAddress = wallet.account.address;
          saveActiveState();
          updateHUD();
          showToast("TON Wallet Connected!", "💎");
        } else {
          state.tonConnected = false;
          state.tonAddress = null;
          saveActiveState();
          updateHUD();
        }
      });
    }
  } catch (err) {
    console.error("TonConnect error:", err);
  }
}

async function toggleTonConnection() {
  if (state.tonConnected) {
    if (tonConnectUI) {
      try { await tonConnectUI.disconnect(); } catch (e) {}
    }
    state.tonConnected = false;
    state.tonAddress = null;
    saveActiveState();
    updateHUD();
    showToast("TON Wallet Disconnected", "💎");
  } else {
    if (tonConnectUI) {
      try {
        await tonConnectUI.openModal();
      } catch (e) {
        openTonVerifyModal();
      }
    } else {
      openTonVerifyModal();
    }
  }
}

function handleWalletVerifyClick() {
  if (state.isVerified) {
    showToast("Account already verified with 2x Boost active!", "✔");
    return;
  }
  openTonVerifyModal();
}

function openTonVerifyModal() { document.getElementById('tonVerifyModal')?.classList.remove('hidden'); }
function closeTonVerifyModal() { document.getElementById('tonVerifyModal')?.classList.add('hidden'); }

function copyAdminTonAddress() {
  navigator.clipboard.writeText(CONFIG.ADMIN_TON_WALLET);
  showToast("Admin TON Wallet copied!", "📋");
}

async function triggerTonConnectPayment() {
  if (!state.tonConnected || !tonConnectUI) {
    showToast("Please connect TON wallet first!", "⚠️");
    return;
  }
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: CONFIG.ADMIN_TON_WALLET,
        amount: "300000000" // 0.3 TON (Nanotons)
      }
    ]
  };
  try {
    showToast("Opening wallet for 0.3 TON payment...", "⏳");
    await tonConnectUI.sendTransaction(transaction);
    completeTonVerificationTransaction();
  } catch (err) {
    console.error("Payment error:", err);
    showToast("Transaction cancelled or failed", "❌");
  }
}

function openTonkeeperPay() {
  const transferUrl = `https://app.tonkeeper.com/transfer/${CONFIG.ADMIN_TON_WALLET}?amount=300000000&text=POM-Verify`;
  if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(transferUrl);
  } else {
    window.open(transferUrl, '_blank');
  }
  showToast("Opening Tonkeeper...", "💎");
}

function openTelegramWalletPay() {
  const tgWalletUrl = `https://t.me/wallet?startattach=ton_transfer_${CONFIG.ADMIN_TON_WALLET}_300000000`;
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(tgWalletUrl);
  } else if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(tgWalletUrl);
  } else {
    window.open(tgWalletUrl, '_blank');
  }
  showToast("Opening Telegram Wallet...", "💎");
}

function completeTonVerificationTransaction() {
  state.isVerified = true;
  saveActiveState();
  closeTonVerifyModal();
  updateHUD();

  if (CONFIG.BACKEND_API_URL) {
    fetch(`${CONFIG.BACKEND_API_URL}/api/wallet/verify-ton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: state.telegram_id,
        tonAddress: state.tonAddress || "Tonkeeper_Verified"
      })
    }).catch(e => console.log(e));
  }

  showToast("0.3 TON Verification confirmed! 2x boost active.", "🛡️");
}

function connectPiWallet() {
  safeSetText('piStatusBadge', 'Pi Connected');
  safeSetText('piUserText', '@pioneer_mind (Verified)');
  showToast("Pi Network Pioneer Connected!", "π");
}

// --- HUD UPDATER (CLEAN ADDRESS DISPLAY) ---
function updateHUD() {
  safeSetText('userBalanceDisplay', state.balance);
  safeSetText('walletTotalPomDisplay', `${state.balance} POM`);
  safeSetText('referralLinkText', getReferralLink());
  safeSetText('tier1UsersCount', state.tier1Users);
  safeSetText('tier2UsersCount', state.tier2Users);
  safeSetText('tier3UsersCount', state.tier3Users);

  const isQuizTab = !document.getElementById('tabQuiz').classList.contains('hidden');
  safeSetText('labelLevel', isQuizTab ? (state.lang === 'hi' ? 'क्विज़ लेवल' : 'Quiz Level') : (state.lang === 'hi' ? 'माइन लेवल' : 'Mine Level'));
  safeSetText('userLevelDisplay', isQuizTab ? state.quizLevel : state.mineLevel);

  const heartsContainer = document.getElementById('heartsContainer');
  if (heartsContainer) {
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += i < state.energy ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart text-slate-600"></i>';
    }
    heartsContainer.innerHTML = html;
  }

  const headerTick = document.getElementById('headerVerifiedTick');
  if (headerTick) {
    if (state.isVerified) headerTick.classList.remove('hidden');
    else headerTick.classList.add('hidden');
  }

  const btnVerify = document.getElementById('btnWalletVerifyAction');
  if (btnVerify) {
    if (state.isVerified) {
      btnVerify.className = "w-full bg-emerald-600 text-white font-black text-xs py-2 rounded-xl shadow transition-all cursor-default flex items-center justify-center space-x-1.5";
      btnVerify.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>✔ 0.3 TON Verified (2x Boost Active)</span>`;
    } else {
      btnVerify.className = "w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs py-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center space-x-1.5";
      btnVerify.innerHTML = `<i class="fa-solid fa-bolt text-xs"></i><span id="btnVerifyText">${TRANSLATIONS[state.lang]?.verifyBtn || "Verify 0.3 TON"}</span>`;
    }
  }

  safeSetText('walletAirdropMult', state.isVerified ? "2x Verified Multiplier" : "1x Base Multiplier");
  safeSetText('walletVerificationText', state.isVerified ? "Status: Verified Pioneer" : "Status: Unverified");

  if (state.tonConnected) {
    safeSetText('tonStatusBadge', 'TON Connected');
    let raw = state.tonAddress || "";
    try {
      if (typeof TonConnectSDK !== 'undefined' && TonConnectSDK.toUserFriendlyAddress && raw.startsWith("0:")) {
        raw = TonConnectSDK.toUserFriendlyAddress(raw);
      } else if (typeof tonConnectUI !== 'undefined' && tonConnectUI.toUserFriendlyAddress && raw.startsWith("0:")) {
        raw = tonConnectUI.toUserFriendlyAddress(raw);
      } else if (window.TON_CONNECT_UI && window.TON_CONNECT_UI.toUserFriendlyAddress && raw.startsWith("0:")) {
        raw = window.TON_CONNECT_UI.toUserFriendlyAddress(raw);
      }
    } catch (e) {
      console.log("Address format error:", e);
    }
    let displayAddr = raw || "Connected";
    if (displayAddr.length > 14) {
      displayAddr = `${displayAddr.slice(0, 8)}...${displayAddr.slice(-6)}`;
    }
    safeSetText('tonAddressText', `Address: ${displayAddr}`);
    const btn = document.getElementById('btnConnectTon');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-link-slash mr-1"></i> Disconnect TON';
  } else {
    safeSetText('tonStatusBadge', 'Not Connected');
    safeSetText('tonAddressText', 'No TON wallet connected yet');
    const btn = document.getElementById('btnConnectTon');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-wallet mr-1"></i> <span id="btnConnectTonText">${TRANSLATIONS[state.lang]?.connectTon || "Connect TON"}</span>`;
  }
}

// --- UNCLIPPED WHITEPAPER MODAL ---
function renderDocsContent() {
  const container = document.getElementById('docsBodyContainer');
  if (!container) return;

  const d = WHITEPAPER_DATA[state.lang] || WHITEPAPER_DATA.en;

  container.innerHTML = `
    <div><h4 class="text-sky-400 font-bold uppercase text-[10px] mb-1">${d.s1}</h4><p>${d.p1}</p></div>
    <div><h4 class="text-sky-400 font-bold uppercase text-[10px] mb-1">${d.s2}</h4>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1 font-mono text-[9px]">
        <div class="flex justify-between"><span>• Community Mining:</span><span class="text-amber-400 font-bold">50% (500M)</span></div>
        <div class="flex justify-between"><span>• Referrals & Tasks:</span><span class="text-sky-400 font-bold">15% (150M)</span></div>
        <div class="flex justify-between"><span>• Merit Core Team:</span><span class="text-emerald-400 font-bold">10% (100M)</span></div>
        <div class="flex justify-between"><span>• Infrastructure:</span><span class="text-indigo-400 font-bold">10% (100M)</span></div>
        <div class="flex justify-between"><span>• Liquidity & DEX:</span><span class="text-rose-400 font-bold">10% (100M)</span></div>
        <div class="flex justify-between"><span>• Early Airdrop:</span><span class="text-purple-400 font-bold">5% (50M)</span></div>
      </div>
    </div>
    <div><h4 class="text-sky-400 font-bold uppercase text-[10px] mb-1">${d.s3}</h4><p>${d.p3}</p></div>
    <div><h4 class="text-sky-400 font-bold uppercase text-[10px] mb-1">${d.s4}</h4><p>${d.p4}</p></div>
    <div><h4 class="text-sky-400 font-bold uppercase text-[10px] mb-1">${d.s5}</h4><p>${d.p5}</p></div>
    <div><h4 class="text-sky-400 font-bold uppercase text-[10px] mb-1">${d.s6}</h4><p>${d.p6}</p></div>
  `;
}

function openDocsModal() {
  renderDocsContent();
  document.getElementById('docsModal')?.classList.remove('hidden');
}
function closeDocsModal() { document.getElementById('docsModal')?.classList.add('hidden'); }

// --- ADMIN CONTROL CONSOLE ---
function openAdminModal() { document.getElementById('adminModal')?.classList.remove('hidden'); }
function closeAdminModal() { document.getElementById('adminModal')?.classList.add('hidden'); }

function submitAdminLogin() {
  const u = document.getElementById('adminUsernameInput').value;
  const p = document.getElementById('adminPasswordInput').value;
  if (u === 'admin' && (p === 'pom2026' || p === 'admin123')) {
    document.getElementById('adminLoginView').classList.add('hidden');
    document.getElementById('adminDashboardView').classList.remove('hidden');
    document.getElementById('adminLogoutBtn').classList.remove('hidden');
    refreshAdminDashboard();
    showToast("Master Admin Authorized!", "🛡️");
  } else {
    showToast("Invalid admin credentials!", "❌");
  }
}

function logoutAdmin() {
  document.getElementById('adminLoginView').classList.remove('hidden');
  document.getElementById('adminDashboardView').classList.add('hidden');
  document.getElementById('adminLogoutBtn').classList.add('hidden');
  document.getElementById('adminUsernameInput').value = '';
  document.getElementById('adminPasswordInput').value = '';
  showToast("Admin session locked", "🔒");
}

function adminSaveBotHandle() {
  const handle = document.getElementById('adminBotHandleInput').value.trim().replace('@', '');
  if (handle) {
    CONFIG.BOT_USERNAME = handle;
    updateHUD();
    refreshAdminDashboard();
    showToast(`Bot handle updated: @${handle}`, "✔");
  }
}

function refreshAdminDashboard() {
  const wordStr = currentTargetTiles.join('');
  const poolStr = currentScrambledTiles.join(', ');
  safeSetText('adminCurrentWordHint', `Target: ${wordStr} | Tiles Pool: [ ${poolStr} ] | Current Lang: ${state.lang.toUpperCase()}`);

  const summary = document.getElementById('adminTaskListSummary');
  if (summary) {
    summary.innerHTML = '';
    state.tasks.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = "flex items-center justify-between bg-slate-800 p-1.5 rounded text-[10px]";
      row.innerHTML = `<span class="truncate max-w-[200px] text-slate-300">${t.title} (+${t.reward})</span><button onclick="adminRemoveTask(${i})" class="text-rose-400 font-bold hover:text-rose-300">✕</button>`;
      summary.appendChild(row);
    });
  }
}

function copyTelegramChannelHint() {
  const wordStr = currentTargetTiles.join('');
  const postText = `🧠 Proof of Mind (POM) Community Intellect Drop!\n\nSolve Level ${state.mineLevel} now.\nTarget Length: ${currentTargetTiles.length} Letters\nLetter Pool: ${currentScrambledTiles.join(' ')}\n\nMine block now 👉 https://t.me/${CONFIG.BOT_USERNAME}?startapp=ref_channel`;
  navigator.clipboard.writeText(postText);
  showToast("Telegram post copied to clipboard!", "📋");
}

function adminAddTask() {
  const title = document.getElementById('adminNewTaskTitle').value;
  const link = document.getElementById('adminNewTaskLink').value;
  const reward = parseInt(document.getElementById('adminNewTaskReward').value) || 50;
  if (!title || !link) {
    showToast("Fill title & link", "⚠️");
    return;
  }
  state.tasks.push({
    id: "task_" + Date.now(),
    title: title,
    link: link,
    reward: reward,
    started: false,
    completed: false,
    icon: "fa-solid fa-star"
  });
  saveActiveState();
  renderTasks();
  refreshAdminDashboard();
  document.getElementById('adminNewTaskTitle').value = '';
  document.getElementById('adminNewTaskLink').value = '';
  showToast("Task dispatched live!", "🚀");
}

function adminRemoveTask(index) {
  state.tasks.splice(index, 1);
  saveActiveState();
  renderTasks();
  refreshAdminDashboard();
  showToast("Task removed", "🗑️");
}

function adminDevBoostPOM(amt) {
  state.balance += amt;
  saveActiveState();
  updateHUD();
  showToast(`Added +${amt} POM!`, "💰");
}

function adminDevBoostLevel(levels) {
  state.mineLevel += levels;
  state.quizLevel += levels;
  saveActiveState();
  initCurrentPuzzle();
  showToast(`Advanced +${levels} Levels!`, "⚡");
}

function adminDevRefillHearts() {
  state.energy = 5;
  saveActiveState();
  updateHUD();
  showToast("Hearts refilled to 5 ❤️!", "❤️");
}

function adminDevToggleVerify() {
  state.isVerified = !state.isVerified;
  saveActiveState();
  updateHUD();
  showToast(`2x Boost is now ${state.isVerified ? 'ENABLED' : 'DISABLED'}`, "🛡️");
}

function adminSimulateReferral() {
  state.tier1Users += 1;
  saveActiveState();
  updateHUD();
  showToast("Added +1 Tier 1 Referral!", "👥");
}

function adminResetAllData() {
  localStorage.removeItem('POM_USER_STATE');
  state.balance = 130;
  state.mineLevel = 1;
  state.quizLevel = 1;
  state.energy = 5;
  state.isVerified = false;
  state.tier1Users = 0;
  state.tier2Users = 0;
  state.tier3Users = 0;
  state.unclaimedCommission = 0;
  initCurrentPuzzle();
  renderTasks();
  updateHUD();
  refreshAdminDashboard();
  showToast("State reset to defaults", "🔄");
}

// --- APPLICATION STARTUP ---
async function startApp() {
    let startParam = "";
    let tgUser = null;

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        startParam = window.Telegram.WebApp.initDataUnsafe?.start_param || "";

        if (tgUser && tgUser.id) {
            state.telegram_id = String(tgUser.id);
        }
    }

    loadSavedState();
    applyCurrentLanguage();
    initCurrentPuzzle();
    renderTasks();
    updateHUD();
    initRealTonConnect();

    // --- बैकएंड पर यूज़र और रेफ़रल सिंक करने का कोड ---
    if (CONFIG.BACKEND_API_URL && state.telegram_id && state.telegram_id !== "pioneer") {
        try {
            const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/user/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telegram_id: state.telegram_id,
                    username: tgUser?.username || "",
                    first_name: tgUser?.first_name || "",
                    start_param: startParam
                })
            });
            const data = await res.json();
            if (data && data.user) {
                // सर्वर से ताज़ा रेफ़रल काउंट और डेटा अपडेट करें
                if (data.user.referrals?.tier1) {
                    state.tier1Users = data.user.referrals.tier1.length;
                }
                updateHUD();
            }
        } catch (err) {
            console.error("User sync error:", err);
        }
    }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
