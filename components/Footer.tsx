import Link from "next/link";
import { NavItem } from "./interfaces";

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
        <div className="footer__left-row">
            <Link href="/">
                <a>Home</a>
            </Link>
            {
                sections.map(section => (
                    <Link href={section.href}>
                        <a>{section.name}</a>
                    </Link>
                ))
            }
        </div>
        <div className="footer__center-row"></div>
        <div className="footer__right-row"></div>
        <p>Copyright (C) {year} Roland Jansen</p>
        <style jsx>{`
            .footer {
                background: #1e1e1e;
                color: white;
            }
        `}</style>
    </footer>
)

export default Footer;