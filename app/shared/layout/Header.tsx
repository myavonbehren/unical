import Link from 'next/link';

export default function Header() {
  return (
    <nav className="w-full flex border-b border-border h-12 bg-background">
      <div className="w-full max-w-5xl flex justify-between items-center px-5 text-sm">
        <div className="flex items-center font-semibold">
          <Link href={"/"}>UniCal</Link>
        </div>
        <div className="flex items-center gap-2">
          <p>Username</p>
        </div>
      </div>
    </nav>
  );
}