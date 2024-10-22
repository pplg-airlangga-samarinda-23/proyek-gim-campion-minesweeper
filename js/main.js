var bombImage = '<img src="images/bomb.png">';
var flagImage = '<img src="images/flag.png">';
var wrongBombImage = '<img src="images/wrong-bomb.png">'
var sizeLookup = {
  '9': {totalBombs: 10, tableWidth: '245px'},
  '16': {totalBombs: 40, tableWidth: '420px'},
  '30': {totalBombs: 160, tableWidth: '794px'}
};
var colors = [
  '',
  '#0000FA',
  '#4B802D',
  '#DB1300',
  '#202081',
  '#690400',
  '#457A7A',
  '#1B1B1B',
  '#7A7A7A',
];

/*----- app's state (variables) -----*/
var size = 16;
var board;
var bombCount;
var timeElapsed;
var adjBombs;
var hitBomb;
var elapsedTime;
var timerId;
var winner;
var timeend;

/*----- cached element references -----*/
var boardEl = document.getElementById('board');

// var highScore local storage
var highScore = localStorage.getItem('highscore') || Infinity;

/*----- event listeners -----*/
document.getElementById('size-btns').addEventListener('click', function(e) {
  size = parseInt(e.target.id.replace('size-', ''));
  init();
  render();
});

boardEl.addEventListener('click', function(e) {
  if (winner || hitBomb) return;
  var clickedEl;
  clickedEl = e.target.tagName.toLowerCase() === 'img' ? e.target.parentElement : e.target;
  if (clickedEl.classList.contains('game-cell')) {
    if (!timerId) setTimer();
    var row = parseInt(clickedEl.dataset.row);
    var col = parseInt(clickedEl.dataset.col);
    var cell = board[row][col];
    if (e.shiftKey && !cell.revealed && bombCount > 0) {
      bombCount += cell.flag() ? -1 : 1;
    } else {
      hitBomb = cell.reveal();
      if (hitBomb) {
        revealAll();
        clearInterval(timerId);
        e.target.style.backgroundColor = 'red';
      }
    }
    winner = getWinner();//<--ngecek untuk kondisi untuk membuat nilai variabel menjadi true
    //yang ngejadiin nilai true setelah pemeriksaan kondisi winner

    render();
  }
});

function createResetListener() { 
  document.getElementById('reset').addEventListener('click', function() {
    init();
    render();
  });
}

/*----- functions -----*/
function setTimer () {
  timerId = setInterval(function(){
    elapsedTime += 1;
    document.getElementById('timer').innerText = elapsedTime.toString().padStart(3, '0');
  }, 1000);
};

function revealAll() {
  board.forEach(function(rowArr) {
    rowArr.forEach(function(cell) {
      cell.reveal();
    });
  });
};

function buildTable() {
  var topRow = `
  <tr>
    <td class="menu" id="window-title-bar" colspan="${size}">
      <div id="window-title"><img src="images/mine-menu-icon.png"> Minesweeper</div>
      <div id="window-controls"><img src="images/window-controls.png"></div>
    </td>
  <tr>
    <td class="menu" id="folder-bar" colspan="${size}">
  </tr>
  </tr>
    <tr>
      <td class="menu" colspan="${size}">
          <section id="status-bar">
            <div id="bomb-counter">000</div>
            <div id="reset"><img src="images/smiley-face.png"></div>
            <div id="timer">000</div>
          </section>
      </td>
    </tr>
    `;
  boardEl.innerHTML = topRow + `<tr>${'<td class="game-cell"></td>'.repeat(size)}</tr>`.repeat(size);
  boardEl.style.width = sizeLookup[size].tableWidth;
  createResetListener();
  var cells = Array.from(document.querySelectorAll('td:not(.menu)'));
  cells.forEach(function(cell, idx) {
    cell.setAttribute('data-row', Math.floor(idx / size));
    cell.setAttribute('data-col', idx % size);
  });
}

