import './page.css';
import React from 'react';
import Edit from '../components/Edit.js';

export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>About Reactus</title>
      <meta name="description" content="About Reactus" />
      <link rel="icon" type="image/svg+xml" href="/react.svg" />
      <link rel="stylesheet" type="text/css" href="/global.css" />
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" type="text/css" href={href} />
      ))}
    </>
  )
}

export default function AboutPage() {
  return (
    <>
      <h1 className="uppercase">About Reactus</h1>
      <div className="p-4">
        <Edit name="about" />
        <a href="/">Home Page</a>
      </div>
    </>
  )
}