import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Platform
} from "react-native";
import { auth, db } from "../config/firebase";
import { doc, setDoc, Timestamp, getDoc, collection, addDoc } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';

export default function PersonalDetails() {

  const navigation = useNavigation();
  const now = new Date();

  const [name, setName] = useState("");

  // ✅ DOB states (UPDATED)
  const [birthday, setBirthday] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");

  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [openHeight, setOpenHeight] = useState(false);

  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [openWeight, setOpenWeight] = useState(false);

  const INPUT_HEIGHT = 50;

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.username) setName(data.username);
      }
    };

    fetchUserName();
  }, []);

  // ✅ DOB typing handler
  const handleDateChange = (text) => {
  let cleaned = text.replace(/[^0-9]/g, "");

  let formatted = "";

  if (cleaned.length <= 2) {
    formatted = cleaned;
  } else if (cleaned.length <= 4) {
    formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
  } else {
    formatted =
      cleaned.slice(0, 2) +
      "/" +
      cleaned.slice(2, 4) +
      "/" +
      cleaned.slice(4, 8);
  }

  setBirthday(formatted);
};

  // ✅ Convert string → Date
  const parseDate = () => {
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/;

    if (!regex.test(birthday)) {
      setError("Enter valid date DD/MM/YYYY");
      return null;
    }

    const [day, month, year] = birthday.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    if (date > new Date()) {
      setError("Future date not allowed");
      return null;
    }

    setError("");
    return date;
  };

  // ✅ Age calculation
  const calculateAge = (dob) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      let heightCm = Number(height);
      if (heightUnit === "ft") heightCm *= 30.48;
      heightCm = Number(heightCm.toFixed(2)); // ✅ FIX

      let weightKg = Number(weight);
      if (weightUnit === "lbs") weightKg /= 2.20462;
      weightKg = Number(weightKg.toFixed(2)); // ✅ FIX

      if (!heightCm || !weightKg) {
        alert("Enter valid height & weight");
        return;
      }

      // ✅ DOB processing
      const dobDate = parseDate();
      if (!dobDate) return;

      const age = calculateAge(dobDate);

      // ✅ Save to Firebase
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: name,
          birthday: Timestamp.fromDate(dobDate),
          age: age, // 🔥 NEW
          height: heightCm,
          weight: weightKg,
        },
        { merge: true }
      );

      const bmi = Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1));

      await addDoc(collection(db, "users", user.uid, "bmiRecords"), {
        date: now.toISOString().split("T")[0],
        timestamp: Timestamp.fromDate(now),
        height: heightCm,
        weight: weightKg,
        bmi: bmi,
      });

      alert("Saved successfully!");
      navigation.replace("MainTabs");

    } catch (error) {
      console.log(error);
      alert("Error saving data");
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formBox}>

        <Text style={styles.heading}>Enter Your Details</Text>

        <TextInput style={styles.input} value={name} editable={false} />

        {/* ✅ DOB INPUT + ICON */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="DD/MM/YYYY"
            value={birthday}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            maxLength={10}
          />

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.calendarBtn}
          >
            <Text style={{ fontSize: 18 }}>📅</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (d) {
                const formatted =
                  `${String(d.getDate()).padStart(2, "0")}/` +
                  `${String(d.getMonth() + 1).padStart(2, "0")}/` +
                  d.getFullYear();
                setBirthday(formatted);
              }
            }}
          />
        )}

        {/* ✅ HEIGHT (FIXED OVERLAP) */}
        <View style={{ zIndex: openHeight ? 2000 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Height"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />

            <DropDownPicker
              open={openHeight}
              value={heightUnit}
              items={[
                { label: "cm", value: "cm" },
                { label: "ft", value: "ft" }
              ]}
              setOpen={(val) => {
                setOpenHeight(val);
                setOpenWeight(false);
              }}
              setValue={setHeightUnit}
              containerStyle={{ width: 100 }}
              zIndex={3000}
              style={{
    backgroundColor: "#2a2a2a",
    borderColor: "#555",
  }}
  dropDownContainerStyle={{
    backgroundColor: "#2a2a2a",
    borderColor: "#555",
  }}
  textStyle={{ color: "#fff" }}
            />
          </View>
        </View>

        {/* ✅ WEIGHT (FIXED OVERLAP) */}
        <View style={{ zIndex: openWeight ? 1000 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />

            <DropDownPicker
              open={openWeight}
              value={weightUnit}
              items={[
                { label: "kg", value: "kg" },
                { label: "lbs", value: "lbs" }
              ]}
              setOpen={(val) => {
                setOpenWeight(val);
                setOpenHeight(false);
              }}
              setValue={setWeightUnit}
              containerStyle={{ width: 100 }}
              zIndex={2000}
              style={{
    backgroundColor: "#2a2a2a",
    borderColor: "#555",
  }}
  dropDownContainerStyle={{
    backgroundColor: "#2a2a2a",
    borderColor: "#555",
  }}
  textStyle={{ color: "#fff" }}
            />
          </View>
        </View>

       <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
  <Text style={styles.saveText}>Save </Text>
</TouchableOpacity>

      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20, backgroundColor: "#121212" },
  formBox: { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 15 },
  heading: { fontSize: 22, color: "#fff", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#2a2a2a", color: "#fff", padding: 12, borderRadius: 10, marginBottom: 15 },
  saveBtn: {
  backgroundColor: "#4CAF50",
  padding: 14,
  borderRadius: 12, // ✅ curved corners
  alignItems: "center",
  marginTop: 10,
},
saveText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 16,
},
  calendarBtn: {
    marginLeft: 10,
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 10
  }

});