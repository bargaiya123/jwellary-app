"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, Users, DollarSign, TrendingUp, Clock } from "lucide-react"
import { dashboardOperations } from "@/lib/database"
import Link from "next/link"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const dashboardStats = await dashboardOperations.getStats()
        setStats(dashboardStats)
      } catch (err) {
        setError("Failed to load dashboard data")
        console.error("Dashboard error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Jewelry Business Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here's what's happening with your business today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Inventory"
            value={stats?.totalInventoryItems || 0}
            icon={Package}
            description="Items in stock"
            color="blue"
          />
          <StatsCard
            title="Stock Quantity"
            value={stats?.totalStockQuantity || 0}
            icon={TrendingUp}
            description="Total pieces"
            color="green"
          />
          <StatsCard
            title="Total Sales"
            value={`₹${(stats?.totalSalesAmount || 0).toLocaleString()}`}
            icon={DollarSign}
            description="Revenue generated"
            color="yellow"
          />
          <StatsCard
            title="Customers"
            value={stats?.totalCustomers || 0}
            icon={Users}
            description="Registered customers"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Alerts */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Low Stock Alerts</CardTitle>
                  <CardDescription>Items running low on inventory</CardDescription>
                </div>
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              {stats?.lowStockItems?.length > 0 ? (
                <div className="space-y-4">
                  {stats.lowStockItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">
                          {item.karat} • {item.weight}g
                        </p>
                      </div>
                      <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                        {item.stockQuantity} left
                      </Badge>
                    </div>
                  ))}
                  {stats.lowStockItems.length > 5 && (
                    <p className="text-sm text-slate-500 text-center pt-2">
                      +{stats.lowStockItems.length - 5} more items need attention
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>All items are well stocked!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Recent Sales</CardTitle>
                  <CardDescription>Latest transactions</CardDescription>
                </div>
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentSales?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{sale.customerName}</p>
                        <p className="text-sm text-slate-600">
                          {sale.items.length} item{sale.items.length > 1 ? "s" : ""} •{" "}
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{sale.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No recent sales</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/inventory">
                <Button className="h-16 w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Package className="h-5 w-5 mr-2" />
                  Manage Inventory
                </Button>
              </Link>
              <Link href="/sales">
                <Button className="h-16 w-full bg-green-600 hover:bg-green-700 text-white">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Record Sale
                </Button>
              </Link>
              <Link href="/customers">
                <Button className="h-16 w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Users className="h-5 w-5 mr-2" />
                  Manage Customers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, description, color }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
  }

  return (
    <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
// add comment
// hello this is test
// add comment
// hello this is test
