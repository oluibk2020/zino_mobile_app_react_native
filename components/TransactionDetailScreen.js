import { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRoute } from "@react-navigation/native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import Spinner from "../layout/Spinner";
import StoreContext from "../context/storeContext";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
const TransactionDetailScreen = ({ navigation }) => {
  const {
    isLoading,
    setIsLoading,
    transaction,
    paymentLink,
    fetchOneTransaction,
    createPaymentInvoice,
    setPaymentLink,
  } = useContext(StoreContext);

  const route = useRoute();
  //get course id from params
  const { transactionId } = route.params;
  const [expectedRedirectUrl, setExpectedRedirectUrl] = useState(
    "https://portal.charisintelligence.com.ng"
  );
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);

  //check if transaction is empty
  const isEmpty = Object.keys(transaction).length === 0;

  //check if date exceeded one hour
  const targetDate = new Date(transaction.createdAt);
  const currentDate = new Date();
  const oneHourInMilliseconds = 1000 * 60 * 60; // Milliseconds in 1 hour

  // Calculate the difference in milliseconds between current and target date
  const timeDifference = currentDate.getTime() - targetDate.getTime();

  // Inside TransactionDetailScreen
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when the screen is unfocused (user navigates away)
        setPaymentLink("");
      };
    }, [])
  );

  useEffect(() => {
    //fetch account activities automatically
    async function runAtStartUp() {
      setIsLoading(true);

      await fetchOneTransaction(transactionId);
      setIsLoading(false);
    }

    runAtStartUp();
    setIsLoading(false);
  }, []);

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

  //pay invoice
  async function payNow() {
    try {
      setIsLoading(true);
      if (!isEmpty && transaction.status === "processing") {
        await createPaymentInvoice(transaction.id); //generate payment link
      }
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  }

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

  if (isLoading || isEmpty) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#00D09C" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={tw`px-5 py-4`}>
      <Text style={tw`text-xl font-bold text-center text-[#00D09C] mb-1`}>
        Transaction Details
      </Text>
      <Text style={tw`text-center text-gray-500 mb-5`}>
        See the details about this transaction
      </Text>

      <View style={tw`bg-gray-100 rounded-2xl p-5 mb-5`}>
        {renderItem("Reference ID", transaction.reference)}
        {renderItem(
          "Amount",
          `${
            transaction.currency === "ngn"
              ? `₦${Number(transaction.amount).toLocaleString()} NGN`
              : `$${Number(transaction.amount).toLocaleString()} USD`
          }`
        )}
        {renderItem(
          "Fees",
          `${
            transaction.currency === "ngn"
              ? `₦${Number(
                  transaction.totalAmount - transaction.amount
                ).toLocaleString()} NGN`
              : `$${Number(
                  transaction.totalAmount - transaction.amount
                ).toLocaleString()} USD`
          }`
        )}
        {renderItem(
          "Total Amount",
          `${
            transaction.currency === "ngn"
              ? `₦${Number(transaction.totalAmount).toLocaleString()} NGN`
              : `$${Number(transaction.totalAmount).toLocaleString()} USD`
          }`
        )}
        {renderItem("Details", transaction.otherDetails)}
        {transaction.sessionId &&
          renderItem("Session ID", transaction.sessionId)}
        {renderItem("Transaction Type", transaction.type)}
        {renderItem(
          "Date Of Transaction",
          new Date(transaction.createdAt).toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
          })
        )}
        {renderItem(
          "Transaction Status",
          transaction.status,
          transaction.status === "failed"
            ? tw`text-red-600`
            : tw`text-green-600`
        )}
        {renderItem(
          "Last Updated",
          new Date(transaction.updatedAt).toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
          })
        )}
      </View>

      <View style={tw`flex-row justify-between`}>
        <TouchableOpacity
          style={tw`bg-gray-900 rounded-xl py-3 px-4 flex-1 mr-2`}
          onPress={() => navigation.replace("Transactions")}
        >
          <Text style={tw`text-white text-center font-semibold`}>
            Back to Transactions
          </Text>
        </TouchableOpacity>

        {transaction.currency === "ngn" &&transaction.status === "processing" &&
        transaction.type === "deposit" &&
        timeDifference < oneHourInMilliseconds ? (
          <TouchableOpacity
            style={tw`bg-[#00D09C] rounded-xl py-3 px-4 flex-1 ml-2`}
            onPress={payNow}
          >
            <Text style={tw`text-black text-center font-semibold`}>
              Deposit Now
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Toast />
    </ScrollView>
  );
};

const renderItem = (label, value, valueStyle = {}) => (
  <View style={tw`mb-4`}>
    <Text style={tw`text-gray-700 font-medium`}>{label}</Text>
    <Text style={[tw`mt-1 text-base font-semibold text-black`, valueStyle]}>
      {value}
    </Text>
  </View>
);

export default TransactionDetailScreen;
const styles = StyleSheet.create({});
