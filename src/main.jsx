import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import App from "./App";

const theme = extendTheme({
  fonts: {
    heading: '"Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif',
    body: '"Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif'
  },
  colors: {
    brand: {
      50: "#ecf9ff",
      100: "#d3f0ff",
      200: "#afe3ff",
      300: "#85d4fa",
      400: "#5ec5f4",
      500: "#30afe0",
      600: "#1788b3"
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
