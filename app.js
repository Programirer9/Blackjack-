// Blackjack — 3 Players (Player1 = human, Player2/3 = simple bots)
// Enthält Einsatz/Bankroll für Player1; Bots simulieren Spiel (setzen gleich wie Player1) aber verändern nicht deine Bankroll.

// ---------- DOM ----------
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

// ---------- State ----------
let deck = [];
// players: array of player objects in seat order (player1, player2, player3)
let players = [
  { id: 1, name: 'Du', type: 'human', hand: [], bet: 0, scoreEl: player1ScoreDiv, cardsEl: player1CardsDiv, busted: false },
  { id: 2, name: 'Player 2', type: 'bot',    hand: [], bet: 0, scoreEl: player2ScoreDiv, cardsEl: player2CardsDiv, busted: false },
  { id: 3, name: 'Player 3', type: 'bot',    hand: [], bet: 0, scoreEl: player3ScoreDiv, cardsEl: player3CardsDiv, busted: false }
];
let dealer = [];
let currentHumanIndex = 0; // index 0 for human
let gameOver = false;
let bankroll = 1000;
let currentBet = 0;

// ---------- Deck helpers ----------
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
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 1; } else { total += c.value; }
  }
  for (let i = 0; i < aces; i++) {
    if (total + 10 <= 21) total += 10;
  }
  return total;
}

// ---------- UI: cards & animations ----------
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
function updateAllScores(hideDealerFirst = false) {
  players.forEach(p => p.scoreEl.textContent = bestScore(p.hand));
  dealerScoreDiv.textContent = hideDealerFirst ? '—' : bestScore(dealer);
}

// ---------- Game flow (multi-player) ----------
function dealInitial() {
  const bet = parseInt(betInput.value, 10);
  if (!Number.isFinite(bet) || bet <= 0) { msg.textContent = 'Setze einen gültigen Einsatz (größer 0).'; return; }
  if (bet > bankroll) { msg.textContent = 'Einsatz größer als Bankroll.'; return; }

  currentBet = bet;
  bankroll -= currentBet; // reserve only human bet
  updateBankrollUI();

  // bots match player's bet for simulation (do not affect your bankroll)
  players.forEach(p => { p.bet = (p.type === 'human') ? currentBet : currentBet; p.hand = []; p.busted = false; });

  dealer = [];
  deck = shuffle(createDeck());
  gameOver = false;
  clearHandsUI();
  updateAllScores(true);
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = true;
  lastResult.textContent = '';
  msg.textContent = 'Teilt...';

  // Draw sequence: p1, p2, p3, dealer then repeat
  // pop from deck and push into player's hand
  // build elements then animate in sequence
  // first round
  players[0].hand.push(deck.pop());
  players[1].hand.push(deck.pop());
  players[2].hand.push(deck.pop());
  dealer.push(deck.pop());
  // second round
  players[0].hand.push(deck.pop());
  players[1].hand.push(deck.pop());
  players[2].hand.push(deck.pop());
  dealer.push(deck.pop());

  // create elements
  const elems = [];
  elems.push(createCardElement(players[0].hand[0], false));
  elems.push(createCardElement(players[1].hand[0], false));
  elems.push(createCardElement(players[2].hand[0], false));
  elems.push(createCardElement(dealer[0], true)); // dealer first facedown
  elems.push(createCardElement(players[0].hand[1], false));
  elems.push(createCardElement(players[1].hand[1], false));
  elems.push(createCardElement(players[2].hand[1], false));
  elems.push(createCardElement(dealer[1], false));

  // animate with timings
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
    // check natural blackjacks for any player / dealer
    checkForImmediateBlackjack();
  }, t + 320);
}

function checkForImmediateBlackjack() {
  // if any player or dealer has blackjack (21 with 2 cards), reveal dealer and settle
  const anyBlackjack = players.some(p => bestScore(p.hand) === 21) || bestScore(dealer) === 21;
  if (anyBlackjack) {
    revealDealerCardWithDelay(120);
    setTimeout(() => settleAndEnd(), 700);
  }
}

