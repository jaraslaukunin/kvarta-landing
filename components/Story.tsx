import Image from "next/image";
import { asset } from "@/lib/asset";
import styles from "./Story.module.css";

const details = [
  { label: "Партия", value: "5 кг за раз" },
  { label: "Обжарка", value: "четверг, с 8:00" },
  { label: "Фасовка", value: "в день обжарки" },
  { label: "Развоз", value: "пятница, по Минску" },
];

export function Story() {
  return (
    <section className="section" id="story">
      <div className="wrap head">
        <div>
          <span className="head__num">01 / мастерская</span>
          <p className="eyebrow">Кто обжаривает</p>
        </div>

        <div>
          <h2 className="head__title">Аня и Дмитрий пришли из-за бара и остались у печи</h2>

          <div className={styles.cols}>
            <div className={styles.text}>
              <p>
                До 2019 года мы стояли за баром и видели одно и то же: кофе приезжает красивым,
                месяц лежит на складе и приходит к человеку уже уставшим. Тогда мы решили
                обжаривать ровно столько, сколько успеваем увезти за неделю.
              </p>
              <p>
                Так появилась мастерская на Короля, 9: печь на 5 кг, два стола для фасовки и
                четверг, который мы целиком проводим у печи. Аня ведёт обжарку и записывает
                каждую партию в тетрадь, Дмитрий в пятницу садится за руль.
              </p>

              <blockquote className={styles.quote}>
                <p>
                  Партию, которая не получилась, мы не продаём. Сварим, расстроимся и обжарим
                  заново — это дешевле, чем объяснять, почему кофе невкусный.
                </p>
                <cite>Аня, обжарщица</cite>
              </blockquote>

              <dl className={styles.details}>
                {details.map((row) => (
                  <div key={row.label} className={styles.detail}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={`${styles.shots} rise`}>
              <figure className={styles.shotSmall}>
                <Image
                  src={asset("/images/workshop.jpg")}
                  alt="Барабанная печь для обжарки на 5 кг в мастерской на Короля, 9"
                  width={1080}
                  height={984}
                  quality={60}
                  sizes="(max-width: 900px) 60vw, 20vw"
                  className={styles.img}
                />
                <figcaption>Печь на 5 кг. Четверг — её день</figcaption>
              </figure>

              <figure className={styles.shotWide}>
                <Image
                  src={asset("/images/founders.jpg")}
                  alt="Аня и Дмитрий заваривают кофе перед развозом"
                  width={1600}
                  height={1066}
                  quality={60}
                  sizes="(max-width: 900px) 92vw, 32vw"
                  className={styles.img}
                />
                <figcaption>Утро перед развозом: проверяем партию на вкус</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
