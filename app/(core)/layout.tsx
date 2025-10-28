import { SideNavbar, MobileNavbar } from '../../components/navbar/navbar';
import Header from '../../components/header/header';

async function DashboardLayout({
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
