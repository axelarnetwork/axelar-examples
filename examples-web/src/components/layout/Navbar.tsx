import React from 'react';

export const Navbar = () => {
    return (
        <header className="h-16 bg-white shadow-sm">
            <nav className="container flex items-center w-full h-full px-4 mx-auto">
                <div>
                    <img className="h-8" src="/assets/axelar_logo.png" alt="axelar" />
                </div>
            </nav>
        </header>
    );
};
