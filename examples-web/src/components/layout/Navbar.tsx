import React from 'react';
import Link from 'next/link'
import Image from 'next/image'

export const Navbar = () => {
    return (
        <header className="navbar bg-base-100 shadow-sm">
          <Image width={128} height={32} src="/assets/axelar_logo.png" alt="axelar" />
          <nav className="menu menu-horizontal ml-4">
            <ul>
              <li>
                <Link href="/">
                  <a className='text-lg'>Examples</a>
                </Link>
              </li>
            </ul>
          </nav>
        </header>
    );
};
