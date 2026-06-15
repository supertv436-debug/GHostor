import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { HistoryEntry } from "./history";
import { HISTORY_KEY } from "./history";

interface Target {
  id: string;
  text: string;
  eliminated: boolean;
}

const STORAGE_KEY = "@exterminatus_targets_v3";
const COUNTDOWN_SECONDS = 10;

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

// ─── Ornate corner box ────────────────────────────────────────────────────────
function OrnateBox({
  children,
  style,
  cColor = C.gold,
  cSize = 10,
  bColor = C.surfaceBorder,
}: {
  children: React.ReactNode;
  style?: object;
  cColor?: string;
  cSize?: number;
  bColor?: string;
}) {
  return (
    <View style={[{ borderWidth: 1, borderColor: bColor }, style]}>
      <View style={{ position: "absolute", top: -1, left: -1, zIndex: 2 }}>
        <View style={{ width: cSize, height: 1.5, backgroundColor: cColor }} />
        <View style={{ width: 1.5, height: cSize, backgroundColor: cColor }} />
      </View>
      <View style={{ position: "absolute", top: -1, right: -1, zIndex: 2, alignItems: "flex-end" }}>
        <View style={{ width: cSize, height: 1.5, backgroundColor: cColor }} />
        <View style={{ width: 1.5, height: cSize, backgroundColor: cColor }} />
      </View>
      <View style={{ position: "absolute", bottom: -1, left: -1, zIndex: 2, justifyContent: "flex-end" }}>
        <View style={{ width: 1.5, height: cSize, backgroundColor: cColor }} />
        <View style={{ width: cSize, height: 1.5, backgroundColor: cColor }} />
      </View>
      <View style={{ position: "absolute", bottom: -1, right: -1, zIndex: 2, alignItems: "flex-end", justifyContent: "flex-end" }}>
        <View style={{ width: 1.5, height: cSize, backgroundColor: cColor }} />
        <View style={{ width: cSize, height: 1.5, backgroundColor: cColor }} />
      </View>
      {children}
    </View>
  );
}

// ─── Explosion overlay ────────────────────────────────────────────────────────
const PARTICLES = [
  { angle: 0,   dist: 130, size: 7,  color: "#ff6a00" },
  { angle: 45,  dist: 110, size: 5,  color: "#ffcc00" },
  { angle: 90,  dist: 140, size: 8,  color: "#ff3300" },
  { angle: 135, dist: 105, size: 5,  color: "#ff9900" },
  { angle: 180, dist: 135, size: 7,  color: "#ff6a00" },
  { angle: 225, dist: 115, size: 5,  color: "#ffcc00" },
  { angle: 270, dist: 145, size: 9,  color: "#ff3300" },
  { angle: 315, dist: 108, size: 5,  color: "#ff9900" },
  { angle: 22,  dist: 90,  size: 4,  color: C.gold },
  { angle: 112, dist: 95,  size: 4,  color: C.gold },
  { angle: 202, dist: 88,  size: 4,  color: C.gold },
  { angle: 292, dist: 92,  size: 4,  color: C.gold },
];

