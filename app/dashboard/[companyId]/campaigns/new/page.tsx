"use client";
import { use } from "react";
import { CampaignComposerProvider } from "@/components/campaigns/new/CampaignComposerProvider";
import TopStepperBar from "@/components/campaigns/new/TopStepperBar";
import ComposeStep from "@/components/campaigns/new/steps/ComposeStep";
import AudienceStep from "@/components/campaigns/new/steps/AudienceStep";
import SettingsStep from "@/components/campaigns/new/steps/SettingsStep";
import AutomationStep from "@/components/campaigns/new/steps/AutomationStep";
import ReviewStep from "@/components/campaigns/new/steps/ReviewStep";
import PreviewModal from "@/components/campaigns/new/modals/PreviewModal";
import TemplatePicker from "@/components/campaigns/new/modals/TemplatePicker";
import TemplatePreviewModal from "@/components/campaigns/new/modals/TemplatePreviewModal";
import SaveTemplateDialog from "@/components/campaigns/new/modals/SaveTemplateDialog";
import AIPromptDialogWrapper from "@/components/campaigns/new/modals/AIPromptDialogWrapper";
import StartSourceModal from "@/components/campaigns/new/modals/StartSourceModal";
import DraftsModal from "@/components/campaigns/new/modals/DraftsModal";

export default function NewCampaignPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = use(params);
	return (
		<CampaignComposerProvider companyId={companyId}>
			{/* Negative margins to counter parent padding and create edge-to-edge layout */}
			{/* The key is using absolute positioning for the container to escape flex constraints */}
			<div className="absolute inset-0 flex flex-col">
				<TopStepperBar />
				<ComposeStep />
				<AudienceStep />
				<SettingsStep />
				<AutomationStep />
				<ReviewStep />
				<PreviewModal />
				<TemplatePicker />
				<TemplatePreviewModal />
				<SaveTemplateDialog />
				<AIPromptDialogWrapper />
				<StartSourceModal />
				<DraftsModal />
			</div>
		</CampaignComposerProvider>
	);
}
