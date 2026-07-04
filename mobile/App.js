import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import AdminScreen from "./src/AdminScreen";
import { defaultApiUrl } from "./src/api";
import PortfolioScreen from "./src/PortfolioScreen";
import { colors } from "./src/theme";

export default function App() {
  const [screen, setScreen] = useState("portfolio");
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);

  useEffect(() => {
    SecureStore.getItemAsync("portfolioApiUrl").then((savedUrl) => {
      if (savedUrl) setApiUrl(savedUrl);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {screen === "portfolio" ? (
          <PortfolioScreen apiUrl={apiUrl} />
        ) : (
          <AdminScreen apiUrl={apiUrl} onApiUrlChange={setApiUrl} />
        )}
      </View>
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, screen === "portfolio" && styles.activeTab]}
          onPress={() => setScreen("portfolio")}
        >
          <Text
            style={[
              styles.tabText,
              screen === "portfolio" && styles.activeTabText,
            ]}
          >
            Portfolio
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, screen === "admin" && styles.activeTab]}
          onPress={() => setScreen("admin")}
        >
          <Text
            style={[styles.tabText, screen === "admin" && styles.activeTabText]}
          >
            Admin
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: { flex: 1 },
  tabBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 16,
    flexDirection: "row",
    gap: 8,
    padding: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: "#111721f5",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: { backgroundColor: colors.accent },
  tabText: { color: colors.muted, fontWeight: "800" },
  activeTabText: { color: "#271204" },
});
