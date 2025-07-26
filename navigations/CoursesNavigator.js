import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import CourseScreen from "../screens/CourseScreen";
import CourseDetailScreen from "../components/CourseDetailScreen"; // Adjust path if needed

const Stack = createStackNavigator();

export default function CoursesNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CourseList" // Different name than Tab
        component={CourseScreen}
        options={{ title: "All Courses" }} // Example Header Title
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{ title: "Course Details" }} // Example Header Title
        // Options can be dynamic based on route params
        // options={({ route }) => ({ title: route.params.courseTitle })}
      />
    </Stack.Navigator>
  );
}
