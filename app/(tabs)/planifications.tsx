import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from "react-native";
import {
  Appbar,
  Card,
  FAB,
  Text,
  Button,
  useTheme,
  Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface Transaction {
  id: string;
  type: "Revenu" | "Dépense";
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  isPlanned?: boolean;
  plannedMonth?: string;
}

const PlannedTransactionsScreen = () => {
  const theme = useTheme();
  const [plannedTransactions, setPlannedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "salaire", name: "Salaire", icon: "briefcase", color: "#10B981" },
    { id: "cadeau", name: "Cadeau", icon: "gift", color: "#F59E0B" },
    { id: "nourriture", name: "Nourriture", icon: "food", color: "#EF4444" },
    { id: "transport", name: "Transport", icon: "car", color: "#6366F1" },
    { id: "logement", name: "Logement", icon: "home", color: "#8B5CF6" },
    { id: "loisirs", name: "Loisirs", icon: "gamepad-variant", color: "#EC4899" },
    { id: "sante", name: "Santé", icon: "hospital", color: "#06B6D4" },
    { id: "autre", name: "Autre", icon: "dots-horizontal-circle", color: "#6B7280" },
  ];

  const loadPlannedTransactions = async () => {
    try {
      const raw = await AsyncStorage.getItem("transactions");
      const transactions: Transaction[] = raw ? JSON.parse(raw) : [];

      const planned = transactions.filter(tx => tx.isPlanned && tx.type === "Dépense");

      // Grouper par mois
      const groupedByMonth = planned.reduce((acc, transaction) => {
        const month = transaction.plannedMonth || "Non spécifié";
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(transaction);
        return acc;
      }, {} as Record<string, Transaction[]>);

      // Convertir en tableau et trier par mois
      const sortedTransactions = Object.entries(groupedByMonth)
        .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
        .flatMap(([_, transactions]) => transactions);

      setPlannedTransactions(sortedTransactions);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les transactions planifiées");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlannedTransactions();
  }, []);

  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getCategory = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
  };

  const getTotalForMonth = (month: string) => {
    return plannedTransactions
      .filter(tx => tx.plannedMonth === month)
      .reduce((total, tx) => total + tx.amount, 0);
  };

  const convertToActualTransaction = async (transaction: Transaction) => {
    try {
      const raw = await AsyncStorage.getItem("transactions");
      let transactions: Transaction[] = raw ? JSON.parse(raw) : [];

      // Mettre à jour la transaction pour la rendre actuelle
      const updatedTransaction = {
        ...transaction,
        isPlanned: false,
        plannedMonth: undefined,
        date: new Date().toISOString()
      };

      transactions = transactions.map(tx =>
        tx.id === transaction.id ? updatedTransaction : tx
      );

      await AsyncStorage.setItem("transactions", JSON.stringify(transactions));
      await loadPlannedTransactions();

      Alert.alert("Succès", "Dépense convertie en transaction actuelle");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de convertir la transaction");
    }
  };

  const deletePlannedTransaction = async (transactionId: string) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment supprimer cette planification ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem("transactions");
              let transactions: Transaction[] = raw ? JSON.parse(raw) : [];

              transactions = transactions.filter(tx => tx.id !== transactionId);
              await AsyncStorage.setItem("transactions", JSON.stringify(transactions));
              await loadPlannedTransactions();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la transaction");
            }
          }
        }
      ]
    );
  };

  const getUniqueMonths = () => {
    const months = plannedTransactions.map(tx => tx.plannedMonth).filter(Boolean) as string[];
    return [...new Set(months)].sort();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Chargement..." />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text>Chargement des planifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Dépenses Planifiées" />
       {/* <Appbar.Action
          icon="plus"
          onPress={() => router.push("/add_planification")}
        />*/}
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        {plannedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-blank" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Aucune dépense planifiée</Text>
            <Text style={styles.emptyStateText}>
              Planifiez vos dépenses futures pour mieux gérer votre budget
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push("/add_planification")}
              style={styles.emptyStateButton}
            >
              Planifier une dépense
            </Button>
          </View>
        ) : (
          <View style={styles.content}>
            {getUniqueMonths().map(month => (
              <View key={month} style={styles.monthSection}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthTitle}>{getMonthName(month)}</Text>
                  <Text style={styles.monthTotal}>
                    Total: {getTotalForMonth(month).toLocaleString()} F CFA
                  </Text>
                </View>

                {plannedTransactions
                  .filter(tx => tx.plannedMonth === month)
                  .map(transaction => {
                    const category = getCategory(transaction.category);
                    return (
                      <Card key={transaction.id} style={styles.transactionCard}>
                        <Card.Content>
                          <View style={styles.transactionHeader}>
                            <View style={styles.transactionInfo}>
                              <Text style={styles.transactionTitle}>
                                {transaction.title}
                              </Text>
                              <Chip
                                mode="outlined"
                                style={[styles.categoryChip, { borderColor: category.color }]}
                                textStyle={{ color: category.color, fontSize: 12 }}
                              >
                                {category.name}
                              </Chip>
                            </View>
                            <Text style={styles.amount}>
                              -{transaction.amount.toLocaleString()} F CFA
                            </Text>
                          </View>

                          {transaction.description ? (
                            <Text style={styles.description}>
                              {transaction.description}
                            </Text>
                          ) : null}

                          <View style={styles.actions}>
                            <Button
                              mode="outlined"
                              compact
                              textColor="green"
                              onPress={() => convertToActualTransaction(transaction)}
                              style={styles.actionButton}
                            >
                              Marquer comme actuelle
                            </Button>
                            <Button
                              mode="text"
                              compact
                              textColor="#EF4444"
                              onPress={() => deletePlannedTransaction(transaction.id)}
                              style={styles.actionButton}
                            >
                              Supprimer
                            </Button>
                          </View>
                        </Card.Content>
                      </Card>
                    );
                  })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
            <FAB
              icon="plus"
              color="#fff"
              style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
              onPress={() => router.push("/add_planification")}
            />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    borderRadius: 8,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  monthTotal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  transactionCard: {
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionButton: {
    minWidth: 0,
  },
  fab: {
      position: "absolute",
      bottom: '5%',
      right: 24,
    },
});

export default PlannedTransactionsScreen;