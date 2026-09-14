import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function BmiScreen() {
  const [bmiRecords, setBmiRecords] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);

  // ---------- SAFE BMI HELPERS ----------
  const getBMICategory = (bmi) => {
    if (!bmi || isNaN(bmi)) return "";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getBMIColor = (bmi) => {
    if (!bmi || isNaN(bmi)) return "#fff";
    if (bmi < 18.5) return "#3498db";
    if (bmi < 25) return "#2ecc71";
    if (bmi < 30) return "#f39c12";
    return "#e74c3c";
  };

  const getBMIAdvice = (bmi) => {
    if (!bmi || isNaN(bmi)) return "";
    if (bmi < 18.5)
      return "You are underweight. Increase calorie intake & strength training.";
    if (bmi < 25)
      return "You are in a healthy range. Maintain your lifestyle!";
    if (bmi < 30)
      return "Slightly overweight. Add cardio & balanced diet.";
    return "Obese range. Consult doctor & focus on structured weight loss.";
  };

  // ---------- FETCH BMI DATA ----------
  const fetchBMIData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const bmiRef = collection(db, "users", user.uid, "bmiRecords");
      const q = query(bmiRef, orderBy("timestamp", "desc"));
      const querySnap = await getDocs(q);

      const data = querySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const validData = data
        .filter((item) => item.bmi && !isNaN(Number(item.bmi)))
        .slice(0, 7)
        .reverse();

      setBmiRecords(validData);
    } catch (error) {
      console.log("Error fetching BMI:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- FETCH USER DATA ----------
  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const d = userDoc.data();
        setHeight(d.height ? String(d.height) : "");
        setWeight(d.weight ? String(d.weight) : "");
      }
    } catch (e) {
      console.log("Error fetching user data:", e);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchBMIData();
  }, []);

  // ---------- HANDLE EDIT ----------
  const handleEdit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const h = parseFloat(height);
      const w = parseFloat(weight);

      if (!h || !w) {
        alert("Please enter valid height and weight");
        return;
      }

      const bmi = Number((w / ((h / 100) ** 2)).toFixed(1));
      const now = new Date();

      await updateDoc(doc(db, "users", user.uid), {
        height: h,
        weight: w,
      });

      await addDoc(collection(db, "users", user.uid, "bmiRecords"), {
        bmi: bmi,
        height: h,
        weight: w,
        timestamp: Timestamp.fromDate(now),
      });

      setShowEditForm(false);
      fetchBMIData();
    } catch (e) {
      console.log("Error updating BMI:", e);
      alert("Failed to update BMI");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // ---------- SAFE DATA PROCESSING ----------
  const bmiValues = bmiRecords
    .map((item) => Number(item.bmi))
    .filter((val) => !isNaN(val));

  const labels = bmiRecords.map((item) => {
    if (!item.timestamp) return "";

    try {
      let dateObj;

      if (item.timestamp.toDate) {
        dateObj = item.timestamp.toDate();
      } else {
        dateObj = new Date(item.timestamp);
      }

      return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
    } catch {
      return "";
    }
  });

  const currentBmi =
    bmiValues.length > 0 ? bmiValues[bmiValues.length - 1] : null;

  const idealMin =
    height && currentBmi
      ? (18.5 * (height / 100) ** 2).toFixed(1)
      : null;

  const idealMax =
    height && currentBmi
      ? (24.9 * (height / 100) ** 2).toFixed(1)
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>BMI Tracker</Text>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Height: {height || "--"} cm</Text>
          <Text style={styles.infoText}>Weight: {weight || "--"} kg</Text>

          <Text style={[styles.infoText, { fontSize: 18 }]}>
            BMI:{" "}
            <Text
              style={{
                color: getBMIColor(currentBmi),
                fontWeight: "bold",
              }}
            >
              {currentBmi || "--"}
            </Text>
          </Text>

          {currentBmi && (
            <>
              <Text
                style={{
                  color: getBMIColor(currentBmi),
                  fontWeight: "600",
                  marginTop: 5,
                }}
              >
                {getBMICategory(currentBmi)}
              </Text>

              <Text style={{ color: "#ccc", marginTop: 5 }}>
                Healthy BMI Range: 18.5 – 24.9
              </Text>

              {idealMin && (
                <Text style={{ color: "#ccc", marginTop: 5 }}>
                  Ideal Weight Range: {idealMin}kg – {idealMax}kg
                </Text>
              )}

              <Text style={{ color: "#aaa", marginTop: 8 }}>
                {getBMIAdvice(currentBmi)}
              </Text>
            </>
          )}
        </View>

        {/* CHART */}
        {bmiValues.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: bmiValues }],
              }}
              width={Math.max(screenWidth, bmiValues.length * 80)}
              height={250}
              chartConfig={{
                backgroundColor: "#202020",
                backgroundGradientFrom: "#202020",
                backgroundGradientTo: "#202020",
                decimalPlaces: 1,
                color: (opacity = 1) =>
                  `rgba(255,127,36,${opacity})`,
                labelColor: () => "#fff",
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </ScrollView>
        )}

        {/* EDIT BUTTON */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setShowEditForm(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editText}>Edit Height & Weight</Text>
        </TouchableOpacity>

        {/* EDIT FORM */}
        {showEditForm && (
          <View style={styles.overlay}>
            <View style={styles.editForm}>
              <Text style={styles.formTitle}>Edit Height & Weight</Text>

              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleEdit}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingBottom: 60,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    marginTop: 20,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: "#202020",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: "90%",
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
    marginVertical: 2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff7f24",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  editText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  editForm: {
    backgroundColor: "#202020",
    padding: 20,
    borderRadius: 16,
    width: "80%",
  },
  formTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  label: {
    color: "#ccc",
    marginTop: 10,
  },
  input: {
    backgroundColor: "#303030",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  saveBtn: {
    backgroundColor: "#ff7f24",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});