import { NextPage } from 'next';
import BaseLayout from '../components/BaseLayout';

const Home: NextPage = () => {
    return (
        <BaseLayout>
            <div>
                <h1>Hello</h1>
                <p>This is the intermix homepage on github. It is currently just a stub and will be extended in the next few days.</p>
            </div>
        </BaseLayout>
    )
}

export default Home;
