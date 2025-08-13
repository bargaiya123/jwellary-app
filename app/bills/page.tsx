"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Download, Printer, Eye } from "lucide-react"
import { salesOperations } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { BillGenerator } from "@/components/bill-generator"

export default function BillsPage() {
  const [sales, setSales] = useState([])
  const [filteredSales, setFilteredSales] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState(null)
  const [showBillGenerator, setShowBillGenerator] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSales()
  }, [])

  useEffect(() => {
    const filtered = sales.filter(
      (sale) =>
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items?.some((item) => item.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredSales(filtered)
  }, [sales, searchTerm])

  const loadSales = async () => {
    try {
      setLoading(true)
      const salesData = await salesOperations.getAll()
      setSales(salesData)
    } catch (error) {
      console.error("Error loading sales:", error)
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBill = (sale) => {
    setSelectedSale(sale)
    setShowBillGenerator(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bills & Invoices</h1>
          <p className="text-muted-foreground">Generate and manage customer bills</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                sales.filter((sale) => {
                  const saleDate = new Date(sale.date)
                  const now = new Date()
                  return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Bill Value</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.length > 0
                ? formatCurrency(sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / sales.length)
                : "₹0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
          <CardDescription>Generate bills for completed sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, sale ID, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Sales List */}
          <div className="space-y-4">
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No sales found matching your search." : "No sales transactions found."}
              </div>
            ) : (
              filteredSales.map((sale) => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Sale #{sale.id.slice(-8)}</h3>
                          <Badge variant="outline">{formatDate(sale.date)}</Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>
                            <strong>Customer:</strong> {sale.customerName || "Walk-in Customer"}
                          </p>
                          <p>
                            <strong>Items:</strong> {sale.items?.length || 0} item(s)
                          </p>
                          <p>
                            <strong>Payment:</strong> {sale.paymentMethod || "Cash"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {sale.items?.slice(0, 3).map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item.name} (×{item.quantity})
                            </Badge>
                          ))}
                          {sale.items?.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{sale.items.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(sale.totalAmount || 0)}</div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleGenerateBill(sale)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            Generate Bill
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bill Generator Modal */}
      {showBillGenerator && selectedSale && (
        <BillGenerator
          sale={selectedSale}
          onClose={() => {
            setShowBillGenerator(false)
            setSelectedSale(null)
          }}
        />
      )}
    </div>
  )
}
