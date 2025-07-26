import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // Or your preferred icon library
import tw from "twrnc"; // For styling if needed

// Import the nested stack navigators
import DashboardNavigator from "./DashboardNavigator";
import CoursesNavigator from "./CoursesNavigator";
import EnrolledCoursesNavigator from "./EnrolledCoursesNavigator";
import WalletNavigator from "./WalletNavigator";
import GeneralNavigator from "./GeneralNavigator";
import ChatNavigator from "./ChatNavigator";

const Tab = createBottomTabNavigator();

// Define your primary colors here or import them
const ACTIVE_COLOR = "#6D28D9"; // Purple
const INACTIVE_COLOR = "#6B7280"; // Gray-500

export default function AppTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Headers are handled within each nested stack
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "DashboardTab") {
            // Match Tab Screen name
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "CoursesTab") {
            iconName = focused ? "search" : "search-outline"; // Example icon
          } else if (route.name === "MyCoursesTab") {
            iconName = focused ? "play-circle" : "play-circle-outline"; // Example icon
          } else if (route.name === "WalletTab") {
            iconName = focused ? "wallet" : "wallet-outline";
          } else if (route.name === "MenuTab") {
            iconName = focused ? "menu" : "menu-outline";
          } else if (route.name === "ChatTab") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          }
          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          // Add custom styles to the tab bar if needed
          // backgroundColor: 'white',
          // borderTopWidth: 0, // Example: remove top border
          // height: 60, // Example: custom height
        },
        tabBarLabelStyle: {
          // Add custom styles to the label if needed
          // fontSize: 12,
          // paddingBottom: 5, // Example: adjust padding
        },
      })}
    >
      {/* Define Tab Screens, using the nested stack components */}
      <Tab.Screen
        name="DashboardTab"
        component={DashboardNavigator}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesNavigator}
        options={{ tabBarLabel: "Browse" }} // Label for the tab
      />
      <Tab.Screen
        name="MyCoursesTab"
        component={EnrolledCoursesNavigator}
        options={{ tabBarLabel: "My Courses" }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletNavigator}
        options={{ tabBarLabel: "Wallet" }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{ tabBarLabel: "Chat" }}
      />
      <Tab.Screen
        name="MenuTab"
        component={GeneralNavigator}
        options={{ tabBarLabel: "Menu" }}
      />
    </Tab.Navigator>
  );
}
