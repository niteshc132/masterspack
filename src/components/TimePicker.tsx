import { PopoverContent } from "@radix-ui/react-popover";
import { Separator } from "@radix-ui/react-select";
import React, { useState } from "react";
import { ScrollArea } from "./ui/scrollarea";

interface TimePickerProps {
  initialTime: Date;
  onTimeChange: (newTime: Date) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({
  initialTime,
  onTimeChange,
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(
    initialTime.getHours() % 12 || 12
  );
  const [selectedMinute, setSelectedMinute] = useState<number>(
    initialTime.getMinutes()
  );
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(
    initialTime.getHours() >= 12 ? "PM" : "AM"
  );

  const handleHourClick = (hour: number): void => setSelectedHour(hour);
  const handleMinuteClick = (minute: number): void => setSelectedMinute(minute);
  const handlePeriodClick = (period: "AM" | "PM"): void =>
    setSelectedPeriod(period);

  const handleSubmit = (): void => {
    const newDate = new Date();
    let hours = selectedHour;

    if (selectedPeriod === "PM" && selectedHour !== 12) {
      hours += 12;
    }

    if (selectedPeriod === "AM" && selectedHour === 12) {
      hours = 0;
    }

    newDate.setHours(hours, selectedMinute);
    onTimeChange(newDate);
  };

  return (
    <PopoverContent className="w-[312px] rounded-lg border-2 bg-white">
      <div className="flex px-3 py-2">
        <ScrollArea className="h-72 w-20  border-r-2">
          <div className="p-4">
            {[...Array(12).keys()].map((i) => (
              <React.Fragment key={i}>
                <div
                  className={`text-2xl ${
                    selectedHour === i + 1 ? "bg-blue-200" : ""
                  }`}
                  onClick={() => handleHourClick(i + 1)}
                >
                  {i > 10 ?? 0}
                  {i + 1}
                </div>
                <Separator className="my-2" />
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
        <ScrollArea className="h-72 w-20">
          <div className="p-4">
            {[...Array(60).keys()].map((i) => (
              <React.Fragment key={i}>
                <div
                  className={`text-2xl ${
                    selectedMinute === i ? "bg-blue-200" : ""
                  }`}
                  onClick={() => handleMinuteClick(i)}
                >
                  {String(i).padStart(2, "0")}
                </div>
                <Separator className="my-2" />
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
        <div className="flex flex-col">
          <button
            className={`btn-primary bg-none text-base text-black ${
              selectedPeriod === "AM" ? "bg-blue-200" : ""
            }`}
            onClick={() => handlePeriodClick("AM")}
          >
            AM
          </button>
          <button
            className={`btn-primary bg-none text-base text-black ${
              selectedPeriod === "PM" ? "bg-blue-200" : ""
            }`}
            onClick={() => handlePeriodClick("PM")}
          >
            PM
          </button>
        </div>
      </div>
      <div className="flex justify-between border-t-2 px-3 py-4 text-xl">
        <div>Set to current time</div>
        <button className="btn-primary" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </PopoverContent>
  );
};

export default TimePicker;
