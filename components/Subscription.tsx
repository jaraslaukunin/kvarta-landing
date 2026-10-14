import { howItWorks, site } from "@/lib/site";
import { InterestLink } from "./InterestLink";
import styles from "./Subscription.module.css";

const included = [
  { title: "Две пачки по 250 г", text: "Свежая обжарка того месяца, доставка включена в цену." },
  { title: "Сорто́в — на ваш вкус", text: "Меняем каждый месяц или держим один и тот же сорт." },
  { title: "Пауза и отмена", text: "Одним сообщением в Telegram, без звонков и уговоров." },
  { title: "Дата обжарки", text: "На наклейке: обжарено в четверг, у вас — в пятницу." },
];

export function Subscription() {
  return (
    <section className="section" id="subscription">
      <div className="wrap head">
        <div>
          <span className="head__num">04 / подписка</span>
          <p className="eyebrow">Регулярно</p>
        </div>

        <div>
          <h2 className="head__title">
            {site.subscriptionPrice} BYN в месяц: две пачки по 250 г
          </h2>
          <p className="lede">
            Подписка — это наш обычный четверг, только записанный заранее. Раз в месяц обжариваем
            две пачки, в пятницу привозим. Пропустить месяц или сменить сорт — одно сообщение.
          </p>

          <div className={styles.cols}>
            <div>
              <ul className={styles.included}>
                {included.map((item) => (
                  <li key={item.title} className={styles.include}>
                    <h3 className={styles.includeTitle}>{item.title}</h3>
                    <p className={styles.includeText}>{item.text}</p>
                  </li>
                ))}
              </ul>

              <ol className={styles.steps}>
                {howItWorks.map((step) => (
                  <li key={step.step} className={styles.step}>
                    <span className={styles.stepNum}>{step.step}</span>
                    <div>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                      <p className={styles.stepText}>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <aside className={styles.card}>
              <p className={styles.cardLabel}>Подписка «Кварта»</p>
              <p className={styles.cardPrice}>
                <b>{site.subscriptionPrice}</b> <span>BYN / месяц</span>
              </p>
              <ul className={styles.cardList}>
                <li>2 × 250 г свежей обжарки</li>
                <li>доставка по Минску — 0 BYN</li>
                <li>сорт можно менять каждый месяц</li>
                <li>первый месяц без предоплаты</li>
              </ul>
              <InterestLink className="btn btn--wide" interest="subscription">
                Оформить подписку
              </InterestLink>
              <p className={styles.cardNote}>
                Не зайдёт — скажите, отменим без разговоров. Оплата при получении.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
