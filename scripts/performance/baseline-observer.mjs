// scripts/performance/baseline-observer.mjs - Inyecta observers de Web Vitals (LCP/CLS/INP) en la página bajo prueba.
export async function installWebVitalsObservers(page) {
  await page.addInitScript(() => {
    const state = { lcp: -1, cls: 0, inp: -1 };
    window.__AIGIOH_AUTOPERF__ = state;

    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1];
        if (last) state.lcp = last.startTime;
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      state.lcp = -1;
    }

    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
        state.cls = clsValue;
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      state.cls = -1;
    }

    try {
      const inpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > state.inp) state.inp = entry.duration;
        }
      });
      inpObserver.observe({ type: "event", buffered: true, durationThreshold: 16 });
    } catch {
      state.inp = -1;
    }
  });
}

export async function readWebVitals(page) {
  return page.evaluate(() => window.__AIGIOH_AUTOPERF__ ?? { lcp: -1, cls: -1, inp: -1 });
}
