import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  Store, 
  Settings,
  Webhook,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Globe,
  Key,
  Shield,
  Clock,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Activity,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Calendar,
  Filter,
  Search,
  TestTube,
  PlayCircle,
  CheckSquare,
  AlertCircle,
  Info,
  Zap
} from "lucide-react";

type IntegrationStatus = "connected" | "disconnected" | "syncing" | "error";

type MarketplaceConfig = {
  id: string;
  name: string;
  platform: "shopify" | "woocommerce" | "magento" | "lazada" | "tokopedia";
  status: IntegrationStatus;
  storeUrl: string;
  apiKey: string;
  secretKey?: string;
  webhookUrl: string;
  lastSync: string;
  syncInterval: number; // minutes
  autoSync: boolean;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  syncInventory: boolean;
  orderMapping: {
    statusMapping: Record<string, string>;
    fieldMapping: Record<string, string>;
  };
  webhooks: WebhookConfig[];
  createdAt: string;
  updatedAt: string;
};

type WebhookConfig = {
  id: string;
  event: string;
  url: string;
  secret: string;
  active: boolean;
  format: "json" | "xml";
  retryAttempts: number;
  lastTriggered?: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
};

type SyncLog = {
  id: string;
  marketplaceId: string;
  type: "products" | "orders" | "customers" | "inventory";
  status: "success" | "error" | "partial";
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errorMessage?: string;
  details: string;
};

// Mock marketplace configurations
const mockMarketplaces: MarketplaceConfig[] = [
  {
    id: "mp001",
    name: "Rexus Official Store",
    platform: "shopify",
    status: "connected",
    storeUrl: "rexus-gaming.myshopify.com",
    apiKey: "YOUR_SHOPIFY_API_KEY",
    secretKey: "YOUR_SHOPIFY_SECRET_KEY",
    webhookUrl: "https://api.rexus.com/webhooks/shopify",
    lastSync: "2024-08-10 14:30:00",
    syncInterval: 15,
    autoSync: true,
    syncProducts: true,
    syncOrders: true,
    syncCustomers: true,
    syncInventory: true,
    orderMapping: {
      statusMapping: {
        "pending": "pending_payment",
        "paid": "processing",
        "fulfilled": "shipped",
        "cancelled": "cancelled"
      },
      fieldMapping: {
        "customer_email": "email",
        "shipping_address": "address",
        "billing_address": "billing_address"
      }
    },
    webhooks: [
      {
        id: "wh001",
        event: "orders/create",
        url: "https://api.rexus.com/webhooks/orders/create",
        secret: "YOUR_WEBHOOK_SECRET_1",
        active: true,
        format: "json",
        retryAttempts: 3,
        lastTriggered: "2024-08-10 14:25:00",
        totalCalls: 1250,
        successfulCalls: 1230,
        failedCalls: 20
      },
      {
        id: "wh002",
        event: "orders/updated",
        url: "https://api.rexus.com/webhooks/orders/update",
        secret: "YOUR_WEBHOOK_SECRET_2",
        active: true,
        format: "json",
        retryAttempts: 3,
        lastTriggered: "2024-08-10 13:45:00",
        totalCalls: 856,
        successfulCalls: 850,
        failedCalls: 6
      },
      {
        id: "wh003",
        event: "orders/paid",
        url: "https://api.rexus.com/webhooks/orders/paid",
        secret: "YOUR_WEBHOOK_SECRET_3",
        active: true,
        format: "json",
        retryAttempts: 3,
        totalCalls: 425,
        successfulCalls: 425,
        failedCalls: 0
      }
    ],
    createdAt: "2024-07-15",
    updatedAt: "2024-08-10"
  },
  {
    id: "mp002",
    name: "Rexus Tokopedia",
    platform: "tokopedia",
    status: "disconnected",
    storeUrl: "tokopedia.com/rexus-official",
    apiKey: "YOUR_TOKOPEDIA_API_KEY",
    webhookUrl: "https://api.rexus.com/webhooks/tokopedia",
    lastSync: "2024-08-08 10:15:00",
    syncInterval: 30,
    autoSync: false,
    syncProducts: true,
    syncOrders: true,
    syncCustomers: false,
    syncInventory: true,
    orderMapping: {
      statusMapping: {
        "NEW": "pending_payment",
        "PAID": "processing",
        "SHIPPED": "shipped",
        "CANCELLED": "cancelled"
      },
      fieldMapping: {
        "buyer_email": "email",
        "shipping_address": "address"
      }
    },
    webhooks: [],
    createdAt: "2024-07-20",
    updatedAt: "2024-08-08"
  }
];

