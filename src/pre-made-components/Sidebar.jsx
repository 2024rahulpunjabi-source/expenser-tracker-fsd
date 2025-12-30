import logoLight from "../assets/images/logo/logo-white.png"

export const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="brand-logo"><a className="full-logo" href="index.html"><img src={logoLight} alt="" width="30"/></a></div>
            <div className="menu">
                <ul>
                    <li>
                        <a href="">
                            <span>
                               <i className="ri-home-5-line lead"></i>
                            </span>
                            <span className="nav-text">Home</span>
                        </a>  
                    </li>
                </ul>
            </div>
        </div>
    );
}