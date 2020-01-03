const backDrop: React.FunctionComponent = props => (
    <div className="backdrop">
        <style jsx>{`
            .backdrop {
                z-index: 100;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
            }
        `}</style>
    </div>
);

export default backDrop;