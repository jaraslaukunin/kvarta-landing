"use client";

import { useEffect, useState } from "react";
import {
  formatMinskDate,
  formatMinskWeekday,
  roastEvent,
  splitCountdown,
} from "@/lib/roast-schedule";
import styles from "./RoastClock.module.css";

type View = {
  title: string;
  note: string;
  dateLabel: string;
  batchLabel: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function RoastClock() {
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const event = roastEvent(now);
      const left = splitCountdown(event.target.getTime() - now.getTime());
      setView({
        title: event.title,
        note: event.note,
        dateLabel: `${formatMinskWeekday(event.nextRoast)}, ${formatMinskDate(event.nextRoast)}`,
        batchLabel: formatMinskDate(event.lastRoast),
        ...left,
      });
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <aside className={styles.clock} aria-label="Расписание обжарки">
      <div className={styles.left}>
        <p className={styles.kicker}>{view ? view.title : "Расписание обжарки"}</p>
        <p className={styles.date}>{view ? view.dateLabel : "четверг, 8:00 по Минску"}</p>
        <p className={styles.note}>
          {view
            ? view.note
            : "Обжариваем раз в неделю, поэтому важна каждая заявка до среды."}
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.countdown} role="timer" aria-live="off">
          <span className={styles.cell}>
            <b>{view ? view.days : "—"}</b>
            <i>дн</i>
          </span>
          <span className={styles.colon}>:</span>
          <span className={styles.cell}>
            <b>{view ? pad(view.hours) : "—"}</b>
            <i>ч</i>
          </span>
          <span className={styles.colon}>:</span>
          <span className={styles.cell}>
            <b>{view ? pad(view.minutes) : "—"}</b>
            <i>мин</i>
          </span>
          <span className={styles.colon}>:</span>
          <span className={styles.cell}>
            <b>{view ? pad(view.seconds) : "—"}</b>
            <i>сек</i>
          </span>
        </div>
        <p className={styles.batch}>
          {view ? `Сейчас в пачках партия от ${view.batchLabel}` : "Дата обжарки — на этикетке"}
        </p>
      </div>
    </aside>
  );
}