function Explosion({ onDone }: { onDone: () => void }) {
  const flash     = useRef(new Animated.Value(0)).current;
  const r1        = useRef(new Animated.Value(0)).current;
  const r2        = useRef(new Animated.Value(0)).current;
  const r3        = useRef(new Animated.Value(0)).current;
  const corePulse = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const textOp    = useRef(new Animated.Value(0)).current;

  // One animated value per particle (progress 0→1)
  const p0 = useRef(new Animated.Value(0)).current;
  const p1 = useRef(new Animated.Value(0)).current;
  const p2 = useRef(new Animated.Value(0)).current;
  const p3 = useRef(new Animated.Value(0)).current;
  const p4 = useRef(new Animated.Value(0)).current;
  const p5 = useRef(new Animated.Value(0)).current;
  const p6 = useRef(new Animated.Value(0)).current;
  const p7 = useRef(new Animated.Value(0)).current;
  const p8 = useRef(new Animated.Value(0)).current;
  const p9 = useRef(new Animated.Value(0)).current;
  const p10 = useRef(new Animated.Value(0)).current;
  const p11 = useRef(new Animated.Value(0)).current;
  const pAnims = [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11];

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const dur = { useNativeDriver: true };

    // Flash burst
    const flashSeq = Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 80, ...dur }),
      Animated.timing(flash, { toValue: 0.3, duration: 250, ...dur }),
      Animated.timing(flash, { toValue: 0, duration: 600, ...dur }),
    ]);

    // Shockwave rings
    const ring1 = Animated.timing(r1, { toValue: 1, duration: 900, ...dur });
    const ring2 = Animated.sequence([
      Animated.delay(120),
      Animated.timing(r2, { toValue: 1, duration: 800, ...dur }),
    ]);
    const ring3 = Animated.sequence([
      Animated.delay(250),
      Animated.timing(r3, { toValue: 1, duration: 700, ...dur }),
    ]);

    // Core pulse (circle expands then fades)
    const core = Animated.sequence([
      Animated.timing(corePulse, { toValue: 1, duration: 400, ...dur }),
      Animated.timing(corePulse, { toValue: 1, duration: 200, ...dur }),
    ]);

    // Particles
    const particleAnims = pAnims.map((p, i) =>
      Animated.sequence([
        Animated.delay(i * 18),
        Animated.timing(p, { toValue: 1, duration: 750, ...dur }),
      ])
    );

    // "УНИЧТОЖЕНО" text appears at 400ms
    const textAnim = Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(textScale, { toValue: 1, friction: 4, tension: 120, ...dur }),
        Animated.timing(textOp, { toValue: 1, duration: 250, ...dur }),
      ]),
    ]);

    Animated.parallel([
      flashSeq,
      ring1, ring2, ring3,
      core,
      ...particleAnims,
      textAnim,
    ]).start(() => {
      setTimeout(onDone, 900);
    });
  }, []);

  // Ring interpolations
  const ringStyle = (anim: Animated.Value, maxScale: number, color: string) => ({
    position: "absolute" as const,
    width: 160, height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: color,
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, maxScale] }) }],
  });

  const flashOp = flash.interpolate({ inputRange: [0,1], outputRange: [0, 0.85] });
  const coreScale = corePulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 2.5, 3.5] });
  const coreOp = corePulse.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.6, 0] });

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
      {/* White flash */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flashOp }]} />

      {/* Core burst */}
      <Animated.View style={{
        position: "absolute",
        width: 150, height: 150,
        borderRadius: 75,
        backgroundColor: "#ff6a00",
        opacity: coreOp,
        transform: [{ scale: coreScale }],
      }} />

      {/* Shockwave rings */}
      <Animated.View style={ringStyle(r1, 3.2, "#ff6a00")} />
      <Animated.View style={ringStyle(r2, 2.6, "#ffcc00")} />
      <Animated.View style={ringStyle(r3, 2.0, C.red)} />

      {/* Particles */}
      {PARTICLES.map((p, i) => {
        const anim = pAnims[i];
        const rad = (p.angle * Math.PI) / 180;
        const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * p.dist] });
        const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * p.dist] });
        const sc = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1.4, 1, 0.3] });
        const op = anim.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 0.8, 0] });
        return (
          <Animated.View key={i} style={{
            position: "absolute",
            width: p.size, height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: op,
            transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }],
          }} />
        );
      })}

      {/* УНИЧТОЖЕНО text */}
      <Animated.Text style={{
        position: "absolute",
        bottom: "30%",
        fontSize: 22,
        fontFamily: "Inter_700Bold",
        color: C.red,
        letterSpacing: 6,
        textShadowColor: C.red + "99",
        textShadowRadius: 20,
        textShadowOffset: { width: 0, height: 0 },
        opacity: textOp,
        transform: [{ scale: textScale }],
      }}>
        УНИЧТОЖЕНО
      </Animated.Text>
    </View>
  );
}

