import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import StoreContext from "../context/storeContext"; // Adjust path if needed
import Toast from "react-native-toast-message";
import tw from "twrnc";

// API_URL 
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Define the stages for the screen flow
const STAGES = {
  REQUEST_OTP: "REQUEST_OTP",
  VERIFY_OTP: "VERIFY_OTP",
};

const ResetPasswordScreen = ({navigation}) => {
  // --- Context and Navigation ---
  // Using a single isLoading from context for simplicity, manage stages locally
  const { isLoading, setIsLoading , isAuth} = useContext(StoreContext);

  useEffect(() => {
      if (isAuth) {
        return
      }
    }, [isAuth, navigation]);

  // --- State ---
  const [stage, setStage] = useState(STAGES.REQUEST_OTP); // Initial stage

  // Request Stage State
  const [email, setEmail] = useState("");

  // Verification Stage State
  const [submittedEmail, setSubmittedEmail] = useState(""); // Store email after successful OTP request
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- API Call Handlers ---

  // 1. Request OTP API Call
  const handleRequestOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      // Basic email format check
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address.",
      });
      return;
    }
    if (!API_URL) {
      console.error("API_URL is not configured!");
      Toast.show({
        type: "error",
        text1: "Configuration Error",
        text2: "Cannot connect to server.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset/password-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Code Sent!",
          text2: data.msg || `OTP sent successfully to ${email}`,
        });
        setSubmittedEmail(email); // Store the email for the next step
        setStage(STAGES.VERIFY_OTP); // Move to the verification stage
      } else {
        Toast.show({
          type: "error",
          text1: "Request Failed",
          text2: data.msg || "Could not send OTP. Check email or try again.",
        });
        setEmail(""); // Clear email on failure? Optional.
      }
    } catch (error) {
      console.error("Request OTP Network/Fetch Error:", error);
      Alert.alert(
        "Network Error",
        "Could not connect. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP and Reset Password API Call
  const handleVerifyAndReset = async () => {
    // Basic Frontend Validations for verification stage
    if (!submittedEmail) {
      // Should have been set in previous step
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Email reference lost. Please start over.",
      });
      setStage(STAGES.REQUEST_OTP); // Go back to request stage
      return;
    }
    if (otp.length !== 5 || !/^\d+$/.test(otp)) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter the 5-digit code.",
      });
      return;
    }
    if (password.length < 8) {
      Toast.show({
        type: "error",
        text1: "Password Too Short",
        text2: "Password must be at least 8 characters.",
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Passwords Mismatch",
        text2: "The entered passwords do not match.",
      });
      return;
    }
    if (!API_URL) {
      console.error("API_URL is not configured!");
      Toast.show({
        type: "error",
        text1: "Configuration Error",
        text2: "Cannot connect to server.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: submittedEmail, // Use the stored email
          newPassword: password,
          token: otp, // OTP is the token
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Reset JSON Parsing Error:", jsonError);
        Toast.show({
          type: "error",
          text1: "Server Error",
          text2: `Received non-JSON response (Status: ${response.status})`,
        });
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success!",
          text2: data.message || "Password reset successfully!",
        });
        // Clear state and navigate to Login
        setEmail("");
        setSubmittedEmail("");
        setOtp("");
        setPassword("");
        setConfirmPassword("");
        setStage(STAGES.REQUEST_OTP); // Reset stage for next time
        navigation.navigate("Login");
      } else {
        let errorMessage =
          data.message || "Password reset failed. Check OTP or try again.";
        if (Array.isArray(data)) {
          errorMessage = data.map((err) => err.message).join("\n");
        } else if (typeof data === "object" && data && data.message) {
          errorMessage = data.message;
        }
        Toast.show({
          type: "error",
          text1: "Reset Failed",
          text2: errorMessage,
        });
        // Clear sensitive fields on error
        setOtp("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Reset Password Network/Fetch Error:", error);
      Alert.alert("Network Error", "Could not connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to go back to the email request stage
  const handleBackToRequest = () => {
    setEmail(submittedEmail); // Pre-fill email field
    setSubmittedEmail("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setStage(STAGES.REQUEST_OTP);
  };

  // --- Render Logic ---

  // Render Email Request Form
  const renderRequestForm = () => (
    <View
      style={tw`w-full max-w-md bg-white/20 rounded-2xl p-6 shadow-lg backdrop-blur-lg`}
    >
      <Text style={tw`text-white text-center text-3xl font-bold mb-2`}>
        Forgot Password?
      </Text>
      <Text style={tw`text-white/80 text-center text-base mb-8`}>
        Enter your email below to receive a reset code.
      </Text>

      {/* Email Input */}
      <View style={tw`mb-8`}>
        <Text style={styles.label}>Your Email Address</Text>
        <View style={[styles.inputContainer, tw`pr-3`]}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
          <Ionicons name="mail-outline" size={22} color="#FFF" />
        </View>
      </View>

      {/* Request OTP Button */}
      <TouchableOpacity
        onPress={handleRequestOtp}
        style={tw`w-full ${
          isLoading ? "bg-gray-500" : "bg-white"
        } rounded-full px-6 py-4 flex-row justify-center items-center shadow-md mb-4`}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6D28D9" style={tw`mr-2`} />
        ) : null}
        <Text
          style={tw`text-center text-lg font-bold ${
            isLoading ? "text-white/80" : "text-purple-600"
          }`}
        >
          {isLoading ? "Sending..." : "Send Reset Code"}
        </Text>
      </TouchableOpacity>

      {/* Link to Login */}
      <View style={tw`flex-row justify-center mt-4`}>
        <Text style={tw`text-white/80 text-sm`}>
          Remembered your password?{" "}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          disabled={isLoading}
        >
          <Text style={tw`text-white text-sm font-semibold underline`}>
            Login here
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render OTP Verification and Password Reset Form
  const renderVerificationForm = () => (
    <View
      style={tw`w-full max-w-md bg-white/20 rounded-2xl p-6 shadow-lg`}
    >
      <TouchableOpacity
        onPress={handleBackToRequest}
        style={tw`absolute top-4 left-4 z-10 p-1`}
        disabled={isLoading}
      >
        <Ionicons name="arrow-back-outline" size={28} color="#FFF" />
      </TouchableOpacity>

      <Text style={tw`text-white text-center text-3xl font-bold mb-2 pt-6`}>
        Check Your Email!
      </Text>
      <Text style={tw`text-white/80 text-center text-base mb-2`}>
        We sent a reset code to:
      </Text>
      <Text style={tw`text-white text-center text-base font-semibold mb-6`}>
        {submittedEmail}
      </Text>

      {/* OTP Input */}
      <View style={tw`mb-5`}>
        <Text style={styles.label}>OTP Code</Text>
        <TextInput
          style={[styles.input, styles.inputStandalone]}
          placeholder="Enter 5-digit code"
          placeholderTextColor="#9CA3AF"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={5}
          editable={!isLoading}
        />
      </View>

      {/* New Password Input */}
      <View style={tw`mb-5`}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password (min 8 chars)"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={tw`p-2`}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password Input */}
      <View style={tw`mb-8`}>
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm your new password"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={tw`p-2`}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset Password Button */}
      <TouchableOpacity
        onPress={handleVerifyAndReset}
        style={tw`w-full ${
          isLoading ? "bg-gray-500" : "bg-white"
        } rounded-full px-6 py-4 flex-row justify-center items-center shadow-md mb-4`}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6D28D9" style={tw`mr-2`} />
        ) : null}
        <Text
          style={tw`text-center text-lg font-bold ${
            isLoading ? "text-white/80" : "text-purple-700"
          }`}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Text>
      </TouchableOpacity>

      {/* Optional: Link to resend code? Requires extra API endpoint/logic */}
      {/* <TouchableOpacity onPress={() => handleRequestOtp(submittedEmail)} disabled={isLoading} style={tw`mt-2`}>
            <Text style={tw`text-white/80 text-center text-sm underline`}>Resend Code</Text>
       </TouchableOpacity> */}
    </View>
  );

  // Main Return
  return (
    <LinearGradient
      colors={["#6D28D9", "#009eff", "#F59E0B"]}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center items-center p-6`}
          keyboardShouldPersistTaps="handled"
        >
          {/* Conditionally render the correct form based on the stage */}
          {stage === STAGES.REQUEST_OTP
            ? renderRequestForm()
            : renderVerificationForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// Styles (kept similar to previous version)
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  label: tw`text-white/90 text-sm font-medium mb-1 ml-1`,
  inputContainer: tw`flex-row items-center bg-white/30 rounded-lg border border-white/40`,
  input: tw`flex-1 text-white text-base py-3 px-4`,
  inputStandalone: tw`bg-white/30 rounded-lg border border-white/40 text-white text-base py-3 px-4`,
});

export default ResetPasswordScreen;
