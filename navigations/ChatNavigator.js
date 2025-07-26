import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ChatScreen from "../screens/ChatScreen";
// Import other screens you might navigate to *from* the dashboard if any

const Stack = createStackNavigator();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatMain" // Use a different name than the Tab name
        component={ChatScreen}
        options={{ headerShown: false }}
        // options={{ title: "Chat" }}
      />
      {/* Add other screens navigable from Dashboard here */}
      {/* Example: <Stack.Screen name="Notifications" component={NotificationScreen} /> */}
    </Stack.Navigator>
  );
}
