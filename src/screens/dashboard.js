
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, Timestamp, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Circle } from "react-native-svg";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import useBLE from '../screens/BleManager'; // 🔥 IMPORTANT
import { useRef } from "react";



const Dashboard = () => {

  const {
  devices,
  connectedDevice,
  deviceData, // 🔥 ADD THIS LINE
  startScan,
  connectToDevice,
  disconnectDevice
} = useBLE();

  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [height, setHeight] = useState(null);
  const [weight, setWeight] = useState(null);
  const [bmi, setBmi] = useState(null);
const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // 🔥 CHANGE: start with 0 (not static 3200)
  const [steps, setSteps] = useState(0);

  const [heartRate, setHeartRate] = useState(null);
  const [spo2, setSpo2] = useState(null);

  const [goal, setGoal] = useState(50);
  const [editVisible, setEditVisible] = useState(false);
  const [newGoal, setNewGoal] = useState(goal.toString());

  const route = useRoute();

  // 🔥 BLE DATA UPDATE
  useEffect(() => {
    if (!deviceData) return;

    if (deviceData.steps !== undefined) setSteps(deviceData.steps);
    if (deviceData.hr !== undefined) setHeartRate(deviceData.hr);
    if (deviceData.spo2 !== undefined) setSpo2(deviceData.spo2);

  }, [deviceData]);

  // 🔥 FIREBASE SAVE (FINAL FIX)
 const lastSavedRef = useRef({
  hr: null,
  spo2: null,
  steps: null,
});

const isConnectedRef = useRef(false); // update this on BLE connect

useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  // ❌ Don't save if watch not connected
  if (!isConnectedRef.current) return;

  // ❌ Ignore empty/default data
  if (
    heartRate == null &&
    spo2 == null &&
    (steps == null || steps === 0)
  ) {
    return;
  }

  // ❌ Ignore if nothing changed
  if (
    heartRate === lastSavedRef.current.hr &&
    spo2 === lastSavedRef.current.spo2 &&
    steps === lastSavedRef.current.steps
  ) {
    return;
  }

  // ✅ Save data
  const saveData = async () => {
    try {
      await addDoc(collection(db, "users", user.uid, "watchData"), {
        steps: steps ?? 0,
        hr: heartRate ?? null,
        spo2: spo2 ?? null,
        timestamp: Timestamp.now(),
      });

      // update last saved values
      lastSavedRef.current = {
        hr: heartRate,
        spo2: spo2,
        steps: steps,
      };

      console.log("✅ Saved (changed data only)");
    } catch (e) {
      console.log("❌ Save error:", e);
    }
  };

  saveData();

}, [heartRate, spo2, steps]);

  // 🔥 KEEP YOUR ORIGINAL CALCULATIONS
  const km = (steps * 0.0008).toFixed(2);
  const kcal = (steps * 0.04).toFixed(0);
  const progress = Math.min(steps / goal, 1) / 2;

  const getOffset = (radius) => 2 * Math.PI * radius * (1 - progress);

  useEffect(() => {
    if (route.params?.bmi) {
      setBmi(route.params.bmi);
    }
  }, [route.params?.bmi]);

  useFocusEffect(
    useCallback(() => {
      const fetchLatestBMI = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const bmiRef = collection(db, "users", user.uid, "bmiRecords");
          const q = query(bmiRef, orderBy("timestamp", "desc"), limit(1));
          const querySnap = await getDocs(q);

          if (!querySnap.empty) {
            const latest = querySnap.docs[0].data();
            setBmi(latest.bmi);
          } else {
            setBmi(null);
          }
        } catch (error) {
          console.log("Error fetching latest BMI:", error);
        }
      };

      fetchLatestBMI();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsername(null);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data();
          setUsername(data.username || "User");
          setHeight(data.height || null);
          setWeight(data.weight || null);

          if (data.height && data.weight) {
            const hMeters = data.height / 100;
            const bmiValue = (data.weight / (hMeters * hMeters)).toFixed(1);
            setBmi(bmiValue);
          } else {
            setBmi(null);
          }
        } else {
          setUsername("User");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername("User");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    // ⚠️ KEEP YOUR EXISTING UI EXACT SAME (DO NOT CHANGE ANYTHING BELOW)
    <SafeAreaProvider>
     <View style={styles.container}>
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 1}}>
      {/* Steps Section */}
      <TouchableOpacity
  style={styles.stepsContainer}
  activeOpacity={0.8}
  onPress={() => navigation.navigate("Steps")}
