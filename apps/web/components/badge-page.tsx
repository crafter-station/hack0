import Link from "next/link";
import { BadgeBuilder } from "@/components/badge-builder";
import { Shell } from "@/components/shell";
import { SITE } from "@/lib/site";

type Props = {
  name: string;
  path: string;
  badgePath: string;
  hasNext?: boolean;
  crumb: { href: string; label: string };
  lede: string;
};

/** The page an org opens to get its badge: choose, copy, paste. */
export function BadgePage({ name, path, badgePath, hasNext = false, crumb, lede }: Props) {
  return (
    <Shell fit>
      <div className="bb-head">
        <p className="crumbs">
          <Link href={crumb.href}>{crumb.label}</Link> / <Link href={path}>{name}</Link>
        </p>
        <h1>Badge para tu web</h1>
        <p>{lede}</p>
      </div>
      <BadgeBuilder name={name} page={`${SITE}${path}`} badge={`${SITE}${badgePath}`} preview={badgePath} hasNext={hasNext} />
    </Shell>
  );
}
