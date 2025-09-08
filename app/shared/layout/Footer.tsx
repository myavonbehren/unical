import { ThemeSwitcher } from "../theme/theme-switcher";

export default function Footer() {
  return (
    <footer className="w-full flex items-center justify-center border-t border-sidebar-border mx-auto text-center text-xs py-2">
      <p>
        Powered by UniCal
      </p>
      <ThemeSwitcher />
    </footer>
  );
}