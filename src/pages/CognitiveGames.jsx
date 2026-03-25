import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { Brain, Trophy, Clock, Star, RotateCcw, Play } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

// ─── GAME 1: Memory Match ───────────────────────────────────────────
const EMOJIS = ["🌸", "🎵", "🏠", "🌳", "🐦", "☀️", "🌙", "⭐"]

const MemoryMatchGame = ({ onComplete }) => {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    initGame()
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const initGame = () => {
    const pairs = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false }))
    setCards(pairs)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setTimer(0)
  }

  const handleFlip = (id) => {
    if (flipped.length === 2) return
    if (flipped.includes(id) || matched.includes(cards[id].emoji)) return

    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        setMatched(prev => [...prev, cards[a].emoji])
        setFlipped([])
        if (matched.length + 1 === EMOJIS.length) {
          clearInterval(timerRef.current)
          const score = Math.max(100 - moves * 2 - timer, 10)
          setTimeout(() => onComplete(score, 100, "memory_match"), 500)
        }
      } else {
        setTimeout(() => setFlipped([]), 1000)
      }
    }
  }

  const isFlipped = (card) => flipped.includes(card.id) || matched.includes(card.emoji)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 text-sm text-muted">
          <span>⏱ {timer}s</span>
          <span>🔄 {moves} moves</span>
          <span>✅ {matched.length}/{EMOJIS.length} matched</span>
        </div>
        <button onClick={initGame} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <RotateCcw size={14} /> Reset
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`h-16 rounded-xl text-2xl font-bold transition-all border-2
              ${isFlipped(card)
                ? matched.includes(card.emoji)
                  ? "bg-green-100 border-green-400"
                  : "bg-primary text-white border-primary"
                : "bg-soft border-gray-200 hover:border-primary"}`}
          >
            {isFlipped(card) ? card.emoji : "?"}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── GAME 2: Word Recall ────────────────────────────────────────────
const WORD_SETS = [
  { words: ["APPLE", "TABLE", "PENNY", "RIVER", "CLOUD"], hint: "Remember these 5 words" },
  { words: ["MANGO", "CHAIR", "WATER", "MUSIC", "LIGHT"], hint: "Remember these 5 words" },
  { words: ["HOUSE", "BREAD", "SMILE", "GRASS", "STONE"], hint: "Remember these 5 words" },
]

