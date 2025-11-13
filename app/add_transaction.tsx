import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  StatusBar,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import {
  Appbar,
  Button,
  Chip,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type TxType = "Revenu" | "Dépense";
interface Transaction {
  id: string;
  type: TxType;
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const createId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const AddTransactionScreen = () => {
  const GREEN = "#10B981";
  const RED = "#EF4444";
  const BLUE = "#3B82F6";

  const theme = useTheme();
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
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editMode && existingTransaction) {
      setTransactionType((existingTransaction.type as TxType) || "Dépense");
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
    { id: "salaire", name: "Salaire", icon: "briefcase", color: "#10B981" },
    { id: "cadeau", name: "Cadeau", icon: "gift", color: "#F59E0B" },
    {
      id: "nourriture",
      name: "Nourriture",
      icon: "food",
      color: "#EF4444",
    },
    {
      id: "transport",
      name: "Transport",
      icon: "car",
      color: "#6366F1",
    },
    { id: "logement", name: "Logement", icon: "home", color: "#8B5CF6" },
    {
      id: "loisirs",
      name: "Loisirs",
      icon: "gamepad-variant",
      color: "#EC4899",
    },
    { id: "sante", name: "Santé", icon: "hospital", color: "#06B6D4" },
    {
      id: "autre",
      name: "Autre",
      icon: "dots-horizontal-circle",
      color: "#6B7280",
    },
  ];

  const handleSave = async () => {
    if (!amount.trim() || !selectedCategory) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    const parsedAmount = Number(String(amount).replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Erreur", "Montant invalide");
      return;
    }

    // Générer un titre automatique basé sur la catégorie
    const categoryName = categories.find(cat => cat.id === selectedCategory)?.name || "Transaction";
    const autoTitle = `${categoryName}`;

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
      title: autoTitle,
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
          arr.unshift(tx);
        }
      } else {
        arr.unshift(tx);
      }

      arr.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      await AsyncStorage.setItem("transactions", JSON.stringify(arr));
      router.back();
    } catch (e) {
      console.error("Erreur lors de la sauvegarde:", e);
      Alert.alert("Erreur", "Impossible de sauvegarder la transaction");
    }
  };

const getButtonStyle = (type: TxType) => {
  const isActive = transactionType === type;
  const backgroundColor = isActive
    ? (type === "Dépense" ? RED : GREEN)
    : '#fff';
  const textColor = isActive ? '#fff' : '#000';

  return { backgroundColor, textColor };
};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header
        mode="center-aligned"
        style={{
          backgroundColor: "#fff",
          elevation: 0,
          shadowOpacity: 0,
        }}
      >
        <Appbar.Action
          icon="arrow-left"
          onPress={() => router.back()}
        />
        <Appbar.Content
          title="Nouvelle transaction"
          titleStyle={{
            fontSize: 18,
            fontWeight: "600",
          }}
        />
      </Appbar.Header>

      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type de transaction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de transaction</Text>
          {/*  <SegmentedButtons
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as TxType)}
              buttons={[
                {
                  value: "Dépense",
                  label: "Dépense",
                  style: transactionType === "Dépense" ?
                    {
                      backgroundColor: RED,
                    } : {},
                  labelStyle: transactionType === "Dépense" ?
                    { color: "#fff" } :
                    { color: "#000" },
                },
                {
                  value: "Revenu",
                  label: "Revenu",
                  style: transactionType === "Revenu" ?
                    {
                      backgroundColor: GREEN,
                    } : {},
                  labelStyle: transactionType === "Revenu" ?
                    { color: "#fff" } :
                    { color: "#000" },
                },
              ]}
              style={styles.segmentedButtons}
            />*/}
            <View style={styles.buttonContainer}>
                          {["Dépense", "Revenu"].map((type) => {
                            const { backgroundColor, textColor } = getButtonStyle(type as TxType);

                            return (
                              <Pressable
                                key={type}
                                style={[styles.button, { backgroundColor }]}
                                onPress={() => setTransactionType(type as TxType)}
                              >
                                <Text style={[styles.buttonText, { color: textColor }]}>
                                  {type}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
          </View>

          {/* Montant */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Montant *</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              mode="flat"
              keyboardType="decimal-pad"
              placeholder="0"
              style={styles.amountInput}
              contentStyle={styles.amountInputContent}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textColor="#000"
              placeholderTextColor="#666"
              autoFocus={!editMode}
            />
            <View style={styles.divider} />
          </View>

            {/* Description */}
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description (optionnel)</Text>
                        <TextInput
                          value={description}
                          onChangeText={setDescription}
                          mode="flat"
                          multiline
                          placeholder="Ajouter une note..."
                          style={styles.descriptionInput}
                          contentStyle={styles.descriptionInputContent}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          placeholderTextColor="#666"
                        />
                        <View style={styles.divider} />
                      </View>


          {/* Catégories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégorie</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <View key={category.id} style={styles.categoryItem}>
                  <Chip
                    selected={selectedCategory === category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && {
                        backgroundColor: category.color,
                      }
                    ]}
                    textStyle={[
                      styles.categoryChipText,
                      selectedCategory === category.id ?
                        { color: "#fff" } :
                        { color: "#000" }
                    ]}
                    showSelectedOverlay={false}
                  >
                    {category.name}
                  </Chip>
                </View>
              ))}
            </View>
            <View style={styles.divider} />
          </View>

          {/* Espace pour le bouton */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* Bouton fixe en bas */}
        <View style={styles.buttonCont}>
          <Button
            mode="contained"
            onPress={handleSave}
            contentStyle={styles.saveButtonContent}
            style={styles.saveButton}
            buttonColor={BLUE}
            labelStyle={styles.saveButtonLabel}
            disabled={!amount || !selectedCategory}
          >
            Ajouter la transaction
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    bottom:50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  segmentedButtons: {
    borderRadius: 8,
  },
  amountInput: {
    backgroundColor: 'transparent',
    fontSize: 24,
    fontWeight: '600',
    paddingHorizontal: 0,
    height: 50,
  },
  amountInputContent: {
    paddingHorizontal: 0,
  },
  descriptionInput: {
    backgroundColor: 'transparent',
    minHeight: 60,
    paddingHorizontal: 0,
  },
  descriptionInputContent: {
    paddingHorizontal: 0,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  categoryItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  categoryChip: {
    width: '100%',
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginTop: 16,
  },
  spacer: {
    height: 100, // Espace pour le bouton fixe
  },
  buttonCont: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  saveButton: {
    borderRadius: 12,
    height: 50,
  },
  saveButtonContent: {
    height: 50,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
      },
      button: {
        flex: 1,
        padding: 15,
        marginHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
      },
   expenseButton: {
      backgroundColor: '#fff',
    },
    incomeButton: {
      backgroundColor: '#fff',
    },
    activeButton: {
      borderWidth: 0,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    activeButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
});

export default AddTransactionScreen;