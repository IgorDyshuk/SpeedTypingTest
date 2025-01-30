const words = 'in one good real one not school set they state high life consider on and not come what also for set point can want as while with of order child about school thing never hold find order each too between program work end you home place around while place problem end begin interest while public or where see time those increase interest be give end think seem small as both another a child same eye you between way do who into again good fact than under very head become real possible some write know however late each that with because that place nation only for each change form consider we would interest with world so order or run more open that large write turn never over open each over change still old take hold need give by consider line only leave while what set up number part form want against great problem can because head so first this here would course become help year first end want both fact public long word down also long for without new turn against the because write seem line interest call not if line thing what work people way may old consider leave hold want life between most place may if go who need fact such program where which end off child down change to from people high during people find to however into small new general it do that could old for last get another hand much eye great no work and with but good there last think can around use like number never since world need what we around part show new come seem while some and since still small these you general which seem will place come order form how about just also they with state late use both early too lead general seem there point take general seem few out like might under if ask while such interest feel word right again how about system such between late want fact up problem stand new say move a lead small however large public out by eye here over so be way use like say people work for since interest so face order school good not most run problem group run she late other problem real form what just high no man do under would to each too end point give number child through so this large see get form also all those course to work during about he plan still so like down he look down where course at who plan way so since come against he all who at world because while so few last these mean take house who old way large no first too now off would in this course present order home public school back own little about he develop of do over help day house stand present another by few come that down last or use say take would each even govern play around back under some line think she even when from do real problem between long as there school do as mean to all on other good may from might call world thing life turn of he look last problem after get show want need thing old other during be again develop come from consider the now number say life interest to system only group world same state school one problem between for turn run at very against eye must go both still all a as so after play eye little be those should out after which these both much house become both school this he real and may mean time by real number other as feel at end ask plan come turn by all head increase he present increase use stand after see order lead than system here ask in of look point little too without each for both but right we come world much own set we right off long those stand go both but under now must real general then before with much those at no of we only back these person plan from run new as own take early just increase only look open follow get that on system the mean plan man over it possible if most late line would first without real hand say turn point small set at in system however to be home show new again come under because about show face child know person large program how over could thing from out world while nation stand part run have look what many system order some one program you great could write day do he any also where child late face eye run still again on by as call high the must by late little mean never another seem to leave because for day against public long number word about after much need open change also'.split(' ');
const wordsCount = words.length;
const gameTime = 30 * 1000
window.timer = null
window.gameStart = null

function addClass(el, name) {
  el.className += ' ' + name
}

function removeClass(el, name) {
  el.className = el.className.replace(name, '')

}

function randomWord() {
  const randomIndex = Math.ceil(Math.random() * wordsCount);
  return words[randomIndex - 1];
}

function formatWord(word) {
  return `<div class="word"><span class="letter">${word.split('').join(`</span><span class="letter">`)}</span></div>`;

}

function newGame() {
  document.getElementById("words").innerHTML = '';
  for (let i = 0; i < 200; i++) {
    document.getElementById("words").innerHTML += formatWord(randomWord());
  }
  addClass(document.querySelector(".word"), "current");
  addClass(document.querySelector(".letter"), "current");
  window.timer = null
  document.getElementById("timer").innerHTML = (gameTime / 1000) + '';
}

function getWpm() {
  const words = [...document.querySelectorAll(".word")]
  const lastTypedWord = document.querySelector('.word .current')
  const lastTypedWordIndex = words.indexOf(lastTypedWord)
  const typedWords = words.slice(0, lastTypedWordIndex)
  const correctWords = typedWords.filter(word => {
    const letters = [...word.children]
    const incorrectLetters = letters.filter(letter => letter.classList.contains('incorrect'))
    const correctLetters = letters.filter(letter => letter.classList.contains('correct'))
    return incorrectLetters.length === 0 && correctLetters.length === letters.length
  })
  return correctWords.length / gameTime * 60000
}

