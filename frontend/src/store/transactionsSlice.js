import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3001/transactions";

// Thunks para chamadas assíncronas
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchAll",
  async () => {
    const response = await axios.get(API_URL);
    return response.data;
  }
);

export const createTransaction = createAsyncThunk(
  "transactions/create",
  async (transactionData) => {
    const response = await axios.post(API_URL, transactionData);
    return response.data;
  }
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "succeeded";
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        // Adiciona a nova transação ao topo da lista
        state.items.unshift(action.payload);
      });
  },
});

export default transactionsSlice.reducer;
