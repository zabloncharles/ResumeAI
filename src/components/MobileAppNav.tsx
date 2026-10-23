import {
  AcademicCapIcon,
  DocumentIcon,
  EnvelopeIcon,
  HomeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";

const items = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Resume", href: "/resume", icon: DocumentIcon },
  { label: "Letters", href: "/cover-letter", icon: EnvelopeIcon },
  { label: "Study", href: "/study", icon: AcademicCapIcon },
  { label: "Account", href: "/account", icon: UserCircleIcon },
];

const hiddenPrefixes = [
  "/services",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/jobs",
];

export default function MobileAppNav() {
  const location = useLocation();

  if (hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav
      aria-label="App navigation"
      className="mobile-app-nav md:hidden"
    >
      {items.map(({ label, href, icon: Icon }) => {
        const active =
          href === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(href);

        return (
          <Link
            key={href}
            to={href}
            className={`mobile-app-nav-item ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
