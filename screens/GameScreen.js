import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";

const GameScreen = () => {
  const navigation = useNavigation();

  // Component for an individual game card
  const GameCard = ({ title, description, navigateTo }) => (
    <TouchableOpacity
      style={tw`bg-white rounded-xl shadow-lg p-5 mb-6 mx-4 border border-purple-100`}
      onPress={() => navigation.navigate(navigateTo)}
    >
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <Text style={tw`text-2xl font-bold text-purple-800`}>{title}</Text>
        {/* Optional: Add a game-specific icon here */}
        {/* For example, using a simple emoji or an icon library if available */}
        <Text style={tw`text-3xl`}>🎮</Text>
      </View>
      <Text style={tw`text-gray-600 text-base mb-4`}>{description}</Text>
      <TouchableOpacity
        style={tw`bg-purple-600 py-3 px-5 rounded-lg shadow-md self-end`}
        onPress={() => navigation.navigate(navigateTo)}
      >
        <Text style={tw`text-white text-lg font-semibold text-center`}>
          Play Now
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={tw`flex-1 bg-purple-50`}>
      <View style={tw`p-6`}>
        <Text
          style={tw`text-4xl font-extrabold text-purple-900 mb-8 text-center`}
        >
          Zino Games
        </Text>

        <GameCard
          title="Nexus Game"
          description="A strategic puzzle game that challenges your mind with intricate connections."
          navigateTo="NexusGame"
        />
        <GameCard
          title="Four In A Row"
          description="Connect four of your pieces in a row before your opponent does!"
          navigateTo="FourInARowGame"
        />
        <GameCard
          title="Memory Match"
          description="Test your memory skills by finding matching pairs in this classic game."
          navigateTo="MemoryMatchGame"
        />
        <GameCard
          title="Mole Mania"
          description="Whack the moles as fast as you can in this exciting arcade-style game!"
          navigateTo="MoleManiaGame"
        />

        {/* You can add more GameCard components here for future games */}
      </View>
    </ScrollView>
  );
};

export default GameScreen;