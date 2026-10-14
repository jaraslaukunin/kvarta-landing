import { coffees, dripPacks, site } from "@/lib/site";
import styles from "./Assortment.module.css";

function RoastScale({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className={styles.scale} aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <i key={step} className={step <= level ? styles.scaleOn : undefined} />
      ))}
    </span>
  );
}

export function Assortment() {
  return (
    <section className="section" id="assortment">
      <div className="wrap head">
        <div>
          <span className="head__num">03 / ассортимент</span>
          <p className="eyebrow">Что в пачках</p>
        </div>

        <div>
          <h2 className="head__title">Три сорта, дрип-пакеты и подписка</h2>
          <p className="lede">
            Состав меняется раз в сезон, схема — нет: зелёное зерно, обжарка по четвергам, пачка
            250 г. Молем бесплатно, если скажете, чем завариваете.
          </p>

          <ul className={styles.list}>
            {coffees.map((coffee) => (
              <li key={coffee.id} className={styles.item} style={{ ["--accent" as string]: coffee.accent }}>
                <div className={styles.info}>
                  <h3 className={styles.name}>
                    {coffee.name}
                    {coffee.featured ? <span className={styles.flag}>новый урожай</span> : null}
                  </h3>
                  <p className={styles.notes}>{coffee.notes}</p>
                  <p className={styles.meta}>
                    {coffee.origin} · <RoastScale level={coffee.roast} /> {coffee.roastLabel} обжарка
                  </p>
                  <p className={styles.best}>Хорошо в: {coffee.best}</p>
                </div>
                <div className={styles.price}>
                  <b>{coffee.price}</b>
                  <span>BYN / {coffee.unit}</span>
                </div>
              </li>
            ))}

            <li className={styles.item} style={{ ["--accent" as string]: dripPacks.accent }}>
              <div className={styles.info}>
                <h3 className={styles.name}>{dripPacks.name}</h3>
                <p className={styles.notes}>{dripPacks.notes}</p>
                <p className={styles.meta}>{dripPacks.line}</p>
              </div>
              <div className={styles.price}>
                <b>{dripPacks.price}</b>
                <span>BYN / {dripPacks.unit}</span>
              </div>
            </li>
          </ul>

          <div className={styles.tail}>
            <p className={styles.tailText}>
              Подписка — 2 пачки по 250 г раз в месяц,{" "}
              <span className="mono">{site.subscriptionPrice} BYN</span>, доставка по Минску
              бесплатно.
            </p>
            <a className="link" href="#subscription">
              Как это работает <span className="arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
