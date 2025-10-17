// app.js — Multi-Player Blackjack
// Startgeld = 100, Bots smarter, Zufalls-Einsatz

/* ---------- DOM ---------- */
const dealerCardsDiv = document.getElementById('dealer-cards');

const player1CardsDiv = document.getElementById('player-cards');
const player2CardsDiv = document.getElementById('player2-cards');
const player3CardsDiv = document.getElementById('player3-cards');

const dealerScoreDiv = document.getElementById('dealer-score');
const player1ScoreDiv = document.getElementById('player-score');
const player2ScoreDiv = document.getElementById('player2-score');
const player3ScoreDiv = document.getElementById('player3-score');

const msg = document.getElementById('message');
const lastResult = document.getElementById('last-result');

const btnDeal = document.getElementById('btn-deal');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnReset = document.getElementById('btn-reset');

const bankrollEl = document.getElementById('bankroll');
const bankrollStackEl = document.getElementById('bankroll-stack');
const betInput = document.getElementById('bet-input');

/* ---------- Settings ---------- */
const START_BANKROLL = 100; // <-- Startgeld hier einstellen

/* ---------- State ---------- */
let deck = [];
let players = [
  { id: 1, name: 'Du', type: 'human', hand: [], bet: 0, bankroll: START_BANKROLL, scoreEl: player1ScoreDiv, cardsEl: player1CardsDiv, busted: false },
  { id: 2, name: 'Player 2', type: 'bot',    hand: [], bet: 0, bankroll: START_BANKROLL, scoreEl: player2ScoreDiv, cardsEl: player2CardsDiv, busted: false },
  { id: 3, name: 'Player 3', type: 'bot',    hand: [], bet: 0, bankroll: START_BANKROLL, scoreEl: player3ScoreDiv, cardsEl: player3CardsDiv, busted: false }
];
let dealer = [];
let gameOver = false;
let currentBet = 0; // human bet

/* ---------- Deck Helpers ---------- */
function createDeck() {
  const suits = ['♠','♥','♦','♣'];
  const ranks = [
    {r:'A', v:[1,11]},
    {r:'2', v:2},{r:'3', v:3},{r:'4', v:4},{r:'5', v:5},
    {r:'6', v:6},{r:'7', v:7},{r:'8', v:8},{r:'9', v:9},
    {r:'10', v:10},{r:'J', v:10},{r:'Q', v:10},{r:'K', v:10}
  ];
  const d = [];
  for (const s of suits) {
    for (const rk of ranks) {
      d.push({ suit: s, rank: rk.r, value: Array.isArray(rk.v) ? rk.v : rk.v });
    }
  }
  return d;
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function bestScore(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 1; } else { total += c.value; }
  }
  for (let i = 0; i < aces; i++) if (total + 10 <= 21) total += 10;
  return total;
}
function isSoftHand(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 1; } else { total += c.value; }
  }
  return aces > 0 && (total + 10) <= 21;
}

/* ---------- UI: Cards & Animation ---------- */
function createCardElement(card, faceDown = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flip-wrapper';
  const flipper = document.createElement('div');
  flipper.className = 'flip';
  const front = document.createElement('div');
  front.className = 'face card' + ((card.suit === '♥' || card.suit === '♦') ? ' red' : '');
  front.innerHTML = `<div>${card.rank}</div><div style="text-align:right">${card.suit}</div>`;
  const back = document.createElement('div');
  back.className = 'backface';
  back.innerHTML = '🂠';
  flipper.appendChild(front);
  flipper.appendChild(back);
  wrapper.appendChild(flipper);
  if (faceDown) flipper.classList.add('flipped');
  wrapper._card = card;
  wrapper._flipper = flipper;
  wrapper._front = front;
  wrapper._back = back;
  return wrapper;
}
function animateDeal(element, container, delay=0, faceDown=false) {
  element.style.opacity = '0';
  container.appendChild(element);
  setTimeout(() => {
    const cardFace = element.querySelector('.card') || element.querySelector('.face');
    if (cardFace) cardFace.classList.add('deal-anim');
    element.style.opacity = '1';
    setTimeout(() => { if (cardFace) cardFace.classList.remove('deal-anim'); }, 420);
    if (!faceDown) setTimeout(() => flipToFront(element), 220);
  }, delay);
}
function flipToFront(wrapper) { if (!wrapper || !wrapper._flipper) return; wrapper._flipper.classList.remove('flipped'); }
function flipToBack(wrapper) { if (!wrapper || !wrapper._flipper) return; wrapper._flipper.classList.add('flipped'); }
function clearHandsUI() {
  dealerCardsDiv.innerHTML = '';
  players.forEach(p => p.cardsEl.innerHTML = '');
}
function prettyScoreAndMeta(p, hideDealer=false) {
  const score = (p.type === 'human' ? bestScore(p.hand) : bestScore(p.hand));
  const scoreText = (p.hand.length === 0) ? '—' : score;
  const betText = p.bet ? `Einsatz: ${p.bet} €` : '';
  const bankText = (typeof p.bankroll === 'number') ? `Geld: ${p.bankroll} €` : '';
  return `${scoreText} <div class="player-meta">${betText}${betText && bankText ? ' • ' : ''}${bankText}</div>`;
}
function updateAllScores(hideDealerFirst = false) {
  players.forEach((p, idx) => {
    p.scoreEl.innerHTML = prettyScoreAndMeta(p, hideDealerFirst);
  });
  dealerScoreDiv.textContent = hideDealerFirst ? '—' : bestScore(dealer);
}

