'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface ProductContextType {
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  getProduct: (id: string) => Product | undefined
  loading: boolean
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load products from localStorage
    const savedProducts = localStorage.getItem('admin_products')
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }))
        setProducts(parsedProducts)
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    setLoading(false)
  }, [])

  const saveToStorage = (newProducts: Product[]) => {
    localStorage.setItem('admin_products', JSON.stringify(newProducts))
  }

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const newProducts = [...products, newProduct]
    setProducts(newProducts)
    saveToStorage(newProducts)
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const newProducts = products.map(product => 
      product.id === id 
        ? { ...product, ...updates, updatedAt: new Date() }
        : product
    )
    setProducts(newProducts)
    saveToStorage(newProducts)
  }

  const deleteProduct = (id: string) => {
    const newProducts = products.filter(product => product.id !== id)
    setProducts(newProducts)
    saveToStorage(newProducts)
  }

  const getProduct = (id: string) => {
    return products.find(product => product.id === id)
  }

  const value = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    loading
  }

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}