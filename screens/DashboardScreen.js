import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  Dimensions, // Import Dimensions for dynamic width
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // Using Ionicons
import tw from "twrnc";
import StoreContext from "../context/storeContext"; // Adjust path if needed
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";

//import toast
import Toast from "react-native-toast-message";

//expo notifications
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// Placeholder image - replace with your actual image URL or local asset
const placeholderImage =
  "https://placehold.co/800x500/a29bfe/ffffff?text=Start+Your+Journey!";
const localImage = require("../assets/images/placeholder2.jpg");

const NOTIFICATION_PERMISSION_REQUESTED_KEY = "notificationPermissionRequested";

const { width: screenWidth } = Dimensions.get("window"); // Get screen width for card sizing

const DashboardScreen = ({ navigation }) => {
  // Assuming context provides these values. Adjust names if needed.
  const {
    userProfile,
    enrolledCourses = [],
    isLoading,
    setIsLoading,
    getAllEnrolledCourses,
    fetchProfile,
    token: userAuthToken,
    projectId,
    globalNotificationData,
    setGlobalNotificationData,
  } = useContext(StoreContext);

  // Use environment variables
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const [pushToken, setPushToken] = useState(null);
  const [activeNotification, setActiveNotification] = useState(
    globalNotificationData
  );
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // Function to register the token with your backend
  const registerPushTokenWithBackend = async (token, userAuthToken) => {
    // Replace with your actual API call
    console.log(`Sending push token (${token}) to backend...`);
    try {
      const response = await fetch(
        `${API_URL}/expo-notification/register-push-token`,
        {
          // Example endpoint
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userAuthToken}`, // Use the user's auth token
          },
          body: JSON.stringify({ pushToken: token }),
        }
      );
      if (!response.ok) {
        const errorData = await response.text();
        console.warn(`Backend error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log("Push token registered successfully with backend.");
      return;
    } catch (error) {
      console.error("Failed to register push token with backend:", error);
      // Handle error appropriately (e.g., retry logic, logging)
    }
  };

  const checkAndRequestNotificationPermissions = async () => {
    try {
      // 1. Check if we've already asked the user before
      const alreadyRequested = await AsyncStorage.getItem(
        NOTIFICATION_PERMISSION_REQUESTED_KEY
      );
      if (alreadyRequested === "true") {
        console.log("Notification permission already requested previously.");
        // Optional: Check current status again in case it changed in settings
        const currentStatus = await Notifications.getPermissionsAsync();
        if (currentStatus.granted && userAuthToken) {
          // If granted, try getting token again in case it failed before or changed
          registerForPushNotificationsAsync(userAuthToken);
        }
        return; // Don't ask again if already requested
      }

      // 2. Check current permission status
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 3. If status is undetermined, ask the user
      if (existingStatus !== "granted") {
        console.log("Requesting notification permissions...");
        const { status } = await Notifications.requestPermissionsAsync(); // Shows OS dialog
        finalStatus = status;
      }

      // 4. Mark that we have now requested permission
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, "true");

      // 5. Handle the final status
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "You will not receive push notifications. You can enable them in settings later."
        );
        return;
      }

      // 6. Permission Granted: Get Token and Register
      if (userAuthToken) {
        console.log("Notification permission granted!");
        registerForPushNotificationsAsync(userAuthToken);
      } else {
        console.warn(
          "Permission granted, but user auth token not available yet to register push token."
        );
      }
    } catch (error) {
      console.error(
        "Error checking/requesting notification permissions:",
        error
      );
      Alert.alert("Error", "Could not configure notifications.");
    }
  };

  const registerForPushNotificationsAsync = async (currentUserAuthToken) => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (!Device.isDevice) {
      Alert.alert("Must use physical device for Push Notifications");
      return;
    }

    try {
      // Use the V1 token format
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })
      ).data;
      const expoPushToken = pushTokenString;
      console.log("Expo Push Token:", expoPushToken);
      setPushToken(expoPushToken); // Store in state if needed locally

      // Send the token to your backend
      if (currentUserAuthToken) {
        await registerPushTokenWithBackend(expoPushToken, currentUserAuthToken);
      } else {
        console.error(
          "Cannot register push token: User Auth Token is missing."
        );
      }
    } catch (e) {
      console.error("Failed to get push token", e);
      Alert.alert("Error", "Could not get push token for notifications.");
    }
  };

  useEffect(() => {
    //function to get book
    async function fetchCourseAndProfile() {
      setIsLoading(true);
      const [result1, result2] = await Promise.all([
        getAllEnrolledCourses(),
        fetchProfile(),
      ]);
      setIsLoading(false);
    }

    //call function to check and request notification permissions
    checkAndRequestNotificationPermissions();
    //call function to get course and profile
    fetchCourseAndProfile();
    setIsLoading(false);
    console.log("globalNotificationData: ", globalNotificationData);
    if (globalNotificationData) {
      setIsBannerVisible(true);
    }
  }, [globalNotificationData]);

  // --- Determine Course to Continue ---
  // Simple logic: Use the first enrolled course. Enhance this if you have progress data.
  const courseToContinue =
    enrolledCourses.length > 0 ? enrolledCourses[0] : null;
  const userName =
    userProfile?.fullName?.split(" ")[0] || userProfile?.userName || "Student"; // Get first name or username

  // --- Navigation Handlers ---
  const handleContinueCourse = () => {
    if (courseToContinue == null) {
      console.log("Navigating to all enrolled courses...");
      navigation.navigate("MyCoursesTab", {
        screen: "EnrolledCourseList", // Screen name inside EnrolledCoursesNavigator
      });
    }

    if (courseToContinue) {
      console.log(`Navigating to continue course: ${courseToContinue.id}`);
      console.log(`Navigating to continue course: ${courseToContinue}`);
      // Navigate to the correct tab first, then the screen within that tab's stack
      navigation.navigate("MyCoursesTab", {
        screen: "EnrolledCourseDetail", // Screen name inside EnrolledCoursesNavigator
        params: {
          courseId: courseToContinue.id /* pass other needed params */,
        },
      });
    }
  };

  const handleExploreCourses = () => {
    console.log("Navigating to explore courses...");
    navigation.navigate("CoursesTab", {
      screen: "CourseList", // Screen name inside CoursesNavigator
    });
  };

  const handleViewAllMyCourses = () => {
    console.log("Navigating to all enrolled courses...");
    navigation.navigate("MyCoursesTab", {
      screen: "EnrolledCourseList", // Screen name inside EnrolledCoursesNavigator
    });
  };

  // --- Updated Handler for Development Services ---
  const handleRequestDevelopment = () => {
    console.log("Navigating to Services screen in WalletTab...");
    navigation.navigate("MenuTab", {
      screen: "MainMenuScreen",
    });
  };
  // --- Updated Handler for Development Services ---
  const handleRequestCertificate = () => {
    console.log("Navigating to Chat screen in ChatTab...");
    navigation.navigate("ChatTab", {
      screen: "ChatMain",
    });
  };

  // --- New Handler for Games Section ---
  const handlePlayGames = () => {
    console.log("Navigating to the Games section...");
    navigation.navigate("MenuTab", {
      screen: "MainMenuScreen",
    });
  };

  function handleNotificationPress() {
    console.log("Navigating to all screen...");
    navigation.navigate(globalNotificationData.screenTab, {
      screen: globalNotificationData.screenName, // Screen name inside EnrolledCoursesNavigator
    });
  }

  function handleDismissBanner() {
    console.log("Notification Dismissed:", globalNotificationData?.title);
    setIsBannerVisible(false);
    setGlobalNotificationData(null);
  }

  const renderNotificationBanner = () => {
    if (!globalNotificationData || !isBannerVisible) {
      return null; // Don't render anything if no notification or not visible
    }

    return (
      // The banner container - using TouchableOpacity to make it tappable
      <TouchableOpacity
        style={tw`bg-yellow-100 border border-yellow-300 p-4 mx-4 mb-4 rounded-lg shadow-sm flex-row items-center`}
        onPress={handleNotificationPress}
        activeOpacity={0.8} // Give feedback on press
      >
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={tw.color("yellow-800")}
          style={tw`mr-3`}
        />

        <View style={tw`flex-1 mr-3`}>
          <Text style={tw`text-sm font-bold text-yellow-800 mb-1`}>
            {globalNotificationData.title}
          </Text>
          <Text style={tw`text-xs text-yellow-700 leading-snug`}>
            {globalNotificationData.body}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDismissBanner}
          style={tw`p-1`} // Add some touch padding
        >
          <Ionicons
            name="close-circle"
            size={24}
            color={tw.color("yellow-800")}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // --- Loading State ---
  // Show loading indicator if context is loading OR if userProfile isn't available yet
  if (isLoading || !userProfile) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color={tw.color("purple-600")} />
        <Text style={tw`mt-3 text-gray-500`}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  // --- Render Dashboard UI ---
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView contentContainerStyle={tw`p-5 pb-10`}>
        {/* Welcome Header */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-2xl font-semibold text-gray-600`}>
            Welcome back,
          </Text>
          <Text style={tw`text-3xl font-bold text-purple-800`}>
            {userName}!
          </Text>
        </View>

        {/* --- Render the Notification Banner at the Top --- */}
        {renderNotificationBanner()}

        {/* --- Continue Learning Section --- */}
        {courseToContinue ? (
          <View style={styles.card}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="play-circle-outline"
                size={24}
                color={tw.color("purple-600")}
                style={tw`mr-2`}
              />
              <Text style={tw`text-xl font-bold text-gray-800`}>
                Continue Learning
              </Text>
            </View>
            <Text style={tw`text-lg text-gray-700 mb-4`}>
              {courseToContinue.title}
            </Text>

            <TouchableOpacity
              style={[styles.button, tw`bg-purple-600`]}
              onPress={handleContinueCourse}
            >
              <Ionicons
                name="arrow-forward-circle-outline"
                size={20}
                color="white"
                style={tw`mr-2`}
              />
              <Text style={styles.buttonText}>Continue Course</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`mt-3 self-center`}
              onPress={handleViewAllMyCourses}
            >
              <Text style={tw`text-purple-600 underline`}>
                View all my courses
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, tw`bg-purple-50 border-purple-200`]}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="school-outline"
                size={24}
                color={tw.color("purple-600")}
                style={tw`mr-2`}
              />
              <Text style={tw`text-xl font-bold text-gray-800`}>
                Start Your Journey
              </Text>
            </View>
            <Text style={tw`text-base text-gray-700 mb-4 text-center`}>
              You haven't enrolled in any courses yet. Explore our catalog and
              find the perfect software engineering course for you!
            </Text>
            <TouchableOpacity
              style={[styles.button, tw`bg-purple-600`]}
              onPress={handleExploreCourses}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="white"
                style={tw`mr-2`}
              />
              <Text style={styles.buttonText}>Explore Courses Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- Horizontal Scrollable Cards Section --- */}
        <Text style={tw`text-xl font-bold text-gray-800 mt-6 mb-4 px-1`}>
          Quick Actions
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
        >
          {/* --- Dive into Addictive Games Section (NEW) --- */}
          <View
            style={[
              styles.horizontalCard,
              tw`bg-purple-200 border-purple-200 mr-3`,
            ]}
          >
            {" "}
            {/* No mr-4 on the last card */}
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="game-controller-outline" // An appropriate icon for games
                size={24}
                color={tw.color("red-700")}
                style={tw`mr-2`}
              />
              <Text style={tw`text-xl font-bold text-gray-800`}>
                Dive into Addictive Games!
              </Text>
            </View>
            <Text style={tw`text-base text-gray-700 mb-5 text-center`}>
              Take a break from coding and challenge your mind with our fun and
              addictive games like Nexus Grid (Othello)!
            </Text>
            <TouchableOpacity
              style={[styles.button, tw`bg-red-600`]} // A vibrant red for games
              onPress={handlePlayGames}
            >
              <Ionicons
                name="play-outline" // Play icon
                size={20}
                color="white"
                style={tw`mr-2`}
              />
              <Text style={styles.buttonText}>Play Now</Text>
            </TouchableOpacity>
          </View>

          {/* --- Request Certificate Section (NEW) --- */}
          <View
            style={[
              styles.horizontalCard,
              tw`bg-purple-500 border-purple-500 mr-3`,
            ]}
          >
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="document-text-outline" // Changed icon for certificate
                size={24}
                color={tw.color("white")}
                style={tw`mr-2`}
              />
              <Text style={tw`text-xl font-bold text-white`}>
                Finished a Course?
              </Text>
            </View>
            <Text style={tw`text-base text-gray-50 mb-5 text-center`}>
              Have you completed a course and want to receive a certificate?
              Chat with our team and get a signed verifiable certificate
              delivered straight to your inbox!
            </Text>

            <TouchableOpacity
              style={[styles.button, tw`bg-yellow-600`]} // A slightly darker purple for contrast
              onPress={handleRequestCertificate} // This now navigates to WalletTab -> Services
            >
              <Ionicons
                name="chatbox-outline" // Changed icon for chat
                size={20}
                color="white"
                style={tw`mr-2`}
              />
              <Text style={styles.buttonText}>Request A Certificate</Text>
            </TouchableOpacity>
          </View>

          {/* --- Request Development Services Section (NEW) --- */}
          <View
            style={[
              styles.horizontalCard,
              tw`bg-purple-200 border-purple-200`,
            ]}
          >
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="laptop-outline" // Or "phone-portrait-outline", "code-slash-outline"
                size={24}
                color={tw.color("purple-700")}
                style={tw`mr-2`}
              />
              <Text style={tw`text-xl font-bold text-gray-800`}>
                Need a Custom App?
              </Text>
            </View>
            <Text style={tw`text-base text-gray-700 mb-5 text-center`}>
              Looking for a custom web or mobile application? Our network of
              expert developers is here to bring your ideas to life!
            </Text>

            <TouchableOpacity
              style={[styles.button, tw`bg-yellow-600`]} // A slightly darker purple for contrast
              onPress={handleRequestDevelopment} // This now navigates to WalletTab -> Services
            >
              <Ionicons
                name="hammer-outline" // Or "bulb-outline", "send-outline"
                size={20}
                color="white"
                style={tw`mr-2`}
              />
              <Text style={styles.buttonText}>
                Request Development Services
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* --- Unlock Your Potential Section --- */}
        <View style={[styles.card, tw`mt-6`]}>
          <Text style={tw`text-xl font-bold text-gray-800 mb-4 text-center`}>
            Unlock Your Potential
          </Text>
          {/* Image Container */}
          <View style={tw`mb-4 rounded-lg overflow-hidden shadow-lg`}>
            <Image
              source={localImage}
              // Or use local image: source={localImage}
              style={tw`w-full h-48`}
              resizeMode="cover"
              onError={(e) =>
                console.log("Failed to load image", e.nativeEvent.error)
              } // Basic error handling
            />
          </View>

          <Text style={tw`text-base text-gray-700 mb-5 text-center`}>
            Ready to dive into the world of software engineering? Find exciting
            courses tailored to your goals.
          </Text>

          <TouchableOpacity
            style={[styles.button, tw`bg-purple-700 `]} // Use blue accent color
            onPress={handleExploreCourses}
          >
            <Ionicons
              name="search-circle-outline"
              size={20}
              color="white"
              style={tw`mr-2`}
            />
            <Text style={styles.buttonText}>Explore All Courses</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  card: tw`bg-white rounded-xl p-5 shadow-md border border-gray-200 mb-5`,
  // New style for horizontal cards to give them a fixed width and consistent styling
  horizontalCard: {
    ...tw`bg-white rounded-xl p-5 shadow-md border border-gray-200`,
    width: screenWidth * 0.75, // Adjust width as needed, e.g., 85% of screen width
  },
  button: tw`flex-row items-center justify-center rounded-lg px-5 py-3 shadow`,
  buttonText: tw`text-white text-base font-bold text-center`,
});

export default DashboardScreen;
