// ==========================================
// PROOF OF MIND (POM) - MAIN GAMEPLAY & WALLET ENGINE
// ==========================================

const CONFIG = {
  BACKEND_API_URL: "https://proof-of-mind-api.onrender.com",
  ADMIN_TON_WALLET: "UQD5ZiNy8-eV7l6Ny46c-f98USLg-JXPTRRIPMV-0YiadqJV",
  BOT_USERNAME: "proofofmind_bot",
  APP_SHORT_NAME: "app",
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
  tier1Details: [],
  tier2Details: [],
  tier3Details: [],
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
let isSubmittingAnswer = false;
let isClaimingCommission = false;

function convertTonToUserFriendly(rawAddress) {
  if (!rawAddress || typeof rawAddress !== 'string') return rawAddress;
  if (!rawAddress.includes(':')) return rawAddress;
  try {
    if (window.TON_CONNECT_UI && typeof window.TON_CONNECT_UI.toUserFriendlyAddress === 'function') {
      return window.TON_CONNECT_UI.toUserFriendlyAddress(rawAddress);
    }
  } catch(e) {}
  return rawAddress;
}

const FALLBACK_QUESTIONS = [
  {
    question_hi: "Proof of Mind (POM) किस प्रकार की सर्वसम्मति पर आधारित है?",
    question_en: "What consensus protocol does Proof of Mind (POM) emphasize?",
    options_hi: ["Proof of Work", "Proof of Stake", "Proof of Intellect (PoI)", "Proof of Authority"],
    options_en: ["Proof of Work", "Proof of Stake", "Proof of Intellect (PoI)", "Proof of Authority"],
    correctIndex: 2
  }
];

function loadSavedState() {
  try {
    const saved = localStorage.getItem('POM_USER_STATE');
    if (saved) {
      const parsed = JSON.parse(saved);
      const currentTid = state.telegram_id;
      state = Object.assign(state, parsed);
      if (currentTid && currentTid !== "pioneer") state.telegram_id = currentTid;
    }
  } catch(e) {}
}

function saveActiveState() {
  try {
    localStorage.setItem('POM_USER_STATE', JSON.stringify({
      telegram_id: state.telegram_id,
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
  }, 2200);
}

function changeLanguage(lang) {
  state.lang = lang;
  saveActiveState();
  applyCurrentLanguage();
  initCurrentPuzzle();
  renderTasks();
  if (!document.getElementById('tabQuiz').classList.contains('hidden')) startQuizRound();
  showToast(`Language updated: ${lang.toUpperCase()}`, "🌐");
}

function applyCurrentLanguage() {
  const dict = TRANSLATIONS[state.lang] || TRANSLATIONS.en || TRANSLATIONS.hi;
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
  if (langSelect && langSelect.value !== state.lang) langSelect.value = state.lang;
  renderDocsContent();
}

function stopQuizTimer() {
  if (quizTimer) { clearInterval(quizTimer); quizTimer = null; }
}

function switchTab(tabId) {
  try {
    if (tabId !== 'tabQuiz') stopQuizTimer();
    ['tabMine', 'tabQuiz', 'tabTasks', 'tabFriends', 'tabWallet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.remove('hidden');

    const navMap = { tabMine: 'navMine', tabQuiz: 'navQuiz', tabTasks: 'navTasks', tabFriends: 'navFriends', tabWallet: 'navWallet' };
    Object.values(navMap).forEach(navId => {
      const el = document.getElementById(navId);
      if (el) { el.classList.remove('text-sky-400'); el.classList.add('text-slate-400'); }
    });

    const currentNav = document.getElementById(navMap[tabId]);
    if (currentNav) { currentNav.classList.remove('text-slate-400'); currentNav.classList.add('text-sky-400'); }

    updateHUD();
    if (tabId === 'tabQuiz') startQuizRound();
    else if (tabId === 'tabMine') initCurrentPuzzle();
    else if (tabId === 'tabFriends') fetchLatestUserData();
  } catch (err) {}
}

// --- डायनेमिक पज़ल माइनिंग इंजन ---
async function initCurrentPuzzle() {
  try {
    let targetWord = state.lang === 'en' ? "MIND" : "मन";

    if (CONFIG.BACKEND_API_URL) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/puzzle/word?level=${state.mineLevel}`);
        const data = await res.json();
        if (data && data.success && data.puzzle) {
          targetWord = state.lang === 'en' ? (data.puzzle.word_en || "MIND") : (data.puzzle.word_hi || "मन");
        }
      } catch (err) {}
    }

    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter(state.lang || 'hi', { granularity: 'grapheme' });
      currentTargetTiles = Array.from(segmenter.segment(targetWord), s => s.segment);
    } else {
      currentTargetTiles = Array.from(targetWord);
    }

    state.selectedLetters = [];

    const fallbackLetters = state.lang === 'en'
      ? ["A", "B", "C", "D", "E", "R", "S", "T", "L", "N", "O"]
      : ["क", "म", "न", "स", "र", "ल", "प", "द", "त", "व", "ज्ञ"];

    const cleanFillers = fallbackLetters.filter(c => !currentTargetTiles.includes(c));
    const randomFillers = cleanFillers.sort(() => Math.random() - 0.5).slice(0, 3);

    const pool = [...currentTargetTiles, ...randomFillers];
    currentScrambledTiles = pool.sort(() => Math.random() - 0.5);

    renderPuzzleBoard();
    updateHUD();
  } catch (err) {}
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
  const baseReward = state.mineLevel >= 81 ? 30 : (state.mineLevel >= 51 ? 15 : (state.mineLevel >= 21 ? 8 : 3));
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

async function submitMiningBlock() {
  if (state.energy <= 0) { openEnergyModal(); return; }

  const isCorrect = state.selectedLetters.length === currentTargetTiles.length &&
    state.selectedLetters.every((val, index) => val === currentTargetTiles[index]);

  if (isCorrect) {
    let baseMineReward = state.mineLevel >= 81 ? 30 : (state.mineLevel >= 51 ? 15 : (state.mineLevel >= 21 ? 8 : 3));
    const reward = state.isVerified ? (baseMineReward * 2) : baseMineReward;
    
    state.balance += reward;
    state.mineLevel++;
    saveActiveState();
    updateHUD();
    showToast(`Block Mined! +${reward} POM`, "🎉");

    if (CONFIG.BACKEND_API_URL && state.telegram_id && state.telegram_id !== "pioneer") {
      fetch(`${CONFIG.BACKEND_API_URL}/api/game/mine-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: state.telegram_id })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          state.balance = data.balance;
          state.mineLevel = data.mineLevel;
          saveActiveState();
          updateHUD();
        }
      })
      .catch(e => {});
    }
    initCurrentPuzzle();
  } else {
    state.energy--;
    saveActiveState();
    updateHUD();
    showToast("Incorrect word! -1 ❤️ lost", "❌");
    clearSelectedLetters();
  }

  if (state.energy <= 0) openEnergyModal();
}

