import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

function SectionSkeleton({ minHeight }) {
  return (
    <div
      className="animate-pulse rounded-2xl border border-base-200 bg-base-100 p-5"
      style={{ minHeight }}
      aria-hidden="true"
    >
      <div className="h-6 w-48 rounded bg-base-200" />

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-52 rounded-2xl bg-base-200"
          />
        ))}
      </div>
    </div>
  );
}

export default function ViewportSection({
  children,
  minHeight = 320,
  rootMargin = "700px 0px",
  ariaLabel,
}) {
  const containerRef = useRef(null);
  const [shouldRender, setShouldRender] =
    useState(false);

  useEffect(() => {
    if (shouldRender) {
      return undefined;
    }

    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    // Safe fallback for older browsers.
    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, shouldRender]);

  return (
    <section
      ref={containerRef}
      aria-label={ariaLabel}
      style={{
        minHeight: shouldRender
          ? undefined
          : minHeight,
      }}
    >
      {shouldRender ? (
        <Suspense
          fallback={
            <SectionSkeleton minHeight={minHeight} />
          }
        >
          {children}
        </Suspense>
      ) : (
        <SectionSkeleton minHeight={minHeight} />
      )}
    </section>
  );
}