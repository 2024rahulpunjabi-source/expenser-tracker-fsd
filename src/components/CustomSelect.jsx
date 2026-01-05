import React from 'react'

function CustomSelect({label , error, register , name , placeholder,options}) {
    console.log(error);
    
  return (
     <div className="col-12 mb-3">
        <label className="form-label">{label}</label>
        <select name={name} {...register(name)} className='form-select'>
            <option value={""}>{placeholder}</option>
            {
                options && options.map(option => (
                    <option value={option.value}>{option.label}</option>
                ))
            }
        </select>
        {error && <p className="text-danger fs-7">{error.message}</p>}
      </div>
  )
}

export default CustomSelect
