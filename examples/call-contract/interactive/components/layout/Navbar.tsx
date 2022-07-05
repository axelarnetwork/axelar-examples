import React from "react";

export const Navbar = () => {
  return (
    <header className="h-16 bg-white shadow-sm">
      <nav className="container flex items-center w-full h-full px-4 mx-auto">
        <div>
          <img
            className="h-8"
            src="https://axelar.network/wp-content/uploads/2022/02/Axelar-Logo-Dark.svg"
            alt="axelar"
          />
        </div>
        <div className="ml-auto">
          <ul className="p-0 menu menu-horizontal">
            <li>
              <a>Send Message</a>
            </li>
            <li>
              <a>Token Transfer</a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};
