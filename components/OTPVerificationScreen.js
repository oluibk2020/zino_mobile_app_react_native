import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert, // Keep Alert for now if preferred for certain errors, though Toast is better
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
} from "react-native";
import tw from "twrnc";
import StoreContext from "../context/storeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

const OTP_LENGTH = 5; // Define OTP length as a constant

const OTPVerificationScreen = ({ navigation }) => {
  // State for OTP digits (using an array is often easier for individual boxes)
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(180); // 3 minutes
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For Verify button
  const [isResending, setIsResending] = useState(false); // For Resend link/button
  const [formError, setFormError] = useState(""); // For displaying errors inline if needed

  // Refs for focusing OTP input boxes
  const inputRefs = useRef([]);

  // Context values
  const {
    email, // Email is needed for verification and resend
    password,
    setIsAuth,
    setToken,
    setPassword,
    handleLoginSuccess,
  } = useContext(StoreContext);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // --- Effects ---

  // Countdown Timer Effect
  useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && !canResend) {
      setCanResend(true); // Enable resend when timer hits 0
    }
    // Cleanup interval on unmount or when timer changes state significantly
    return () => clearInterval(interval);
  }, [timer, canResend]);

  // --- Handlers ---

  // Handle input changes in OTP boxes
  const handleOtpChange = (text, index) => {
    // Allow only digits
    const digits = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    // Update the current box value (max 1 digit)
    newOtp[index] = digits.slice(-1); // Take only the last entered digit
    setOtp(newOtp);

    // Auto-focus next input if a digit was entered
    if (digits && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key press
  const handleKeyPress = ({ nativeEvent: { key: keyValue } }, index) => {
    if (keyValue === "Backspace") {
      // If backspace pressed and current box is empty, focus previous box
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Clear the current box on backspace regardless (optional, standard behavior)
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      // Then focus previous if it wasn't already empty
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Combine OTP array into a string
  const getOtpString = () => otp.join("");

  // --- API Calls ---

  // Verify the entered OTP
  async function verifyLogin() {
    setIsLoading(true); // Show loading on Verify button
    setFormError(""); // Clear previous errors

    const otpString = getOtpString();

    try {
      const response = await fetch(`${API_URL}/auth`, {
        // Endpoint to verify OTP + email
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          token: otpString, // Send the combined OTP string
          email: email,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.access_token) {
        // Check for 2xx and access_token
        const backendToken = data.access_token;
        // --- Success ---
         await handleLoginSuccess(backendToken);

      
      } else {
        // Handle verification failure
        const errorMessage =
          data?.msg || data?.message || `Invalid OTP or verification failed.`;
        Toast.show({
          type: "error",
          text1: "Verification Failed",
          text2: errorMessage,
        });
        setOtp(new Array(OTP_LENGTH).fill("")); // Clear OTP input on failure
        inputRefs.current[0]?.focus(); // Focus the first box again
      }
    } catch (error) {
      console.error("OTP Verification Network/Fetch Error:", error);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Could not verify OTP. Please try again.",
      });
    } finally {
      setIsLoading(false); // Hide loading on Verify button
    }
  }

  // Request a new OTP
  async function requestNewOtp() {
    setIsResending(true); // Indicate loading state for resend action
    setFormError("");

    try {
      // --- IMPORTANT: Use the correct endpoint to request a *new* OTP ---
      // This might be the same endpoint as initial login request, or a specific resend endpoint.
      const response = await fetch(`${API_URL}/auth/login-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Check for 2xx status
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: data?.message || "A new OTP has been sent to your email.",
        });
        // Reset timer and disable resend button *after* successful request
        setOtp(new Array(OTP_LENGTH).fill("")); // Clear old OTP input
        setTimer(180); // Reset timer
        setCanResend(false); // Disable resend until timer runs out
        inputRefs.current[0]?.focus(); // Focus the first OTP box
      } else {
        // Handle errors during resend request
        const errorMessage =
          data?.message || `Failed to resend OTP (Status: ${response.status})`;
        Toast.show({
          type: "error",
          text1: "Resend Failed",
          text2: errorMessage,
        });
      }
    } catch (error) {
      console.error("Resend OTP Network/Fetch Error:", error);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Could not resend OTP. Please try again.",
      });
    } finally {
      setIsResending(false); // Hide loading state for resend action
    }
  }

  // --- Button Handlers ---

  // Handle Verify OTP button press
  const verifyOTPHandler = () => {
    const otpString = getOtpString();
    if (otpString.length !== OTP_LENGTH) {
      // Use Toast instead of Alert for validation
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: `Please enter all ${OTP_LENGTH} digits.`,
      });
      // setFormError(`Please enter all ${OTP_LENGTH} digits.`); // Or use inline error
      return;
    }
    verifyLogin(); // Call the verification function
  };

  // Handle Resend OTP action
  const handleResendOTP = () => {
    if (!canResend || isResending) return; // Prevent multiple clicks or clicking before timer ends
    requestNewOtp(); // Call the function to request a new OTP
  };

  // --- Render Logic ---

  // Format timer display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return (
    <LinearGradient
      colors={["#4F46E5", "#EC4899", "#F59E0B"]} // Consistent gradient
      style={tw`flex-1`}
    >
      <StatusBar barStyle="light-content" />
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
              {/* --- The Card --- */}
              <View
                style={tw`bg-white/95 rounded-2xl p-6 shadow-xl w-full max-w-md mx-auto items-center`}
              >
                {/* Header */}
                <Text
                  style={tw`text-center text-2xl font-bold text-gray-800 mb-2`}
                >
                  Enter Verification Code
                </Text>
                <Text style={tw`text-center text-base text-gray-500 mb-8 px-4`}>
                  We sent a {OTP_LENGTH}-digit code to{" "}
                  <Text style={tw`font-medium text-gray-700`}>
                    {email || "your email"}
                  </Text>
                  .
                </Text>

                {/* OTP Input Boxes */}
                <View style={tw`flex-row justify-center gap-x-2 mb-6`}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={tw`w-12 h-14 border ${
                        formError && otp.join("").length !== OTP_LENGTH
                          ? "border-red-400"
                          : "border-gray-300"
                      } rounded-lg text-center text-2xl font-semibold bg-gray-50 text-gray-800`}
                      keyboardType="number-pad"
                      maxLength={1}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      value={digit}
                      editable={!isLoading && !isResending} // Disable while verifying or resending
                      selectTextOnFocus={true} // Easier to replace digit
                    />
                  ))}
                </View>

                {/* Inline Error Message (Optional) */}
                {/* {formError ? <Text style={tw`text-red-500 text-sm text-center mb-4`}>{formError}</Text> : <View style={tw`mb-4 h-5`} />} */}

                {/* Verify Button */}
                <TouchableOpacity
                  style={tw`w-full ${
                    isLoading
                      ? "bg-indigo-400"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  } p-3.5 rounded-lg shadow-md flex-row justify-center items-center mb-6`}
                  onPress={verifyOTPHandler}
                  disabled={isLoading || isResending} // Disable while verifying or resending
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                      style={tw`mr-2`}
                    />
                  ) : null}
                  <Text
                    style={tw`text-white text-center text-base font-semibold`}
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Text>
                </TouchableOpacity>

                {/* Resend OTP Section */}
                <View style={tw`flex-row items-center justify-center`}>
                  {canResend ? (
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={isResending}
                    >
                      <Text
                        style={tw`text-indigo-600 text-sm font-medium ${
                          isResending ? "opacity-50" : ""
                        }`}
                      >
                        {isResending ? "Sending..." : "Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={tw`text-gray-500 text-sm`}>
                      Resend code in {formatTime(timer)}
                    </Text>
                  )}
                </View>
              </View>
              {/* End of Card */}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Ensure <Toast /> is rendered at the top level of your app */}
    </LinearGradient>
  );
};

// No extra StyleSheet needed for now

export default OTPVerificationScreen;
