import { GripVertical } from "lucide-react";
import * as React from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }) => (
  
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}) => (
  div]:rotate-90",
      className,
    )}
    {...props}
  >
    {withHandle && (
      
        
      
    )}
  
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
