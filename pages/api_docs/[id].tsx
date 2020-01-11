import { useRouter } from "next/router";
import BaseLayout from "../../components/BaseLayout";
import ApiLayout from "../../components/ApiLayout";

const apiElement = () => {
    const router = useRouter();

    return (
        <BaseLayout>
            <ApiLayout elementId={router.query.id.toString()} />
        </BaseLayout>
    )
}

export default apiElement;