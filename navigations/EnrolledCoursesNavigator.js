import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import EnrolledCourseScreen from "../screens/EnrolledCourseScreen";
import EnrolledCourseDetailScreen from "../components/EnrolledCourseDetailScreen"; // Adjust path

const Stack = createStackNavigator();

export default function EnrolledCoursesNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EnrolledCourseList" // Different name
        component={EnrolledCourseScreen}
        options={{ title: "My Courses" }}
      />
      <Stack.Screen
        name="EnrolledCourseDetail"
        component={EnrolledCourseDetailScreen}
        options={{ title: "My Course Content" }}
      />
    </Stack.Navigator>
  );
}