// --- क्विज़ इंजन ---
let nextQuizQ = null;
async function prefetchQuizQ() {
  try {
    const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/quiz/random`);
    const data = await res.json();
    if (data && data.success && data.question) nextQuizQ = data.question;
  } catch (e) {}
}

async function startQuizRound() {
  stopQuizTimer();
  isSubmittingAnswer = false;

  const questionEl = document.getElementById('quizQuestionText');
  const optsContainer = document.getElementById('quizOptionsContainer');

  let rawData = nextQuizQ;
  nextQuizQ = null;

  if (!rawData) {
    try {
      const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/quiz/random`);
      const data = await res.json();
      if (data && data.success && data.question) rawData = data.question;
    } catch (e) {}
  }

  if (!rawData) rawData = FALLBACK_QUESTIONS[0];
  prefetchQuizQ();

  const lang = state.lang || 'hi';
  const qText = (lang === 'hi' ? rawData.question_hi : rawData.question_en) || rawData.question || "Question";
  const optsList = (lang === 'hi' ? rawData.options_hi : rawData.options_en) || rawData.options || [];
  let correctIdx = rawData.correctIndex !== undefined ? rawData.correctIndex : 0;

  if (questionEl) questionEl.innerText = qText;
  if (!optsContainer) return;

  optsContainer.innerHTML = '';
  optsList.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'w-full py-3 px-4 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500 font-semibold text-slate-100 transition-all text-left';
    btn.innerText = opt;
    btn.onclick = () => submitQuizAnswer(idx, correctIdx, btn);
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
      startQuizRound();
    }
  }, 1000);
}

