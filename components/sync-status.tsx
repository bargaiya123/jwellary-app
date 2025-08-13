"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock, Database } from "lucide-react"
import { addNetworkListener, removeNetworkListener, getNetworkStatus, toggleOfflineMode } from "@/lib/firebase"
import { addSyncStatusListener, removeSyncStatusListener, getSyncSummary, forceSyncRefresh } from "@/lib/realtime-sync"
import toast from "react-hot-toast"

export function SyncStatus({ compact = false }) {
  const [networkStatus, setNetworkStatus] = useState({ online: true, syncing: false })
  const [syncSummary, setSyncSummary] = useState({ synced: 0, total: 0, percentage: 0, hasErrors: false })
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Setup network status listener
    const networkListener = (status) => {
      setNetworkStatus(status)
    }
    addNetworkListener(networkListener)

    // Setup sync status listener
    const syncListener = (status) => {
      setSyncSummary(getSyncSummary())
    }
    const syncListenerId = addSyncStatusListener(syncListener)

    // Initial status
    setNetworkStatus(getNetworkStatus())
    setSyncSummary(getSyncSummary())

    return () => {
      removeNetworkListener(networkListener)
      removeSyncStatusListener(syncListenerId)
    }
  }, [])

  const handleToggleOffline = async () => {
    try {
      await toggleOfflineMode(!networkStatus.online)
      toast.success(networkStatus.online ? "Switched to offline mode" : "Switched to online mode")
    } catch (error) {
      toast.error("Failed to toggle offline mode")
    }
  }

  const handleForceSync = async () => {
    if (!networkStatus.online) {
      toast.error("Cannot sync while offline")
      return
    }

    setIsRefreshing(true)
    try {
      await forceSyncRefresh()
      toast.success("Data synchronized successfully")
    } catch (error) {
      toast.error("Failed to sync data")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={networkStatus.online ? "default" : "secondary"} className="flex items-center gap-1">
          {networkStatus.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {networkStatus.online ? "Online" : "Offline"}
        </Badge>

        {networkStatus.online && (
          <Badge
            variant={syncSummary.percentage === 100 ? "default" : syncSummary.hasErrors ? "destructive" : "secondary"}
            className="flex items-center gap-1"
          >
            {syncSummary.percentage === 100 ? (
              <CheckCircle className="h-3 w-3" />
            ) : syncSummary.hasErrors ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {syncSummary.percentage}% Synced
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {networkStatus.online ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium text-slate-900">{networkStatus.online ? "Online" : "Offline"}</p>
                <p className="text-sm text-slate-600">
                  {networkStatus.online ? "Connected to server" : "Working offline"}
                </p>
              </div>
            </div>

            {networkStatus.online && (
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-slate-900">Sync Status: {syncSummary.percentage}%</p>
                  <p className="text-sm text-slate-600">
                    {syncSummary.synced} of {syncSummary.total} collections synced
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleOffline}
              className="flex items-center gap-2 bg-transparent"
            >
              {networkStatus.online ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
              {networkStatus.online ? "Go Offline" : "Go Online"}
            </Button>

            {networkStatus.online && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceSync}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Sync
              </Button>
            )}
          </div>
        </div>

        {syncSummary.hasErrors && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Some data failed to sync. Check your connection and try again.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
