"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmailEditor from "@/components/EmailEditor";
import { toast } from "sonner";

export default function DraftEditorPage() {
    const router = useRouter();
    const params = useParams();
    const experienceId = params.experienceId as string;
    // Immediately redirect to the unified New Campaign page
    if (typeof window !== "undefined") {
        router.replace(`/experiences/${experienceId}/campaigns/new`);
    }
    return null;
}

