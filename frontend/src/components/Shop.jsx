
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import QRCode from "qrcode";
import "./Shop.css";

const API = "http://localhost:5000/api/shop";
const CART_KEY = "skin_shop_cart";
const WISHLIST_KEY = "skin_shop_wishlist";
const PENDING_BUY_KEY = "skin_shop_pending_buy";

const DEFAULT_UPI_ID = "kartikghuge2004@oksbi";
const DEFAULT_PAYEE = "AI Skincare Store";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80";

const FALLBACK_CATALOGUE = [
  { name: "CeraVe Acne Foaming Cream Cleanser", category: "acne", price: 699 },
  { name: "Paula's Choice 2% BHA Liquid Exfoliant", category: "acne", price: 1250 },
  { name: "Neutrogena Hydro Boost Oil-Free Water Gel", category: "acne", price: 650 },
  { name: "La Roche-Posay Effaclar Clarifying Cleansing Gel", category: "acne", price: 1450 },
  { name: "The Ordinary Niacinamide 10% + Zinc 1%", category: "acne", price: 650 },
  { name: "Cetaphil Gentle Clear Oil-Free Acne Moisturizer", category: "acne", price: 799 },
  { name: "COSRX Good Morning Low pH Gel Cleanser", category: "acne", price: 750 },
  { name: "PanOxyl Acne Foaming Wash 10% Benzoyl Peroxide", category: "acne", price: 999 },
  { name: "Sebamed Clear Face Care Gel", category: "acne", price: 599 },

  { name: "CeraVe Foaming Facial Cleanser", category: "combination", price: 799 },
  { name: "Paula's Choice Skin Perfecting 2% BHA", category: "combination", price: 1350 },
  { name: "Neutrogena Hydro Boost Water Gel", category: "combination", price: 650 },
  { name: "La Roche-Posay Toleriane Purifying Cleanser", category: "combination", price: 1399 },
  { name: "The Ordinary Hyaluronic Acid 2% + B5", category: "combination", price: 750 },
  { name: "Cetaphil Daily Hydrating Lotion", category: "combination", price: 699 },
  { name: "COSRX Low pH Good Morning Gel Cleanser", category: "combination", price: 750 },
  { name: "The Ordinary Niacinamide Serum", category: "combination", price: 650 },
  { name: "Clinique Dramatically Different Hydrating Jelly", category: "combination", price: 1200 },

  { name: "CeraVe Hydrating Facial Cleanser", category: "dry", price: 799 },
  { name: "The Ordinary Hyaluronic Acid Serum", category: "dry", price: 750 },
  { name: "Neutrogena Hydro Boost Gel Cream", category: "dry", price: 699 },
  { name: "La Roche-Posay Toleriane Hydrating Gentle Cleanser", category: "dry", price: 1399 },
  { name: "The Ordinary 100% Plant-Derived Squalane", category: "dry", price: 850 },
  { name: "Cetaphil Moisturizing Cream", category: "dry", price: 599 },
  { name: "Hada Labo Gokujyun Hyaluronic Lotion", category: "dry", price: 999 },
  { name: "First Aid Beauty Ultra Repair Cream", category: "dry", price: 1499 },
  { name: "Vanicream Moisturizing Cream", category: "dry", price: 899 },

  { name: "Cetaphil Gentle Skin Cleanser", category: "normal", price: 499 },
  { name: "Clinique Liquid Facial Soap", category: "normal", price: 1100 },
  { name: "Belif The True Cream Aqua Bomb", category: "normal", price: 1599 },
  { name: "The Ordinary Hyaluronic Acid 2% + B5", category: "normal", price: 750 },
  { name: "Olay Regenerist Micro-Sculpting Serum", category: "normal", price: 1299 },
  { name: "Neutrogena Hydro Boost Water Gel", category: "normal", price: 650 },
  { name: "Fresh Soy Face Cleanser", category: "normal", price: 1499 },
  { name: "Kiehl's Ultra Facial Cream", category: "normal", price: 1450 },
  { name: "La Roche-Posay Anthelios Sunscreen", category: "normal", price: 1199 },

  { name: "CeraVe Foaming Facial Cleanser", category: "oily", price: 799 },
  { name: "The Ordinary Niacinamide 10% + Zinc 1%", category: "oily", price: 650 },
  { name: "COSRX BHA Blackhead Power Liquid", category: "oily", price: 999 },
  { name: "La Roche-Posay Effaclar Purifying Foaming Gel", category: "oily", price: 1450 },
  { name: "Paula's Choice 2% BHA Liquid Exfoliant", category: "oily", price: 1250 },
  { name: "Neutrogena Oil-Free Acne Wash", category: "oily", price: 499 },
  { name: "Bioderma Sébium Gel Moussant", category: "oily", price: 899 },
  { name: "Sebamed Clear Face Care Gel", category: "oily", price: 599 },
  { name: "Skin1004 Madagascar Centella Ampoule", category: "oily", price: 999 },

  { name: "Cetaphil Gentle Skin Cleanser", category: "sensitive", price: 499 },
  { name: "La Roche-Posay Toleriane Hydrating Cleanser", category: "sensitive", price: 1399 },
  { name: "Aveeno Calm + Restore Oat Gel Moisturizer", category: "sensitive", price: 999 },
  { name: "Vanicream Gentle Facial Cleanser", category: "sensitive", price: 899 },
  { name: "Bioderma Sensibio H2O Micellar Water", category: "sensitive", price: 599 },
  { name: "Purito Centella Unscented Serum", category: "sensitive", price: 999 },
  { name: "Skin1004 Madagascar Centella Ampoule", category: "sensitive", price: 999 },
  { name: "First Aid Beauty Ultra Repair Cream", category: "sensitive", price: 1499 },
  { name: "Avene Thermal Spring Water", category: "sensitive", price: 799 },
].map((product, index) => ({
  ...product,
  id: `fallback-${product.category}-${index + 1}`,
  description: `Skincare product for ${product.category} skin. Check the official product label and ingredient list before use.`,
  rating: 4.5,
}));

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getProductId(product) {
  return String(product?.id || product?._id || "").trim();
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getProductImageUrl(product) {
  const suppliedImage =
    product?.image ||
    product?.imageUrl ||
    product?.imageURL ||
    product?.image_front_url ||
    product?.image_front_small_url;

  if (
    typeof suppliedImage === "string" &&
    /^https?:\/\//i.test(suppliedImage)
  ) {
    return suppliedImage;
  }

  const name = String(product?.name || "").trim();

  if (!name) return FALLBACK_IMAGE;

  return `https://tse1.mm.bing.net/th?q=${encodeURIComponent(
    `${name} official skincare product packaging`
  )}&w=500&h=500&c=7&rs=1&p=0`;
}

function ProductImage({ product, className = "", alt }) {
  const [src, setSrc] = useState(() => getProductImageUrl(product));
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    setSrc(getProductImageUrl(product));
    setUsedFallback(false);
  }, [product]);

  function handleImageError() {
    if (!usedFallback && src !== FALLBACK_IMAGE) {
      setUsedFallback(true);
      setSrc(FALLBACK_IMAGE);
    }
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt || product?.name || "Skincare product"}
      loading="lazy"
      onError={handleImageError}
    />
  );
}

