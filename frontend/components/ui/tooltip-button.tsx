import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button, ButtonProps, buttonVariants } from "./button";
import { cn } from "@/lib/utils";

const TooltipButton = ({
  className,
  variant,
  size,
  tooltip,
  children,
  ...props
}: ButtonProps & { tooltip: string; children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...props}
            className={cn(buttonVariants({ variant, size, className }))}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { TooltipButton };