>
<View style={styles.progressContainer}>
        <Svg height="180" width="360" viewBox="0 0 360 180">
          {/* Background arcs */}
          {[160, 130, 100].map((r, i) => (
            <Circle
              key={i}
              cx="180"
              cy="180"
              r={r}
              stroke="#2d2d2d"
              strokeWidth="20"
              fill="none"
            />
          ))}

          {/* Steps arc */}
          <Circle
            cx="180"
            cy="180"
            r="160"
            stroke="#ff7f24"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 160}
            strokeDashoffset={getOffset(160)}
            transform="rotate(-180 180 180)"
          />
          {/* Km arc */}
          <Circle
            cx="180"
            cy="180"
            r="130"
            stroke="#52a8ff"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={getOffset(130)}
            transform="rotate(-180 180 180)"
          />
          {/* Kcal arc */}
          <Circle
            cx="180"
            cy="180"
            r="100"
            stroke="#b566ff"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={getOffset(100)}
            transform="rotate(-180 180 180)"
          />
        </Svg>
      </View>

            {/* Steps | Km | Kcal Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Image source={require("../../assets/shoes.png")} style={styles.sicon} />
                <Text style={[styles.label, { color: "#ff7f24" }]}>Step</Text>
                <Text style={styles.value}>{steps}</Text>
              </View>
              <View style={styles.statItem}>
                <Image source={require("../../assets/location.png")} style={styles.sicon} />
                <Text style={[styles.label, { color: "#52a8ff" }]}>Km</Text>
                <Text style={styles.value}>{km}</Text>
              </View>
              <View style={styles.statItem}>
                <Image source={require("../../assets/fire.png")} style={styles.sicon} />
                <Text style={[styles.label, { color: "#b566ff" }]}>Kcal</Text>
                <Text style={styles.value}>{kcal}</Text>
              </View>
            </View>
      
            {/* Goal section */}
            <View style={styles.goalContainer}>
              <Text style={styles.goalText}>
                Today’s Steps <Text style={{ color: "#ff7f24" }}>{steps}/{goal}</Text>
              </Text>
            <TouchableOpacity onPress={() => setEditVisible(true)} style={styles.editBtn}>
              <Image
                source={require("../../assets/edit.png")}
                style={{ width: 18, height: 18 , tintColor:"#ccc"}}
                resizeMode="contain"
              />
            </TouchableOpacity>
            </View>
      
            {/* Edit Goal Modal */}
            <Modal visible={editVisible} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8,color: "#fff" }}>Edit Goal</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={newGoal}
                    onChangeText={setNewGoal}
                  />
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => {
                        setGoal(Number(newGoal));
                        setEditVisible(false);
                      }}
                    >
                      <Text style={{ color: "#fff" }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
                      <Text style={{ color: "#fff" }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
      </TouchableOpacity>


    <View style={styles.grid}>
      <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Heartrate')} activeOpacity={0.8}>  
          <Text style={styles.healthLabel}>Heart Rate</Text>
          <Text style={styles.noDataSubText}>
            {heartRate ? `${heartRate} bpm` : "No Data"}
          </Text>
          <Image 
              source={require('../../assets/Heartrate.png')} 
              style={styles.icon} 
          />
      </TouchableOpacity>  
      <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Spo2')} activeOpacity={0.8}>
          <Text style={styles.healthLabel}>SPO2</Text>
          <Text style={styles.noDataSubText}>
              {spo2 ? `${spo2}%` : "No Data"}
          </Text>
          <Image 
              source={require('../../assets/spo2logo.png')} 
              style={styles.icon} 
          />
       </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('BmiScreen')}
         activeOpacity={0.8}
       > 
          <Text style={styles.healthLabel}>BMI</Text>
          <Text style={styles.noDataSubText}>{bmi || "No Data"}</Text>
          <Image 
              source={require('../../assets/bmilogo.png')} 
              style={styles.icon} 
          />
        </TouchableOpacity>

        <View style={styles.gridItem}>

  <Text style={styles.healthLabel}>Watch</Text>

  {/* STATUS */}
  <Text style={styles.noDataSubText}>
    {connectedDevice ? connectedDevice.name : "Not Connected"}
  </Text>

  {/* CONNECT / DISCONNECT BUTTON */}
  {!connectedDevice ? (
    <TouchableOpacity
      onPress={() => {
        startScan();
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <Text style={{ color: "#52a8ff", marginBottom: 8 }}>
        Connect Watch
      </Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      onPress={disconnectDevice}
      activeOpacity={0.7}
    >
      <Text style={{ color: "red", marginBottom: 8 }}>
        Disconnect
      </Text>
    </TouchableOpacity>
  )}

  {/* KEEP IMAGE SAME */}
  <Image 
    source={require('../../assets/temporary.png')} 
    style={styles.icon} 
  />

</View>
      </View>
{/* 
      <TouchableOpacity style={styles.changeOrderButton}>
        <Text style={styles.changeOrderText}>Change Order</Text>
      </TouchableOpacity> */}
    </ScrollView>
    <Modal visible={modalVisible} transparent animationType="slide">
  <View style={{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.6)',
    justifyContent:'center',
    alignItems:'center'
  }}>
    <View style={{
      backgroundColor:'#fff',
      width:'80%',
      maxHeight:400,
      borderRadius:10,
      padding:10
    }}>
      <ScrollView>
        {devices.map(d => (
          <TouchableOpacity
            key={d.id}
            style={{ padding:15, borderBottomWidth:1, borderBottomColor:'#ddd' }}
            onPress={() => {
              connectToDevice(d);
              setModalVisible(false);
            }}
          >
            <Text>{d.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={() => setModalVisible(false)}
        style={{ backgroundColor:'#007AFF', padding:10, borderRadius:8, marginTop:10 }}
      >
        <Text style={{ color:'#fff', textAlign:'center' }}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
    </SafeAreaProvider>
  );
}

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',  // dark background
    paddingHorizontal: 5,
    paddingTop: 5,
  },
  stepsContainer: {
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    position: 'relative',
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
  },
  sicon: {
    width: 22,
    height: 22,
    marginBottom: 4,
    tintColor:"#fff"
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  goalContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  goalText: {
    color: "#ccc",
    fontSize: 15,
  },
  editBtn: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#2c2c2c",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#ff7f24",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  icon: {
    marginLeft: 40,
    // marginTop:1,
    width: 100,
    height: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    backgroundColor: '#222',
    width: '48%',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  healthLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 2,
  },
  noDataSubText: {
    color: '#7a7a7a',
    fontSize: 14,
    marginBottom: 10,
  },
  changeOrderButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  changeOrderText: {
    color: '#e6e6e6ff',
    fontSize: 16,
  },
});