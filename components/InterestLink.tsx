"use client";

import type { ReactNode } from "react";
import { INTEREST_EVENT, type Interest } from "@/lib/interest";

type Props = {
  interest: Interest;
  className?: string;
  children: ReactNode;
};

/**
 * Обычная ссылка на форму, но перед переходом сообщает форме,
 * какой пункт выбрать. Без JS ссылка всё равно работает — просто без предвыбора.
 */
export function InterestLink({ interest, className, children }: Props) {
  return (
    <a
      className={className}
      href="#lead"
      onClick={() => {
        window.dispatchEvent(new CustomEvent<Interest>(INTEREST_EVENT, { detail: interest }));
      }}
    >
      {children}
    </a>
  );
}