function revealDealerCardWithDelay(delay=0) {
  const first = dealerCardsDiv.querySelector('.flip-wrapper');
  if (first) setTimeout(() => flipToFront(first), delay);
  setTimeout(() => updateAllScores(false), delay + 260);
}

// Player (human) actions
function playerHit() {
  if (gameOver) return;
  const c = deck.pop();
  players[0].hand.push(c);
  const el = createCardElement(c, false);
  animateDeal(el, players[0].cardsEl, 80, false);

  setTimeout(() => {
    updateAllScores(true);
    const ps = bestScore(players[0].hand);
    if (ps > 21) {
      players[0].busted = true;
      revealDealerCardWithDelay(200);
      setTimeout(() => playBotsThenDealer(), 600);
    } else if (ps === 21) {
      // auto-stand -> bots then dealer
      setTimeout(() => playBotsThenDealer(), 300);
    }
  }, 400);
}
function playerStand() {
  if (gameOver) return;
  // lock human actions, then bots play automatically, then dealer
  btnHit.disabled = true;
  btnStand.disabled = true;
  msg.textContent = 'Bots spielen...';
  setTimeout(() => playBotsThenDealer(), 260);
}

// Bots play method: sequentially for each bot (player indices 1 and 2)
function playBotsThenDealer() {
  // reveal dealer upcard
  revealDealerCardWithDelay(120);
  // bots act in sequence
  const botIndices = [1,2];
  let idx = 0;

  function botStep() {
    if (idx >= botIndices.length) {
      // all bots done -> dealer turn
      setTimeout(() => dealerTurn(), 500);
      return;
    }
    const bi = botIndices[idx];
    const bot = players[bi];

    // simple bot logic: hit while score < 17
    function botDrawLoop() {
      const score = bestScore(bot.hand);
      if (score < 17) {
        const c = deck.pop();
        bot.hand.push(c);
        const el = createCardElement(c, false);
        animateDeal(el, bot.cardsEl, 220, false);
        setTimeout(() => {
          botDrawLoop();
        }, 420);
      } else {
        // done
        idx++;
        setTimeout(() => botStep(), 220);
      }
    }

    // if bot already has blackjack or busted skip drawing
    const s = bestScore(bot.hand);
    if (s === 21) {
      idx++;
      setTimeout(() => botStep(), 220);
    } else {
      botDrawLoop();
    }
  }

  // start after short delay
  setTimeout(() => botStep(), 420);
}

// Dealer play
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
      setTimeout(() => {
        updateAllScores(false);
        drawStep();
      }, 460);
    } else {
      setTimeout(() => settleAndEnd(), 500);
    }
  }

  setTimeout(() => drawStep(), 420);
}

