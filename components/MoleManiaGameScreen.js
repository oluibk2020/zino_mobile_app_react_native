import  { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import tw from "twrnc";
import { Audio } from "expo-av";

const GRID_SIZE = 3;
const MOLE_HOLD_TIME = 1000;
const GAME_DURATION = 30;
const BASE_INTERVAL_MIN = 800;
const BASE_INTERVAL_MAX = 1500;

const whackSound = "https://charisintelligence.com.ng/portal/audio/click.mp3";
const missedWhackSound =
  "https://charisintelligence.com.ng/portal/audio/capturetwo.mp3";
const gameStartOrEndSound =
  "https://charisintelligence.com.ng/portal/audio/fighting.mp3";

const MoleManiaGameScreen = () => {
  const [moles, setMoles] = useState(Array(GRID_SIZE * GRID_SIZE).fill(null));
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timer, setTimer] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const moleTimerRef = useRef([]);
  const gameIntervalRef = useRef(null);
  const appearTimeoutIdRef = useRef(null);

  const playSound = async (soundUrl) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: soundUrl });
      await sound.playAsync();
    } catch (e) {
      console.warn("Error playing sound", e);
    }
  };

  const getAvailableIndexes = useCallback(() => {
    return moles
      .map((m, i) => (m === null ? i : null))
      .filter((i) => i !== null);
  }, [moles]);

  const showMoleCombo = useCallback(() => {
    if (!gameStarted || gameOver) {
      clearTimeout(appearTimeoutIdRef.current);
      return;
    }

    const available = getAvailableIndexes();
    if (available.length === 0) {
      appearTimeoutIdRef.current = setTimeout(showMoleCombo, 500);
      return;
    }

    const comboCount = Math.min(
      3 + Math.floor(Math.random() * 2),
      available.length
    );
    const selectedIndexes = [...available]
      .sort(() => 0.5 - Math.random())
      .slice(0, comboCount);

    const moleAssignments = selectedIndexes.map((i, idx) => ({
      index: i,
      type: idx === 0 ? "eye" : "nose",
    }));

    setMoles((prev) => {
      const updated = [...prev];
      moleAssignments.forEach(({ index, type }) => {
        updated[index] = type;
      });
      return updated;
    });

    moleAssignments.forEach(({ index }) => {
      const timeoutId = setTimeout(() => {
        setMoles((prevMoles) => {
          const newMoles = [...prevMoles];
          if (newMoles[index] === "eye") setMisses((m) => m + 1);
          newMoles[index] = null;
          return newMoles;
        });
      }, MOLE_HOLD_TIME);
      moleTimerRef.current[index] = timeoutId;
    });

    const difficultyFactor = 1 - timer / GAME_DURATION;
    const minDelay = BASE_INTERVAL_MIN - difficultyFactor * 400;
    const maxDelay = BASE_INTERVAL_MAX - difficultyFactor * 500;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    appearTimeoutIdRef.current = setTimeout(showMoleCombo, delay);
  }, [getAvailableIndexes, gameStarted, gameOver, timer]);

  const cleanupGameTimers = useCallback(() => {
    moleTimerRef.current.forEach(clearTimeout);
    moleTimerRef.current = [];
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (appearTimeoutIdRef.current) clearTimeout(appearTimeoutIdRef.current);
    appearTimeoutIdRef.current = null;
  }, []);

  const initializeGame = useCallback(() => {
    cleanupGameTimers();
    setMoles(Array(GRID_SIZE * GRID_SIZE).fill(null));
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimer(GAME_DURATION);
    setGameOver(false);
    setGameStarted(false);
    setMessage('Click "Start Game" to begin!');
  }, [cleanupGameTimers]);

  useEffect(() => {
    initializeGame();
    return () => {
      cleanupGameTimers();
    };
  }, [initializeGame, cleanupGameTimers]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimer(GAME_DURATION);
    setMessage("");
    // playSound(gameStartOrEndSound);

    gameIntervalRef.current = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          setGameOver(true);
          cleanupGameTimers();
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  }, [cleanupGameTimers]);

  useEffect(() => {
    if (
      gameStarted &&
      !gameOver &&
      !appearTimeoutIdRef.current &&
      timer === GAME_DURATION
    ) {
      showMoleCombo();
    }
    if (gameOver) {
      setMessage(
        `Game Over! Final Score: ${score}, Hits: ${hits}, Misses: ${misses}`
      );
    //   playSound(gameStartOrEndSound);
    }
  }, [gameStarted, gameOver, showMoleCombo, timer, score, hits, misses]);

  const handleMoleClick = useCallback(
    (index) => {
      if (gameOver || !gameStarted || !moles[index]) return;

      setMoles((prevMoles) => {
        const newMoles = [...prevMoles];
        newMoles[index] = null;
        return newMoles;
      });

      if (moles[index] === "eye") {
        setScore((prev) => prev + 10);
        setHits((prev) => prev + 1);
        setMessage("WHACK!");
        playSound(whackSound);
      } else {
        setMisses((prev) => prev + 1);
        playSound(missedWhackSound);
      }

      if (moleTimerRef.current[index]) {
        clearTimeout(moleTimerRef.current[index]);
        moleTimerRef.current[index] = null;
      }

      setTimeout(() => setMessage(""), 300);
    },
    [gameOver, gameStarted, moles]
  );

  return (
    <ScrollView
      contentContainerStyle={tw`h-full bg-gray-900 text-white items-center justify-center p-4 pt-12`}
    >
      <View style={tw`bg-gray-700 p-6 rounded-xl w-full max-w-md items-center`}>
        <Text style={tw`text-3xl font-bold text-yellow-400 mb-4`}>
          Mole Mania
        </Text>

        <TouchableOpacity
          onPress={() => setShowHowToPlay(true)}
          style={tw`mb-2 px-4 py-1 bg-yellow-500 rounded-full`}
        >
          <Text style={tw`text-white font-bold`}>How to Play</Text>
        </TouchableOpacity>

        <View style={tw`flex-row justify-between w-full mb-4`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-gray-300`}>Score</Text>
            <Text style={tw`text-yellow-400 text-xl font-bold`}>{score}</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-gray-300`}>Time</Text>
            <Text
              style={tw`text-xl font-bold ${
                timer <= 10 ? "text-red-500" : "text-green-400"
              }`}
            >
              {timer}s
            </Text>
          </View>
        </View>

        {message ? (
          <Text style={tw`text-blue-300 mb-4 text-center`}>{message}</Text>
        ) : null}

        <View style={[tw`flex-wrap flex-row justify-center`, { width: 320 }]}>
          {moles.map((mole, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleMoleClick(index)}
              style={[
                tw`w-24 h-24 m-1 rounded-full bg-yellow-700 items-center justify-end border-4 border-yellow-900`,
                {
                  transform: [{ scale: mole ? 1.05 : 1 }],
                  transition: "transform 0.3s ease-in-out",
                },
              ]}
              activeOpacity={0.8}
            >
              {mole && (
                <View
                  style={tw`w-16 h-16 bg-yellow-400 rounded-full mb-1 items-center justify-center`}
                >
                  <Text style={tw`text-2xl`}>
                    {mole === "eye" ? "👁️" : "👃"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={tw`mt-6`}>
          {!gameStarted && !gameOver && (
            <TouchableOpacity
              onPress={handleStartGame}
              style={tw`px-6 py-2 bg-blue-600 rounded-full`}
            >
              <Text style={tw`text-white font-bold text-lg`}>Start Game</Text>
            </TouchableOpacity>
          )}
          {gameOver && (
            <TouchableOpacity
              onPress={initializeGame}
              style={tw`px-6 py-2 bg-purple-600 rounded-full`}
            >
              <Text style={tw`text-white font-bold text-lg`}>Play Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={showHowToPlay} transparent animationType="slide">
        <View
          style={tw`flex-1 items-center justify-center bg-black bg-opacity-80 p-6`}
        >
          <View style={tw`bg-white rounded-lg p-6 w-full max-w-sm`}>
            <Text style={tw`text-black text-lg font-bold mb-2`}>
              How to Play
            </Text>
            <Text style={tw`text-black mb-4`}>
              Tap the mole with the eye (👁️) to score points. Avoid tapping the
              nose moles (👃), or you'll get a miss. Try to hit as many eye
              moles as you can before time runs out. Good luck!
            </Text>
            <TouchableOpacity
              onPress={() => setShowHowToPlay(false)}
              style={tw`bg-blue-600 px-4 py-2 rounded-full self-center`}
            >
              <Text style={tw`text-white font-bold`}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default MoleManiaGameScreen;
