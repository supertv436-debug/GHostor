import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface HistoryEntry {
  id: string;
  date: string;
  targetCount: number;
  targets: string[];
}

export const HISTORY_KEY = "@exterminatus_history_v1";

const C = {
  bg: "#080608",
  bg2: "#0f0c13",
  surface: "#130f18",
  surfaceBorder: "#1f1929",
  red: "#c41e3a",
  redDark: "#6b0000",
  gold: "#c9a84c",
  muted: "#4a3f5c",
  fg: "#d8cee8",
  fgDim: "#6b5d80",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${day}.${month}.${year}  ${h}:${m}`;
}

function HistoryCard({ entry, index }: { entry: HistoryEntry; index: number }) {
  return (
    <View style={[hc.card, { borderColor: C.surfaceBorder }]}>
      {/* left accent */}
      <View style={[hc.accent, { backgroundColor: C.red + "99" }]} />

      <View style={hc.cardInner}>
        {/* header row */}
        <View style={hc.cardHeader}>
          <View style={hc.numberBadge}>
            <Text style={hc.numberText}>#{index + 1}</Text>
          </View>
          <View style={hc.cardMeta}>
            <Text style={hc.dateText}>{formatDate(entry.date)}</Text>
            <Text style={hc.countText}>
              {entry.targetCount}{" "}
              {entry.targetCount === 1
                ? "ЦЕЛЬ УНИЧТОЖЕНА"
                : entry.targetCount < 5
                ? "ЦЕЛИ УНИЧТОЖЕНЫ"
                : "ЦЕЛЕЙ УНИЧТОЖЕНО"}
            </Text>
          </View>
        </View>

        {/* targets list */}
        {entry.targets.slice(0, 3).map((t, i) => (
          <View key={i} style={hc.targetLine}>
            <MaterialCommunityIcons name="crosshairs-gps" size={10} color={C.gold + "88"} />
            <Text style={hc.targetText} numberOfLines={1}>
              {t.toUpperCase()}
            </Text>
          </View>
        ))}
        {entry.targets.length > 3 && (
          <Text style={hc.moreText}>+{entry.targets.length - 3} ЕЩЁ</Text>
        )}
      </View>
    </View>
  );
}

const hc = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderWidth: 1,
    backgroundColor: "#130f18",
    marginBottom: 8,
  },
  accent: { width: 2 },
  cardInner: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 5 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 3 },
  numberBadge: {
    borderWidth: 1,
    borderColor: C.red + "66",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  numberText: { fontSize: 9, letterSpacing: 2, color: C.red, fontFamily: "Inter_700Bold" },
  cardMeta: { flex: 1 },
  dateText: { fontSize: 9, letterSpacing: 1, color: C.fgDim, fontFamily: "Inter_400Regular" },
  countText: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.fg,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  targetLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  targetText: {
    flex: 1,
    fontSize: 11,
    color: C.fgDim,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
  moreText: { fontSize: 9, color: C.muted, fontFamily: "Inter_400Regular", letterSpacing: 2 },
});

// ─── Main History Screen ──────────────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((d) => {
      if (d) setHistory(JSON.parse(d));
    });
  }, []);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBot = Platform.OS === "web" ? 34 : 0;

  const sorted = [...history].reverse();

  return (
    <LinearGradient colors={[C.bg, C.bg2, C.bg]} style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[C.redDark + "22", "transparent"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={[
          s.inner,
          {
            paddingTop: insets.top + 16 + webTop,
            paddingBottom: insets.bottom + 16 + webBot,
          },
        ]}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={C.gold} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <View style={s.divRow}>
              <View style={[s.divLine, { backgroundColor: C.gold + "44" }]} />
              <MaterialCommunityIcons name="fleur-de-lis" size={9} color={C.gold + "77"} />
              <View style={[s.divLine, { backgroundColor: C.gold + "44" }]} />
            </View>
            <Text style={s.pageTitle}>ЗАЛ УНИЧТОЖЕННЫХ</Text>
            <Text style={s.pageSubtitle}>ANNALS EXTERMINATUS</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <View style={[s.divRow, { marginBottom: 16, opacity: 0.5 }]}>
          <View style={[s.divLine, { backgroundColor: C.surfaceBorder }]} />
        </View>

        {/* Stats bar */}
        {history.length > 0 && (
          <View style={s.statsBar}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{history.length}</Text>
              <Text style={s.statLabel}>ДИРЕКТИВ</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: C.surfaceBorder }]} />
            <View style={s.statItem}>
              <Text style={s.statNum}>
                {history.reduce((a, e) => a + e.targetCount, 0)}
              </Text>
              <Text style={s.statLabel}>УНИЧТОЖЕНО</Text>
            </View>
          </View>
        )}

        {/* List */}
        {sorted.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="book-open-outline" size={40} color={C.muted + "44"} />
            <Text style={s.emptyTitle}>АННАЛЫ ПУСТЫ</Text>
            <Text style={s.emptySub}>Ни один Экзерминатус ещё не был объявлен</Text>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(i) => i.id}
            renderItem={({ item, index }) => (
              <HistoryCard entry={item} index={sorted.length - 1 - index} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  inner: { flex: 1, paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  divRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 },
  divLine: { flex: 1, height: 1 },
  pageTitle: {
    fontSize: 16,
    letterSpacing: 4,
    color: C.fg,
    fontFamily: "Inter_700Bold",
  },
  pageSubtitle: {
    fontSize: 8,
    letterSpacing: 3,
    color: C.muted,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surface,
    marginBottom: 14,
    paddingVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, color: C.red, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  statLabel: { fontSize: 8, color: C.muted, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 12,
    letterSpacing: 5,
    color: C.muted,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  emptySub: { fontSize: 12, color: C.fgDim, fontFamily: "Inter_400Regular", textAlign: "center" },
});
