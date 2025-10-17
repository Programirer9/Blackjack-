// Blackjack mit Einsatz & Kartenanimationen (erweiterte Bankroll-Visualisierung)
// Wenn du diese Datei komplett ersetzt, benutzte die zuvor gelieferte Version der Spiel-Logik.
// --- Hier konzentrieren wir uns auf die Bankroll UI-Updates ---

/* ---------- DOM ---------- */
const dealerCardsDiv = document.getElementById('dealer-cards');
const playerCardsDiv = document.getElementById('player-cards');
const dealerScoreDiv = document.getElementById('dealer-score');
const playerScoreDiv = document.getElementById('player-score');
const msg = document.getElementById('message');
const lastResult = document.getElementById('last-result');

const btnDeal = document.getElementById('btn-deal');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnReset = document.getElementById('btn-reset');

const bankrollEl = document.getElementById('bankroll');
const bankrollStackEl = document.getElementById('bankroll-stack');
const betInput = document.getElementById('bet-input');

let deck = [];
let player = [];
let dealer = [];
let gameOver = false;
let bankroll = 1000;
let currentBet = 0;

/* ---------- Kartendeck & Hilfen (gleich wie vorher) ---------- */
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
      d.push({
        suit: s,
        rank: rk.r,
        value: Array.isArray(rk.v) ? rk.v : rk.v
      });
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
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') {
      aces++;
      total += 1;
    } else {
      total += c.value;
    }
  }
  for (let i = 0; i < aces; i++) {
    if (total + 10 <= 21) total += 10;
  }
  return total;
}

/* ---------- UI: render + animation (gleich wie vorher, kürze ich hier) ---------- */
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

  if (faceDown) {
    flipper.classList.add('flipped');
  }

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
    if (cardFace) {
      cardFace.classList.add('deal-anim');
    }
    element.style.opacity = '1';
    setTimeout(() => {
      if (cardFace) cardFace.classList.remove('deal-anim');
    }, 420);
    if (!faceDown) {
      setTimeout(() => {
        flipToFront(element);
      }, 220);
    }
  }, delay);
}

function flipToFront(wrapper) {
  if (!wrapper || !wrapper._flipper) return;
  wrapper._flipper.classList.remove('flipped');
}

function flipToBack(wrapper) {
  if (!wrapper || !wrapper._flipper) return;
  wrapper._flipper.classList.add('flipped');
}

function clearHandsUI() {
  dealerCardsDiv.innerHTML = '';
  playerCardsDiv.innerHTML = '';
}

function updateScores(hideDealerFirst=false) {
  playerScoreDiv.textContent = bestScore(player);
  if (hideDealerFirst) {
    dealerScoreDiv.textContent = '—';
  } else {
    dealerScoreDiv.textContent = bestScore(dealer);
  }
}

/* ---------- Spiel-Flow mit animiertem Deal (gleich wie vorher) ---------- */
function dealInitial() {
  const bet = parseInt(betInput.value, 10);
  if (!Number.isFinite(bet) || bet <= 0) {
    msg.textContent = 'Setze einen gültigen Einsatz (größer 0).';
    return;
  }
  if (bet > bankroll) {
    msg.textContent = 'Einsatz größer als Bankroll.';
    return;
  }

  currentBet = bet;
  bankroll -= currentBet; // reserve
  updateBankrollUI();

  deck = shuffle(createDeck());
  player = [];
  dealer = [];
  gameOver = false;
  clearHandsUI();
  updateScores(true);
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = true;
  lastResult.textContent = '';

  msg.textContent = 'Teilt...';

  player.push(deck.pop());
  dealer.push(deck.pop());
  player.push(deck.pop());
  dealer.push(deck.pop());

  const p1 = createCardElement(player[0], false);
  const d1 = createCardElement(dealer[0], true);
  const p2 = createCardElement(player[1], false);
  const d2 = createCardElement(dealer[1], false);

  let t = 0;
  animateDeal(p1, playerCardsDiv, t += 160, false);
  animateDeal(d1, dealerCardsDiv, t += 220, true);
  animateDeal(p2, playerCardsDiv, t += 220, false);
  animateDeal(d2, dealerCardsDiv, t += 220, false);

  setTimeout(() => {
    btnHit.disabled = false;
    btnStand.disabled = false;
    updateScores(true);
    msg.textContent = 'Dein Zug: Hit oder Stand?';
    checkForImmediateBlackjack();
  }, t + 300);
}

function checkForImmediateBlackjack() {
  const pScore = bestScore(player);
  const dScore = bestScore(dealer);
  if (pScore === 21 || dScore === 21) {
    revealDealerCardWithDelay(120);
    setTimeout(() => {
      settleAndEnd();
    }, 700);
  }
}

function revealDealerCardWithDelay(delay=0) {
  const first = dealerCardsDiv.querySelector('.flip-wrapper');
  if (first) {
    setTimeout(() => flipToFront(first), delay);
  }
  setTimeout(() => updateScores(false), delay + 260);
}

function playerHit() {
  if (gameOver) return;
  const c = deck.pop();
  player.push(c);
  const el = createCardElement(c, false);
  animateDeal(el, playerCardsDiv, 80, false);

  setTimeout(() => {
    updateScores(true);
    const ps = bestScore(player);
    if (ps > 21) {
      revealDealerCardWithDelay(200);
      setTimeout(() => settleAndEnd(), 600);
    } else if (ps === 21) {
      setTimeout(() => dealerTurn(), 300);
    }
  }, 400);
}

function playerStand() {
  if (gameOver) return;
  dealerTurn();
}

