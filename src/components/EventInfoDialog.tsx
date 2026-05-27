"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Calendar,
  ExternalLink,
  MapPin,
  PartyPopper,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResponsiveModalContent } from "@/components/ui/responsive-modal";
import { formatJst } from "@/lib/datetime";
import { renderRichDescription } from "@/lib/linkify";

export type EventInfo =
  | {
      type: "busy";
      summary: string;
      start: string;
      end: string;
      allDay: boolean;
      description: string | null;
      location: string | null;
      meetUrl: string | null;
    }
  | {
      type: "holiday";
      name: string;
      start: string;
      end: string;
    };

type Props = {
  info: EventInfo | null;
  onClose: () => void;
};

export function EventInfoDialog({ info, onClose }: Props) {
  if (!info) return null;

  const dateKey = formatJst(info.start, "yyyy-MM-dd");
  const dateLabel = format(
    new Date(`${dateKey}T00:00:00+09:00`),
    "yyyy 年 M 月 d 日 (E)",
    { locale: ja },
  );

  const isAllDay =
    info.type === "holiday" || (info.type === "busy" && info.allDay);
  const timeText = isAllDay
    ? "終日"
    : `${formatJst(info.start, "HH:mm")} 〜 ${formatJst(info.end, "HH:mm")}`;

  const title = info.type === "busy" ? info.summary : info.name;
  const Icon = info.type === "busy" ? Calendar : PartyPopper;
  const subtitle =
    info.type === "busy" ? "Google Calendar の予定" : "祝日";

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <ResponsiveModalContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{title}</span>
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">日時</p>
            <p className="font-medium">{dateLabel}</p>
            <p className="text-muted-foreground">{timeText}</p>
          </div>

          {info.type === "busy" && info.meetUrl && (
            <a
              href={info.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 transition-colors hover:bg-accent/40"
            >
              <Video className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="flex-1 truncate font-medium text-primary underline-offset-2 hover:underline">
                Google Meet で参加
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
            </a>
          )}

          {info.type === "busy" && info.location && !info.meetUrl && (
            <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="break-all">{info.location}</p>
            </div>
          )}

          {info.type === "busy" && info.description && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">説明</p>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-xs">
                {renderRichDescription(info.description)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </ResponsiveModalContent>
    </Dialog>
  );
}
