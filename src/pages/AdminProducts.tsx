import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Download,
  Upload,
  Star,
  TrendingUp,
  TrendingDown,
  ImageIcon,
  Tag,
  DollarSign,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

type ProductStatus = "active" | "inactive" | "out_of_stock" | "discontinued";
type ProductCategory = "keyboard" | "mouse" | "headset" | "mousepad" | "chair" | "accessories";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  stock: number;
  status: ProductStatus;
  rating: number;
  reviews: number;
  sales: number;
  revenue: number;
  description: string;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  flashDeal: boolean;
};

// Mock product data
const mockProducts: Product[] = [
  {
    id: "PRD001",
    name: "Rexus Gaming Keyboard RGB MX330",
    sku: "RXS-KB-MX330",
    category: "keyboard",
    price: 750000,
    originalPrice: 850000,
    stock: 45,
    status: "active",
    rating: 4.8,
    reviews: 124,
    sales: 89,
    revenue: 66750000,
    description: "Mechanical gaming keyboard with RGB backlighting and premium switches",
    images: ["/src/assets/gaming-keyboard.jpg"],
    tags: ["rgb", "mechanical", "gaming", "wireless"],
    createdAt: "2024-01-15",
    updatedAt: "2024-08-10",
    featured: true,
    flashDeal: false
  },
  {
    id: "PRD002",
    name: "Rexus Gaming Mouse Pro X1",
    sku: "RXS-MS-X1",
    category: "mouse",
    price: 450000,
    stock: 67,
    status: "active",
    rating: 4.6,
    reviews: 98,
    sales: 134,
    revenue: 60300000,
    description: "High-precision gaming mouse with adjustable DPI and ergonomic design",
    images: ["/src/assets/gaming-mouse.jpg"],
    tags: ["high-dpi", "ergonomic", "gaming", "wired"],
    createdAt: "2024-02-01",
    updatedAt: "2024-08-09",
    featured: true,
    flashDeal: true
  },
  {
    id: "PRD003",
    name: "Rexus Gaming Headset HX990",
    sku: "RXS-HS-HX990",
    category: "headset",
    price: 890000,
    stock: 23,
    status: "active",
    rating: 4.9,
    reviews: 76,
    sales: 56,
    revenue: 49840000,
    description: "Premium gaming headset with 7.1 surround sound and noise cancellation",
    images: ["/src/assets/gaming-headset.jpg"],
    tags: ["7.1-surround", "noise-cancelling", "premium", "wireless"],
    createdAt: "2024-01-20",
    updatedAt: "2024-08-08",
    featured: false,
    flashDeal: false
  },
  {
    id: "PRD004",
    name: "Rexus Mousepad XL Marvel Edition",
    sku: "RXS-MP-MARVEL",
    category: "mousepad",
    price: 150000,
    stock: 0,
    status: "out_of_stock",
    rating: 4.4,
    reviews: 45,
    sales: 78,
    revenue: 11700000,
    description: "Extra large gaming mousepad with Marvel character designs",
    images: ["/src/assets/placeholder.svg"],
    tags: ["xl-size", "marvel", "anti-slip", "fabric"],
    createdAt: "2024-03-10",
    updatedAt: "2024-08-05",
    featured: false,
    flashDeal: false
  },
  {
    id: "PRD005",
    name: "Rexus Gaming Chair RGC-110",
    sku: "RXS-CH-RGC110",
    category: "chair",
    price: 2100000,
    stock: 12,
    status: "active",
    rating: 4.7,
    reviews: 32,
    sales: 18,
    revenue: 37800000,
    description: "Ergonomic gaming chair with lumbar support and adjustable armrests",
    images: ["/src/assets/placeholder.svg"],
    tags: ["ergonomic", "lumbar-support", "adjustable", "premium"],
    createdAt: "2024-02-15",
    updatedAt: "2024-08-07",
    featured: false,
    flashDeal: false
  }
];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: ProductStatus) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      out_of_stock: "bg-red-100 text-red-800",
      discontinued: "bg-yellow-100 text-yellow-800"
    };
    
    const icons = {
      active: <CheckCircle className="h-3 w-3 mr-1" />,
      inactive: <XCircle className="h-3 w-3 mr-1" />,
      out_of_stock: <AlertTriangle className="h-3 w-3 mr-1" />,
      discontinued: <Clock className="h-3 w-3 mr-1" />
    };
    
    return (
      <Badge className={variants[status]}>
        {icons[status]}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category: ProductCategory) => {
    const variants = {
      keyboard: "bg-blue-100 text-blue-800",
      mouse: "bg-purple-100 text-purple-800",
      headset: "bg-orange-100 text-orange-800",
      mousepad: "bg-teal-100 text-teal-800",
      chair: "bg-indigo-100 text-indigo-800",
      accessories: "bg-pink-100 text-pink-800"
    };
    
    return <Badge className={variants[category]}>{category.charAt(0).toUpperCase() + category.slice(1)}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(product => product.id !== productId));
    }
  };

  const productStats = {
    total: products.length,
    active: products.filter(p => p.status === "active").length,
    outOfStock: products.filter(p => p.status === "out_of_stock").length,
    featured: products.filter(p => p.featured).length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    averageRating: products.reduce((sum, p) => sum + p.rating, 0) / products.length
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog and inventory</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input id="productName" placeholder="Enter product name" />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" placeholder="Enter SKU" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keyboard">Keyboard</SelectItem>
                        <SelectItem value="mouse">Mouse</SelectItem>
                        <SelectItem value="headset">Headset</SelectItem>
                        <SelectItem value="mousepad">Mousepad</SelectItem>
                        <SelectItem value="chair">Chair</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price (IDR)</Label>
                    <Input id="price" type="number" placeholder="Enter price" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter product description" />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Add Product</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{productStats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-3xl font-bold text-green-600">{productStats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600">{productStats.outOfStock}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(productStats.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Top Performing Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Top Selling Products</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {products
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 5)
                  .map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sales} sales</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</div>
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Low Stock Alert</h3>
                <Button variant="outline" size="sm">Restock</Button>
              </div>
              <div className="space-y-4">
                {products
                  .filter(p => p.stock < 25)
                  .map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-yellow-700">{product.stock} left</div>
                      <div className="text-sm text-yellow-600">Low stock</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Filters and Search */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products by name, SKU, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="mouse">Mouse</SelectItem>
                    <SelectItem value="headset">Headset</SelectItem>
                    <SelectItem value="mousepad">Mousepad</SelectItem>
                    <SelectItem value="chair">Chair</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Products Table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Products ({filteredProducts.length})</h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.sku}</div>
                              <div className="text-xs text-gray-400">{product.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(product.category)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(product.price)}</div>
                            {product.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.originalPrice)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${
                            product.stock === 0 ? 'text-red-600' : 
                            product.stock < 25 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.stock}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{product.rating}</span>
                            <span className="text-sm text-gray-500">({product.reviews})</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.sales}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
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
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="text-center py-12">
            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory Management</h3>
            <p className="text-gray-600">Track stock levels, manage warehouses, and handle restocking</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Product Analytics</h3>
            <p className="text-gray-600">View detailed analytics and performance metrics for your products</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">SKU</Label>
                      <p className="font-medium">{selectedProduct.sku}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Category</Label>
                      <div className="mt-1">{getCategoryBadge(selectedProduct.category)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Price</Label>
                      <p className="font-medium">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Stock</Label>
                      <p className="font-medium">{selectedProduct.stock}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Rating</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selectedProduct.rating}</span>
                        <span className="text-sm text-gray-500">({selectedProduct.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-gray-600">Total Sales</Label>
                      <p className="font-bold text-lg">{selectedProduct.sales}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Total Revenue</Label>
                      <p className="font-bold text-lg">{formatCurrency(selectedProduct.revenue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
