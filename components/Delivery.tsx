import { site } from "@/lib/site";
import { InterestLink } from "./InterestLink";
import styles from "./Delivery.module.css";

export function Delivery() {
  return (
    <section className="section" id="delivery">
      <div className="wrap head">
        <div>
          <span className="head__num">05 / доставка</span>
          <p className="eyebrow">Как забрать</p>
        </div>

        <div>
          <h2 className="head__title">Пятница — день развоза</h2>
          <p className="lede">
            Возим сами, поэтому знаем, где ваша пачка. Минск — курьером в пятницу, остальное —
            самовывоз с Короля, 9.
          </p>

          <div className={styles.grid}>
            <article className={styles.block}>
              <p className={styles.kicker}>Курьер по Минску</p>
              <p className={styles.big}>
                Бесплатно от {site.delivery.freeFrom} BYN,
                <br />
                ниже — {site.delivery.price} BYN
              </p>
              <ul className={styles.list}>
                <li>Пятница, окно 10:00–20:00</li>
                <li>Точное время согласуем в день доставки</li>
                <li>Можно оставить у консьержа, если предупредите</li>
              </ul>
            </article>

            <article className={styles.block}>
              <p className={styles.kicker}>Самовывоз</p>
              <p className={styles.big}>{site.address}</p>
              <ul className={styles.list}>
                {site.hours.map((row) => (
                  <li key={row.days} className={styles.hours}>
                    {row.days} — {row.time}
                  </li>
                ))}
                <li>{site.addressNote}</li>
              </ul>
              <p className={styles.hint}>
                Скажите номер заявки — соберём за пару минут. Можно заодно посмотреть на печь.
              </p>
            </article>

            <article className={styles.block}>
              <p className={styles.kicker}>Оплата</p>
              <p className={styles.big}>При получении</p>
              <ul className={styles.list}>
                <li>Курьеру: картой или наличными</li>
                <li>На месте: картой</li>
                <li>Офису: счёт и закрывающие от 5 пачек</li>
              </ul>
              <p className={styles.hint}>
                Предоплату не берём: сначала посмотрите на дату обжарки на наклейке.
              </p>
            </article>
          </div>

          <p className={styles.tail}>
            Не уверены, что выбрать?{" "}
            <InterestLink className="link" interest="question">
              Напишите вопрос
            </InterestLink>{" "}
            — ответим и подскажем по помолу.
          </p>
        </div>
      </div>
    </section>
  );
}
