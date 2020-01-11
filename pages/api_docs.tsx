import { NextPage } from "next";
import BaseLayout from "../components/BaseLayout";
import ApiLayout from "../components/ApiLayout";

interface Props {
    content: any;
}

const api: NextPage<Props> = (props) => {
    return (
        <BaseLayout>
            <ApiLayout elementId="0"/>
        </BaseLayout>
    )
}

export default api;
