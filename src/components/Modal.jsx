
const Modal = ({ isOpen, onClose, children, title, className }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className={`modal-wrapper ${className}`}>
                <div className={`card`}>
                    <div className="card-header">
                        <div className={"d-flex flex-grow-1 align-items-center justify-content-between"}>
                            <h4 className="card-title">{title}</h4>
                            <span className="close-button" onClick={onClose}>
                            <i className="ri-close-line text"></i>
                        </span>
                        </div>
                    </div>
                    <div className="card-body">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;