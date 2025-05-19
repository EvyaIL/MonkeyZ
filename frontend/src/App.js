import AppRouter from "./AppRouter";
import GlobalProvider from "./context/GlobalProvider";


const App = () => {
    return (
      <GlobalProvider>
        <div className=" w-full h-[100vh] bg-primary">
          <AppRouter />
        </div>
      </GlobalProvider>
    );
};

export default App;
