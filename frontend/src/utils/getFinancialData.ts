import axios from '../services/axios';

export function getFinancialData() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    console.error('Access token is missing');
    return Promise.reject('Access token is missing');
  }

  // Return the promise directly
  return axios.get('user/financial_data/')
    .then((response) => response.data.financial_data)
    .catch((error) => {
      console.error('Failed to fetch financial data', error);
      return Promise.reject('Failed to fetch financial data');
    });
}