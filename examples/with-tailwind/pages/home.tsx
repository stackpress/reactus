import './page.css';
import { useState } from 'react';
import Edit from '../components/Edit';

export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>Reactus</title>
      <meta name="description" content="Reactus" />
      <link rel="icon" type="image/svg+xml" href="/react.svg" />
      <link rel="stylesheet" type="text/css" href="/global.css" />
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" type="text/css" href={href} />
      ))}
    </>
  )
}

export default function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>React + Reactus</h1>
      <div className="p-4">
        <button className="text-reactus" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <Edit name="about" />
        <a href="/about">About Reactus</a>
      </div>
    </>
  )
}