function buildArrays() {
  var arr = Array(size).fill(null);
  arr = arr.map(function() {
    return new Array(size).fill(null);
  });
  return arr;
};

function buildCell(){
  board.forEach(function(rowArr, rowIdx) {
    rowArr.forEach(function(slot, colIdx) {
      board[rowIdx][colIdx] = new Cell(rowIdx, colIdx, board);
    });
  });
  addBombs();
  runCodeForAllCells(function(cell){
    cell.calcAdjBombs();
  });
};

function init() {
  buildTable();
  board = buildArrays();
  buildCell();
  bombCount = getBombCount();
  elapsedTime = 0;
  clearInterval(timerId);
  timerId = null;
  hitBomb = false;
  winner = false;

  // Update highscore display setiap kali game di-reset
  document.getElementById('high-score').innerText = 
      `Best Time: ${highScore === Infinity ? '---' : highScore.toString().padStart(3, '0')}`;
}


function getBombCount() {
  var count = 0;
  board.forEach(function(row){
    count += row.filter(function(cell) {
      return cell.bomb;
    }).length
  });
  return count;
};


// CARA KERJA RNG NYA
//ngerandom posisi bomb yang jumlah nya ditentukan doficult
function addBombs() {
  var currentTotalBombs = sizeLookup[`${size}`].totalBombs;
  while (currentTotalBombs !== 0) {
    var row = Math.floor(Math.random() * size);
    var col = Math.floor(Math.random() * size);
    var currentCell = board[row][col]
    if (!currentCell.bomb){
      currentCell.bomb = true
      currentTotalBombs -= 1
    }
  }
};

//yang memeriksa kondisi winner degan memberi nilai true
function getWinner() {
  for (var row = 0; row<board.length; row++) {
    for (var col = 0; col<board[0].length; col++) {
      var cell = board[row][col];
      if (!cell.revealed && !cell.bomb) return false;
    }
  } 
  return true;

};

function render() {
  document.getElementById('bomb-counter').innerText = bombCount.toString().padStart(3, '0');
  var tdList = Array.from(document.querySelectorAll('[data-row]'));

  tdList.forEach(function(td) {
      var rowIdx = parseInt(td.getAttribute('data-row'));
      var colIdx = parseInt(td.getAttribute('data-col'));
      var cell = board[rowIdx][colIdx];

      if (cell.flagged) {
          td.innerHTML = flagImage;
      } else if (cell.revealed) {
          if (cell.bomb) {
              td.innerHTML = bombImage;
          } else if (cell.adjBombs) {
              td.className = 'revealed';
              td.style.color = colors[cell.adjBombs];
              td.textContent = cell.adjBombs;
          } else {
              td.className = 'revealed';
          }
      } else {
          td.innerHTML = '';
      }
  });

  if (hitBomb) {
      document.getElementById('reset').innerHTML = '<img src="images/dead-face.png">';
      runCodeForAllCells(function(cell) {
          if (!cell.bomb && cell.flagged) {
              var td = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
              td.innerHTML = wrongBombImage;
          }
      });
  } else if (winner) {
      document.getElementById('reset').innerHTML = '<img src="images/cool-face.png">';
      clearInterval(timerId);

      // Simpan dan bandingkan waktu terbaik
      if (elapsedTime < highScore) {
          highScore = elapsedTime;
          localStorage.setItem('highscore', highScore);
      }
  }

  // Tampilkan waktu terbaik di layar
  document.getElementById('high-score').innerText = 
      `Best Time: ${highScore === Infinity ? '---' : highScore.toString().padStart(3, '0')}`;
}


function runCodeForAllCells(cb) {
  board.forEach(function(rowArr) {
    rowArr.forEach(function(cell) {
      cb(cell);
    });
  });
}

init();
render();

console.log(localStorage.getItem('toptime').toString());//buat ouput nilai score ke console log