/* ---------- Bot logic ---------- */
function dealerUpValue() {
  if (!dealer || dealer.length === 0) return 10;
  const r = dealer[0].rank;
  if (r === 'A') return 11;
  if (['J','Q','K'].includes(r)) return 10;
  return parseInt(r, 10) || 10;
}
function botShouldHit(bot) {
  const cards = bot.hand;
  const total = bestScore(cards);
  const soft = isSoftHand(cards);
  const up = dealerUpValue();
  if (soft) return total < 18;
  if (total <= 11) return true;
  if (total >= 17) return false;
  if (total >= 12 && total <= 16) {
    if (up >= 2 && up <= 6) return false;
    return true;
  }
  return total < 17;
}
function botRandomBet(humanBet, botBankroll) {
  const suggestedMax = Math.max(10, Math.min(200, humanBet * 2));
  const maxBet = Math.min(suggestedMax, Math.max(1, botBankroll));
  const r = Math.random();
  let val;
  if (r < 0.5) val = Math.max(1, Math.floor(maxBet * Math.random() * 0.3));
  else if (r < 0.85) val = Math.max(1, Math.floor(maxBet * (0.3 + Math.random() * 0.4)));
  else val = Math.max(1, Math.floor(maxBet * (0.7 + Math.random() * 0.3)));
  return Math.min(Math.max(1, val), maxBet);
}

/* ---------- Game flow ---------- */
function dealInitial() {
  const bet = parseInt(betInput.value, 10);
  if (!Number.isFinite(bet) || bet <= 0) { msg.textContent = 'Setze einen gültigen Einsatz (größer 0).'; return; }
  if (bet > players[0].bankroll) { msg.textContent = 'Einsatz größer als Bankroll.'; return; }
  currentBet = bet;
  players[0].bankroll -= currentBet;
  players[0].bet = currentBet;
  players.slice(1).forEach(bot => {
    const rb = botRandomBet(currentBet, bot.bankroll);
    bot.bet = rb;
    bot.bankroll -= rb;
  });
  updateBankrollUI();
  updateAllScores(true);
  deck = shuffle(createDeck());
  players.forEach(p => { p.hand = []; p.busted = false; });
  dealer = [];
  gameOver = false;
  clearHandsUI();
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = true;
  lastResult.textContent = '';
  msg.textContent = 'Teilt...';
  players[0].hand.push(deck.pop());
  players[1].hand.push(deck.pop());
  players[2].hand.push(deck.pop());
  dealer.push(deck.pop());
  players[0].hand.push(deck.pop());
  players[1].hand.push(deck.pop());
  players[2].hand.push(deck.pop());
  dealer.push(deck.pop());
  const elems = [];
  elems.push(createCardElement(players[0].hand[0], false));
  elems.push(createCardElement(players[1].hand[0], false));
  elems.push(createCardElement(players[2].hand[0], false));
  elems.push(createCardElement(dealer[0], true));
  elems.push(createCardElement(players[0].hand[1], false));
  elems.push(createCardElement(players[1].hand[1], false));
  elems.push(createCardElement(players[2].hand[1], false));
  elems.push(createCardElement(dealer[1], false));
  let t = 0;
  animateDeal(elems[0], players[0].cardsEl, t += 140, false);
  animateDeal(elems[1], players[1].cardsEl, t += 180, false);
  animateDeal(elems[2], players[2].cardsEl, t += 180, false);
  animateDeal(elems[3], dealerCardsDiv,   t += 200, true);
  animateDeal(elems[4], players[0].cardsEl, t += 220, false);
  animateDeal(elems[5], players[1].cardsEl, t += 220, false);
  animateDeal(elems[6], players[2].cardsEl, t += 220, false);
  animateDeal(elems[7], dealerCardsDiv,   t += 220, false);
  setTimeout(() => {
    btnHit.disabled = false;
    btnStand.disabled = false;
    updateAllScores(true);
    msg.textContent = 'Dein Zug: Hit oder Stand?';
    checkForImmediateBlackjack();
  }, t + 320);
}
function checkForImmediateBlackjack() {
  const anyBlackjack = players.some(p => bestScore(p.hand) === 21 && p.hand.length === 2) || (bestScore(dealer) === 21 && dealer.length === 2);
  if (anyBlackjack) {
    revealDealerCardWithDelay(120);
    setTimeout(() => settleAndEnd(), 700);
  }
}
function revealDealerCardWithDelay(delay = 0) {
  const first = dealerCardsDiv.querySelector('.flip-wrapper');
  if (first) setTimeout(() => flipToFront(first), delay);
  setTimeout(() => updateAllScores(false), delay + 260);
}

