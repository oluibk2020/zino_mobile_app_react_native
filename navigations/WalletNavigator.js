import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import WalletScreen from "../screens/WalletScreen";
import TransactionScreen from "../screens/TransactionScreen";
import TransactionDetailScreen from "../components/TransactionDetailScreen"; // Adjust path
import FundWalletScreen from "../screens/FundWalletScreen";
import ServiceScreen from "../screens/ServiceScreen"; // Assuming Services fits here

const Stack = createStackNavigator();

export default function WalletNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="WalletMain" // Different name
        component={WalletScreen}
        options={{ title: "My Wallet" }}
      />
      <Stack.Screen
        name="Transactions"
        component={TransactionScreen}
        options={{ title: "Transaction History" }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ title: "Transaction Details" }}
      />
      <Stack.Screen
        name="FundWallet"
        component={FundWalletScreen}
        options={{ title: "Fund Wallet" }}
      />
      <Stack.Screen
        name="Services" // Include Services here
        component={ServiceScreen} // Use the correct screen component name (PayServicesScreen?)
        options={{ title: "Pay for Services" }}
      />
    </Stack.Navigator>
  );
}
