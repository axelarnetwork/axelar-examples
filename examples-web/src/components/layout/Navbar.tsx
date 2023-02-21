import React from 'react';
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from 'components/ThemeToggle';

export const Navbar = () => {
    const [logo, setLogo] = React.useState('/assets/axelar_logo.svg');
    return (
        <header className="navbar bg-base-200 shadow-sm px-16">
          <Image width={128} height={32} src={logo} alt="axelar" />
          <nav className="menu menu-horizontal ml-4 flex-1">
            <ul>
              <li>
                <Link href="/">
                  <a className='text-lg'>Examples</a>
                </Link>
              </li>
            </ul>
          </nav>
          <ThemeToggle onThemeChange={(theme: string) => {
            if (theme === 'business') {
              setLogo('/assets/axelar_logo_white.svg');
            } else {
              setLogo('/assets/axelar_logo.svg');
            }
          }} />
        </header>
    );
};
