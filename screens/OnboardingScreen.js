import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import tw from "twrnc";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect } from "react";
import StoreContext from "../context/storeContext";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { setNewUser, newUser } = useContext(StoreContext); // Removed unused vars

  useEffect(() => {
    if (newUser === false) {
      navigation.replace("Login")
    }
  },[newUser])

  const doneButton = ({ ...props }) => {
    return (
      <TouchableOpacity
          style={tw`bg-white py-3 px-5 rounded-lg mr-4 shadow`} // Example styling
          {...props} // Pass props down for default behavior if needed
      >
        <Text style={tw`text-indigo-600 font-bold text-base`}>Get Started</Text>
      </TouchableOpacity>
    );
  };

  // --- Skip Button --- (Optional but recommended)
   const skipButton = ({ ...props }) => {
    return (
      <TouchableOpacity
          style={tw`py-3 px-5 ml-4`}
          {...props}
       >
        <Text style={tw`text-gray-600 font-medium text-base`}>Skip</Text>
      </TouchableOpacity>
    );
  };

  function onDoneHandler() {
    navigation.replace("Login"); // Use replace to prevent going back to onboarding
    setNewUser(false);
    AsyncStorage.setItem("newUser", JSON.stringify(false));
  }

  return (
    <View style={styles.container}>
      <Onboarding
        DoneButtonComponent={doneButton}
        SkipButtonComponent={skipButton} // Add skip button
        onDone={onDoneHandler}
        onSkip={onDoneHandler} // Skip also goes to Login/saves status
        containerStyles={{ paddingHorizontal: 15 }}
        titleStyles={tw`text-2xl font-bold text-gray-800 mb-2 text-center`} // Example title style
        subTitleStyles={tw`text-base text-gray-600 px-4 text-center`} // Example subtitle style
        pages={[
          // --- Page 1: Welcome & Scope ---
          {
            backgroundColor: "#E0F2FE", // Light Sky Blue (Example)
            image: (
              <LottieView
               
                source={require("../assets/animations/remote.json")} // <--- REPLACE PATH
                autoPlay
                loop
                style={styles.lottie}
              />
            ),
            title: "Your Software Journey Starts Here",
            subtitle:
              "Explore courses in Frontend, Backend & Fullstack Software Engineering and more.",
          },
          // --- Page 2: Learning Method & Value ---
          {
            backgroundColor: "#FEF3C7", 
            image: (
              <LottieView
                
                source={require("../assets/animations/mobile_dev.json")} // <--- REPLACE PATH
                autoPlay
                loop
                style={styles.lottie}
              />
            ),
            title: "Learn Practical, In-Demand Skills",
            subtitle:
              "Master coding through hands-on projects, interactive lessons, and expert guidance.",
          },
          // --- Page 3: Outcome & Motivation ---
          {
            backgroundColor: "#EDE9FE", // Light Purple (Example)
            image: (
              <LottieView
               
                source={require("../assets/animations/jobSuccess.json")} // <--- REPLACE PATH
                autoPlay
                loop
                style={styles.lottie}
              />
            ),
            title: "Code Your Career Path",
            subtitle:
              "Gain the confidence and skills needed to build projects and advance in the tech industry.",
          },
        ]}
      />
    </View>
  );
};
// ... rest of the component and styles ...

// --- Updated Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  lottie: {
    width: width * 0.9, // Keep width relative
    height: height * 0.4, // Adjust height relative to screen
    marginBottom: 20, // Add some margin below animation
  },
});

export default OnboardingScreen;