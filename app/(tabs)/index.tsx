import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Transaction {
  type: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const ExpenseDashboard = () => {
  const [currentMonth, setCurrentMonth] = useState('Septembre 2025');
  const [revenue, setRevenue] = useState(0.00);
  const [expenses, setExpenses] = useState(0.00);
  const [balance, setBalance] = useState(0.00);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Transaction[]>([]);

  // Fonction pour charger et calculer les données
  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem('transactions');
    //  console.log('Données chargées:', stored); // Debug
      
      if (stored) {
        const transactions: Transaction[] = JSON.parse(stored);
        
        // S'assurer que c'est un tableau
        const transactionsArray = Array.isArray(transactions) ? transactions : [transactions];
        
        // Filtrer les transactions du mois actuel
        const currentDate = new Date();
        const currentMonthTransactions = transactionsArray.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() === currentDate.getMonth() && 
                 transactionDate.getFullYear() === currentDate.getFullYear();
        });

        // Calculer les totaux
        const monthlyRevenue = currentMonthTransactions
          .filter(t => t.type === 'Revenu')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = currentMonthTransactions
          .filter(t => t.type === 'Dépense')
          .reduce((sum, t) => sum + t.amount, 0);

        setRevenue(monthlyRevenue);
        setExpenses(monthlyExpenses);
        setBalance(monthlyRevenue - monthlyExpenses);

        // Transactions récentes (5 plus récentes)
        const sortedTransactions = [...transactionsArray]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        setRecentTransactions(sortedTransactions);

        // Dépenses récentes (3 plus récentes)
        const recentExpensesList = transactionsArray
          .filter(t => t.type === 'Dépense')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
        
        setRecentExpenses(recentExpensesList);

        // Mettre à jour le mois actuel
        const monthNames = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        setCurrentMonth(`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`);
      } else {
        // Si pas de données, réinitialiser tout
        setRevenue(0);
        setExpenses(0);
        setBalance(0);
        setRecentTransactions([]);
        setRecentExpenses([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  // Charger au premier rendu
  useEffect(() => {
    loadTransactions();
  }, []);

  // Recharger quand l'écran est focus (avec useFocusEffect)
  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  const formatCurrency = (amount) => {
    return `${amount.toFixed(0)} F CFA`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Aujourd'hui";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Hier';
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'short' 
        });
      }
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Fonction pour obtenir l'icône de catégorie
  const getCategoryIcon = (category: string) => {
    const categoryIcons: { [key: string]: string } = {
      'salaire': 'work',
      'freelance': 'laptop',
      'investissement': 'trending-up',
      'cadeau': 'card-giftcard',
      'nourriture': 'restaurant',
      'transport': 'directions-car',
      'logement': 'home',
      'loisirs': 'sports-esports',
      'sante': 'local-hospital',
      'autre': 'receipt'
    };
    return categoryIcons[category] || 'receipt';
  };

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const isExpense = transaction.type === 'Dépense';
    const iconName = getCategoryIcon(transaction.category);

    return (
      <TouchableOpacity style={styles.transactionItem}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: isExpense ? '#FFEBEE' : '#E8F5E8' }
        ]}>
          <Icon 
            name={iconName} 
            size={20} 
            color={isExpense ? '#F44336' : '#4CAF50'} 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionCategory}>
            {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
          </Text>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={[
            styles.transactionAmount,
            { color: isExpense ? '#F44336' : '#4CAF50' }
          ]}>
            {isExpense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Bonjour ! 👋</Text>
          <Text style={styles.month}>{currentMonth}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cards Section */}
        <View style={styles.cardsContainer}>
          {/* Revenue Card */}
          <TouchableOpacity style={[styles.card, styles.revenueCard]}>
            <View style={styles.cardHeader}>
              <Icon name="trending-up" size={24} color="#ffffff" />
              <Text style={styles.cardTitle}>Revenus</Text>
            </View>
            <Text style={styles.cardAmount}>{formatCurrency(revenue)}</Text>
          </TouchableOpacity>

          {/* Expenses Card */}
          <TouchableOpacity style={[styles.card, styles.expenseCard]}>
            <View style={styles.cardHeader}>
              <Icon name="trending-down" size={24} color="#ffffff" />
              <Text style={styles.cardTitle}>Dépenses</Text>
            </View>
            <Text style={styles.cardAmount}>{formatCurrency(expenses)}</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <TouchableOpacity style={[styles.card, styles.balanceCard]}>
          <View style={styles.cardHeader}>
            <Icon name="account-balance-wallet" size={24} color="#ffffff" />
            <Text style={styles.cardTitle}>Solde</Text>
          </View>
          <Text style={styles.cardAmount}>{formatCurrency(balance)}</Text>
        </TouchableOpacity>

        {/* Dépenses Récentes */}
        {recentExpenses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dépenses récentes</Text>
            <View style={styles.transactionsList}>
              {recentExpenses.map((expense, index) => (
                <TransactionItem key={index} transaction={expense} />
              ))}
            </View>
          </View>
        )}

        {/* Transactions Récentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          
          {recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction, index) => (
                <TransactionItem key={index} transaction={transaction} />
              ))}
            </View>
          ) : (
            <View style={styles.noTransactionsContainer}>
              <Icon name="history" size={40} color="#BDBDBD" />
              <Text style={styles.noTransactionsTitle}>Aucune transaction</Text>
              <Text style={styles.noTransactionsSubtitle}>
                Commencez par ajouter vos revenus et dépenses
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
    {/*  <TouchableOpacity
        style={styles.fab} 
        onPress={() => router.push('/add_transaction')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={24} color="#ffffff" />
      </TouchableOpacity>*/}
    </SafeAreaView>
  );
};

// Les styles restent exactement les mêmes que dans le code précédent
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingVertical: 20,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerContent: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  month: {
    fontSize: 16,
    color: '#757575',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  revenueCard: {
    backgroundColor: '#4CAF50',
    flex: 0.48,
  },
  expenseCard: {
    backgroundColor: '#F44336',
    flex: 0.48,
  },
  balanceCard: {
    backgroundColor: '#2196F3',
    marginBottom: 30,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  cardAmount: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  transactionsList: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#757575',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#BDBDBD',
  },
  noTransactionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
  },
  noTransactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginTop: 12,
    marginBottom: 8,
  },
  noTransactionsSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: '15%',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  } 
});

export default ExpenseDashboard;