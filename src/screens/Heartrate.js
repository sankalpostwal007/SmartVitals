import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const screenWidth = Dimensions.get("window").width;

const Heartrate = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    age: 22,
    weight: 70,
    height: 170,
  });

  // 🔥 FETCH USER PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();

          setProfile({
            age: data.age || 22,
            weight: data.weight || 70,
            height: data.height || 170,
          });
        }
      } catch (e) {
        console.log("Profile fetch error:", e);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "watchData"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setRawData(data.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ CLEAN DATA SAFELY
  const cleanData = rawData
    .filter((item) => item.hr !== null && item.hr !== undefined)
    .map((item) => ({
      value: Number(item.hr) || 0,
      timestamp:
        item.timestamp && item.timestamp.toDate
          ? item.timestamp.toDate()
          : null,
    }));

  const values = cleanData.map((i) => i.value);

  // 📌 CURRENT HR
  const currentHR =
    values.length > 0 ? values[values.length - 1] : "--";

  // 📊 BASIC STATS
  const avg =
    values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;

  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;

  // 📊 VARIABILITY (STD DEV)
  const variance =
    values.length > 0
      ? values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
        values.length
      : 0;

  const stdDev = Math.round(Math.sqrt(variance));

  // 📈 TREND
  let trend = "Stable";

  if (values.length >= 3) {
    const diff =
      values[values.length - 1] - values[values.length - 3];

    if (diff > 5) trend = "Strong Increase ↑";
    else if (diff > 0) trend = "Slight Increase ↑";
    else if (diff < -5) trend = "Strong Decrease ↓";
    else if (diff < 0) trend = "Slight Decrease ↓";
  }

  // ❤️ ZONE
  let zone = "Normal";

  if (currentHR !== "--") {
    if (currentHR < 60) zone = "Resting / Low";
    else if (currentHR <= 100) zone = "Normal";
    else if (currentHR <= 120) zone = "Elevated";
    else zone = "High";
  }

  // 🔥 PERSONALIZED CALORIES
  const { age, weight, height } = profile;

  let calories = 0;

  if (values.length > 0) {
    calories =
      ((-55.0969 + 0.6309 * avg + 0.1988 * weight + 0.2017 * age) / 4.184) *
      (values.length / 60);
  }

  calories = Math.max(0, Number(calories.toFixed(2)));

  // 📊 BMI
  const heightM = height / 100;

  const bmi =
    heightM > 0
      ? (weight / (heightM * heightM)).toFixed(1)
      : 0;

  let bmiCategory = "Normal";

  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi < 25) bmiCategory = "Normal";
  else if (bmi < 30) bmiCategory = "Overweight";
  else bmiCategory = "Obese";

  // 🧠 STRESS
  let stressLevel = "Low";

  const ageFactor = age > 40 ? 5 : 0;

  if (currentHR > 110 + ageFactor || stdDev > 12) {
    stressLevel = "High";
  } else if (currentHR > 90 + ageFactor || stdDev > 8) {
    stressLevel = "Moderate";
  }

  // 🧠 MESSAGE
  let message = "Analyzing your physiological data...";

  if (values.length >= 5) {
    if (stressLevel === "High") {
      message =
        "High stress detected. Elevated heart rate with strong fluctuations.";
    } else if (stressLevel === "Moderate") {
      message =
        "Moderate stress levels observed with slight variability.";
    } else {
      message =
        "Your heart activity is stable and within a healthy range.";
    }

    if (bmiCategory !== "Normal") {
      message += ` BMI suggests ${bmiCategory} condition.`;
    }

    if (calories > 5) {
      message += " Active calorie burn detected.";
    }
  }

  // 📊 SAFE GRAPH DATA
  const safeValues =
    cleanData.length > 0
      ? cleanData.slice(-6).map((item) => item.value || 0)
      : [0];

  const chartData = {
    labels: cleanData.slice(-6).map((item) => {
      if (!item.timestamp) return "";
      const h = item.timestamp.getHours();
      const m = item.timestamp.getMinutes();
      return `${h}:${m < 10 ? "0" + m : m}`;
    }),
    datasets: [{ data: safeValues }],
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00ffcc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Heart Rate Analysis</Text>

      <View style={styles.card}>
        <Text style={styles.bigValue}>{currentHR} BPM</Text>
        <Text style={styles.subText}>Current Heart Rate</Text>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 30}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#121212",
            backgroundGradientTo: "#121212",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,255,204,${opacity})`,
            labelColor: () => "#888",
          }}
          bezier
          style={{ borderRadius: 16 }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.analysis}>Average: {avg} BPM</Text>
        <Text style={styles.analysis}>Min: {min} BPM</Text>
        <Text style={styles.analysis}>Max: {max} BPM</Text>
        <Text style={styles.analysis}>Variability: ±{stdDev}</Text>
        <Text style={styles.analysis}>Trend: {trend}</Text>
        <Text style={styles.analysis}>Zone: {zone}</Text>
        <Text style={styles.analysis}>Calories: {calories} kcal</Text>
        <Text style={styles.analysis}>Stress: {stressLevel}</Text>
        <Text style={styles.analysis}>
          BMI: {bmi} ({bmiCategory})
        </Text>

        <Text style={styles.message}>{message}</Text>
      </View>
    </ScrollView>
  );
};

export default Heartrate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    padding: 15,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 14,
    marginBottom: 15,
  },
  bigValue: {
    color: "#00ffcc",
    fontSize: 36,
    fontWeight: "bold",
  },
  subText: {
    color: "#888",
    marginTop: 5,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  analysis: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 6,
  },
  message: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 14,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
  },
});