// Settlement: evaluate each player vs dealer. Only human's bankroll changes.
function settleAndEnd() {
  updateAllScores(false);
  const dScore = bestScore(dealer);

  const outcomes = players.map(p => {
    const pScore = bestScore(p.hand);
    let outcome = '';
    // flags
    const playerBlackjack = (pScore === 21 && p.hand.length === 2);
    const dealerBlackjack = (dScore === 21 && dealer.length === 2);

    if (pScore > 21) {
      outcome = `${p.name}: Bust (${pScore}) — verliert.`;
    } else if (dScore > 21) {
      outcome = `${p.name}: Dealer Bust (${dScore}) — ${p.name} gewinnt (${pScore}).`;
    } else if (playerBlackjack && !dealerBlackjack) {
      outcome = `${p.name}: Blackjack! gewinnt 3:2 (${pScore}).`;
    } else if (dealerBlackjack && !playerBlackjack) {
      outcome = `${p.name}: Dealer Blackjack — verliert (${pScore} vs ${dScore}).`;
    } else if (pScore > dScore) {
      outcome = `${p.name}: gewinnt (${pScore} vs ${dScore}).`;
    } else if (pScore === dScore) {
      outcome = `${p.name}: Push (${pScore}).`;
    } else {
      outcome = `${p.name}: verliert (${pScore} vs ${dScore}).`;
    }
    return { player: p, outcome, pScore };
  });

  // Apply payouts only for human (players[0])
  const humanResult = outcomes[0];
  const pScore = humanResult.pScore;
  let payout = 0;
  if (pScore > 21) {
    payout = -currentBet;
  } else {
    const playerBlackjack = (pScore === 21 && players[0].hand.length === 2);
    const dealerBlackjack = (dScore === 21 && dealer.length === 2);
    if (playerBlackjack && !dealerBlackjack) {
      payout = Math.floor(currentBet * 1.5);
    } else if (dealerBlackjack && !playerBlackjack) {
      payout = -currentBet;
    } else if (pScore > dScore) {
      payout = currentBet;
    } else if (pScore === dScore) {
      payout = 0;
    } else {
      payout = -currentBet;
    }
  }

  // apply to bankroll
  if (payout === 0) {
    bankroll += currentBet; // return bet
  } else if (payout > 0) {
    bankroll += currentBet + payout; // return + winnings
  } else {
    // lost: nothing to add (bet already reserved)
  }

  updateBankrollUI();

  // Compose message summarizing all players
  const summary = outcomes.map(o => o.outcome).join('  •  ');
  msg.textContent = `Runde beendet — Dealer: ${dScore}.`;
  lastResult.textContent = `Du: ${humanResult.outcome} Einsatz: ${currentBet} € — Ergebnis: ${payout >= 0 ? '+'+payout+' €' : payout+' €'}`;
  // show full summary in console area (or appended)
  setTimeout(() => {
    // Append small overlay-like text below message (concise)
    // For cleanliness, include summary in message if short
    if (summary.length < 200) {
      lastResult.textContent += '  —  ' + summary;
    }
  }, 250);

  gameOver = true;
  setTimeout(() => {
    btnDeal.disabled = (bankroll <= 0);
    btnHit.disabled = true;
    btnStand.disabled = true;
  }, 300);
}

// ---------- Bankroll UI ----------
function updateBankrollUI() {
  bankrollEl.textContent = bankroll;
  renderChipStack(bankroll);
}

function renderChipStack(amount) {
  if (!bankrollStackEl) return;
  bankrollStackEl.classList.remove('pulse');
  void bankrollStackEl.offsetWidth;
  bankrollStackEl.innerHTML = '';
  let remaining = Math.max(0, Math.floor(amount));
  const denoms = [100, 50, 25, 10, 5, 1];
  denoms.forEach(d => {
    const count = Math.floor(remaining / d);
    if (count > 0) {
      remaining -= count * d;
      const stack = document.createElement('div');
      stack.className = 'chip-stack';
      const visible = Math.min(count, 4);
      for (let i = 0; i < visible; i++) {
        const pill = document.createElement('div');
        pill.className = 'chip-pill chip-' + d;
        pill.style.transform = `translateY(${ -i * 6 }px)`;
        stack.appendChild(pill);
      }
      const label = document.createElement('div');
      label.className = 'chip-label';
      label.textContent = `${d} × ${count}`;
      stack.appendChild(label);
      bankrollStackEl.appendChild(stack);
    }
  });
  if (amount <= 0) {
    const note = document.createElement('div');
    note.className = 'chip-label';
    note.textContent = 'Kein Guthaben';
    bankrollStackEl.appendChild(note);
  }
  setTimeout(() => bankrollStackEl.classList.add('pulse'), 18);
}

// ---------- Reset & Events ----------
function resetGame() {
  deck = [];
  players.forEach(p => { p.hand = []; p.bet = 0; p.busted = false; p.cardsEl.innerHTML = ''; p.scoreEl.textContent = '—'; });
  dealer = [];
  gameOver = false;
  currentBet = 0;
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = false;
  dealerCardsDiv.innerHTML = '';
  dealerScoreDiv.textContent = '—';
  msg.textContent = 'Gib deinen Einsatz ein und drücke „Geben“.';
  lastResult.textContent = '';
  bankroll = 1000;
  updateBankrollUI();
}

btnDeal.addEventListener('click', dealInitial);
btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnReset.addEventListener('click', resetGame);

// initialize
resetGame();
