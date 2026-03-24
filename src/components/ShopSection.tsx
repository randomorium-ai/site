'use client'
import { useEffect } from 'react'

export default function ShopSection() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src =
      'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js'
    script.async = true
    document.body.appendChild(script)
    script.onload = () => {
      // Paste your Shopify Buy Button init block here.
      // Get it from: Shopify > Sales channels > Buy Button > Create a Buy Button
      // Then replace the collection-component ID below.
    }
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div id="collection-component-YOUR-SHOPIFY-COLLECTION-ID" />
  )
}
