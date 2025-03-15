import './home.css';
import { useState } from 'react';
import reactLogo from '../assets/react.svg';

export default function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="inline-block h-24 p-4" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="inline-block h-24 p-4" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Reactus</h1>
      <div className="p-4">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p className="py-4">
          Edit <code>src/home.tsx</code> and save to test HMR
        </p>
        <a href="/about">About Reactus</a>
      </div>
      <p className="text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}