const WordRecallGame = ({ onComplete }) => {
  const [phase, setPhase] = useState("study") // study | recall | result
  const [wordSet] = useState(WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)])
  const [inputs, setInputs] = useState(["", "", "", "", ""])
  const [timer, setTimer] = useState(10)
  const timerRef = useRef(null)

  useEffect(() => {
    if (phase === "study") {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current)
            setPhase("recall")
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const handleSubmit = () => {
    const correct = inputs.filter((inp, i) =>
      inp.trim().toUpperCase() === wordSet.words[i]
    ).length
    onComplete(correct, 5, "word_recall")
    setPhase("result")
  }

  return (
    <div>
      {phase === "study" && (
        <div className="text-center">
          <p className="text-muted text-sm mb-4">{wordSet.hint} — {timer}s remaining</p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {wordSet.words.map((word, i) => (
              <span key={i} className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-lg">
                {word}
              </span>
            ))}
          </div>
          <div className="w-full bg-soft rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(timer / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {phase === "recall" && (
        <div>
          <p className="text-muted text-sm mb-4 text-center">
            Type the 5 words you remember:
          </p>
          <div className="flex flex-col gap-3 mb-4">
            {inputs.map((inp, i) => (
              <input
                key={i}
                type="text"
                value={inp}
                onChange={(e) => {
                  const newInputs = [...inputs]
                  newInputs[i] = e.target.value
                  setInputs(newInputs)
                }}
                placeholder={`Word ${i + 1}`}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary uppercase"
              />
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 transition"
          >
            Submit Answers
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="text-center py-6">
          <p className="text-lg font-semibold text-dark mb-4">
            You remembered {inputs.filter((inp, i) => inp.trim().toUpperCase() === wordSet.words[i]).length} / 5 words
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {wordSet.words.map((word, i) => (
              <span
                key={i}
                className={`px-4 py-2 rounded-xl font-medium ${
                  inputs[i]?.trim().toUpperCase() === word
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GAME 3: Number Sequence ────────────────────────────────────────
const NumberSequenceGame = ({ onComplete }) => {
  const [sequence, setSequence] = useState([])
  const [userInput, setUserInput] = useState("")
  const [phase, setPhase] = useState("watch")
  const [showing, setShowing] = useState(0)
  const [level, setLevel] = useState(3)
  const [score, setScore] = useState(0)
  const [maxScore] = useState(5)

  useEffect(() => {
    generateSequence()
  }, [level])

  const generateSequence = () => {
    const seq = Array.from({ length: level }, () => Math.floor(Math.random() * 9) + 1)
    setSequence(seq)
    setPhase("watch")
    setShowing(0)
    setUserInput("")

    let i = 0
    const interval = setInterval(() => {
      setShowing(i)
      i++
      if (i >= seq.length) {
        clearInterval(interval)
        setTimeout(() => setPhase("input"), 800)
      }
    }, 800)
  }

  const handleSubmit = () => {
    const correct = userInput.trim() === sequence.join(" ")
    if (correct) {
      const newScore = score + 1
      setScore(newScore)
      if (newScore >= maxScore) {
        onComplete(newScore, maxScore, "number_sequence")
      } else {
        toast.success("Correct! +1")
        setLevel(l => l + 1)
      }
    } else {
      toast.error(`Wrong! Correct: ${sequence.join(" ")}`)
      onComplete(score, maxScore, "number_sequence")
    }
  }

  return (
    <div className="text-center">
      <p className="text-muted text-sm mb-2">Level {level - 2} — Remember the sequence!</p>
      <p className="text-sm text-primary mb-4">Score: {score}/{maxScore}</p>

      {phase === "watch" && (
        <div>
          <p className="text-muted text-sm mb-4">Watch carefully...</p>
          <div className="flex justify-center gap-3">
            {sequence.map((num, i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all
                  ${i === showing
                    ? "bg-primary text-white scale-110"
                    : i < showing ? "bg-soft text-dark" : "bg-soft text-transparent"}`}
              >
                {i <= showing ? num : "?"}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "input" && (
        <div>
          <p className="text-muted text-sm mb-4">
            Type the numbers separated by spaces (e.g. 1 2 3):
          </p>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g. 4 7 2 ..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl text-dark focus:outline-none focus:border-primary mb-4"
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 transition"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────
const GAMES = [
  {
    id: "memory_match",
    title: "Memory Match",
    desc: "Flip cards and find matching pairs",
    icon: "🃏",
    color: "bg-purple-50 border-purple-200",
    research: "Improves visual memory & attention",
  },
  {
    id: "word_recall",
    title: "Word Recall",
    desc: "Remember and recall a list of words",
    icon: "📝",
    color: "bg-blue-50 border-blue-200",
    research: "Strengthens verbal memory",
  },
  {
    id: "number_sequence",
    title: "Number Sequence",
    desc: "Remember and repeat number sequences",
    icon: "🔢",
    color: "bg-green-50 border-green-200",
    research: "Improves working memory",
  },
]

const CognitiveGames = () => {
  const { id } = useParams()
  const [selectedGame, setSelectedGame] = useState(null)
  const [scores, setScores] = useState([])
  const [gameResult, setGameResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScores()
  }, [id])

  const fetchScores = async () => {
    try {
      const res = await api.get(`/games/${id}/scores`)
      setScores(res.data)
    } catch {
      toast.error("Failed to load scores")
    }
    setLoading(false)
  }

  const handleGameComplete = async (score, maxScore, gameType) => {
    try {
      await api.post(`/games/${id}/score`, {
        gameType,
        score,
        maxScore,
        difficulty: "easy",
      })
      setGameResult({ score, maxScore, gameType })
      await fetchScores()
      toast.success(`Game complete! Score: ${score}/${maxScore}`)
    } catch {
      toast.error("Failed to save score")
    }
  }

  const gameTypeLabel = {
    memory_match: "Memory Match",
    word_recall: "Word Recall",
    number_sequence: "Number Sequence",
    photo_puzzle: "Photo Puzzle",
  }

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Cognitive Training</h1>
          <p className="text-muted mt-1">Research-proven brain exercises for dementia care</p>
        </div>

        {!selectedGame && !gameResult && (
          <>
            {/* Game Selection */}
            <div className="grid grid-cols-3 gap-5 mb-8">
              {GAMES.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition border-2 ${game.color} hover:scale-105`}
                >
                  <div className="text-4xl mb-3">{game.icon}</div>
                  <h3 className="font-bold text-dark text-lg mb-1">{game.title}</h3>
                  <p className="text-muted text-sm mb-3">{game.desc}</p>
                  <p className="text-xs text-primary font-medium">
                    🧠 {game.research}
                  </p>
                </div>
              ))}
            </div>

            {/* Score History */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-dark mb-4">
                Recent Game History
              </h2>
              {scores.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy size={36} className="text-primary mx-auto mb-2 opacity-30" />
                  <p className="text-muted">No games played yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {scores.slice(0, 8).map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-soft rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {GAMES.find(g => g.id === s.gameType)?.icon || "🎮"}
                        </span>
                        <div>
                          <p className="font-medium text-dark text-sm">
                            {gameTypeLabel[s.gameType]}
                          </p>
                          <p className="text-xs text-muted">
                            {new Date(s.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {s.score}/{s.maxScore}
                        </p>
                        <p className="text-xs text-muted">
                          {Math.round((s.score / s.maxScore) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Active Game */}
        {selectedGame && !gameResult && (
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-dark">
                {GAMES.find(g => g.id === selectedGame)?.title}
              </h2>
              <button
                onClick={() => setSelectedGame(null)}
                className="text-muted text-sm hover:text-primary"
              >
                ← Back
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {selectedGame === "memory_match" && (
                <MemoryMatchGame onComplete={handleGameComplete} />
              )}
              {selectedGame === "word_recall" && (
                <WordRecallGame onComplete={handleGameComplete} />
              )}
              {selectedGame === "number_sequence" && (
                <NumberSequenceGame onComplete={handleGameComplete} />
              )}
            </div>
          </div>
        )}

        {/* Game Result */}
        {gameResult && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl p-10 shadow-sm">
              <div className="text-6xl mb-4">
                {gameResult.score === gameResult.maxScore ? "🏆" :
                 gameResult.score >= gameResult.maxScore / 2 ? "⭐" : "💪"}
              </div>
              <h2 className="text-2xl font-bold text-dark mb-2">
                Game Complete!
              </h2>
              <p className="text-4xl font-bold text-primary mb-2">
                {gameResult.score}/{gameResult.maxScore}
              </p>
              <p className="text-muted mb-6">
                {Math.round((gameResult.score / gameResult.maxScore) * 100)}% accuracy
              </p>

              <div className="w-full bg-soft rounded-full h-3 mb-6">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${(gameResult.score / gameResult.maxScore) * 100}%` }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedGame(gameResult.gameType); setGameResult(null) }}
                  className="flex-1 border-2 border-primary text-primary py-3 rounded-xl font-medium hover:bg-primary hover:text-white transition"
                >
                  Play Again
                </button>
                <button
                  onClick={() => { setSelectedGame(null); setGameResult(null) }}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
                >
                  All Games
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CognitiveGames