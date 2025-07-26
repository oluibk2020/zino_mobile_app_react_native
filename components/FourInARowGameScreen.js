import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import tw from "twrnc";

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;

const clickSound = "https://charisintelligence.com.ng/portal/audio/click.mp3";
const captureSound =
  "https://charisintelligence.com.ng/portal/audio/capturetwo.mp3";

const FourInARowGameScreen = () => {
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_ONE);
  const [status, setStatus] = useState("playing");
  const [message, setMessage] = useState("");
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [showInstructions, setShowInstructions] = useState(false);
  const [clickSoundRef, setClickSoundRef] = useState(null);
  const [captureSoundRef, setCaptureSoundRef] = useState(null);

  useEffect(() => {
    initializeBoard();
    const loadSounds = async () => {
      const { sound: click } = await Audio.Sound.createAsync({
        uri: clickSound,
      });
      const { sound: capture } = await Audio.Sound.createAsync({
        uri: captureSound,
      });
      setClickSoundRef(click);
      setCaptureSoundRef(capture);
    };
    loadSounds();
  }, []);

  const playClickSound = () => clickSoundRef?.replayAsync();
  const playCaptureSound = () => captureSoundRef?.replayAsync();

  const initializeBoard = useCallback(() => {
    const newBoard = Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(EMPTY));
    setBoard(newBoard);
    setCurrentPlayer(PLAYER_ONE);
    setStatus("playing");
    setMessage("");
  }, []);

  const checkWin = useCallback((board, player) => {
    const winPattern = (r, c, dr, dc) =>
      r + 3 * dr < ROWS &&
      r + 3 * dr >= 0 &&
      c + 3 * dc < COLS &&
      c + 3 * dc >= 0 &&
      [...Array(4)].every((_, i) => board[r + i * dr][c + i * dc] === player);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (
          winPattern(r, c, 0, 1) ||
          winPattern(r, c, 1, 0) ||
          winPattern(r, c, 1, 1) ||
          winPattern(r, c, -1, 1)
        ) {
          return true;
        }
      }
    }
    return false;
  }, []);

  const getValidMoves = (board) =>
    Array.from({ length: COLS }, (_, col) => col).filter(
      (col) => board[0][col] === EMPTY
    );

  const simulateMove = (board, col, player) => {
    const temp = JSON.parse(JSON.stringify(board));
    for (let r = ROWS - 1; r >= 0; r--) {
      if (temp[r][col] === EMPTY) {
        temp[r][col] = player;
        break;
      }
    }
    return temp;
  };

  const scoreBoard = (board, depth) => {
    if (checkWin(board, PLAYER_TWO)) return 1000 - depth;
    if (checkWin(board, PLAYER_ONE)) return -1000 + depth;
    return 0;
  };

  const minimax = (board, depth, isMax, alpha, beta) => {
    const validMoves = getValidMoves(board);
    const score = scoreBoard(board, depth);
    if (Math.abs(score) === 1000 || depth === 4 || validMoves.length === 0)
      return score;

    if (isMax) {
      let maxEval = -Infinity;
      for (const move of validMoves) {
        const evalScore = minimax(
          simulateMove(board, move, PLAYER_TWO),
          depth + 1,
          false,
          alpha,
          beta
        );
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of validMoves) {
        const evalScore = minimax(
          simulateMove(board, move, PLAYER_ONE),
          depth + 1,
          true,
          alpha,
          beta
        );
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const getAIMove = (board) => {
    const validMoves = getValidMoves(board);
    if (difficulty === "easy") {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    if (difficulty === "hard") {
      for (const col of validMoves) {
        if (checkWin(simulateMove(board, col, PLAYER_TWO), PLAYER_TWO))
          return col;
      }
      for (const col of validMoves) {
        if (checkWin(simulateMove(board, col, PLAYER_ONE), PLAYER_ONE))
          return col;
      }
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    if (difficulty === "medium") {
      let bestScore = -Infinity;
      let bestMove = validMoves[0];
      for (const col of validMoves) {
        const score = minimax(
          simulateMove(board, col, PLAYER_TWO),
          0,
          false,
          -Infinity,
          Infinity
        );
        if (score > bestScore) {
          bestScore = score;
          bestMove = col;
        }
      }
      return bestMove;
    }
  };

  const handleColumnClick = useCallback(
    (col) => {
      if (status !== "playing") return;

      let row = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY) {
          row = r;
          break;
        }
      }

      if (row === -1) {
        setMessage("Column full!");
        return;
      }

      const newBoard = JSON.parse(JSON.stringify(board));
      newBoard[row][col] = currentPlayer;
      playClickSound();
      setBoard(newBoard);
      setMessage("");

      if (checkWin(newBoard, currentPlayer)) {
        playCaptureSound();
        setStatus(`Player ${currentPlayer} wins!`);
        return;
      }

      const full = newBoard.every((row) => row.every((cell) => cell !== EMPTY));
      if (full) {
        setStatus("It's a draw!");
        return;
      }

      const nextPlayer = currentPlayer === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
      setCurrentPlayer(nextPlayer);
    },
    [board, currentPlayer, status, checkWin]
  );

  useEffect(() => {
    if (isAIEnabled && currentPlayer === PLAYER_TWO && status === "playing") {
      const timeout = setTimeout(() => {
        const aiCol = getAIMove(board);
        handleColumnClick(aiCol);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, isAIEnabled, status, board, handleColumnClick]);

  return (
    <ScrollView
      contentContainerStyle={tw`flex-1 items-center justify-center bg-black p-4`}
    >
      <Text style={tw`text-3xl font-bold text-white mb-2`}>Four in a Row</Text>

      <TouchableOpacity
        onPress={() => setIsAIEnabled(!isAIEnabled)}
        style={tw`px-4 py-2 rounded-full mb-3 ${
          isAIEnabled ? "bg-yellow-600" : "bg-gray-600"
        }`}
      >
        <Text style={tw`text-white font-bold`}>
          {isAIEnabled ? "Disable AI" : "Enable AI"}
        </Text>
      </TouchableOpacity>

      {isAIEnabled && (
        <View style={tw`flex-row justify-center mb-3`}>
          {["easy", "medium", "hard"].map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setDifficulty(level)}
              style={tw`px-3 py-1 mx-1 rounded-full ${
                difficulty === level ? "bg-blue-600" : "bg-gray-500"
              }`}
            >
              <Text style={tw`text-white text-sm capitalize`}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {status === "playing" ? (
        <Text style={tw`text-lg font-bold mb-1 text-yellow-200`}>
          Player {currentPlayer === PLAYER_ONE ? "Red" : "Yellow"}'s Turn
        </Text>
      ) : (
        <Text style={tw`text-lg font-bold mb-1 text-green-400`}>{status}</Text>
      )}

      {!!message && (
        <Text style={tw`text-sm text-yellow-400 mb-2`}>{message}</Text>
      )}

      <View style={tw`flex-row mb-3 flex-wrap justify-center`}>
        {Array(COLS)
          .fill(0)
          .map((_, col) => (
            <TouchableOpacity
              key={col}
              onPress={() => handleColumnClick(col)}
              disabled={status !== "playing"}
              style={tw`w-10 h-10 bg-gray-700 rounded-full items-center justify-center m-1`}
            >
              <Text style={tw`text-white text-xl`}>↓</Text>
            </TouchableOpacity>
          ))}
      </View>

      <View style={tw`bg-blue-900 p-2 rounded-lg shadow-lg`}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={tw`flex-row justify-center`}>
            {row.map((cell, colIndex) => (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={tw`w-10 h-10 rounded-full bg-indigo-950 m-1 items-center justify-center`}
              >
                {cell !== EMPTY && (
                  <View
                    style={tw`
                      w-5 h-5 rounded-full
                      ${cell === PLAYER_ONE ? "bg-red-500" : "bg-yellow-300"}
                    `}
                  />
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={tw`flex-row mt-5 space-x-3`}>
        <TouchableOpacity
          onPress={initializeBoard}
          style={tw`bg-green-600 px-4 py-2 rounded-lg`}
        >
          <Text style={tw`text-white font-bold`}>New Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowInstructions(true)}
          style={tw`bg-blue-600 px-4 py-2 rounded-lg`}
        >
          <Text style={tw`text-white font-bold`}>How to Play</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showInstructions} transparent animationType="slide">
        <View
          style={tw`flex-1 bg-black bg-opacity-80 items-center justify-center p-6`}
        >
          <View style={tw`bg-white p-5 rounded-xl w-full max-w-md`}>
            <Text
              style={tw`text-lg font-bold text-center text-indigo-700 mb-2`}
            >
              How to Play
            </Text>
            <Text style={tw`text-sm text-gray-800 mb-1`}>
              • Click a column to drop your piece.
            </Text>
            <Text style={tw`text-sm text-gray-800 mb-1`}>
              • Connect 4 pieces to win (vertically, horizontally, or
              diagonally).
            </Text>
            <Text style={tw`text-sm text-gray-800 mb-1`}>
              • Enable AI to play against computer.
            </Text>
            <Text style={tw`text-sm text-gray-800 mb-1`}>
              • Choose difficulty: easy, medium, or hard.
            </Text>
            <Pressable
              onPress={() => setShowInstructions(false)}
              style={tw`mt-4 bg-red-500 px-4 py-2 rounded-full`}
            >
              <Text style={tw`text-white text-center font-bold`}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default FourInARowGameScreen;
