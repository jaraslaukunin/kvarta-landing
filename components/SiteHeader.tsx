import Link from "next/link";
import { nav, site } from "@/lib/site";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <a className="sr-only" href="#lead">
        Перейти к форме заявки
      </a>
      <div className={`wrap ${styles.inner}`}>
        <Link className={styles.brand} href="#top" aria-label="Кварта — на главную">
          <span className={styles.mark} aria-hidden="true">
            ¼
          </span>
          <span className={styles.name}>Кварта</span>
          <span className={styles.sub}>
            обжарка
            <br />
            Минск
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Разделы страницы">
          {nav.map((item) => (
            <a key={item.href} className={styles.link} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.aside}>
          <a className={styles.phone} href={site.phoneHref}>
            {site.phone}
          </a>
          <a className="btn" href="#lead">
            Оставить заявку
          </a>
        </div>
      </div>
    </header>
  );
}
