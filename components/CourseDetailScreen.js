import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView, // Added ScrollView for the header content
} from "react-native";
import { useRoute } from "@react-navigation/native";
import tw from "twrnc";
import StoreContext from "../context/storeContext";

const CourseDetailScreen = ({ navigation }) => {
  const {
    getOneCourse,
    isLoading,
    setIsLoading,
    registerCourse,
    userCountry,formatPrice
  } = useContext(StoreContext);
  const [course, setCourse] = useState(null);
  const [sortedLessons, setSortedLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const route = useRoute();
  //get course id from params
  const { courseId } = route.params;

  //functions

  useEffect(() => {
    async function fetchCourse() {
      setIsLoading(true);
      const data = await getOneCourse(courseId);
      setCourse(data);
      setSortedLessons(data.lessons.sort((a, b) => a.id - b.id));
      setIsLoading(false);
    }
    //fetch course from server
    fetchCourse();
    // setIsLoading(false);
  }, [courseId]);

  const filteredLessons = sortedLessons.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lessonsToDisplay = searchQuery.trim() ? filteredLessons : sortedLessons;

  if (isLoading || !course) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-100`}>
        <ActivityIndicator size="large" color={tw.color("purple-600")} />
        <Text style={tw`mt-2 text-gray-600`}>Loading Course Details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-gray-50`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
    >
      <ScrollView style={tw`flex-1 bg-white p-4`}>
        {/* Course Header Section */}
        <View style={tw`mt-8 mb-6`}>
          <Text style={tw`text-4xl font-extrabold text-gray-900 leading-tight`}>
            {course.title}
          </Text>
          <Text style={tw`text-lg mt-3 text-gray-700 leading-relaxed`}>
            {course.description}
          </Text>
          <Text style={tw`text-xl font-bold mt-4 text-purple-700`}>
            Price:{" "}
            {formatPrice(
              userCountry === "ngn" ? course.price : course.usdPrice
            )}
          </Text>
        </View>

        {/* Enroll Button */}
        <TouchableOpacity
          style={tw`mt-4 bg-purple-600 p-4 rounded-xl shadow-md`} // Changed color, increased padding, more rounded, added shadow
          onPress={() => {
            /* Register Course Function */
            registerCourse(courseId);
          }}
        >
          <Text style={tw`text-white text-center font-bold text-lg`}>
            Enroll Now
          </Text>
        </TouchableOpacity>

        {/* Search Input */}
        <TextInput
          style={tw`mt-8 mb-6 p-3 border border-gray-300 rounded-xl text-gray-800 bg-white shadow-sm`} // Border color, rounded, subtle shadow, background
          placeholder="Search lessons..."
          placeholderTextColor={tw.color("gray-500")} // Add placeholder color
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Lessons List Header */}
        <Text style={tw`text-2xl font-bold text-gray-900 mb-4`}>
          Course Lessons
        </Text>

        {lessonsToDisplay.length > 0 ? (
          <FlatList
            data={lessonsToDisplay}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View
                style={tw`flex-row items-center p-4 mb-4 bg-white rounded-lg shadow-sm border border-gray-200`}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={tw`w-24 h-24 rounded-md mr-4 shadow-xs`} // Slightly larger, rounded, tiny shadow
                    resizeMode="cover" // Ensure image covers the space
                  />
                ) : (
                  // Optional: Placeholder view or icon if no image
                  <View
                    style={tw`w-24 h-24 rounded-md mr-4 bg-gray-200 justify-center items-center`}
                  >
                    <Text style={tw`text-gray-500 text-center text-xs`}>
                      No Image
                    </Text>
                  </View>
                )}

                <View style={tw`flex-1`}>
                  <Text style={tw`text-lg font-bold text-gray-800 mb-1`}>
                    {item.title}
                  </Text>
                  <Text style={tw`text-sm text-gray-600`}>
                    {item.description}
                  </Text>
                </View>
              </View>
            )}
          />
        ) : (
          <View
            style={tw`p-4 bg-yellow-100 border border-yellow-300 rounded-md`}
          >
            <Text style={tw`text-yellow-800 text-center`}>
              No lessons found matching your search.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CourseDetailScreen;
