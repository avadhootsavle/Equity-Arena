import React from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Reveals its children the first time they scroll into view.
 *
 * `once` keeps it a one-shot entrance — re-animating every time a section
 * scrolls past would fight the live price updates for attention.
 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  duration = 0.55,
  className = '',
  style,
  as = 'div'
}) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      // Fires slightly before the section is fully on screen
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Thin bar across the top showing how far down the page you are.
 */
export function ScrollProgressBar() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001
  });

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-50 pointer-events-none"
      style={{
        scaleX,
        background:
          'linear-gradient(90deg, var(--accent), var(--cat-6), var(--cat-1))'
      }}
    />
  );
}

/**
 * Jump back to the top once the page has been scrolled a screen or so.
 */
export function BackToTopButton({ threshold = 700 }) {
  const [visible, setVisible] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const toTop = () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

  return (
    <motion.button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      title="Back to top"
      initial={false}
      animate={
        visible
          ? { opacity: 1, scale: 1, pointerEvents: 'auto' }
          : { opacity: 0, scale: 0.8, pointerEvents: 'none' }
      }
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="fixed bottom-20 lg:bottom-6 right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center border theme-border"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--accent)',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      <ArrowUp className="w-4 h-4" />
    </motion.button>
  );
}
