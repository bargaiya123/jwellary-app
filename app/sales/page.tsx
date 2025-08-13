"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, DollarSign, TrendingUp, Calendar, Download } from "lucide-react"
import { salesOperations, customerOperations, exportOperations } from "@/lib/database"
import { SalesForm } from "@/components/sales-form"
import toast from "react-hot-toast"

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [filteredSales, setFilteredSales] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [salesData, customersData] = await Promise.all([salesOperations.getAll(), customerOperations.getAll()])
        setSales(salesData)
        setFilteredSales(salesData)
        setCustomers(customersData)
        toast.success(`Loaded ${salesData.length} sales records`)
      } catch (error) {
        console.error("Failed to load sales data:", error)
        toast.error("Failed to load sales data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    let filtered = sales.filter(
      (sale) =>
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    // Apply customer filter
    if (customerFilter !== "all") {
      filtered = filtered.filter((sale) => sale.customerName === customerFilter)
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((sale) => new Date(sale.saleDate) >= filterDate)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((sale) => new Date(sale.saleDate) >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((sale) => new Date(sale.saleDate) >= filterDate)
          break
      }
    }

    setFilteredSales(filtered)
  }, [searchTerm, customerFilter, dateFilter, sales])

  const handleAddSale = async (saleData) => {
    try {
      const newSaleId = await salesOperations.add(saleData)
      const newSale = { id: newSaleId, ...saleData, saleDate: new Date(), createdAt: new Date() }
      setSales((prev) => [newSale, ...prev])
      setIsAddDialogOpen(false)
      toast.success(`Sale recorded for ${saleData.customerName}`)
    } catch (error) {
      console.error("Failed to add sale:", error)
      toast.error("Failed to record sale")
    }
  }

  const handleExportCSV = () => {
    try {
      const exportData = filteredSales.map((sale) => ({
        "Sale Date": new Date(sale.saleDate).toLocaleDateString(),
        "Customer Name": sale.customerName,
        "Customer Phone": sale.customerPhone || "N/A",
        "Items Count": sale.items.length,
        Items: sale.items.map((item) => `${item.name} (${item.quantity})`).join(", "),
        "Total Amount": sale.totalAmount,
        "Payment Method": sale.paymentMethod || "N/A",
        Notes: sale.notes || "N/A",
      }))
      exportOperations.exportToCSV(exportData, "sales-export")
      toast.success("Sales data exported to CSV")
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Failed to export sales data")
    }
  }

  const getTotalSalesAmount = () => {
    return filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  }

  const getUniqueCustomers = () => {
    const customerNames = sales.map((sale) => sale.customerName)
    return [...new Set(customerNames)]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="h-96 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Sales Management</h1>
            <p className="text-slate-600">Record and track your jewelry sales transactions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record New Sale</DialogTitle>
                  <DialogDescription>Enter the details for the new sale transaction.</DialogDescription>
                </DialogHeader>
                <SalesForm onSubmit={handleAddSale} customers={customers} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Sales</p>
                  <p className="text-3xl font-bold text-slate-900">{filteredSales.length}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Revenue</p>
                  <p className="text-3xl font-bold text-slate-900">₹{getTotalSalesAmount().toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Sale</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹
                    {filteredSales.length > 0
                      ? Math.round(getTotalSalesAmount() / filteredSales.length).toLocaleString()
                      : 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Items Sold</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {filteredSales.reduce(
                      (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
                      0,
                    )}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle>Sales Transactions</CardTitle>
                <CardDescription>
                  {filteredSales.length} of {sales.length} sales
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search by customer or item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80"
                  />
                </div>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {getUniqueCustomers().map((customer) => (
                      <SelectItem key={customer} value={customer}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        {searchTerm || customerFilter !== "all" || dateFilter !== "all"
                          ? "No sales match your filters"
                          : "No sales recorded yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{sale.customerName}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {sale.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.name}
                              </div>
                            ))}
                            {sale.items.length > 2 && (
                              <div className="text-xs text-slate-500">+{sale.items.length - 2} more</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₹{sale.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.paymentMethod || "Cash"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSale(sale)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Sale Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>Complete information about this sale transaction.</DialogDescription>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">Customer Information</h4>
                    <p className="text-slate-600">{selectedSale.customerName}</p>
                    {selectedSale.customerPhone && <p className="text-slate-600">{selectedSale.customerPhone}</p>}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Sale Information</h4>
                    <p className="text-slate-600">Date: {new Date(selectedSale.saleDate).toLocaleDateString()}</p>
                    <p className="text-slate-600">Payment: {selectedSale.paymentMethod || "Cash"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Items Sold</h4>
                  <div className="space-y-2">
                    {selectedSale.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-600">
                            {item.karat} • {item.weight}g • Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">₹{item.totalPrice.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-slate-900">Total Amount</h4>
                    <p className="text-2xl font-bold text-green-600">₹{selectedSale.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                {selectedSale.notes && (
                  <div>
                    <h4 className="font-semibold text-slate-900">Notes</h4>
                    <p className="text-slate-600">{selectedSale.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
