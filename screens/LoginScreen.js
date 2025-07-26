import { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  ImageBackground,
  StyleSheet,
  StatusBar,
  Button,
} from "react-native";
import tw from "twrnc";
import StoreContext from "../context/storeContext";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// --- Google Auth Youtube ---
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
} from "@react-native-google-signin/google-signin";

// --- Biometric Auth Imports ---
import * as LocalAuthentication from "expo-local-authentication";
// --- End Biometric Auth Imports ---

const LoginScreen = () => {
  const {
    isLoading,
    setIsLoading,
    email,
    setEmail,
    password,
    setPassword,
    isAuth,
    resetEmailAndPassword,
    setIsAuth,
    setToken,
    setNewUser,
    bioLoading,
    setBioLoading,
    BIOMETRIC_ENABLED_KEY,
    isBiometricAvailable,
    setIsBiometricAvailable,
    isBiometricEnabled,
    setIsBiometricEnabled,
    USER_TOKEN_KEY,
    handleLoginSuccess,
    fetchProfile,
    userProfile,
    userToken,
    invalidateLogin,
  } = useContext(StoreContext);

  const navigation = useNavigation();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false); // Separate loading for Google

  // Use environment variables
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME;
  const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID; // For Expo Go/Web

  useEffect(() => {
    if (isAuth) {
      return;
    }
  }, [isAuth]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      profileImageSize: 150,
    });
  }, []);

  // --- Effect to Check Biometric Status ---
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(hasHardware && isEnrolled);

      if (hasHardware && isEnrolled) {
        const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        setIsBiometricEnabled(enabled === "true");
        console.log(
          "Biometric available. Enabled status loaded:",
          enabled === "true"
        );
      } else {
        setIsBiometricEnabled(false); // Ensure disabled if not available
        console.log("Biometrics not available or not enrolled.");
      }
    } catch (error) {
      console.error("Error checking biometric status:", error);
      setIsBiometricAvailable(false);
      setIsBiometricEnabled(false);
    }
  };
  // --- End Biometric Check Effect ---

  // --- Biometric Login Handler ---
  const handleBiometricLogin = async () => {
    // 1. Retrieve token
    const storedToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
    if (
      isLoading ||
      googleLoading ||
      bioLoading ||
      !isBiometricEnabled ||
      !storedToken
    )
      return;

    setBioLoading(true);
    setFormError("");
    console.log("Attempting Biometric Login...");

    try {
      // 1. Authenticate with OS prompt
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Log in using Biometrics",
        cancelLabel: "Cancel",
        disableDeviceFallback: true, // Don't allow device passcode fallback
      });

      if (result.success) {
        console.log("Biometric auth successful.");
        //check if token is expired

        if (storedToken) {
          console.log("Stored token retrieved via Biometrics successfully.");
          // 3. Verify token with backend here if needed
          const response = await fetch(`${API_URL}/profile`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedToken}`,
            },
          });
          const data = await response.json();

          if (response.ok) {
            await handleLoginSuccess(storedToken); // Use common handler
          } else {
            console.error("Stored token is invalid");
            setFormError("Token is expired. Please log in again.");
            await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY); // Clear flag as state is inconsistent
            setIsBiometricEnabled(false);
            setBioLoading(false);
            invalidateLogin("Your session has expired. Please login again.");
          }
        } else {
          console.warn("Biometric success, but no token found.");
          setFormError("Login data not found. Please log in normally.");
          await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY); // Clear flag as state is inconsistent
          setIsBiometricEnabled(false);
          setBioLoading(false);
        }
      } else {
        console.log(
          "Biometric authentication failed or cancelled:",
          result.error
        );
        if (
          result.error !== "user_cancel" &&
          result.error !== "system_cancel"
        ) {
          // Optionally show a toast only for actual failures, not cancellations
          Toast.show({
            type: "error",
            text1: "Biometric Failed",
            text2: "Could not authenticate.",
          });
        }
        setBioLoading(false);
      }
    } catch (error) {
      console.error("Error during biometric login:", error);
      setFormError("Your session has expired. Please login again.");
      setBioLoading(false);
      // Clean up potentially inconsistent state
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(false);
    }
    // Loading state is reset within handleLoginSuccess on success, or here on failure/cancellation
  };
  // --- End Biometric Login Handler ---

  // --- Function to handle sending Google token to backend ---
  async function handleGoogleSignInSuccess(idToken) {
    setGoogleLoading(true); // Use google specific loading
    setFormError("");

    try {
      const backendResponse = await fetch(`${API_URL}/auth/google`, {
        // Adjust endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await backendResponse.json();
      console.log("Backend Google Sign-In Status:", backendResponse.status);

      if (backendResponse.ok && data.access_token) {
        // Expecting your backend token
        // --- Success ---
        console.log("Backend verification successful. Storing app token.");

        await handleLoginSuccess(data.access_token); // Use common handler

        //  resetEmailAndPassword(); // Clear any typed email/password
        setGoogleLoading(false);

        console.log("Google Sign-In Complete. Navigate user.");
      } else {
        // --- Backend Error ---
        const errorMessage =
          data?.message || data?.msg || "Backend verification failed.";
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage || "Login failed!",
        });
        setGoogleLoading(false);
        await AsyncStorage.removeItem("userToken"); // Clear any old token
        setIsAuth(false);
      }
    } catch (error) {
      // --- Network/Fetch Error ---
      console.error("Backend Google Sign-In Network/Fetch Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error || "Login failed!",
      });
      setGoogleLoading(false);
      await AsyncStorage.removeItem("userToken"); // Clear any old token
      setIsAuth(false);
    }
  }
  // --- End Backend Function ---

  async function handleGoogleSignin() {
    try {
      await GoogleSignin.hasPlayServices();

      const res = await GoogleSignin.signInSilently();
      if (isSuccessResponse(res)) {
        const { user, idToken } = res.data;
        await handleGoogleSignInSuccess(idToken);
        setEmail(user.email);
      } else if (isNoSavedCredentialFoundResponse(res)) {
        // user has not signed in yet, or they have revoked access
        const response = await GoogleSignin.signIn();

        if (isSuccessResponse(response)) {
          const { user } = response.data;
          const { name, email, picture } = user;
          //  console.log(isToken, email, name, picture);
          const tokenData = await GoogleSignin.getTokens(); //get token
          const { idToken } = tokenData; //destructure token
          await handleGoogleSignInSuccess(idToken);
          setEmail(email);
        } else {
          const errorMessage =
            response.type === "cancelled"
              ? "Google Sign In Cancelled"
              : "Google Sign In failed.";

          Alert.alert("Login Error", errorMessage);
          setGoogleLoading(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  // --- Google Sign-In Button Press Handler ---
  const handleGoogleButtonPress = async () => {
    setFormError(""); // Clear previous errors
    setGoogleLoading(true); // Show google loading indicator

    handleGoogleSignin();
  };
  // --- End Google Handler ---

  async function loginUser() {
    try {
      setIsLoading(true);
      setFormError("");
      const response = await fetch(`${API_URL}/auth/login-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();
      console.log("Login Response Status:", response.status);
      console.log("Login Response Data:", data);

      if (response.status === 200) {
        console.log("got here");
        navigation.replace("OTPVerification");
        setIsLoading(false);
        return;
      } else {
        const errorMessage = data?.message || "Invalid email or password.";
        setFormError(errorMessage);
        resetEmailAndPassword();
        setIsLoading(false);
      }

      setIsLoading(false);
      setGoogleLoading(false);
      setBioLoading(false);
    } catch (error) {
      console.error("Login Network/Fetch Error:", error);
      setFormError(
        "Network error. Please check your connection and try again."
      );
      setIsLoading(false);
      setGoogleLoading(false);
      setBioLoading(false);
    }
  }

  const handleEmailChange = (text) => {
    setEmail(text);
    if (formError) setFormError("");
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (formError) setFormError("");
  };

  const loginHandler = () => {
    if (isLoading || googleLoading || bioLoading) return;
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) {
      setFormError("Please enter both email and password.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    loginUser();
  };

  // Combined loading state
  const isAnyLoading = isLoading || googleLoading || bioLoading;

  return (
    // Wrap everything in the linear gradient
    <LinearGradient
      colors={["#6D28D9", "#009eff", "#F59E0B"]}
      style={styles.rootScreen}
    >
      {/* Set status bar style based on background */}
      <StatusBar
        barStyle={Platform.OS === "ios" ? "light-content" : "light-content"}
      />
      {/* KeyboardAvoidingView handles keyboard overlap */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center`}
          style={tw`flex-1 bg-transparent`}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={tw`p-6 md:p-8`}>
              {/* App Name */}
              <View style={tw`items-center mb-6`}>
                <Text style={tw`text-white text-4xl font-bold opacity-90`}>
                  {APP_NAME}
                </Text>
              </View>

              {/* Card */}
              <View
                style={tw`bg-white/95 rounded-2xl p-6 shadow-xl w-full max-w-md mx-auto`}
              >
                {/* Header */}
                <Text
                  style={tw`text-center text-3xl font-extrabold text-gray-900 mb-2`}
                >
                  Let's Go!
                </Text>
                <Text style={tw`text-center text-base text-gray-600 mb-8`}>
                  Enter your details or sign in.
                </Text>

                {/* Email Input */}
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-gray-700 mb-1 ml-1`}>
                    Email Address
                  </Text>
                  <TextInput
                    style={tw`w-full p-3 border ${
                      formError && !password && !isAnyLoading
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-gray-50 rounded-lg text-base text-gray-900 ${
                      isAnyLoading ? "opacity-50" : ""
                    }`}
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isAnyLoading}
                  />
                </View>

                {/* Password Input */}
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-gray-700 mb-1 ml-1`}>
                    Password
                  </Text>
                  <View
                    style={tw`flex-row items-center border ${
                      formError && !email && !isAnyLoading
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-gray-50 rounded-lg pr-2 ${
                      isAnyLoading ? "opacity-50" : ""
                    }`}
                  >
                    <TextInput
                      style={tw`flex-1 p-3 text-base text-gray-900`}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={handlePasswordChange}
                      secureTextEntry={!isPasswordVisible}
                      editable={!isAnyLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      disabled={isAnyLoading}
                      style={tw`p-2`}
                    >
                      <Ionicons
                        name={
                          isPasswordVisible ? "eye-off-outline" : "eye-outline"
                        }
                        size={24}
                        color={tw.color("gray-500")}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inline Error Message */}
                {formError ? (
                  <Text style={tw`text-red-500 text-sm text-center mb-4`}>
                    {formError}
                  </Text>
                ) : (
                  <View style={tw`mb-4 h-5`} />
                )}

                {/* Email Login Button */}
                <TouchableOpacity
                  style={tw`w-full ${
                    isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                  } p-3.5 rounded-lg shadow-md flex-row justify-center items-center mb-4 ${
                    googleLoading || bioLoading ? "opacity-50" : ""
                  }`}
                  onPress={loginHandler}
                  disabled={isAnyLoading}
                >
                  {isLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                      style={tw`mr-2`}
                    />
                  )}
                  <Text
                    style={tw`text-white text-center text-base font-semibold`}
                  >
                    {isLoading ? "Processing..." : "Log In"}
                  </Text>
                </TouchableOpacity>

                {/* OR Separator */}
                <View style={tw`flex-row items-center my-2`}>
                  <View style={tw`flex-1 h-px bg-gray-300`} />
                  <Text style={tw`mx-4 text-gray-500 font-medium`}>OR</Text>
                  <View style={tw`flex-1 h-px bg-gray-300`} />
                </View>

                {/* Google Sign-In Button */}
                <TouchableOpacity
                  style={tw`w-full ${
                    googleLoading
                      ? "bg-gray-300"
                      : "bg-white border border-gray-300 hover:bg-gray-100"
                  } p-3.5 rounded-lg shadow-md flex-row justify-center items-center mb-4 ${
                    isLoading || bioLoading ? "opacity-50" : ""
                  }`}
                  onPress={handleGoogleButtonPress}
                  disabled={isAnyLoading}
                >
                  {googleLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={tw.color("gray-700")}
                      style={tw`mr-3`}
                    />
                  ) : (
                    <Ionicons
                      name="logo-google"
                      size={20}
                      color={tw.color("gray-700")}
                      style={tw`mr-3`}
                    />
                  )}
                  <Text
                    style={tw`text-gray-700 text-center text-base font-semibold`}
                  >
                    {googleLoading ? "Signing In..." : "Sign In with Google"}
                  </Text>
                </TouchableOpacity>

                {/* --- Biometric Login Button (Conditionally Rendered) --- */}
                {isBiometricAvailable && isBiometricEnabled && (
                  <TouchableOpacity
                    style={tw`w-full ${
                      bioLoading
                        ? "bg-purple-300"
                        : "bg-purple-600 hover:bg-purple-700"
                    } p-3.5 rounded-lg shadow-md flex-row justify-center items-center mb-4 ${
                      isLoading || googleLoading ? "opacity-50" : ""
                    }`}
                    onPress={handleBiometricLogin}
                    disabled={isAnyLoading}
                  >
                    {bioLoading ? (
                      <ActivityIndicator
                        size="small"
                        color="#ffffff"
                        style={tw`mr-3`}
                      />
                    ) : (
                      <Ionicons
                        name="finger-print"
                        size={24}
                        color="white"
                        style={tw`mr-3`}
                      />
                    )}
                    <Text
                      style={tw`text-white text-center text-base font-semibold`}
                    >
                      {bioLoading
                        ? "Authenticating..."
                        : "Login with Biometrics"}
                    </Text>
                  </TouchableOpacity>
                )}
                {/* --- End Biometric Login Button --- */}

                {/* Links */}
                <View
                  style={tw`mt-6 flex-row justify-center ${
                    isAnyLoading ? "opacity-50" : ""
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Register")}
                    disabled={isAnyLoading}
                  >
                    <Text
                      style={tw`text-blue-600 text-sm font-medium hover:text-blue-500`}
                    >
                      Don't have an account? Register
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={tw`mt-4 flex-row justify-center ${
                    isAnyLoading ? "opacity-50" : ""
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                    disabled={isAnyLoading}
                  >
                    <Text
                      style={tw`text-red-600 text-sm font-medium hover:text-red-500`}
                    >
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* End of Card */}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient> // End of BaseViewComponent wrapper
  );
};

// --- OPTION B: Styles for Image Background Overlay ---
const styles = StyleSheet.create({
  overlay: {
    // Adjust color and opacity (last value: 0 = transparent, 1 = opaque)
    backgroundColor: "rgba(0, 0, 0, 0.35)", // Example: Dark overlay with 35% opacity
  },
  rootScreen: {
    flex: 1, //fixes height to full device height
  },
});

export default LoginScreen;
