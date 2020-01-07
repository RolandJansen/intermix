import { NextPage } from 'next';
import Markdown from "react-markdown";
import BaseLayout from '../components/BaseLayout';

interface Props {
    content: any;
}

const Home: NextPage<Props> = (props) => {
    return (
        <BaseLayout>
            <p><b>This page is under construction! New content/style will be added regularly...</b></p>
            <div>
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
