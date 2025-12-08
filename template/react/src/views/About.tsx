import { useContext, useEffect, useRef } from 'react'
import { TestContext } from '../context/testContext.ts'


export default function About() {
  const test = useContext(TestContext)
  
  const divRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    divRef.current?.setAttribute('style', 'color: red')
  })
  
  return <div ref={ divRef }>About { test }</div>
}