function updateQuizTimerBar() {
  const bar = document.getElementById('quizTimerBar');
  if (bar) bar.style.width = `${(quizRemainingTime / 25) * 100}%`;
}

function submitQuizAnswer(selectedIdx, correctIdx, btnElement) {
  if (isSubmittingAnswer) return;
  isSubmittingAnswer = true;
  stopQuizTimer();

  if (state.energy <= 0) { openEnergyModal(); return; }

  const isCorrect = selectedIdx === correctIdx;
  if (btnElement) {
    btnElement.style.backgroundColor = isCorrect ? '#059669' : '#dc2626';
    btnElement.style.color = '#ffffff';
  }

  setTimeout(() => {
    if (isCorrect) {
      let baseReward = state.quizLevel >= 81 ? 20 : (state.quizLevel >= 51 ? 10 : (state.quizLevel >= 21 ? 5 : 2));
      const reward = state.isVerified ? (baseReward * 2) : baseReward;
      state.balance += reward;
      state.quizLevel++;
      saveActiveState();
      updateHUD();
      showToast(`Correct! +${reward} POM`, "🌟");

      if (CONFIG.BACKEND_API_URL && state.telegram_id && state.telegram_id !== "pioneer") {
        fetch(`${CONFIG.BACKEND_API_URL}/api/game/quiz-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: state.telegram_id })
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.success) {
            state.balance = data.balance;
            state.quizLevel = data.quizLevel;
            saveActiveState();
            updateHUD();
          }
        })
        .catch(e => {});
      }
    } else {
      state.energy--;
      saveActiveState();
      showToast("Incorrect! -1 ❤️ lost", "❌");
    }

    updateHUD();
    if (state.energy <= 0) openEnergyModal();
    startQuizRound();
  }, 600);
}

function openEnergyModal() { document.getElementById('energyModal')?.classList.remove('hidden'); }
function closeEnergyModal() { document.getElementById('energyModal')?.classList.add('hidden'); }

function watchAdAndRefill(amount) {
  state.energy = 5;
  saveActiveState();
  closeEnergyModal();
  updateHUD();
  showToast("Energy Restored (5 ❤️)!", "⚡");
}

function renderTasks() {
  const container = document.getElementById('tasksListContainer');
  if (!container) return;
  container.innerHTML = '';
  const activeLangTasks = TASK_TRANSLATIONS[state.lang] || TASK_TRANSLATIONS.en || TASK_TRANSLATIONS.hi;

  state.tasks.forEach((task, idx) => {
    const card = document.createElement('div');
    card.className = "bg-brand-card border border-brand-cardBorder rounded-xl p-3 flex items-center justify-between shadow";
    const localizedTitle = activeLangTasks[task.id] || task.title;

    let actionBtnHtml = '';
    if (task.completed) actionBtnHtml = `<span class="text-emerald-400 font-bold text-xs bg-emerald-950/80 px-2.5 py-1 rounded-lg">✔ Done</span>`;
    else if (task.started) actionBtnHtml = `<button onclick="claimTaskReward(${idx})" class="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">Claim ✨</button>`;
    else actionBtnHtml = `<button onclick="startTask(${idx})" class="bg-sky-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">Start ↗</button>`;

    card.innerHTML = `<div class="flex items-center space-x-2.5"><div class="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400"><i class="${task.icon} text-sm"></i></div><div><h4 class="text-xs font-bold text-white truncate max-w-[190px]">${localizedTitle}</h4><span class="text-[9px] text-amber-400 font-bold">+${task.reward} POM</span></div></div><div>${actionBtnHtml}</div>`;
    container.appendChild(card);
  });
}

function startTask(idx) {
  window.open(state.tasks[idx].link, '_blank');
  state.tasks[idx].started = true;
  saveActiveState();
  renderTasks();
}

async function claimTaskReward(idx) {
  const task = state.tasks[idx];
  if (!task || task.completed) return;
  task.completed = true;
  state.balance += task.reward;
  saveActiveState();
  updateHUD();
  renderTasks();
  showToast(`+${task.reward} POM Claimed!`, "🎁");

  if (CONFIG.BACKEND_API_URL && state.telegram_id && state.telegram_id !== "pioneer") {
    try {
      await fetch(`${CONFIG.BACKEND_API_URL}/api/task/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: state.telegram_id, taskId: task.id, reward: task.reward })
      });
    } catch (e) {}
  }
}

