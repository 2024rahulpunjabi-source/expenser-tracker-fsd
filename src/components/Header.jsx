
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/logo/logoi.png"
import { api } from "../config/axios";
import { LONG_LIVE_TOKEN } from "../constant/constants";
import { deleteCookie, errorHandler } from "../utils/utils";
import CustomButton from "./CustomButton";

export const Header = () => {
  const navigate = useNavigate();
  const logoutUser = async () => {
    console.log("hello")
    
    try {
      const response = await api({
        method: "PUT",
        url : "/logout"
      })
      console.log(response)
      if (response.status === 200) {
        //navigate
        navigate("/login");
        //deletecookie
        deleteCookie(LONG_LIVE_TOKEN);
      }
    } catch (err) {
      errorHandler(err)
    }
  }
  return (
      <div className="row">
        <div className="col-md-12">
          <div className="header-content mt-3">
            <div className="header-left">
              <div className="brand-logo">
                  <img src={logo} alt="" width="40"/>
              </div>
              <div className={"flex-row items-center"}>
                <h3 className={"mb-0"}>Expense Tracker</h3>
              </div>
            </div>
            <div className={"header-right"}>
              <CustomButton label={"Logout"} type={"button"} onClick={logoutUser} variant={"secondary"} className={"me-2"} />
              <div>
                <div className="d-flex align-items-center justify-content-center"
                >
                  <div  className={" c-pointer"}>
                    <div className="icon-menu active flex justify-content-center align-items-center">
                      <i className="ri-user-3-line lead"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
