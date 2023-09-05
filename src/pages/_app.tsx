import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from '../components/theme-provider';

import { api } from "~/utils/api";

import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ClerkProvider {...pageProps}>
        <Component {...pageProps} />
      </ClerkProvider>
    </ThemeProvider>
  );
};

export default api.withTRPC(MyApp);
