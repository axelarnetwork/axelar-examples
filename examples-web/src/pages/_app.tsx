import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Layout } from "../components/layout";
// import link component
import Link from "next/link";

function MyApp({ Component, pageProps, router }: AppProps) {
  // const isExample = router.pathname.startsWith("/examples");
  return (
    <Layout>
      {/* {isExample && <Link href="/"> */}
        {/* <a className="link">Go back</a> */}
        {/* </Link>} */}
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
