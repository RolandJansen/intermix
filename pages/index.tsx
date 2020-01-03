import { NextPage } from 'next';
import Markdown from "react-markdown";
import BaseLayout from '../components/BaseLayout';
import { loadGetInitialProps } from 'next/dist/next-server/lib/utils';

interface Props {
    content: any;
}

const Home: NextPage<Props> = (props) => {
    return (
        <BaseLayout>
            <div>
                <h1>Hello</h1>
                <p>This is the intermix homepage on github. It is currently just a stub and will be extended in the next few days.</p>
                <Markdown source={props.content.default} />
            </div>
        </BaseLayout>
    )
}

Home.getInitialProps = async () => {
    const content = await require("../docs/README.md");
    return { content };
}

export default Home;
