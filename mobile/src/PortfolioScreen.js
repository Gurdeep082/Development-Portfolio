import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { apiRequest } from "./api";
import { fallbackProjects, skills } from "./data";
import { colors } from "./theme";

const emptyForm = {
  fullName: "",
  email: "",
  company: "",
  message: "",
};

export default function PortfolioScreen({ apiUrl }) {
  const [projects, setProjects] = useState(fallbackProjects);
  const [settings, setSettings] = useState({ resume: "", resumeName: "" });
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPortfolio = useCallback(async () => {
    try {
      const [projectData, settingsData] = await Promise.all([
        apiRequest(apiUrl, "/api/projects"),
        apiRequest(apiUrl, "/api/settings"),
      ]);
      if (projectData.length) setProjects(projectData);
      setSettings(settingsData);
    } catch (error) {
      setStatus(`Using offline content. ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    const countVisit = async () => {
      const counted = await SecureStore.getItemAsync("portfolioMobileVisitCounted");
      if (counted) return;

      try {
        await apiRequest(apiUrl, "/api/visits", { method: "POST" });
        await SecureStore.setItemAsync("portfolioMobileVisitCounted", "true");
      } catch (error) {
        return;
      }
    };

    countVisit();
  }, [apiUrl]);

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const sendMessage = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("Full name, email, and message are required.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      const response = await apiRequest(apiUrl, "/api/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setStatus(response.message);
      setForm(emptyForm);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openResume = async () => {
    if (!settings.resume) {
      setStatus("Upload a resume from the admin screen first.");
      return;
    }

    try {
      const base64 = settings.resume.split(",")[1];
      const safeName = (settings.resumeName || "resume.pdf").replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );
      const fileUri = `${FileSystem.cacheDirectory}${safeName}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: "Open resume",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      setStatus(`Could not open resume. ${error.message}`);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            setLoading(true);
            loadPortfolio();
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>MERN STACK DEVELOPER</Text>
        <Text style={styles.heroTitle}>
          Building high-performance products for modern teams.
        </Text>
        <Text style={styles.body}>
          I design and ship full-stack applications with strong architecture,
          smooth UX, and production-focused quality.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={openResume}>
            <Text style={styles.primaryButtonText}>Open Resume</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => Linking.openURL("https://github.com/Gurdeep082")}
          >
            <Text style={styles.secondaryButtonText}>GitHub</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              Linking.openURL("https://www.linkedin.com/in/gurdeep-singh03/")
            }
          >
            <Text style={styles.secondaryButtonText}>LinkedIn</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionLabel}>CORE STACK</Text>
      <View style={styles.skillGrid}>
        {skills.map((skill) => (
          <View key={skill} style={styles.skill}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>FEATURED PROJECTS</Text>
      {loading && <ActivityIndicator color={colors.accent} />}
      {projects.map((project) => (
        <View key={project._id || project.title} style={styles.project}>
          {project.image ? (
            <Image source={{ uri: project.image }} style={styles.projectImage} />
          ) : (
            <View style={[styles.projectImage, styles.projectPlaceholder]}>
              <Text style={styles.placeholderText}>PROJECT</Text>
            </View>
          )}
          <View style={styles.projectBody}>
            {!!project.stack && <Text style={styles.projectStack}>{project.stack}</Text>}
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.body}>{project.description || project.desc}</Text>
            <Pressable onPress={() => Linking.openURL(project.link)}>
              <Text style={styles.link}>Open Project</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.contact}>
        <Text style={styles.sectionLabel}>CONTACT</Text>
        <Text style={styles.contactTitle}>Let us discuss your next product</Text>
        {[
          ["fullName", "Full name"],
          ["email", "Email"],
          ["company", "Company (optional)"],
        ].map(([name, placeholder]) => (
          <TextInput
            key={name}
            value={form[name]}
            onChangeText={(value) => updateForm(name, value)}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            keyboardType={name === "email" ? "email-address" : "default"}
            autoCapitalize={name === "email" ? "none" : "words"}
            style={styles.input}
          />
        ))}
        <TextInput
          value={form.message}
          onChangeText={(value) => updateForm("message", value)}
          placeholder="Tell me about the role or project..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[styles.input, styles.textarea]}
        />
        <Pressable
          style={[styles.primaryButton, submitting && styles.disabled]}
          onPress={sendMessage}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Sending..." : "Send Message"}
          </Text>
        </Pressable>
        {!!status && <Text style={styles.status}>{status}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 120, gap: 16 },
  hero: {
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.panel,
  },
  eyebrow: {
    color: colors.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    marginVertical: 12,
  },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 18 },
  primaryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  primaryButtonText: { color: "#271204", fontWeight: "900" },
  secondaryButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.panelSoft,
  },
  secondaryButtonText: { color: colors.text, fontWeight: "700" },
  sectionLabel: {
    color: colors.accentSoft,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 10,
  },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.panel,
  },
  skillText: { color: colors.text, fontWeight: "700" },
  project: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.panel,
  },
  projectImage: { width: "100%", height: 190 },
  projectPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222d3d",
  },
  placeholderText: { color: colors.muted, fontWeight: "900", letterSpacing: 2 },
  projectBody: { padding: 16, gap: 8 },
  projectStack: { color: colors.accentSoft, fontSize: 12, fontWeight: "800" },
  projectTitle: { color: colors.text, fontSize: 21, fontWeight: "900" },
  link: { color: colors.accentSoft, fontWeight: "900", marginTop: 4 },
  contact: {
    gap: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.panel,
  },
  contactTitle: { color: colors.text, fontSize: 25, fontWeight: "900" },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.panelSoft,
  },
  textarea: { minHeight: 125, paddingTop: 14 },
  status: { color: colors.accentSoft, lineHeight: 20 },
  disabled: { opacity: 0.55 },
});
