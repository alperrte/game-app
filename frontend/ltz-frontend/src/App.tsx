import { useEffect, useState } from "react";

import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";
import { bootstrapAuth } from "./store/authStore";

const App = () => {
  /*
   * Route'lar render edilmeden önce token geçerliliği doğrulanır.
   * Süresi dolmuş oturum, son sayfa açılmadan temizlenir/yenilenir.
   */
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    bootstrapAuth().finally(() => {
      if (active) setIsReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

export default App;
