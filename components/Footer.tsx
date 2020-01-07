import Link from "next/link";
import { NavItem } from "./interfaces";
import { link } from "fs";

interface Props {
    title: string;
    sections: NavItem[];
    year: string;
}

const Footer: React.FunctionComponent<Props> = ({
    title,
    sections,
    year,
}) => (
    <footer className="footer">
        <section className="footer-main">
            <div className="footer-main-item">
                <h2 className="footer-main-item__title">docs</h2>
                <ul>
                    <li>
                        <Link href="/">
                            <a>Home</a>
                        </Link>
                    </li>
                    {
                        sections.map(section => (
                            <li key={section.href}>
                                <Link href={section.href}>
                                    <a>{section.name}</a>
                                </Link>
                            </li>
                        ))
                    }
                </ul>
            </div>
            <div className="footer-main-item">
                <h2 className="footer-main-item__title">dev</h2>
                <ul>
                    <li><a href="https://github.com/RolandJansen/intermix.js/">Intermix on Github</a></li>
                    <li><a href="https://github.com/RolandJansen/intermix.js/issues">Tickets</a></li>
                    <li><a href="https://github.com/RolandJansen/intermix.js/wiki">Wiki</a></li>
                </ul>
            </div>
        </section>
        <section className="footer-legal">
            <p>&copy; {year} Roland Jansen</p>
        </section>
        <style jsx>{`
            .footer {
                display: flex;
                flex-flow: column wrap;
                /*justify-content: center;*/
                /*align-items: center;*/

                /*background: #1e1e1e;*/
                background-color: #555;
                color: #bbb;
                line-height: 1.5;
                padding: 0 1.25rem;
            }
            ul {
                list-style: none;
                padding: 0;
            }
            a {
                text-decoration: none;
                color: #eee;
            }
            a:hover {
                text-decoration: underline;
            }
            .footer-main {
                /*padding: 1.25rem 1.875rem;*/
                display: flex;
                flex-wrap: wrap;
            }
            .footer-main-item {
                padding: 1.25rem;
                min-width: 12.5rem /*200px*/;
            }
            /*.footer-links {
                width: 100%;
                display: flex;
                justify-content: center;
                align-content: space-between;
            }*/
            /*.footer-link-list {
                list-style: none;
                /* display: block; */
                /*flex-flow: column wrap;*/
                /*justify-content: center;*/
            /*}*/
            .footer-main-item__title {
                color: #fff;
                font-family: 'Merriweather', serif;
                font-size: 1.375rem;
                padding-bottom: 0.625rem;
            }
            .footer-legal {
                display: flex;
                justify-content: center;
                border-top: 1px #777 solid;
                /*padding-top: 1.25rem;*/
                /*padding: 0 1.5rem;*/
            }
            @media only screen and (min-width: 477px) {
                .footer-main {
                    justify-content: space-around;
                }
            }
            @media only screen and (min-width: 1240px) {
                .footer-main {
                    justify-content: space-evenly;
                }
            }
        `}</style>
    </footer>
)

export default Footer;