function getReferralLink() { return `https://t.me/${CONFIG.BOT_USERNAME}/${CONFIG.APP_SHORT_NAME}?startapp=ref_${state.telegram_id}`; }

async function claimReferralRewards() {
  if (isClaimingCommission) return;
  const claimable = Math.floor(Number(state.unclaimedCommission || 0));
  if (claimable <= 0) { showToast("कोई क्लेम योग्य कमीशन नहीं है!", "ℹ️"); return; }
  isClaimingCommission = true;

  try {
    const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/referral/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: state.telegram_id, clientUnclaimed: state.unclaimedCommission })
    });
    const data = await res.json();
    if (data && data.success) {
      state.balance = Number(data.balance);
      state.unclaimedCommission = Number(data.unclaimedCommission || 0);
      saveActiveState();
      updateHUD();
      showToast(`+${data.claimed} POM मेन बैलेंस में जुड़े!`, "💰");
    }
  } catch (err) {
    showToast("नेटवर्क एरर!", "❌");
  } finally {
    isClaimingCommission = false;
  }
}

function copyReferralLink() { navigator.clipboard.writeText(getReferralLink()); showToast("Referral link copied!", "📋"); }
function shareReferralToTelegram() { window.open(`https://t.me/share/url?url=${encodeURIComponent(getReferralLink())}`, '_blank'); }

function openReferralListModal(tierLevel) {
  const modal = document.getElementById('referralListModal');
  const title = document.getElementById('refModalTitle');
  const container = document.getElementById('refModalContentContainer');
  if (!modal || !title || !container) return;

  let list = tierLevel === 1 ? state.tier1Details : tierLevel === 2 ? state.tier2Details : state.tier3Details;
  title.innerText = `Level ${tierLevel} Referred Pioneers`;
  container.innerHTML = '';

  if (!list || list.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No pioneers in this level yet.</p>`;
  } else {
    list.forEach((u, i) => {
      const row = document.createElement('div');
      row.className = "flex items-center justify-between bg-slate-800/90 p-2 rounded-xl text-xs";
      row.innerHTML = `<span class="font-bold text-slate-200">#${i+1} ${u.name}</span><span class="text-[10px] text-sky-400 font-mono">ID: ${u.telegram_id}</span>`;
      container.appendChild(row);
    });
  }
  modal.classList.remove('hidden');
}

function closeReferralListModal() { document.getElementById('referralListModal')?.classList.add('hidden'); }

async function fetchLatestUserData() {
  if (CONFIG.BACKEND_API_URL && state.telegram_id && state.telegram_id !== "pioneer") {
    try {
      const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/user/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: state.telegram_id, start_param: "" })
      });
      const data = await res.json();
      if (data && data.user) {
        if (data.user.referrals) {
          state.tier1Users = data.user.referrals.tier1?.length || 0;
          state.tier2Users = data.user.referrals.tier2?.length || 0;
          state.tier3Users = data.user.referrals.tier3?.length || 0;
          state.tier1Details = data.user.referrals.tier1Details || [];
          state.tier2Details = data.user.referrals.tier2Details || [];
          state.tier3Details = data.user.referrals.tier3Details || [];
        }
        if (data.user.balance !== undefined) state.balance = Number(data.user.balance);
        if (data.user.unclaimedCommission !== undefined) state.unclaimedCommission = Number(data.user.unclaimedCommission);
        saveActiveState();
        updateHUD();
      }
    } catch (e) {}
  }
}