// ─── Countdown Screen ─────────────────────────────────────────────────────────
function CountdownScreen({
  targetCount,
  onComplete,
  onCancel,
}: {
  targetCount: number;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [exploding, setExploding] = useState(false);
  const circleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(circleScale, { toValue: 1.05, duration: 400, useNativeDriver: true }),
        Animated.timing(circleScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          pulse.stop();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setExploding(true);
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return s - 1;
      });
    }, 1000);

    return () => { clearInterval(interval); pulse.stop(); };
  }, []);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBot = Platform.OS === "web" ? 34 : 0;
  const circleColor = seconds <= 3 ? C.red : C.gold;

  return (
    <LinearGradient colors={[C.bg, "#0c0008", C.bg]} style={StyleSheet.absoluteFill}>
      <View style={[cd.inner, { paddingTop: insets.top + 24 + webTop, paddingBottom: insets.bottom + 24 + webBot }]}>
        <View style={cd.topOrnament}>
          <View style={[cd.ornLine, { backgroundColor: C.gold + "55" }]} />
          <MaterialCommunityIcons name="fleur-de-lis" size={14} color={C.gold + "88"} />
          <View style={[cd.ornLine, { backgroundColor: C.gold + "55" }]} />
        </View>

        <Text style={cd.title}>ИНИЦИАЦИЯ{"\n"}ЭКЗЕРМИНАТУСА</Text>
        <Text style={cd.subtitle}>Д О  О Р Б И Т А Л Ь Н О Й  Б О М Б А Р Д И Р О В К И</Text>

        <Animated.View style={[cd.circleWrap, { transform: [{ scale: circleScale }] }]}>
          <View style={[cd.circleBg, { borderColor: circleColor + "bb" }]}>
            <View style={[cd.circleInner, { borderColor: circleColor + "33" }]}>
              <Text style={[cd.countNum, { color: circleColor, textShadowColor: circleColor + "88" }]}>
                {seconds}
              </Text>
              <Text style={[cd.countLabel, { color: circleColor }]}>
                {seconds === 1 ? "СЕКУНДА" : seconds < 5 ? "СЕКУНДЫ" : "СЕКУНД"}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Text style={cd.targetCount}>
          {targetCount}{" "}
          {targetCount === 1 ? "ЦЕЛЬ" : targetCount < 5 ? "ЦЕЛИ" : "ЦЕЛЕЙ"}
        </Text>

        <Text style={cd.quote}>
          {"\"Нет прощения. Нет пощады.\nТолько уничтожение.\""}
        </Text>

        <View style={cd.spacer} />

        {!exploding && (
          <TouchableOpacity onPress={onCancel} activeOpacity={0.75}>
            <OrnateBox style={cd.cancelBox} bColor={C.surfaceBorder} cColor={C.muted} cSize={10}>
              <View style={cd.cancelInner}>
                <Text style={cd.cancelText}>ОТМЕНИТЬ ПРИКАЗ</Text>
              </View>
            </OrnateBox>
          </TouchableOpacity>
        )}
      </View>

      {exploding && <Explosion onDone={onComplete} />}
    </LinearGradient>
  );
}

const cd = StyleSheet.create({
  inner: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  topOrnament: { flexDirection: "row", alignItems: "center", width: "70%", gap: 10, marginBottom: 28 },
  ornLine: { flex: 1, height: 1 },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: C.red,
    letterSpacing: 3,
    textAlign: "center",
    textShadowColor: C.red + "66",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: 10,
  },
  subtitle: { fontSize: 9, letterSpacing: 2, color: C.fgDim, fontFamily: "Inter_500Medium", textAlign: "center", marginBottom: 32 },
  circleWrap: { marginBottom: 28 },
  circleBg: { width: 150, height: 150, borderRadius: 75, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  circleInner: { width: 130, height: 130, borderRadius: 65, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  countNum: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  countLabel: { fontSize: 9, letterSpacing: 3, fontFamily: "Inter_600SemiBold", marginTop: -2 },
  targetCount: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.fg, letterSpacing: 4, marginBottom: 14 },
  quote: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.fgDim, textAlign: "center", fontStyle: "italic", lineHeight: 20 },
  spacer: { flex: 1 },
  cancelBox: {},
  cancelInner: { paddingVertical: 14, paddingHorizontal: 40 },
  cancelText: { fontSize: 11, letterSpacing: 4, fontFamily: "Inter_600SemiBold", color: C.fgDim },
});

