import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { apiRequest, normalizeApiUrl } from "./api";
import { colors } from "./theme";

const emptyProject = {
  title: "",
  description: "",
  stack: "",
  link: "",
  image: "",
};

export default function AdminScreen({ apiUrl, onApiUrlChange }) {
  const [adminKey, setAdminKey] = useState("");
  const [apiInput, setApiInput] = useState(apiUrl);
  const [showKey, setShowKey] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [project, setProject] = useState(emptyProject);
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const headers = { "x-admin-key": adminKey };

  useEffect(() => {
    SecureStore.getItemAsync("portfolioAdminKey").then((value) => {
      if (value) setAdminKey(value);
    });
  }, []);

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (!adminKey) return;
      if (!silent) setBusy(true);
      try {
        const data = await apiRequest(apiUrl, "/api/admin/dashboard", { headers });
        setDashboard(data);
        await SecureStore.setItemAsync("portfolioAdminKey", adminKey);
        if (!silent) setStatus("Dashboard connected.");
      } catch (error) {
        if (!silent) setStatus(error.message);
      } finally {
        if (!silent) setBusy(false);
      }
    },
    [adminKey, apiUrl]
  );

  useEffect(() => {
    if (!dashboard) return undefined;
    const interval = setInterval(() => loadDashboard(true), 4000);
    return () => clearInterval(interval);
  }, [dashboard, loadDashboard]);

  const saveApiUrl = async () => {
    const nextUrl = normalizeApiUrl(apiInput);
    if (!/^https?:\/\//i.test(nextUrl)) {
      setStatus("API URL must start with http:// or https://.");
      return;
    }
    await SecureStore.setItemAsync("portfolioApiUrl", nextUrl);
    onApiUrlChange(nextUrl);
    setStatus("API URL saved.");
  };

  const pickProjectImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatus("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.65,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setStatus("Could not read the selected image.");
      return;
    }

    const mimeType = asset.mimeType || "image/jpeg";
    setProject((current) => ({
      ...current,
      image: `data:${mimeType};base64,${asset.base64}`,
    }));
    setStatus("Project image selected.");
  };

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > 6 * 1024 * 1024) {
      setStatus("Resume must be smaller than 6 MB.");
      return;
    }
    setResume(asset);
    setStatus(`${asset.name} selected.`);
  };

  const publishProject = async () => {
    if (
      !project.title.trim() ||
      !project.description.trim() ||
      !project.link.trim() ||
      !project.image
    ) {
      setStatus("Title, description, link, and image are required.");
      return;
    }

    setBusy(true);
    try {
      const created = await apiRequest(apiUrl, "/api/admin/projects", {
        method: "POST",
        headers,
        body: JSON.stringify(project),
      });
      setDashboard((current) => ({
        ...current,
        projects: [created, ...current.projects],
      }));
      setProject(emptyProject);
      setStatus("Project published.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadResume = async () => {
    if (!resume) return;
    setBusy(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(resume.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await apiRequest(apiUrl, "/api/admin/resume", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          resume: `data:application/pdf;base64,${base64}`,
          resumeName: resume.name,
        }),
      });
      setDashboard((current) => ({
        ...current,
        settings: { ...current.settings, resumeName: resume.name, resume: "set" },
      }));
      setResume(null);
      setStatus("Resume uploaded.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = (type, id) => {
    Alert.alert("Confirm delete", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiRequest(apiUrl, `/api/admin/${type}/${id}`, {
              method: "DELETE",
              headers,
            });
            setDashboard((current) => ({
              ...current,
              [type]: current[type].filter((item) => item._id !== id),
            }));
          } catch (error) {
            setStatus(error.message);
          }
        },
      },
    ]);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("portfolioAdminKey");
    setAdminKey("");
    setDashboard(null);
    setStatus("");
  };

  if (!dashboard) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.loginContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginCard}>
          <Text style={styles.eyebrow}>PORTFOLIO CONTROL ROOM</Text>
          <Text style={styles.loginTitle}>Admin Dashboard</Text>
          <Text style={styles.body}>
            Enter the same ADMIN_KEY configured on your Express server.
          </Text>
          <TextInput
            value={apiInput}
            onChangeText={setApiInput}
            placeholder="API URL"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Pressable style={styles.secondaryButton} onPress={saveApiUrl}>
            <Text style={styles.secondaryButtonText}>Save API URL</Text>
          </Pressable>
          <View style={styles.passwordRow}>
            <TextInput
              value={adminKey}
              onChangeText={setAdminKey}
              placeholder="Admin key"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              style={[styles.input, styles.passwordInput]}
            />
            <Switch
              value={showKey}
              onValueChange={setShowKey}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
          <Text style={styles.helper}>{showKey ? "Password visible" : "Password hidden"}</Text>
          <Pressable
            style={[styles.primaryButton, (!adminKey || busy) && styles.disabled]}
            onPress={() => loadDashboard(false)}
            disabled={!adminKey || busy}
          >
            {busy ? (
              <ActivityIndicator color="#271204" />
            ) : (
              <Text style={styles.primaryButtonText}>Open Dashboard</Text>
            )}
          </Pressable>
          {!!status && <Text style={styles.status}>{status}</Text>}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.eyebrow}>LIVE ADMIN</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <Pressable style={styles.dangerButton} onPress={logout}>
          <Text style={styles.dangerButtonText}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        {[
          ["Projects", dashboard.projects.length],
          ["Messages", dashboard.messages.length],
          ["Visits", dashboard.settings.visitCount || 0],
          ["Resume", dashboard.settings.resume ? "Yes" : "No"],
        ].map(([label, value]) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.liveText}>Updates automatically every 4 seconds</Text>
      {!!status && <Text style={styles.status}>{status}</Text>}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Add Project</Text>
        {[
          ["title", "Project title"],
          ["stack", "Stack, e.g. React | Node.js"],
          ["link", "https://project-link.com"],
        ].map(([name, placeholder]) => (
          <TextInput
            key={name}
            value={project[name]}
            onChangeText={(value) =>
              setProject((current) => ({ ...current, [name]: value }))
            }
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            autoCapitalize={name === "link" ? "none" : "sentences"}
            style={styles.input}
          />
        ))}
        <TextInput
          value={project.description}
          onChangeText={(value) =>
            setProject((current) => ({ ...current, description: value }))
          }
          placeholder="Project description"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textarea]}
        />
        <Pressable style={styles.secondaryButton} onPress={pickProjectImage}>
          <Text style={styles.secondaryButtonText}>Choose Project Image</Text>
        </Pressable>
        {!!project.image && (
          <Image source={{ uri: project.image }} style={styles.preview} />
        )}
        <Pressable
          style={[styles.primaryButton, busy && styles.disabled]}
          onPress={publishProject}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>Publish Project</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Update Resume</Text>
        <Text style={styles.body}>
          Current: {dashboard.settings.resumeName || "No custom resume"}
        </Text>
        <Pressable style={styles.secondaryButton} onPress={pickResume}>
          <Text style={styles.secondaryButtonText}>
            {resume ? resume.name : "Choose PDF Resume"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, (!resume || busy) && styles.disabled]}
          onPress={uploadResume}
          disabled={!resume || busy}
        >
          <Text style={styles.primaryButtonText}>Upload Resume</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Published Projects</Text>
      {dashboard.projects.map((item) => (
        <View key={item._id} style={styles.listCard}>
          {!!item.image && <Image source={{ uri: item.image }} style={styles.thumbnail} />}
          <View style={styles.listBody}>
            <Text style={styles.listTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.stack}</Text>
          </View>
          <Pressable
            style={styles.dangerButton}
            onPress={() => deleteItem("projects", item._id)}
          >
            <Text style={styles.dangerButtonText}>Delete</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Visitor Messages</Text>
      {dashboard.messages.length === 0 && (
        <Text style={styles.body}>No messages yet.</Text>
      )}
      {dashboard.messages.map((item) => (
        <View key={item._id} style={styles.messageCard}>
          <Text style={styles.listTitle}>{item.fullName}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {!!item.company && <Text style={styles.body}>{item.company}</Text>}
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.helper}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          <Pressable
            style={styles.dangerButton}
            onPress={() => deleteItem("messages", item._id)}
          >
            <Text style={styles.dangerButtonText}>Delete Message</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loginContent: { flexGrow: 1, justifyContent: "center", padding: 18 },
  content: { padding: 18, paddingBottom: 120, gap: 14 },
  loginCard: {
    gap: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.panel,
  },
  eyebrow: {
    color: colors.accentSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  loginTitle: { color: colors.text, fontSize: 30, fontWeight: "900" },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  body: { color: colors.muted, lineHeight: 21 },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.panelSoft,
  },
  textarea: { minHeight: 110, paddingTop: 14 },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  passwordInput: { flex: 1 },
  helper: { color: colors.muted, fontSize: 12 },
  primaryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  primaryButtonText: { color: "#271204", fontWeight: "900" },
  secondaryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.panelSoft,
  },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  status: { color: colors.accentSoft, lineHeight: 20 },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    width: "48%",
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  statValue: { color: colors.text, fontSize: 25, fontWeight: "900" },
  statLabel: { color: colors.muted },
  liveText: { color: colors.success, fontSize: 12, fontWeight: "700" },
  panel: {
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.panel,
  },
  panelTitle: { color: colors.text, fontSize: 21, fontWeight: "900" },
  preview: { width: "100%", height: 180, borderRadius: 12 },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 8,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  thumbnail: { width: 62, height: 52, borderRadius: 8 },
  listBody: { flex: 1 },
  listTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  dangerButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: "#55232b",
  },
  dangerButtonText: { color: colors.danger, fontWeight: "800" },
  messageCard: {
    gap: 7,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  email: { color: colors.accentSoft },
  message: { color: colors.text, lineHeight: 22 },
});
