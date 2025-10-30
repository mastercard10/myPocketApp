// app/(tabs)/transactions.tsx (ou ton écran équivalent)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialIcons";

// Types
interface Transaction {
  id: string;
  type: string; // 'Revenu' | 'Dépense'
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string | Date;
  icon?: string;
  color?: string;
}

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TransactionsListScreen = () => {
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const createId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // Charge + normalise (assure un id string)
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

  const filterButtons = [
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
    if (isNaN(d.getTime())) return "Date invalide";
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryInfo = (category: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      salaire: { icon: "work", color: "#4CAF50" },
      freelance: { icon: "laptop", color: "#2196F3" },
      investissement: { icon: "trending-up", color: "#9C27B0" },
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

  const goToDetails = (id: string) => {
    router.push({ pathname: "/transaction/[id]", params: { id } });
  };

  const editTransaction = (t: Transaction) => {
    router.push({
      pathname: "/add_transaction",
      params: { editMode: "true", transaction: JSON.stringify(t) },
    });
  };

  const FilterButton = ({ filter }: any) => {
    const isActive = activeFilter === filter.key;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setActiveFilter(filter.key)}
      >
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.filterButtonTextActive,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const ConfirmDeleteBar = ({
    onCancel,
    onConfirm,
  }: {
    onCancel: () => void;
    onConfirm: () => void;
  }) => (
    <View style={styles.confirmBar}>
      <Icon name="warning-amber" size={18} color="#D32F2F" />
      <Text style={styles.confirmText}>Supprimer cette transaction ?</Text>
      <TouchableOpacity
        style={[styles.confirmBtn, styles.cancelBtn]}
        onPress={onCancel}
      >
        <Text style={styles.cancelText}>Annuler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.confirmBtn, styles.confirmBtnDanger]}
        onPress={onConfirm}
      >
        <Text style={styles.confirmDangerText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const isExpense = transaction.type === "Dépense";
    const { icon, color } = getCategoryInfo(transaction.category);
    const swipeRef = useRef<Swipeable>(null);
    const closeRow = () => swipeRef.current?.close();

    const LeftActions = () => (
      <View style={styles.leftActionsContainer}>
        <RectButton
          style={[styles.leftAction, styles.detailAction]}
          onPress={() => {
            closeRow();
            goToDetails(transaction.id);
          }}
        >
          <Icon name="info" size={20} color="#1565C0" />
          <Text style={[styles.actionText, { color: "#1565C0" }]}>Détails</Text>
        </RectButton>
        <RectButton
          style={[styles.leftAction, styles.editAction]}
          onPress={() => {
            closeRow();
            editTransaction(transaction);
          }}
        >
          <Icon name="edit" size={20} color="#1E88E5" />
          <Text style={[styles.actionText, { color: "#1E88E5" }]}>
            Modifier
          </Text>
        </RectButton>
      </View>
    );

    const RightActions = () => (
      <View style={styles.rightActionsContainer}>
        <RectButton
          style={[styles.rightAction, styles.deleteAction]}
          onPress={() => {
            closeRow();
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut
            );
            setConfirmDeleteId(transaction.id);
          }}
        >
          <Icon name="delete" size={20} color="#fff" />
          <Text style={[styles.actionText, { color: "#fff" }]}>Supprimer</Text>
        </RectButton>
      </View>
    );

    return (
      <View style={styles.transactionCard}>
        <Swipeable
          ref={swipeRef}
          renderLeftActions={LeftActions}
          renderRightActions={RightActions}
          overshootLeft={false}
          overshootRight={false}
          friction={2}
          leftThreshold={40}
          rightThreshold={40}
        >
          <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => goToDetails(transaction.id)}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.transactionIcon,
                { backgroundColor: `${color}15` },
              ]}
            >
              <Icon name={icon} size={24} color={color} />
            </View>

            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
              <Text style={styles.transactionCategory}>
                {transaction.category.charAt(0).toUpperCase() +
                  transaction.category.slice(1)}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(transaction.date)}
              </Text>
            </View>

            <View style={styles.transactionAmountContainer}>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: isExpense ? "#F44336" : "#4CAF50" },
                ]}
              >
                {isExpense ? "-" : "+"}
                {formatCurrency(Math.abs(transaction.amount))}
              </Text>
              <Icon name="chevron-right" size={20} color="#BDBDBD" />
            </View>
          </TouchableOpacity>
        </Swipeable>

        {confirmDeleteId === transaction.id && (
          <ConfirmDeleteBar
            onCancel={() => setConfirmDeleteId(null)}
            onConfirm={() => deleteById(transaction.id)}
          />
        )}
      </View>
    );
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    // Si ton app a déjà un GestureHandlerRootView global, retire ce wrapper
    // <GestureHandlerRootView style={{ flex: 1 }}>

    // </GestureHandlerRootView>
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {<Text style={styles.headerTitle}>Transactions</Text>}
          <Text style={styles.transactionCount}>
            {filteredTransactions.length} transaction
            {filteredTransactions.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>      

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filtres */}
        <View style={styles.filtersContainer}>
          {filterButtons.map((filter) => (
            <FilterButton key={filter.key} filter={filter} />
          ))}
        </View>

        {/* Liste */}
        <View style={styles.content}>
          {filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionItem transaction={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.transactionsList}
              extraData={confirmDeleteId}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Icon name="receipt-long" size={64} color="#E0E0E0" />
              <Text style={styles.emptyStateTitle}>Aucune transaction</Text>
              <Text style={styles.emptyStateSubtitle}>
                Ajoutez votre première transaction en cliquant sur le bouton +
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add_transaction")}
        activeOpacity={0.8}
      >
        <Icon name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#ffffff",
    marginTop: 20,
  },
  backButton: { padding: 8, marginRight: 8 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333333" },
  transactionCount: { fontSize: 14, color: "#757575", marginTop: 2 },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterButtonActive: { backgroundColor: "#4285F4", borderColor: "#4285F4" },
  filterButtonText: { fontSize: 14, fontWeight: "500", color: "#757575" },
  filterButtonTextActive: { color: "#ffffff", fontWeight: "600" },
  content: { flex: 1, backgroundColor: "#FAFAFA" },
  transactionsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Carte
  transactionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginVertical: 4,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionDetails: { flex: 1 },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  transactionCategory: { fontSize: 14, color: "#757575", marginBottom: 2 },
  transactionDate: { fontSize: 12, color: "#BDBDBD" },
  transactionAmountContainer: { flexDirection: "row", alignItems: "center" },
  transactionAmount: { fontSize: 16, fontWeight: "bold", marginRight: 4 },

  // Swipe actions
  leftActionsContainer: { width: 160, flexDirection: "row" },
  leftAction: { width: 80, justifyContent: "center", alignItems: "center" },
  detailAction: { backgroundColor: "#E3F2FD" },
  editAction: { backgroundColor: "#D6EBFF" },
  rightActionsContainer: {
    width: 100,
    alignItems: "flex-end",
    flexDirection: "row",
  },
  rightAction: { width: 100, justifyContent: "center", alignItems: "center" },
  deleteAction: { backgroundColor: "#E53935" },
  actionText: { marginTop: 4, fontSize: 12, fontWeight: "600" },

  // Barre de confirmation
  confirmBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF5F5",
    borderTopWidth: 1,
    borderTopColor: "#FFCDD2",
  },
  confirmText: { flex: 1, color: "#D32F2F", fontWeight: "600" },
  confirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelBtn: { backgroundColor: "#F8F9FA" },
  cancelText: { color: "#555" },
  confirmBtnDanger: { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" },
  confirmDangerText: { color: "#D32F2F", fontWeight: "700" },

  // Empty
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#757575",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#BDBDBD",
    textAlign: "center",
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
});

export default TransactionsListScreen;
