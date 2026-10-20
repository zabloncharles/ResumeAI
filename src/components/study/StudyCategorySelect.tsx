import {
  DEFAULT_STUDY_CATEGORY_ID,
  STUDY_CATEGORIES,
  STUDY_CATEGORY_GROUPS,
} from "../../constants/studyCategories";

type StudyCategorySelectProps = {
  value: string;
  onChange: (categoryId: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
};

const defaultClassName =
  "w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-zinc-100";

export default function StudyCategorySelect({
  value,
  onChange,
  id,
  className = defaultClassName,
  required,
}: StudyCategorySelectProps) {
  const selected = value || DEFAULT_STUDY_CATEGORY_ID;

  return (
    <select
      id={id}
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      required={required}
    >
      {STUDY_CATEGORY_GROUPS.map((group) => {
        const options = STUDY_CATEGORIES.filter((c) => c.groupId === group.id);
        if (options.length === 0) return null;
        return (
          <optgroup key={group.id} label={group.label}>
            {options.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
