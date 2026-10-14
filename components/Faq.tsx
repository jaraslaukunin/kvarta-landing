import { faq } from "@/lib/site";
import styles from "./Faq.module.css";

export function Faq() {
  return (
    <section className="section" id="faq">
      <div className="wrap head">
        <div>
          <span className="head__num">06 / вопросы</span>
          <p className="eyebrow">Частые вопросы</p>
        </div>

        <div>
          <h2 className="head__title">Коротко о том, что спрашивают в личке</h2>

          <div className={styles.list}>
            {faq.map((item) => (
              <details key={item.q} className={styles.item}>
                <summary className={styles.summary}>
                  <span>{item.q}</span>
                  <span className={styles.sign} aria-hidden="true" />
                </summary>
                <p className={styles.answer}>{item.a}</p>
              </details>
            ))}
          </div>

          <p className={styles.tail}>
            Не нашли свой вопрос — напишите в форме ниже или в Telegram, ответим вручную.
          </p>
        </div>
      </div>
    </section>
  );
}
