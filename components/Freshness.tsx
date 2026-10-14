import Image from "next/image";
import styles from "./Freshness.module.css";

const timeline = [
  {
    time: "ЧТ, 8:00",
    title: "Обжарка",
    text: "Партия 5 кг: 9–13 минут, в зависимости от сорта и влажности зерна.",
  },
  {
    time: "ЧТ, 16:00",
    title: "Фасовка",
    text: "В тот же день, в пакет с клапаном и наклейкой с датой обжарки.",
  },
  {
    time: "ПТ, 10:00–20:00",
    title: "Доставка",
    text: "Курьер по Минску или самовывоз с Короля, 9.",
  },
  {
    time: "1–3 день",
    title: "Ваша чашка",
    text: "Пик аромата. Дальше тоже вкусно, но уже спокойнее.",
  },
];

export function Freshness() {
  return (
    <section className="section" id="freshness">
      <div className="wrap head">
        <div>
          <span className="head__num">02 / свежесть</span>
          <p className="eyebrow">Зачем четверг</p>
        </div>

        <div>
          <h2 className="head__title">Кофе портится не в пачке, а на складе</h2>
          <p className="lede">
            Свежеобжаренное зерно отдаёт углекислый газ — вместе с ним уходит и аромат. Первую
            неделю кофе дышит и заваривается охотно, к третьей — ещё ровный, но уже скучный.
            Поэтому у нас нет склада: обжарили в четверг, увезли в пятницу.
          </p>

          <ol className={styles.timeline}>
            {timeline.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNum}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.stepTime}>{step.time}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </li>
            ))}
          </ol>

          <figure className={styles.band}>
            <Image
              src="/images/freshness-beans.jpg"
              alt="Обжаренные зёрна кофе крупным планом через час после обжарки"
              width={1600}
              height={1067}
              sizes="(max-width: 900px) 92vw, 100vw"
              className={styles.bandImg}
            />
            <figcaption>
              Так выглядит зерно через час после печи: масло ещё не выступило, но аромат уже
              никуда не спрятать
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
