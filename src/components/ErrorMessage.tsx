import { XCircleIcon } from "@heroicons/react/24/solid";

export const ErrorMessage = ({
  code,
  message,
}: {
  code: string;
  message: string;
}) => (
  <div className="flex w-fit items-center gap-x-4 rounded-xl border border-red-600 bg-red-100 px-3 py-3">
    <div className="h-fit w-fit rounded-full bg-red-500 p-2 shadow">
      <XCircleIcon className="text-white" />
    </div>
    <div>
      <p className="font-semibold lowercase">{code}</p>
      <p className="pr-12 text-red-500">{message}</p>
    </div>
  </div>
);
