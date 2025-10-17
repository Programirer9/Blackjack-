// Blackjack mit Einsatz & Kartenanimationen
// Autor: Demo (erweiterte Version)

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
const betInput = document.getElementById('bet-input');

let deck = [];
let player = [];
let dealer = [];
let gameOver = false;
let bankroll = 1000;
let currentBet = 0;

/* ---------- Kartendeck & Hilfen ---------- */
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

/* ---------- UI: render + animation ---------- */
function createCardElement(card, faceDown = false) {
  // wrapper for flip perspective
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

  // place card faces in flipper
  flipper.appendChild(front);
  flipper.appendChild(back);
  wrapper.appendChild(flipper);

  if (faceDown) {
    flipper.classList.add('flipped'); // show back initially
  }

  // attach meta for reference
  wrapper._card = card;
  wrapper._flipper = flipper;
  wrapper._front = front;
  wrapper._back = back;
  return wrapper;
}

function animateDeal(element, container, delay=0, faceDown=false) {
  // add to DOM but hidden, then trigger animation
  element.style.opacity = '0';
  container.appendChild(element);
  // small timeout to ensure CSS can pick up animation
  setTimeout(() => {
    // add card element class to face (for animation) — we animate the front container
    const cardFace = element.querySelector('.card') || element.querySelector('.face');
    if (cardFace) {
      cardFace.classList.add('deal-anim');
    }
    element.style.opacity = '1';
    // after animation, ensure it's visible normally
    setTimeout(() => {
      if (cardFace) cardFace.classList.remove('deal-anim');
    }, 420);
    // if facedown -> leave flipped; if not facedown -> flip to reveal after short time
    if (!faceDown) {
      // small reveal delay so it looks like dealing
      setTimeout(() => {
        flipToFront(element);
      }, 220);
    }
  }, delay);
}

function flipToFront(wrapper) {
  // remove flipped if present to show front
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

/* ---------- Spiel-Flow mit animiertem Deal ---------- */
function dealInitial() {
  // validate bet
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
  bankroll -= currentBet; // reserve Einsatz
  updateBankrollUI();

  // Vorbereitung
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

  // Animierter, sequenzieller Deal: P, D (verdeckt), P, D
  // Wir bauen DOM-Elemente und animieren nacheinander
  player.push(deck.pop());
  dealer.push(deck.pop());
  player.push(deck.pop());
  dealer.push(deck.pop());

  // create elements (dealer first card face-down)
  const p1 = createCardElement(player[0], false);
  const d1 = createCardElement(dealer[0], true); // facedown
  const p2 = createCardElement(player[1], false);
  const d2 = createCardElement(dealer[1], false);

  // sequence of dealing with delays
  let t = 0;
  animateDeal(p1, playerCardsDiv, t += 160, false);
  animateDeal(d1, dealerCardsDiv, t += 220, true);
  animateDeal(p2, playerCardsDiv, t += 220, false);
  animateDeal(d2, dealerCardsDiv, t += 220, false);

  // after finishing deal, enable actions and check immediate blackjack
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
  // reveal dealer only if someone has blackjack
  if (pScore === 21 || dScore === 21) {
    // reveal dealer card with flip animation
    revealDealerCardWithDelay(120);
    setTimeout(() => {
      settleAndEnd(); // handle outcomes
    }, 700);
  }
}

function revealDealerCardWithDelay(delay=0) {
  // find first child wrapper and flip it
  const first = dealerCardsDiv.querySelector('.flip-wrapper');
  if (first) {
    setTimeout(() => flipToFront(first), delay);
  }
  setTimeout(() => updateScores(false), delay + 260);
}

function playerHit() {
  if (gameOver) return;
  // draw card
  const c = deck.pop();
  player.push(c);
  const el = createCardElement(c, false);
  // animate
  const currentCount = playerCardsDiv.children.length;
  animateDeal(el, playerCardsDiv, 80, false);

  setTimeout(() => {
    updateScores(true);
    const ps = bestScore(player);
    if (ps > 21) {
      // lose immediately
      revealDealerCardWithDelay(200);
      setTimeout(() => settleAndEnd(), 600);
    } else if (ps === 21) {
      // auto-stand
      setTimeout(() => dealerTurn(), 300);
    }
  }, 400);
}

function playerStand() {
  if (gameOver) return;
  dealerTurn();
}

function dealerTurn() {
  // reveal dealer upcard
  revealDealerCardWithDelay(120);
  btnHit.disabled = true;
  btnStand.disabled = true;
  updateScores(false);
  msg.textContent = 'Dealer zieht...';

  // draw while <17 with animation
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
      // finished dealer draws
      setTimeout(() => settleAndEnd(), 500);
    }
  };

  // start after short pause
  setTimeout(() => drawStep(), 420);
}

function settleAndEnd() {
  updateScores(false);
  const pScore = bestScore(player);
  const dScore = bestScore(dealer);

  let outcome = '';
  let payout = 0; // positive if player wins, negative if loses

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
    // Blackjack natural check (2 cards)
    const playerBlackjack = (pScore === 21 && player.length === 2);
    const dealerBlackjack = (dScore === 21 && dealer.length === 2);

    if (playerBlackjack && !dealerBlackjack) {
      outcome = 'Blackjack! Du gewinnst 3:2.';
      // payout: 1.5 * bet
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

  // apply payout: for push payout is 0 -> return bet
  if (payout === 0) {
    bankroll += currentBet; // return bet
  } else if (payout > 0) {
    bankroll += currentBet + payout; // original bet + winnings
  } else {
    // payout < 0 -> player already lost bet (we reserved it), nothing to add
  }

  updateBankrollUI();

  // message
  msg.textContent = `${outcome} (Du: ${pScore} — Dealer: ${dScore})`;
  lastResult.textContent = `Einsatz: ${currentBet} € — Ergebnis: ${payout >= 0 ? '+'+payout+' €' : payout+' €'}`;
  gameOver = true;

  // enable deal for next round if bankroll > 0
  setTimeout(() => {
    btnDeal.disabled = (bankroll <= 0);
    btnHit.disabled = true;
    btnStand.disabled = true;
  }, 300);
}

/* ---------- Utilities & Reset ---------- */
function updateBankrollUI() {
  bankrollEl.textContent = bankroll;
}

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
