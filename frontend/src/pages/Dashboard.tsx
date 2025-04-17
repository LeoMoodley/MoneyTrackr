import React, { useState, useEffect, useMemo } from 'react';
import axios from '../services/axios.ts';
import { useNavigate } from 'react-router-dom';
import { getFinancialData } from '../utils/getFinancialData.ts';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  Filter,
  Settings,
  LogOut,
  User,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  RefreshCw,
  HistoryIcon,
} from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

interface Transaction {
  description: string;
  amount: number;
  // type: 'income' | 'expense';
  type: string,
  category: string;
  date: string;
}

interface Budget {
  category: string;
  spent: number;
  limit: number;
}

interface GetBudget {
  [category: string]: number;
}

interface FinancialData {
  Balance: number;
  Income: number;
  Budget: GetBudget;
  // Budget: Record<string, number>;  // Budget is a dictionary with string keys and number values
  Expenses: Transaction[];
  Transactions: Transaction[];
}

type FilterType = 'all' | 'income' | 'expense';

const defaultFinancialData: FinancialData = {
  Balance: 0,
  Income: 0,
  Budget: {},
  Expenses: [],
  Transactions: [{ description: 'Salary', amount: 5000, type: 'income', category: 'Work', date: '2024-03-15' }]
}

// async function getFinancialData() {
//   try {
//     const accessToken = localStorage.getItem('access_token');
//     if (!accessToken) {
//       console.error('Access token is missing');
//       return;
//     }

//     // Make an authenticated request to fetch the financial data
//     const response = await axios.get('user/financial_data/');

//     // Handle the response containing the financial data
//     console.log('Financial Data:', response.data);

//     return response.data.financial_data
//   } catch (error) {
//     console.error('Failed to fetch financial data', error);
//   }
// }

async function addTransaction(transaction: Transaction) {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error('Access token is missing');
      return;
    }

    // Make an authenticated request to fetch the financial data
    await axios.post('create_transaction/', transaction);
  } catch (error) {
    console.error('Failed to add transaction', error);
  }
}

