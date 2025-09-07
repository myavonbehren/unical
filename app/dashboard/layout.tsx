import SideNav from '@/app/shared/layout/dashboard/SideNav';
import Header from '../shared/layout/Header';
import Footer from '../shared/layout/Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12 bg-background">{children}</div>
    </div>
    <Footer />

    </>
  );
}