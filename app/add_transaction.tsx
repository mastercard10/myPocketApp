import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

type TxType = "Revenu" | "Dépense";
interface Transaction {
  id: string;
  type: TxType;
  title: string;
  amount: number; // stocké en positif
  category: string; // id de catégorie (lowercase)
  description: string;
  date: string; // ISO string
}

const createId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const AddTransactionScreen = () => {
  const params = useLocalSearchParams();
  const editMode = params.editMode === "true";

  const existingTransaction = useMemo(() => {
    try {
      return params.transaction
        ? (JSON.parse(params.transaction as string) as Partial<Transaction>)
        : null;
    } catch {
      return null;
    }
  }, [params.transaction]);

  const [transactionType, setTransactionType] = useState<TxType>("Dépense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");

  // Pré-remplissage complet en mode édition
  useEffect(() => {
    if (editMode && existingTransaction) {
      setTransactionType((existingTransaction.type as TxType) || "Dépense");
      setTitle(existingTransaction.title || "");
      setAmount(
        existingTransaction.amount != null
          ? String(existingTransaction.amount)
          : ""
      );
      setSelectedCategory((existingTransaction.category || "").toLowerCase());
      setDescription(existingTransaction.description || "");
    }
  }, [editMode, existingTransaction]);

  const categories = [
    { id: "salaire", name: "Salaire", icon: "work", color: "#4CAF50" },
    { id: "freelance", name: "Freelance", icon: "laptop", color: "#2196F3" },
    {
      id: "investissement",
      name: "Investissement",
      icon: "trending-up",
      color: "#9C27B0",
    },
    { id: "cadeau", name: "Cadeau", icon: "card-giftcard", color: "#FF9800" },
    {
      id: "nourriture",
      name: "Nourriture",
      icon: "restaurant",
      color: "#FF5722",
    },
    {
      id: "transport",
      name: "Transport",
      icon: "directions-car",
      color: "#607D8B",
    },
    { id: "logement", name: "Logement", icon: "home", color: "#795548" },
    {
      id: "loisirs",
      name: "Loisirs",
      icon: "sports-esports",
      color: "#E91E63",
    },
    { id: "sante", name: "Santé", icon: "local-hospital", color: "#00BCD4" },
    {
      id: "autre",
      name: "Autre",
      icon: "add-circle-outline",
      color: "#9E9E9E",
    },
  ];

  const handleSave = async () => {
    if (!title.trim() || !amount.trim() || !selectedCategory) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    const parsedAmount = Number(String(amount).replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Erreur", "Montant invalide");
      return;
    }
    if (transactionType !== "Revenu" && transactionType !== "Dépense") {
      Alert.alert("Erreur", "Le type doit être 'Revenu' ou 'Dépense'");
      return;
    }

    // Conserve la date d’origine en édition, sinon maintenant
    const preservedDate = existingTransaction?.date
      ? new Date(existingTransaction.date)
      : new Date();
    const dateISO = isNaN(preservedDate.getTime())
      ? new Date().toISOString()
      : preservedDate.toISOString();

    const tx: Transaction = {
      id:
        editMode && existingTransaction?.id
          ? String(existingTransaction.id)
          : createId(),
      type: transactionType,
      title: title.trim(),
      amount: Math.abs(parsedAmount),
      category: selectedCategory.toLowerCase(),
      description: (description || "").trim(),
      date: dateISO,
    };

    try {
      const raw = await AsyncStorage.getItem("transactions");
      let arr: any[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [arr];

      if (editMode && existingTransaction?.id) {
        let replaced = false;
        arr = arr.map((t) => {
          if (String(t.id) === String(existingTransaction.id)) {
            replaced = true;
            return tx;
          }
          return t;
        });
        if (!replaced) {
          // Cas rare: si l’élément n’existe plus, on ajoute quand même
          arr.unshift(tx);
        }
      } else {
        arr.unshift(tx);
      }

      // Tri (optionnel): du plus récent au plus ancien
      arr.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      await AsyncStorage.setItem("transactions", JSON.stringify(arr));

      // Retour fiable (même si Alert ne s’affiche pas)
      router.back();
    } catch (e) {
      console.error("Erreur lors de la sauvegarde:", e);
      Alert.alert("Erreur", "Impossible de sauvegarder la transaction");
    }
  };

  const CategoryButton = ({
    category,
  }: {
    category: (typeof categories)[number];
  }) => {
    const isSelected = selectedCategory === category.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          isSelected && {
            ...styles.categoryButtonSelected,
            borderColor: category.color,
          },
        ]}
        onPress={() => setSelectedCategory(category.id)}
      >
        <Icon
          name={category.icon}
          size={20}
          color={isSelected ? category.color : "#757575"}
        />
        <Text
          style={[
            styles.categoryButtonText,
            isSelected && { color: category.color },
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Toggle */}
        <View style={styles.typeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              styles.typeButtonLeft,
              transactionType === "Dépense" && styles.typeButtonActive,
            ]}
            onPress={() => setTransactionType("Dépense")}
          >
            <Text
              style={[
                styles.typeButtonText,
                transactionType === "Dépense" && styles.typeButtonTextActive,
              ]}
            >
              Dépense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              styles.typeButtonRight,
              transactionType === "Revenu" && styles.typeButtonActive,
            ]}
            onPress={() => setTransactionType("Revenu")}
          >
            <Text
              style={[
                styles.typeButtonText,
                transactionType === "Revenu" && styles.typeButtonTextActive,
              ]}
            >
              Revenu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Titre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Courses, Salaire..."
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#BDBDBD"
          />
        </View>

        {/* Amount */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Montant <Text style={styles.required}>*</Text> (F CFA)
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor="#BDBDBD"
          />
        </View>

        {/* Category */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Catégorie <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <CategoryButton key={category.id} category={category} />
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.textInput, styles.descriptionInput]}
            placeholder="Ajouter une note..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#BDBDBD"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              backgroundColor: "#ffffff",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#E0E0E0",
              marginBottom: 24,
            },
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Icon name="check-circle-outline" size={20} color="#0ae41c" />
          <Text style={[styles.categoryButtonText, { marginLeft: 8 }]}>
            {editMode ? "Mettre à jour" : "Valider"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 20 },
  typeToggleContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  typeButtonLeft: { marginRight: 2 },
  typeButtonRight: { marginLeft: 2 },
  typeButtonActive: {
    backgroundColor: "#ffffff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeButtonText: { fontSize: 16, color: "#757575", fontWeight: "500" },
  typeButtonTextActive: { color: "#333333", fontWeight: "600" },
  inputSection: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", color: "#333333", marginBottom: 8 },
  required: { color: "#F44336" },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#333333",
  },
  descriptionInput: { height: 80, paddingTop: 14 },
  categoriesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    marginBottom: 8,
  },
  categoryButtonSelected: { backgroundColor: "#F8F9FA", borderWidth: 2 },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#757575",
  },
  saveButton: { padding: 8 },
});

export default AddTransactionScreen;
