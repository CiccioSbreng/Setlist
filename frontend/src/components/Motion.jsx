// frontend/src/components/Motion.jsx
// Wrapper riusabili per page transition e list stagger.

import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const CINEMA = [0.2, 0.9, 0.3, 1];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.32, ease: CINEMA } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{ minHeight: "60vh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const containerVariants = (delay) => ({
  visible: { transition: { staggerChildren: delay } },
});

const itemVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: CINEMA } },
};

export function Stagger({ children, delay = 0.045, as = "div", ...rest }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      initial="hidden"
      animate="visible"
      variants={containerVariants(delay)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, as = "div", ...rest }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag variants={itemVariants} {...rest}>
      {children}
    </Tag>
  );
}
