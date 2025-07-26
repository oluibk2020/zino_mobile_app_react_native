import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Import Auth Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import OTPVerificationScreen from "../components/OTPVerificationScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";

const Stack = createStackNavigator();

export default function AuthNavigator({ route }) {
  // Receive route props
  // Get the isNewUser parameter passed from RootNavigator
  // Default to true if the parameter is not passed for some reason
  const isNewUser = route?.params?.isNewUser || true;

  // Determine the initial route based on the isNewUser flag
  const initialRouteName = isNewUser ? "Onboarding" : "Login";

  console.log(
    `AuthNavigator initial route: ${initialRouteName} (isNewUser: ${isNewUser})`
  ); // For debugging

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName} // Set the determined initial route
      screenOptions={{ headerShown: false }}
    >
      {/* Order doesn't strictly matter here due to initialRouteName, but logical order helps */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    </Stack.Navigator>
  );
}
