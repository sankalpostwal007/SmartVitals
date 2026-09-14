import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { auth, db } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

const avatars = [
  require("../../assets/avatar1.png"),
  require("../../assets/avatar2.png"),
  require("../../assets/avatar3.png"),
  require("../../assets/avatar4.png"),
  require("../../assets/avatar5.png"),
  require("../../assets/avatar6.png"),
  require("../../assets/avatar7.png"),
  require("../../assets/avatar8.png"),
];

export default function AvatarSelect({ navigation }) {

  const selectAvatar = async (index) => {
    const user = auth.currentUser;

    await setDoc(
      doc(db, "users", user.uid),
      { avatarIndex: index },
      { merge: true }
    );

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {avatars.map((img, index) => (
        <TouchableOpacity key={index} onPress={() => selectAvatar(index)}>
          <Image source={img} style={styles.avatar} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#121212",
    flex: 1,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    margin: 10,
  },
});