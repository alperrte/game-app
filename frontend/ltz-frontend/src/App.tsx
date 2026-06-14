import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";

const App = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

export default App;