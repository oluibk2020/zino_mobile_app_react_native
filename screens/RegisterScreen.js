

import  { useState, useContext, useEffect } from "react"; // Removed useEffect unless needed for isAuth check
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator, // Added for potential loading state
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet, // Keep for picker container style if needed
} from "react-native";
import tw from "twrnc";
import { Picker } from "@react-native-picker/picker";
import StoreContext from "../context/storeContext";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

// Optional: If you use icons
// import Icon from 'react-native-vector-icons/Ionicons';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("NG"); // Default country
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  // Example: Get context, though isAuth check is commented out
  const { isAuth } = useContext(StoreContext);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
   const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME;

  // Optional: Redirect if already logged in
  useEffect(() => {
    if (isAuth) {
      return;
    }
  }, [isAuth, navigation]);

  // --- Input Handlers ---
  const handleInputChange = (setter) => (text) => {
    setter(text);
    if (formError) setFormError(""); // Clear error on input change
  };


  // --- Registration API Call ---
  async function registerUser() {
    setIsLoading(true); // Start loading indicator

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Good practice
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password, // Keep password as is, no trim
          fullName: fullName.trim(),
          country: country, // Assuming country doesn't need trimming
        }),
      });

      // Attempt to parse JSON, provide empty object fallback if parsing fails
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Check for 2xx status codes (e.g., 200, 201)
        Toast.show({
          type: "success",
          text1: "Registration Successful",
          text2: data?.msg || data?.message || "You can now log in.", // Use message from API or default
          position: "top",
          visibilityTime: 4000, // Show for 4 seconds
        });

        // Clear the form fields after successful registration
        setFullName("");
        setEmail("");
        setPassword("");
        // setCountry("Nigeria"); // Optionally reset country to default

        // Navigate to Login screen, replacing Register screen in the stack
        navigation.replace("Login");
      } else if (response.status === 400) {
        console.log(data?.message);
        Toast.show({
          type: "error", // 'success' | 'error' | 'info'
          text1: "RegistrationFailed", // title
          text2: "Password needs to min of 6, uppercase, lowercase, number", //msg body
          position: "top", // 'top' | 'bottom'
        });
        setIsLoading(false);
      } else if (response.status === 401) {
        Toast.show({
          type: "error", // 'success' | 'error' | 'info'
          text1: "Registration Failed", // title
          text2: "User already exists", //msg body
          position: "top", // 'top' | 'bottom'
        });
        setIsLoading(false);
      } else {
        // Handle API errors (4xx, 5xx)
        const errorMessage =
          data?.msg ||
          data?.message ||
          `Registration failed (Status: ${response.status})`;
        // Show specific error using Toast
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: errorMessage,
          position: "top",
        });
        // Consider clearing only the password field on failure
        setPassword('');
      }
    } catch (error) {
      // Handle network errors or other exceptions during fetch
      console.error("Registration Network/Fetch Error:", error);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Please check your connection and try again.",
        position: "top",
      });
    } finally {
      // This block executes regardless of success or failure
      setIsLoading(false); // Stop loading indicator
    }
  }

  // --- Form Validation & Submission ---
  const handleRegister = () => {
    // No need for async here
    Keyboard.dismiss();
    setFormError(""); // Clear previous client-side validation errors

    // --- Client-Side Validation ---
    if (!fullName.trim() || !email.trim() || !password.trim() || !country) {
      setFormError("Please fill in all fields.");
      return; // Stop submission if fields are empty
    }
    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return; // Stop submission if email format is invalid
    }
    // Example: Minimum password length check
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return; // Stop submission if password is too short
    }
    // Add more complex password validation regex here if needed on the client-side
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
       setFormError("Password needs uppercase, lowercase, and number. No symbol allowed");
       return;
    }

    // If client-side validation passes, call the function to interact with the API
    registerUser();
  };


  return (
    // --- Gradient Background ---
    <LinearGradient
      // Vibrant gradient example (adjust colors as needed)
      colors={["#6D28D9","#F59E0B", "#009eff"]} // Indigo -> Pink -> Orange
      style={tw`flex-1`}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center`}
          style={tw`flex-1 bg-transparent`} // Make ScrollView transparent
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={tw`p-6 md:p-8`}>
              {/* Optional: App Name / Logo Above Card */}
              <View style={tw`items-center mb-6`}>
                <Text style={tw`text-white text-4xl font-bold opacity-90`}>
                  {APP_NAME}
                </Text>
              </View>

              {/* --- The Card --- */}
              <View
                style={tw`bg-white/95 rounded-2xl p-6 shadow-xl w-full max-w-md mx-auto`}
              >
                {/* Header */}
                <Text
                  style={tw`text-center text-3xl font-bold text-gray-800 mb-2`}
                >
                  Create Account
                </Text>
                <Text style={tw`text-center text-base text-gray-500 mb-8`}>
                  Let's get you started!
                </Text>

                {/* Full Name Input */}
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-gray-700 mb-1 ml-1`}>
                    Full Name
                  </Text>
                  <TextInput
                    style={tw`w-full p-3 border ${
                      formError && !fullName
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-gray-50 rounded-lg text-base text-gray-900`}
                    placeholder="e.g., Ada Lovelace"
                    placeholderTextColor={tw.color("gray-400")}
                    value={fullName}
                    onChangeText={handleInputChange(setFullName)}
                    editable={!isLoading}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email Input */}
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-gray-700 mb-1 ml-1`}>
                    Email Address
                  </Text>
                  <TextInput
                    style={tw`w-full p-3 border ${
                      formError && (!email || !/\S+@\S+\.\S+/.test(email))
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-gray-50 rounded-lg text-base text-gray-900`}
                    placeholder="you@example.com"
                    placeholderTextColor={tw.color("gray-400")}
                    value={email}
                    onChangeText={handleInputChange(setEmail)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>

                {/* Password Input */}
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-gray-700 mb-1 ml-1`}>
                    Password
                  </Text>
                  <View
                    style={tw`flex-row items-center border ${
                      formError && (!password || password.length < 6)
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-gray-50 rounded-lg pr-2`}
                  >
                    <TextInput
                      style={tw`flex-1 p-3 text-base text-gray-900`}
                      placeholder="Create a password (min. 6 chars)"
                      placeholderTextColor={tw.color("gray-400")}
                      value={password}
                      onChangeText={handleInputChange(setPassword)}
                      secureTextEntry={!isPasswordVisible}
                      editable={!isLoading}
                      autoComplete="password-new" // Hint for new password
                    />
                    <TouchableOpacity
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)} // Toggle state on press
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase tap area
                      disabled={isLoading}
                      style={tw`p-2`} // Add padding around the icon for easier tapping
                    >
                      <Ionicons
                        name={
                          isPasswordVisible ? "eye-off-outline" : "eye-outline"
                        } // Condition ? name_if_true : name_if_false
                        size={24} // Adjust size as needed (20, 22, 24 are common)
                        color={tw.color("gray-500")} // Adjust color (e.g., gray-500 or indigo-600)
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Country Picker */}
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-gray-700 mb-1 ml-1`}>
                    Country
                  </Text>
                  <View
                    style={tw`w-full border ${
                      formError && !country
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg bg-gray-50 overflow-hidden`}
                  >
                    {/* Apply basic styling wrapper for consistency */}
                    <Picker
                      selectedValue={country}
                      onValueChange={(itemValue) => {
                        setCountry(itemValue);
                        if (formError) setFormError("");
                      }}
                      style={styles.pickerStyle} // Use StyleSheet for platform differences
                      mode="dropdown" // 'dialog' on Android, 'dropdown' on iOS
                      enabled={!isLoading}
                    >
                      {/* Add a placeholder item if desired */}
                      {/* <Picker.Item label="Select Country..." value="" enabled={false} style={tw`text-gray-400`} /> */}
                      <Picker.Item label="Nigeria" value="NG" />
                      <Picker.Item label="Ghana" value="GH" />
                      <Picker.Item label="Canada" value="CAD" />
                      <Picker.Item label="France" value="FR" />
                      <Picker.Item label="USA" value="USA" />
                      <Picker.Item label="UK" value="UK" />
                      {/* Add more countries as needed */}
                    </Picker>
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

                {/* Register Button */}
                <TouchableOpacity
                  style={tw`w-full ${
                    isLoading
                      ? "bg-indigo-400"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  } p-3.5 rounded-lg shadow-md flex-row justify-center items-center`}
                  onPress={handleRegister}
                  disabled={isLoading}
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
                    {isLoading ? "Creating Account..." : "Register"}
                  </Text>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={tw`mt-6 flex-row justify-center`}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    disabled={isLoading}
                  >
                    <Text
                      style={tw`text-indigo-600 text-sm font-medium hover:text-indigo-500`}
                    >
                      Already have an account? Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* End of Card */}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// StyleSheet for Picker styling consistency
const styles = StyleSheet.create({
  pickerStyle: {
    width: "100%",
    height: Platform.OS === "ios" ? undefined : 50, // iOS height is intrinsic, Android needs fixed height
    backgroundColor: "transparent", // Match bg-gray-50 look if needed, but often better transparent
    // Add other platform-specific adjustments if necessary
    // Note: Deep customization of Picker appearance is limited
  },
});

export default RegisterScreen;