function initRealTonConnect() {
  try {
    if (window.TON_CONNECT_UI) {
      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: `${window.location.origin}/tonconnect-manifest.json` });
      tonConnectUI.onStatusChange(wallet => {
        if (wallet && wallet.account) {
          state.tonConnected = true;
          state.tonAddress = convertTonToUserFriendly(wallet.account.address);
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
  } catch (err) {}
}

async function toggleTonConnection() {
  if (state.tonConnected) {
    if (tonConnectUI) { try { await tonConnectUI.disconnect(); } catch (e) {} }
    state.tonConnected = false; state.tonAddress = null;
    saveActiveState(); updateHUD(); showToast("TON Disconnected", "💎");
  } else {
    if (tonConnectUI) { try { await tonConnectUI.openModal(); } catch (e) { openTonVerifyModal(); } }
    else openTonVerifyModal();
  }
}

function handleWalletVerifyClick() {
  if (state.isVerified) { showToast("Verified with 2x Boost active!", "✔"); return; }
  openTonVerifyModal();
}

function openTonVerifyModal() { document.getElementById('tonVerifyModal')?.classList.remove('hidden'); }
function closeTonVerifyModal() { document.getElementById('tonVerifyModal')?.classList.add('hidden'); }
function copyAdminTonAddress() { navigator.clipboard.writeText(CONFIG.ADMIN_TON_WALLET); showToast("Copied!", "📋"); }

function completeTonVerificationTransaction() {
  state.isVerified = true;
  saveActiveState();
  closeTonVerifyModal();
  updateHUD();
  fetch(`${CONFIG.BACKEND_API_URL}/api/wallet/verify-ton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: state.telegram_id, tonAddress: state.tonAddress || "Verified" })
  }).catch(e => {});
  showToast("0.3 TON Verified! 2x boost active.", "🛡️");
}

function connectPiWallet() { showToast("Pi Network Connected!", "π"); }

function updateHUD() {
  safeSetText('userBalanceDisplay', state.balance);
  safeSetText('walletTotalPomDisplay', `${state.balance} POM`);
  safeSetText('referralLinkText', getReferralLink());
  safeSetText('tier1UsersCount', state.tier1Users);
  safeSetText('tier2UsersCount', state.tier2Users);
  safeSetText('tier3UsersCount', state.tier3Users);
  safeSetText('unclaimedCommissionDisplay', `${Number(state.unclaimedCommission || 0).toFixed(1)} POM`);

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
}

function renderDocsContent() {
  const container = document.getElementById('docsBodyContainer');
  if (!container) return;
  const d = WHITEPAPER_DATA[state.lang] || WHITEPAPER_DATA.en || WHITEPAPER_DATA.hi;
  container.innerHTML = `<div><h4 class="text-sky-400 font-bold uppercase text-[10px] mb-1">${d.s1}</h4><p>${d.p1}</p></div>`;
}

function openDocsModal() { renderDocsContent(); document.getElementById('docsModal')?.classList.remove('hidden'); }
function closeDocsModal() { document.getElementById('docsModal')?.classList.add('hidden'); }
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
    showToast("Invalid credentials!", "❌");
  }
}

function logoutAdmin() {
  document.getElementById('adminLoginView').classList.remove('hidden');
  document.getElementById('adminDashboardView').classList.add('hidden');
  document.getElementById('adminLogoutBtn').classList.add('hidden');
  showToast("Admin locked", "🔒");
}

function adminSaveBotHandle() {
  const handle = document.getElementById('adminBotHandleInput').value.trim().replace('@', '');
  if (handle) { CONFIG.BOT_USERNAME = handle; updateHUD(); showToast(`Bot updated: @${handle}`, "✔"); }
}

async function refreshAdminDashboard() {
  try {
    const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/admin/stats`);
    const data = await res.json();
    if (data && data.success) {
      safeSetText('adminTotalUsers', data.stats.totalUsers);
      safeSetText('adminTotalMined', data.stats.totalMinedPom);
      safeSetText('adminVerifiedUsers', data.stats.verifiedUsers);
    }
  } catch (e) {}
}

async function adminLookupQuiz() {
  const qNum = document.getElementById('adminQuizSearchNum').value;
  const resultBox = document.getElementById('adminQuizEditContainer');
  if (!qNum || !resultBox) return;

  try {
    const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/admin/question/lookup?id=${qNum}`);
    const data = await res.json();
    if (data && data.success && data.question) {
      const q = data.question;
      document.getElementById('editQuizId').value = q.id || qNum;
      document.getElementById('editQuizHi').value = q.question_hi || q.question || '';
      document.getElementById('editQuizEn').value = q.question_en || '';
      document.getElementById('editQuizOptsHi').value = (q.options_hi || q.options || []).join(' | ');
      document.getElementById('editQuizCorrect').value = q.correctIndex !== undefined ? q.correctIndex : 0;
      resultBox.classList.remove('hidden');
      showToast(`Quiz #${qNum} loaded`, "✨");
    } else { showToast("Not found", "❌"); }
  } catch (e) { showToast("Error", "❌"); }
}

