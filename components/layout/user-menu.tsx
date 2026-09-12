"use client";

import { useRouter } from "next/navigation";
import { Download, HelpCircle, Image as ImageIcon, LogOut, PlaySquare, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { CURRENT_USER_ID, userById } from "@/data/users";

/**
 * Avatar menu (verified from help-center screenshot): Start Test Call, Tutorial,
 * FAQs, Quick Reference Guide | Privacy Policy, Terms of Service, Security &
 * Compliance, System Status | Download App, Logout.
 */
export function UserMenu() {
  const me = userById(CURRENT_USER_ID);
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Dropdown>
      <DropdownTrigger>
        <span className="flex items-center rounded-full outline-none ring-offset-2 ring-offset-app-topbar focus-visible:ring-2 focus-visible:ring-fathom" aria-label="Account menu">
          <Avatar user={me} size="md" className="size-[30px]" />
        </span>
      </DropdownTrigger>
      <DropdownContent align="end" width={264} className="p-2">
        <DropdownItem icon={<Video />} onSelect={() => toast("Test call scheduled — the notetaker will join in a moment", "info")}>
          Start Test Call
        </DropdownItem>
        <DropdownItem icon={<PlaySquare />} onSelect={() => toast("Tutorial opens in a new window", "info")}>Tutorial</DropdownItem>
        <DropdownItem icon={<HelpCircle />} onSelect={() => window.open("https://help.fathom.video/", "_blank")}>FAQs</DropdownItem>
        <DropdownItem icon={<ImageIcon />} onSelect={() => toast("Quick Reference Guide opens in a new window", "info")}>
          Quick Reference Guide
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem className="pl-[38px] text-white/80" onSelect={() => router.push("/privacy")}>Privacy Policy</DropdownItem>
        <DropdownItem className="pl-[38px] text-white/80" onSelect={() => router.push("/terms")}>Terms of Service</DropdownItem>
        <DropdownItem className="pl-[38px] text-white/80" onSelect={() => window.open("https://trust.fathom.video/", "_blank")}>
          Security & Compliance
        </DropdownItem>
        <DropdownItem className="pl-[38px] text-white/80" onSelect={() => window.open("https://status.fathom.video/", "_blank")}>
          System Status
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem icon={<Download />} onSelect={() => toast("Download started: Fathom Desktop App", "info")}>Download App</DropdownItem>
        <DropdownItem icon={<LogOut />} onSelect={() => router.push("/users/sign_in")}>Logout</DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
