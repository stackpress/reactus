import './home.css';
import Edit from '../components/Edit';

export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>Vite + React + Reactus</title>
      <meta name="description" content="Vite + React + Reactus" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <link rel="stylesheet" type="text/css" href="/index.css" />
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" type="text/css" href={href} />
      ))}
    </>
  )
}

export default function AboutPage() {
  return (
    <>
      <h1>About Reactus</h1>
      <div className="p-4">
        <Edit name="about" />
        <a href="/">Home Page</a>
      </div>
    </>
  )
}