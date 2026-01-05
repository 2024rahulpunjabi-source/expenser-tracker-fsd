import React from "react";

function CustomButton({label , type = "submit" , onClick , variant="primary" , className}) {
  return (
    <button type={type} className={`btn btn-${variant} me-8 text-white ${className}`} onClick={onClick}>
      {label}
    </button>
  );
}
      
export default CustomButton;
