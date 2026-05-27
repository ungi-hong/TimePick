"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * モバイル: 画面全面のシート (上から下までフル表示)
 * md 以上: 中央寄せの popup (max-w-md, 角丸)
 */
function ResponsiveModalContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-black/30 duration-150 supports-backdrop-filter:backdrop-blur-xs",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
          "md:bg-black/10",
        )}
      />
      <DialogPrimitive.Popup
        data-slot="responsive-modal-content"
        className={cn(
          // 共通
          "fixed z-50 flex flex-col overflow-y-auto bg-popover text-sm text-popover-foreground outline-none duration-200 ease-in-out",
          // モバイル: 全画面
          "inset-0 gap-3 p-4",
          "data-starting-style:translate-y-4 data-ending-style:translate-y-4",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
          // md+: 中央 popup
          "md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[calc(100vh-4rem)] md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:gap-4 md:rounded-xl md:p-4 md:ring-1 md:ring-foreground/10",
          "md:data-starting-style:translate-y-0 md:data-ending-style:translate-y-0",
          "md:data-open:animate-in md:data-open:fade-in-0 md:data-open:zoom-in-95 md:data-closed:animate-out md:data-closed:fade-out-0 md:data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="responsive-modal-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export { ResponsiveModalContent };
