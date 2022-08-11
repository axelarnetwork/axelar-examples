import React from 'react';
import logo from "../../assets/axelar_logo.png";

export const Navbar = () => {
    return (
        <header className="h-16 bg-white shadow-sm">
            <nav className="container flex items-center w-full h-full px-4 mx-auto">
                <div>
                    <img className="h-8" src={logo.src} alt="axelar" />
                </div>
            </nav>
        </header>
    );
};
