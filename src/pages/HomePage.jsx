import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import * as Switch from "@radix-ui/react-switch";
import { sourcingApi } from "../api/sourcingApi";
import "../styles/Home.css";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'warning'|'info', message: string }
  const [selectedStep, setSelectedStep] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [searchResult, setSearchResult] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // { message, onConfirm, onCancel }
  const { logout, user, token } = useAuth();
  const nav = useNavigate();

  const heroImages = [
    "https://mecaluxco.cdnwm.com/img/blog/logistica-internacional.1.14.jpg",
    "https://www.prosegur.es/dam/jcr:8fe16839-839d-463a-90a6-32ab4bbc8158/tipos%20transporte%20mercancias.jpg",
    "https://thumbs.dreamstime.com/b/imagen-relacionada-con-la-log%C3%ADstica-y-el-transporte-de-mercanc%C3%ADas-camiones-fondo-dise%C3%B1o-abstracto-trav%C3%A9s-ruta-mapa-del-mundo-228273332.jpg",
  ];

  useEffect(() => {
    if (token) {
      sourcingApi.setToken(token);
      loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // -------------------- Cart functions --------------------
  const loadCart = async () => {
    if (!token) return;
    try {
      const data = await sourcingApi.getCartItems();
      setCartItems(data.items || []);
    } catch (err) {
      setStatus({ type: "error", message: "❌ Error cargando el carrito." });
    }
  };

  const addToCart = async (product) => {
    if (!token) {
      setStatus({
        type: "error",
        message: "❌ Debes iniciar sesión para agregar al carrito.",
      });
      return;
    }
    try {
      setLoading(true);
      sourcingApi.setToken(token);
      const productData = {
        url: product.url,
        title: product.title,
        title_zh: product.title_zh,
        priceCNY: product.priceCNY,
        priceUSD: product.priceUSD,
        currency: product.currency || "CNY",
        image: product.image,
      };
      await sourcingApi.addToCart(productData);
      setStatus({ type: "success", message: "✅ Producto agregado al carrito" });
      await loadCart();
    } catch (error) {
      setStatus({
        type: "error",
        message: `❌ Error al agregar: ${error.message || "Error desconocido"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    setShowConfirm({
      message: "¿Seguro que deseas eliminar este producto del carrito?",
      onConfirm: async () => {
        try {
          await sourcingApi.removeFromCart(cartItemId);
          await loadCart();
          setStatus({ type: "success", message: "🗑️ Producto eliminado" });
        } catch {
          setStatus({ type: "error", message: "❌ Error al eliminar producto" });
        } finally {
          setShowConfirm(null);
        }
      },
      onCancel: () => setShowConfirm(null),
    });
  };

  const checkout = async () => {
    if (cartItems.length === 0) {
      setStatus({ type: "warning", message: "🛒 El carrito está vacío" });
      return;
    }
    setShowConfirm({
      message: `¿Confirmar compra de ${cartItems.length} producto(s)?`,
      onConfirm: async () => {
        try {
          const result = await sourcingApi.checkout();
          setStatus({
            type: "success",
            message: `✅ ${result.message || "Compra completada"}`,
          });
          setCartItems([]);
          setShowCart(false);
          nav("/bodega");
        } catch (error) {
          setStatus({
            type: "error",
            message: `❌ Error en el checkout: ${error.message || "Error"}`,
          });
        } finally {
          setShowConfirm(null);
        }
      },
      onCancel: () => setShowConfirm(null),
    });
  };

  const clearCart = async () => {
    if (cartItems.length === 0) return;
    setShowConfirm({
      message: "¿Deseas vaciar todo el carrito?",
      onConfirm: async () => {
        try {
          await sourcingApi.clearCart();
          setCartItems([]);
          setStatus({ type: "success", message: "✅ Carrito vaciado" });
        } catch {
          setStatus({ type: "error", message: "❌ No se pudo vaciar el carrito." });
        } finally {
          setShowConfirm(null);
        }
      },
      onCancel: () => setShowConfirm(null),
    });
  };

  // -------------------- Search --------------------
  const buscar = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setStatus({ type: "warning", message: "⚠️ Ingresa un enlace válido." });
      return;
    }
    setLoading(true);
    setSearchResult(null);
    setStatus({ type: "info", message: "🔍 Buscando productos..." });

    try {
      const response = await sourcingApi.createPurchaseRequest([url]);
      const { requestId } = response;
      const results = await waitForResults(requestId);

      if (results.items && results.items.length > 0) {
        setSearchResult(results);
        setStatus({
          type: "success",
          message: `🎉 ${results.items.length} producto(s) encontrados.`,
        });
      } else {
        setStatus({
          type: "warning",
          message: "⚠️ No se encontraron productos para esta URL.",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: `❌ Error al buscar: ${error.message || "Error desconocido"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const waitForResults = async (requestId, maxAttempts = 20) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusResponse = await sourcingApi.getPurchaseRequestStatus(requestId);
      if (statusResponse.status === "COMPLETED") {
        return await sourcingApi.getPurchaseRequestResults(requestId);
      } else if (statusResponse.status === "FAILED") {
        throw new Error("La búsqueda falló en el servidor.");
      }
    }
    throw new Error("Tiempo de espera agotado.");
  };

  // -------------------- Small helpers --------------------
  const onLogout = async () => {
    try {
      await logout?.();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      nav("/login");
    }
  };

  const toggleTheme = () => setDarkMode(!darkMode);
  const goToBodega = () => nav("/bodega");
  const goToReportes = () => nav("/reportes");

  // -------------------- Data --------------------
  const stepsData = [
    {
      step: "1",
      title: "Pega el enlace",
      desc: "Copia el URL del producto de 1688 y pégalo aquí.",
      img: "https://www.shutterstock.com/image-photo/social-network-connection-internet-technology-600nw-2048123093.jpg",
      fullDesc:
        "Pega el enlace directamente desde 1688. Nuestro sistema extrae automáticamente la información relevante del producto.",
    },
    {
      step: "2",
      title: "Buscamos por ti",
      desc: "Analizamos y encontramos el producto en segundos.",
      img: "https://img.freepik.com/fotos-premium/motor-busqueda-informacion-busqueda-internet-linea-mano-haciendo-clic-barra-busqueda-encontrar-informacion_571507-66.jpg",
      fullDesc:
        "Usamos algoritmos avanzados para ubicar y verificar el producto con precisión.",
    },
    {
      step: "3",
      title: "Guarda y gestiona",
      desc: "Agrega el producto a tu bodega personal.",
      img: "https://okhosting.com/wp-content/uploads/Tendencias-de-Busqueda-en-Internet-1.webp",
      fullDesc:
        "En segundos, obtienes el resumen del producto y puedes almacenarlo en tu bodega.",
    },
  ];

  const faqData = [
    {
      question: "¿Cómo funciona la búsqueda?",
      answer:
        "Solo pega el enlace del producto en el campo de búsqueda y el sistema hará el resto.",
    },
    {
      question: "¿Puedo guardar mis búsquedas?",
      answer:
        "Sí, una vez encontrado el producto puedes guardarlo en tu bodega personal.",
    },
    {
      question: "¿Dónde puedo obtener ayuda?",
      answer:
        "Haz clic en el ícono ❓ junto al campo de búsqueda o revisa la sección de preguntas frecuentes.",
    },
  ];

  // -------------------- Motion variants (lento/llamativo ~0.9s) --------------------
  const longTransition = { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] };
  const statusVariant = {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0, transition: longTransition },
    exit: { opacity: 0, y: -30, transition: longTransition },
  };
  const confirmVariant = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.9 } },
    exit: { opacity: 0, transition: { duration: 0.6 } },
  };
  const tooltipVariant = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.65 } },
    exit: { opacity: 0, y: 6, transition: { duration: 0.45 } },
  };

  return (
    <div className={darkMode ? "dark-theme" : "light-theme"}>
      {/* STATUS MESSAGE (animated) */}
      <AnimatePresence>
        {status && (
          <motion.div
            className={`status-message ${status.type}`}
            variants={statusVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            role="status"
            aria-live="polite"
          >
            <span>{status.message}</span>
            <button
              aria-label="Cerrar mensaje"
              onClick={() => setStatus(null)}
              title="Cerrar"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <motion.header
        className="navbar"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...longTransition }}
      >
        <div className="brand">
          <span className="logo-dot" /> Impochina
        </div>
        <nav className="nav-actions">
          <div className="theme-toggle-container">
            <span className="theme-label" aria-hidden>
              {darkMode ? "🌙" : "☀️"}
            </span>
            <Switch.Root
              className="switch-root"
              checked={darkMode}
              onCheckedChange={toggleTheme}
            >
              <Switch.Thumb className="switch-thumb" />
            </Switch.Root>
          </div>

          <motion.button
            className="nav-link cart-button"
            onClick={() => setShowCart(!showCart)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            title="Ver carrito"
          >
            🛒 Carrito ({cartItems.length})
          </motion.button>

          <motion.button
            className="nav-link"
            onClick={goToReportes}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            title="Ver reportes"
          >
            📊 Reportes
          </motion.button>

          <motion.button
            className="nav-link"
            onClick={goToBodega}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            title="Ver bodega"
          >
            📦 Bodega
          </motion.button>

          {user && <span className="user-welcome">Hola, {user.username}</span>}
          <motion.button
            className="btn-outline"
            onClick={onLogout}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Cerrar sesión
          </motion.button>
        </nav>
      </motion.header>

      {/* HERO / SEARCH */}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...longTransition, delay: 0.15 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...longTransition, delay: 0.2 }}
            >
              Encuentra tus productos de 1688 fácilmente
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...longTransition, delay: 0.35 }}
            >
              Pega el enlace del producto y nosotros lo buscamos por ti.
            </motion.p>

            <motion.form
              onSubmit={buscar}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...longTransition, delay: 0.45 }}
            >
              <div className="search-box">
                <div className="tooltip-container" style={{ position: "relative" }}>
                  <input
                    type="url"
                    placeholder="Pega aquí el enlace del producto"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    aria-label="URL del producto"
                    required
                  />
                  {/* Tooltip animated */}
                  <AnimatePresence>
                    <motion.span
                      className="tooltip"
                      variants={tooltipVariant}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      aria-hidden="true"
                    >
                      Ejemplo: https://detail.1688.com/...
                    </motion.span>
                  </AnimatePresence>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? "Buscando..." : "Buscar Producto"}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>

          {/* HERO IMAGE CAROUSEL (preserve original anims) */}
          <motion.div
            className="hero-image"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...longTransition, delay: 0.25 }}
          >
            <div className="carousel">
              <button className="carousel-btn left" onClick={() => setActiveImageIndex((i) => (i - 1 + heroImages.length) % heroImages.length)}>
                ‹
              </button>

              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  src={heroImages[activeImageIndex]}
                  alt="Productos 1688"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ ...longTransition }}
                />
              </AnimatePresence>

              <button className="carousel-btn right" onClick={() => setActiveImageIndex((i) => (i + 1) % heroImages.length)}>
                ›
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEARCH RESULTS - keep original appearance logic and animations */}
      <section aria-live="polite" className="results-section">
        <AnimatePresence>
          {searchResult && searchResult.items && searchResult.items.length > 0 && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ ...longTransition }}
            >
              <h3>🎉 ¡Productos Encontrados!</h3>
              <p>Se encontraron {searchResult.items.length} producto(s)</p>

              <div className="results-grid">
                {searchResult.items.map((item, index) => (
                  <motion.div
                    key={index}
                    className="product-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...longTransition, delay: index * 0.08 }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Imagen+No+Disponible";
                        }}
                      />
                    )}
                    <div className="product-info">
                      <h4>{item.title}</h4>
                      {item.title_zh && <p className="product-title-zh">{item.title_zh}</p>}
                      <div className="product-prices">
                        {item.priceCNY && <p className="price-cny">💰 {item.priceCNY} CNY</p>}
                        {item.priceUSD && <p className="price-usd">💵 {item.priceUSD} USD</p>}
                      </div>
                      <div className="product-actions">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-product-link">
                          🔗 Ver en sitio original
                        </a>
                        <button className="btn-add-to-cart" onClick={() => addToCart(item)}>
                          🛒 Agregar al carrito
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* CART PANEL (animated) */}
      <AnimatePresence>
        {showCart && (
          <motion.aside
            className="cart-panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ ...longTransition }}
            aria-label="Panel del carrito"
          >
            <div className="cart-header">
              <h3>🛒 Mi Carrito</h3>
              <button className="close-cart" onClick={() => setShowCart(false)} aria-label="Cerrar carrito">
                ✕
              </button>
            </div>

            <div className="cart-content">
              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  <p>El carrito está vacío</p>
                  <small>Agrega productos desde los resultados</small>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cartItems.map((item) => (
                      <motion.div key={item.cartItemId} className="cart-item" layout transition={{ ...longTransition }}>
                        <img src={item.product.image} alt={item.product.title} onError={(e) => { e.target.style.display = 'none'; }} />
                        <div className="cart-item-info">
                          <strong>{item.product.title}</strong>
                          <div className="cart-item-prices">
                            {item.product.priceCNY && <span>{item.product.priceCNY} CNY</span>}
                            {item.product.priceUSD && <span>{item.product.priceUSD} USD</span>}
                          </div>
                        </div>
                        <button
                          className="remove-from-cart"
                          onClick={() => removeFromCart(item.cartItemId)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="cart-actions">
                    <button className="checkout-btn" onClick={checkout}>
                      Comprar ({cartItems.length})
                    </button>
                    <button className="clear-cart-btn" onClick={clearCart}>
                      Vaciar carrito
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* STEPS */}
      <section className="steps-section">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...longTransition }}>
          Cómo funciona 🚀
        </motion.h2>
        <div className="steps-grid">
          {stepsData.map((step, index) => (
            <motion.div
              key={index}
              className="step-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              viewport={{ once: true }}
              transition={{ ...longTransition, delay: index * 0.08 }}
              onClick={() => setSelectedStep(step)}
            >
              <div className="step-image">
                <img src={step.img} alt={step.title} />
              </div>
              <div className="step-info">
                <h3>{step.step}. {step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES & TESTIMONIALS (kept) */}
      <section className="features-section">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...longTransition }}>
          Nuestras Ventajas ✨
        </motion.h2>
        <div className="features-grid">
          {[
            { text: "Búsqueda rápida ⚡", desc: "Encuentra lo que necesitas en segundos." },
            { text: "Resultados confiables ✅", desc: "Solo mostramos datos verificados." },
            { text: "Todo en un solo lugar 🌎", desc: "Centraliza tus productos fácilmente." },
          ].map((feature, i) => (
            <motion.div key={i} className="feature-card" whileHover={{ scale: 1.03 }} transition={{ ...longTransition }}>
              <h3>{feature.text}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...longTransition }}>
          Lo que dicen nuestros usuarios 💬
        </motion.h2>
        <div className="testimonials-grid">
          {[
            {
              name: "Ana López",
              role: "Importadora",
              text: "Impochina me ha ahorrado horas de búsqueda. ¡Increíble!",
              img: "https://static.vecteezy.com/system/resources/previews/025/869/567/non_2x/profile-image-of-woman-avatar-for-social-networks-with-half-circle-fashion-bright-illustration-in-trendy-style-vector.jpg",
            },
            {
              name: "Carlos Ruiz",
              role: "Emprendedor",
              text: "Resultados precisos y confiables. Lo recomiendo totalmente.",
              img: "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg",
            },
          ].map((t, i) => (
            <motion.div key={i} className="testimonial-card" whileHover={{ scale: 1.02 }} transition={{ ...longTransition }}>
              <img src={t.img} alt={t.name} />
              <div>
                <p>"{t.text}"</p>
                <h4>{t.name}</h4>
                <span>{t.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...longTransition }}>
          Preguntas Frecuentes ❓
        </motion.h2>

        <div className="faq-list">
          {faqData.map((faq, index) => (
            <motion.div key={index} className="faq-item" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...longTransition, delay: index * 0.08 }}>
              <button onClick={() => setOpenFAQ(openFAQ === index ? null : index)}>
                <span>{faq.question}</span>
                <span>{openFAQ === index ? "−" : "+"}</span>
              </button>

              <AnimatePresence>
                {openFAQ === index && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ ...longTransition }}>
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 Impochina — Todos los derechos reservados</p>
      </footer>

      {/* SELECTED STEP MODAL (preserve original modal but animated) */}
      <AnimatePresence>
        {selectedStep && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ ...longTransition }} onClick={() => setSelectedStep(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ ...longTransition }} onClick={(e) => e.stopPropagation()}>
              <img src={selectedStep.img} alt={selectedStep.title} />
              <h3>{selectedStep.step}. {selectedStep.title}</h3>
              <p>{selectedStep.fullDesc}</p>
              <button onClick={() => setSelectedStep(null)}>Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM MODAL (animated) */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div className="confirm-overlay" variants={confirmVariant} initial="initial" animate="animate" exit="exit">
            <motion.div className="confirm-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ ...longTransition }}>
              <p>{showConfirm.message}</p>
              <div className="confirm-actions">
                <button className="btn-confirm" onClick={showConfirm.onConfirm}>Sí</button>
                <button className="btn-cancel" onClick={showConfirm.onCancel}>No</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
