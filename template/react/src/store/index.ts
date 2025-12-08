import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer.ts'


export const store = configureStore({
  reducer: rootReducer,
})

export type RootState = ReturnType<typeof store.getState>

export type RootDispatch = typeof store.dispatch


// store.dispatch(decrement())
// store.dispatch(increment(100))
//
// console.log(store.getState())
