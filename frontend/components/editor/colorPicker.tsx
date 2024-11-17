import React, { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useColorTheme } from "@/components/providers/color-context";
import "@/styles/color.css";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "../ui/input";

export default function ColorPicker({
  token,
  defaultColor,
}: {
  token: string;
  defaultColor: string;
}) {
  const colorTheme = useColorTheme();
  const updateColor = colorTheme ? colorTheme.updateColor : () => {};
  const [color, setColor] = useState(defaultColor);

  useEffect(() => {
    setColor(defaultColor);
  }, [defaultColor]);

  const handleChange = (color: string) => {
    setColor(color);
    updateColor(token, color);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger
          className="w-12 h-6 rounded-md"
          style={{ backgroundColor: color }}
        ></PopoverTrigger>
        <PopoverContent className="w-fit p-2" side="right">
          <div className="color-picker">
            <HexColorPicker color={color} onChange={handleChange} />
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm">HEX</div>
            <Input
              type="text"
              placeholder="#123ABC"
              className="w-24 font-mono"
              value={color}
              onChange={(e) => handleChange(e.target.value)}
            />
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
