
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import tw from "twrnc";

const clickSound = "https://charisintelligence.com.ng/portal/audio/click.mp3";
const captureSound =
  "https://charisintelligence.com.ng/portal/audio/capturetwo.mp3";

const BOARD_SIZE = 6;
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const EMPTY_CELL = 0;

const NexusGameScreen = () => {
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_ONE);
  const [status, setStatus] = useState("playing");
  const [playerScores, setPlayerScores] = useState({
    [PLAYER_ONE]: 0,
    [PLAYER_TWO]: 0,
  });
  const [message, setMessage] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [validMoves, setValidMoves] = useState([]);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const clickSoundRef = useRef(null);
  const captureSoundRef = useRef(null);

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: click } = await Audio.Sound.createAsync({
          uri: clickSound,
        });
        const { sound: capture } = await Audio.Sound.createAsync({
          uri: captureSound,
        });
        clickSoundRef.current = click;
        captureSoundRef.current = capture;
      } catch (e) {
        Alert.alert("Audio Error", "Failed to load sounds");
      }
    };

    loadSounds();
    return () => {
      clickSoundRef.current?.unloadAsync();
      captureSoundRef.current?.unloadAsync();
    };
  }, []);

  const playSound = async (ref, fallbackUri) => {
    try {
      if (ref.current) {
        const status = await ref.current.getStatusAsync();
        if (!status.isLoaded) {
          await ref.current.loadAsync({ uri: fallbackUri });
        }
        await ref.current.replayAsync();
      }
    } catch (err) {
      console.error("Sound play error:", err);
    }
  };

  const initializeBoard = useCallback(() => {
    const newBoard = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(EMPTY_CELL)
    );
    const mid = BOARD_SIZE / 2;
    newBoard[mid - 1][mid - 1] = PLAYER_ONE;
    newBoard[mid][mid] = PLAYER_ONE;
    newBoard[mid - 1][mid] = PLAYER_TWO;
    newBoard[mid][mid - 1] = PLAYER_TWO;

    setBoard(newBoard);
    setCurrentPlayer(PLAYER_ONE);
    setStatus("playing");
    setMessage("");
    setIsAiThinking(false);
    setValidMoves([]);
    setPlayerScores({ [PLAYER_ONE]: 0, [PLAYER_TWO]: 0 });
  }, []);

  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  const findCapturable = useCallback((b, r, c, player, all = false) => {
    const captures = [];
    const opponent = player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
    const dirs = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dr, dc] of dirs) {
      let i = r + dr,
        j = c + dc;
      const path = [];
      while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE) {
        if (b[i][j] === opponent) path.push([i, j]);
        else if (b[i][j] === player && path.length) {
          if (all) captures.push(...path);
          else return true;
          break;
        } else break;
        i += dr;
        j += dc;
      }
    }
    return all ? captures : false;
  }, []);

  const getValidMoves = useCallback(
    (player) => {
      const moves = [];
      board.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell === EMPTY_CELL && findCapturable(board, r, c, player))
            moves.push([r, c]);
        })
      );
      return moves;
    },
    [board, findCapturable]
  );

  const updateScoresAndStatus = useCallback(() => {
    let p1 = 0,
      p2 = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell === PLAYER_ONE) p1++;
        else if (cell === PLAYER_TWO) p2++;
      })
    );
    setPlayerScores({ [PLAYER_ONE]: p1, [PLAYER_TWO]: p2 });

    const moves1 = getValidMoves(PLAYER_ONE);
    const moves2 = getValidMoves(PLAYER_TWO);

    if (!moves1.length && !moves2.length) {
      setStatus(
        p1 > p2
          ? `Player 1 wins with ${p1} points!`
          : p2 > p1
          ? `Player 2 wins with ${p2} points!`
          : "It's a draw!"
      );
    } else if (currentPlayer === PLAYER_ONE && !moves1.length) {
      setMessage("Player 1 has no moves, passing to AI");
      setTimeout(() => {
        setCurrentPlayer(PLAYER_TWO);
        setMessage("");
      }, 1000);
    } else if (currentPlayer === PLAYER_TWO && !moves2.length) {
      setMessage("AI has no moves, passing to Player 1");
      setTimeout(() => {
        setCurrentPlayer(PLAYER_ONE);
        setMessage("");
      }, 1000);
    }
  }, [board, currentPlayer, getValidMoves]);

  useEffect(() => {
    if (status === "playing") updateScoresAndStatus();
  }, [board, status, updateScoresAndStatus]);

  const makeMove = useCallback(
    (r, c, player) => {
      const flips = findCapturable(board, r, c, player, true);
      if (!flips.length) return;

      playSound(clickSoundRef, clickSound);
      setTimeout(() => playSound(captureSoundRef, captureSound), 200);

      const newBoard = board.map((row) => row.slice());
      newBoard[r][c] = player;
      flips.forEach(([i, j]) => (newBoard[i][j] = player));

      setBoard(newBoard);
      setCurrentPlayer(player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE);
    },
    [board, findCapturable]
  );

  const onCellPress = (r, c) => {
    if (
      status !== "playing" ||
      board[r][c] !== EMPTY_CELL ||
      (currentPlayer === PLAYER_TWO && isAiEnabled)
    )
      return;
    makeMove(r, c, currentPlayer);
  };

  useEffect(() => {
    if (!isAiEnabled || currentPlayer !== PLAYER_TWO || status !== "playing")
      return;
    setIsAiThinking(true);
    setMessage("AI is thinking...");
    const options = getValidMoves(PLAYER_TWO);
    setTimeout(() => {
      if (options.length) {
        const [r, c] = options[Math.floor(Math.random() * options.length)];
        makeMove(r, c, PLAYER_TWO);
      } else {
        setCurrentPlayer(PLAYER_ONE);
      }
      setIsAiThinking(false);
      setMessage("");
    }, 1200);
  }, [currentPlayer, status, isAiEnabled, getValidMoves, makeMove]);

  const { width } = Dimensions.get("window");
  const margin = 1,
    padding = 16 * 2;
  const cellSize = (width - padding - margin * 2 * BOARD_SIZE) / BOARD_SIZE;

  return (
    <View style={tw`flex-1 items-center justify-center bg-black p-4`}>
      <Text style={tw`text-white text-2xl font-bold mb-2`}>Nexus Grid</Text>
      <Text style={tw`text-yellow-300 mb-2`}>{message || status}</Text>
      <Text style={tw`text-white mb-2`}>
        Player 1 Score: {playerScores[PLAYER_ONE]} | Player 2 Score:{" "}
        {playerScores[PLAYER_TWO]}
      </Text>
      <Text style={tw`text-white mb-4`}>Turn: Player {currentPlayer}</Text>

      <View
        style={{
          width: BOARD_SIZE * (cellSize + margin * 2),
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const hint =
              showHints &&
              getValidMoves(currentPlayer).some(([x, y]) => x === r && y === c);
            return (
              <TouchableOpacity
                key={`${r}-${c}`}
                style={[
                  tw`m-px border`,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor:
                      cell === EMPTY_CELL
                        ? "#333"
                        : cell === PLAYER_ONE
                        ? "#3b82f6"
                        : "#ef4444",
                    borderColor: hint ? "#facc15" : "#555",
                    borderWidth: hint ? 3 : 1,
                  },
                ]}
                disabled={status !== "playing"}
                onPress={() => onCellPress(r, c)}
              />
            );
          })
        )}
      </View>

      <View style={tw`mt-4 flex-row flex-wrap justify-center`}>
        <TouchableOpacity
          onPress={initializeBoard}
          style={tw`bg-purple-600 px-4 py-2 m-1 rounded`}
        >
          <Text style={tw`text-white`}>New Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsAiEnabled(!isAiEnabled)}
          style={tw`bg-green-600 px-4 py-2 m-1 rounded`}
        >
          <Text style={tw`text-white`}>AI: {isAiEnabled ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowHints(!showHints)}
          style={tw`bg-indigo-600 px-4 py-2 m-1 rounded`}
        >
          <Text style={tw`text-white`}>Hints: {showHints ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={tw`bg-yellow-600 px-4 py-2 m-1 rounded`}
        >
          <Text style={tw`text-white`}>How to Play</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View
          style={tw`flex-1 bg-black bg-opacity-80 justify-center items-center px-4`}
        >
          <View style={tw`bg-white p-4 rounded-lg w-full max-w-md`}>
            <ScrollView>
              <Text style={tw`text-lg font-bold mb-2`}>
                How to Play Nexus Grid
              </Text>
              <Text style={tw`mb-2`}>
                1. Players take turns placing pieces on the board. You can enable AI using the "AI" button.
                {"\n"}2. Hints shows valid moves. A valid move must capture at
                least one opponent's piece by bracketing them in any direction.
                You can enable/disable the hints using the "Hints" button.
                {"\n"}3. Captured pieces flip to your color.
                {"\n"}4. If no valid moves are available, the turn passes.
                {"\n"}5. Game ends when no valid moves remain.
                {"\n"}6. Player with the most pieces wins!
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={tw`bg-purple-600 px-4 py-2 rounded`}
              >
                <Text style={tw`text-white text-center`}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NexusGameScreen;
