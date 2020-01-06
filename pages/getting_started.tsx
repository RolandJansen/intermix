import { NextPage } from 'next';
import Markdown from "react-markdown";
import BaseLayout from '../components/BaseLayout';

interface Props {
    content: any;
}

const gettingStarted: NextPage<Props> = (props) => {
    return (
        <BaseLayout>
            <div>
                <Markdown source={props.content.default} />
            </div>
        </BaseLayout>
    )
}

gettingStarted.getInitialProps = async () => {
    const content = await require("../docs/Getting-Started.md");
    return { content };
}

export default gettingStarted;
