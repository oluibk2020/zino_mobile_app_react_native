import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message"; // Assuming you have this configured globally
import { useContext, useEffect , useCallback, useState, useRef} from "react";
import StoreContext from "../context/storeContext";
import { useNavigation,useFocusEffect  } from "@react-navigation/native";

/**
 * A modern, stylish component to display a cryptocurrency payment invoice.
 * @param {object} props - The component props.
 * @param {object} props.payLoad - The payload containing the invoice data.
 * @returns {JSX.Element}
 */
const CryptoPaymentScreen = () => {
  const {  setCryptoPayload, cryptoPayload } =
    useContext(StoreContext);
  const navigation = useNavigation();

  // Use the provided payLoad prop, but fall back to mock data if it's not available.
  const data = cryptoPayload;

  // --- Destructure the necessary information ---
  const {
    qrCode,
    payment_amount,
    payment_currency,
    status,
    id: transactionRef,
    payment_address
  } = data.dataNewTransaction.data;

  const transaction = data.transaction;
  const network = "BNB Smart Chain (BEP-20)";
  const basqetEndpoint = "https://basqet-proxy.vercel.app/api";


  //make a countdown of 180 minutes
  const minutes = 180;
  const seconds = minutes * 60;

  const [remainingTime, setRemainingTime] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  //convert remainingTime to hour, minutes and seconds
  const hoursRemaining = Math.floor(remainingTime / 3600);
  const minutesRemaining = Math.floor((remainingTime % 3600) / 60);
  const secondsRemaining = remainingTime % 60;

  const formattedTime =
    hoursRemaining > 0
      ? `${hoursRemaining}:${minutesRemaining.toString().padStart(2, "0")}:${secondsRemaining
          .toString()
          .padStart(2, "0")}`
      : `${minutesRemaining}:${secondsRemaining.toString().padStart(2, "0")}`;

  //fetch transaction status every 30 seconds and stop when status is abandoned or success. then send a notification of status and then navigate back to wallet screen

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        console.log("running");
        const response = await fetch(
          `${basqetEndpoint}/status?transactionId=${transactionRef}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();
        const status = result?.data?.status;
        // console.log(status);

        if (status === "ABANDONED" || status === "SUCCESSFUL") {
          clearInterval(interval); // Stop the loop

          Toast.show({
            type: status === "SUCCESSFUL" ? "success" : "error",
            text1:
              status === "SUCCESSFUL"
                ? "Transaction Successful"
                : "Transaction Abandoned",
            position: "bottom",
          });

          setCryptoPayload(null);
          navigation.replace("WalletMain");
          //reset crptoPayload
        }
      } catch (err) {
        console.log("Error fetching status:", err);
      }
    }, 120000); // 120 seconds

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);

  //reset crptoPayload on unmount
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when the screen is unfocused (user navigates away)
        console.log(
          "CryptoPaymentScreen unfocused, resetting crptoPayload",
          data
        );
        setCryptoPayload(null);
        //navigate to Wallet main area
        navigation.replace("WalletMain");
      };
    }, [])
  );

  /**
   * Handles copying text to the clipboard and shows a toast notification.
   * Uses expo-clipboard for native functionality.
   * @param {string} textToCopy - The string to be copied.
   */
  const handleCopyClick = async (textToCopy) => {
    try {
      await Clipboard.setStringAsync(textToCopy);
      Toast.show({
        type: "success",
        text1: "Copied to Clipboard!",
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      Toast.show({
        type: "error",
        text1: "Failed to copy address",
        text2: "Please copy it manually.",
        position: "bottom",
      });
    }
  };

  /**
   * Determines the color and icon based on the transaction status.
   * @param {string} currentStatus - The status string (e.g., 'PENDING').
   * @returns {{containerClass: string, textClass: string, iconName: string}}
   */
  const getStatusStyle = (currentStatus) => {
    switch (currentStatus?.toUpperCase()) {
      case "PENDING":
        return {
          containerClass: "bg-yellow-500/20 border-yellow-500/30",
          textClass: "text-yellow-400",
          iconName: "time-outline",
        };
      case "SUCCESS":
      case "COMPLETED":
        return {
          containerClass: "bg-green-500/20 border-green-500/30",
          textClass: "text-green-400",
          iconName: "checkmark-circle-outline",
        };
      default: // FAILED, CANCELLED, etc.
        return {
          containerClass: "bg-red-500/20 border-red-500/30",
          textClass: "text-red-400",
          iconName: "close-circle-outline",
        };
    }
  };
  const statusStyle = getStatusStyle(status);

  // Reusable component for list items in instructions
  const InstructionStep = ({ number, title, children }) => (
    <View style={tw`flex-row mb-3`}>
      <Text style={tw`mr-3 text-base font-bold text-gray-500`}>{number}</Text>
      <View style={tw`flex-1`}>
        <Text style={tw`text-sm text-gray-300 font-semibold leading-snug`}>
          {title}
        </Text>
        {children && <View style={tw`mt-1`}>{children}</View>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-900`}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-6 justify-center`}
      >
        <View style={tw`bg-gray-800 rounded-2xl p-6 border border-gray-700`}>
          <Text style={tw`text-white text-xl font-bold text-center mb-2`}>
            Payment Invoice To Top Up Wallet
          </Text>

          {/* --- Do not close page Section --- */}
          <View
            style={tw`bg-purple-800 p-4 rounded-lg mb-6 border border-gray-700`}
          >
            <Text style={tw`text-gray-100 text-sm`}>
              Note: Please do not close this page before completing the payment.
            </Text>
          </View>

          {/* --- QR Code Section --- */}
          <View
            style={tw`items-center justify-center bg-white rounded-xl p-4 mx-auto mb-6`}
          >
            {qrCode ? (
              <Image
                source={{ uri: qrCode }}
                style={tw`w-48 h-48`}
                resizeMode="contain"
              />
            ) : (
              <View
                style={tw`w-48 h-48 items-center justify-center bg-gray-200`}
              >
                <Text style={tw`text-gray-500`}>QR Code not available</Text>
              </View>
            )}
          </View>

          {/* --- Amount and Address Section --- */}
          <View
            style={tw`bg-gray-900 p-4 rounded-lg mb-6 border border-gray-700`}
          >
            {/* Amount */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-gray-400 text-sm`}>Amount to send</Text>
              <Text style={tw`text-white text-lg font-bold`}>
                {payment_amount}{" "}
                <Text style={tw`text-green-400`}>{payment_currency}</Text>
              </Text>
            </View>

            {/* Address */}
            <View>
              <Text style={tw`text-gray-400 text-sm mb-2`}>
                To this one time unique {network} address,
                <Text style={tw`text-red-500 text-sm mb-2`}>
                  {" "}
                  valid for {formattedTime}
                </Text>
              </Text>
              <View
                style={tw`bg-gray-800 p-3 rounded-lg flex-row items-center justify-between`}
              >
                <Text
                  style={tw`text-white font-mono text-sm flex-1 pr-2`}
                  numberOfLines={1}
                >
                  {payment_address}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopyClick(payment_address)}
                  style={tw`bg-purple-600 p-2 rounded-md`}
                >
                  <Ionicons name="copy-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* --- Status --- */}
          <View
            style={tw`flex-row items-center justify-center p-3 rounded-lg mb-6 border ${statusStyle.containerClass}`}
          >
            <Ionicons
              name={statusStyle.iconName}
              size={22}
              color={statusStyle.textClass}
            />
            <Text style={tw`ml-2 text-base font-bold ${statusStyle.textClass}`}>
              {status}
            </Text>
          </View>

          {/* --- Listening for Payment --- */}
          <View
            style={tw`flex-row items-center justify-center p-3 rounded-lg mb-6 border bg-green-500/20 border-green-500/30 `}
          >
            <Ionicons name="ear-outline" size={22} color="white" />
            <Text style={tw`ml-2 text-sm text-white`}>
              Listening for confirmation...
            </Text>
          </View>
          <ActivityIndicator size="small" color="#ffffff" style={tw`mr-3`} />

          {/* --- Instructions --- */}
          <View style={tw`border-t border-gray-700 pt-6`}>
            <Text style={tw`text-white font-bold text-xl mb-4`}>
              Instructions
            </Text>

            <InstructionStep number="1." title="Copy your deposit address.">
              <Text style={tw`text-sm text-gray-400`}>
                Tap the “Copy” button above to copy your USDT wallet address.
              </Text>
            </InstructionStep>

            <InstructionStep
              number="2."
              title="Use your crypto wallet or exchange."
            >
              <Text style={tw`text-sm text-gray-400`}>
                Open a crypto wallet like Trust Wallet, Binance, or Metamask
                (with BSC).
              </Text>
            </InstructionStep>

            <InstructionStep
              number="3."
              title="Select the correct asset and network."
            >
              <Text style={tw`text-sm text-gray-400`}>
                You must send{" "}
                <Text style={tw`font-bold text-green-400`}>USDT</Text> on the{" "}
                <Text style={tw`font-bold text-gray-300`}>{network}</Text>{" "}
                network (Binance Smart Chain - BEP-20).
              </Text>
              <Text style={tw`text-sm text-red-400 mt-1`}>
                ⚠️ Do NOT use Ethereum (ERC-20) or Tron (TRC-20) networks.
              </Text>
            </InstructionStep>

            <InstructionStep number="4." title="Paste the wallet address.">
              <Text style={tw`text-sm text-gray-400`}>
                Paste the copied address into the “Recipient” field in your
                crypto app.
              </Text>
            </InstructionStep>

            <InstructionStep number="5." title="Send the exact amount.">
              <Text style={tw`text-sm text-gray-400`}>
                Do not include transaction fees in the amount. Send exactly what
                is shown.
              </Text>
            </InstructionStep>

            <InstructionStep number="6." title="Confirm and send.">
              <Text style={tw`text-sm text-gray-400`}>
                Double-check that the network is BEP-20 before confirming the
                transaction.
              </Text>
            </InstructionStep>

            <InstructionStep number="7." title="Wait for confirmation.">
              <Text style={tw`text-sm text-gray-400`}>
                Once your deposit is confirmed on the blockchain, we’ll update
                your wallet automatically.
              </Text>
            </InstructionStep>

            <Text style={tw`text-sm text-yellow-400 mt-4`}>
              ✅ Only send USDT on Binance Smart Chain (BEP-20). Sending from
              other networks may result in permanent loss of funds.
            </Text>
          </View>
        </View>

        {/* --- Secure Footer --- */}
        <View style={tw`flex-row items-center justify-center p-4 mt-6`}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={tw.color("green-500")}
          />
          <Text style={tw`text-green-500 ml-2 text-sm`}>
            Secure Transaction
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CryptoPaymentScreen;
