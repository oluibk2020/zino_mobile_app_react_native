import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import tw from "twrnc";

const CARD_ICONS = [
  "⭐",
  "🚀",
  "🌈",
  "🧩",
  "💡",
  "🎵",
  "❤️",
  "🔥",
  "💧",
  "🌿",
  "⚡",
  "🌸",
  "👑",
  "💎",
  "🔑",
  "🔔",
];

const INITIAL_GRID_SIZE = 4;
const GAME_START_TIME = 60;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_SIZE = SCREEN_WIDTH / INITIAL_GRID_SIZE - 20;

const MemoryMatchGameScreen = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(GAME_START_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState("");
  const timeoutRef = useRef(null);
  const gameTimerIntervalRef = useRef(null);

  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const initializeGame = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (gameTimerIntervalRef.current)
      clearInterval(gameTimerIntervalRef.current);

    const numPairs = (INITIAL_GRID_SIZE * INITIAL_GRID_SIZE) / 2;
    const selectedIcons = shuffleArray(CARD_ICONS).slice(0, numPairs);
    const newCardsData = [...selectedIcons, ...selectedIcons].map(
      (icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      })
    );

    setCards(shuffleArray(newCardsData));
    setFlippedCards([]);
    setMatchedPairs([]);
    setScore(0);
    setTimer(GAME_START_TIME);
    setGameOver(false);
    setGameStarted(false);
    setMessage('Click "Start Game" to begin!');
  }, [shuffleArray]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameTimerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(gameTimerIntervalRef.current);
            setGameOver(true);
            setMessage("Time's Up! Game Over!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(gameTimerIntervalRef.current);
  }, [gameStarted, gameOver]);

  const handleCardClick = useCallback(
    (clickedCardIndex) => {
      if (
        !gameStarted ||
        gameOver ||
        flippedCards.length === 2 ||
        cards[clickedCardIndex].isFlipped ||
        cards[clickedCardIndex].isMatched
      )
        return;

      const newCards = [...cards];
      newCards[clickedCardIndex].isFlipped = true;
      setCards(newCards);

      setFlippedCards((prevFlipped) => {
        const updatedFlipped = [...prevFlipped, clickedCardIndex];
        if (updatedFlipped.length === 2) {
          const [firstIdx, secondIdx] = updatedFlipped;
          const firstCard = cards[firstIdx];
          const secondCard = cards[secondIdx];

          if (firstCard.icon === secondCard.icon) {
            setMessage("Match!");
            setScore((prev) => prev + 100);
            const matchedUpdate = [...cards];
            matchedUpdate[firstIdx].isMatched = true;
            matchedUpdate[secondIdx].isMatched = true;
            setCards(matchedUpdate);
            setMatchedPairs((prev) => [...prev, firstIdx, secondIdx]);
            setFlippedCards([]);
          } else {
            setMessage("No match! Try again.");
            timeoutRef.current = setTimeout(() => {
              const reset = [...cards];
              reset[firstIdx].isFlipped = false;
              reset[secondIdx].isFlipped = false;
              setCards(reset);
              setFlippedCards([]);
              setMessage("");
            }, 800);
          }
        }
        return updatedFlipped;
      });
    },
    [gameStarted, gameOver, flippedCards, cards]
  );

  useEffect(() => {
    if (gameStarted && cards.every((card) => card.isMatched) && !gameOver) {
      setGameOver(true);
      setMessage(`You won with a score of ${score} and ${timer}s left!`);
      clearInterval(gameTimerIntervalRef.current);
    }
  }, [cards, gameStarted, gameOver, score, timer]);

  return (
    <ScrollView
      contentContainerStyle={tw`flex-1 items-center justify-center bg-purple-900 py-6`}
    >
      <Text style={tw`text-white text-3xl font-bold mb-4`}>Memory Match</Text>

      <View style={tw`flex-row justify-around w-full px-6 mb-4`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-gray-300 text-base`}>Score</Text>
          <Text style={tw`text-yellow-400 text-lg font-bold`}>{score}</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-gray-300 text-base`}>Time</Text>
          <Text
            style={tw`${
              timer <= 10 ? "text-red-500" : "text-green-400"
            } text-lg font-bold`}
          >
            {timer}s
          </Text>
        </View>
      </View>

      {message && <Text style={tw`text-blue-200 mb-4`}>{message}</Text>}

      <View style={tw`flex-wrap flex-row justify-center`}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            onPress={() => handleCardClick(index)}
            style={[
              tw`m-1 items-center justify-center rounded-lg`,
              {
                width: CARD_SIZE,
                height: CARD_SIZE,
                backgroundColor: card.isMatched
                  ? "#27ae60"
                  : card.isFlipped
                  ? "#34495e"
                  : "#f39c12",
                opacity: card.isMatched ? 0.7 : 1,
              },
            ]}
            disabled={card.isMatched || card.isFlipped}
          >
            <Text style={tw`text-white text-2xl font-bold`}>
              {card.isFlipped || card.isMatched ? card.icon : "?"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={tw`mt-6`}>
        {!gameStarted && !gameOver && (
          <TouchableOpacity
            onPress={() => {
              setGameStarted(true);
              setMessage("Good Luck!");
            }}
            style={tw`bg-green-600 px-6 py-2 rounded-full`}
          >
            <Text style={tw`text-white font-bold`}>Start Game</Text>
          </TouchableOpacity>
        )}
        {(gameStarted || gameOver) && (
          <TouchableOpacity
            onPress={initializeGame}
            style={tw`bg-purple-700 px-6 py-2 rounded-full`}
          >
            <Text style={tw`text-white font-bold`}>Play Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default MemoryMatchGameScreen;
