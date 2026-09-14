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
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const screenWidth = Dimensions.get("window").width;

const Spo2 = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

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
    .filter((item) => item.spo2 !== null && item.spo2 !== undefined)
    .map((item) => ({
      value: Number(item.spo2) || 0,
      timestamp:
        item.timestamp && item.timestamp.toDate
          ? item.timestamp.toDate()
          : null,
    }));

  const values = cleanData.map((i) => i.value);

  // 📌 CURRENT
  const current =
    values.length > 0 ? `${values[values.length - 1]}%` : "--";

  // 📊 STATS
  const avg =
    values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;

  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;

  // 📊 VARIABILITY
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

    if (diff > 1) trend = "Increasing ↑";
    else if (diff < -1) trend = "Decreasing ↓";
  }

  // 🫁 OXYGEN LEVEL CLASSIFICATION
  let level = "Normal";

  if (current !== "--") {
    if (min >= 95) level = "Normal";
    else if (min >= 92) level = "Mild Drop";
    else if (min >= 88) level = "Low";
    else level = "Critical";
  }

  // 🔻 DROP DETECTION (important)
  let dropDetected = false;

  if (values.length >= 3) {
    const recentDrop =
      values[values.length - 3] - values[values.length - 1];
    if (recentDrop >= 3) dropDetected = true;
  }

  // 🧠 SMART MESSAGE (UPGRADED)
  let message = "Analyzing oxygen saturation...";

  if (values.length >= 5) {
    if (level === "Critical") {
      message =
        "Critical oxygen level detected. Immediate attention may be required.";
    } else if (level === "Low") {
      message =
        "Low oxygen levels observed. Ensure proper breathing and sensor placement.";
    } else if (level === "Mild Drop") {
      message =
        "Slight drop in oxygen levels detected. Monitor for further changes.";
    } else {
      message =
        "Your oxygen saturation is within a healthy range.";
    }

    if (dropDetected) {
      message += " Sudden drop detected in recent readings.";
    }

    if (stdDev > 2) {
      message += " Noticeable fluctuations present.";
    }
  }

  // 📊 SAFE GRAPH
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
      <Text style={styles.title}>SpO₂ Analysis</Text>

      {/* CURRENT */}
      <View style={styles.card}>
        <Text style={styles.bigValue}>{current}</Text>
        <Text style={styles.subText}>Current Oxygen Level</Text>
      </View>

      {/* GRAPH */}
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

      {/* ANALYSIS */}
      <View style={styles.card}>
        <Text style={styles.analysis}>Average: {avg}%</Text>
        <Text style={styles.analysis}>Min: {min}%</Text>
        <Text style={styles.analysis}>Max: {max}%</Text>
        <Text style={styles.analysis}>Variability: ±{stdDev}</Text>
        <Text style={styles.analysis}>Trend: {trend}</Text>
        <Text style={styles.analysis}>Level: {level}</Text>

        <Text style={styles.message}>{message}</Text>
      </View>
    </ScrollView>
  );
};

export default Spo2;

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