function dealerTurn() {
  revealDealerCardWithDelay(120);
  btnHit.disabled = true;
  btnStand.disabled = true;
  updateScores(false);
  msg.textContent = 'Dealer zieht...';

  const drawStep = () => {
    const score = bestScore(dealer);
    if (score < 17) {
      const c = deck.pop();
      dealer.push(c);
      const el = createCardElement(c, false);
      animateDeal(el, dealerCardsDiv, 340, false);
      setTimeout(() => {
        updateScores(false);
        drawStep();
      }, 460);
    } else {
      setTimeout(() => settleAndEnd(), 500);
    }
  };

  setTimeout(() => drawStep(), 420);
}

/* ---------- Bankroll UI: numerisch + visueller Chip-Stapel ---------- */

/**
 * updateBankrollUI
 * zeigt die numerische Bankroll und rendert die Chip-Stapel
 */
function updateBankrollUI() {
  // numerisch
  bankrollEl.textContent = bankroll;

  // visuell: render chip stacks aus Bankroll
  renderChipStack(bankroll);
}

/**
 * renderChipStack(bankroll)
 * Zerlegt die Bankroll in Chip-Denominierungen und zeigt kleine Stapel.
 * Denoms: 100, 50, 25, 10, 5, 1
 */
function renderChipStack(amount) {
  if (!bankrollStackEl) return;

  // animate pulse on change
  bankrollStackEl.classList.remove('pulse');
  void bankrollStackEl.offsetWidth; // reflow to restart animation

  // clear
  bankrollStackEl.innerHTML = '';

  let remaining = Math.max(0, Math.floor(amount));
  const denoms = [100, 50, 25, 10, 5, 1];

  // build stacks for denominations where count > 0
  denoms.forEach(d => {
    const count = Math.floor(remaining / d);
    if (count > 0) {
      remaining -= count * d;
      const stack = document.createElement('div');
      stack.className = 'chip-stack';

      // show up to 4 visual chips stacked (for compactness)
      const visible = Math.min(count, 4);
      for (let i = 0; i < visible; i++) {
        const pill = document.createElement('div');
        pill.className = 'chip-pill chip-' + d;
        pill.style.transform = `translateY(${ -i * 6 }px)`; // slight offset
        pill.textContent = ''; // optional: could show small mark
        stack.appendChild(pill);
      }

      // label with denom and count
      const label = document.createElement('div');
      label.className = 'chip-label';
      label.textContent = `${d} × ${count}`;
      stack.appendChild(label);

      bankrollStackEl.appendChild(stack);
    }
  });

  // if no chips (bankroll = 0), show empty text
  if (amount <= 0) {
    const note = document.createElement('div');
    note.className = 'chip-label';
    note.textContent = 'Kein Guthaben';
    bankrollStackEl.appendChild(note);
  }

  // trigger pulse animation
  setTimeout(() => bankrollStackEl.classList.add('pulse'), 18);
}

/* ---------- Settle / End (gleich wie vorher) ---------- */
function settleAndEnd() {
  updateScores(false);
  const pScore = bestScore(player);
  const dScore = bestScore(dealer);

  let outcome = '';
  let payout = 0;

  if (pScore > 21) {
    outcome = 'Du hast überkauft (Bust).';
    payout = -currentBet;
  } else if (dScore > 21) {
    outcome = 'Dealer überkauft — du gewinnst!';
    payout = currentBet;
  } else if (pScore === dScore) {
    outcome = 'Unentschieden (Push). Einsatz zurück.';
    payout = 0;
  } else {
    const playerBlackjack = (pScore === 21 && player.length === 2);
    const dealerBlackjack = (dScore === 21 && dealer.length === 2);

    if (playerBlackjack && !dealerBlackjack) {
      outcome = 'Blackjack! Du gewinnst 3:2.';
      payout = Math.floor(currentBet * 1.5);
    } else if (dealerBlackjack && !playerBlackjack) {
      outcome = 'Dealer hat Blackjack. Dealer gewinnt.';
      payout = -currentBet;
    } else if (pScore > dScore) {
      outcome = 'Du gewinnst!';
      payout = currentBet;
    } else {
      outcome = 'Dealer gewinnt.';
      payout = -currentBet;
    }
  }

  if (payout === 0) {
    bankroll += currentBet;
  } else if (payout > 0) {
    bankroll += currentBet + payout;
  } else {
    // lost: bankroll unchanged because bet already reserved
  }

  updateBankrollUI();

  msg.textContent = `${outcome} (Du: ${pScore} — Dealer: ${dScore})`;
  lastResult.textContent = `Einsatz: ${currentBet} € — Ergebnis: ${payout >= 0 ? '+'+payout+' €' : payout+' €'}`;
  gameOver = true;

  setTimeout(() => {
    btnDeal.disabled = (bankroll <= 0);
    btnHit.disabled = true;
    btnStand.disabled = true;
  }, 300);
}

/* ---------- Reset & Utilities ---------- */
function resetGame() {
  deck = [];
  player = [];
  dealer = [];
  gameOver = false;
  currentBet = 0;
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = false;
  dealerCardsDiv.innerHTML = '';
  playerCardsDiv.innerHTML = '';
  dealerScoreDiv.textContent = '—';
  playerScoreDiv.textContent = '—';
  msg.textContent = 'Gib deinen Einsatz ein und drücke „Geben“.';
  lastResult.textContent = '';
  bankroll = 1000;
  updateBankrollUI();
}

/* ---------- Events ---------- */
btnDeal.addEventListener('click', dealInitial);
btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnReset.addEventListener('click', resetGame);

/* ---------- Init ---------- */
resetGame();