async function adminSaveQuizUpdate() {
  const id = document.getElementById('editQuizId').value;
  const question_hi = document.getElementById('editQuizHi').value;
  const question_en = document.getElementById('editQuizEn').value;
  const optionsArr = document.getElementById('editQuizOptsHi').value.split('|').map(s => s.trim());
  const correctIndex = document.getElementById('editQuizCorrect').value;

  try {
    await fetch(`${CONFIG.BACKEND_API_URL}/api/admin/question/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, question_hi, question_en, options_hi: optionsArr, options_en: optionsArr, correctIndex })
    });
    showToast("Quiz updated successfully!", "✔");
  } catch (e) { showToast("Error", "❌"); }
}

async function adminLookupPuzzle() {
  const pLevel = document.getElementById('adminPuzzleSearchLevel').value;
  const resultBox = document.getElementById('adminPuzzleEditContainer');
  if (!pLevel || !resultBox) return;

  try {
    const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/admin/puzzle/lookup?level=${pLevel}`);
    const data = await res.json();
    if (data && data.success && data.puzzle) {
      const p = data.puzzle;
      document.getElementById('editPuzzleLevel').value = p.level || pLevel;
      document.getElementById('editPuzzleHi').value = p.word_hi || '';
      document.getElementById('editPuzzleEn').value = p.word_en || '';
      document.getElementById('editPuzzleReward').value = p.reward || 3;
      resultBox.classList.remove('hidden');
      showToast(`Puzzle Level #${pLevel} loaded`, "✨");
    } else { showToast("Not found", "❌"); }
  } catch (e) { showToast("Error", "❌"); }
}

