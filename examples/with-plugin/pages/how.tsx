import './how.css';
import Edit from '../components/Edit';

export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>How It Works</title>
      <meta name="description" content="Reactus" />
      <link rel="icon" type="image/svg+xml" href="/react.svg" />
      <link rel="stylesheet" type="text/css" href="/global.css" />
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" type="text/css" href={href} />
      ))}
    </>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <h1>How It Works</h1>
      <div className="py-12">
        <Edit name="how" />
      </div>
    </>
  )
}