"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { readAttribution, type Attribution } from "@/lib/attribution";
import { INTEREST_EVENT, isInterest } from "@/lib/interest";
import {
  emptyDraft,
  LIMITS,
  validateLead,
  type LeadDraft,
  type LeadErrors,
  type Interest,
} from "@/lib/lead-validation";
import { formatByPhoneInput } from "@/lib/phone";
import { formatMinskDate, formatMinskWeekday, nextOrderRoast } from "@/lib/roast-schedule";
import { site } from "@/lib/site";
import styles from "./LeadForm.module.css";

const STORAGE_KEY = "kvarta:attribution:v1";

const INTEREST_OPTIONS: { value: Interest; label: string; hint: string }[] = [
  { value: "subscription", label: "Подписка", hint: "2 пачки по 250 г раз в месяц" },
  { value: "order", label: "Разовый заказ", hint: "одна-две пачки, самовывоз или курьер" },
  { value: "question", label: "Вопрос", hint: "помол, хранение, счёт для офиса" },
];

type Status = "idle" | "sending" | "created" | "duplicate" | "failed";

type Failure = { title: string; text: string };

export function LeadForm() {
  const [draft, setDraft] = useState<LeadDraft>(() => emptyDraft("order"));
  const [errors, setErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<Failure | null>(null);
  const [batch, setBatch] = useState<string | null>(null);

  const attribution = useRef<Attribution>({});
  const sending = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Метки рекламы читаем один раз за визит: человек может уйти на другую
  // страницу, а источник должен остаться тем же, с которого он пришёл.
  useEffect(() => {
    const url = new URL(window.location.href);
    let stored: Attribution | null = null;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) as Attribution;
    } catch {
      stored = null;
    }

    const collected =
      stored && Object.keys(stored).length > 0
        ? stored
        : readAttribution(url, document.referrer);

    attribution.current = collected;

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(collected));
    } catch {
      // приватный режим — просто не запоминаем
    }
  }, []);

  // Кнопки «Оформить подписку» и «Задать вопрос» выбирают нужный пункт формы.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!isInterest(detail)) return;
      setDraft((current) => ({ ...current, interest: detail }));
      window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 320);
    };

    window.addEventListener(INTEREST_EVENT, handler);
    return () => window.removeEventListener(INTEREST_EVENT, handler);
  }, []);

  const update = (field: keyof LeadDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field as keyof LeadErrors]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const onPhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    update("phone", formatByPhoneInput(event.target.value));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;

    const checked = validateLead(draft);
    if (!checked.ok) {
      setErrors(checked.errors);
      setStatus("idle");
      setFailure(null);
      const firstField = Object.keys(checked.errors)[0];
      const node = firstField
        ? formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`)
        : null;
      node?.focus();
      return;
    }

    sending.current = true;
    setStatus("sending");
    setErrors({});
    setFailure(null);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          attribution: attribution.current,
          page: window.location.pathname + window.location.search,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; status?: string; message?: string; errors?: LeadErrors }
        | null;

      if (response.ok && payload?.ok) {
        if (payload.status === "duplicate") {
          setStatus("duplicate");
        } else {
          const nextDate = nextOrderRoast(new Date());
          setBatch(`${formatMinskWeekday(nextDate)}, ${formatMinskDate(nextDate)}`);
          setStatus("created");
        }
        setDraft(emptyDraft(draft.interest));
        return;
      }

      if (response.status === 422 && payload?.errors) {
        setErrors(payload.errors);
        setStatus("idle");
        setFailure({
          title: "Проверьте поля",
          text: payload.message ?? "Что-то в данных не сходится.",
        });
        return;
      }

      setStatus("failed");
      setFailure({
        title: response.status === 429 ? "Слишком часто" : "Заявка не ушла",
        text:
          payload?.message ??
          "Сервер не ответил. Позвоните нам — примем заявку по телефону.",
      });
    } catch {
      setStatus("failed");
      setFailure({
        title: "Нет связи",
        text: `Похоже, пропал интернет. Попробуйте ещё раз или позвоните: ${site.phone}.`,
      });
    } finally {
      sending.current = false;
    }
  };

  const reset = () => {
    setStatus("idle");
    setFailure(null);
    setErrors({});
  };

  const showResult = status === "created" || status === "duplicate";

  return (
    <section className="section" id="lead">
      <div className="wrap head">
        <div>
          <span className="head__num">07 / заявка</span>
          <p className="eyebrow">Последний шаг</p>
        </div>

        <div className={styles.layout}>
          <div className={styles.intro}>
            <h2 className="head__title">Оставьте номер — перезвоним и всё уточним</h2>
            <p className="lede">
              Позвоним в рабочее время, подскажем по сортам и помолу, договоримся об адресе.
              Предоплату не берём: платите при получении.
            </p>

            <ul className={styles.promises}>
              <li>Считаем заявку сразу, даже если форма отправлена дважды подряд.</li>
              <li>Видим, из какой рекламы вы пришли — не придётся объяснять заново.</li>
              <li>Если что-то сломалось, рядом есть телефон и Telegram.</li>
            </ul>

            <div className={styles.contacts}>
              <p className={styles.contactsTitle}>Не любите формы?</p>
              <p>
                <a className="link" href={site.phoneHref}>
                  {site.phone}
                </a>
                {" · "}
                <a className="link" href={site.telegram} rel="noreferrer noopener" target="_blank">
                  Telegram
                </a>
              </p>
              <p className={styles.hours}>
                пн–пт 8:00–20:00, сб–вс 10:00–18:00 · {site.address}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            {showResult ? (
              <div className={styles.result} role="status" aria-live="polite">
                <p className={styles.resultMark} aria-hidden="true">
                  {status === "created" ? "✓" : "↺"}
                </p>
                <h3 className={styles.resultTitle}>
                  {status === "created" ? "Заявка принята" : "Такая заявка уже есть"}
                </h3>
                <p className={styles.resultText}>
                  {status === "created"
                    ? batch
                      ? `Вы в партии, которую обжариваем в ${batch}. Курьер приезжает в пятницу, точное время согласуем.`
                      : "Мы получили заявку и перезвоним в рабочее время."
                    : "Заявку с этим номером мы уже приняли — она в работе. Вторую создавать не нужно, менеджер всё видит."}
                </p>
                <ol className={styles.next}>
                  <li>Перезвоним в рабочее время и уточним сорт, помол и адрес.</li>
                  <li>Обжарим в четверг, в тот же день расфасуем.</li>
                  <li>Привезём в пятницу или отдадим на Короля, 9.</li>
                </ol>
                <button className="btn btn--ghost" type="button" onClick={reset}>
                  Отправить ещё одну заявку
                </button>
              </div>
            ) : (
              <form className={styles.form} ref={formRef} onSubmit={onSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="lead-name">
                    Как вас зовут
                  </label>
                  <input
                    ref={nameRef}
                    className={styles.input}
                    id="lead-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Аня"
                    maxLength={LIMITS.name}
                    value={draft.name}
                    onChange={(event) => update("name", event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "lead-name-error" : undefined}
                  />
                  {errors.name ? (
                    <p className={styles.error} id="lead-name-error">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="lead-phone">
                    Телефон
                  </label>
                  <input
                    className={styles.input}
                    id="lead-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+375 (29) 123-45-67"
                    value={draft.phone}
                    onChange={onPhoneChange}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "lead-phone-error" : "lead-phone-hint"}
                  />
                  {errors.phone ? (
                    <p className={styles.error} id="lead-phone-error">
                      {errors.phone}
                    </p>
                  ) : (
                    <p className={styles.hint} id="lead-phone-hint">
                      Белорусский номер: +375 и девять цифр. Нужен только для звонка.
                    </p>
                  )}
                </div>

                <fieldset className={styles.fieldset}>
                  <legend className={styles.label}>Что интересует</legend>
                  <div className={styles.options}>
                    {INTEREST_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`${styles.option} ${
                          draft.interest === option.value ? styles.optionOn : ""
                        }`}
                      >
                        <input
                          className={styles.radio}
                          type="radio"
                          name="interest"
                          value={option.value}
                          checked={draft.interest === option.value}
                          onChange={() => update("interest", option.value)}
                        />
                        <span className={styles.optionLabel}>{option.label}</span>
                        <span className={styles.optionHint}>{option.hint}</span>
                      </label>
                    ))}
                  </div>
                  {errors.interest ? <p className={styles.error}>{errors.interest}</p> : null}
                </fieldset>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="lead-comment">
                    Комментарий <span className={styles.optional}>— не обязательно</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="lead-comment"
                    name="comment"
                    rows={3}
                    maxLength={LIMITS.comment}
                    placeholder="Например: две пачки Колумбии, смолоть под воронку, привезти в пятницу после 18:00"
                    value={draft.comment}
                    onChange={(event) => update("comment", event.target.value)}
                    aria-invalid={Boolean(errors.comment)}
                  />
                  {errors.comment ? <p className={styles.error}>{errors.comment}</p> : null}
                </div>

                {/* ловушка для ботов: люди этого поля не видят */}
                <div className={styles.trap} aria-hidden="true">
                  <label htmlFor="lead-website">Сайт</label>
                  <input
                    id="lead-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={draft.website}
                    onChange={(event) => update("website", event.target.value)}
                  />
                </div>

                {failure ? (
                  <div className={styles.failure} role="alert">
                    <p className={styles.failureTitle}>{failure.title}</p>
                    <p className={styles.failureText}>{failure.text}</p>
                  </div>
                ) : null}

                <button className="btn btn--wide" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Отправляем…" : "Отправить заявку"}
                </button>

                <p className={styles.consent}>
                  Отправляя форму, вы соглашаетесь, что мы позвоним по этому номеру. Данные
                  используем только для заявки и не передаём третьим лицам.
                </p>

                <p className={styles.status} role="status" aria-live="polite">
                  {status === "sending" ? "Отправляем заявку…" : ""}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
