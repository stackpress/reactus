import './contact.css';
import Edit from '../components/Edit';

export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>Contact Us</title>
      <meta name="description" content="Reactus" />
      <link rel="icon" type="image/svg+xml" href="/react.svg" />
      <link rel="stylesheet" type="text/css" href="/global.css" />
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" type="text/css" href={href} />
      ))}
    </>
  )
}

export default function ContactPage() {
  return (
    <>
      <h1>Contact Us</h1>
      <div className="p-4">
        <Edit name="contact" />
      </div>
    </>
  )
}