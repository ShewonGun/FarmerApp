import axios from "axios";

export const getExchangeRate = async () => {
  const response = await axios.get(
    "https://api.exchangerate-api.com/v4/latest/LKR"
  );
  return response.data.rates.USD;
};
