import 'react-native-gesture-handler'; // MUST be at the top
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer ,DefaultTheme, DarkTheme} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'react-native';
import './src/config/firebase';
import React, { useEffect } from 'react';
import { Image } from "react-native";
import { TouchableOpacity } from 'react-native';
import { LogBox } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import Splash from './src/screens/Splash';
import Dashboard from './src/screens/dashboard';
import Profile from './src/screens/profile';
import Login from './src/screens/Login';
import SignUp from './src/screens/SignUp';
import BmiScreen from './src/screens/BmiScreen';
import PersonalDetails from './src/screens/PersonalDetails';
import Heartrate from './src/screens/Heartrate';
import Spo2 from './src/screens/spo2';
import Steps from './src/screens/Steps';
import EditProfile from './src/screens/EditProfile';
import BLEScreen from './src/screens/BLEScreen';
import AvatarSelect from './src/screens/AvatarSelect';


// Screen names
const homeName = "Dashboard";
const profileName = "Profile";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bottom Tabs
const MainTabs = () => {
  const insets = useSafeAreaInsets(); // Safe area for bottom

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          if (route.name === homeName) {
            icon = require("./assets/heart.png");
          } else if (route.name === profileName) {
            icon = require("./assets/smart-watch.png");
          }
          return (
            <Image
              source={icon}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          );
        },
        tabBarStyle: {
          backgroundColor: "#202020",
          height: 70 + insets.bottom, // add safe area at bottom
          paddingBottom: insets.bottom, // avoids phone navigation overlap
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "grey",
        headerStyle: { backgroundColor: "#202020" },
        headerTitleStyle: { color: "white", fontSize: 20 },
        headerTitleAlign: 'left',
      })}
    >
      <Tab.Screen name={homeName} component={Dashboard} options={{ title: "SmartVitals" }} />
      <Tab.Screen name={profileName} component={Profile} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
};


// Main App
const App = () => {
  const [fontsLoaded] = useFonts({
    WorkSansExtraBoldItalic: require('./assets/fonts/WorkSans-ExtraBoldItalic.ttf'),
  });

  LogBox.ignoreAllLogs(true);
  // Show loading spinner until font is ready
  if (!fontsLoaded) {
    return null;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false, unmountOnBlur: true }} />
        <Stack.Screen name="PersonalDetails" component={PersonalDetails} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="BLEScreen" component={BLEScreen} options={{ headerShown: false }} />
        <Stack.Screen
  name="BmiScreen"
  component={BmiScreen}
  options={{
    title: "BMI Tracker",
    headerStyle: { backgroundColor: "#202020" },
    headerTintColor: "white",
  }}
/>
        <Stack.Screen name="Heartrate" component={Heartrate} options={{ headerShown: true,
    title: 'Heartrate',
    headerStyle: { backgroundColor: "#202020" },
    headerTitleStyle: { color: "white", fontSize: 20 },
    headerTintColor: "white",   }}/>
    <Stack.Screen name="Spo2" component={Spo2} options={{ headerShown: true,
    title: 'SPO2',
    headerStyle: { backgroundColor: "#202020" },
    headerTitleStyle: { color: "white", fontSize: 20 },
    headerTintColor: "white",   }}/>
    <Stack.Screen name="Steps" component={Steps} options={{ headerShown: true,
    title: 'Steps',
    headerStyle: { backgroundColor: "#202020" },
    headerTitleStyle: { color: "white", fontSize: 20 },
    headerTintColor: "white",   }}/>
        <Stack.Screen name="EditProfile" component={EditProfile} options={{
    headerShown: true,
    title: 'Edit Profile',
    headerStyle: { backgroundColor: "#202020" },
    headerTitleStyle: { color: "white", fontSize: 20 },
    headerTintColor: "white",                         
  }}/> 
  <Stack.Screen name="AvatarSelect" component={AvatarSelect} options={{
    headerShown: true,
    title: 'Edit Profile',
    headerStyle: { backgroundColor: "#202020" },
    headerTitleStyle: { color: "white", fontSize: 20 },
    headerTintColor: "white",                         
  }} />     
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({});
