import React, { useState, useContext, useEffect, useCallback } from "react";
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
  SafeAreaView, // Use SafeAreaView for top/bottom padding on iOS
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker"; // Import Picker
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; // Import icons
import StoreContext from "../context/storeContext"; // Adjust path if needed
import Toast from "react-native-toast-message";
import tw from "twrnc";

// Assume API_URL is configured
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Define country options - move to constants file if used elsewhere
const countryOptions = [
  { label: "Select Country", value: "" },
  { label: "Nigeria", value: "NG" },
  { label: "Ghana", value: "GH" },
  { label: "France", value: "FR" },
  { label: "Canada", value: "CAD" },
  { label: "Ireland", value: "IE" },
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "GB" },
  { label: "United Arab Emirates", value: "AE" },
  { label: "Sweden", value: "SE" },
  // Add more countries as needed
];

const ProfileScreen = () => {
  // --- Context and Navigation ---
  const {
    userProfile,
    isLoading: contextIsLoading,
    setIsLoading,
    fetchProfile,
    invalidateLogin,
  } = useContext(StoreContext);
  const navigation = useNavigation();

  // --- State ---
  const [isEditing, setIsEditing] = useState(false);
  const [localIsLoading, setLocalIsLoading] = useState(false); // For update operation specifically

  // Form State (initialized from userProfile)
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("");

  // --- Effects ---

  // Re-fetch profile when the screen comes into focus to ensure data is fresh
  useFocusEffect(
    useCallback(() => {
      if (typeof fetchProfile === "function") {
        // Optionally add a check to only fetch if data is stale
        // console.log("Fetching profile on focus...");
        fetchProfile();
      }
    }, [])
  );

  // --- Handlers ---

  const handleEditToggle = () => {
    if (!isEditing) {
      // Entering edit mode, ensure form fields reflect current profile
      setFullName(userProfile?.fullName || "");
      setMobile(userProfile?.mobile || "");
      setCountry(userProfile?.country || "");
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    // Reset form fields to original profile data and exit edit mode
    if (userProfile) {
      setFullName(userProfile.fullName || "");
      setMobile(userProfile.mobile || "");
      setCountry(userProfile.country || "");
    }
    setIsEditing(false);
  };

  const handleUpdateProfile = async () => {
    // Frontend Validation
    if (!fullName.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Full Name cannot be empty.",
      });
      return;
    }
    // Adjust mobile validation based on requirements (e.g., allow different lengths/formats or check country-specific rules)
    // Simple check for non-empty, consider more robust validation
    if (!mobile.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Mobile number cannot be empty.",
      });
      return;
    }
    // Example: Basic check for digits, adjust as needed
    // if (!/^\d+$/.test(mobile.trim())) {
    //     Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Mobile number should contain only digits.' });
    //     return;
    // }
    if (!country) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please select your country.",
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

    if (userProfile.fullName === fullName && userProfile.mobile == mobile && userProfile.country == country) {
        //do not call API
        setLocalIsLoading(false);
        Toast.show({
          type: "success",
          text1: "No changes made",
          text2: "Redirecting you to your profile...",
        });
        handleCancelEdit()
        return;
    }

    setLocalIsLoading(true); // Use local loading state for the update operation
    let token = null;
    try {
      token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
    } catch (e) {
      console.error("Failed to get token:", e);
      Toast.show({
        type: "error",
        text1: "Authentication Error",
        text2: "Please log in again.",
      });
      setLocalIsLoading(false);
      // navigation.navigate('Login'); // Optional: Redirect to Login
      return;
    }

  

    try {
        console.log("running profile update");
      const response = await fetch(`${API_URL}/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile: mobile.trim(),
          fullName: fullName.trim(),
          country: country.trim(), // Send selected country code
        }),
      });

      const data = await response.json();

      // Use response.ok (status 200-299) - Adjust if API strictly uses 203
      if (response.ok || response.status === 203) {
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: data.message || "Your profile has been updated successfully.",
        });
        await fetchProfile(); // Refresh profile data in context
        //clear data
        setFullName("")
        setMobile("")
        setCountry("")
        setIsEditing(false); // Exit edit mode on success
      } else {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: data.message || "Could not update profile. Please try again.",
        });
      }
    } catch (error) {
      console.error("Update Profile Network/Fetch Error:", error);
      Alert.alert(
        "Network Error",
        "Could not connect. Please check your connection."
      );
    } finally {
      setLocalIsLoading(false);
    }
  };

  // --- Render Logic ---

  // Helper to render profile fields (for display mode)
  const renderProfileField = (
    iconName,
    label,
    value,
    iconFamily = Ionicons
  ) => {
    const IconComponent = iconFamily;
    return (
      <View
        style={tw`flex-row items-center mb-4 border-b border-gray-200 pb-3`}
      >
        <IconComponent
          name={iconName}
          size={22}
          color={tw.color("purple-600")}
          style={tw`mr-4 w-6`}
        />
        <View>
          <Text style={tw`text-xs text-gray-500`}>{label}</Text>
          <Text style={tw`text-base text-gray-800 font-medium`}>
            {value || "Not provided"}
          </Text>
        </View>
      </View>
    );
  };

  // Display Mode
  const renderDisplayMode = () => (
    <View style={styles.card}>
      <Text style={tw`text-2xl font-bold text-center text-purple-800 mb-6`}>
        My Profile
      </Text>
      {renderProfileField("person-outline", "Full Name", userProfile?.fullName)}
      {renderProfileField("mail-outline", "Email", userProfile?.user?.email)}
      {renderProfileField("at-outline", "Username", userProfile?.userName)}
      {renderProfileField("call-outline", "Mobile", userProfile?.mobile)}
      {/* Find a suitable icon for country */}
      {renderProfileField(
        "flag-outline",
        "Country",
        countryOptions.find((c) => c.value === userProfile?.country)?.label ||
          userProfile?.country
      )}

      <TouchableOpacity
        onPress={handleEditToggle}
        style={[styles.button, tw`bg-purple-600 mt-6`]} // Use primary color
      >
        <Ionicons
          name="create-outline"
          size={20}
          color="white"
          style={tw`mr-2`}
        />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  // Edit Mode
  const renderEditMode = () => (
    <View style={styles.card}>
      <Text style={tw`text-2xl font-bold text-center text-purple-800 mb-6`}>
        Update Profile
      </Text>

      {/* Full Name Input */}
      <View style={tw`mb-4`}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          editable={!localIsLoading}
        />
      </View>

      {/* Mobile Input */}
      <View style={tw`mb-4`}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your mobile number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad" // Use phone pad keyboard
          editable={!localIsLoading}
        />
      </View>

      {/* Country Picker */}
      <View style={tw`mb-6`}>
        <Text style={styles.label}>Country</Text>
        {/* Basic Picker styling - can be improved with custom component */}
        <View style={tw`border border-gray-300 rounded-lg bg-white`}>
          <Picker
            selectedValue={country}
            onValueChange={(itemValue) => setCountry(itemValue)}
            enabled={!localIsLoading}
            style={{ height: 50, width: "100%" }} // Basic styling
            prompt="Select your country" // Android only
          >
            {countryOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={tw`flex-row justify-between mt-6`}>
        <TouchableOpacity
          onPress={handleCancelEdit}
          style={[
            styles.button,
            tw`bg-gray-500 flex-1 mr-2`,
            { opacity: localIsLoading ? 0.5 : 1 },
          ]} // Gray cancel button
          disabled={localIsLoading}
        >
          <Ionicons
            name="close-circle-outline"
            size={20}
            color="white"
            style={tw`mr-2`}
          />
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleUpdateProfile}
          style={[
            styles.button,
            tw`bg-green-600 flex-1 ml-2`,
            { opacity: localIsLoading ? 0.5 : 1 },
          ]} // Green save button
          disabled={localIsLoading}
        >
          {localIsLoading ? (
            <ActivityIndicator size="small" color="#ffffff" style={tw`mr-2`} />
          ) : (
            <Ionicons
              name="save-outline"
              size={20}
              color="white"
              style={tw`mr-2`}
            />
          )}
          <Text style={styles.buttonText}>
            {localIsLoading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Main Return ---
  if (contextIsLoading && !userProfile) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color={tw.color("purple-600")} />
      </View>
    );
  }

  if (!contextIsLoading && !userProfile) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-100 p-5`}>
        <Ionicons
          name="warning-outline"
          size={50}
          color={tw.color("orange-500")}
        />
        <Text style={tw`text-lg text-center text-gray-600 mt-4`}>
          Could not load profile data. Please try logging in again.
        </Text>
        <TouchableOpacity
          onPress={() => invalidateLogin("Could not load profile data.")}
          style={[styles.button, tw`bg-purple-600 mt-6`]}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient // Use gradient background for the whole screen
      colors={["#F3E8FF", "#E0F2FE", "#FFFBEB"]} 
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={tw`flex-1`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <ScrollView
            contentContainerStyle={tw`flex-grow justify-center items-center p-4`}
            keyboardShouldPersistTaps="handled"
          >
            {/* Conditionally render display or edit mode */}
            {isEditing ? renderEditMode() : renderDisplayMode()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Styles
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  card: tw`w-full max-w-lg bg-white rounded-2xl p-6 shadow-lg border border-gray-200 my-4`,
  label: tw`text-sm font-medium text-gray-600 mb-1`,
  input: tw`w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-800`,
  button: tw`flex-row items-center justify-center rounded-lg px-5 py-3 shadow-md`,
  buttonText: tw`text-white text-base font-bold text-center`,
});

export default ProfileScreen;
