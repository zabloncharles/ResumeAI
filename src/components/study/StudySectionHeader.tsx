type StudySectionHeaderProps = {
  title: string;
  description: string;
  as?: "h1" | "h2" | "h3";
  size?: "default" | "large";
  className?: string;
};

export default function StudySectionHeader({
  title,
  description,
  as = "h2",
  size = "default",
  className = "",
}: StudySectionHeaderProps) {
  const TitleTag = as;
  const titleClass =
    as === "h1"
      ? "text-3xl font-bold text-gray-900 dark:text-zinc-100"
      : size === "large"
        ? "text-xl font-bold text-gray-900 dark:text-zinc-100"
        : "text-lg font-bold text-gray-900 dark:text-zinc-100";

  return (
    <div className={className}>
      <TitleTag className={titleClass}>{title}</TitleTag>
      <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">{description}</p>
    </div>
  );
}
