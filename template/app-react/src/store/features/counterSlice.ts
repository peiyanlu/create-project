import { createSlice, type PayloadAction } from '@reduxjs/toolkit'


interface CounterType {
  count: number
}

const initialState: CounterType = {
  count: 100,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState: initialState,
  reducers: {
    increment: (state, action: PayloadAction<number>) => {
      state.count += action.payload
    },
    decrement: (state) => {
      state.count -= 1
    },
  },
})

export const { increment, decrement } = counterSlice.actions

export const counterReducer = counterSlice.reducer
