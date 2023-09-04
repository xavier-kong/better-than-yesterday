import Head from "next/head";
import { useAuth, SignIn } from "@clerk/nextjs";
import { api } from "~/utils/api";
import Spinner from "../components/Spinner";

export default function Home() {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const { isLoaded, isSignedIn, userId } = useAuth();

  if (!isLoaded) {
    return <Spinner />;
  }

  if (!isSignedIn || !userId) {
    return (<div className="flex min-h-screen items-center justify-center"><SignIn /></div>)
  }

  const userItemsQuery = api.user.fetchUserData.useQuery();

  if (userItemsQuery.isLoading) {
    return <Spinner />;
  }

  const userItems = userItemsQuery.data?.items;


  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="">
      </main>
    </>
  );
}
