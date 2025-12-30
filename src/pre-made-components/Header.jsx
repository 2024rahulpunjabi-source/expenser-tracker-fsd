
import logo from "../../../assets/images/logo/logoi.png"

export const Header = () => {
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
