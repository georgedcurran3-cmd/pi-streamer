import type { ReactNode } from "react";

export function Row({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-baseline justify-between px-8 lg:px-14">
        <h2 className="text-lg font-semibold tracking-tight lg:text-xl">{title}</h2>
        {action}
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-8 pb-4 pt-1 lg:px-14">
        {children}
      </div>
    </section>
  );
}