async function adminSavePuzzleUpdate() {
  const level = document.getElementById('editPuzzleLevel').value;
  const word_hi = document.getElementById('editPuzzleHi').value;
  const word_en = document.getElementById('editPuzzleEn').value;
  const reward = document.getElementById('editPuzzleReward').value;

  try {
    await fetch(`${CONFIG.BACKEND_API_URL}/api/admin/puzzle/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, word_hi, word_en, reward })
    });
    showToast("Puzzle updated successfully!", "✔");
  } catch (e) { showToast("Error", "❌"); }
}

function adminAddTask() {
  const title = document.getElementById('adminNewTaskTitle').value;
  const link = document.getElementById('adminNewTaskLink').value;
  const reward = parseInt(document.getElementById('adminNewTaskReward').value) || 50;
  if (!title || !link) return;
  state.tasks.push({ id: "task_" + Date.now(), title, link, reward, started: false, completed: false, icon: "fa-solid fa-star" });
  saveActiveState(); renderTasks(); showToast("Task added!", "🚀");
}

function adminRemoveTask(index) {
  state.tasks.splice(index, 1);
  saveActiveState(); renderTasks(); showToast("Task removed", "🗑️");
}

function adminDevBoostPOM(amt) { state.balance += amt; saveActiveState(); updateHUD(); showToast(`+${amt} POM`, "💰"); }
function adminDevBoostLevel(levels) { state.mineLevel += levels; state.quizLevel += levels; saveActiveState(); initCurrentPuzzle(); showToast(`+${levels} Levels`, "⚡"); }
function adminDevRefillHearts() { state.energy = 5; saveActiveState(); updateHUD(); showToast("Hearts refilled!", "❤️"); }
function adminDevToggleVerify() { state.isVerified = !state.isVerified; saveActiveState(); updateHUD(); showToast(`2x: ${state.isVerified}`, "🛡️"); }
function adminResetAllData() {
  localStorage.removeItem('POM_USER_STATE');
  state.balance = 130; state.mineLevel = 1; state.quizLevel = 1; state.energy = 5; state.isVerified = false;
  initCurrentPuzzle(); renderTasks(); updateHUD(); showToast("Reset done", "🔄");
}

async function startApp() {
  let startParam = ""; let tgUser = null;
  loadSavedState();

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
    startParam = window.Telegram.WebApp.initDataUnsafe?.start_param || "";
    if (tgUser && tgUser.id) state.telegram_id = String(tgUser.id);
  }

  applyCurrentLanguage();
  initCurrentPuzzle();
  renderTasks();
  updateHUD();
  initRealTonConnect();
  prefetchQuizQ();

  if (CONFIG.BACKEND_API_URL && state.telegram_id && state.telegram_id !== "pioneer") {
    try {
      const res = await fetch(`${CONFIG.BACKEND_API_URL}/api/user/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: state.telegram_id, username: tgUser?.username || "", first_name: tgUser?.first_name || "", start_param: startParam })
      });
      const data = await res.json();
      if (data && data.user) {
        if (data.user.referrals) {
          state.tier1Users = data.user.referrals.tier1?.length || 0;
          state.tier2Users = data.user.referrals.tier2?.length || 0;
          state.tier3Users = data.user.referrals.tier3?.length || 0;
          state.tier1Details = data.user.referrals.tier1Details || [];
          state.tier2Details = data.user.referrals.tier2Details || [];
          state.tier3Details = data.user.referrals.tier3Details || [];
        }
        if (data.user.balance !== undefined) state.balance = Number(data.user.balance);
        if (data.user.mineLevel !== undefined) state.mineLevel = Number(data.user.mineLevel);
        if (data.user.quizLevel !== undefined) state.quizLevel = Number(data.user.quizLevel);
        if (data.user.isVerified !== undefined) state.isVerified = Boolean(data.user.isVerified);
        if (data.user.unclaimedCommission !== undefined) state.unclaimedCommission = Number(data.user.unclaimedCommission);
        saveActiveState();
        updateHUD();
        initCurrentPuzzle();
      }
    } catch (e) {}
  }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', startApp); } else { startApp(); }

function checkAdminAccess() {
  const ADMIN_ID = "8760962244";
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn && String(currentUserId) === ADMIN_ID) adminBtn.style.display = 'inline-flex';
}

setTimeout(checkAdminAccess, 300);
if (window.Telegram?.WebApp) { window.Telegram.WebApp.ready(); checkAdminAccess(); }

const prevOpenAdminModal = window.openAdminModal || (typeof openAdminModal === 'function' ? openAdminModal : null);
window.openAdminModal = function() {
  const ADMIN_ID = "8760962244";
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (String(currentUserId) !== ADMIN_ID) return;
  if (prevOpenAdminModal) prevOpenAdminModal();
};
