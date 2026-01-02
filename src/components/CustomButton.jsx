export const CustomButton = ({type="submit", label, onClick}) => {
    return (
        <button type={type}
                onClick={onClick}
                 className="btn btn-primary me-8 text-white">{label}
                 </button>
    )
}