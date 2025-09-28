import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Plus, 
  Search, 
  ShoppingCart,
  User,
  MapPin,
  Package,
  Truck,
  CreditCard,
  Calculator,
  Trash2,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  FileText
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
};

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  total: number;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
};

type Address = {
  id: string;
  type: "home" | "office" | "other";
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type ShippingMethod = {
  id: string;
  name: string;
  provider: string;
  estimatedDays: string;
  cost: number;
  description: string;
};

type PaymentMethod = {
  id: string;
  name: string;
  type: "credit_card" | "bank_transfer" | "e_wallet" | "cod";
  fee: number;
  processingTime: string;
  description: string;
};

// Mock data
const mockProducts: Product[] = [
  {
    id: "PRD001",
    name: "Rexus Gaming Keyboard RGB MX330",
    sku: "RXS-KB-MX330",
    price: 750000,
    stock: 45
  },
  {
    id: "PRD002",
    name: "Rexus Gaming Mouse Pro X1",
    sku: "RXS-MS-X1",
    price: 450000,
    stock: 67
  },
  {
    id: "PRD003",
    name: "Rexus Gaming Headset HX990",
    sku: "RXS-HS-HX990",
    price: 890000,
    stock: 23
  },
  {
    id: "PRD004",
    name: "Rexus Mousepad XL Marvel Edition",
    sku: "RXS-MP-MARVEL",
    price: 150000,
    stock: 0
  },
  {
    id: "PRD005",
    name: "Rexus Gaming Chair RGC-110",
    sku: "RXS-CH-RGC110",
    price: 2100000,
    stock: 12
  }
];

const mockCustomers: Customer[] = [
  {
    id: "CUST001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+62812345678",
    addresses: [
      {
        id: "ADDR001",
        type: "home",
        street: "Jl. Sudirman No. 123",
        city: "Jakarta",
        state: "DKI Jakarta",
        postalCode: "12190",
        country: "Indonesia",
        isDefault: true
      },
      {
        id: "ADDR002",
        type: "office",
        street: "Jl. Thamrin No. 456",
        city: "Jakarta",
        state: "DKI Jakarta",
        postalCode: "10230",
        country: "Indonesia",
        isDefault: false
      }
    ]
  },
  {
    id: "CUST002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+62823456789",
    addresses: [
      {
        id: "ADDR003",
        type: "home",
        street: "Jl. Asia Afrika No. 789",
        city: "Bandung",
        state: "Jawa Barat",
        postalCode: "40111",
        country: "Indonesia",
        isDefault: true
      }
    ]
  }
];

const shippingMethods: ShippingMethod[] = [
  {
    id: "SHIP001",
    name: "Standard Delivery",
    provider: "REX Express",
    estimatedDays: "3-5 days",
    cost: 25000,
    description: "Standard shipping with tracking"
  },
  {
    id: "SHIP002",
    name: "Express Delivery",
    provider: "REX Express",
    estimatedDays: "1-2 days",
    cost: 50000,
    description: "Fast delivery with priority handling"
  },
  {
    id: "SHIP003",
    name: "Same Day Delivery",
    provider: "REX Express",
    estimatedDays: "Same day",
    cost: 100000,
    description: "Same day delivery (Jakarta area only)"
  },
  {
    id: "SHIP004",
    name: "Free Shipping",
    provider: "REX Express",
    estimatedDays: "5-7 days",
    cost: 0,
    description: "Free shipping for orders above Rp 1,000,000"
  }
];

const paymentMethods: PaymentMethod[] = [
  {
    id: "PAY001",
    name: "Credit Card",
    type: "credit_card",
    fee: 0,
    processingTime: "Instant",
    description: "Visa, Mastercard, JCB accepted"
  },
  {
    id: "PAY002",
    name: "Bank Transfer",
    type: "bank_transfer",
    fee: 5000,
    processingTime: "1-3 hours",
    description: "Manual verification required"
  },
  {
    id: "PAY003",
    name: "GoPay",
    type: "e_wallet",
    fee: 0,
    processingTime: "Instant",
    description: "Pay with GoPay wallet"
  },
  {
    id: "PAY004",
    name: "OVO",
    type: "e_wallet",
    fee: 0,
    processingTime: "Instant",
    description: "Pay with OVO wallet"
  },
  {
    id: "PAY005",
    name: "Cash on Delivery",
    type: "cod",
    fee: 10000,
    processingTime: "On delivery",
    description: "Pay when package arrives"
  }
];

export default function CreateOrder() {
  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Calculations
  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const discountValue = discountType === "percentage" 
    ? (subtotal * discountAmount) / 100 
    : discountAmount;
  const shippingCost = selectedShipping?.cost || 0;
  const paymentFee = selectedPayment?.fee || 0;
  const tax = Math.round((subtotal - discountValue) * 0.1); // 10% tax
  const finalTotal = subtotal - discountValue + shippingCost + paymentFee + tax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem: OrderItem = {
        id: `ITEM${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        price: product.price,
        total: product.price
      };
      setOrderItems([...orderItems, newItem]);
    }
    setIsProductDialogOpen(false);
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.id !== itemId));
    } else {
      setOrderItems(orderItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ));
    }
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedAddress(customer.addresses.find(addr => addr.isDefault) || customer.addresses[0]);
    setIsCustomerDialogOpen(false);
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2:
        return orderItems.length > 0;
      case 3:
        return selectedCustomer && selectedAddress;
      case 4:
        return selectedShipping;
      case 5:
        return selectedPayment;
      default:
        return true;
    }
  };

  const createOrder = () => {
    if (!selectedCustomer || !selectedAddress || !selectedShipping || !selectedPayment) {
      alert("Please complete all required information");
      return;
    }

    const orderData = {
      items: orderItems,
      customer: selectedCustomer,
      shippingAddress: selectedAddress,
      shipping: selectedShipping,
      payment: selectedPayment,
      subtotal,
      discount: discountValue,
      shippingCost,
      paymentFee,
      tax,
      total: finalTotal,
      notes: orderNotes
    };

    console.log("Creating order:", orderData);
    alert("Order created successfully!");
    
    // Reset form
    setOrderItems([]);
    setSelectedCustomer(null);
    setSelectedAddress(null);
    setSelectedShipping(null);
    setSelectedPayment(null);
    setOrderNotes("");
    setDiscountAmount(0);
    setCurrentStep(1);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-2">Create and process customer orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={createOrder} disabled={!canProceedToStep(5)}>
            <Save className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: "Products", icon: Package },
            { step: 2, title: "Customer", icon: User },
            { step: 3, title: "Shipping", icon: Truck },
            { step: 4, title: "Payment", icon: CreditCard },
            { step: 5, title: "Review", icon: CheckCircle }
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-2">
                <div className={`text-sm font-medium ${
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {title}
                </div>
              </div>
              {step < 5 && (
                <div className={`w-16 h-1 mx-4 rounded ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Products */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </h3>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select Products</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.sku}</div>
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(product.price)}</TableCell>
                              <TableCell>
                                <Badge className={product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                  {product.stock}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  onClick={() => addProductToOrder(product)}
                                  disabled={product.stock === 0}
                                >
                                  Add
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {orderItems.length > 0 ? (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.productSku}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-20"
                        min="1"
                      />
                      <span className="text-sm text-gray-500">×</span>
                      <span className="w-24 text-right">{formatCurrency(item.price)}</span>
                      <span className="w-24 text-right font-medium">{formatCurrency(item.total)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No products added yet</p>
                <p className="text-sm">Click "Add Product" to get started</p>
              </div>
            )}
          </Card>

          {/* Step 2: Customer Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!canProceedToStep(2)}>
                    {selectedCustomer ? 'Change Customer' : 'Select Customer'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select Customer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                              <div className="text-sm text-gray-500">{customer.phone}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedCustomer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                    <div className="text-sm text-blue-700">{selectedCustomer.email}</div>
                    <div className="text-sm text-blue-700">{selectedCustomer.phone}</div>
                  </div>
                </div>

                {/* Address Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Shipping Address</Label>
                  <div className="space-y-2">
                    {selectedCustomer.addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-3 border rounded-lg cursor-pointer ${
                          selectedAddress?.id === address.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <Badge variant={address.type === 'home' ? 'default' : 'secondary'}>
                            {address.type}
                          </Badge>
                          {address.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 ml-6">
                          <div>{address.street}</div>
                          <div>{address.city}, {address.state} {address.postalCode}</div>
                          <div>{address.country}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No customer selected</p>
                <p className="text-sm">Select a customer to continue</p>
              </div>
            )}
          </Card>

          {/* Step 3: Shipping Method */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5" />
              Shipping Method
            </h3>

            {canProceedToStep(3) ? (
              <div className="space-y-3">
                {shippingMethods
                  .filter(method => method.id !== "SHIP004" || subtotal >= 1000000)
                  .map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedShipping?.id === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedShipping(method)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-500">{method.provider} • {method.estimatedDays}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {method.cost === 0 ? 'Free' : formatCurrency(method.cost)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select customer and address first</p>
              </div>
            )}
          </Card>

          {/* Step 4: Payment Method */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </h3>

            {canProceedToStep(4) ? (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedPayment?.id === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPayment(method)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-500">{method.processingTime}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {method.fee === 0 ? 'No Fee' : `+${formatCurrency(method.fee)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select shipping method first</p>
              </div>
            )}
          </Card>

          {/* Order Notes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Order Notes
            </h3>
            <Textarea
              placeholder="Add any special instructions or notes for this order..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
            />
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-8">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5" />
              Order Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({orderItems.length} items):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount Section */}
              <div className="border-t pt-3">
                <Label className="text-sm font-medium mb-2 block">Discount</Label>
                <div className="flex gap-2 mb-2">
                  <Select value={discountType} onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">IDR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder={discountType === "percentage" ? "0" : "0"}
                    min="0"
                    max={discountType === "percentage" ? "100" : subtotal.toString()}
                  />
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountValue)}</span>
                  </div>
                )}
              </div>

              {selectedShipping && (
                <div className="flex justify-between text-sm">
                  <span>Shipping ({selectedShipping.name}):</span>
                  <span>{selectedShipping.cost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
                </div>
              )}

              {selectedPayment && selectedPayment.fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Payment Fee:</span>
                  <span>{formatCurrency(paymentFee)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>Tax (10%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
              
              <Button 
                onClick={createOrder} 
                disabled={!canProceedToStep(5)}
                className="w-full"
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>

            {/* Order Status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Order Status:</div>
              <div className="space-y-1 text-xs">
                <div className={orderItems.length > 0 ? "text-green-600" : "text-gray-400"}>
                  ✓ Products added
                </div>
                <div className={selectedCustomer ? "text-green-600" : "text-gray-400"}>
                  ✓ Customer selected
                </div>
                <div className={selectedAddress ? "text-green-600" : "text-gray-400"}>
                  ✓ Address confirmed
                </div>
                <div className={selectedShipping ? "text-green-600" : "text-gray-400"}>
                  ✓ Shipping method
                </div>
                <div className={selectedPayment ? "text-green-600" : "text-gray-400"}>
                  ✓ Payment method
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
