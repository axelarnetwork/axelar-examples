import React from 'react';
import Link from 'next/link'
export const Navbar = () => {
    return (
        <header className="navbar bg-base-100 shadow-sm">
          <div className='flex-1 ml-8'>
              <img src="/assets/axelar_logo.png" alt="axelar" />
          </div>
          <nav className="menu menu-horizontal container flex items-center w-full h-full px-4 mx-auto">
            <ul>
              <li>
                <Link href="/">
                  <a>Examples</a>
                </Link>
              </li>
            </ul>
          </nav>
        </header>
    );
};
