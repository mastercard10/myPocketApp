import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StatusBar,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { Appbar, Button, Card, FAB, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";

interface Transaction {
  id: string;
  type: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string | Date;
}

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionsListScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const createId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem("transactions");
      if (!stored) {
        setTransactions([]);
        return;
      }
      let arr = JSON.parse(stored);
      if (!Array.isArray(arr)) arr = [arr];

      let changed = false;
      const normalized: Transaction[] = arr.map((t: any) => {
        const next: Transaction = { ...t };
        if (!next.id) {
          next.id = createId();
          changed = true;
        }
        if (typeof next.id !== "string") {
          next.id = String(next.id);
          changed = true;
        }
        return next;
      });

      if (changed) {
        await AsyncStorage.setItem("transactions", JSON.stringify(normalized));
      }
      setTransactions(normalized);
    } catch (e) {
      console.error("Erreur chargement transactions:", e);
      setTransactions([]);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  const filters = [
    { key: "Toutes", label: "Toutes" },
    { key: "Revenus", label: "Revenus" },
    { key: "Dépenses", label: "Dépenses" },
  ];

  const getFilteredTransactions = () => {
    if (activeFilter === "Toutes") return transactions;
    if (activeFilter === "Revenus")
      return transactions.filter((t) => t.type === "Revenu");
    if (activeFilter === "Dépenses")
      return transactions.filter((t) => t.type === "Dépense");
    return transactions;
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} F CFA`;
  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryInfo = (category: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      salaire: { icon: "work", color: "#4CAF50" },
      cadeau: { icon: "card-giftcard", color: "#FF9800" },
      nourriture: { icon: "restaurant", color: "#FF5722" },
      transport: { icon: "directions-car", color: "#607D8B" },
      logement: { icon: "home", color: "#795548" },
      loisirs: { icon: "sports-esports", color: "#E91E63" },
      sante: { icon: "local-hospital", color: "#00BCD4" },
      autre: { icon: "add-circle-outline", color: "#9E9E9E" },
    };
    return map[category] || { icon: "receipt", color: "#9E9E9E" };
  };

  const deleteById = async (id: string) => {
    try {
      const updated = transactions.filter((t) => t.id !== id);
      await AsyncStorage.setItem("transactions", JSON.stringify(updated));
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTransactions(updated);
      setConfirmDeleteId(null);
    } catch (e) {
      console.error("Erreur suppression:", e);
    }
  };

  const editTransaction = (t: Transaction) => {
    router.push({
      pathname: "/add_transaction",
      params: { editMode: "true", transaction: JSON.stringify(t) },
    });
  };

  const filtered = getFilteredTransactions();

  const TransactionItem = ({ t }: { t: Transaction }) => {
    const isExpense = t.type === "Dépense";
    const { icon, color } = getCategoryInfo(t.category);
    const swipeRef = useRef<Swipeable>(null);

    const LeftActions = () => (
      <View style={styles.leftActions}>
        <RectButton
          style={[styles.actionBtn, { backgroundColor: "#E3F2FD" }]}
          onPress={() => {
            swipeRef.current?.close();
            editTransaction(t);
          }}
        >
          <Icon name="edit" size={20} color="#1E88E5" />
          <Text style={styles.actionText}>Modifier</Text>
        </RectButton>
      </View>
    );

    const RightActions = () => (
      <View style={styles.rightActions}>
        <RectButton
          style={[styles.actionBtn, { backgroundColor: "#E53935" }]}
          onPress={() => {
            swipeRef.current?.close();
            setConfirmDeleteId(t.id);
          }}
        >
          <Icon name="delete" size={20} color="#fff" />
          <Text style={[styles.actionText, { color: "#fff" }]}>Supprimer</Text>
        </RectButton>
      </View>
    );

    return (
      <Card
         key={t.id}
         style={styles.card}
         onPress={() => router.push('/transaction/'+t.id)}
      >

        <Swipeable
          ref={swipeRef}
          renderLeftActions={LeftActions}
          renderRightActions={RightActions}
          overshootLeft={false}
          overshootRight={false}
        >
          <Card.Content style={styles.transactionItem}>
            <View
              style={[styles.iconContainer, { backgroundColor: `${color}20` }]}
            >
              <Icon name={icon} size={18} color={color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={styles.title}>
                {t.title}
              </Text>

              <Text variant="titleSmall" style={{ color: "#757575" }}>
                {t.description}
              </Text>

              <Text variant="bodySmall" style={{ color: "#757575" }}>
                {t.category.charAt(0).toUpperCase() + t.category.slice(1)} •{" "}
                {formatDate(t.date)}
              </Text>
            </View>

            <Text
              variant="titleMedium"
              style={{
                color: isExpense ? theme.colors.error : theme.colors.secondary,
                fontWeight: "700",
              }}
            >
              {isExpense ? "-" : "+"}
              {formatCurrency(Math.abs(t.amount))}
            </Text>
          </Card.Content>
        </Swipeable>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header
        mode="small"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <Appbar.Action
          icon="arrow-left"
          color="#fff"
          onPress={() => router.back()}
        />
        <Appbar.Content title="Transactions" titleStyle={{ color: "#fff" }} />

        {/* <Appbar.Action
            icon="plus"
            color="#fff"
            onPress={() => router.push("/add_transaction")}
          />*/}
      </Appbar.Header>

      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle="light-content"
      />

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {filters.map((f) => (
          <Button
            key={f.key}
            mode={activeFilter === f.key ? "contained" : "outlined"}
            onPress={() => setActiveFilter(f.key)}
            style={styles.filterButton}
          >
            {f.label}
          </Button>
        ))}
      </View>

      {/* Liste */}
      {filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionItem t={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <Icon name="receipt-long" size={64} color="#D0D0D0" />
          <Text style={{ color: "#757575", marginTop: 8 }}>
            Aucune transaction
          </Text>
        </View>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        color="#fff"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push("/add_transaction")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
    marginHorizontal: 8,
  },
  filterButton: {
    borderRadius: 20,
  },
  card: {
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontWeight: "600", marginBottom: 2 },
  leftActions: { flexDirection: "row" },
  rightActions: { flexDirection: "row", justifyContent: "flex-end" },
  actionBtn: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  fab: {
    position: "absolute",
    bottom: "5%",
    right: 24,
  },
});
