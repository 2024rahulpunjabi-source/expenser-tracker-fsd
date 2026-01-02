export const CustomInput = ({label, type, name, register, error}) => {
    return (
        <div className="col-12 mb-3">
            <label className="form-label">{label}</label>
            <input name={name} {...register(name)} type={type} className="form-control" />
            {
                error && <p className={"text-danger"}>{error.message}</p>
            }
        </div>
    )
}