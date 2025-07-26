import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import StoreContext from "../context/storeContext";
import TransactionScreen from "./TransactionScreen";
import tw from "twrnc";

const WalletScreen = ({ navigation }) => {
  const {
    isLoading,
    setIsLoading,
    walletBalance,
    fetchBalance,
    wallet,
    setWallet,
    userProfile,
    fetchProfile,
    fetchTransactions,
    setPaymentLink,
    paymentLink,
    setUserCountry
  } = useContext(StoreContext);

  const country = userProfile?.country;
  const isProfileEmpty = Object.keys(userProfile).length === 0;

  useEffect(() => {
    async function runAtStartup() {
      try {
        setIsLoading(true);
        await fetchProfile();
        await fetchBalance(wallet);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error loading wallet",
          text2: "Check your internet connection.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    runAtStartup();
    setIsLoading(false);
  }, [wallet, country]);

  const handleWalletChange = (selected) => {
    //set wallet to selected currency
    setWallet(selected);
    setUserCountry(selected);
    //fetch transactions
    setIsLoading(false);
  };

  if (isLoading || walletBalance === "" || isProfileEmpty) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 px-4 py-6`}>
      <Text style={tw`text-base text-black mb-2`}>Select a Wallet</Text>
      <View style={tw`flex-row items-center mb-5`}>
        <Image
          source={{
            uri:
              wallet === "usd"
                ? "https://cdn.britannica.com/33/4833-004-828A9A84/Flag-United-States-of-America.jpg"
                : "https://www.nigerianembassy.co.il/wp-content/uploads/2019/04/flag-500x302.jpg",
          }}
          style={tw`w-10 h-10 rounded-full mr-2`}
        />
        <Picker
          selectedValue={wallet}
          style={tw`w-32 h-15 bg-white rounded`}
          onValueChange={handleWalletChange}
        >
          <Picker.Item label="NGN" value="ngn" />
          <Picker.Item label="USD" value="usd" />
        </Picker>
      </View>

      <View
        style={tw`bg-white p-4 rounded-xl shadow flex-row justify-between items-center mb-6`}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-gray-100 p-2 rounded-full mr-3`}>
            <Text style={tw`text-lg`}>💼</Text>
          </View>
          <View>
            <Text style={tw`text-sm text-gray-500`}>Wallet Balance</Text>
            <Text style={tw`text-2xl font-bold text-gray-900`}>
              {wallet === "ngn"
                ? `₦${Number(walletBalance).toLocaleString()} NGN`
                : `$${Number(walletBalance).toLocaleString()} USD`}
            </Text>
          </View>
        </View>
      </View>

    
        <View style={tw`flex-row justify-start mb-6`}>
          <TouchableOpacity
            style={tw`bg-yellow-600 px-4 py-2 rounded-lg mr-3`}
            onPress={() => navigation.navigate("FundWallet")}
          >
            <Text style={tw`text-white text-sm`}>Fund Wallet 💰</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-purple-600 px-4 py-2 rounded-lg`}
            onPress={() => navigation.navigate("Services")}
          >
            <Text style={tw`text-white text-sm`}>Pay For Services 📤</Text>
          </TouchableOpacity>
        </View>

   

      <TransactionScreen currency={wallet} />
    </View>
  );
};

export default WalletScreen;