function gameOver() {
  clearInterval(window.timer)
  addClass(document.getElementById("game"), 'over')
  const result = getWpm()
  document.getElementById("timer").innerHTML = `WPM: ${result}`;
}

function restGameUI() {
  clearInterval(window.timer);
  window.timer = null;
  window.gameStart = null;

  document.getElementById("game").classList.remove("over");

  document.getElementById("timer").innerHTML = (gameTime / 1000).toString();

  const wordsContainer = document.getElementById("words");
  wordsContainer.style.marginTop = "0px";

  const cursor = document.getElementById("cursor");
  const firstLetter = document.querySelector(".word .letter");

  cursor.style.top = firstLetter.getBoundingClientRect().top + 4 + "px";
  cursor.style.left = firstLetter.getBoundingClientRect().left - 1 + "px";
  cursor.classList.remove("active");

  const allWords = document.querySelectorAll(".word");
  allWords.forEach((word) => word.classList.remove("current"));

  const allLetters = document.querySelectorAll(".letter");
  allLetters.forEach((letter) =>
    letter.classList.remove("current", "correct", "incorrect", "extra")
  );

  const firstWord = document.querySelector(".word");
  firstWord.classList.add("current");
  firstWord.querySelector(".letter").classList.add("current");
}

document.getElementById("game").addEventListener('keydown', e => {
  const key = e.key
  const currentWord = document.querySelector(".word.current")
  const currenLetter = document.querySelector(".letter.current")
  const expected = currenLetter?.innerHTML || ' '
  const isLetter = key.length === 1 && key !== " "
  const isSpace = key === ' '
  const isBackspace = key === 'Backspace'
  const isFirstLetter = currenLetter === currentWord.firstChild
  const isCtrlBackspace = key === 'Backspace' && e.ctrlKey

  if (document.querySelector('#game.over')) {
    return;
  }

  console.log({key, expected})

  if (!window.timer && isLetter) {
    window.timer = setInterval(() => {
      if (!window.gameStart) {
        window.gameStart = (new Date()).getTime()
      }
      const currentTime = (new Date()).getTime()
      const msPassed = currentTime - window.gameStart
      const sPassed = Math.round(msPassed / 1000)
      const sLeft = (gameTime / 1000) - sPassed
      if (sLeft <= 0) {
        gameOver()
        return
      }
      document.getElementById("timer").innerHTML = sLeft + ''
    }, 1000)
  }

  if (isLetter) {
    if (currenLetter) {
      addClass(currenLetter, key === expected ? 'correct' : 'incorrect')
      removeClass(currenLetter, "current")
      if (currenLetter.nextSibling) {
        addClass(currenLetter.nextSibling, "current")
      }
    } else {
      const extraLetter = document.createElement('span')
      extraLetter.innerHTML = key
      extraLetter.className = 'letter extra'
      currentWord.appendChild(extraLetter)
    }
  }

  if (isSpace) {
    if (expected !== ' ') {
      const letterToInvalidate = [...document.querySelectorAll('.word.current .letter:not(.correct)')]
      letterToInvalidate.forEach(el => {
        addClass(el, "incorrect")
      })
    }

    const incorrectLetters = currentWord.querySelectorAll('.letter.incorrect, .letter.extra')
    if (incorrectLetters.length > 0) {
      addClass(currentWord, "incorrect")
    } else {
      removeClass(currentWord, "incorrect")
    }

    removeClass(currentWord, "current")
    addClass(currentWord.nextSibling, "current")
    if (currenLetter) {
      removeClass(currenLetter, "current")
    }
    addClass(currentWord.nextSibling.firstChild, "current")
  }

  if (isBackspace) {
    if (currenLetter && isFirstLetter) {
      const prevWord = currentWord.previousSibling
      const nextWordIncorrect = [...prevWord.querySelectorAll('.letter.incorrect, .letter.extra')]
      if (nextWordIncorrect.length === 0) {

      } else {
        removeClass(currentWord, "current")
        addClass(prevWord, "current")
        removeClass(currenLetter, "current")

        const prevWordExtra = [...prevWord.querySelectorAll('.letter.extra')]
        if (prevWordExtra.length > 0) {
          const lastExtraLetter = prevWordExtra[prevWordExtra.length - 1]
          addClass(lastExtraLetter, "current")
          lastExtraLetter.remove()
        } else {
          addClass(prevWord.lastChild, "current")
          removeClass(prevWord.lastChild, "incorrect")
          removeClass(prevWord.lastChild, "correct")
        }
        removeClass(prevWord, "incorrect")
      }
    }
    if (currenLetter && !isFirstLetter) {
      removeClass(currenLetter, "current")
      addClass(currenLetter.previousSibling, "current")
      removeClass(currenLetter.previousSibling, "correct")
      removeClass(currenLetter.previousSibling, "incorrect")
    }
    if (!currenLetter) {
      const extraLetters = [...currentWord.querySelectorAll('.letter.extra')]
      if (extraLetters.length > 0) {
        const lastExtraLetter = extraLetters[extraLetters.length - 1]
        lastExtraLetter.remove()
      } else {
        addClass(currentWord.lastChild, "current")
        removeClass(currentWord.lastChild, "correct")
        removeClass(currentWord.lastChild, "incorrect")
      }
    }
  }

  if (isCtrlBackspace) {
    e.preventDefault()

    if (currenLetter) {
      const letters = [...currentWord.children]
      const currentIndex = letters.indexOf(currenLetter)
      console.log(currentIndex)

      for (let i = 0; i < currentIndex; i++) {
        if (letters[i]) {
          removeClass(letters[i], "incorrect")
          removeClass(letters[i], "correct")
          removeClass(letters[i], "current")
        }
      }
      addClass(currentWord.firstChild, "current")
    } else {
      const allLetters = currentWord.querySelectorAll('.letter')
      allLetters.forEach(el => {
        removeClass(el, "incorrect")
        removeClass(el, "correct")
        removeClass(el, "current")
      })

      const extraLetters = currentWord.querySelectorAll('.letter.extra')
      extraLetters.forEach(el => {el.remove()})

      if (currentWord.firstChild) {
        addClass(currentWord.firstChild, "current")
      }
    }

    if (currenLetter && isFirstLetter) {
      const prevWord = currentWord.previousSibling
      const nextWordIncorrect = [...prevWord.querySelectorAll('.letter.incorrect, .letter.extra')]
      if (nextWordIncorrect.length === 0) {

      } else {
        removeClass(currentWord, "current")
        removeClass(currenLetter, "current")

        const allLettersPrev = prevWord.querySelectorAll('.letter')
        allLettersPrev.forEach(el => {
          removeClass(el, "incorrect")
          removeClass(el, "correct")
          removeClass(el, "current")
        })

        const extraLetters = prevWord.querySelectorAll('.letter.extra')
        extraLetters.forEach(el => {el.remove()})

        addClass(prevWord.firstChild, "current")

        removeClass(prevWord, "incorrect")
      }
    }
  }

  //move lines / words
  if (currentWord.getBoundingClientRect().top > 250) {
    const words = document.getElementById('words')
    const margin = parseInt(words.style.marginTop || '0px')
    words.style.marginTop = (margin - 48) + 'px'
  }

  // move cursor
  const nextLetter = document.querySelector(".letter.current")
  const nextWord = document.querySelector(".word.current")
  const cursor = document.getElementById("cursor")

  if (nextLetter || nextWord) {
    const rect = (nextLetter || nextWord).getBoundingClientRect()
    cursor.style.top = rect.top + (rect.height / 2) - (cursor.offsetHeight / 2) + 'px'
    cursor.style.left = (nextLetter ? rect.left : rect.right) - 1 + "px"

    cursor.classList.add('active')
  }
})

document.getElementById('new_game_button').addEventListener('click', () => {
  restGameUI()
  newGame()
})

newGame();
