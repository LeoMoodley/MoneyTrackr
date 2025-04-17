import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFinancialData } from '../utils/getFinancialData.ts';

interface Transaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface Budget {
  category: string;
  spent: number;
  limit: number;
}

interface Period {
  StartDate: string;
  EndDate: string;
  Income: number;
  Expenses: number;
  Transactions: Transaction[];
  Budgets: Budget[];
}

function History() {
  const navigate = useNavigate(); // Initialize useNavigate
  
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  const [periods, setPeriods] = useState<Period[]>([]);

  const [currentBudgetPage, setCurrentBudgetPage] = useState(1);

  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);

  const BUDGETS_PER_PAGE = 3;

  const TRANSACTIONS_PER_PAGE = 10;

  const getPaginatedBudgets = (budgets: Budget[]) => {
    const startIndex = (currentBudgetPage - 1) * BUDGETS_PER_PAGE;
    return budgets.slice(startIndex, startIndex + BUDGETS_PER_PAGE);
  };

  const getPaginatedTransactions = (transactions: Transaction[]) => {
    const startIndex = (currentTransactionPage - 1) * TRANSACTIONS_PER_PAGE;
    return transactions.slice(startIndex, startIndex + TRANSACTIONS_PER_PAGE);
  };

  useEffect(() => {
    getFinancialData()
      .then((data) => {
        let user_periods = data?.PreviousTransactions || [];
        user_periods = user_periods.map((period: Period) => {
          // Calculate Income and Expenses from the transactions
          const Income = period.Transactions
            .filter(transaction => transaction.type === 'income') // Filter income transactions
            .reduce((total, transaction) => total + transaction.amount, 0); // Sum the amounts
        
          const Expenses = period.Transactions
            .filter(transaction => transaction.type === 'expense') // Filter expense transactions
            .reduce((total, transaction) => total + transaction.amount, 0); // Sum the amounts
          
          let user_budgets = period?.Budgets || [];
          user_budgets = user_budgets.map((budget: Budget) => {
            // Filter transactions for this budget's category and type 'expense'
            const spentAmount = period.Transactions
              .filter((transaction) => transaction.category === budget.category && transaction.type === 'expense')
              .reduce((total, transaction) => total + transaction.amount, 0);
          
            // Return the updated budget with spent amount
            return {
              ...budget,
              spent: spentAmount !== undefined ? spentAmount : 0, // Default to 0 if no expenses found
            };
          });
        
          return {
            ...period,
            Income: Income !== undefined ? Income : 0, // Default to 0 if no income found
            Expenses: Expenses !== undefined ? Expenses : 0, // Default to 0 if no expense found
            Budgets: user_budgets !== undefined ? user_budgets : []
          };
        });

        // console.log(user_periods);
        setPeriods(user_periods);
      })
      .catch((error) => {
        console.log(error);
      })
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getTotalPages = (items: any[], itemsPerPage: number) => {
    return Math.ceil(items.length / itemsPerPage);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-600">History</h1>
        </div>
        
        <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>

        </div>

        <div className="space-y-4">
          {periods.slice().reverse().map((period, index) => (
            <div key={String(index)} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                onClick={() => setExpandedPeriod(expandedPeriod === String(index) ? null : String(index))}
              >
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {formatDate(period.StartDate)} - {formatDate(period.EndDate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {period.Transactions.length} Transactions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="font-medium">${period.Income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <ArrowDownRight className="h-4 w-4" />
                      <span className="font-medium">${period.Expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  {expandedPeriod === String(index) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedPeriod === String(index) && (
                <div className="border-t border-gray-200 px-6 py-4">
                  {/* Period Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Period Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span className="font-medium">{formatDate(period.StartDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Date:</span>
                          <span className="font-medium">{formatDate(period.EndDate)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Total Income:</span>
                          <span className="font-medium">${period.Income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Total Expenses:</span>
                          <span className="font-medium">${period.Expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Net Balance:</span>
                          <span className={period.Income - period.Expenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${(period.Income - period.Expenses).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Budgets</h3>
                        <span className="text-sm text-gray-500">
                          {((currentBudgetPage - 1) * BUDGETS_PER_PAGE) + 1}-{Math.min(currentBudgetPage * BUDGETS_PER_PAGE, period.Budgets.length)} of {period.Budgets.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {getPaginatedBudgets(period.Budgets).map((budget) => {
                          const percentage = (budget.spent / budget.limit) * 100;
                          return (
                            <div key={budget.category}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-600">{budget.category}</span>
                                <span className="text-sm text-gray-600">
                                  ${budget.spent.toLocaleString()} / ${budget.limit.toLocaleString()}
                                </span>
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
                      {getTotalPages(period.Budgets, BUDGETS_PER_PAGE) > 1 && (
                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            onClick={() => setCurrentBudgetPage(prev => Math.max(1, prev - 1))}
                            disabled={currentBudgetPage === 1}
                            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentBudgetPage(prev => Math.min(getTotalPages(period.Budgets, BUDGETS_PER_PAGE), prev + 1))}
                            disabled={currentBudgetPage === getTotalPages(period.Budgets, BUDGETS_PER_PAGE)}
                            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                   {/* Transactions */}
                   <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Transactions</h3>
                    <div className="space-y-3">
                      {getPaginatedTransactions(period.Transactions.slice().reverse()).map((transaction, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {transaction.type === 'income' ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{transaction.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">{/*formatDate(transaction.date)*/ transaction.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                   {/* Transactions Pagination */}
                   {getTotalPages(period.Transactions, TRANSACTIONS_PER_PAGE) > 1 && (
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Showing {((currentTransactionPage - 1) * TRANSACTIONS_PER_PAGE) + 1} to {Math.min(currentTransactionPage * TRANSACTIONS_PER_PAGE, period.Transactions.length)} of {period.Transactions.length} transactions
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentTransactionPage(prev => Math.max(1, prev - 1))}
                            disabled={currentTransactionPage === 1}
                            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentTransactionPage(prev => Math.min(getTotalPages(period.Transactions, TRANSACTIONS_PER_PAGE), prev + 1))}
                            disabled={currentTransactionPage === getTotalPages(period.Transactions, TRANSACTIONS_PER_PAGE)}
                            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default History;