import React from "react";
import { Link } from "react-router-dom";

function NavItem({ destination, title, icon }) {
  return (
    <li>
      <Link to= {destination}>
        <span>
          <i className={`${icon} lead`}></i>
        </span>
        <span className="nav-text">{title}</span>
      </Link>
    </li>
  );
}

export default NavItem;
