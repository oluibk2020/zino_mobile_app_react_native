import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  // Removed FlatList import, using ScrollView now
  KeyboardAvoidingView,
  Platform,
  ScrollView, // Added ScrollView
  StyleSheet, // Added StyleSheet
  Linking, // Added Linking
} from "react-native";
import { Video } from "expo-av";
import StoreContext from "../context/storeContext";
import tw from "twrnc";
import { Feather, Ionicons } from "@expo/vector-icons"; // Added Ionicons for resource icons
import Toast from "react-native-toast-message";

const VIDEO_HEIGHT = 220; // Slightly increased height?

// Keep MemoizedLessonItem as it is
const MemoizedLessonItem = React.memo(
  ({ item, selectedLessonId, handleLessonChange }) => {
    const isSelected = item.id === selectedLessonId;
    return (
      <TouchableOpacity
        onPress={() => handleLessonChange(item)}
        // Apply margin directly, no longer needs px-4 from FlatList header
        style={tw`mx-4 mb-2 p-4 rounded-xl flex-row items-center ${
          isSelected ? "bg-purple-600" : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        <View style={tw`flex-1`}>
          <Text
            style={tw`font-semibold text-lg ${
              isSelected ? "text-white" : "text-gray-900 dark:text-white"
            }`}
          >
            {item.title}
          </Text>
          <Text
            style={tw`text-sm ${
              isSelected ? "text-gray-200" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {item.description.slice(0, 70)}
            {item.description.length > 70 && "..."}
          </Text>
        </View>
        <Feather
          name="play-circle"
          size={24}
          color={isSelected ? "#fff" : "#4B5563"}
          style={tw`ml-2`}
        />
      </TouchableOpacity>
    );
  }
);

const EnrolledCourseDetailScreen = ({ route, navigation }) => {
  const { course, getOneEnrolledCourse } = useContext(StoreContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [sortedLessons, setSortedLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const searchInputRef = React.useRef(null);

  // *** State for Tabs ***
  const [activeTab, setActiveTab] = useState("lessons"); // 'lessons' or 'resources'

  const { courseId } = route.params;

  const fetchCourse = useCallback(async () => {
    // Added useCallback to stabilize function reference if needed elsewhere
    console.log("running from fetch course");
    setIsLoading(true);
    try {
      const data = await getOneEnrolledCourse(courseId);
      if (data && data.lessons) {
        const lessons = [...data.lessons].sort((a, b) => a.id - b.id); // Ensure sorting
        setSortedLessons(lessons);
        if (lessons.length > 0) {
          // If a lesson was already selected, keep it, otherwise select first
          const currentSelected = lessons.find(
            (l) => l.id === selectedLessonId
          );
          if (!currentSelected) {
            setSelectedLessonId(lessons[0].id);
            setSelectedLesson(lessons[0]);
          } else {
            // Refresh selected lesson data in case it changed
            setSelectedLesson(currentSelected);
          }
        } else {
          setSelectedLesson(null);
          setSelectedLessonId(null);
        }
      } else {
        setSortedLessons([]);
        setSelectedLesson(null);
        setSelectedLessonId(null);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not load course details.",
        });
      }
    } catch (error) {
      console.error("Fetch Course Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch course data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // Added selectedLessonId dependency

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCourse();
    setRefreshing(false);
  };

  // Clear query
  const clearSearchQuery = () => {
    setSearchQuery("");
  };

  useEffect(() => {
    console.log("running from useEffect");
    fetchCourse();
  }, []); // Depend on the memoized fetchCourse

  const handleLessonChange = (lesson) => {
    if (lesson?.id !== selectedLessonId) {
      // Only update if different lesson
      setSelectedLesson(lesson);
      setSelectedLessonId(lesson.id);
      setVideoLoading(true);
      clearSearchQuery(); // Clear search when changing lesson
      // Switch back to lessons tab automatically when a lesson is clicked
      setActiveTab("lessons");
    }
  };

  // --- Handlers for Resource Downloads ---
  const handleDownloadResource = useCallback(async (url, resourceType) => {
    if (!url) {
      Toast.show({
        type: "info",
        text1: "Not Available",
        text2: `The ${resourceType} resource link is missing.`,
      });
      return;
    }
    console.log(`Attempting to open ${resourceType} URL: ${url}`);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error(`Don't know how to open this URL: ${url}`);
        Toast.show({
          type: "error",
          text1: "Cannot Open Link",
          text2: `Unable to open the ${resourceType} link.`,
        });
      }
    } catch (error) {
      console.error(`Error opening ${resourceType} URL:`, error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Could not open the ${resourceType} link.`,
      });
    }
  }, []);

  // Filter lessons based on search query
  const filteredLessons = sortedLessons.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine which lessons to display based on whether search is active
  const lessonsToDisplay = searchQuery.trim() ? filteredLessons : sortedLessons;

  // Render Loading State
  if (isLoading && !selectedLesson) {
    // Show loading only if course data isn't available yet
    return (
      <View
        style={tw`flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900`}
      >
        <ActivityIndicator size="large" color={tw.color("purple-600")} />
      </View>
    );
  }

  // Handle case where course data loaded but is empty/invalid or no lessons
  if (course && !selectedLesson) {
    return (
      <View
        style={tw`flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 p-5`}
      >
        <Ionicons
          name="warning-outline"
          size={50}
          color={tw.color("orange-500")}
        />
        <Text
          style={tw`text-lg text-center text-gray-600 dark:text-gray-300 mt-4`}
        >
          Could not load lesson details or course has no lessons. Please go back
          and try again.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("EnrolledCourseList")}
          style={tw`mt-6 py-2 px-4 bg-purple-600 rounded-lg`}
        >
          <Text style={tw`text-white font-semibold`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // Adjust offset if needed, especially if header is present in the stack navigator
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
    >
      <View style={tw`flex-1 bg-white dark:bg-gray-900`}>
        {/* Fixed Video Player */}
        <View style={tw`w-full bg-black relative`}>
          {/* Show loading indicator only when video is loading AND a lesson is selected */}
          {videoLoading && selectedLesson && (
            <View
              style={[
                tw`absolute z-10 w-full justify-center items-center bg-black/70`,
                { height: VIDEO_HEIGHT },
              ]}
            >
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={tw`text-white mt-2`}>Loading video...</Text>
            </View>
          )}
          {selectedLesson?.videoUrl ? (
            <Video
              source={{ uri: selectedLesson.videoUrl }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="contain" // Or "cover"
              shouldPlay // Auto-play when lesson changes
              useNativeControls
              onLoadStart={() => setVideoLoading(true)} // Ensure loading starts
              onLoad={() => setVideoLoading(false)} // Hide loading when ready
              onError={(e) => {
                Toast.show({
                  type: "error",
                  text1: "Video Error",
                  text2: "Failed to load video. Pull down to refresh.",
                  position: "bottom",
                });
                console.log("Video error:", e);
                setVideoLoading(false);
              }}
              style={[tw`w-full bg-black`, { height: VIDEO_HEIGHT }]} // Use constant height
            />
          ) : (
            <View
              style={[
                tw`w-full bg-black items-center justify-center`,
                { height: VIDEO_HEIGHT },
              ]}
            >
              <Ionicons name="videocam-off-outline" size={50} color="gray" />
              <Text style={tw`text-gray-400 mt-2`}>Video not available</Text>
            </View>
          )}
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tw.color("purple-600")}
            />
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={tw`pb-24`} // Add padding bottom for content inset
        >
          {/* Course/Lesson Info Header */}
          <View style={tw`px-4 pt-4`}>
            <Text style={tw`text-2xl font-bold text-gray-900 dark:text-white`}>
              {course?.title || "Course Title"} {/* Use optional chaining */}
            </Text>
            <Text style={tw`text-xl mt-2 text-gray-800 dark:text-gray-200`}>
              {selectedLesson?.title || "Lesson Title"}
            </Text>
            <Text
              style={tw`text-sm mt-1 mb-4 text-gray-600 dark:text-gray-400`}
            >
              {selectedLesson?.description || "Lesson description."}
            </Text>

            {/* Previous / Next Buttons */}
            <View style={tw`flex-row justify-between mb-4`}>
              {/* Previous Button */}
              <TouchableOpacity
                disabled={
                  isLoading ||
                  refreshing ||
                  selectedLessonId === sortedLessons[0]?.id
                }
                onPress={() => {
                  const currentIndex = sortedLessons.findIndex(
                    (l) => l.id === selectedLessonId
                  );
                  if (currentIndex > 0)
                    handleLessonChange(sortedLessons[currentIndex - 1]);
                }}
                style={tw`px-4 py-2 rounded-lg flex-row items-center ${
                  selectedLessonId === sortedLessons[0]?.id || isLoading
                    ? "bg-gray-300 dark:bg-gray-600"
                    : "bg-gray-700 dark:bg-gray-500"
                }`}
              >
                <Ionicons name="chevron-back" size={18} color="white" />
                <Text style={tw`text-white text-sm ml-1`}>Previous</Text>
              </TouchableOpacity>

              {/* Next Button */}
              <TouchableOpacity
                disabled={
                  isLoading ||
                  refreshing ||
                  selectedLessonId ===
                    sortedLessons[sortedLessons.length - 1]?.id
                }
                onPress={() => {
                  const currentIndex = sortedLessons.findIndex(
                    (l) => l.id === selectedLessonId
                  );
                  if (currentIndex < sortedLessons.length - 1)
                    handleLessonChange(sortedLessons[currentIndex + 1]);
                }}
                style={tw`px-4 py-2 rounded-lg flex-row items-center ${
                  selectedLessonId ===
                    sortedLessons[sortedLessons.length - 1]?.id || isLoading
                    ? "bg-purple-300 dark:bg-purple-800 opacity-60"
                    : "bg-purple-600 dark:bg-purple-500"
                }`}
              >
                <Text style={tw`text-white text-sm mr-1`}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- Tab Bar --- */}
          <View
            style={tw`flex-row justify-around my-3 border-b border-gray-200 dark:border-gray-700 mx-4`}
          >
            {/* Lessons Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab("lessons")}
              style={tw`py-3 border-b-2 ${
                activeTab === "lessons"
                  ? "border-purple-600"
                  : "border-transparent"
              }`}
            >
              <Text
                style={tw`text-base ${
                  activeTab === "lessons"
                    ? "font-bold text-purple-600 dark:text-purple-400"
                    : "font-medium text-gray-500 dark:text-gray-400"
                }`}
              >
                Lessons
              </Text>
            </TouchableOpacity>

            {/* Resources Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab("resources")}
              style={tw`py-3 border-b-2 ${
                activeTab === "resources"
                  ? "border-purple-600"
                  : "border-transparent"
              }`}
            >
              <Text
                style={tw`text-base ${
                  activeTab === "resources"
                    ? "font-bold text-purple-600 dark:text-purple-400"
                    : "font-medium text-gray-500 dark:text-gray-400"
                }`}
              >
                Resources
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- Conditional Content Area --- */}
          <View style={tw`mt-4`}>
            {activeTab === "lessons" && (
              <View>
                {/* Search Bar */}
                <View style={tw`px-4 mb-4 relative flex-row items-center`}>
                  <TextInput
                    ref={searchInputRef}
                    placeholder="Search lessons in this course..."
                    placeholderTextColor={tw.color("gray-500")}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={tw`flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 pr-10`}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={clearSearchQuery}
                      style={tw`absolute right-6 top-3 p-1`}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={tw.color("gray-500")}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Lesson Items - Render using map */}
                {lessonsToDisplay.length > 0 ? (
                  lessonsToDisplay.map((item) => (
                    <MemoizedLessonItem
                      key={item.id} // Key needed for map
                      item={item}
                      selectedLessonId={selectedLessonId}
                      handleLessonChange={handleLessonChange}
                    />
                  ))
                ) : (
                  <Text
                    style={tw`text-center text-gray-500 dark:text-gray-400 mt-5`}
                  >
                    {searchQuery.trim()
                      ? "No lessons match your search."
                      : "No lessons available."}
                  </Text>
                )}
              </View>
            )}

            {activeTab === "resources" && (
              <View style={tw`px-4 mt-2`}>
                <Text
                  style={tw`text-xl font-bold text-gray-900 dark:text-white mb-4`}
                >
                  Downloadable Resources
                </Text>
                {/* Download Codes Button */}
                {course?.codeUrl ? (
                  <TouchableOpacity
                    onPress={() =>
                      handleDownloadResource(course.codeUrl, "Code")
                    }
                    style={[
                      styles.resourceButton,
                      tw`bg-blue-600 dark:bg-blue-500 mb-3`,
                    ]}
                  >
                    <Ionicons
                      name="code-slash-outline"
                      size={20}
                      color="white"
                      style={tw`mr-2`}
                    />
                    <Text style={styles.resourceButtonText}>
                      Download Codes (.zip)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.resourceButton,
                      tw`bg-gray-300 dark:bg-gray-700 mb-3 opacity-60`,
                    ]}
                  >
                    <Ionicons
                      name="code-slash-outline"
                      size={20}
                      color={tw.color("gray-600 dark:gray-400")}
                      style={tw`mr-2`}
                    />
                    <Text style={styles.resourceButtonTextDisabled}>
                      Code Archive Not Available
                    </Text>
                  </View>
                )}

                {/* Download PDF Button */}
                {course?.pdfUrl ? (
                  <TouchableOpacity
                    onPress={() => handleDownloadResource(course.pdfUrl, "PDF")}
                    style={[
                      styles.resourceButton,
                      tw`bg-red-600 dark:bg-red-500`,
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="white"
                      style={tw`mr-2`}
                    />
                    <Text style={styles.resourceButtonText}>
                      Download PDF Notes
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.resourceButton,
                      tw`bg-gray-300 dark:bg-gray-700 opacity-60`,
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={tw.color("gray-600 dark:gray-400")}
                      style={tw`mr-2`}
                    />
                    <Text style={styles.resourceButtonTextDisabled}>
                      PDF Notes Not Available
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Footer Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("EnrolledCourseList")} // Go back instead of specific screen? Or navigate('EnrolledCourseList')
            style={tw`mt-8 mb-6 mx-4 py-3 px-6 bg-gray-800 dark:bg-gray-700 rounded-lg items-center`}
          >
            <Text style={tw`text-white text-center text-base font-semibold`}>
              Go Back
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Styles for download buttons for better readability
  resourceButton: tw`flex-row items-center justify-center rounded-lg px-5 py-3 shadow`,
  resourceButtonText: tw`text-white text-base font-bold text-center`,
  resourceButtonTextDisabled: tw`text-gray-600 dark:text-gray-400 text-base font-bold text-center`,
});

export default EnrolledCourseDetailScreen;
