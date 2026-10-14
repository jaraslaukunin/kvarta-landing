import Image from "next/image";
import { site } from "@/lib/site";
import { RoastClock } from "./RoastClock";
import styles from "./Hero.module.css";

const facts = [
  { value: "250 г", label: "одна кварта" },
  { value: "5 кг", label: "партия обжарки" },
  { value: "1–3 дня", label: "от печи до вас" },
  { value: "пт", label: "доставка по Минску" },
];

export function Hero() {
  return (
    <section className={styles.hero} id="top">
      <div className="wrap">
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p className="eyebrow">
              Минск · Короля, 9 · обжариваем с {site.since} года
            </p>
            <h1 className={styles.title}>
              Обжариваем по четвергам.
              <br />
              Привозим по пятницам.
            </h1>
            <p className={styles.lede}>
              Одна печь, партии по 5 кг и никакого склада. Зерно попадает к вам на 1–3 день
              после обжарки — пока в нём ещё живёт то, за что вы его купили.
            </p>

            <div className={styles.actions}>
              <a className="btn" href="#lead">
                Оставить заявку
              </a>
              <a className={`btn btn--ghost`} href="#assortment">
                Смотреть ассортимент <span className="arrow" aria-hidden="true">→</span>
              </a>
            </div>

            <dl className={styles.facts}>
              {facts.map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={styles.visual}>
            <figure className={styles.photo}>
              <Image
                src="/images/hero-barista.jpg"
                alt="Бариста снимает рожок с эспрессо-машины в мастерской на Короля, 9"
                width={1400}
                height={2100}
                priority
                sizes="(max-width: 900px) 92vw, 44vw"
                className={styles.photoImg}
              />
              <figcaption className={styles.caption}>
                Дмитрий проверяет помол на утренней чашке
              </figcaption>
            </figure>

            <span className={styles.stamp} aria-hidden="true">
              <span className={styles.stampTop}>обжарено</span>
              <span className={styles.stampMid}>в четверг</span>
              <span className={styles.stampBottom}>5 кг · Минск</span>
            </span>

            <RoastClock />
          </div>
        </div>
      </div>
    </section>
  );
}
