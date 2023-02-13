import React, { ReactNode } from "react";
import { Navbar } from "./Navbar";

type LayoutProps = {
  children: ReactNode;
};

export const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <div className="h-auto min-h-screen bg-base-200">
      <Navbar />
      <main className="container px-2 pt-10 mx-auto">{props.children}</main>
    </div>
  );
};
