// Einfaches Blackjack (Frontend-only)
// Autor: Demo
// Regeln: Dealer zieht bis 17; As = 1 oder 11; kein Splits/Insurance

// DOM Elements
const dealerCardsDiv = document.getElementById('dealer-cards');
const playerCardsDiv = document.getElementById('player-cards');
const dealerScoreDiv = document.getElementById('dealer-score');
const playerScoreDiv = document.getElementById('player-score');
const msg = document.getElementById('message');

const btnDeal = document.getElementById('btn-deal');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnReset = document.getElementById('btn-reset');

let deck = [];
let player = [];
let dealer = [];
let gameOver = false;

// Karten erzeugen
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
        value: rk.v
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

// Kartenwert berechnen, As (A) flexibel
function bestScore(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') {
      aces++;
      total += 1; // erst alle als 1 zählen
    } else {
      total += c.value;
    }
  }
  // Versuche Aces als 11 wenn es passt
  for (let i = 0; i < aces; i++) {
    if (total + 10 <= 21) total += 10;
  }
  return total;
}

// UI Hilfen
function renderCard(c) {
  const el = document.createElement('div');
  el.className = 'card' + (c.suit === '♥' || c.suit === '♦' ? ' red' : '');
  el.innerHTML = `<div>${c.rank}</div><div style="text-align:right">${c.suit}</div>`;
  return el;
}

function updateUI(hideDealerFirst=false) {
  dealerCardsDiv.innerHTML = '';
  playerCardsDiv.innerHTML = '';

  dealer.forEach((c, idx) => {
    const isHidden = hideDealerFirst && idx === 0;
    const el = isHidden ? document.createElement('div') : renderCard(c);
    if (isHidden) {
      el.className = 'card';
      el.style.background = '#2b556b';
      el.style.color = '#2b556b';
      el.textContent = '🂠';
    }
    dealerCardsDiv.appendChild(el);
  });

  player.forEach(c => playerCardsDiv.appendChild(renderCard(c)));

  if (hideDealerFirst) {
    dealerScoreDiv.textContent = '—';
  } else {
    dealerScoreDiv.textContent = bestScore(dealer);
  }
  playerScoreDiv.textContent = bestScore(player);
}

function dealInitial() {
  deck = shuffle(createDeck());
  player = [deck.pop(), deck.pop()];
  dealer = [deck.pop(), deck.pop()];
  gameOver = false;
  updateUI(true);
  btnHit.disabled = false;
  btnStand.disabled = false;
  btnDeal.disabled = true;
  msg.textContent = 'Dein Zug: Hit oder Stand?';
  checkForImmediateBlackjack();
}

function checkForImmediateBlackjack() {
  const pScore = bestScore(player);
  const dScore = bestScore(dealer);
  if (pScore === 21 || dScore === 21) {
    revealDealerAndEnd();
  }
}

function playerHit() {
  if (gameOver) return;
  player.push(deck.pop());
  updateUI(true);
  const pScore = bestScore(player);
  if (pScore > 21) {
    revealDealerAndEnd();
  } else if (pScore === 21) {
    // automatisch Stand
    dealerTurn();
  }
}

function playerStand() {
  dealerTurn();
}

function dealerTurn() {
  // Enthülle Dealer-Karte
  updateUI(false);
  // Dealer zieht bis 17
  while (bestScore(dealer) < 17) {
    dealer.push(deck.pop());
  }
  revealDealerAndEnd();
}

function revealDealerAndEnd() {
  updateUI(false);
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = false;

  const pScore = bestScore(player);
  const dScore = bestScore(dealer);

  let outcome = '';
  if (pScore > 21) {
    outcome = 'Du hast überkauft (Bust). Dealer gewinnt.';
  } else if (dScore > 21) {
    outcome = 'Dealer überkauft — du gewinnst!';
  } else if (pScore === dScore) {
    outcome = 'Unentschieden (Push).';
  } else if (pScore === 21 && player.length === 2 && !(dScore === 21 && dealer.length === 2)) {
    outcome = 'Blackjack! Du gewinnst (natürlicher Blackjack).';
  } else if (dScore === 21 && dealer.length === 2 && !(pScore === 21 && player.length ===2)) {
    outcome = 'Dealer hat Blackjack. Dealer gewinnt.';
  } else if (pScore > dScore) {
    outcome = 'Du gewinnst!';
  } else {
    outcome = 'Dealer gewinnt.';
  }

  msg.textContent = outcome + ` (Du: ${pScore} — Dealer: ${dScore})`;
  gameOver = true;
}

// Reset
function resetGame() {
  deck = [];
  player = [];
  dealer = [];
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = false;
  dealerCardsDiv.innerHTML = '';
  playerCardsDiv.innerHTML = '';
  dealerScoreDiv.textContent = '—';
  playerScoreDiv.textContent = '—';
  msg.textContent = 'Drücke „Geben“, um zu starten.';
  gameOver = false;
}

// Event Listeners
btnDeal.addEventListener('click', dealInitial);
btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnReset.addEventListener('click', resetGame);

// Initial UI
resetGame();
