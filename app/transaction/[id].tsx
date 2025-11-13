import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
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

const TransactionDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("transactions");
      const arr: Transaction[] = stored ? JSON.parse(stored) : [];
      const found = arr.find((t) => String(t.id) === String(id)) || null;
      setTransaction(found);
    } catch (e) {
      console.error("Erreur chargement:", e);
      setTransaction(null);
    }
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const formatCurrency = (a: number) => `${a.toFixed(2)} F CFA`;
  const formatDate = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const deleteAndGoBack = async () => {
    if (!transaction) return;
    try {
      const stored = await AsyncStorage.getItem("transactions");
      const arr: Transaction[] = stored ? JSON.parse(stored) : [];
      const updated = arr.filter(
        (t) => String(t.id) !== String(transaction.id)
      );
      await AsyncStorage.setItem("transactions", JSON.stringify(updated));
      router.back();
    } catch (e) {
      console.error("Erreur suppression:", e);
    }
  };

  const editTransaction = () => {
    if (!transaction) return;
    router.push({
      pathname: "/add_transaction",
      params: { editMode: "true", transaction: JSON.stringify(transaction) },
    });
  };

  if (!transaction) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <Text style={{ color: "#777" }}>Transaction introuvable</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: "#4285F4", fontWeight: "600" }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isExpense = transaction.type === "Dépense";

  const deleteTransaction = async (transactionId: string) => {
          Alert.alert(
            "Supprimer",
            "Voulez-vous vraiment supprimer cette transaction?",
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Supprimer",
                style: "destructive",
                onPress: async () => {
                  try {
                /*   const raw = await AsyncStorage.getItem("transactions");
                    let transactions: Transaction[] = raw ? JSON.parse(raw) : [];

                    transactions = transactions.filter(
                      (tx) => tx.id !== transactionId
                    );
                    await AsyncStorage.setItem(
                      "transactions",
                      JSON.stringify(transactions)
                    );
                    await loadPlannedTransactions();*/

                    const stored = await AsyncStorage.getItem("transactions");
                          const arr: Transaction[] = stored ? JSON.parse(stored) : [];
                          const updated = arr.filter(
                            (t) => String(t.id) !== String(transaction.id)
                          );
                          await AsyncStorage.setItem("transactions", JSON.stringify(updated));
                          router.back();
                  } catch (error) {
                    Alert.alert("Erreur", "Impossible de supprimer la transaction"+error);
                  }
                },
              },
            ]
          );
        };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Montant */}
      <View style={styles.amountBox}>
        <Text
          style={[styles.amount, { color: isExpense ? "#F44336" : "#4CAF50" }]}
        >
          {isExpense ? "-" : "+"}
          {formatCurrency(Math.abs(transaction.amount))}
        </Text>
        <Text style={styles.typeBadge}>{transaction.type}</Text>
      </View>

      {/* Infos */}
      <View style={styles.card}>
      {/*  <Row icon="title" label="Titre" value={transaction.title} />*/}
        <Row icon="category" label="Catégorie" value={transaction.category} />
        <Row icon="event" label="Date" value={formatDate(transaction.date)} />
        <Row
          icon="description"
          label="Description"
          value={transaction.description || "—"}
          last
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={editTransaction}
                >
                  <Icon name="edit" size={20} color="#1E88E5" />
                  <Text style={[styles.actionText, { color: "#1E88E5" }]}>
                    Modifier
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                //  onPress={() => setConfirm(true)}
                    onPress={() => deleteTransaction(transaction.id)}
                >
                  <Icon name="delete" size={20} color="#E53935" />
                  <Text style={[styles.actionText, { color: "#E53935" }]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>

    </SafeAreaView>
  );
};

const Row = ({
  icon,
  label,
  value,
  last = false,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon name={icon} size={20} color="#9E9E9E" />
      <Text style={styles.label}>{label}</Text>
    </View>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  amountBox: { alignItems: "center", marginTop: 12, marginBottom: 12 },
  amount: { fontSize: 32, fontWeight: "bold" },
  typeBadge: { marginTop: 6, color: "#757575", fontWeight: "600" },

  card: {
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F6F6F6",
  },
  label: { marginLeft: 8, color: "#757575" },
  value: {
    color: "#333",
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },

  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F5F8FF",
  },
  actionText: { fontSize: 16, fontWeight: "600" },
  editBtn: { backgroundColor: "#E3F2FD" },
  deleteBtn: { backgroundColor: "#FFEBEE" },

  confirmBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  confirmText: { flex: 1, color: "#D32F2F", fontWeight: "600" },
  confirmPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backBtn: {
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
});

export default TransactionDetailScreen;