const mockSyncLogs: SyncLog[] = [
  {
    id: "log001",
    marketplaceId: "mp001",
    type: "orders",
    status: "success",
    startTime: "2024-08-10 14:30:00",
    endTime: "2024-08-10 14:32:15",
    recordsProcessed: 25,
    recordsSuccessful: 25,
    recordsFailed: 0,
    details: "Successfully synced 25 new orders from Shopify"
  },
  {
    id: "log002",
    marketplaceId: "mp001",
    type: "products",
    status: "partial",
    startTime: "2024-08-10 12:00:00",
    endTime: "2024-08-10 12:05:30",
    recordsProcessed: 150,
    recordsSuccessful: 145,
    recordsFailed: 5,
    errorMessage: "5 products failed due to missing SKU",
    details: "Synced 145 products, 5 failed validation"
  },
  {
    id: "log003",
    marketplaceId: "mp002",
    type: "orders",
    status: "error",
    startTime: "2024-08-08 10:15:00",
    endTime: "2024-08-08 10:15:30",
    recordsProcessed: 0,
    recordsSuccessful: 0,
    recordsFailed: 0,
    errorMessage: "API authentication failed",
    details: "Connection to Tokopedia API failed - invalid credentials"
  }
];

export default function MarketplaceIntegration() {
  const [marketplaces, setMarketplaces] = useState<MarketplaceConfig[]>(mockMarketplaces);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(mockSyncLogs);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceConfig | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isNewMarketplaceDialog, setIsNewMarketplaceDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form states
  const [newMarketplace, setNewMarketplace] = useState({
    name: "",
    platform: "shopify" as const,
    storeUrl: "",
    apiKey: "",
    secretKey: "",
    webhookUrl: ""
  });

  const [newWebhook, setNewWebhook] = useState({
    event: "",
    url: "",
    secret: "",
    format: "json" as const,
    retryAttempts: 3
  });

  const getStatusBadge = (status: IntegrationStatus) => {
    const variants = {
      connected: "bg-green-100 text-green-800",
      disconnected: "bg-gray-100 text-gray-800",
      syncing: "bg-blue-100 text-blue-800",
      error: "bg-red-100 text-red-800"
    };
    
    const icons = {
      connected: <CheckCircle className="h-3 w-3 mr-1" />,
      disconnected: <XCircle className="h-3 w-3 mr-1" />,
      syncing: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
      error: <AlertTriangle className="h-3 w-3 mr-1" />
    };
    
    return (
      <Badge className={variants[status]}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    // You can replace these with actual platform logos
    const icons = {
      shopify: <Store className="h-5 w-5 text-green-600" />,
      woocommerce: <Store className="h-5 w-5 text-purple-600" />,
      magento: <Store className="h-5 w-5 text-orange-600" />,
      lazada: <Store className="h-5 w-5 text-blue-600" />,
      tokopedia: <Store className="h-5 w-5 text-green-600" />
    };
    return icons[platform as keyof typeof icons] || <Store className="h-5 w-5" />;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSync = async (marketplaceId: string, type?: string) => {
    // Mock sync process
    const marketplace = marketplaces.find(m => m.id === marketplaceId);
    if (marketplace) {
      // Update status to syncing
      setMarketplaces(prev => prev.map(m => 
        m.id === marketplaceId ? { ...m, status: "syncing" as IntegrationStatus } : m
      ));

      // Simulate sync delay
      setTimeout(() => {
        setMarketplaces(prev => prev.map(m => 
          m.id === marketplaceId ? { 
            ...m, 
            status: "connected" as IntegrationStatus,
            lastSync: new Date().toISOString().slice(0, 19).replace('T', ' ')
          } : m
        ));

        // Add sync log
        const newLog: SyncLog = {
          id: `log${Date.now()}`,
          marketplaceId,
          type: (type as any) || "orders",
          status: "success",
          startTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          endTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          recordsProcessed: Math.floor(Math.random() * 50) + 10,
          recordsSuccessful: Math.floor(Math.random() * 50) + 10,
          recordsFailed: Math.floor(Math.random() * 3),
          details: `Manual sync completed for ${type || 'orders'}`
        };
        setSyncLogs(prev => [newLog, ...prev]);
      }, 3000);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    // Mock webhook test
    alert(`Testing webhook ${webhookId}... Check logs for results.`);
  };

  const handleCreateMarketplace = () => {
    const marketplace: MarketplaceConfig = {
      id: `mp${Date.now()}`,
      ...newMarketplace,
      status: "disconnected",
      lastSync: "",
      syncInterval: 15,
      autoSync: false,
      syncProducts: true,
      syncOrders: true,
      syncCustomers: true,
      syncInventory: true,
      orderMapping: {
        statusMapping: {},
        fieldMapping: {}
      },
      webhooks: [],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    setMarketplaces(prev => [...prev, marketplace]);
    setIsNewMarketplaceDialog(false);
    setNewMarketplace({
      name: "",
      platform: "shopify",
      storeUrl: "",
      apiKey: "",
      secretKey: "",
      webhookUrl: ""
    });
  };

  const stats = {
    totalMarketplaces: marketplaces.length,
    connectedMarketplaces: marketplaces.filter(m => m.status === "connected").length,
    totalWebhooks: marketplaces.reduce((sum, m) => sum + m.webhooks.length, 0),
    activeWebhooks: marketplaces.reduce((sum, m) => sum + m.webhooks.filter(w => w.active).length, 0),
    todaysSyncs: syncLogs.filter(log => 
      new Date(log.startTime).toDateString() === new Date().toDateString()
    ).length,
    successRate: syncLogs.length > 0 ? 
      Math.round((syncLogs.filter(log => log.status === "success").length / syncLogs.length) * 100) : 0
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Integration</h1>
          <p className="text-gray-600 mt-2">Connect and manage marketplace platforms</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Config
          </Button>
          <Button 
            onClick={() => setIsNewMarketplaceDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Marketplace
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Marketplaces</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMarketplaces}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connected</p>
                  <p className="text-3xl font-bold text-green-600">{stats.connectedMarketplaces}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Webhooks</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.activeWebhooks}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Webhook className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Syncs</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.todaysSyncs}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600">{stats.successRate}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Webhooks</p>
                  <p className="text-3xl font-bold text-gray-600">{stats.totalWebhooks}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Settings className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Connected Marketplaces</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {marketplaces
                  .filter(m => m.status === "connected")
                  .map((marketplace) => (
                  <div key={marketplace.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                      {getPlatformIcon(marketplace.platform)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{marketplace.name}</div>
                      <div className="text-sm text-gray-500">{marketplace.storeUrl}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">Connected</div>
                      <div className="text-xs text-gray-500">
                        Last sync: {formatDateTime(marketplace.lastSync)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Sync Activity</h3>
                <Button variant="outline" size="sm">View Logs</Button>
              </div>
              <div className="space-y-4">
                {syncLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      log.status === "success" ? "bg-green-100" :
                      log.status === "error" ? "bg-red-100" : "bg-yellow-100"
                    }`}>
                      {log.status === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {log.status === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                      {log.status === "partial" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 capitalize">{log.type} Sync</div>
                      <div className="text-sm text-gray-500">
                        {log.recordsProcessed} records processed
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{formatDateTime(log.startTime)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketplaces" className="space-y-6">
          {/* Marketplace List */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Marketplace Connections</h2>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sync All
                  </Button>
                  <Button 
                    onClick={() => setIsNewMarketplaceDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Marketplace
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {marketplaces.map((marketplace) => (
                  <Card key={marketplace.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getPlatformIcon(marketplace.platform)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{marketplace.name}</h3>
                            {getStatusBadge(marketplace.status)}
                          </div>
                          <div className="text-sm text-gray-500">{marketplace.storeUrl}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Platform: {marketplace.platform.charAt(0).toUpperCase() + marketplace.platform.slice(1)}
                            {marketplace.lastSync && (
                              <> • Last sync: {formatDateTime(marketplace.lastSync)}</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(marketplace.status === "connected" || marketplace.status === "syncing") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(marketplace.id)}
                            disabled={marketplace.status === "syncing"}
                            className="flex items-center gap-2"
                          >
                            {marketplace.status === "syncing" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Sync Now
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMarketplace(marketplace);
                            setIsConfigDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Configure
                        </Button>
                      </div>
                    </div>

                    {/* Sync Options */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Products</span>
                          <Switch checked={marketplace.syncProducts} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Orders</span>
                          <Switch checked={marketplace.syncOrders} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Customers</span>
                          <Switch checked={marketplace.syncCustomers} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Inventory</span>
                          <Switch checked={marketplace.syncInventory} />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          {/* Webhooks Management */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Webhook Configuration</h2>
                <Button 
                  onClick={() => setIsWebhookDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Webhook
                </Button>
              </div>

              {marketplaces.map((marketplace) => (
                <Card key={marketplace.id} className="mb-6">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getPlatformIcon(marketplace.platform)}
                        </div>
                        <div>
                          <h3 className="font-medium">{marketplace.name}</h3>
                          <p className="text-sm text-gray-500">{marketplace.webhooks.length} webhooks</p>
                        </div>
                      </div>
                      {getStatusBadge(marketplace.status)}
                    </div>
                  </div>

                  <div className="p-4">
                    {marketplace.webhooks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Webhook className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No webhooks configured</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event</TableHead>
                              <TableHead>URL</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Calls</TableHead>
                              <TableHead>Success Rate</TableHead>
                              <TableHead>Last Triggered</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {marketplace.webhooks.map((webhook) => (
                              <TableRow key={webhook.id}>
                                <TableCell>
                                  <div className="font-medium">{webhook.event}</div>
                                  <div className="text-sm text-gray-500">{webhook.format.toUpperCase()}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono text-sm max-w-xs truncate">
                                    {webhook.url}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={webhook.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                    {webhook.active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{webhook.totalCalls.toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm">
                                      {webhook.totalCalls > 0 ? 
                                        Math.round((webhook.successfulCalls / webhook.totalCalls) * 100) : 0}%
                                    </div>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full" 
                                        style={{
                                          width: `${webhook.totalCalls > 0 ? 
                                            (webhook.successfulCalls / webhook.totalCalls) * 100 : 0}%`
                                        }}
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {webhook.lastTriggered ? 
                                    formatDateTime(webhook.lastTriggered) : 
                                    "Never"
                                  }
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleTestWebhook(webhook.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <TestTube className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sync-logs" className="space-y-6">
          {/* Sync Logs */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Synchronization Logs</h2>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marketplace</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => {
                      const marketplace = marketplaces.find(m => m.id === log.marketplaceId);
                      const duration = log.endTime ? 
                        ((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000) : 0;
                      
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {marketplace && getPlatformIcon(marketplace.platform)}
                              <span className="font-medium">{marketplace?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{log.type}</TableCell>
                          <TableCell>
                            <Badge className={
                              log.status === "success" ? "bg-green-100 text-green-800" :
                              log.status === "error" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {log.status === "success" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {log.status === "error" && <XCircle className="h-3 w-3 mr-1" />}
                              {log.status === "partial" && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.recordsProcessed}</div>
                              <div className="text-sm text-gray-500">
                                ✓ {log.recordsSuccessful} ✗ {log.recordsFailed}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.recordsProcessed > 0 ? 
                              Math.round((log.recordsSuccessful / log.recordsProcessed) * 100) : 0}%
                          </TableCell>
                          <TableCell>
                            {duration > 0 ? `${duration.toFixed(1)}s` : "-"}
                          </TableCell>
                          <TableCell>{formatDateTime(log.startTime)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add New Marketplace Dialog */}
      <Dialog open={isNewMarketplaceDialog} onOpenChange={setIsNewMarketplaceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Marketplace</DialogTitle>
            <DialogDescription>
              Connect a new marketplace platform to sync orders and products.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select 
                value={newMarketplace.platform} 
                onValueChange={(value: any) => setNewMarketplace(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  <SelectItem value="magento">Magento</SelectItem>
                  <SelectItem value="lazada">Lazada</SelectItem>
                  <SelectItem value="tokopedia">Tokopedia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Store Name</Label>
              <Input
                id="name"
                value={newMarketplace.name}
                onChange={(e) => setNewMarketplace(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Rexus Official Store"
              />
            </div>

            <div>
              <Label htmlFor="storeUrl">Store URL</Label>
              <Input
                id="storeUrl"
                value={newMarketplace.storeUrl}
                onChange={(e) => setNewMarketplace(prev => ({ ...prev, storeUrl: e.target.value }))}
                placeholder="e.g., your-store.myshopify.com"
              />
            </div>

            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={newMarketplace.apiKey}
                onChange={(e) => setNewMarketplace(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter API key"
              />
            </div>

            <div>
              <Label htmlFor="secretKey">Secret Key (Optional)</Label>
              <Input
                id="secretKey"
                type="password"
                value={newMarketplace.secretKey}
                onChange={(e) => setNewMarketplace(prev => ({ ...prev, secretKey: e.target.value }))}
                placeholder="Enter secret key"
              />
            </div>

            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={newMarketplace.webhookUrl}
                onChange={(e) => setNewMarketplace(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://api.yoursite.com/webhooks"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMarketplaceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMarketplace}>
              Add Marketplace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedMarketplace?.name}</DialogTitle>
            <DialogDescription>
              Manage sync settings and field mappings for this marketplace.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMarketplace && (
            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Help</AlertTitle>
                <AlertDescription>
                  Configure how orders and products are synchronized between your marketplace and Rexus system.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sync Interval (minutes)</Label>
                  <Input type="number" defaultValue={selectedMarketplace.syncInterval} />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Auto Sync</Label>
                  <Switch defaultChecked={selectedMarketplace.autoSync} />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Status Mapping</h3>
                <div className="space-y-3">
                  {Object.entries(selectedMarketplace.orderMapping.statusMapping).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">{key}</Label>
                        <Input value={key} disabled />
                      </div>
                      <div>
                        <Label className="text-sm">Maps to</Label>
                        <Input defaultValue={value} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
