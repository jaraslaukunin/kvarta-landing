import { site } from "@/lib/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.top}>
          <div className={styles.brand}>
            <p className={styles.name}>Кварта</p>
            <p className={styles.tagline}>
              Обжарка кофе, Минск.
              <br />
              Печь на 5 кг, партии по четвергам.
            </p>
          </div>

          <div className={styles.col}>
            <p className={styles.colTitle}>Мастерская</p>
            <p>{site.address}</p>
            <p className="muted">{site.addressNote}</p>
            {site.hours.map((row) => (
              <p key={row.days} className={styles.hours}>
                {row.days} — {row.time}
              </p>
            ))}
          </div>

          <div className={styles.col}>
            <p className={styles.colTitle}>Связь</p>
            <p>
              <a className="link" href={site.phoneHref}>
                {site.phone}
              </a>
            </p>
            <p>
              <a className="link" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </p>
            <p>
              <a className="link" href={site.telegram} rel="noreferrer noopener" target="_blank">
                Telegram
              </a>{" "}
              ·{" "}
              <a className="link" href={site.instagram} rel="noreferrer noopener" target="_blank">
                Instagram
              </a>
            </p>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            Обжарка «Кварта» — вымышленный клиент из тестового задания, совпадения с реальными
            мастерскими случайны. Страница собрана статически, без обращения к базе при загрузке.
          </p>
          <p className={styles.credits}>
            Фото: Burst by Shopify (бесплатная лицензия) и Wikimedia Commons (CC0) — авторы
            перечислены в CREDITS.md. Иконка, OG-картинка и вёрстка — свои.
          </p>
        </div>
      </div>
    </footer>
  );
}
