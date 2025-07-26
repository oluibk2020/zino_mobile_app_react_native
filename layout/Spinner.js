import { StyleSheet, Text, View, Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

const Spinner = () => {
  return (
    <View style={styles.overlay}>
      <BlurView intensity={80} tint="dark" style={styles.card}>
        <LottieView
          source={require("../assets/animations/spinner.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.text}>Loading...</Text>
      </BlurView>
    </View>
  );
};

export default Spinner;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 9999,
  },
  card: {
    width: width * 0.6,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  lottie: {
    width: 100,
    height: 100,
  },
  text: {
    marginTop: 15,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