export default function Shop({
  token,
  initialView = "shop",
  initialProductId = null,
  onOpenAuth = () => {},
}) {
  const [products, setProducts] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState(() => {
    const stored = readStorage(CART_KEY, []);
    return Array.isArray(stored) ? stored : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const stored = readStorage(WISHLIST_KEY, []);
    return Array.isArray(stored) ? stored : [];
  });

  const [activeTab, setActiveTab] = useState(initialView);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [utr, setUtr] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const authToken =
    token || localStorage.getItem("glow_token") || "";

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    }),
    [authToken]
  );

  const storeUpiId = paymentDetails?.upiId || DEFAULT_UPI_ID;

  const storePayee =
    paymentDetails?.payeeName ||
    paymentDetails?.payee ||
    paymentDetails?.upiName ||
    DEFAULT_PAYEE;

  function openProductDetails(product) {
    setSelectedProduct(product);
  }

  function closeProductDetails() {
    setSelectedProduct(null);
  }

  // Persist cart and notify the navbar/cart counter.
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("skin-cart-updated"));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (initialView) {
      setActiveTab(initialView);
    }
  }, [initialView]);

  // Load the backend catalogue and payment details.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      let backendProducts = [];
      let paymentData = null;

      try {
        const [productsResponse, paymentResponse] =
          await Promise.all([
            fetch(`${API}/products`),
            fetch(`${API}/payment-details`),
          ]);

        const productsData = await productsResponse
          .json()
          .catch(() => ({}));

        paymentData = await paymentResponse
          .json()
          .catch(() => ({}));

        if (
          productsResponse.ok &&
          productsData.success &&
          Array.isArray(productsData.products)
        ) {
          backendProducts = productsData.products.filter(
            (product) =>
              getProductId(product) &&
              String(product.name || "").trim()
          );
        }

        if (!paymentResponse.ok || !paymentData.success) {
          paymentData = null;
        }
      } catch (err) {
        console.error("Could not load shop data:", err);
      }

      if (cancelled) return;

      // Backend products are orderable.
      // Fallback products are only a display catalogue.
      if (backendProducts.length > 0) {
        setProducts(
          backendProducts.map((product) => ({
            ...product,
            id: getProductId(product),
            price: Number(product.price) || 0,
            isDisplayOnly: false,
          }))
        );
      } else {
        setProducts(
          FALLBACK_CATALOGUE.map((product) => ({
            ...product,
            isDisplayOnly: true,
          }))
        );

        setError(
          "The backend product catalogue is unavailable. Sample products are shown for display only and cannot be ordered."
        );
      }

      setPaymentDetails(
        paymentData
          ? {
              ...paymentData,
              upiId: paymentData.upiId || DEFAULT_UPI_ID,
              payeeName:
                paymentData.payeeName ||
                paymentData.payee ||
                DEFAULT_PAYEE,
            }
          : {
              upiId: DEFAULT_UPI_ID,
              payeeName: DEFAULT_PAYEE,
            }
      );

      setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          getProductId(product),
          product,
        ])
      ),
    [products]
  );

  const cartItems = cart
    .map((item) => {
      const product = productMap.get(String(item.productId));

      if (!product || product.isDisplayOnly) {
        return null;
      }

      return {
        ...product,
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    })
    .filter(Boolean);

  const wishlistProducts = products.filter((product) =>
    wishlist.includes(getProductId(product))
  );

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * item.quantity,
    0
  );

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category)
      .filter(Boolean);

    return ["all", ...new Set(values)];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.name || "").toLowerCase().includes(query) ||
        String(product.description || "")
          .toLowerCase()
          .includes(query) ||
        String(product.category || "").toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  // Adds only genuine backend catalogue products.
  const addToCart = useCallback(
    (productId) => {
      const id = String(productId || "").trim();

      const product = products.find(
        (item) => getProductId(item) === id
      );

      if (!id || !product) {
        setError("Please select a valid product from the shop.");
        setMessage("");
        return false;
      }

      if (product.isDisplayOnly || id.startsWith("fallback-")) {
        setError(
          "This sample product cannot be ordered yet. Please select a product from the backend catalogue."
        );
        setMessage("");
        return false;
      }

      if (
        Number(product.stock) === 0 ||
        product.inStock === false
      ) {
        setError("This product is currently out of stock.");
        setMessage("");
        return false;
      }

      setCart((previous) => {
        const existing = previous.find(
          (item) => String(item.productId) === id
        );

        if (existing) {
          return previous.map((item) =>
            String(item.productId) === id
              ? {
                  ...item,
                  quantity: Math.min(
                    (Number(item.quantity) || 1) + 1,
                    20
                  ),
                }
              : item
          );
        }

        return [...previous, { productId: id, quantity: 1 }];
      });

      setError("");
      setMessage(`${product.name} added to your cart.`);

      return true;
    },
    [products]
  );

  function buyNow(productId) {
    const added = addToCart(productId);

    // Do not navigate if the product could not be added.
    if (!added) return;

    setOrder(null);
    setActiveTab("checkout");
    setSelectedProduct(null);
  }

  function updateQuantity(productId, quantity) {
    const id = String(productId);
    const next = Number(quantity);

    setCart((previous) => {
      if (next < 1) {
        return previous.filter(
          (item) => String(item.productId) !== id
        );
      }

      return previous.map((item) =>
        String(item.productId) === id
          ? {
              ...item,
              quantity: Math.min(next, 20),
            }
          : item
      );
    });
  }

  function toggleWishlist(productId) {
    const id = String(productId || "").trim();

    if (!id) return;

    const alreadyWished = wishlist.includes(id);

    setWishlist((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );

    setError("");
    setMessage(
      alreadyWished
        ? "Removed from your wishlist."
        : "Added to your wishlist."
    );
  }

  function updateCustomer(event) {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Handles Shop, Cart, and Buy Now events from other components.
  useEffect(() => {
    function handleShopAction(shopEvent) {
      const detail = shopEvent.detail || {};

      if (detail.type === "shop") {
        setActiveTab("shop");
        setError("");
        setMessage("");
        return;
      }

      if (detail.type === "cart") {
        setActiveTab("cart");
        setError("");
        setMessage("");
        return;
      }

      if (detail.type !== "buy") return;

      const requestedProductId = String(
        detail.productId || ""
      ).trim();

      const requestedName = String(
        detail.productName || ""
      ).trim();

      if (!requestedProductId && !requestedName) {
        setError("No product was selected. Please try again.");
        return;
      }

      setError("");
      setMessage("");

      // Save the request if the product catalogue is still loading.
      if (loading || products.length === 0) {
        try {
          localStorage.setItem(
            PENDING_BUY_KEY,
            JSON.stringify({
              type: "buy",
              productId: requestedProductId,
              productName: requestedName,
            })
          );

          setActiveTab("shop");
          setMessage("Loading product catalogue...");
        } catch {
          setError("Could not save the product request.");
        }

        return;
      }

      // Prefer the supplied backend product ID.
      // Otherwise, try an exact normalized product-name match.
      const product = products.find((item) => {
        const id = getProductId(item);

        if (requestedProductId && id === requestedProductId) {
          return true;
        }

        return (
          requestedName &&
          normalizeName(item.name) === normalizeName(requestedName)
        );
      });

      if (!product) {
        setActiveTab("shop");
        setError(
          `"${requestedName || requestedProductId}" was not found in the shop catalogue. Add the matching product to the backend catalogue or link the recommendation to an existing product.`
        );

        console.error("Shop recommendation lookup failed:", {
          requestedProductId,
          requestedName,
          products: products.map((item) => ({
            id: getProductId(item),
            name: item.name,
          })),
        });

        return;
      }

      const productId = getProductId(product);
      const added = addToCart(productId);

      if (!added) {
        setActiveTab("shop");
        return;
      }

      setActiveTab("checkout");
      setOrder(null);
      setSelectedProduct(null);
      setMessage(
        `${product.name} added to your cart. Complete your delivery details.`
      );
    }

    window.addEventListener("skin-shop-action", handleShopAction);

    return () => {
      window.removeEventListener(
        "skin-shop-action",
        handleShopAction
      );
    };
  }, [products, loading, addToCart]);

  // Handles a product explicitly passed to this component.
  useEffect(() => {
    if (!initialProductId || products.length === 0) return;

    const product = products.find(
      (item) =>
        getProductId(item) === String(initialProductId)
    );

    if (!product) return;

    const added = addToCart(getProductId(product));

    if (!added) return;

    setActiveTab("checkout");
    setOrder(null);
    setSelectedProduct(null);
  }, [initialProductId, products, addToCart]);

  // Restores a Buy Now request received while the catalogue was loading.
  useEffect(() => {
    if (loading || products.length === 0) return;

    let pending;

    try {
      const saved = localStorage.getItem(PENDING_BUY_KEY);

      if (!saved) return;

      pending = JSON.parse(saved);

      if (
        pending?.type !== "buy" ||
        (!pending.productId && !pending.productName)
      ) {
        localStorage.removeItem(PENDING_BUY_KEY);
        return;
      }

      // Remove it before processing so it cannot be replayed.
      localStorage.removeItem(PENDING_BUY_KEY);
    } catch {
      localStorage.removeItem(PENDING_BUY_KEY);
      setError("Could not restore the requested product.");
      return;
    }

    const product = products.find((item) => {
      const id = getProductId(item);

      if (pending.productId && id === pending.productId) {
        return true;
      }

      return (
        pending.productName &&
        normalizeName(item.name) ===
          normalizeName(pending.productName)
      );
    });

    if (!product) {
      setActiveTab("shop");
      setError(
        `"${pending.productName || pending.productId}" was not found in the shop catalogue.`
      );
      return;
    }

    const added = addToCart(getProductId(product));

    if (!added) {
      setActiveTab("shop");
      return;
    }

    setActiveTab("checkout");
    setOrder(null);
    setSelectedProduct(null);
    setMessage(
      `${product.name} added to your cart. Complete your delivery details.`
    );
  }, [loading, products, addToCart]);

  useEffect(() => {
    if (!selectedProduct) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeProductDetails();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedProduct]);

  async function loadOrders() {
    if (!authToken) {
      setError("Please log in to view your order history.");
      onOpenAuth("login");
      return;
    }

    try {
      const response = await fetch(`${API}/orders/mine`, {
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        onOpenAuth("login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not load order history."
        );
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err.message || "Could not load order history.");
    }
  }

  async function createOrder(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!authToken) {
      setError("Please log in before placing an order.");
      onOpenAuth("login");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      setActiveTab("cart");
      return;
    }

    if (
      !customer.name.trim() ||
      !customer.phone.trim() ||
      !customer.address.trim()
    ) {
      setError(
        "Enter your name, phone number, and delivery address."
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(customer.phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (paymentMethod === "UPI" && !storeUpiId) {
      setError(
        "UPI details are unavailable. Configure UPI_ID in the backend .env file."
      );
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            email: customer.email.trim(),
            address: customer.address.trim(),
          },
          paymentMethod,
          items: cartItems.map((item) => ({
            productId: getProductId(item),
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        onOpenAuth("login");
        return;
      }

      if (!response.ok || !data.success || !data.order) {
        throw new Error(
          data.message || "Could not create the order."
        );
      }

      setOrder(data.order);
      setUtr("");
      setQrImage("");
      setCart([]);
      setActiveTab("checkout");

      setMessage(
        `Order ${data.order.orderNumber || ""} saved successfully.`
      );

      if (paymentMethod === "UPI" && data.payment?.upiUri) {
        const qr = await QRCode.toDataURL(data.payment.upiUri, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: "M",
        });

        setQrImage(qr);
      } else if (paymentMethod === "UPI") {
        const params = new URLSearchParams({
          pa: storeUpiId,
          pn: storePayee,
          am: String(data.order.totalAmount || cartTotal),
          cu: "INR",
          tn: `Order ${
            data.order.orderNumber ||
            data.order.id ||
            data.order._id ||
            ""
          }`,
        });

        const qr = await QRCode.toDataURL(
          `upi://pay?${params.toString()}`,
          {
            width: 280,
            margin: 2,
            errorCorrectionLevel: "M",
          }
        );

        setQrImage(qr);
      }

      await loadOrders();
    } catch (err) {
      setError(err.message || "Order creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitUtr(event) {
    event.preventDefault();

    const orderId = order?.id || order?._id;

    if (!orderId || !utr.trim()) {
      setError("Enter the UPI transaction reference.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/orders/${encodeURIComponent(orderId)}/submit-utr`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            utr: utr.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        onOpenAuth("login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not submit UTR."
        );
      }

      setOrder((previous) => ({
        ...previous,
        ...(data.order || {}),
        paymentStatus:
          data.order?.paymentStatus || "verification_pending",
      }));

      setMessage(
        "Transaction reference submitted. Payment is awaiting verification."
      );

      await loadOrders();
    } catch (err) {
      setError(err.message || "Could not submit UTR.");
    } finally {
      setBusy(false);
    }
  }

  function openOrders() {
    setActiveTab("orders");
    setError("");
    loadOrders();
  }

  const selectedProductId = getProductId(selectedProduct);

  const selectedProductUnavailable =
    selectedProduct?.stock === 0 ||
    selectedProduct?.inStock === false;

  return (
    <section className="skin-shop" id="shop">
      <nav className="shop-tabs" aria-label="Shop navigation">
        <button
          type="button"
          className={activeTab === "shop" ? "active" : ""}
          onClick={() => setActiveTab("shop")}
        >
          Shop Products
        </button>

        <button
          type="button"
          className={activeTab === "wishlist" ? "active" : ""}
          onClick={() => setActiveTab("wishlist")}
        >
          ♡ Wishlist ({wishlist.length})
        </button>

        <button
          type="button"
          className={activeTab === "cart" ? "active" : ""}
          onClick={() => setActiveTab("cart")}
        >
          🛒 Cart ({totalItems})
        </button>

        <button
          type="button"
          className={activeTab === "orders" ? "active" : ""}
          onClick={openOrders}
        >
          📦 My Orders
        </button>
      </nav>

      {error && (
        <div className="shop-alert error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="shop-alert success" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <div className="shop-loading">
          Loading skincare products...
        </div>
      ) : (
        <>
          {(activeTab === "shop" || activeTab === "wishlist") && (
            <>
              {activeTab === "shop" && (
                <div className="shop-filters">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search skincare products..."
                    aria-label="Search skincare products"
                  />

                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    aria-label="Filter by category"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item === "all"
                          ? "All categories"
                          : item}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(() => {
                const list =
                  activeTab === "shop"
                    ? visibleProducts
                    : wishlistProducts;

                if (list.length === 0) {
                  return (
                    <div className="shop-empty">
                      {activeTab === "wishlist"
                        ? "Your wishlist is empty."
                        : "No products found. Check your search or add products to the backend catalogue."}
                    </div>
                  );
                }

                return (
                  <div className="shop-product-grid">
                    {list.map((product, index) => {
                      const id = getProductId(product);
                      const wished = wishlist.includes(id);

                      return (
                        <article
                          className="shop-product-card"
                          key={id || `${product.name}-${index}`}
                          onClick={() =>
                            openProductDetails(product)
                          }
                          onKeyDown={(event) => {
                            if (
                              event.target === event.currentTarget &&
                              (event.key === "Enter" ||
                                event.key === " ")
                            ) {
                              event.preventDefault();
                              openProductDetails(product);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`View details for ${product.name}`}
                        >
                          <div
                            className={`shop-product-art art-${index % 6}`}
                          >
                            <ProductImage
                              product={product}
                              className="shop-product-image"
                            />

                            <span className="product-category">
                              {product.category || "Skincare"}
                            </span>

                            <button
                              type="button"
                              className="wishlist-heart"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleWishlist(id);
                              }}
                              aria-label={
                                wished
                                  ? "Remove from wishlist"
                                  : "Add to wishlist"
                              }
                            >
                              {wished ? "♥" : "♡"}
                            </button>
                          </div>

                          <div className="shop-product-info">
                            <h3>{product.name}</h3>

                            {product.description && (
                              <p>{product.description}</p>
                            )}

                            {product.rating && (
                              <span className="shop-product-rating">
                                ⭐ {product.rating}
                              </span>
                            )}

                            <div className="shop-price-block">
                              <strong>{money(product.price)}</strong>
                            </div>

                            {product.isDisplayOnly && (
                              <small>
                                Display sample — ordering unavailable
                              </small>
                            )}

                            <div className="product-buy-row">
                              <button
                                type="button"
                                className="shop-add-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  addToCart(id);
                                }}
                                disabled={!id}
                              >
                                Add to Cart
                              </button>

                              <button
                                type="button"
                                className="shop-checkout-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  buyNow(id);
                                }}
                                disabled={!id}
                              >
                                Buy Now
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}

          {activeTab === "cart" && (
            <div className="shop-cart-layout">
              <div className="shop-cart-items">
                {cartItems.length === 0 ? (
                  <p className="shop-empty">
                    Your cart is empty.
                  </p>
                ) : (
                  cartItems.map((item) => {
                    const id = getProductId(item);

                    return (
                      <article
                        className="shop-cart-item"
                        key={id}
                      >
                        <ProductImage
                          product={item}
                          className="shop-cart-product-image"
                        />

                        <div className="cart-item-description">
                          <h3>{item.name}</h3>
                          <p>{money(item.price)} each</p>

                          <div className="shop-quantity-controls">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  id,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              disabled={item.quantity >= 20}
                              onClick={() =>
                                updateQuantity(
                                  id,
                                  item.quantity + 1
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(id, 0)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <strong>
                          {money(item.price * item.quantity)}
                        </strong>
                      </article>
                    );
                  })
                )}
              </div>

              <aside className="shop-summary">
                <h3>Order Summary</h3>
                <p>Items: {totalItems}</p>
                <p>
                  Total: <strong>{money(cartTotal)}</strong>
                </p>

                <button
                  type="button"
                  className="shop-checkout-button"
                  disabled={cartItems.length === 0}
                  onClick={() => {
                    setError("");
                    setOrder(null);
                    setActiveTab("checkout");
                  }}
                >
                  Proceed to Checkout
                </button>
              </aside>
            </div>
          )}

          {activeTab === "checkout" &&
            (order ? (
              <div className="shop-payment-panel">
                <h3>Order Created Successfully</h3>

                <p>
                  Order number:{" "}
                  <strong>
                    {order.orderNumber || order.id || order._id}
                  </strong>
                </p>

                <h3>{money(order.totalAmount)}</h3>

                <p>
                  Payment status:{" "}
                  <strong>
                    {order.paymentStatus || "pending"}
                  </strong>
                </p>

                {order.paymentMethod === "UPI" && (
                  <>
                    {qrImage && (
                      <div className="shop-qr-wrapper">
                        <img
                          src={qrImage}
                          alt="UPI payment QR code"
                          className="upi-qr-image"
                        />
                      </div>
                    )}

                    <p>
                      UPI ID: <strong>{storeUpiId}</strong>
                    </p>

                    <p>
                      Payee: <strong>{storePayee}</strong>
                    </p>

                    <p>
                      Scan the QR code using your UPI app. Enter the
                      transaction reference only after completing
                      payment.
                    </p>

                    <form
                      onSubmit={submitUtr}
                      className="utr-form"
                    >
                      <label htmlFor="shop-utr">
                        UPI transaction reference (UTR)
                      </label>

                      <input
                        id="shop-utr"
                        value={utr}
                        onChange={(event) =>
                          setUtr(event.target.value)
                        }
                        minLength={6}
                        maxLength={40}
                        required
                        placeholder="Enter your UTR"
                      />

                      <button type="submit" disabled={busy}>
                        {busy
                          ? "Submitting..."
                          : "Submit for Verification"}
                      </button>
                    </form>

                    <small>
                      Submitting a UTR does not itself confirm
                      payment. The administrator must verify the
                      transaction.
                    </small>
                  </>
                )}

                {order.paymentMethod === "COD" && (
                  <p>
                    Cash on Delivery selected. Payment is due when
                    the order is delivered.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOrder(null);
                    setActiveTab("shop");
                    setError("");
                    setMessage("");
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <form
                className="shop-customer-form"
                onSubmit={createOrder}
              >
                <h3>Delivery Details</h3>

                <label htmlFor="shop-name">Full name *</label>
                <input
                  id="shop-name"
                  name="name"
                  value={customer.name}
                  onChange={updateCustomer}
                  autoComplete="name"
                  required
                />

                <label htmlFor="shop-phone">
                  Mobile number *
                </label>
                <input
                  id="shop-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={customer.phone}
                  onChange={updateCustomer}
                  autoComplete="tel"
                  required
                />

                <label htmlFor="shop-email">Email</label>
                <input
                  id="shop-email"
                  name="email"
                  type="email"
                  value={customer.email}
                  onChange={updateCustomer}
                  autoComplete="email"
                />

                <label htmlFor="shop-address">
                  Delivery address *
                </label>
                <textarea
                  id="shop-address"
                  name="address"
                  value={customer.address}
                  onChange={updateCustomer}
                  rows={4}
                  autoComplete="street-address"
                  required
                />

                <h3>Payment Method</h3>

                <label className="shop-payment-choice">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "UPI"}
                    onChange={() => setPaymentMethod("UPI")}
                  />
                  UPI QR Payment
                </label>

                <label className="shop-payment-choice">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  Cash on Delivery
                </label>

                <div className="shop-checkout-total">
                  <span>Items: {totalItems}</span>
                  <strong>Total: {money(cartTotal)}</strong>
                </div>

                <button
                  className="shop-checkout-button"
                  disabled={busy || cartItems.length === 0}
                  type="submit"
                >
                  {busy ? "Saving Order..." : "Place Order"}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("cart")}
                >
                  Back to Cart
                </button>
              </form>
            ))}

          {activeTab === "orders" && (
            <div className="shop-order-history">
              <h3>My Orders</h3>

              {!authToken && (
                <p>Please log in to see your orders.</p>
              )}

              {authToken && orders.length === 0 && (
                <p>No orders found.</p>
              )}

              {orders.map((item) => (
                <article
                  key={item._id || item.id || item.orderNumber}
                  className="shop-cart-item"
                >
                  <div>
                    <h4>
                      {item.orderNumber || item._id || item.id}
                    </h4>

                    <p>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString("en-IN")
                        : ""}
                    </p>

                    {item.items?.map((product, index) => (
                      <p
                        key={`${
                          product.productId || product.name
                        }-${index}`}
                      >
                        {product.name} × {product.quantity}
                      </p>
                    ))}

                    <p>
                      Payment: {item.paymentStatus || "pending"}
                    </p>

                    <p>
                      Delivery: {item.orderStatus || "processing"}
                    </p>
                  </div>

                  <strong>{money(item.totalAmount)}</strong>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Product details popup */}
      {selectedProduct && (
        <div
          className="product-detail-overlay"
          onClick={closeProductDetails}
        >
          <div
            className="product-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="product-detail-close"
              onClick={closeProductDetails}
              aria-label="Close product details"
            >
              &times;
            </button>

            <div className="product-detail-layout">
              <div className="product-detail-image-wrap">
                <ProductImage
                  product={selectedProduct}
                  className="product-detail-image"
                  alt={selectedProduct.name}
                />

                <span className="product-detail-category">
                  {selectedProduct.category || "Skincare"}
                </span>
              </div>

              <div className="product-detail-content">
                <span className="product-detail-eyebrow">
                  AI SKINCARE PRODUCT COLLECTION
                </span>

                <h2 id="product-detail-title">
                  {selectedProduct.name}
                </h2>

                {selectedProduct.rating && (
                  <div className="product-detail-rating">
                    ⭐ {selectedProduct.rating} / 5
                  </div>
                )}

                <div className="product-detail-price">
                  {money(selectedProduct.price)}
                </div>

                <div className="product-detail-divider" />

                <h3>Product Description</h3>

                <p className="product-detail-description">
                  {selectedProduct.description ||
                    `Explore ${selectedProduct.name}, a skincare product listed in our ${
                      selectedProduct.category || "skincare"
                    } collection. Check the packaging for the complete ingredients, directions, and suitability information before use.`}
                </p>

                <div className="product-detail-information">
                  <div>
                    <span>Category</span>
                    <strong>
                      {selectedProduct.category || "Skincare"}
                    </strong>
                  </div>

                  <div>
                    <span>Availability</span>
                    <strong className="product-detail-stock">
                      {selectedProductUnavailable
                        ? "Out of stock"
                        : selectedProduct.isDisplayOnly
                          ? "Display only"
                          : "Available"}
                    </strong>
                  </div>
                </div>

                <p className="product-detail-note">
                  Check the official ingredient list and perform a
                  patch test before trying a new skincare product.
                </p>

                <div className="product-detail-actions">
                  <button
                    type="button"
                    className="shop-add-button"
                    disabled={
                      !selectedProductId ||
                      selectedProductUnavailable
                    }
                    onClick={() => {
                      addToCart(selectedProductId);
                      closeProductDetails();
                    }}
                  >
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    className="shop-checkout-button"
                    disabled={
                      !selectedProductId ||
                      selectedProductUnavailable
                    }
                    onClick={() => buyNow(selectedProductId)}
                  >
                    Buy Now
                  </button>

                  <button
                    type="button"
                    className="product-detail-wishlist"
                    onClick={() =>
                      toggleWishlist(selectedProductId)
                    }
                  >
                    {wishlist.includes(selectedProductId)
                      ? "♥ Wishlisted"
                      : "♡ Add to Wishlist"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
