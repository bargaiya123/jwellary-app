"use client"

import { useEffect, useState } from "react"
import { setupAllRealtimeSync, removeAllRealtimeSync } from "@/lib/realtime-sync"

export function useRealtimeData() {
  const [inventory, setInventory] = useState([])
  const [customers, setCustomers] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Setup real-time listeners for all collections
    setupAllRealtimeSync({
      onInventoryUpdate: (data) => {
        setInventory(data)
        setLoading(false)
      },
      onCustomersUpdate: (data) => {
        setCustomers(data)
        setLoading(false)
      },
      onSalesUpdate: (data) => {
        setSales(data)
        setLoading(false)
      },
    })

    // Cleanup listeners on unmount
    return () => {
      removeAllRealtimeSync()
    }
  }, [])

  return {
    inventory,
    customers,
    sales,
    loading,
  }
}
