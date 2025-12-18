// src/store/actions.ts
export const INCREMENT = 'INCREMENT'
export const DECREMENT = 'DECREMENT'

export const increment = <T>(payload: T) => ({ type: INCREMENT, payload })

export const decrement = <T>(payload: T) => ({ type: DECREMENT, payload })


// src/store/reducer.ts
export interface CounterState {
  count: number
}

const initialState: CounterState = { count: 100 }

export const counterReducer = (state = initialState, action: { type: string, payload: number }) => {
  switch (action.type) {
    case INCREMENT:
      return { count: state.count + action.payload }
    case DECREMENT:
      return { count: state.count - action.payload }
    default:
      return state
  }
}
