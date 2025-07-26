import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import StoreContext from "../context/storeContext";
import tw from "twrnc";

const TransactionScreen = ({ currency }) => {
  const navigation = useNavigation();
  const {
    isLoading,
    setIsLoading,
    fetchTransactions,
    fetchBalance,
    transactions,
    setPaymentLink,
  } = useContext(StoreContext);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // fetch data
    setIsLoading(true);
    const [result1, result2] = await Promise.all([
      fetchBalance(currency),
      fetchTransactions(currency),
    ]);
    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadTransactions = async () => {
      try {
        setIsLoading(true);
        await fetchTransactions(currency); // This should ideally NOT trigger re-renders if same data
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    //fetch transactions
    loadTransactions();
    //set loading to false
    setIsLoading(false);

    return () => {
      isMounted = false;
    };
  }, [currency]);

  const sortedTransactions = [...transactions].sort((a, b) => b.id - a.id);

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const renderTransaction = ({ item }) => {
    const formattedDate = new Date(item.updatedAt).toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={tw`bg-white rounded-md shadow-md p-4 mb-3 border border-gray-200`}
      >
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <View>
            <Text style={tw`text-sm text-gray-600`}>{formattedDate}</Text>
          </View>
          <View
            style={tw`px-2 py-1 rounded-full ${
              item.status === "failed" ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <Text
              style={tw`text-xs font-semibold ${
                item.status === "failed" ? "text-red-600" : "text-green-600"
              }`}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={tw`mb-2`}>
          <Text style={tw`text-lg font-semibold text-gray-800 capitalize`}>
            {item.description || item.type || "Transaction"}
          </Text>
          <Text style={tw`text-xl font-bold text-gray-900`}>
            {item.currency === null || item.currency === "ngn"
              ? "₦"
              : item.currency === "usd"
              ? "$"
              : item.currency}
            {""}
            {Number(item.totalAmount).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("TransactionDetail", { transactionId: item.id })
          }
          style={tw`mt-2 bg-purple-500 rounded-md overflow-hidden`}
        >
          <View style={tw`px-4 py-2`}>
            <Text style={tw`text-white text-sm font-medium`}>View Details</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 px-4 py-6`}>
      <Text style={tw`text-xl font-bold mb-4 text-black`}>
        Your Transaction History
      </Text>

      {sortedTransactions.length === 0 ? (
        <Text style={tw`text-gray-500 text-center mt-10`}>
          No transactions found.
        </Text>
      ) : (
        <FlatList
          initialNumToRender={7}
          maxToRenderPerBatch={7}
          windowSize={7}
          removeClippedSubviews={true}
          data={sortedTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

export default TransactionScreen;
