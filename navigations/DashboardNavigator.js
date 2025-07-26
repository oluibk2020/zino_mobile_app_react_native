import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import DashboardScreen from "../screens/DashboardScreen";
// Import other screens you might navigate to *from* the dashboard if any

const Stack = createStackNavigator();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardMain" // Use a different name than the Tab name
        component={DashboardScreen}
        options={{ headerShown: false }} // Dashboard likely doesn't need its own header
      />
      {/* Add other screens navigable from Dashboard here */}
      {/* Example: <Stack.Screen name="Notifications" component={NotificationScreen} /> */}  
    </Stack.Navigator>
  );
}
