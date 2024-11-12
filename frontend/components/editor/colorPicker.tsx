import React, { useState } from "react";
import { ChromePicker } from "react-color";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function ColorPicker({
    defaultColor,
}: {
    defaultColor: string;
}) {
    const [color, setColor] = useState<string>(defaultColor);

    const handleChange = (color: any) => {
        setColor(color.hex);
    };

    return (
        <>
            <Popover>
                <PopoverTrigger
                    className="w-12 h-6 rounded-md"
                    style={{ backgroundColor: color }}
                ></PopoverTrigger>
                <PopoverContent className="w-fit p-0">
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
