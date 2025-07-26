import  {useContext} from "react";
import StoreContext from "../context/storeContext";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import Toast from "react-native-toast-message";

// --- Google Auth---
import {
  GoogleSignin,
} from "@react-native-google-signin/google-signin";

const LogOutScreen = ({ navigation }) => {
 const {
   setIsAuth,
   setNewUser,
   isBiometricAvailable,
   setIsBiometricAvailable,
   BIOMETRIC_ENABLED_KEY,
   setIsBiometricEnabled,
   isBiometricEnabled,
 } = useContext(StoreContext);

 const handleLogout = async () => {
  Toast.show({
    type: "success", // 'success' | 'error' | 'info'
    text1: "Logging Out", // title
    text2: "You are being logged out...", //msg body
    position: "top", // 'top' | 'bottom'
  });

  


  const [result1, result2, result3] = await Promise.all([
    AsyncStorage.removeItem("userToken"),
    AsyncStorage.setItem("newUser", JSON.stringify(false)),
    GoogleSignin.signOut() //sign out google
  ]);

  //reset biometric
  if (isBiometricAvailable && isBiometricEnabled) {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
    setIsBiometricEnabled(false);
  }
  setNewUser(false)
  setIsAuth(false);
 };

 return (
   <View style={tw`flex-1 justify-center items-center bg-gray-100 p-6`}>
     <Text style={tw`text-2xl font-bold mb-6`}>
       Are you sure you want to log out?
     </Text>
     <TouchableOpacity
       style={tw`w-full bg-red-500 p-3 rounded-lg mb-4`}
       onPress={handleLogout}
     >
       <Text style={tw`text-white text-center text-lg font-semibold`}>
         Log Out
       </Text>
     </TouchableOpacity>
     <TouchableOpacity onPress={() => navigation.goBack()}>
       <Text style={tw`text-purple-500`}>Cancel</Text>
     </TouchableOpacity>
   </View>
 );
};

export default LogOutScreen;
