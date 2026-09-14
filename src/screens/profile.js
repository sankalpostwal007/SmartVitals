import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

const Profile = ({ navigation }) => {

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    let data = {
      email: user.email,
      username: user.displayName || 'User',
    };

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      data = { ...data, ...userDoc.data() };
    }

    setUserData(data);
    setLoading(false);
  };

  useFocusEffect(
  useCallback(() => {
    fetchUserData();
  }, [])
);

  const handleSignOut = async () => {
    await auth.signOut();
    navigation.replace('Login');
  };

  const calculateBMI = (h, w) => {
    if (!h || !w) return "N/A";
    return (w / ((h / 100) ** 2)).toFixed(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const bmi = calculateBMI(userData?.height, userData?.weight);

  return (
    <SafeAreaProvider>
         <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

      <Text style={styles.heading}>Profile</Text>

      {/* ✅ AVATAR */}
      <TouchableOpacity onPress={() => navigation.navigate("AvatarSelect")}>
        <Image
          source={avatars[userData?.avatarIndex || 0]}
          style={styles.avatar}
        />
      </TouchableOpacity>

      {/* ✅ BASIC INFO */}
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{userData?.username}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userData?.email}</Text>

        <Text style={styles.label}>Age</Text>
        <Text style={styles.value}>{userData?.age || "Not Set"}</Text>
      </View>

      {/* ✅ HEALTH INFO */}
      <View style={styles.card}>
        <Text style={styles.label}>Height</Text>
        <Text style={styles.value}>
          {userData?.height ? `${userData.height.toFixed(1)} cm` : "Not Set"}
        </Text>

        <Text style={styles.label}>Weight</Text>
        <Text style={styles.value}>
          {userData?.weight ? `${userData.weight.toFixed(1)} kg` : "Not Set"}
        </Text>

        <Text style={styles.label}>BMI</Text>
        <Text style={styles.value}>{bmi}</Text>
      </View>

      {/* ✅ EDIT PROFILE */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* ✅ SIGN OUT */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
      </ScrollView>
</View>
    </SafeAreaProvider>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  heading: { fontSize: 24, color: "#fff", textAlign: "center", marginBottom: 20 },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignSelf: "center",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  label: { color: "#aaa", fontSize: 13 },
  value: { color: "#fff", fontSize: 16, marginBottom: 10 },

  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  buttonText: { color: "#fff" },

  signOutButton: {
    backgroundColor: "#ff4d4d",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  signOutText: { color: "#fff" },
});