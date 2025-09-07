import { ThemeSwitcher } from "../theme/theme-switcher";

export default function Footer() {
  return (
    <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
    <p>
      Powered by UniCal
      </p>
    <ThemeSwitcher />
  </footer>
  );
}