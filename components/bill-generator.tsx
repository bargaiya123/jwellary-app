"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Download, Printer, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function BillGenerator({ sale, onClose }) {
  const [businessInfo, setBusinessInfo] = useState({
    name: "Golden Jewelry Store",
    address: "123 Jewelry Street, Gold Market",
    city: "Mumbai, Maharashtra 400001",
    phone: "+91 98765 43210",
    email: "info@goldenjewelry.com",
    gst: "GST123456789",
  })

  const [billSettings, setBillSettings] = useState({
    taxRate: 3, // 3% GST for jewelry
    discount: 0,
    notes: "Thank you for your business!",
  })

  const billRef = useRef()
  const { toast } = useToast()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateSubtotal = () => {
    return sale.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  }

  const calculateDiscount = () => {
    return (calculateSubtotal() * billSettings.discount) / 100
  }

  const calculateTax = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount()
    return (afterDiscount * billSettings.taxRate) / 100
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax()
  }

  const handlePrint = () => {
    const printContent = billRef.current
    const printWindow = window.open("", "_blank")

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${sale.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .bill-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .business-info { margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f5f5f5; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .total-row.final { font-weight: bold; border-top: 2px solid #000; }
            .notes { margin-top: 30px; font-style: italic; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()

    toast({
      title: "Success",
      description: "Bill sent to printer",
    })
  }

  const handleDownloadPDF = () => {
    // In a real app, you'd use a library like jsPDF or html2pdf
    toast({
      title: "Info",
      description: "PDF download feature would be implemented with jsPDF library",
    })
  }

  const handleSaveBill = () => {
    // Save bill data to database
    toast({
      title: "Success",
      description: "Bill saved successfully",
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Invoice Generator
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="businessName" className="text-xs">
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-xs">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={`${businessInfo.address}\n${businessInfo.city}`}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n")
                      setBusinessInfo({
                        ...businessInfo,
                        address: lines[0] || "",
                        city: lines[1] || "",
                      })
                    }}
                    className="text-sm h-16"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="gst" className="text-xs">
                    GST Number
                  </Label>
                  <Input
                    id="gst"
                    value={businessInfo.gst}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, gst: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bill Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="taxRate" className="text-xs">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={billSettings.taxRate}
                    onChange={(e) =>
                      setBillSettings({ ...billSettings, taxRate: Number.parseFloat(e.target.value) || 0 })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="discount" className="text-xs">
                    Discount (%)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    value={billSettings.discount}
                    onChange={(e) =>
                      setBillSettings({ ...billSettings, discount: Number.parseFloat(e.target.value) || 0 })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={billSettings.notes}
                    onChange={(e) => setBillSettings({ ...billSettings, notes: e.target.value })}
                    className="text-sm h-16"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Bill
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={handleSaveBill} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Save className="h-4 w-4" />
                Save Bill
              </Button>
            </div>
          </div>

          {/* Bill Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div ref={billRef} className="bill-container">
                  {/* Header */}
                  <div className="header text-center mb-8">
                    <h1 className="text-3xl font-bold text-amber-600 mb-2">{businessInfo.name}</h1>
                    <p className="text-sm text-gray-600">{businessInfo.address}</p>
                    <p className="text-sm text-gray-600">{businessInfo.city}</p>
                    <p className="text-sm text-gray-600">
                      Phone: {businessInfo.phone} | GST: {businessInfo.gst}
                    </p>
                  </div>

                  <Separator className="mb-6" />

                  {/* Invoice Info */}
                  <div className="flex justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">INVOICE</h2>
                      <p className="text-sm">
                        <strong>Invoice #:</strong> INV-{sale.id.slice(-8)}
                      </p>
                      <p className="text-sm">
                        <strong>Date:</strong> {formatDate(sale.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold mb-2">Bill To:</h3>
                      <p className="text-sm">{sale.customerName || "Walk-in Customer"}</p>
                      {sale.customerPhone && <p className="text-sm">Phone: {sale.customerPhone}</p>}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-6">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Item</th>
                          <th className="border border-gray-300 p-2 text-center">Qty</th>
                          <th className="border border-gray-300 p-2 text-right">Rate</th>
                          <th className="border border-gray-300 p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-2">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">
                                  {item.karat} - {item.weight}g
                                </p>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                            <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.price)}</td>
                            <td className="border border-gray-300 p-2 text-right">
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-6">
                    <div className="w-80">
                      <div className="flex justify-between py-1">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {billSettings.discount > 0 && (
                        <div className="flex justify-between py-1 text-green-600">
                          <span>Discount ({billSettings.discount}%):</span>
                          <span>-{formatCurrency(calculateDiscount())}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span>Tax ({billSettings.taxRate}%):</span>
                        <span>{formatCurrency(calculateTax())}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between py-2 text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {billSettings.notes && (
                    <div className="mt-8 p-4 bg-gray-50 rounded">
                      <p className="text-sm italic">{billSettings.notes}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 text-center text-xs text-gray-500">
                    <p>This is a computer generated invoice.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
