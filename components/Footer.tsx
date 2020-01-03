interface Props {
    year: string;
}

const Footer: React.FunctionComponent<Props> = ({
    year,
}) => (
    <footer className="footer">
        <span>Copyright (C) {year} Roland Jansen</span>
        <style jsx>{`
            .footer {
                background: #1e1e1e;
            }
        `}</style>
    </footer>
)

export default Footer;