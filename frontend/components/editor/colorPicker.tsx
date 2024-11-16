import React, { useState } from "react";
import { ChromePicker } from "react-color";
import { useColorTheme } from "@/components/providers/color-context";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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

    const handleChange = (color: any) => {
        setColor(color.hex);
        updateColor(token, color.hex); // Update the correct theme (dark or light)
    };

    return (
        <>
            <Popover>
                <PopoverTrigger
                    className="w-12 h-6 rounded-md"
                    style={{ backgroundColor: color }}
                ></PopoverTrigger>
                <PopoverContent className="w-fit p-1" side="right">
                    <ChromePicker
                        color={color}
                        onChange={handleChange}
                        disableAlpha={true}
                    />
                </PopoverContent>
            </Popover>
        </>
    );
}
