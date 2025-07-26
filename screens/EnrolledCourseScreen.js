import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from "react-native";
import { useContext, useEffect, useState } from "react";
import Spinner from "../layout/Spinner";
import StoreContext from "../context/storeContext";
import _ from "lodash";
import tw from "twrnc";
import Toast from "react-native-toast-message";

const EnrolledCourseScreen = ({ navigation }) => {
  const { enrolledCourses, getAllEnrolledCourses, isLoading, setIsLoading } =
    useContext(StoreContext);

  useEffect(() => {
    //function to get book
    async function fetchCourse() {
      setIsLoading(true);
      const data = await getAllEnrolledCourses();
      setIsLoading(false);
    }

    // console.log("running from enrolled course screen", enrolledCourses[0].startDate);
    //call function to get book
    fetchCourse();
    setIsLoading(false);
  }, []);

  if (isLoading) {
     return (
       <View style={tw`flex-1 justify-center items-center bg-gray-100`}>
         <ActivityIndicator size="large" color={tw.color("purple-600")} />
       </View>
     );
  }

  const renderCourse = ({ item }) => (
    <View style={tw`bg-white shadow-lg rounded-lg overflow-hidden m-2 p-4`}>
      <Image
        source={{ uri: item.course.imageUrl }}
        style={tw`w-full h-48 rounded-t-xl`}
        resizeMode="cover"
      />
      <Text style={tw`text-xl font-bold text-gray-800 mt-2 mb-1`}>
        {item.course.title}
      </Text>
      <Text style={tw`text-gray-600 text-sm mb-3`}>
        {item.course.description}
      </Text>
      <Text style={tw`flex-row items-center mb-1`}>
        <Text style={tw`text-sm font-semibold text-green-700 mr-2`}>
          {"Enrolled: "}
        </Text>
        <Text style={tw`text-sm text-gray-600 flex-1`}>
          {" "}
          {new Date(item.startDate).toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          })}
        </Text>
      </Text>
      <Text style={tw`flex-row items-center mb-4`}>
        <Text style={tw`text-sm font-semibold text-red-700 mr-5`}>Ends:</Text>
        <Text style={tw`text-sm text-gray-600 flex-1`}>
          {" "}
          {new Date(item.endDate).toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          })}
        </Text>
      </Text>
      <TouchableOpacity
        style={tw`mt-auto bg-purple-600 p-3 rounded-lg items-center`}
        onPress={
          () =>
            navigation.navigate("EnrolledCourseDetail", {
              courseId: item.course.id,
            }) //navigate to enrolled course detail screen with course id
        }
      >
        <Text style={tw`text-white text-center font-semibold`}>
          Start Course
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={tw`flex-1 justify-center items-center bg-gray-100 p-6`}>
      <Text style={tw`text-3xl font-bold mb-4`}>Your Enrolled Courses</Text>
      {enrolledCourses.length === 0 ? (
        <Text className=" text-xl font-semibold text-purple-800 text-center mb-2">
          No enrolled course found!!! You are yet to enroll for a course.
          Empower yourself as you explore our wide range of courses.
        </Text>
      ) : (
        <FlatList
          data={enrolledCourses}
          keyExtractor={(item) => item.course.id.toString()}
          renderItem={renderCourse}
          // numColumns={2} // Adjust for responsiveness
          showsVerticalScrollIndicator={true}
        />
      )}
    </View>
  );
};
export default EnrolledCourseScreen;
const styles = StyleSheet.create({});
