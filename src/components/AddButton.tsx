import { PlusCircleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

export const AddButton = ({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) => {
  return (
    <button
      className={clsx(
        "flex h-[140px] w-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-grey-neutral shadow-md",
        disabled ? "bg-grey-neutral" : "bg-white"
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <PlusCircleIcon
        className={clsx(
          "h-[72px] w-[72px] text-green-secondary",
          disabled ? "text-grey-medium" : "text-green-secondary"
        )}
      />
      <p className="text-xl font-bold">{label}</p>
    </button>
  );
};
