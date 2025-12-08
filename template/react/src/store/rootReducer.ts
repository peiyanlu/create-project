import { combineReducers } from '@reduxjs/toolkit'
import { counterReducer } from './features/counterSlice.ts'


export default combineReducers({
  counter: counterReducer,
})
