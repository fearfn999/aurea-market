import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Snow } from "@/components/Snow";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import About from "@/pages/About";
import Support from "@/pages/Support";
import SellerAuth from "@/pages/SellerAuth";
import SellerDashboard from "@/pages/SellerDashboard";
import Orders from "@/pages/Orders";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
};

const SellerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user || (user.role !== "seller" && user.role !== "admin")) return <Navigate to="/seller" replace />;
  return children;
};

const StoreLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <Routes>
      <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
      <Route path="/products" element={<StoreLayout><Products /></StoreLayout>} />
      <Route path="/about" element={<StoreLayout><About /></StoreLayout>} />
      <Route path="/support" element={<StoreLayout><Support /></StoreLayout>} />
      <Route path="/seller" element={<StoreLayout><SellerAuth /></StoreLayout>} />
      <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
      <Route path="/product/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />
      <Route path="/cart" element={<StoreLayout><Cart /></StoreLayout>} />
      <Route path="/orders" element={<StoreLayout><Orders /></StoreLayout>} />
      <Route path="/checkout" element={<StoreLayout><Checkout /></StoreLayout>} />
      <Route path="/checkout/success" element={<StoreLayout><CheckoutSuccess /></StoreLayout>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App grain">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <SmoothScroll>
              <AppRoutes />
            </SmoothScroll>
            <Snow />
            <Toaster position="bottom-right" theme="dark" richColors />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
