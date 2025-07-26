import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform, // Import Platform
} from "react-native";
import { useContext, useEffect, useState } from "react";
import StoreContext from "../context/storeContext";
import _ from "lodash";
import tw from "twrnc";
import Toast from "react-native-toast-message";
import { Image } from "expo-image";

const CourseScreen = ({ navigation }) => {
  const {
    isLoading,
    getAllCourses,
    isAuth,
    userCountry,
    setUserCountry,
    formatPrice,
    setGlobalCurrency,
    setIsLoading,
    setWallet
  } = useContext(StoreContext);
  const [sortedCourses, setSortedCourses] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true); // State for location loading
  const [locationErrorMsg, setLocationErrorMsg] = useState(null); // State for location errors
  const [refreshing, setRefreshing] = useState(false);

   const IP_INFO_KEY = process.env.EXPO_PUBLIC_IP_INFO_KEY;

  const onRefresh = async () => {
    setRefreshing(true);
    // fetch data
    setIsLoading(true);
    fetchAllcourses();
    setIsLoading(false);
    setRefreshing(false);
  };

  // --- Function to fetch location and country ---
  const fetchLocationAndCountry = async () => {
    setLocationLoading(true);
    setLocationErrorMsg(null); // Reset error message

    // Request permissions
    try {
      const response = await fetch(`https://api.ipinfo.io/lite/me?token=${IP_INFO_KEY}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.log(
          `Error fetching country: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
        return;
      }
      const {country_code} = await response.json();


      if (country_code.length > 0) {
        // Check for Nigeria (ISO country code 'NG')
        if (country_code.trim() == "NG") {
          setUserCountry("ngn");
          setWallet("ngn");
          setGlobalCurrency("ngn"); //set global currency for waalet section and payment on the app
        } else {
          setUserCountry("usd"); // Default to USD for other countries
          setWallet("usd");
          setGlobalCurrency("usd"); //set global currency for waalet section and payment on the app
        }
        // You can also store the full address if needed: console.log(geocode[0]);
      } else {
        setUserCountry("usd"); // Default to USD if geocoding fails
        setGlobalCurrency("usd"); //set global currency for waalet section and payment on the app
        console.warn("Could not determine country from location.");
      }
    } catch (error) {
      setLocationErrorMsg("Error fetching location or country");
      setUserCountry("usd"); // Default to USD on error
      setGlobalCurrency("usd"); //set global currency on the app
      console.error("Location Error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch courses (can run in parallel or after location)
  async function fetchAllcourses() {
    const courses = await getAllCourses();
    if (courses) {
      const lodashSortedCourses = _.orderBy(courses, ["id"], ["asc"]);
      setSortedCourses(lodashSortedCourses);
    }
  }

  useEffect(() => {
    if (!isAuth) {
      return;
    }

    // Fetch location first
    fetchLocationAndCountry();

    // Fetch all courses
    fetchAllcourses();
  }, [isAuth]); // Rerun if auth status changes

  // --- Loading State Handling ---
  // Show spinner if courses OR location are still loading
  if (
    isLoading ||
    locationLoading ||
    (sortedCourses.length === 0 && !isLoading)
  ) {
    // Adjusted condition to handle empty course list better
    let loadingText = "Loading courses...";
    if (locationLoading) loadingText = "Loading courses...";
    if (isLoading) loadingText = "Loading courses..."; // Course loading takes precedence

    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color={tw.color("purple-600")} />
        <Text style={tw`mt-2 text-gray-600`}>{loadingText}</Text>
        {locationErrorMsg && (
          <Text style={tw`mt-2 text-red-600`}>{locationErrorMsg}</Text>
        )}
      </View>
    );
  }


  // --- Render Course Item ---
  const renderCourse = ({ item }) => (
    <View style={tw`bg-white rounded-xl shadow-md overflow-hidden m-2 p-4`}>
      <View>
        <Image
          source={item.imageUrl}
          style={tw`w-full h-48 rounded-t-xl`}
          contentFit="cover"
          transition={300}
        />
      </View>

      <View style={tw`p-4`}>
        <Text style={tw`text-xl font-bold text-gray-800 mt-2 mb-1`}>
          {item.title}
        </Text>
        <Text style={tw`text-gray-600 text-sm mb-2`}>{item.description}</Text>
        <Text style={tw`text-lg font-bold text-purple-700 mb-4`}>
          Price:{" "}
          {formatPrice(userCountry === "ngn" ? item.price : item.usdPrice)}
        </Text>
        <TouchableOpacity
          style={tw`mt-auto bg-purple-600 p-3 rounded-lg items-center`}
          onPress={() =>
            navigation.navigate("CourseDetail", { courseId: item.id })
          }
        >
          <Text style={tw`text-white text-center font-semibold`}>
            View more
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Main Return ---
  return (
    <View style={tw`flex-1 bg-gray-100 p-4`}>
      <Text style={tw`text-3xl font-bold mb-4`}>Courses</Text>
      {/* Optionally show location error message here as well if needed */}
      {locationErrorMsg && !locationLoading && (
        <Text style={tw`text-center text-red-600 mb-2`}>
          {locationErrorMsg}
        </Text>
      )}
      <FlatList
        data={sortedCourses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCourse}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={tw`pb-4`}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
};

export default CourseScreen;

// Stylesheet remains the same
const styles = StyleSheet.create({});
