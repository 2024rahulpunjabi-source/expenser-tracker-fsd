import logoLight from "../assets/images/logo/logo-white.png"
import NavItem from "./NavItem";

export const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="brand-logo"><a className="full-logo" href="index.html"><img src={logoLight} alt="" width="30"/></a></div>
            <div className="menu">
                <ul>
                    <NavItem title={"Home"} icon={"ri-home-5-line"} destination={"/"}/>
                    <NavItem title={"Transaction"} icon={"ri-wallet-3-line"} destination={"/transactions"} />
                </ul>
            </div>
        </div>
    );
}