"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { CUSTOMIZE_PLACEHOLDER, templateById } from "@/data/templates";

/**
 * "Customize <Template> Template" modal (verified): explanatory copy, "Write
 * your instruction" textarea with example placeholder, "Regenerate Summary".
 */
export function CustomizeTemplateModal({
  open,
  onClose,
  templateId,
  initial,
  onRegenerate,
}: {
  open: boolean;
  onClose: () => void;
  templateId: string;
  initial?: string;
  onRegenerate: (instruction: string) => void;
}) {
  // Remounted by the parent (keyed on template + open) so the draft resets per session.
  const [text, setText] = useState(initial ?? "");
  const t = templateById(templateId);

  return (
    <Modal open={open} onClose={onClose} title={`Customize ${t.name} Template`} width={640}>
      <p className="text-[17px] leading-7 text-white/75">
        Provide feedback to the AI on how you&apos;d like your summary to differ from the default output.
      </p>
      <label className="mt-8 block text-[17px] font-medium text-off-white">Write your instruction</label>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={CUSTOMIZE_PLACEHOLDER}
        rows={5}
        className="mt-3 text-[16px]"
        aria-label="Instruction"
      />
      <div className="mt-8 flex justify-end">
        <Button
          variant="cyan"
          size="lg"
          className="text-[17px] font-semibold"
          disabled={!text.trim()}
          onClick={() => {
            onRegenerate(text.trim());
            onClose();
          }}
        >
          Regenerate Summary
        </Button>
      </div>
    </Modal>
  );
}
