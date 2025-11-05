import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import * as Switch from "@radix-ui/react-switch";
import "../styles/Home.css";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { logout } = useAuth();
  const nav = useNavigate();

  const heroImages = [
    "https://mecaluxco.cdnwm.com/img/blog/logistica-internacional.1.14.jpg",
    "https://www.prosegur.es/dam/jcr:8fe16839-839d-463a-90a6-32ab4bbc8158/tipos%20transporte%20mercancias.jpg",
    "https://thumbs.dreamstime.com/b/imagen-relacionada-con-la-log%C3%ADstica-y-el-transporte-de-mercanc%C3%ADas-camiones-fondo-dise%C3%B1o-abstracto-trav%C3%A9s-ruta-mapa-del-mundo-228273332.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const buscar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 2000));
      alert("✅ Producto encontrado con éxito!");
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await logout?.();
    } finally {
      nav("/login");
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const stepsData = [
    {
      step: "1",
      title: "Pega el enlace",
      desc: "Copia el URL del producto de 1688 y pégalo en el campo de búsqueda.",
      img: "https://www.shutterstock.com/image-photo/social-network-connection-internet-technology-600nw-2048123093.jpg",
      fullDesc: "Pega el enlace del producto directamente desde 1688. Nuestro sistema lo analiza automáticamente para extraer toda la información relevante.",
    },
    {
      step: "2",
      title: "Buscamos por ti",
      desc: "Nuestro sistema analiza y encuentra el producto de manera rápida y precisa.",
      img: "https://img.freepik.com/fotos-premium/motor-busqueda-informacion-busqueda-internet-linea-mano-haciendo-clic-barra-busqueda-encontrar-informacion_571507-66.jpg",
      fullDesc: "Utilizamos algoritmos avanzados para buscar y verificar el producto en tiempo real.",
    },
    {
      step: "3",
      title: "Resultado instantáneo",
      desc: "Obtén detalles verificados y guarda en tu bodega personal.",
      img: "https://okhosting.com/wp-content/uploads/Tendencias-de-Busqueda-en-Internet-1.webp",
      fullDesc: "En segundos, recibirás un resumen completo del producto.",
    },
  ];

  const faqData = [
    {
      question: "¿Cómo funciona la búsqueda de productos?",
      answer: "Simplemente pega el enlace del producto de 1688 en el campo de búsqueda.",
    },
    {
      question: "¿Es seguro usar Impochina?",
      answer: "Sí, utilizamos tecnologías de encriptación y no almacenamos información sensible.",
    },
    {
      question: "¿Puedo guardar mis búsquedas?",
      answer: "Absolutamente. Una vez que encuentres un producto, puedes guardarlo en tu bodega personal.",
    },
  ];

  return (
    <div className={darkMode ? "dark-theme" : "light-theme"}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Navbar */}
        <motion.header
          className="navbar"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="brand">
            <span className="logo-dot" /> Impochina
          </div>
          <nav className="nav-actions">
            <div className="theme-toggle-container">
              <span className="theme-label">{darkMode ? "🌙" : "☀️"}</span>
              <Switch.Root
                className="switch-root"
                checked={darkMode}
                onCheckedChange={toggleTheme}
              >
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
            </div>
            <motion.a
              className="nav-link"
              href="/bodega"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Bodega
            </motion.a>
            <motion.button
              className="btn-outline"
              onClick={onLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cerrar sesión
            </motion.button>
          </nav>
        </motion.header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Encuentra tus productos de 1688 fácilmente
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Pega el enlace del producto y nosotros lo buscamos por ti.
              </motion.p>
              <motion.form
                onSubmit={buscar}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="search-box">
                  <input
                    type="url"
                    placeholder="Pega aquí el enlace del producto"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <span className="loading"></span>
                    ) : null}
                    {loading ? "Buscando..." : "Buscar Producto"}
                  </motion.button>
                </div>
              </motion.form>
            </div>

            <motion.div
              className="hero-image"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="carousel">
                <button className="carousel-btn left" onClick={prevImage}>‹</button>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    src={heroImages[activeImageIndex]}
                    alt="Productos 1688"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                  />
                </AnimatePresence>
                <button className="carousel-btn right" onClick={nextImage}>›</button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="steps-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Cómo funciona 🚀
          </motion.h2>
          <div className="steps-grid">
            {stepsData.map((step, index) => (
              <motion.div
                key={index}
                className="step-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                viewport={{ once: true }}
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

        {/* Features */}
        <section className="features-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Nuestras Ventajas ✨
          </motion.h2>
          <div className="features-grid">
            {[
              { text: "Búsqueda rápida ⚡", desc: "Encuentra lo que necesitas en segundos." },
              { text: "Resultados confiables ✅", desc: "Solo mostramos datos verificados." },
              { text: "Todo en un solo lugar 🌎", desc: "Centraliza tus productos fácilmente." },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                viewport={{ once: true }}
              >
                <h3>{feature.text}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonios */}
        <section className="testimonials-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
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
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                viewport={{ once: true }}
              >
                <img src={testimonial.img} alt={testimonial.name} />
                <div>
                  <p>"{testimonial.text}"</p>
                  <h4>{testimonial.name}</h4>
                  <span>{testimonial.role}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Preguntas Frecuentes ❓
          </motion.h2>
          <div className="faq-list">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <button onClick={() => setOpenFAQ(openFAQ === index ? null : index)}>
                  <span>{faq.question}</span>
                  <span>{openFAQ === index ? "−" : "+"}</span>
                </button>
                {openFAQ === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2025 Impochina — Todos los derechos reservados</p>
        </footer>

        {/* Modal */}
        <AnimatePresence>
          {selectedStep && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStep(null)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <img src={selectedStep.img} alt={selectedStep.title} />
                <h3>{selectedStep.step}. {selectedStep.title}</h3>
                <p>{selectedStep.fullDesc}</p>
                <button onClick={() => setSelectedStep(null)}>Cerrar</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}