function Dashboard() {
  const navigate = useNavigate(); // Initialize useNavigate

  const [email, setEmail] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData>(defaultFinancialData);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    description: '',
    amount: 0,
    category: '',
    date: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({
    start: '',
    end: '',
  });

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: 0,
  });

  const getChartData = (_budgets: Budget[]) => {
    const colors = [
      '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea',
      '#0891b2', '#be123c', '#15803d', '#854d0e', '#6b21a8',
      '#155e75', '#9f1239'
    ];

    return {
      spent: {
        labels: _budgets.map(b => b.category),
        datasets: [{
          data: _budgets.map(b => b.spent),
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.8', '1')),
          borderWidth: 1,
        }]
      },
      limit: {
        labels: _budgets.map(b => b.category),
        datasets: [{
          data: _budgets.map(b => b.limit),
          backgroundColor: colors.map(c => c + '80'), // Add transparency
          borderColor: colors,
          borderWidth: 1,
        }]
      }
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: $${context.raw.toLocaleString()}`;
          }
        }
      }
    }
  };

  const [balance, setBalance] = useState<number>(0);

  const TodayDate = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // Extracts YYYY-MM-DD
  
    return formattedDate;
  };

  // Filter and paginate transactions
  const filteredTransactions = useMemo(() => {
    return transactions.slice().reverse().filter(transaction => {
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = !filterCategory || transaction.category === filterCategory;
      const matchesDate = (!filterDateRange.start || transaction.date >= filterDateRange.start) &&
                         (!filterDateRange.end || transaction.date <= filterDateRange.end);
      
      return matchesType && matchesCategory && matchesDate;
    });
  }, [transactions, filterType, filterCategory, filterDateRange]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);
  

  const [budgets, setBudgets] = useState<Budget[]>([
    { category: 'Work', spent: 0, limit: 1000 },
    { category: 'Housing', spent: 0, limit: 100 },
    { category: 'Food', spent: 0, limit: 200 },
  ]);

  const insertTransaction = (transaction: Transaction) => {
    setBudgets((prevBudgets) =>
      prevBudgets.map((budget) =>
        (budget.category === transaction.category && transaction.type === 'expense')
          ? { ...budget, spent: (budget.spent ?? 0) + transaction.amount}
          : budget
      )
    );

    setTransactions(prevTransactions => [...prevTransactions, transaction]);
    setCurrentTransactions(prevTransactions => [...prevTransactions, transaction]);

    if(transaction.type === 'expense') {
      setBalance(balance - transaction.amount)
    } else {
      setBalance(balance + transaction.amount)
    }
  };

  // Function to handle the creation of a transaction
  const createTransaction = async (transaction: Transaction) => {
    try {
      // Add transaction through API call
      transaction['date'] = TodayDate();

      if(transaction['category'].length == 0) {
        transaction['category'] = "None"
      }

      await addTransaction(transaction);

      // Insert transaction into local state
      insertTransaction(transaction);
    } catch (err) {
      console.error('Error creating transaction:', err);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    createTransaction(newTransaction);
  };

  const totalIncome = currentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Function to calculate the total spent by category
  function calculateSpentByCategory() {
    const spentByCategory: { [key: string]: number } = {};

    currentTransactions.forEach((transaction) => {
      if (transaction.type === 'expense') {
        if (!spentByCategory[transaction.category]) {
          spentByCategory[transaction.category] = 0;
        }
        spentByCategory[transaction.category] += transaction.amount;
      }
    });

    return spentByCategory;
  }

  // useEffect to update budgets whenever transactions change
  useEffect(() => {
    const spentByCategory = calculateSpentByCategory();

    setBudgets((prevBudgets) =>
      prevBudgets.map((budget) => ({
        ...budget,
        spent: spentByCategory[budget.category] ?? 0,
      }))
    );
  }, [transactions]); // Dependency on transactions

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send this to your backend
    const newBudgetItem: Budget = {
      category: newBudget.category,
      limit: Number(newBudget.limit),
      spent: 0,
    };

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error('Access token is missing');
        return;
      }
  
      axios.post('change_budget/', {budget: { category: newBudget.category, limit: Number(newBudget.limit) }})
        .then(response => {
          console.log('Response:', response.data)
        })
        .catch(error => {
          console.log('Error:', error)
        });
    } catch (error) {
      console.error('Failed to edit budget', error);
    }

    setBudgets([...budgets, newBudgetItem]);
    setNewBudget({ category: '', limit: 0 });
    setShowBudgetForm(false);
  };

  const handleEditBudget = (category: string, newLimit: number) => {
    setBudgets(budgets.map(budget => 
      budget.category === category ? { ...budget, limit: newLimit } : budget
    ));

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error('Access token is missing');
        return;
      }
  
      axios.post('change_budget/', {budget: { category: category, limit: newLimit }})
        .then(response => {
          console.log('Response:', response.data)
        })
        .catch(error => {
          console.log('Error:', error)
        });
    } catch (error) {
      console.error('Failed to edit budget', error);
    }

    setEditingBudget(null);
  };

  const handleRemoveBudget = (category: string) => {
    setBudgetToDelete(category);
  };

  const confirmRemoveBudget = () => {
    if (budgetToDelete) {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          console.error('Access token is missing');
          return;
        }
    
        axios.post('remove_budget/', {budget_name: budgetToDelete})
          .then(response => {
            console.log('Response:', response.data)
            setBudgets(budgets.filter(budget => budget.category !== budgetToDelete));
            setBudgetToDelete(null);
          })
          .catch(error => {
            console.log('Error:', error)
          });
      } catch (error) {
        console.error('Failed to remove budget', error);
      }
    }
  };

  const handleResetAll = () => {
    setShowResetConfirmation(true);
  };

  const confirmResetAll = () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error('Access token is missing');
        return;
      }
  
      axios.post('reset_month/')
        .then(response => {
          console.log('Response:', response.data)
          setCurrentTransactions([]);
          setBudgets(budgets.map(budget => ({ ...budget, spent: 0 })));
          setShowResetConfirmation(false);
        })
        .catch(error => {
          console.log('Error:', error)
        });
    } catch (error) {
      console.error('Failed to reset data', error);
    }
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterCategory('');
    setFilterDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };
  
  // Fetch financial data when the component mounts
  useEffect(() => {
    // const fetchData = async () => {
    //   try {
    //     const data = await getFinancialData(); // Call your function
    //     setFinancialData(data || defaultFinancialData); // Set the data in state
    //     setTransactions(data?.Transactions || []);
    //     setCurrentTransactions(data?.CurrentTransactions || []);
    //     let user_budgets = data?.Budgets || []
    //     user_budgets = user_budgets.map((budget: Budget) => {
    //       // Check if 'spent' key exists, if not, set it to 0
    //       return {
    //         ...budget,
    //         spent: budget.spent !== undefined ? budget.spent : 0,
    //       };
    //     });
    //     setBudgets(user_budgets);
    //     setBalance(data?.Balance || 0);
    //     setEmail(data?._id || '');
    //   } catch (err) {
    //     // idk
    //   }
    // };

    const fetchData = () => {
      getFinancialData()
        .then((data) => {
          // console.log(data);
          setFinancialData(data || defaultFinancialData); // Set the data in state
          setTransactions(data?.Transactions || []);
          setCurrentTransactions(data?.CurrentTransactions || []);
          let user_budgets = data?.Budgets || [];
          user_budgets = user_budgets.map((budget: Budget) => {
            // Check if 'spent' key exists, if not, set it to 0
            return {
              ...budget,
              spent: budget.spent !== undefined ? budget.spent : 0,
            };
          });
          setBudgets(user_budgets);
          setBalance(data?.Balance || 0);
          setEmail(data?._id || '');
        })
        .catch((error) => {
          console.log(error);
        })
    }

    fetchData(); // Trigger the fetch function
  }, []); // Empty dependency array means it runs once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Reset</h3>
            <p className="text-gray-600 mb-6">
              This will reset all your transactions and budget spending to zero. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Budget Confirmation Modal */}
      {budgetToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Budget Category</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the "{budgetToDelete}" budget category? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBudgetToDelete(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveBudget}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600">MoneyTrackr</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              title="Reset all data"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <div className="relative">
              <button 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="text-sm font-medium text-gray-700 hidden sm:block"></span>
                <img
                  className="h-8 w-8 rounded-full ring-2 ring-white"
                  // src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  src="https://media.discordapp.net/attachments/909605712311758919/1355002685698343053/34AD2.png?ex=67e75817&is=67e60697&hm=7502a50f6ec52fe6abf225442f2e4b25c2bed5b5bc31b7cee99e1c7922a8ea30&=&format=webp&quality=lossless"
                  alt="User avatar"
                />
              </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{email}</p>
                  <p className="text-sm text-gray-500">{/* email here */}</p>
                </div>
                
                {/* <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4" />
                  Profile
                </a> */}
                <button
                    onClick={() => navigate("/history")}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                  >
                    <HistoryIcon className="h-4 w-4" />
                    History
                  </button>
                {/* <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Bell className="h-4 w-4" />
                  Notifications
                </a>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4" />
                  Settings
                </button> */}
                
                <div className="border-t border-gray-100">
                  <button 
                    onClick={() => {
                      // Add logout logic here
                      localStorage.removeItem('access_token');
                      localStorage.removeItem('refresh_token');
                      window.location.reload();
                      // handleLogout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Balance</h2>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{balance < 0 ? '-' : ''}${Math.abs(balance).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Current Balance</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Income</h2>
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalIncome.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Total Income</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Expenses</h2>
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalExpenses.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Total Expenses</p>
          </div>
        </div>
            
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
                <div className="flex gap-2">
                  <button 
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                    <Filter className="h-5 w-5 text-gray-600" />
                  </button>
                  <button 
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
                    onClick={() => setShowTransactionForm(!showTransactionForm)}
                  >
                    {showTransactionForm ? (
                      <>
                        <X className="h-4 w-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add Transaction
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              {showFilters && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as FilterType)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All</option>
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Categories</option>
                          {budgets.map(budget => (
                            <option key={budget.category} value={budget.category}>
                              {budget.category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">From</label>
                          <input
                            type="date"
                            value={filterDateRange.start}
                            onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">To</label>
                          <input
                            type="date"
                            value={filterDateRange.end}
                            onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={resetFilters}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Add Transaction Form */}
              {showTransactionForm && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={newTransaction.type}
                          onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as 'income' | 'expense'})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={newTransaction.category}
                          onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">None</option>
                          {budgets.map(budget => (
                            <option key={budget.category} value={budget.category}>
                              {budget.category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter transaction description"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={newTransaction.amount == 0 ? '' : newTransaction.amount}
                          onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTransactionForm(false)}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Add Transaction
                      </button>
                    </div>
                  </form>
                </div>
              )}

            
              {/* Display Transactions */}
              <div className="space-y-4">
                {paginatedTransactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className={`h-5 w-5 ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.category === "None" ? '' : transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budget Overview */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Budget Overview</h2>
                <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => setShowBudgetForm(!showBudgetForm)}>
                  <Plus className="h-5 w-5 text-gray-600" />
                </button>
              </div>

                {/* Add/Edit Budget Form */}
                {showBudgetForm && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <form onSubmit={handleAddBudget} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={newBudget.category}
                        onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter category name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Limit
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={newBudget.limit == 0 ? '' : newBudget.limit} 
                          onChange={(e) => setNewBudget({...newBudget, limit: Number(e.target.value)})}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBudgetForm(false)}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100  rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Add Budget
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-6">
                {budgets.map(budget => {
                  const percentage = (budget.spent / budget.limit) * 100;
                  const isEditing = editingBudget === budget.category;

                  return (
                    <div key={budget.category} className="relative">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{budget.category}</span>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                <input
                                  type="number"
                                  defaultValue={budget.limit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditBudget(budget.category, parseFloat((e.target as HTMLInputElement).value));
                                    }
                                  }}
                                  onBlur={(e) => handleEditBudget(budget.category, parseFloat(e.target.value))}
                                  className="w-24 pl-6 pr-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <button
                                onClick={() => setEditingBudget(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm text-gray-500">
                                ${budget.spent.toLocaleString()} / ${budget.limit.toLocaleString()}
                              </span>
                              <button
                                onClick={() => setEditingBudget(budget.category)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveBudget(budget.category)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage > 90 ? 'bg-red-600' :
                            percentage > 75 ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              
            </div>
          {/* Budget Charts */}
          <div className="mt-8 space-y-6">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Spent Distribution</h3>
                  <div className="h-64">
                    <Pie data={getChartData(budgets).spent} options={chartOptions} />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Budget Allocation</h3>
                  <div className="h-64">
                    <Pie data={getChartData(budgets).limit} options={chartOptions} />
                  </div>
                </div>
                </div>
          </div>


        </div>
      </main>
    </div>
  );
}

export default Dashboard;