import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const screenWidth = Dimensions.get("window").width;

const Steps = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH DATA
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "watchData"),
      orderBy("timestamp", "desc"),
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setRawData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🧠 GROUP DATA BY DAY (TAKE MAX STEP OF DAY)
 const stepsByDay = {};

rawData.forEach((item) => {
  if (!item.timestamp) return;

  const date = item.timestamp.toDate();

  const key = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
  });

  if (!stepsByDay[key]) {
    stepsByDay[key] = 0;
  }

  stepsByDay[key] = Math.max(stepsByDay[key], item.steps || 0);
});

  // 🗓️ Get last 7 days
  const sortedDays = Object.keys(stepsByDay).slice(-7);

  const stepValues = sortedDays.map((day) => stepsByDay[day]);

  const currentSteps =
    stepValues.length > 0 ? stepValues[stepValues.length - 1] : 0;

  // 📏 KM + KCAL
  const km = (currentSteps * 0.0008).toFixed(2);
  const kcal = (currentSteps * 0.04).toFixed(0);

  // 🧠 Insight
  let message = "Collecting activity data...";

  if (currentSteps > 8000) {
    message = "Excellent! You achieved a highly active day.";
  } else if (currentSteps > 4000) {
    message = "Good progress. Try reaching 8000 steps.";
  } else {
    message = "Low activity. Try walking more today.";
  }

  // 📊 BAR GRAPH DATA
  const chartData = {
    labels: sortedDays,
    datasets: [
      {
        data: stepValues.length > 0 ? stepValues : [0],
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ffa500" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Steps (Weekly)</Text>

      {/* 👣 Current Steps */}
      <View style={styles.currentCard}>
        <Text style={styles.label}>Today’s Steps</Text>
        <Text style={styles.bigValue}>{currentSteps}</Text>
      </View>

      {/* 📊 Bar Graph */}
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth - 20}
          height={220}
          fromZero
          chartConfig={{
            backgroundGradientFrom: "#0d0d0d",
            backgroundGradientTo: "#0d0d0d",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255,165,0,${opacity})`,
            labelColor: () => "#888",
            propsForBackgroundLines: {
              stroke: "#222",
            },
          }}
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* 📏 KM + KCAL */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{km}</Text>
          <Text style={styles.statLabel}>KM</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{kcal}</Text>
          <Text style={styles.statLabel}>KCAL</Text>
        </View>
      </View>

      {/* 🧠 Insight */}
      <View style={styles.card}>
        <Text style={styles.analysisTitle}>Activity Insight</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </ScrollView>
  );
};

export default Steps;

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    padding: 10,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  currentCard: {
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    color: "#888",
    marginBottom: 5,
  },
  bigValue: {
    color: "#ffa500",
    fontSize: 42,
    fontWeight: "bold",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    backgroundColor: "#1a1a1a",
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    color: "#ffa500",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#777",
    fontSize: 12,
    marginTop: 5,
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  analysisTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    color: "#aaa",
    fontSize: 14,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
  },
});