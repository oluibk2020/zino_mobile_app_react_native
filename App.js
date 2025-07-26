import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
// import AppNavigator from "./navigation";
import { StoreProvider } from "./context/storeContext";
import Toast from "react-native-toast-message";
import { NavigationContainer } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import RootNavigator from "./navigations/RootNavigator";

//expo notifications
import * as Notifications from "expo-notifications";
import { set } from "lodash";

// Register for push notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});



export default function App() {

  const [localNotificationData, setLocalNotificationData] = useState(null);
   const [notificationListener, setNotificationListener] = useState(undefined);
   const [responseListener, setResponseListener] = useState(undefined);

   useEffect(() => {
    //when notification comes into the app
     const newNotificationListener =
       Notifications.addNotificationReceivedListener((notification) => {
         setLocalNotificationData({
           title: notification.request.content.title,
           body: notification.request.content.body,
           screenTab: notification.request.content.data.screenTab,
           screenName: notification.request.content.data.screenName,
         });
        //  console.log(notification.request.content.title);
        //  console.log(notification.request.content.body);
        //  console.log(notification.request.content.data.screenUri);
       });
     setNotificationListener(newNotificationListener);

     //when user tap on notification
     const newResponseListener =
       Notifications.addNotificationResponseReceivedListener((response) => {
         setLocalNotificationData({
           title: response.notification.request.content.title,
           body: response.notification.request.content.body,
           screenTab: response.notification.request.content.data.screenTab,
           screenName: response.notification.request.content.data.screenName,
         })
       });
     setResponseListener(newResponseListener);

     return () => {
       if (notificationListener) {
         Notifications.removeNotificationSubscription(notificationListener);
       }
       if (responseListener) {
         Notifications.removeNotificationSubscription(responseListener);
       }
     };
   }, []);

   


  return (
    <>
      <StatusBar style="auto" />
      {/* Set status bar style (auto, light, dark) */}
      <NavigationContainer>
        <StoreProvider>
          <LinearGradient
            colors={["#FFFFFF", "#F0F4F8"]} // Example: Lighter gradient if needed
            // colors={["#6D28D9", "#009eff", "#F59E0B"]}
            style={styles.rootScreen}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Render the RootNavigator */}
            <RootNavigator props={localNotificationData} />
          </LinearGradient>
        </StoreProvider>
      </NavigationContainer>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  rootScreen: {
    flex: 1, //fixes height to full device height
  },
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    color: "black",
    fontSize: 24,
    fontWeight: "bold",
    paddingVertical: 26,
  },
});
