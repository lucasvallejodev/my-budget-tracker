import Header from '@/components/header';
import { SideNavbar, MobileNavbar } from '../../components/navbar';

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
