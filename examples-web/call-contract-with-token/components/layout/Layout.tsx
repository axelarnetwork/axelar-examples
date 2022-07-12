import React, { ReactNode } from "react";
import { Navbar } from "./Navbar";

type LayoutProps = {
  children: ReactNode;
};

export const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <div className="h-auto min-h-screen">
      <Navbar />
      <main className="container px-4 py-20 mx-auto">{props.children}</main>
    </div>
  );
};