/* ---------- Human actions ---------- */
function playerHit() {
  if (gameOver) return;
  const c = deck.pop();
  players[0].hand.push(c);
  const el = createCardElement(c, false);
  animateDeal(el, players[0].cardsEl, 80, false);
  setTimeout(() => {
    updateAllScores(true);
    const ps = bestScore(players[0].hand);
    if (ps > 21) { players[0].busted = true; revealDealerCardWithDelay(200); setTimeout(() => playBotsThenDealer(), 600); }
    else if (ps === 21) setTimeout(() => playBotsThenDealer(), 300);
  }, 400);
}
function playerStand() {
  if (gameOver) return;
  btnHit.disabled = true;
  btnStand.disabled = true;
  msg.textContent = 'Bots spielen...';
  setTimeout(() => playBotsThenDealer(), 260);
}

/* ---------- Bots then dealer ---------- */
function playBotsThenDealer() {
  revealDealerCardWithDelay(120);
  const botIndices = [1,2];
  let idx = 0;
  function botStep() {
    if (idx >= botIndices.length) { setTimeout(() => dealerTurn(), 500); return; }
    const bi = botIndices[idx];
    const bot = players[bi];
    function botDrawLoop() {
      const score = bestScore(bot.hand);
      if (score > 21) { bot.busted = true; idx++; setTimeout(botStep, 220); return; }
      if (botShouldHit(bot)) {
        const c = deck.pop();
        bot.hand.push(c);
        const el = createCardElement(c, false);
        animateDeal(el, bot.cardsEl, 220, false);
        setTimeout(() => botDrawLoop(), 460);
      } else { idx++; setTimeout(botStep, 260); }
    }
    if (bestScore(bot.hand) === 21 && bot.hand.length === 2) { idx++; setTimeout(botStep, 160); } 
    else botDrawLoop();
  }
  setTimeout(() => botStep(), 420);
}

/* ---------- Dealer play ---------- */
function dealerTurn() {
  btnHit.disabled = true;
  btnStand.disabled = true;
  updateAllScores(false);
  msg.textContent = 'Dealer zieht...';
  function drawStep() {
    const score = bestScore(dealer);
    if (score < 17) {
      const c = deck.pop();
      dealer.push(c);
      const el = createCardElement(c, false);
      animateDeal(el, dealerCardsDiv, 340, false);
      setTimeout(() => { updateAllScores(false); drawStep(); }, 460);
    } else { setTimeout(() => settleAndEnd(), 500); }
  }
  setTimeout(() => drawStep(), 420);
}

/* ---------- Settlement ---------- */
function settleAndEnd() {
  updateAllScores(false);
  const dScore = bestScore(dealer);
  const outcomes = players.map(p => {
    const pScore = bestScore(p.hand);
    const playerBlackjack = (pScore === 21 && p.hand.length === 2);
    const dealerBlackjack = (dScore === 21 && dealer.length === 2);
    let outcomeText = '';
    if (pScore > 21) outcomeText = `${p.name}: Bust (${pScore}) — verliert.`;
    else if (dScore > 21) outcomeText = `${p.name}: Dealer Bust (${dScore}) — ${p.name} gewinnt (${pScore}).`;
    else if (playerBlackjack && !dealerBlackjack) outcomeText = `${p.name}: Blackjack! gewinnt 3:2 (${pScore}).`;
    else if (dealerBlackjack && !playerBlackjack) outcomeText = `${p.name}: Dealer Blackjack — verliert (${pScore} vs ${dScore}).`;
    else if (pScore > dScore) outcomeText = `${p.name}: gewinnt (${pScore} vs ${dScore}).`;
    else if (pScore === dScore) outcomeText = `${p.name}: Push (${pScore}).`;
    else outcomeText = `${p.name}: verliert (${pScore} vs ${dScore}).`;
    return { p, pScore, outcomeText, playerBlackjack, dealerBlackjack };
  });

  const human = outcomes[0];
  let humanPayout = 0;
  if (human.pScore > 21) humanPayout = -currentBet;
  else {
    if (human.playerBlackjack && !human.dealerBlackjack) humanPayout = Math.floor(currentBet * 1.5);
    else if (human.dealerBlackjack && !human.playerBlackjack) humanPayout = -currentBet;
    else if (human.pScore > dScore) humanPayout = currentBet;
    else if (human.pScore === dScore) humanPayout = 0;
    else humanPayout = -currentBet;
  }
  if (humanPayout === 0) players[0].bankroll += currentBet;
  else if (humanPayout > 0) players[0].bankroll += currentBet + humanPayout;

  outcomes.slice(1).forEach(o => {
    const bot = o.p;
    const bet = bot.bet || 0;
    let payout = 0;
    if (o.pScore > 21) payout = -bet;
    else {
      if (o.playerBlackjack && !o.dealerBlackjack) payout = Math.floor(bet * 1.5);
      else if (o.dealerBlackjack && !o.playerBlackjack) payout = -bet;
      else if (o.pScore > dScore) payout = bet;
      else if (o.pScore === dScore) payout = 0;
      else payout = -bet;
    }
    if (payout === 0) bot.bankroll += bet
