import viteLogo from '/vite.svg'
import './Demo.css'
import { configureStore } from '@reduxjs/toolkit'
import { type FC, useCallback } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { useActionData, useMatches } from 'react-router'
import reactLogo from '../../assets/react.svg'
import { type RootDispatch, type RootState } from '../../store'
import { decrement } from '../../store/features/counterSlice.ts'
import { counterReducer, increment } from '../../store/features/counterState.ts'


export const store = configureStore({
  reducer: counterReducer,
})

const Counter: FC = () => {
  const count = useSelector((state: any) => state.count)
  const dispatch = useDispatch()
  
  return (
    <div className="card">
      <h1>Count: { count }</h1>
      <button onClick={ () => dispatch(increment(8)) }>+</button>
    </div>
  )
}


function App() {
  const dispatch: RootDispatch = useDispatch()
  const count = useSelector((state: RootState) => state.counter.count)
  
  const handleClick = useCallback(() => {
    dispatch(decrement())
  }, [])
  
  
  const match = useMatches()
  console.log('match', match)
  
  let actionData = useActionData()
  console.log('actionData', actionData)
  
  return (
    <div>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={ viteLogo } className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={ reactLogo } className="logo react" alt="React logo" />
        </a>
      </div>
      
      <h1>Vite + React</h1>
      
      <div className="card">
        <h1>Count: { count }</h1>
        <button onClick={ handleClick }>-</button>
      </div>
      
      <Provider store={ store }>
        <Counter />
      </Provider>
    </div>
  )
}

export default App
