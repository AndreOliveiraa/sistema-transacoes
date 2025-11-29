import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3001/transactions";

const initialState = {
  items: [],
  status: "idle",
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
};

// Thunks para chamadas assíncronas
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchAll",
  async (params = { page: 1, limit: 10 }, { getState }) => {
    const token = getState().auth.token;

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { page: params.page, limit: params.limit },
    };

    const response = await axios.get(API_URL, config);
    return response.data;
  }
);

export const createTransaction = createAsyncThunk(
  "transactions/create",
  async (transactionData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post(API_URL, transactionData, config);

      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Erro na transação");
    }
  }
);
const transactionsSlice = createSlice({
  name: "transactions",
  initialState: {
    items: [],
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.items = action.payload.transactions;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalItems = action.payload.totalItems;
        state.status = "succeeded";
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export default transactionsSlice.reducer;
