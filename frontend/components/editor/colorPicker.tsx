import React from "react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function ColorPicker({ color }: { color: string }) {
    return (
        <>
            <Popover>
                <PopoverTrigger
                    className="w-12 h-6 rounded-md"
                    style={{ backgroundColor: color }}
                ></PopoverTrigger>
                <PopoverContent>
                    Place content for the popover here.
                </PopoverContent>
            </Popover>
        </>
    );
}
