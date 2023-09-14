import { useAuth, SignIn } from "@clerk/nextjs";
import { useRouter } from 'next/router';
import { useEffect } from "react";
import Spinner from '~/components/Spinner';
import { api } from "~/utils/api";

export default function ItemPage() {
    const router = useRouter();
    const { isLoaded, isSignedIn, userId } = useAuth();

    if (!isLoaded) {
        return <Spinner />;
    }

    if (!isSignedIn || !userId) {
        return (<div className="flex min-h-screen items-center justify-center"><SignIn /></div>)
    }

    if (!router?.query?.id?.[0]) {
        return <div>404 Not Found Or something</div>;
    }

    const fetchItemQuery = api.item.fetchItemDetails.useQuery({
        itemId: parseInt(router.query.id[0]),
        userId: userId
    });

    if (fetchItemQuery.isLoading) {
        return <Spinner />;
    }

    if (fetchItemQuery.isError) {
        return <div>sth sth sth error</div>;
    }

    const itemData = fetchItemQuery.data;

    if (itemData.itemType === 'time') {

    } else if (itemData.itemType === 'amount') {

    } else if (itemData.itemType === 'duration') {

    } else if (itemData.itemType === 'consistency') {
        
    }

    return ( 
        <div>
            {router.query.id.length}
        </div>
    )
}