// ─── Target Row ───────────────────────────────────────────────────────────────
function TargetRow({
  target,
  onToggle,
  onDelete,
}: {
  target: Target;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    onToggle(target.id);
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient
        colors={target.eliminated ? [C.bg2, C.bg2] : [C.surface, C.bg2]}
        style={[s.targetRow, { borderColor: target.eliminated ? C.muted + "44" : C.surfaceBorder }]}
      >
        <View style={[s.accentBar, { backgroundColor: target.eliminated ? C.muted + "44" : C.gold }]} />
        <TouchableOpacity style={s.checkWrap} onPress={handleToggle} activeOpacity={0.7}>
          <View style={[s.checkBox, { borderColor: target.eliminated ? C.gold : C.muted, backgroundColor: target.eliminated ? C.gold + "22" : "transparent" }]}>
            {target.eliminated && <MaterialCommunityIcons name="crosshairs-gps" size={11} color={C.gold} />}
          </View>
        </TouchableOpacity>
        <Text style={[s.targetText, target.eliminated && { color: C.fgDim, textDecorationLine: "line-through" }]} numberOfLines={1}>
          {target.text.toUpperCase()}
        </Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDelete(target.id); }} style={s.delBtn}>
          <Feather name="x" size={13} color={C.muted} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ExterminatusScreen() {
  const insets = useSafeAreaInsets();
  const [targets, setTargets] = useState<Target[]>([]);
  const [inputText, setInputText] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0.75)).current;

  const active = targets.filter((t) => !t.eliminated);
  const canExecute = active.length > 0;
  const allDone = targets.length > 0 && active.length === 0;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((d) => { if (d) setTargets(JSON.parse(d)); });
    AsyncStorage.getItem(HISTORY_KEY).then((d) => {
      if (d) setHistoryCount((JSON.parse(d) as HistoryEntry[]).length);
    });
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(titleOpacity, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 0.75, duration: 2400, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (canExecute) {
      const p = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.012, duration: 950, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
      ]));
      const g = Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 950, useNativeDriver: true }),
      ]));
      p.start(); g.start();
      return () => { p.stop(); g.stop(); };
    }
    pulseAnim.setValue(1); glowAnim.setValue(0);
  }, [canExecute]);

  const save = useCallback(async (list: Target[]) => {
    setTargets(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const handleAdd = () => {
    const t = inputText.trim();
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    save([...targets, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 8),
      text: t,
      eliminated: false,
    }]);
    setInputText("");
  };

  const handleExecute = () => {
    if (!canExecute) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowCountdown(true);
  };

  const handleCountdownComplete = useCallback(async () => {
    const activeTargets = targets.filter((t) => !t.eliminated);

    // Save to history
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const hist: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const entry: HistoryEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 8),
      date: new Date().toISOString(),
      targetCount: activeTargets.length,
      targets: activeTargets.map((t) => t.text),
    };
    const newHist = [...hist, entry];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHist));
    setHistoryCount(newHist.length);

    // Clear ALL targets from list after execution
    await save([]);
    setShowCountdown(false);
  }, [targets, save]);

  const handleCancelCountdown = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowCountdown(false);
  }, []);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBot = Platform.OS === "web" ? 34 : 0;
  const glowOp = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <>
      <LinearGradient colors={[C.bg, C.bg2, C.bg]} style={s.root}>
        <LinearGradient colors={[C.redDark + "28", "transparent"]} style={StyleSheet.absoluteFill} pointerEvents="none" />

        <View style={[s.inner, { paddingTop: insets.top + 16 + webTop, paddingBottom: insets.bottom + 12 + webBot }]}>

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View style={s.headerContent} pointerEvents="box-none">
              <View style={s.divRow}>
                <View style={[s.divLine, { backgroundColor: C.gold + "55" }]} />
                <MaterialCommunityIcons name="fleur-de-lis" size={10} color={C.gold + "88"} />
                <View style={[s.divLine, { backgroundColor: C.gold + "55" }]} />
              </View>
              <Text style={s.suptitle}>— ИМПЕРАТОРСКАЯ ДИРЕКТИВА —</Text>
              <Animated.Text style={[s.title, { opacity: titleOpacity }]}>EXTERMINATUS</Animated.Text>
              <View style={s.titleUnderline} />
              <Text style={s.subtitle}>П Р О Т О К О Л  П О Л Н О Г О  У Н И Ч Т О Ж Е Н И Я</Text>
              <View style={[s.divRow, { marginTop: 8, width: "60%" }]}>
                <View style={[s.divLine, { backgroundColor: C.gold + "33" }]} />
                <MaterialCommunityIcons name="rhombus-outline" size={7} color={C.gold + "55"} />
                <View style={[s.divLine, { backgroundColor: C.gold + "33" }]} />
              </View>
            </View>

            {/* History button */}
            <TouchableOpacity style={s.histBtn} onPress={() => router.push("/history")} activeOpacity={0.7}>
              <MaterialCommunityIcons name="book-open-variant" size={17} color={C.gold + "cc"} />
              {historyCount > 0 && (
                <View style={s.histBadge}>
                  <Text style={s.histBadgeText}>{historyCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── INPUT ── */}
          <View style={s.inputSection}>
            <View style={s.labelRow}>
              <View style={s.labelDot} />
              <Text style={s.label}>ДОБАВИТЬ ЦЕЛЬ</Text>
            </View>
            <OrnateBox bColor={C.surfaceBorder} cColor={C.gold} cSize={9}>
              <LinearGradient colors={[C.surface, C.bg2]} style={s.inputInner}>
                <TextInput
                  style={s.input}
                  placeholder="Добавить цель..."
                  placeholderTextColor={C.fgDim}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                  maxLength={60}
                />
                <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.7}>
                  <LinearGradient colors={[C.gold + "44", C.gold + "11"]} style={s.addBtnGrad}>
                    <Feather name="plus" size={17} color={C.gold} />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </OrnateBox>
          </View>

          {/* ── LIST / EMPTY ── */}
          {targets.length === 0 ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="crosshairs" size={38} color={C.muted + "44"} />
              <Text style={s.emptyTitle}>НЕТ ЦЕЛЕЙ</Text>
              <Text style={s.emptySub}>Добавь хотя бы одну цель выше</Text>
            </View>
          ) : (
            <FlatList
              data={targets}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <TargetRow
                  target={item}
                  onToggle={(id) => save(targets.map((t) => t.id === id ? { ...t, eliminated: !t.eliminated } : t))}
                  onDelete={(id) => save(targets.filter((t) => t.id !== id))}
                />
              )}
              contentContainerStyle={s.listContent}
              style={s.list}
              showsVerticalScrollIndicator={false}
              scrollEnabled={targets.length > 4}
            />
          )}

          {/* ── BIG BUTTON ── */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            {canExecute && (
              <Animated.View style={[s.extGlow, { opacity: glowOp }]} pointerEvents="none" />
            )}
            <TouchableOpacity onPress={handleExecute} activeOpacity={0.82} disabled={!canExecute}>
              <OrnateBox bColor={canExecute ? C.red + "bb" : C.surfaceBorder} cColor={canExecute ? C.red : C.muted} cSize={13}>
                <LinearGradient
                  colors={canExecute ? [C.redDark + "50", C.red + "1a", C.redDark + "28"] : [C.surface, C.bg2]}
                  style={s.extInner}
                >
                  <View style={s.extDivRow}>
                    <View style={[s.extDivLine, { backgroundColor: canExecute ? C.red + "55" : C.muted + "33" }]} />
                    <Text style={[s.extSup, { color: canExecute ? C.gold : C.muted }]}>✠  EXTERMINATUS  ✠</Text>
                    <View style={[s.extDivLine, { backgroundColor: canExecute ? C.red + "55" : C.muted + "33" }]} />
                  </View>
                  <Text style={[s.extTitle, { color: canExecute ? C.fg : C.fgDim }]}>ЭКЗЕРМИНАТУС</Text>
                  <Text style={[s.extSub, { color: canExecute ? C.red + "cc" : C.muted + "66" }]}>
                    {allDone
                      ? "ВСЕ ЦЕЛИ УНИЧТОЖЕНЫ"
                      : canExecute
                      ? `УНИЧТОЖИТЬ ${active.length} ${active.length === 1 ? "ЦЕЛЬ" : active.length < 5 ? "ЦЕЛИ" : "ЦЕЛЕЙ"}`
                      : "НЕТ ЦЕЛЕЙ ДЛЯ УНИЧТОЖЕНИЯ"}
                  </Text>
                </LinearGradient>
              </OrnateBox>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>

      <Modal visible={showCountdown} animationType="fade" statusBarTranslucent>
        <CountdownScreen
          targetCount={active.length}
          onComplete={handleCountdownComplete}
          onCancel={handleCancelCountdown}
        />
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 18 },

  header: { marginBottom: 18 },
  headerContent: { alignItems: "center" },
  histBtn: { position: "absolute", top: 4, right: 0, width: 36, height: 36, alignItems: "center", justifyContent: "center", zIndex: 10 },
  histBadge: {
    position: "absolute", top: 2, right: 2,
    backgroundColor: C.red,
    borderRadius: 6,
    minWidth: 12, height: 12,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 2,
  },
  histBadgeText: { fontSize: 7, color: "#fff", fontFamily: "Inter_700Bold" },

  divRow: { flexDirection: "row", alignItems: "center", width: "80%", gap: 8, marginBottom: 5 },
  divLine: { flex: 1, height: 1 },
  suptitle: { fontSize: 9, letterSpacing: 3, color: C.gold, fontFamily: "Inter_600SemiBold", marginBottom: 5 },
  title: {
    fontSize: 30, letterSpacing: 6, color: C.red, fontFamily: "Inter_700Bold",
    textShadowColor: C.red + "77", textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 },
  },
  titleUnderline: { width: "65%", height: 1, backgroundColor: C.red + "44", marginTop: 4, marginBottom: 5 },
  subtitle: { fontSize: 8, letterSpacing: 1.5, color: C.fgDim, fontFamily: "Inter_500Medium" },


  inputSection: { marginBottom: 16 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  labelDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold },
  label: { fontSize: 8, letterSpacing: 3, color: C.muted, fontFamily: "Inter_600SemiBold" },
  inputInner: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.fg, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  addBtn: { width: 46, alignItems: "center", justifyContent: "center" },
  addBtnGrad: { width: 46, paddingVertical: 12, alignItems: "center", justifyContent: "center" },

  list: { flex: 1 },
  listContent: { gap: 5, paddingBottom: 12 },
  targetRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingVertical: 10, paddingRight: 10, gap: 8 },
  accentBar: { width: 2, alignSelf: "stretch" },
  checkWrap: { paddingLeft: 8, paddingVertical: 2 },
  checkBox: { width: 18, height: 18, borderWidth: 1, borderRadius: 1, alignItems: "center", justifyContent: "center" },
  targetText: { flex: 1, fontSize: 12, color: C.fg, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  delBtn: { padding: 4 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 7, paddingBottom: 24 },
  emptyTitle: { fontSize: 11, letterSpacing: 5, color: C.muted, fontFamily: "Inter_700Bold", marginTop: 6 },
  emptySub: { fontSize: 11, color: C.fgDim, fontFamily: "Inter_400Regular" },

  extGlow: {
    position: "absolute", top: -6, left: -6, right: -6, bottom: -6,
    backgroundColor: C.red + "14",
    shadowColor: C.red, shadowRadius: 18, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 },
  },
  extInner: { paddingVertical: 16, paddingHorizontal: 18, alignItems: "center", gap: 2 },
  extDivRow: { flexDirection: "row", alignItems: "center", gap: 7, width: "100%", marginBottom: 3 },
  extDivLine: { flex: 1, height: 1 },
  extSup: { fontSize: 9, letterSpacing: 2.5, fontFamily: "Inter_600SemiBold" },
  extTitle: { fontSize: 22, letterSpacing: 5, fontFamily: "Inter_700Bold" },
  extSub: { fontSize: 8, letterSpacing: 2, fontFamily: "Inter_500Medium", marginTop: 1 },
});
