import { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView, // Added for potential overflow
  Keyboard, // Added to dismiss keyboard
  TouchableWithoutFeedback, // Added to dismiss keyboard
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import StoreContext from "../context/storeContext";
import tw from "twrnc";
import { WebView } from "react-native-webview";
import Toast from "react-native-toast-message";
import CryptoPaymentScreen from "../components/CryptoPaymentScreen";

// Define reusable quick amount buttons
const QuickAmountButton = ({ currency, amount, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(amount.toString())}
    style={tw`border border-gray-300 rounded-full px-4 py-2 mr-2 mb-2`}
  >
    <Text style={tw`text-gray-700 font-medium`}>
      {currency} {amount.toLocaleString()}
    </Text>
  </TouchableOpacity>
);

const FundWalletScreen = ({ navigation }) => {
  const {
    isLoading,
    setIsLoading,
    paymentLink,
    setPaymentLink,
    amount,
    setAmount,
    fundWallet,
    setGlobalCurrency,
    globalCurrency,
    cryptoPayload,
  } = useContext(StoreContext);

  const [expectedRedirectUrl] = useState(
    // No need for setExpectedRedirectUrl if static
    "https://portal.charisintelligence.com.ng"
  );
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const [inputError, setInputError] = useState(""); // State for inline validation error

  const MIN_DEPOSIT = globalCurrency === "ngn" ? 1000 : 5; // Define minimum deposit amount as a constant

  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when the screen is unfocused (user navigates away)
        setPaymentLink("");
        //navigate to wallet main area
        navigation.replace("WalletMain");
      };
    }, [])
  );

  useEffect(() => {
    if (paymentLink) {
      // Simplified check: if paymentLink exists
      setIsWebViewOpen(true);
      Toast.show({
        type: "success",
        text1: "Opening payment page...",
        text2: "Please wait while we redirect you.",
        visibilityTime: 3000, // Show toast for 3 seconds
      });
    } else {
      setIsWebViewOpen(false); // Ensure WebView closes if link becomes empty
    }
  }, [paymentLink]);

  //if cryptoPayload is not null, return cryptoPayment screen
  if (cryptoPayload) {
    return <CryptoPaymentScreen />;
  }

  // --- Handlers ---

  const handleNavigationChange = (navState) => {
    console.log("WebView Nav State URL:", navState.url); // Debugging
    if (navState.url.includes(expectedRedirectUrl)) {
      setIsWebViewOpen(false);
      setPaymentLink(""); // Clear the link
      Toast.show({
        type: "success",
        text1: "Payment Status Checking",
        text2: "Redirecting back to wallet...",
        visibilityTime: 4000,
      });
      // Navigate back to Wallet screen after a short delay to allow toast visibility
      setTimeout(() => {
        navigation.replace("WalletMain"); // Or navigate('Wallet') depending on desired stack behavior
      }, 1000);
    }
  };

  const handleAmountChange = (text) => {
    // Allow only numbers
    const numericValue = text.replace(/[^0-9]/g, "");
    setAmount(numericValue);
    // Clear error when user types
    if (inputError) {
      setInputError("");
    }
  };

  const validateAmount = () => {
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount < MIN_DEPOSIT) {
      setInputError(
        `Minimum deposit amount is ${
          globalCurrency === "ngn" ? "₦" : "$"
        } ${MIN_DEPOSIT.toLocaleString()}`
      );
      return false;
    }
    setInputError(""); // Clear error if valid
    return true;
  };

  const onSubmitHandler = async () => {
    Keyboard.dismiss(); // Dismiss keyboard on submit
    if (!validateAmount()) {
      return; // Stop if validation fails
    }

    setIsLoading(true);
    try {
      await fundWallet(); // Call the context function
      // Assuming fundWallet sets the paymentLink, the useEffect will handle the WebView
    } catch (error) {
      console.error("Funding Error:", error);
      Alert.alert("Error", "Failed to initiate payment. Please try again.");
      // Potentially show more specific error from 'error' object if available
    } finally {
      setIsLoading(false); // Ensure loading is set to false
    }
  };

  // --- Render Logic ---

  // Render WebView if opened
  if (isWebViewOpen && paymentLink) {
    return (
      <WebView
        source={{ uri: paymentLink }}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        style={tw`flex-1`} // Ensure WebView takes full screen
        renderLoading={() => (
          // Custom loading indicator for WebView
          <View
            style={tw`flex-1 justify-center items-center absolute top-0 bottom-0 left-0 right-0 bg-white`}
          >
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={tw`mt-4 text-gray-600`}>Loading Payment Page...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          // Handle WebView load errors
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView error: ", nativeEvent);
          setIsWebViewOpen(false);
          setPaymentLink("");
          Alert.alert(
            "Loading Error",
            `Failed to load the payment page. Please check your connection and try again. ${
              nativeEvent.description || ""
            }`
          );
          navigation.goBack(); // Go back if WebView fails to load
        }}
      />
    );
  }

  // Main Deposit Screen UI
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        style={tw`flex-1 bg-gray-100`} // Use a light gray background for contrast
        contentContainerStyle={tw`flex-grow justify-center items-center p-4`} // Center content vertically
        keyboardShouldPersistTaps="handled" // Ensures taps work even when keyboard is up
      >
        <View style={tw`bg-white rounded-2xl p-6 shadow-xl w-full max-w-md`}>
          <Text style={tw`text-center text-2xl font-bold text-gray-800 mb-2`}>
            Fund Your Wallet
          </Text>
          <Text style={tw`text-center text-base text-gray-500 mb-6`}>
            Enter the amount you want to deposit (
            {globalCurrency === "ngn" ? "NGN" : "USD"}).
          </Text>

          {/* Amount Input Section */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-medium text-gray-600 mb-1 ml-1`}>
              Amount
            </Text>
            <View
              style={tw`flex-row items-center bg-gray-50 border ${
                inputError ? "border-red-500" : "border-gray-300"
              } rounded-xl px-4 py-3`}
            >
              <Text style={tw`text-2xl font-semibold text-gray-800 mr-2`}>
                {globalCurrency === "ngn" ? "₦" : "$"}
              </Text>
              <TextInput
                placeholder={
                  globalCurrency === "ngn" ? "e.g., 5000" : "e.g., 100"
                }
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
                onBlur={validateAmount} // Validate when input loses focus
                style={tw`flex-1 text-2xl font-semibold text-gray-900 h-14`} // Ensure consistent height
                editable={!isLoading} // Disable input when loading
              />
            </View>
            {inputError ? (
              <Text style={tw`text-red-500 text-xs mt-1 ml-1`}>
                {inputError}
              </Text>
            ) : null}
          </View>

          {/* Quick Amount Suggestions */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-sm font-medium text-gray-600 mb-2 ml-1`}>
              Quick Select
            </Text>
            <View style={tw`flex-row flex-wrap`}>
              <QuickAmountButton
                currency={globalCurrency === "ngn" ? "₦" : "$"}
                amount={globalCurrency === "ngn" ? 1000 : 200}
                onPress={handleAmountChange}
              />
              <QuickAmountButton
                currency={globalCurrency === "ngn" ? "₦" : "$"}
                amount={globalCurrency === "ngn" ? 2500 : 500}
                onPress={handleAmountChange}
              />
              <QuickAmountButton
                currency={globalCurrency === "ngn" ? "₦" : "$"}
                amount={globalCurrency === "ngn" ? 5000 : 1000}
                onPress={handleAmountChange}
              />
              <QuickAmountButton
                currency={globalCurrency === "ngn" ? "₦" : "$"}
                amount={globalCurrency === "ngn" ? 10000 : 3000}
                onPress={handleAmountChange}
              />
              <QuickAmountButton
                currency={globalCurrency === "ngn" ? "₦" : "$"}
                amount={globalCurrency === "ngn" ? 25000 : 5000}
                onPress={handleAmountChange}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={onSubmitHandler}
            style={tw`w-full ${
              isLoading ? "bg-gray-400" : "bg-purple-600"
            } rounded-xl px-6 py-4 flex-row justify-center items-center shadow-md`}
            disabled={isLoading} // Disable button when loading
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={tw`mr-2`}
              />
            ) : null}
            <Text style={tw`text-white text-center text-lg font-bold`}>
              {isLoading ? "Processing..." : "Proceed to Deposit"}
            </Text>
          </TouchableOpacity>

          {/* Minimum Amount Info */}
          <Text style={tw`text-center text-xs text-gray-400 mt-4`}>
            Minimum deposit: {globalCurrency === "ngn" ? "₦" : "$"}
            {MIN_DEPOSIT.toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default FundWalletScreen;

// Removed StyleSheet.create({}) as it's not used when using twrnc exclusively.
