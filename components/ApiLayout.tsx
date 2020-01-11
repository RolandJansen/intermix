import Link from "next/link";
import api from '../docs/api.json';

interface Props {
    elementId: string;
}

const apiLayout: React.FunctionComponent<Props> = ({
    elementId,
}) => (
    <div className="api-layout">
        <section className="sidebar">
            <div className="sidebar__header"></div>
            <div className="sidebar__main">
                <ul>
                    {
                        api.children.map((child: any) => (
                            <li key={child.id}>
                                <Link href="/api_docs/[id]" as={`/api_docs/${child.id}`}>
                                    <a>{child.name}</a>
                                </Link>
                            </li>
                        ))
                    }
                </ul>
            </div>
        </section>
        <section className="content">
            <div className="content__header"></div>
            <div className="content__main">
                {elementId}
                <p>This is the main content area. It should be displayed right to the sidebar</p>
            </div>
        </section>
        <style jsx>{`
            .api-layout {
                height: 100%;
                margin: 0;
                overflow: hidden; /* disable scrolling in base container */
                box-sizing: border-box;
                display: flex;
            }
            section {
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            .sidebar {

            }
            .sidebar ul {
                list-style: none;
                padding-left: 0;
            }
            .sidebar__header, .content__header {
                flex-shrink: 0;  /* don't cutoff content in a smaller browser window */
            }
            .content {
                width: 100%;
            }
            .sidebar__main, .content__main {
                overflow-y: auto;  /* add scroll to sub-containers */
            }
        `}</style>
    </div>
)

export default apiLayout;
