import React, { useState, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import RegisterScreen from "./screens/RegisterScreen";
import LogOutScreen from "./screens/LogOutScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import OTPVerificationScreen from "./components/OTPVerificationScreen";
import DashboardScreen from "./screens/DashboardScreen";
import CourseScreen from "./screens/CourseScreen";
import CourseDetailScreen from "./components/CourseDetailScreen";
import EnrolledCourseDetailScreen from "./components/EnrolledCourseDetailScreen";
import EnrolledCourseScreen from "./screens/EnrolledCourseScreen";
import WalletScreen from "./screens/WalletScreen";
import TransactionScreen from "./screens/TransactionScreen";
import TransactionDetailScreen from "./components/TransactionDetailScreen";

import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import StoreContext from "./context/storeContext";
import FundWalletScreen from "./screens/FundWalletScreen";
import ServiceScreen from "./screens/ServiceScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  const { isAuth, newUser } = useContext(StoreContext);

  useEffect(() => {
    // Function to check login status
    const checkLoginStatus = async () => {
      //check if isAuth is true
      if (!isAuth) {
        // Redirect to login screen or refresh token
        setInitialRoute(newUser ? "Onboarding" : "Login");
      } else {
        setInitialRoute("Dashboard");
      }
    };

    // Check login status when the component mounts
    checkLoginStatus();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Courses"
        component={CourseScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="EnrolledCourses"
        component={EnrolledCourseScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="EnrolledCourseDetail"
        component={EnrolledCourseDetailScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="Transactions"
        component={TransactionScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="FundWallet"
        component={FundWalletScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="Services"
        component={ServiceScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Logout"
        component={LogOutScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
