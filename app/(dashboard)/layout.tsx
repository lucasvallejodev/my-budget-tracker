import { SideNavbar, MobileNavbar } from './_components/navbar';
import Header from './_components/header';

function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <MobileNavbar />
      <div className="fixed md:w-56 hidden md:block ">
        <SideNavbar />
      </div>
      <div className="md:ml-56">
        <Header />
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
