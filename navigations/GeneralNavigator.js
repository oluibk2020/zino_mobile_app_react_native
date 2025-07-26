import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/ProfileScreen"; // Use the merged one
import LogOutScreen from "../screens/LogOutScreen";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import GameScreen from "../screens/GameScreen";
import GeneralMenuScreen from "../screens/GeneralMenuScreen";
import NexusGameScreen from "../components/NexusGameScreen";
import FourInARowGameScreen from "../components/FourInARowGameScreen";
import MemoryMatchGameScreen from "../components/MemoryMatchGameScreen";
import MoleManiaGameScreen from "../components/MoleManiaGameScreen";
// Import LogOutScreen or handle logout within ProfileScreen

const Stack = createStackNavigator();

export default function GeneralNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainMenuScreen" // Different name
        component={GeneralMenuScreen}
        options={{ title: "Menu" }}
      />
      <Stack.Screen
        name="GamesMainScreen" // Different name
        component={GameScreen}
        options={{ title: "Games" }}
      />
      <Stack.Screen
        name="NexusGame" // Different name
        component={NexusGameScreen}
        options={{ title: "Nexus Game" }}
      />
      <Stack.Screen
        name="FourInARowGame" // Different name
        component={FourInARowGameScreen}
        options={{ title: "Four In A Row Game" }}
      />
      <Stack.Screen
        name="MoleManiaGame" // Different name
        component={MoleManiaGameScreen}
        options={{ title: "Mole Mania Game" }}
      />
      <Stack.Screen
        name="MemoryMatchGame" // Different name
        component={MemoryMatchGameScreen}
        options={{ title: "Memory Match Game" }}
      />
      <Stack.Screen
        name="ProfileMain" // Different name
        component={ProfileScreen}
        options={{ title: "My Profile" }}
      />
      <Stack.Screen
        name="LogoutMain" // Different name
        component={LogOutScreen}
        options={{ title: "Logout" }}
      />
      <Stack.Screen
        name="PrivacyPolicyMain" // Different name
        component={PrivacyPolicyScreen}
        options={{ title: "Privacy Policy" }}
      />
      <Stack.Screen
        name="DeleteAccountMain" // Different name
        component={DeleteAccountScreen}
        options={{ title: "Delete Account" }}
      />

      {/* Add Settings, Logout, etc. screens if needed */}
      {/* <Stack.Screen name="Settings" component={SettingsScreen} /> */}
    </Stack.Navigator>
  );
}
