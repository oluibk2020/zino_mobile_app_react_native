import React, { useState, useEffect, useContext } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
// No need for AsyncStorage here if context manages auth state reliably
import StoreContext from "../context/storeContext"; // Adjust path

// Import the main navigators
import AuthNavigator from "./AuthNavigator";
import AppTabNavigator from "./AppTabNavigator";

const Stack = createStackNavigator();

export default function RootNavigator({props}) {
  // Get isAuth AND newUser from context
  const { isAuth, newUser, globalNotificationData, setGlobalNotificationData } =
    useContext(StoreContext);

if (props !== null) {
  useEffect(() => {
    console.log("setting globalNotificationData from root navigator",props.body);
    setGlobalNotificationData({title: props.title, body: props.body, screenTab: props.screenTab, screenName: props.screenName});
  }, [props])
}

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuth ? (
        // User is signed in, show main app tabs
        <Stack.Screen name="AppTabs" component={AppTabNavigator} />
      ) : (
        // User is not signed in, show auth flow
        // Pass the newUser flag from context as an initial parameter
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          initialParams={{ isNewUser: newUser }} // Pass newUser flag
        />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF", // Or a splash screen background
  },
});
