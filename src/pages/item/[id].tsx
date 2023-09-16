'use client'

import { useAuth, SignIn } from "@clerk/nextjs";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import Spinner from '~/components/Spinner';
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

export default function ItemPage() {
    const router = useRouter();
    const { isLoaded, isSignedIn, userId } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const deleteItemMutation = api.item.deleteItem.useMutation();
    const fetchItemQuery = api.item.fetchItemDetails.useQuery({
        itemId: parseInt(router?.query?.id?.[0] ?? '-1'),
    });

    const goBackHome = async() => {
        await router.replace('/');
    }

    if (!router?.query?.id?.[0]) {
        return <div>404 Not Found Or something</div>;
    }

    if (deleteItemMutation.isSuccess) {
        //setLoading(false);
        void goBackHome();
    }

    if (!isLoaded || loading || fetchItemQuery.isLoading) {
        return <Spinner />;
    }

    if (!isSignedIn || !userId) {
        return (<div className="flex min-h-screen items-center justify-center"><SignIn /></div>)
    }

    if (fetchItemQuery.isError) {
        return <div>sth sth sth error</div>;
    }

    const itemData = fetchItemQuery.data;

    if (!itemData) {
        void goBackHome();
    }

    return ( 
        <div>
            <Button 
                type="submit" 
                onClick={() => {
                    if (router?.query?.id?.[0]) {
                        setLoading(true)
                        deleteItemMutation.mutate({
                            itemId: parseInt(router.query.id[0]!),
                            userId
                })
                }
                }}
            >
                DELETE
            </Button>
            {JSON.stringify(itemData)}
        </div>
    )
}
