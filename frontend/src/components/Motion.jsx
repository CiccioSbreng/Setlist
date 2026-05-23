// CSS-based replacements for page transitions and list stagger (no framer-motion)
import React, { useEffect, useRef, useContext, createContext } from "react";
import { useLocation } from "react-router-dom";

export function PageTransition({ children }) {
  const { pathname } = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("page-enter");
    void el.offsetHeight;
    el.classList.add("page-enter");
  }, [pathname]);

  return (
    <div ref={ref} className="page-enter" style={{ minHeight: "60vh" }}>
      {children}
    </div>
  );
}

const StaggerCtx = createContext(0);

export function Stagger({ children, as: Tag = "div", delay, ...rest }) {
  return (
    <Tag {...rest}>
      {React.Children.map(children, (child, i) =>
        child ? (
          <StaggerCtx.Provider key={i} value={i}>
            {child}
          </StaggerCtx.Provider>
        ) : child
      )}
    </Tag>
  );
}

export function StaggerItem({ children, as: Tag = "div", style, ...rest }) {
  const i = useContext(StaggerCtx);
  return (
    <Tag
      className="stagger-item"
      style={{ "--i": Math.min(i, 8), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
