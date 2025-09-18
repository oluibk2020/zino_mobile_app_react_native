import { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView, // Use ScrollView for overall layout
  FlatList, // Use FlatList for rendering the list of services
  StyleSheet, // Can be used for styles not easily achievable with twrnc
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // For token storage
import StoreContext from "../context/storeContext"; // Assuming context path
import tw from "twrnc";
import Toast from "react-native-toast-message";
import _ from "lodash"; // Import lodash for sorting

const ServiceScreen = ({ navigation }) => {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // --- Context and Navigation ---
  const {
    isLoading: contextIsLoading, // Rename to avoid conflict with local loading state
    setIsLoading: setContextIsLoading, // Rename for clarity
    services = [], // Default to empty array
    wallet, // Keep wallet type if needed, otherwise remove
    walletBalance,
    fetchBalance, // Function to refresh balance
    isAuth,
    token,
    setIsLoading,
    getAllServices,
  } = useContext(StoreContext);

  // --- State ---
  const [localIsLoading, setLocalIsLoading] = useState(false); // For payment operation
  const [selectedService, setSelectedService] = useState(null);
  const [hideServicesList, setHideServicesList] = useState(false);
  const [sortedServices, setSortedServices] = useState([]);

  // --- Effects ---

  // Fetch token and balance when the screen comes into focus

  // Sort services whenever the services array from context changes
  useEffect(() => {
    async function loadServices() {
      console.log("running feom service screen");
      try {
        if (services.length > 0) return;
        setIsLoading(true);
        await fetchBalance(wallet); //fetch balance
        await getAllServices(); //get services
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error loading services",
          text2: "Check your internet connection.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadServices(); //load services

    if (services && services.length > 0) {
      const sorted = _.orderBy(services, ["id"], ["asc"]);
      setSortedServices(sorted);
    } else {
      setSortedServices([]); // Clear if services are empty/null
    }
  }, [services]);

  // --- Handlers ---

  const handleSelectService = (service) => {
    setSelectedService(service);
    setHideServicesList(true); // Show the confirmation view
  };

  const handleCancelSelection = () => {
    setSelectedService(null);
    setHideServicesList(false); // Go back to the list view
  };

  // Function to make the API call to pay for the service
  const payService = async (serviceId) => {
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Authentication Error",
        text2: "Cannot proceed without login.",
      });
      return false; // Indicate failure
    }
    if (!API_URL) {
      console.error("API_URL is not configured!");
      Toast.show({
        type: "error",
        text1: "Configuration Error",
        text2: "Service endpoint not set.",
      });
      return false;
    }

    setLocalIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/services/pay`, {
        method: "POST", //POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //your token
        },
        body: JSON.stringify({ wallet, serviceId }), // Send serviceId in body
      });

      const data = await response.json();

      if (response.ok) {
        // Use response.ok (checks for 2xx status codes)
        Toast.show({
          type: "success",
          text1: "Payment Successful",
          text2: data.msg || "Service purchased successfully.", // Use message from API or default
        });
        await fetchBalance(); // Refresh balance after successful payment
        navigation.navigate("WalletMain"); // Navigate to Main Wallet screen on success
        return true; // Indicate success
      } else {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
          text2: data.msg || `Error: ${response.status}`, // Show API error or status
        });
        return false; // Indicate failure
      }
    } catch (error) {
      console.error("Pay Service API Error:", error);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Could not connect to the server. Please try again.",
      });
      return false; // Indicate failure
    } finally {
      setLocalIsLoading(false);
    }
  };

  // Handler for the final "Pay" button press
  const onSubmitPayment = async () => {
    if (!selectedService) return; // Should not happen if button is visible, but good practice

    // Balance Check

    const serviceAmount = Number(
      wallet === "ngn" ? selectedService.amount : selectedService.usdPrice
    );
    const currentBalance = Number(walletBalance);

    if (isNaN(serviceAmount) || isNaN(currentBalance)) {
      Toast.show({
        type: "error",
        text1: "Invalid Data",
        text2: "Cannot verify balance or service cost.",
      });
      return;
    }

    if (currentBalance < serviceAmount) {
      // funding the wallet if balance is insufficient
      Alert.alert(
        "Insufficient Balance",
        `Your current balance is ₦${currentBalance.toLocaleString()}, but this service costs ₦${serviceAmount.toLocaleString()}. Would you like to fund your wallet?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Fund Wallet",
            onPress: () => navigation.navigate("FundWallet"),
          }, // Navigate to Fund Wallet screen
        ]
      );
      return;
    }

    // Proceed with payment API call
    await payService(selectedService.id);
    // Navigation happens inside payService on success
  };

  // --- Render Logic ---

  // Show main loading indicator if context is loading or services haven't loaded
  if (contextIsLoading && sortedServices.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={tw`mt-3 text-gray-600`}>Loading Services...</Text>
      </View>
    );
  }

  // Show message if no services are available after loading
  if (!contextIsLoading && sortedServices.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-100 p-4`}>
        <Text style={tw`text-lg text-gray-600 text-center`}>
          No services currently available.
        </Text>
      </View>
    );
  }

  // Render Service Item for FlatList
  const renderServiceItem = ({ item }) => (
    <View
      style={tw`bg-white rounded-lg shadow-md p-4 mb-4 mx-4 border border-gray-200`}
    >
      <Text style={tw`text-xl font-bold text-gray-800`}>{item.name}</Text>
      <Text style={tw`text-gray-600 my-2`}>{item.description}</Text>
      <Text style={tw`text-lg font-semibold text-purple-600 mb-3`}>
        {wallet === "ngn"
          ? `₦${Number(item.amount).toLocaleString()} NGN`
          : `$${Number(item.usdPrice).toLocaleString()} USD`}
      </Text>
      <TouchableOpacity
        onPress={() => handleSelectService(item)}
        style={tw`bg-yellow-600 rounded-lg px-4 py-2 self-start`} // Button takes needed width
      >
        <Text style={tw`text-white font-medium text-center`}>Select</Text>
      </TouchableOpacity>
    </View>
  );

  // Main Return
  return (
    <View
      style={tw`flex-1 bg-gray-100 mb-14`}
      contentContainerStyle={tw`flex-grow py-6`} // Add padding top/bottom
    >
      {!hideServicesList ? (
        // --- Services List View ---
        <View style={tw`bg-gray-100 mb-14 mt-4`}>
          <Text
            style={tw`text-2xl font-bold text-center text-gray-800 mb-2 px-4`}
          >
            Available Services
          </Text>
          <Text style={tw`text-base text-gray-500 text-center mb-6 px-4`}>
            Select a service to pay from your wallet.
          </Text>
          <FlatList
            data={sortedServices}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={tw`flex-1 justify-center items-center mt-10`}>
                <Text style={tw`text-gray-500`}>No services found.</Text>
              </View>
            }
          />
        </View>
      ) : selectedService ? (
        <View
          style={tw`p-6 bg-white rounded-xl shadow-lg m-4 border border-gray-200`}
        >
          <Text style={tw`text-2xl font-bold text-center text-gray-800 mb-4`}>
            Confirm Payment
          </Text>
          <Text style={tw`text-lg text-center text-gray-700 mb-2`}>
            You are about to pay for:
          </Text>
          <Text
            style={tw`text-xl font-semibold text-center text-purple-700 mb-5`}
          >
            {selectedService.name}
          </Text>

          <View style={tw`border-t border-b border-gray-200 py-4 my-4`}>
            <View style={tw`flex-row justify-between items-center mb-2 px-2`}>
              <Text style={tw`text-base text-gray-600`}>Service Cost:</Text>
              <Text style={tw`text-base font-semibold text-gray-800`}>
                {wallet === "ngn"
                  ? `₦${Number(selectedService.amount).toLocaleString()} NGN`
                  : `$${Number(selectedService.usdPrice).toLocaleString()} USD`}
              </Text>
            </View>
            <View style={tw`flex-row justify-between items-center px-2`}>
              <Text style={tw`text-base text-gray-600`}>Your Balance:</Text>
              <Text
                style={tw`text-base font-semibold ${
                  Number(walletBalance) <
                  Number(
                    wallet === "ngn"
                      ? selectedService.amount
                      : selectedService.usdPrice
                  )
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {wallet === "ngn" ? `₦` : `$`}
                {Number(walletBalance).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Conditional Warning for insufficient balance */}
          {Number(walletBalance) <
            Number(
              wallet === "ngn"
                ? selectedService.amount
                : selectedService.usdPrice
            ) && (
            <Text style={tw`text-red-600 text-center text-sm mb-4`}>
              Insufficient balance to purchase this service.
            </Text>
          )}

          {/* Pay Button */}
          <TouchableOpacity
            onPress={onSubmitPayment}
            style={tw`w-full ${
              localIsLoading ||
              Number(walletBalance) <
                Number(
                  wallet === "ngn"
                    ? selectedService.amount
                    : selectedService.usdPrice
                )
                ? "bg-purple-600"
                : "bg-green-600"
            } rounded-xl px-6 py-3 flex-row justify-center items-center shadow-md mb-3`}
            disabled={localIsLoading}
          >
            {localIsLoading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={tw`mr-2`}
              />
            ) : null}
            <Text style={tw`text-white text-center text-lg font-bold`}>
              {localIsLoading ? "Processing..." : "Pay Now"}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleCancelSelection}
            style={tw`w-full bg-gray-200 rounded-xl px-6 py-3 flex-row justify-center items-center`}
            disabled={localIsLoading}
          >
            <Text style={tw`text-gray-700 text-center text-lg font-bold`}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default ServiceScreen;

// Optional: Define specific styles if needed
// const styles = StyleSheet.create({
//   card: {
//     // Example: Add elevation for Android shadow if needed
//     elevation: 3,
//   },
// });
