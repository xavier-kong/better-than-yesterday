import { useRouter } from 'next/router';

export default function ItemPage() {
    const router = useRouter();
    console.log(router.query.id)
    return  <div>{router.query.id}</div>
}
